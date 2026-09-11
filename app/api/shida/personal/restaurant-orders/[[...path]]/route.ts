import { cookies } from "next/headers";
import { personalRequestOrigin } from "../../../../../lib/personal-request-origin";
import { sellerErrorCodes } from "../../../../../lib/restaurant-seller-contract";
import { PERSONAL_SESSION_COOKIE, PRIVATE_HEADERS, personalSessionBinding, clearEmploymentToken } from "../../../employment/route-utils";

export const dynamic = "force-dynamic";
const fail = (status: number, detail = "restaurant_unavailable") => Response.json({ detail }, { status, headers: PRIVATE_HEADERS });
type Context = { params: Promise<{ path?: string[] }> };

async function handle(request: Request, context: Context) {
  const segments = (await context.params).path ?? [];
  const path = segments.join("/");
  if (request.method !== "GET" || !/^[A-Za-z0-9_-]{1,64}\/receipt$/.test(path)) return fail(404);
  const query = new URL(request.url).searchParams;
  if ([...query].some(([key,value]) => key !== 'language' || !['en','fr','ln','sw'].includes(value)) || query.getAll('language').length>1) return fail(422);
  if (request.headers.get("sec-fetch-site") === "cross-site") return fail(403);
  const publicOrigin = personalRequestOrigin(request);
  if (request.method !== "GET" && !publicOrigin) return fail(403);
  const token = (await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{20,256}$/.test(token)) return fail(401);
  // A stale tab cannot execute creation or an edit after another login replaces its cookie.
  if (request.headers.get("x-shida-session") !== personalSessionBinding(token)) return fail(401);
  try {
    const base = new URL(process.env.SHIDA_API_BASE_URL ?? "https://api.nihiloba.com");
    if (base.protocol !== "https:" || base.username || base.password) return fail(503);
    const target = new URL(`/api/dashboard/personal/restaurant-orders${path ? `/${path}` : ""}`, base.origin);
    target.search = query.toString();
    const response = await fetch(target, { method: request.method, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(12000), headers: { Accept: "application/json", Cookie: `shida_dashboard_session=${token}`, ...(publicOrigin ? { Origin: publicOrigin } : {}),  } });
    if (response.status === 401) await clearEmploymentToken();
    const value = await response.json().catch(() => null);
    if (!response.ok) return fail(response.status >= 400 && response.status < 600 ? response.status : 502, sellerErrorCodes.has(value?.detail) ? value.detail : "restaurant_unavailable");
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail(502);
    return Response.json(value, { headers: PRIVATE_HEADERS });
  } catch { return fail(503); }
}
export const GET = handle;
export const POST = () => fail(405);
export const PATCH = POST;
export const PUT = POST;
export const DELETE = POST;
export const HEAD = POST;
export const OPTIONS = POST;
