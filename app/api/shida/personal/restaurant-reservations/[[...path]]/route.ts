import { cookies } from "next/headers";
import { personalRequestOrigin } from "../../../../../lib/personal-request-origin";
import { PERSONAL_SESSION_COOKIE, PRIVATE_HEADERS, personalSessionBinding, clearEmploymentToken } from "../../../employment/route-utils";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path?: string[] }> };
const fail = (status: number, detail = "restaurant_unavailable") => Response.json({detail}, {status, headers: PRIVATE_HEADERS});
const ref = "[A-Za-z0-9_-]{1,64}";
function allowed(path: string, method: string) {
  if (method === "GET") return path === "" || new RegExp(`^RRS_${ref}$`).test(path);
  if (method === "POST") return new RegExp(`^(?:establishments/RST_${ref}|RRS_${ref}/cancel)$`).test(path);
  return false;
}
function validBody(path: string, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  const keys = Object.keys(row).sort().join(",");
  if (path.endsWith("/cancel")) return keys === "expected_revision,operation_key" && Number.isSafeInteger(row.expected_revision) && Number(row.expected_revision) >= 1 && typeof row.operation_key === "string" && row.operation_key.length <= 200 && !!row.operation_key;
  return keys === "operation_key,party_size,starts_at" && typeof row.operation_key === "string" && !!row.operation_key && row.operation_key.length <= 200 && Number.isSafeInteger(row.party_size) && Number(row.party_size) >= 1 && Number(row.party_size) <= 30 && typeof row.starts_at === "string" && row.starts_at.length <= 40;
}
async function handle(request: Request, context: Context) {
  const path = ((await context.params).path ?? []).join("/");
  if (!allowed(path, request.method)) return fail(404);
  const query = new URL(request.url).searchParams;
  if ([...query].some(([key,value]) => path !== "" || !["page","page_size"].includes(key) || query.getAll(key).length !== 1 || !/^[1-9]\d{0,3}$/.test(value) || key === "page_size" && Number(value)>50)) return fail(422);
  if (request.headers.get("sec-fetch-site") === "cross-site") return fail(403);
  const publicOrigin = personalRequestOrigin(request);
  if (request.method !== "GET" && !publicOrigin) return fail(403);
  const token = (await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{20,256}$/.test(token) || request.headers.get("x-shida-session") !== personalSessionBinding(token)) return fail(401);
  let body: string | undefined;
  if (request.method === "POST") {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return fail(415);
    body = await request.text();
    if (body.length > 4096) return fail(413);
    try { if (!validBody(path, JSON.parse(body))) return fail(422); } catch { return fail(422); }
  }
  try {
    const base = new URL(process.env.SHIDA_API_BASE_URL ?? "https://api.nihiloba.com");
    if (base.protocol !== "https:" || base.username || base.password) return fail(503);
    const target = new URL(`/api/dashboard/personal/restaurant-reservations${path ? `/${path}` : ""}`, base.origin);
    target.search = query.toString();
    const response = await fetch(target, {method: request.method, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(12000), headers: {Accept: "application/json", ...(body ? {"Content-Type":"application/json"}:{}), Cookie: `shida_dashboard_session=${token}`, ...(publicOrigin ? {Origin: publicOrigin}: {})}});
    if (response.status === 401) await clearEmploymentToken();
    const value = await response.json().catch(()=>null);
    if (!response.ok) return fail(response.status >= 400 && response.status < 600 ? response.status : 502, typeof value?.detail === "string" && /^restaurant_[a-z_]+$/.test(value.detail) ? value.detail : "restaurant_unavailable");
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail(502);
    return Response.json(value,{headers:PRIVATE_HEADERS});
  } catch { return fail(503); }
}
export const GET = handle;
export const POST = handle;
