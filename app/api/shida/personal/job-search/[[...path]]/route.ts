import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../../lib/personal-request-origin';
import {PERSONAL_SESSION_COOKIE,PRIVATE_HEADERS,personalSessionBinding,clearEmploymentToken} from '../../../employment/route-utils';
export const dynamic='force-dynamic';
const fail=(status:number)=>Response.json({detail:'job_search_unavailable'},{status,headers:PRIVATE_HEADERS});
async function handle(request:Request,context:{params:Promise<{path?:string[]}>}){
 const path=(await context.params).path??[],query=new URL(request.url).searchParams,method=request.method;
 const reference=/^[A-Za-z0-9_-]{1,100}$/;
 const allowed=(method==='GET'&&path.length===1&&['saved','following','alerts'].includes(path[0]))
  ||(path.length===2&&['jobs','employers'].includes(path[0])&&reference.test(path[1])&&['GET','PUT'].includes(method))
  ||(path.length===2&&path[0]==='relations'&&/^REL_[a-f0-9]{64}$/.test(path[1])&&method==='DELETE')
  ||(path.length===3&&path[0]==='relations'&&/^REL_[a-f0-9]{64}$/.test(path[1])&&path[2]==='notifications'&&method==='PUT')
  ||(path.length===1&&path[0]==='alerts'&&method==='PUT');
 if(!allowed||[...query].length>2||query.getAll('language').length>1||query.getAll('page').length>1||[...query].some(([k,v])=>k==='language'?!['fr','en','ln','sw'].includes(v):k==='page'?method!=='GET'||!['saved','following'].includes(path[0])||!/^\d{1,5}$/.test(v)||Number(v)<1||Number(v)>10000:true))return fail(404);
 const origin=personalRequestOrigin(request);
 if(request.headers.get('sec-fetch-site')==='cross-site'||method!=='GET'&&!origin)return fail(403);
 const token=(await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
 if(!token||!/^[A-Za-z0-9_-]{20,256}$/.test(token)||request.headers.get('X-Shida-Session')!==personalSessionBinding(token))return fail(401);
 let body:string|undefined;
 if(method==='PUT'){
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return fail(415);
  const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
  if(reader)for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>2048){await reader.cancel();return fail(413);}chunks.push(chunk.value);}
  body=Buffer.concat(chunks).toString();
  try{const value=JSON.parse(body);if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.enabled!=='boolean'||Object.keys(value).some(k=>!['enabled',...(path[0]==='jobs'?['action']:[])].includes(k))||path[0]==='jobs'&&!['save','follow'].includes(value.action))return fail(422);}catch{return fail(422);}
 }
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');
  if(base.protocol!=='https:'||base.username||base.password)return fail(503);
  const url=new URL(`/api/dashboard/employment/job-search/${path.map(encodeURIComponent).join('/')}`,base.origin);url.search=query.toString();
  const response=await fetch(url,{method,body,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Cookie:`shida_dashboard_session=${token}`,Accept:'application/json',...(origin?{Origin:origin}:{}),...(body?{'Content-Type':'application/json'}:{})}});
  if(response.status===401)await clearEmploymentToken();
  if(!response.ok)return fail(response.status>=400&&response.status<600?response.status:502);
  return Response.json(await response.json(),{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
export const GET=handle;export const PUT=handle;export const DELETE=handle;
