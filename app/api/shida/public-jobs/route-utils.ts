const DEFAULT_API_BASE_URL = "https://api.nihiloba.com";
export const PUBLIC_ACTION_HEADERS = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };

export function validPublicJobReference(value: string): boolean {
  return /^JOB_[A-Za-z0-9_-]{1,120}$/.test(value);
}

export function publicJobsApiBase(): string {
  const value = process.env.SHIDA_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("invalid_api_origin");
  return url.origin;
}

export function sameOriginPublicAction(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export function publicActionError(status = 503): Response {
  return Response.json({ error: status === 409 ? "job_unavailable" : "action_unavailable" }, { status, headers: PUBLIC_ACTION_HEADERS });
}
