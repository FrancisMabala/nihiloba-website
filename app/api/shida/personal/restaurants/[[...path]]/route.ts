import { isPhotoPath, isPhotoUpload, PHOTO_MAX_BYTES, PHOTO_TYPES, validPhotoEnvelope } from '../../../../../lib/restaurant-photo-contract';
import {isPreparationPath,validPreparationResponse} from '../../../../../lib/restaurant-preparation-contract';
import { validMenuPreview, validOrderProjections } from "../../../../../lib/restaurant-projections";
import { cookies } from "next/headers";
import { personalRequestOrigin } from "../../../../../lib/personal-request-origin";
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
  const publicOrigin = personalRequestOrigin(request);
  if (request.method !== "GET" && !publicOrigin) return fail(403);
  const token = (await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{20,256}$/.test(token)) return fail(401);
  // A stale tab cannot execute creation or an edit after another login replaces its cookie.
  if (request.headers.get("x-shida-session") !== personalSessionBinding(token)) return fail(401);
  const upload = isPhotoUpload(path), photo = isPhotoPath(path), preview = photo && path.endsWith('/preview');
  let body: string | Uint8Array<ArrayBuffer> | undefined;
  const contentType = request.headers.get('content-type')?.split(';')[0] ?? '';
  const limit = upload ? PHOTO_MAX_BYTES : 65536;
  if (request.method !== "GET") {
    if (Number(request.headers.get("content-length")) > limit) return fail(413, upload ? "restaurant_photo_too_large" : "restaurant_invalid_input");
    // Bound actual streamed bytes, not only a caller-supplied Content-Length.
    const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    if (reader) for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > limit) { await reader.cancel(); return fail(413, upload ? "restaurant_photo_too_large" : "restaurant_invalid_input"); } chunks.push(part.value); }
    const bytes = Buffer.concat(chunks);
    if (upload) {
      if (!PHOTO_TYPES.includes(contentType) || !bytes.length) return fail(422, 'restaurant_invalid_input');
      body = new Uint8Array(bytes);
    } else {
    body = bytes.toString("utf8");
    if (path.includes("/links/") || path.endsWith("/order-measurement")) { if (body) return fail(422, "restaurant_invalid_input"); body = undefined; }
    else {
      if (!request.headers.get("content-type")?.startsWith("application/json")) return fail(415);
      try { if (!validSellerBody(path, request.method, JSON.parse(body))) return fail(422, "restaurant_invalid_input"); } catch { return fail(422, "restaurant_invalid_input"); }
    }
    }
  }
  try {
    const base = new URL(process.env.SHIDA_API_BASE_URL ?? "https://api.nihiloba.com");
    if (base.protocol !== "https:" || base.username || base.password) return fail(503);
    const target = new URL(`/api/dashboard/personal/restaurants${path ? `/${path}` : ""}`, base.origin);
    target.search = query.toString();
    const response = await fetch(target, { method: request.method, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(photo ? 45000 : 12000), headers: { Accept: preview ? "image/jpeg" : "application/json", Cookie: `shida_dashboard_session=${token}`, ...(publicOrigin ? { Origin: publicOrigin } : {}), ...(body ? { "Content-Type": upload ? contentType : "application/json" } : {}) }, body });
    if (response.status === 401) await clearEmploymentToken();
    if (preview && response.ok) {
      if (response.headers.get('content-type')?.split(';')[0] !== 'image/jpeg') return fail(502);
      const reader = response.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
      if (!reader) return fail(502);
      for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > PHOTO_MAX_BYTES) { await reader.cancel(); return fail(502); } chunks.push(part.value); }
      return new Response(Buffer.concat(chunks), { headers: { ...PRIVATE_HEADERS, 'Content-Type': 'image/jpeg', 'X-Content-Type-Options': 'nosniff' } });
    }
    const value = await response.json().catch(() => null);
    if (!response.ok) return fail(response.status >= 400 && response.status < 600 ? response.status : 502, sellerErrorCodes.has(value?.detail) ? value.detail : "restaurant_unavailable");
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail(502);
    if (photo && !validPhotoEnvelope(value)) return fail(502);
    if (photo) return Response.json({ upload_ref: value.upload_ref, target: value.target, item_ref: value.item_ref, status: value.status, expires_at: value.expires_at, revision: value.revision }, { headers: PRIVATE_HEADERS });
    if (isPreparationPath(path) && !validPreparationResponse(path,request.method,value)) return fail(502);
    if (path.includes("/links/") && !validShare(value, segments[0], segments[2])) return fail(502);
    if (path.endsWith('/menu-preview') && !validMenuPreview(value, query)) return fail(502);
    if (!path.includes('/preparation/') && /\/(orders|order-feed)$/.test(path)) {
      const rows = path.endsWith('/orders') ? value.items : value.changed;
      if (!Array.isArray(rows) || rows.length > 50 || !rows.every(validOrderProjections)) return fail(502);
    }
    return Response.json(value, { headers: PRIVATE_HEADERS });
  } catch { return fail(503); }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;

export const DELETE = () => fail(405);
export const HEAD = DELETE;
export const OPTIONS = DELETE;
