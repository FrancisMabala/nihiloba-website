import { PUBLIC_ACTION_HEADERS, publicActionError, sameOriginPublicAction, validPublicJobReference } from "../../route-utils";

export async function POST(request: Request, { params }: { params: Promise<{ job: string; event: string }> }) {
  const { job, event } = await params;
  if (!sameOriginPublicAction(request) || !validPublicJobReference(job) || (event !== "view" && event !== "share")) return publicActionError(403);
  return new Response(null,{status:204,headers:PUBLIC_ACTION_HEADERS});
}
