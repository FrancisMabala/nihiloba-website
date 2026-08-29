import type { CommerceCart, CommerceCartValidation, CommerceErrorPayload, CommerceHandoff } from "../../types/shida-commerce";

export class CartClientError extends Error {
  constructor(public readonly code: string, public readonly conflicts: CommerceErrorPayload["error"]["conflicts"] = []) {
    super(`Cart request failed: ${code}`);
    this.name = "CartClientError";
  }
}

async function cartRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, cache: "no-store", credentials: "same-origin", headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers } });
  } catch { throw new CartClientError("api_unavailable"); }
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new CartClientError("api_unavailable"); }
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload ? (payload as CommerceErrorPayload).error : null;
    throw new CartClientError(error?.code ?? "api_unavailable", error?.conflicts ?? []);
  }
  return payload as T;
}

export async function restoreCart(): Promise<CommerceCart | null> { return (await cartRequest<{ cart: CommerceCart | null }>("/api/shida/cart/")).cart; }
export async function addCartItem(productReference: string, variantReference: string | null, expectedVersion?: number): Promise<CommerceCart> { return (await cartRequest<{ cart: CommerceCart }>("/api/shida/cart/items/", { method: "POST", body: JSON.stringify({ product_reference: productReference, variant_reference: variantReference, quantity: 1, expected_version: expectedVersion }) })).cart; }
export async function setCartItemQuantity(itemReference: string, quantity: number, expectedVersion?: number): Promise<CommerceCart> { return (await cartRequest<{ cart: CommerceCart }>(`/api/shida/cart/items/${encodeURIComponent(itemReference)}/`, { method: "PATCH", body: JSON.stringify({ quantity, expected_version: expectedVersion }) })).cart; }
export async function deleteCartItem(itemReference: string, expectedVersion?: number): Promise<CommerceCart> { return (await cartRequest<{ cart: CommerceCart }>(`/api/shida/cart/items/${encodeURIComponent(itemReference)}/?version=${expectedVersion ?? ""}`, { method: "DELETE" })).cart; }
export async function deleteAllCartItems(expectedVersion?: number): Promise<CommerceCart | null> { return (await cartRequest<{ cart: CommerceCart | null }>(`/api/shida/cart/?version=${expectedVersion ?? ""}`, { method: "DELETE" })).cart; }
export async function validateCart(): Promise<CommerceCartValidation> { return cartRequest<CommerceCartValidation>("/api/shida/cart/validate/", { method: "POST" }); }
export async function acceptCartPriceChanges(): Promise<CommerceCart> { return (await cartRequest<{ cart: CommerceCart }>("/api/shida/cart/accept-price-changes/", { method: "POST" })).cart; }
export async function createCartHandoff(): Promise<CommerceHandoff> { return cartRequest<CommerceHandoff>("/api/shida/cart/handoff/", { method: "POST" }); }
