import { safePublicImageUrl, safePublicWebsiteUrl } from "../../lib/safe-public-url";
import type { CommerceCart, CommerceCartConflict, CommerceCartValidation, CommerceErrorCode, CommerceHandoff, CommerceSellerGroup } from "../../types/shida-commerce";

const DEFAULT_API_BASE_URL = "https://api.nihiloba.com";
const REQUEST_TIMEOUT_MS = 8_000;

export class CommerceApiError extends Error {
  constructor(public readonly code: CommerceErrorCode, public readonly status = 500, public readonly conflicts: CommerceCartConflict[] = []) {
    super(`SHIDA commerce API ${code}`);
    this.name = "CommerceApiError";
  }
}

function apiBaseUrl(): string {
  const configured = process.env.SHIDA_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error();
    return url.origin;
  } catch {
    throw new CommerceApiError("api_unavailable", 503);
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CommerceApiError("malformed_response", 502);
  return value as Record<string, unknown>;
}

function text(value: unknown, required = false): string | null {
  if (typeof value === "string" && (!required || value.trim())) return value;
  if (!required && value == null) return null;
  throw new CommerceApiError("malformed_response", 502);
}

function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) throw new CommerceApiError("malformed_response", 502);
  return value;
}

function conflict(value: unknown): CommerceCartConflict {
  const item = record(value);
  const current = item.current_value;
  if (current != null && typeof current !== "string" && typeof current !== "number") throw new CommerceApiError("malformed_response", 502);
  return { code: text(item.code, true)!, item_reference: text(item.item_reference), current_value: current ?? null };
}

function parseCart(value: unknown): CommerceCart {
  const item = record(value);
  if (item.status !== "active" && item.status !== "checkout_started") throw new CommerceApiError("cart_not_found", 404);
  if (!Array.isArray(item.seller_groups)) throw new CommerceApiError("malformed_response", 502);
  const groups: CommerceSellerGroup[] = item.seller_groups.map((rawGroup) => {
    const group = record(rawGroup);
    if (!Array.isArray(group.items)) throw new CommerceApiError("malformed_response", 502);
    const method = group.fulfillment_method;
    if (method != null && method !== "pickup" && method !== "delivery") throw new CommerceApiError("malformed_response", 502);
    return {
      store_reference: text(group.store_reference, true)!, store_name: text(group.store_name, true)!, subtotal: text(group.subtotal, true)!, currency: text(group.currency),
      fulfillment_method: method ?? null, delivery_fee: text(group.delivery_fee), delivery_fee_status: text(group.delivery_fee_status),
      items: group.items.map((rawItem) => {
        const line = record(rawItem);
        return {
          reference: text(line.reference, true)!, product_reference: text(line.product_reference, true)!, name: text(line.name, true)!, variant: text(line.variant),
          quantity: integer(line.quantity), unit_price: text(line.unit_price, true)!, line_total: text(line.line_total, true)!, currency: text(line.currency, true)!, image: null, product_url: null,
        };
      }),
    };
  });
  return {
    reference: text(item.reference, true)!, status: item.status, currency: text(item.currency), version: integer(item.version), item_count: integer(item.item_count), seller_count: integer(item.seller_count),
    product_subtotal: text(item.product_subtotal, true)!, delivery_total: text(item.delivery_total), grand_total: text(item.grand_total), seller_groups: groups, expires_at: text(item.expires_at, true)!,
  };
}

async function backendRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      cache: "no-store",
      headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new CommerceApiError("api_unavailable", 503);
  }
  let payload: unknown = null;
  try { payload = await response.json(); } catch { if (response.ok) throw new CommerceApiError("malformed_response", 502); }
  if (!response.ok) {
    const body = payload && typeof payload === "object" && !Array.isArray(payload) ? payload as Record<string, unknown> : {};
    const detail = body.detail && typeof body.detail === "object" && !Array.isArray(body.detail) ? body.detail as Record<string, unknown> : {};
    const rawConflicts = Array.isArray(detail.conflicts) ? detail.conflicts.map(conflict) : [];
    const backendCode = typeof detail.code === "string" ? detail.code : response.status === 404 ? "cart_not_found" : response.status === 403 ? "forbidden" : response.status === 422 ? "validation_error" : "api_unavailable";
    throw new CommerceApiError(backendCode, response.status, rawConflicts);
  }
  return payload;
}

