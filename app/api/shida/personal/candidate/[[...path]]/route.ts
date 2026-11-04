import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../../lib/personal-request-origin';
import {PERSONAL_SESSION_COOKIE,PRIVATE_HEADERS,personalSessionBinding,clearEmploymentToken} from '../../../employment/route-utils';
export const dynamic='force-dynamic';
const fail=(status:number)=>Response.json({detail:'candidate_unavailable'},{status,headers:PRIVATE_HEADERS});
async function handle(request:Request,context:{params:Promise<{path?:string[]}>}){
 const path=(await context.params).path??[],query=new URL(request.url).searchParams;
 if(path.length>1||path.length===1&&(!['profile','document'].includes(path[0])||request.method!=='POST'))return fail(404);
 if([...query].length>1||[...query].some(([k,v])=>k!=='language'||!['fr','en','ln','sw'].includes(v)))return fail(404);
 const origin=personalRequestOrigin(request);
 if(request.headers.get('sec-fetch-site')==='cross-site'||request.method!=='GET'&&!origin)return fail(403);
 const token=(await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
 if(!token||!/^[A-Za-z0-9_-]{20,256}$/.test(token)||request.headers.get('X-Shida-Session')!==personalSessionBinding(token))return fail(401);
 const pdf=path[0]==='document',limit=pdf?10*1024*1024:40000;
 let body:Buffer|undefined;
 if(request.method==='POST'){
  if(request.headers.get('content-type')?.split(';')[0] !== (pdf?'application/pdf':'application/json'))return fail(415);
  if(Number(request.headers.get('content-length'))>limit)return fail(413);
  const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
  if(reader)for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>limit){await reader.cancel();return fail(413);}chunks.push(chunk.value);}
  body=Buffer.concat(chunks);
  if(!pdf)try{const value=JSON.parse(body.toString());if(!value||typeof value!=='object'||Array.isArray(value))return fail(422);}catch{return fail(422);}
 }
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');
  if(base.protocol!=='https:'||base.username||base.password)return fail(503);
  const url=new URL(`/api/dashboard/employment/candidate-onboarding${path.length?'/'+path[0]:''}`,base.origin);url.search=query.toString();
  const response=await fetch(url,{method:request.method,body:body?new Uint8Array(body).buffer:undefined,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(pdf?30000:12000),headers:{Cookie:`shida_dashboard_session=${token}`,Accept:'application/json',...(origin?{Origin:origin}:{}),...(body?{'Content-Type':pdf?'application/pdf':'application/json'}:{})}});
  if(response.status===401)await clearEmploymentToken();
  if(!response.ok)return fail(response.status>=400&&response.status<600?response.status:502);
  const value=await response.json();return Response.json(value,{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
export const GET=handle;export const POST=handle;
