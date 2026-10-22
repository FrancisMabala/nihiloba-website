import { employmentToken, privateEmploymentJson, setEmploymentToken } from "../../employment/route-utils";
import { personalRequestOrigin } from "../../../../lib/personal-request-origin";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  const origin = personalRequestOrigin(request, true);
  if (!origin) return privateEmploymentJson({ error: { code: "forbidden" } }, 403);
  const path = (await context.params).path;
  const route = path.join("/");
  const allowed = (request.method === "GET" && /^(personal|business|profile)$/.test(route)) ||
    (request.method === "PATCH" && route === "profile") ||
    (request.method === "POST" && /^(personal|business|business-handoff|finish\/session|personal\/consent)$/.test(route)) ||
    (request.method === "PATCH" && /^(personal|business)\/(POD|ONB)_[A-Za-z0-9_-]{4,100}$/.test(route)) ||
    (request.method === "POST" && /^(personal|business)\/(POD|ONB)_[A-Za-z0-9_-]{4,100}\/(complete|cancel)$/.test(route));
  if (!allowed || new URL(request.url).search) return privateEmploymentJson({ error: { code: "not_found" } }, 404);
  const token = await employmentToken();
  if (!token) return privateEmploymentJson({ error: { code: "unauthorized" } }, 401);
  let body: string | undefined;
  if (request.method !== "GET") {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    if (reader) for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); return privateEmploymentJson({ error: { code: "invalid_fields" } }, 413); }
      chunks.push(value);
    }
    const raw = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.length; }
    body = new TextDecoder().decode(raw) || "{}";
  }
  try {
    const upstream = new URL(process.env.SHIDA_API_BASE_URL ?? "https://api.nihiloba.com");
    if (upstream.protocol !== "https:" || upstream.username || upstream.password) throw new Error();
    const response = await fetch(`${upstream.origin}/api/dashboard/registration/${route}`, {
      method: request.method, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json", "Content-Type": "application/json", Origin: origin, Cookie: `shida_dashboard_session=${token}` },
    });
    const data = await response.json();
    if (!response.ok) return privateEmploymentJson({ error: {
      code: typeof data.detail?.code === "string" ? data.detail.code : response.status === 401 ? "unauthorized" : "unavailable",
      fields: Array.isArray(data.detail?.fields) ? data.detail.fields.filter((v: unknown) => typeof v === "string") : [],
    } }, response.status);
    if (route === "finish/session") {
      const pair = response.headers.getSetCookie().map(v => v.split(";", 1)[0]).find(v => v.startsWith("shida_dashboard_session="));
      const issued = pair?.slice("shida_dashboard_session=".length);
      if (!issued || !/^[A-Za-z0-9_-]{32,128}$/.test(issued) || data.authenticated !== true) throw new Error();
      await setEmploymentToken(issued);
      return privateEmploymentJson({ authenticated: true });
    }
    return privateEmploymentJson(data);
  } catch { return privateEmploymentJson({ error: { code: "unavailable" } }, 503); }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
