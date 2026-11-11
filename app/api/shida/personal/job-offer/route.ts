import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../lib/personal-request-origin';
import {PERSONAL_SESSION_COOKIE, PRIVATE_HEADERS, personalSessionBinding, clearEmploymentToken} from '../../employment/route-utils';

export const dynamic = 'force-dynamic';
const fail = (status: number) => Response.json({detail: 'personal_offer_unavailable'}, {status, headers: PRIVATE_HEADERS});

async function handle(request: Request) {
  const query=new URL(request.url).searchParams;
  let suffix='';
  if(query.size){
    const offer=query.get('offer'),kind=query.get('kind'),record=query.get('record'),reference=/^[A-Za-z0-9_-]{1,64}$/;
    if(request.method!=='GET'||!offer||!reference.test(offer)||!['applications','candidates'].includes(kind??'')||(record!==null&&!reference.test(record))||[...query.keys()].some(k=>!['offer','kind','record'].includes(k)))return fail(404);
    suffix='/'+offer+'/'+kind+(record?'?record='+record:'');
  }
  const origin = personalRequestOrigin(request);
  if (request.headers.get('sec-fetch-site') === 'cross-site' || request.method !== 'GET' && !origin) return fail(403);
  const token = (await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{20,256}$/.test(token) || request.headers.get('X-Shida-Session') !== personalSessionBinding(token)) return fail(401);
  let body: string | undefined;
  if (request.method === 'POST') {
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return fail(415);
    if (Number(request.headers.get('content-length')) > 40000) return fail(413);
    const reader = request.body?.getReader(), chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > 40000) {await reader.cancel(); return fail(413);}
      chunks.push(chunk.value);
    }
    body = Buffer.concat(chunks).toString();
    try {
      const value = JSON.parse(body);
      if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(422);
    } catch {return fail(422);}
  }
  try {
    const base = new URL(process.env.SHIDA_API_BASE_URL ?? 'https://api.nihiloba.com');
    if (base.protocol !== 'https:' || base.username || base.password) return fail(503);
    const response = await fetch(new URL('/api/dashboard/employment/personal-offer-onboarding'+suffix, base.origin), {
      method: request.method, body, cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(12000),
      headers: {Cookie: `shida_dashboard_session=${token}`, Accept: 'application/json',
        ...(origin ? {Origin: origin} : {}), ...(body ? {'Content-Type': 'application/json'} : {})},
    });
    if (response.status === 401) await clearEmploymentToken();
    if(response.status===422){const data=await response.json().catch(()=>({}));const field=data?.detail?.field;if(typeof field==='string'&&/^[a-z_]{2,20}$/.test(field))return Response.json({field},{status:422,headers:PRIVATE_HEADERS})}
    if (!response.ok) return fail(response.status >= 400 && response.status < 600 ? response.status : 502);
    return Response.json(await response.json(), {headers: PRIVATE_HEADERS});
  } catch {return fail(503);}
}

export const GET = handle;
export const POST = handle;
