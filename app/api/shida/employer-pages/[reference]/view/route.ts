import {PUBLIC_ACTION_HEADERS, publicActionError, publicJobsApiBase, sameOriginPublicAction} from '../../../public-jobs/route-utils';

const uuid4 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export async function POST(request:Request, {params}:{params:Promise<{reference:string}>}) {
  const {reference} = await params;
  if (!sameOriginPublicAction(request) || !/^ORGDIR_[A-Za-z0-9_-]{1,64}$/.test(reference)) return publicActionError(403);
  const event = request.headers.get('X-Shida-Event'), visitor = request.headers.get('X-Shida-Visitor');
  if (!event || !uuid4.test(event) || (visitor !== null && !uuid4.test(visitor))) return publicActionError(422);
  try {
    const headers: Record<string,string> = {'X-Shida-Event':event};
    if (visitor) headers['X-Shida-Visitor'] = visitor;
    const response = await fetch(publicJobsApiBase()+'/api/public/shida/jobs/employers/'+reference+'/view', {
      method:'POST', cache:'no-store', headers, signal:AbortSignal.timeout(8000),
    });
    if (!response.ok) return publicActionError(response.status === 404 ? 404 : 503);
    return new Response(null, {status:204, headers:PUBLIC_ACTION_HEADERS});
  } catch { return publicActionError(); }
}
