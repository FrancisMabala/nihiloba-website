import { cookies } from "next/headers";
import { personalRequestOrigin } from "../../../../../lib/personal-request-origin";
import { sellerErrorCodes } from "../../../../../lib/restaurant-seller-contract";
import { PERSONAL_SESSION_COOKIE, PRIVATE_HEADERS, personalSessionBinding, clearEmploymentToken } from "../../../employment/route-utils";

export const dynamic = "force-dynamic";
const fail = (status: number, detail = "restaurant_unavailable") => Response.json({ detail }, { status, headers: PRIVATE_HEADERS });
type Context = { params: Promise<{ path?: string[] }> };
const ref = "[A-Za-z0-9_-]{1,64}";
function allowed(path: string, method: string) {
  if (method === "GET") return path === "" || new RegExp(`^(?:establishments/${ref}/(?:options|review-eligibility)|baskets/${ref}(?:/destination)?|${ref}(?:/(?:receipt|destination|pickup-code|delivery-code))?)$`).test(path);
  if (method === "POST") return path === "baskets" || new RegExp(`^(?:baskets/${ref}/(?:quote|submit/(?:pickup|delivery))|establishments/${ref}/(?:operations/recover|review/withdraw|reviews/${ref}/report)|${ref}/actions/(?:cancel|request_cancellation))$`).test(path);
  if (method === "PATCH") return new RegExp(`^baskets/${ref}$`).test(path);
  if (method === "PUT") return new RegExp(`^(?:baskets/${ref}/destination|establishments/${ref}/review)$`).test(path);
  return false;
}

async function handle(request: Request, context: Context) {
  const segments = (await context.params).path ?? [];
  const path = segments.join("/");
  if (!allowed(path, request.method)) return fail(404);
  const query = new URL(request.url).searchParams;
  const history = request.method === "GET" && path === "";
  if ([...query].some(([key,value]) => key !== 'language' && !(history && ['page','page_size'].includes(key)) || key === 'language' && !['en','fr','ln','sw'].includes(value) || ['page','page_size'].includes(key) && (!/^[1-9]\d{0,3}$/.test(value) || Number(value) > (key === 'page_size' ? 50 : 9999))) || ['language','page','page_size'].some(key => query.getAll(key).length > 1)) return fail(422);
  if (request.headers.get("sec-fetch-site") === "cross-site") return fail(403);
  const publicOrigin = personalRequestOrigin(request);
  if (request.method !== "GET" && !publicOrigin) return fail(403);
  let body: string | undefined;
  if (request.method !== "GET") {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return fail(415);
    body = await request.text();
    if (body.length > 32768) return fail(413);
    try { const parsed = JSON.parse(body); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail(422); }
    catch { return fail(422); }
  }
  const token = (await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{20,256}$/.test(token)) return fail(401);
  // A stale tab cannot execute creation or an edit after another login replaces its cookie.
  if (request.headers.get("x-shida-session") !== personalSessionBinding(token)) return fail(401);
  try {
    const base = new URL(process.env.SHIDA_API_BASE_URL ?? "https://api.nihiloba.com");
    if (base.protocol !== "https:" || base.username || base.password) return fail(503);
    const target = new URL(`/api/dashboard/personal/restaurant-orders${path ? `/${path}` : ""}`, base.origin);
    target.search = query.toString();
    const response = await fetch(target, { method: request.method, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(12000), headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), Cookie: `shida_dashboard_session=${token}`, ...(publicOrigin ? { Origin: publicOrigin } : {}),  } });
    if (response.status === 401) await clearEmploymentToken();
    const value = await response.json().catch(() => null);
    if (!response.ok) {
      const status=response.status >= 400 && response.status < 600 ? response.status : 502;
      const detail=sellerErrorCodes.has(value?.detail) ? value.detail : "restaurant_unavailable";
      const itemRef=detail==="restaurant_order_item_unavailable" && typeof value?.item_ref==="string" && /^[A-Za-z0-9_-]{1,64}$/.test(value.item_ref) ? value.item_ref : undefined;
      const changedItems=detail==="restaurant_quote_changed" && Array.isArray(value?.changed_items) ? value.changed_items.filter((ref:unknown)=>typeof ref==="string" && /^[A-Za-z0-9_-]{1,64}$/.test(ref)).slice(0,20) : undefined;
      return Response.json({detail,...(itemRef?{item_ref:itemRef}:{}),...(changedItems?{changed_items:changedItems}:{})},{status,headers:PRIVATE_HEADERS});
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail(502);
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
