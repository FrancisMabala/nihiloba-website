import {cookies} from "next/headers";
import {servicesRequestTarget} from "../../../../../lib/services-request-routing";
import {personalRequestOrigin} from "../../../../../lib/personal-request-origin";
import {PERSONAL_SESSION_COOKIE, PRIVATE_HEADERS, personalSessionBinding, clearEmploymentToken} from "../../../employment/route-utils";

export const dynamic = "force-dynamic";
type Context = {params: Promise<{path: string[]}>};
const fail = (status: number, detail = "service_brief_unavailable") => Response.json({detail}, {status, headers: PRIVATE_HEADERS});

async function boundedBody(stream: ReadableStream<Uint8Array> | null, limit: number) {
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = stream?.getReader();
  if (reader) for (;;) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.length;
    if (size > limit) { await reader.cancel(); throw new RangeError("body_limit"); }
    chunks.push(next.value);
  }
  return Buffer.concat(chunks);
}

async function handle(request: Request, context: Context) {
  const parts = (await context.params).path;
  const path = servicesRequestTarget(parts, request.method, new URL(request.url).searchParams);
  if (!path) return fail(404);
  if (request.headers.get("sec-fetch-site") === "cross-site") return fail(403);
  const origin = personalRequestOrigin(request);
  if (request.method !== "GET" && !origin) return fail(403);
  const token = (await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{20,256}$/.test(token) || request.headers.get("X-Shida-Session") !== personalSessionBinding(token)) return fail(401);
  const upload = parts[0] === "briefs" && parts[2] === "document-upload";
  const download = parts[4] === "download";
  const headers: Record<string, string> = {Accept: download ? "application/pdf" : "application/json", Cookie: `shida_dashboard_session=${token}`};
  if (origin) headers.Origin = origin;
  let body: Buffer | undefined;
  if (request.method === "POST") {
    const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (type !== (upload ? "application/pdf" : "application/json")) return fail(415);
    const limit = upload ? 10 * 1024 * 1024 : 65536;
    if (Number(request.headers.get("content-length")) > limit) return fail(413);
    try { body = await boundedBody(request.body, limit); } catch { return fail(413); }
    headers["Content-Type"] = type;
    if (upload) {
      const operation = request.headers.get("X-Operation-Id"), revision = request.headers.get("X-Brief-Revision");
      if (!operation || !/^[A-Za-z0-9_-]{1,196}$/.test(operation) || !/^[1-9]\d{0,8}$/.test(revision ?? "")) return fail(422);
      headers["X-Operation-Id"] = operation;
      headers["X-Brief-Revision"] = revision!;
    } else {
      try {
        const parsed: unknown = JSON.parse(body.toString("utf8"));
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail(422);
      } catch { return fail(422); }
    }
  }
  try {
    const base = new URL(process.env.SHIDA_API_BASE_URL ?? "https://api.nihiloba.com");
    if (base.protocol !== "https:" || base.username || base.password) return fail(503);
    const response = await fetch(new URL(`/api/dashboard/${path}`, base.origin), {
      method: request.method, cache: "no-store", redirect: "manual",
      signal: AbortSignal.timeout(upload ? 120000 : 20000), headers,
      body: body ? new Uint8Array(body) : undefined,
    });
    if (response.status === 401) await clearEmploymentToken();
    const raw = await boundedBody(response.body, download && response.ok ? 10 * 1024 * 1024 : 2 * 1024 * 1024);
    if (download && response.ok) {
      if (!response.headers.get("content-type")?.startsWith("application/pdf")) return fail(502);
      return new Response(new Uint8Array(raw), {headers: {...PRIVATE_HEADERS,
        "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="service-request.pdf"',
        "Content-Security-Policy": "sandbox", "X-Content-Type-Options": "nosniff"}});
    }
    const value = JSON.parse(raw.toString("utf8"));
    if (!response.ok) {
      // Never relay arbitrary backend text, validation payloads or private values.
      const code = typeof value?.detail === "string" &&
        /^(service_(brief|posted|proposal|quote|request|work_request|reservation)_[a-z_]+|pdf_[a-z_]+)$/.test(value.detail)
        ? value.detail : undefined;
      return fail(response.status >= 400 && response.status < 600 ? response.status : 502, code);
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail(502);
    return Response.json(value, {headers: PRIVATE_HEADERS});
  } catch { return fail(503); }
}
export const GET = handle;
export const POST = handle;
export const PUT = () => fail(405);
export const PATCH = PUT;
export const DELETE = PUT;
export const HEAD = PUT;
export const OPTIONS = PUT;
