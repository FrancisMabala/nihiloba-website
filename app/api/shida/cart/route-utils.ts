import { cookies } from "next/headers";
import { CommerceApiError } from "../../../services/shida/commerce-client";

const CART_COOKIE = "nihiloba_shida_cart";
const REFERENCE = /^[A-Za-z0-9_-]{4,80}$/;
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache" };

export async function cartToken(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

export async function setCartToken(token: string): Promise<void> {
  (await cookies()).set(CART_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/shida/cart",
    maxAge: 60 * 60 * 24 * 30,
    priority: "high",
  });
}

export async function clearCartToken(): Promise<void> {
  (await cookies()).set(CART_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/shida/cart", maxAge: 0 });
}

export function privateJson(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: PRIVATE_HEADERS });
}

export function assertSameOrigin(request: Request): Response | null {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return privateJson({ error: { code: "forbidden" } }, 403);
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    if (new URL(origin).origin !== new URL(request.url).origin) return privateJson({ error: { code: "forbidden" } }, 403);
  } catch { return privateJson({ error: { code: "forbidden" } }, 403); }
  return null;
}

export function validReference(value: unknown): value is string {
  return typeof value === "string" && REFERENCE.test(value);
}

export async function requestObject(request: Request): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 4096) return null;
  try {
    const value: unknown = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

export function commerceError(error: unknown): Response {
  if (error instanceof CommerceApiError) {
    return privateJson({ error: { code: error.code, ...(error.conflicts.length ? { conflicts: error.conflicts } : {}) } }, error.status >= 400 && error.status < 600 ? error.status : 500);
  }
  return privateJson({ error: { code: "api_unavailable" } }, 503);
}
