import { cookies } from "next/headers";
import { personalRequestOrigin } from "../../../../../lib/personal-request-origin";
import { PERSONAL_SESSION_COOKIE, PRIVATE_HEADERS, personalSessionBinding } from "../../../employment/route-utils";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path?: string[] }> };
const fail = (status: number) => Response.json({ detail: "notification_unavailable" }, { status, headers: PRIVATE_HEADERS });
async function handle(request: Request, context: Context) {
  const path = ((await context.params).path ?? []).join("/");
  const reference = "NTF_[A-Za-z0-9_-]{1,36}";
  const allowed = request.method === "GET" ? path === "" || ['count','preferences'].includes(path) || new RegExp(`^${reference}$`).test(path)
    : request.method === "PUT" ? path === 'preferences' : request.method === "POST" && (path === 'actions' || new RegExp(`^${reference}/handoff$`).test(path));
  const query = new URL(request.url).searchParams;
  const keys = path === '' ? ['language','marketplace','mode','before','limit'] : ['language'];
  if (!allowed || [...query].some(([k,v])=>!keys.includes(k)||query.getAll(k).length!==1||v.length>64)) return fail(404);
  if (request.headers.get("sec-fetch-site") === "cross-site") return fail(403);
  const origin = personalRequestOrigin(request);
  if (request.method !== "GET" && !origin) return fail(403);
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
    const response = await fetch(new URL(`/api/dashboard/notifications/personal${path ? `/${path}` : ""}${query.size ? `?${query}` : ""}`, base.origin), {
      method: request.method, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json", "Content-Type": "application/json", Cookie: `shida_dashboard_session=${token}`, ...(origin ? {Origin: origin} : {}) },
    });
    if (!response.ok) return fail(response.status >= 400 && response.status < 600 ? response.status : 502);
    return Response.json(await response.json(), {headers: PRIVATE_HEADERS});
  } catch { return fail(503); }
}
export const GET = handle;
export const POST = handle;

export const PUT = handle;
