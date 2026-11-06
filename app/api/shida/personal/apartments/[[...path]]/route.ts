import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../../lib/personal-request-origin';
import {PERSONAL_SESSION_COOKIE, PRIVATE_HEADERS, personalSessionBinding} from '../../../employment/route-utils';
export const dynamic = 'force-dynamic';
type Context = {params: Promise<{path?: string[]}>};
const fail = (status:number) => Response.json({detail:'apartment_unavailable'},{status,headers:PRIVATE_HEADERS});
async function handle(request:Request, context:Context) {
 const path = ((await context.params).path ?? []).join('/'), url = new URL(request.url);
 const upload = /^APT_[A-Za-z0-9_-]{1,80}\/photos$/.test(path) && request.method === 'POST';
 const preview = /^APT_[A-Za-z0-9_-]{1,80}\/photos\/APF_[a-f0-9]{32}$/.test(path) && request.method === 'GET';
 const removal = /^APT_[A-Za-z0-9_-]{1,80}\/photos\/APF_[a-f0-9]{32}\/remove$/.test(path) && request.method === 'POST';
 const interest = /^APT_[A-Za-z0-9_-]{1,80}\/interest$/.test(path);
 const review = request.method==='GET' && (path==='manage'||/^APT_[A-Za-z0-9_-]{1,80}\/requests$/.test(path));
 const shortlist = request.method==='POST' && /^APT_[A-Za-z0-9_-]{1,80}\/requests\/[a-f0-9]{64}\/shortlist$/.test(path);
 if(path !== '' && !upload && !preview && !removal && !interest && !review && !shortlist) return fail(404);
 if(review ? [...url.searchParams.keys()].some(key=>key!=='page') || url.searchParams.has('page')&&!/^[1-9]\d{0,3}$/.test(url.searchParams.get('page')??'') : upload || removal ? [...url.searchParams.keys()].some(key => !(removal ? ['revision'] : ['revision','operation_key']).includes(key)) || !/^\d+$/.test(url.searchParams.get('revision') ?? '') || upload && !/^[A-Za-z0-9_-]{8,100}$/.test(url.searchParams.get('operation_key') ?? '') : Boolean(url.search)) return fail(404);
 const origin = personalRequestOrigin(request);
 if(request.headers.get('sec-fetch-site') === 'cross-site' || request.method !== 'GET' && !origin) return fail(403);
 const token = (await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
 if(!token || !/^[A-Za-z0-9_-]{20,256}$/.test(token) || request.headers.get('x-shida-session') !== personalSessionBinding(token)) return fail(401);
 const mime = request.headers.get('content-type')?.split(';')[0] ?? '';
 let body:Buffer | undefined;
 if(request.method === 'POST') {
  if(upload ? !['image/jpeg','image/png','image/webp'].includes(mime) : mime !== 'application/json') return fail(415);
  const limit = upload ? 5*1024*1024 : 40000;
  const reader = request.body?.getReader(), chunks:Uint8Array[] = []; let size = 0;
  if(reader) for(;;) {const {done,value} = await reader.read(); if(done) break; size += value.byteLength; if(size > limit) {await reader.cancel(); return fail(413);} chunks.push(value);}
  body = Buffer.concat(chunks);
  if(!upload) try {const value = JSON.parse(body.toString()); if(!value || typeof value !== 'object' || Array.isArray(value)) return fail(422);} catch {return fail(422);}
 }
 try {
  const base = new URL(process.env.SHIDA_API_BASE_URL ?? 'https://api.nihiloba.com');
  if(base.protocol !== 'https:' || base.username || base.password) return fail(503);
  const response = await fetch(new URL(`/api/dashboard/personal/apartments${path ? '/'+path : ''}${upload || removal || review ? url.search : ''}`,base.origin), {method:request.method,body:body ? new Uint8Array(body) : undefined,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(upload ? 45000 : 15000),headers:{Cookie:`shida_dashboard_session=${token}`,Accept:preview ? 'image/jpeg' : 'application/json',...(origin ? {Origin:origin} : {}),...(body ? {'Content-Type':mime} : {})}});
  if(!response.ok) return fail(response.status >= 400 && response.status < 600 ? response.status : 502);
  if(preview) {
   if(response.headers.get('content-type')?.split(';')[0] !== 'image/jpeg') return fail(502);
   const bytes = await response.arrayBuffer(); if(bytes.byteLength > 5*1024*1024) return fail(502);
   return new Response(bytes,{headers:{...PRIVATE_HEADERS,'Content-Type':'image/jpeg','X-Content-Type-Options':'nosniff'}});
  }
  return Response.json(await response.json(),{headers:PRIVATE_HEADERS});
 } catch {return fail(503);}
}
export const GET = handle;
export const POST = handle;
