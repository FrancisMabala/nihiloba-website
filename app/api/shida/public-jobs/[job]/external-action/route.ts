import { PUBLIC_ACTION_HEADERS, publicActionError, publicJobsApiBase, sameOriginPublicAction, validPublicJobReference } from "../../route-utils";

export async function POST(request: Request, { params }: { params: Promise<{ job: string }> }) {
  const { job } = await params;
  if (!sameOriginPublicAction(request) || !validPublicJobReference(job)) return publicActionError(403);
  let body: unknown;
  try { body = await request.json(); } catch { return publicActionError(400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return publicActionError(400);
  const { action, idempotency_key } = body as Record<string, unknown>;
  if ((action !== "redirect" && action !== "instructions") || (idempotency_key != null && (typeof idempotency_key !== "string" || idempotency_key.length > 160))) return publicActionError(400);
  try {
    const response = await fetch(`${publicJobsApiBase()}/api/public/shida/jobs/${encodeURIComponent(job)}/external-action`, {
      method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
      body: JSON.stringify({ action, ...(idempotency_key ? { idempotency_key } : {}) }), signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return publicActionError(response.status === 409 ? 409 : 503);
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || Array.isArray(result)) return publicActionError();
    const value = result as Record<string, unknown>;
    if (value.mode === "redirect" && typeof value.redirect_url === "string") {
      const destination = new URL(value.redirect_url);
      if (destination.protocol !== "https:" || destination.username || destination.password) return publicActionError();
      return Response.json({ mode: "redirect", redirect_url: destination.toString() }, { headers: PUBLIC_ACTION_HEADERS });
    }
    if (value.mode === "instructions" && typeof value.instructions === "string" && value.instructions.trim()) return Response.json({ mode: "instructions", instructions: value.instructions }, { headers: PUBLIC_ACTION_HEADERS });
    return publicActionError();
  } catch { return publicActionError(); }
}
