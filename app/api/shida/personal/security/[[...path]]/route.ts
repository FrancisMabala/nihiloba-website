import { cookies } from "next/headers";
import { personalRequestOrigin } from "../../../../../lib/personal-request-origin";
import { PERSONAL_SESSION_COOKIE, PRIVATE_HEADERS, personalSessionBinding } from "../../../employment/route-utils";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path?: string[] }> };
const fail = (status: number) => Response.json({ detail: "security_unavailable" }, { status, headers: PRIVATE_HEADERS });
async function handle(request: Request, context: Context) {
  const path = ((await context.params).path ?? []).join("/");
  const allowed = request.method === "GET" ? path === "" || path === "phone" || path === "delete"
    : request.method === "POST" && /^(passkeys\/(register\/(options|verify)|verify\/(options|finish))|email\/(start|verify|proof\/(start|verify))|delete|sessions\/revoke|phone\/(start|verify|complete|cancel))$/.test(path);
  if (!allowed || new URL(request.url).search) return fail(404);
  if (request.headers.get("sec-fetch-site") === "cross-site") return fail(403);
  const origin = personalRequestOrigin(request, true);
  if (!origin) return fail(403);
  const token = (await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{20,256}$/.test(token) || request.headers.get("x-shida-session") !== personalSessionBinding(token)) return fail(401);
  let body: string | undefined;
  if (request.method !== "GET") {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return fail(415);
    const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    if (reader) for (;;) {
      const {done, value} = await reader.read(); if (done) break;
      size += value.byteLength; if (size > 20000) { await reader.cancel(); return fail(413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    body = new TextDecoder().decode(bytes);
    try { const value = JSON.parse(body); if (!value || typeof value !== "object" || Array.isArray(value)) return fail(422); } catch { return fail(422); }
  }
  try {
    const base = new URL(process.env.SHIDA_API_BASE_URL ?? "https://api.nihiloba.com");
    if (base.protocol !== "https:" || base.username || base.password) return fail(503);
    const response = await fetch(new URL(`/api/dashboard/personal/security${path ? `/${path}` : ""}`, base.origin), {
      method: request.method, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json", "Content-Type": "application/json", Cookie: `shida_dashboard_session=${token}`, ...(origin ? {Origin: origin} : {}) },
    });
    if (!response.ok) {
      const data=await response.json().catch(()=>null);
      const codes=new Set(['security_verification_required','security_fresh_login_required','security_method_not_ready','security_verification_failed','security_email_delivery_unavailable','security_recovery_review_required','security_change_not_ready','security_number_unavailable','security_phone_delivery_unavailable','security_change_pending']);
      return Response.json({detail:codes.has(data?.detail)?data.detail:'security_unavailable'},{status:response.status>=400&&response.status<600?response.status:502,headers:PRIVATE_HEADERS});
    }
    return Response.json(await response.json(), {headers: PRIVATE_HEADERS});
  } catch { return fail(503); }
}
export const GET = handle;
export const POST = handle;
