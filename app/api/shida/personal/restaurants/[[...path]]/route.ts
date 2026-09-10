import { cookies } from "next/headers";
import { allowedSellerRoute, validSellerBody, validSellerQuery, validShare, sellerErrorCodes } from "../../../../../lib/restaurant-seller-contract";
import { PERSONAL_SESSION_COOKIE, PRIVATE_HEADERS, personalSessionBinding, clearEmploymentToken } from "../../../employment/route-utils";

export const dynamic = "force-dynamic";
const fail = (status: number, detail = "restaurant_unavailable") => Response.json({ detail }, { status, headers: PRIVATE_HEADERS });
type Context = { params: Promise<{ path?: string[] }> };

async function handle(request: Request, context: Context) {
  const segments = (await context.params).path ?? [];
  const path = segments.join("/");
  if (segments.some(s => !/^[A-Za-z0-9_-]+$/.test(s)) || !allowedSellerRoute(path, request.method)) return fail(404);
  const query = new URL(request.url).searchParams;
  if (!validSellerQuery(path, request.method, query)) return fail(422, "restaurant_invalid_input");
  if (request.headers.get("sec-fetch-site") === "cross-site") return fail(403);
  if (request.method !== "GET" && request.headers.get("origin") !== new URL(request.url).origin) return fail(403);
  const token = (await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{20,256}$/.test(token)) return fail(401);
  // A stale tab cannot execute creation or an edit after another login replaces its cookie.
  if (request.headers.get("x-shida-session") !== personalSessionBinding(token)) return fail(401);
  let body: string | undefined;
  if (request.method !== "GET") {
    if (Number(request.headers.get("content-length")) > 65536) return fail(413);
    // Bound actual streamed bytes, not only a caller-supplied Content-Length.
    const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    if (reader) for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 65536) { await reader.cancel(); return fail(413); } chunks.push(part.value); }
    body = Buffer.concat(chunks).toString("utf8");
    if (path.includes("/links/")) { if (body) return fail(422, "restaurant_invalid_input"); body = undefined; }
    else {
      if (!request.headers.get("content-type")?.startsWith("application/json")) return fail(415);
      try { if (!validSellerBody(path, request.method, JSON.parse(body))) return fail(422, "restaurant_invalid_input"); } catch { return fail(422, "restaurant_invalid_input"); }
    }
  }
  try {
    const base = new URL(process.env.SHIDA_API_BASE_URL ?? "https://api.nihiloba.com");
    if (base.protocol !== "https:" || base.username || base.password) return fail(503);
    const target = new URL(`/api/dashboard/personal/restaurants${path ? `/${path}` : ""}`, base.origin);
    target.search = query.toString();
    const response = await fetch(target, { method: request.method, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(12000), headers: { Accept: "application/json", Cookie: `shida_dashboard_session=${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body });
    if (response.status === 401) await clearEmploymentToken();
    const value = await response.json().catch(() => null);
    if (!response.ok) return fail(response.status >= 400 && response.status < 600 ? response.status : 502, sellerErrorCodes.has(value?.detail) ? value.detail : "restaurant_unavailable");
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail(502);
    if (path.includes("/links/") && !validShare(value, segments[0], segments[2])) return fail(502);
    return Response.json(value, { headers: PRIVATE_HEADERS });
  } catch { return fail(503); }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
