import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../../lib/personal-request-origin';
import {PERSONAL_SESSION_COOKIE,PRIVATE_HEADERS,personalSessionBinding,clearEmploymentToken} from '../../../employment/route-utils';
export const dynamic='force-dynamic';
const fail=(status:number,detail='wenze_buyer_unavailable')=>Response.json({detail},{status,headers:PRIVATE_HEADERS});
const ref='[A-Za-z0-9_-]{4,64}';
function buyerRouteAllowed(path:string,method:string){
 if(method==='GET')return path==='saved'||new RegExp(`^(relations/(wenze_store|wenze_product)/${ref}|stores/${ref}/review-eligibility)$`).test(path);
 if(method==='PUT')return new RegExp(`^(relations/(wenze_store|wenze_product)/${ref}|stores/${ref}/review)$`).test(path);
 if(method==='POST')return new RegExp(`^stores/${ref}/(review/withdraw|reviews/${ref}/report)$`).test(path);
 return false;
}
async function handle(request:Request,context:{params:Promise<{path?:string[]}>}){
 const path=((await context.params).path??[]).join('/');
 if(!buyerRouteAllowed(path,request.method)||new URL(request.url).searchParams.size)return fail(404);
 if(request.headers.get('sec-fetch-site')==='cross-site')return fail(403);
 const origin=personalRequestOrigin(request);if(request.method!=='GET'&&!origin)return fail(403);
 const token=(await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
 if(!token||!/^[A-Za-z0-9_-]{20,256}$/.test(token)||request.headers.get('X-Shida-Session')!==personalSessionBinding(token))return fail(401);
 let body:string|undefined;
 if(request.method!=='GET'){
  if(!request.headers.get('content-type')?.startsWith('application/json'))return fail(415);
  const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
  if(reader)for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>16384){await reader.cancel();return fail(413);}chunks.push(chunk.value);}
  body=Buffer.concat(chunks).toString('utf8');try{const value=JSON.parse(body);if(!value||typeof value!=='object'||Array.isArray(value))return fail(422);}catch{return fail(422);}
 }
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');if(base.protocol!=='https:'||base.username||base.password)return fail(503);
  const response=await fetch(new URL(`/api/dashboard/personal/wenze-buyer/${path}`,base.origin),{method:request.method,headers:{Accept:'application/json',Cookie:`shida_dashboard_session=${token}`,...(origin?{Origin:origin}:{}),...(body?{'Content-Type':'application/json'}:{})},body,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000)});
  if(response.status===401)await clearEmploymentToken();
  if(!response.ok)return fail(response.status>=400&&response.status<600?response.status:502,response.status===409?'review_stale':undefined);
  return Response.json(await response.json(),{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
export const GET=handle,PUT=handle,POST=handle;
