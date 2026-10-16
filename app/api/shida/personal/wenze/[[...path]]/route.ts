import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../../lib/personal-request-origin';
import {PERSONAL_SESSION_COOKIE,PRIVATE_HEADERS,personalSessionBinding,clearEmploymentToken} from '../../../employment/route-utils';
import {wenzeRouteAllowed} from '../../../../../lib/wenze-seller-contract';
export const dynamic='force-dynamic';
const fail=(status:number,detail='service_unavailable')=>Response.json({detail},{status,headers:PRIVATE_HEADERS});
async function handle(request:Request,context:{params:Promise<{path?:string[]}>}){
 const parts=(await context.params).path??[];const query=new URL(request.url).searchParams;
 if(!wenzeRouteAllowed(parts,request.method,query))return fail(404);
 if(request.headers.get('sec-fetch-site')==='cross-site')return fail(403);
 const origin=personalRequestOrigin(request);if(request.method!=='GET'&&!origin)return fail(403);
 const token=(await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
 if(!token||!/^[A-Za-z0-9_-]{20,256}$/.test(token)||request.headers.get('X-Shida-Session')!==personalSessionBinding(token))return fail(401);
 let body:string|undefined;
 if(request.method!=='GET'){
  if(!request.headers.get('content-type')?.startsWith('application/json'))return fail(415);
  const maximum=parts.includes('uploads')||parts[0]==='catalog-imports'&&parts.length===1?16*1024*1024:128*1024;
  const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
  if(reader)for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>maximum){await reader.cancel();return fail(413);}chunks.push(chunk.value);}
  body=Buffer.concat(chunks).toString('utf8');try{const value=JSON.parse(body);if(!value||typeof value!=='object'||Array.isArray(value))return fail(422);}catch{return fail(422);}
 }
 const key=request.headers.get('Idempotency-Key');if(key&&!/^[A-Za-z0-9_-]{8,200}$/.test(key))return fail(422);
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');if(base.protocol!=='https:'||base.username||base.password)return fail(503);
  const headers={Accept:'application/json',Cookie:`shida_dashboard_session=${token}`,...(origin?{Origin:origin}:{})};
  // Resolve authority server-side. The browser can never choose an Organization.
  const auth=await fetch(new URL('/api/dashboard/contexts',base.origin),{headers,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000)});
  if(auth.status===401){await clearEmploymentToken();return fail(401);}
  if(!auth.ok)return fail(auth.status===403?403:503);
  const data=await auth.json();const actor=data.contexts?.find((row:{type:string;public_ref:string})=>row.type==='personal'&&/^USR_[A-Za-z0-9_-]+$/.test(row.public_ref));if(!actor)return fail(403);
  const target=new URL(`/api/dashboard/wenze/contexts/${encodeURIComponent(actor.public_ref)}/${parts.join('/')}`,base.origin);target.search=query.toString();
  const response=await fetch(target,{method:request.method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{}),...(key?{'Idempotency-Key':key}:{})},body,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(40000)});
  if(response.status===401)await clearEmploymentToken();
  if(!response.ok){const value=await response.json().catch(()=>null);return fail(response.status>=400&&response.status<600?response.status:502,typeof value?.detail==='string'&&/^[a-z][a-z0-9_]{1,100}$/.test(value.detail)?value.detail:undefined);}
  if(parts.at(-1)?.endsWith('.csv')||parts.at(-1)==='template'||parts.includes('artifacts'))return new Response(await response.arrayBuffer(),{headers:{...PRIVATE_HEADERS,'Content-Type':response.headers.get('content-type')??'application/octet-stream','Content-Disposition':response.headers.get('content-disposition')??'attachment; filename=wenze-report','X-Content-Type-Options':'nosniff'}});
  return Response.json(await response.json(),{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
export const GET=handle,POST=handle,PATCH=handle,PUT=handle,DELETE=handle;
export const HEAD=()=>fail(405);export const OPTIONS=HEAD;