async function enrichCart(cart: CommerceCart): Promise<CommerceCart> {
  const unique = [...new Set(cart.seller_groups.flatMap((group) => group.items.map((item) => item.product_reference)))];
  const presentation = new Map<string, { image: { url: string; alt: string | null } | null; product_url: string | null }>();
  await Promise.all(unique.map(async (reference) => {
    try {
      const product = record(await backendRequest(`/api/public/shida/wenze/products/${encodeURIComponent(reference)}`));
      const images = Array.isArray(product.images) ? product.images : [];
      const first = images[0] && typeof images[0] === "object" && !Array.isArray(images[0]) ? images[0] as Record<string, unknown> : null;
      const url = safePublicImageUrl(text(first?.url));
      presentation.set(reference, { image: url ? { url, alt: text(first?.alt) } : null, product_url: safePublicWebsiteUrl(text(product.public_detail_url)) });
    } catch { presentation.set(reference, { image: null, product_url: null }); }
  }));
  return { ...cart, seller_groups: cart.seller_groups.map((group) => ({ ...group, items: group.items.map((item) => ({ ...item, ...(presentation.get(item.product_reference) ?? { image: null, product_url: null }) })) })) };
}

function cartFromEnvelope(value: unknown): CommerceCart {
  return parseCart(record(value).cart);
}

export async function createCommerceCart(): Promise<{ token: string; cart: CommerceCart }> {
  const value = record(await backendRequest("/api/v1/carts", { method: "POST", body: "{}" }));
  return { token: text(value.cart_token, true)!, cart: await enrichCart(parseCart(value.cart)) };
}

export async function getCommerceCart(token: string): Promise<CommerceCart> {
  return enrichCart(cartFromEnvelope(await backendRequest(`/api/v1/carts/${encodeURIComponent(token)}`)));
}

export async function addCommerceCartItem(token: string, productReference: string, variantReference: string | null, quantity: number, expectedVersion?: number): Promise<CommerceCart> {
  const body = { product_reference: productReference, variant_reference: variantReference, quantity, ...(expectedVersion ? { expected_version: expectedVersion } : {}) };
  return enrichCart(cartFromEnvelope(await backendRequest(`/api/v1/carts/${encodeURIComponent(token)}/items`, { method: "POST", body: JSON.stringify(body) })));
}

export async function updateCommerceCartItem(token: string, itemReference: string, quantity: number, expectedVersion?: number): Promise<CommerceCart> {
  return enrichCart(cartFromEnvelope(await backendRequest(`/api/v1/carts/${encodeURIComponent(token)}/items/${encodeURIComponent(itemReference)}`, { method: "PATCH", body: JSON.stringify({ quantity, ...(expectedVersion ? { expected_version: expectedVersion } : {}) }) })));
}

export async function removeCommerceCartItem(token: string, itemReference: string, expectedVersion?: number): Promise<CommerceCart> {
  const query = expectedVersion ? `?expected_version=${expectedVersion}` : "";
  return enrichCart(cartFromEnvelope(await backendRequest(`/api/v1/carts/${encodeURIComponent(token)}/items/${encodeURIComponent(itemReference)}${query}`, { method: "DELETE" })));
}

export async function clearCommerceCart(token: string, expectedVersion?: number): Promise<CommerceCart> {
  const query = expectedVersion ? `?expected_version=${expectedVersion}` : "";
  return enrichCart(cartFromEnvelope(await backendRequest(`/api/v1/carts/${encodeURIComponent(token)}/items${query}`, { method: "DELETE" })));
}

export async function validateCommerceCart(token: string): Promise<CommerceCartValidation> {
  const value = record(await backendRequest(`/api/v1/carts/${encodeURIComponent(token)}/validate`, { method: "POST" }));
  if (typeof value.valid !== "boolean" || !Array.isArray(value.conflicts)) throw new CommerceApiError("malformed_response", 502);
  return { valid: value.valid, cart: await enrichCart(parseCart(value.cart)), conflicts: value.conflicts.map(conflict) };
}

export async function acceptCommercePriceChanges(token: string): Promise<CommerceCart> {
  return enrichCart(cartFromEnvelope(await backendRequest(`/api/v1/carts/${encodeURIComponent(token)}/accept-price-changes`, { method: "POST" })));
}

export async function createCommerceHandoff(token: string): Promise<CommerceHandoff> {
  const value = record(await backendRequest(`/api/v1/carts/${encodeURIComponent(token)}/handoff`, { method: "POST" }));
  const whatsapp = text(value.whatsapp_url, true)!;
  const url = new URL(whatsapp);
  if (url.protocol !== "https:" || url.hostname !== "wa.me" || url.username || url.password) throw new CommerceApiError("malformed_response", 502);
  return { handoff_reference: text(value.handoff_reference, true)!, expires_at: text(value.expires_at, true)!, whatsapp_url: url.toString() };
}
