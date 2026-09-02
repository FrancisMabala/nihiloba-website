import { PUBLIC_ACTION_HEADERS, publicActionError, publicJobsApiBase, sameOriginPublicAction, validPublicJobReference } from "../../route-utils";

export async function POST(request: Request, { params }: { params: Promise<{ job: string; event: string }> }) {
  const { job, event } = await params;
  if (!sameOriginPublicAction(request) || !validPublicJobReference(job) || (event !== "view" && event !== "share")) return publicActionError(403);
  try {
    const response = await fetch(`${publicJobsApiBase()}/api/public/shida/jobs/${encodeURIComponent(job)}/${event}`, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return publicActionError(response.status === 409 ? 409 : 503);
    return new Response(null, { status: 204, headers: PUBLIC_ACTION_HEADERS });
  } catch { return publicActionError(); }
}
