import { cookies } from "next/headers";
import { personalRequestOrigin } from "../../../../../../lib/personal-request-origin";
import { clearEmploymentToken, privateEmploymentJson, setEmploymentToken } from "../../../../employment/route-utils";

export const dynamic = "force-dynamic";
const CHALLENGE_COOKIE = "nihiloba_personal_challenge";
const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/api/shida" };
const reference = /^DWC_[A-Za-z0-9_-]{8,100}$/;
const secret = /^[A-Za-z0-9_-]{32,128}$/;
type Context = { params: Promise<{ path?: string[] }> };

function upstreamCookie(response: Response, name: string): string | null {
  for (const line of response.headers.getSetCookie()) {
    const pair = line.split(";", 1)[0];
    if (pair.startsWith(`${name}=`)) {
      const value = pair.slice(name.length + 1);
      if (secret.test(value)) return value;
    }
  }
  return null;
}

async function handle(request: Request, context: Context) {
  const publicOrigin = personalRequestOrigin(request, true);
  if (!publicOrigin)
    return privateEmploymentJson({ error: { code: "forbidden" } }, 403);
  const path = (await context.params).path ?? [];
  const create = !path.length && request.method === "POST";
  const cancel = path.length === 1 && reference.test(path[0]) && request.method === "DELETE";
  const status = path.length === 1 && reference.test(path[0]) && request.method === "GET";
  const exchange = path.length === 2 && reference.test(path[0]) && path[1] === "session" && request.method === "POST";
  if (!create && !cancel && !status && !exchange || new URL(request.url).search) return privateEmploymentJson({ error: { code: "not_found" } }, 404);
  const jar = await cookies();
  const clear = () => jar.set(CHALLENGE_COOKIE, "", { ...options, maxAge: 0 });
  const [ref, deadline, verifier] = (jar.get(CHALLENGE_COOKIE)?.value ?? "").split(".");
  if (cancel) {
    // An obsolete tab must not erase the binding created by a newer attempt.
    if (ref === path[0]) clear();
    return privateEmploymentJson({ status: "cancelled" });
  }
  if (!create && (ref !== path[0] || !secret.test(verifier ?? "") || !(Number(deadline) > Date.now())))
    return privateEmploymentJson({ error: { code: "expired" } }, 404);
  try {
    const origin = new URL(process.env.SHIDA_API_BASE_URL ?? "https://api.nihiloba.com");
    if (origin.protocol !== "https:" || origin.username || origin.password) throw new Error();
    const response = await fetch(`${origin.origin}/api/dashboard/auth/whatsapp-challenge${path.length ? `/${path.join("/")}` : ""}`, {
      method: request.method, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json", Origin: publicOrigin,
        ...(!create ? { Cookie: `shida_dashboard_challenge=${verifier}` } : {}) },
    });
    if (!response.ok) return privateEmploymentJson({ error: { code: response.status === 429 ? "rate_limited" : response.status === 404 ? "expired" : response.status === 409 ? "cancelled" : "unavailable" } }, response.status >= 400 ? response.status : 502);
    const data = await response.json();
    if (create) {
      const binding = upstreamCookie(response, "shida_dashboard_challenge");
      const expires = Date.parse(data.expires_at);
      const link = new URL(data.whatsapp_url);
      if (!reference.test(data.challenge_ref) || !binding || !Number.isFinite(expires) || expires <= Date.now() || link.protocol !== "https:" || link.hostname !== "wa.me" || link.port || link.username || link.password || !/^\/[0-9]+$/.test(link.pathname)) throw new Error();
      await clearEmploymentToken();
      jar.set(CHALLENGE_COOKIE, `${data.challenge_ref}.${expires}.${binding}`, { ...options, maxAge: Math.min(600, Math.ceil((expires - Date.now()) / 1000)) });
      return privateEmploymentJson({ challenge_ref: data.challenge_ref, expires_at: data.expires_at, whatsapp_url: data.whatsapp_url }, 201);
    }
    if (exchange) {
      const token = upstreamCookie(response, "shida_dashboard_session");
      if (!token || data.authenticated !== true) throw new Error();
      await setEmploymentToken(token); clear();
      return privateEmploymentJson({ authenticated: true });
    }
    if (!["pending", "verified", "expired", "cancelled"].includes(data.status)) throw new Error();
    return privateEmploymentJson({ status: data.status, ...(data.reason === "onboarding_required" ? { reason: "onboarding_required" } : {}) });
  } catch { return privateEmploymentJson({ error: { code: "unavailable" } }, 503); }
}
export const POST = handle;
export const GET = handle;
export const DELETE = handle;
