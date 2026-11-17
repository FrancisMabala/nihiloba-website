import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../../lib/personal-request-origin';
import {PERSONAL_SESSION_COOKIE,PRIVATE_HEADERS,personalSessionBinding} from '../../../employment/route-utils';
export const dynamic='force-dynamic';
type Context={params:Promise<{path?:string[]}>};
async function handle(request:Request,context:Context){
 const path=((await context.params).path??[]).join('/'),url=new URL(request.url);
 const fail=(status:number,detail='meda_unavailable')=>Response.json({detail},{status,headers:PRIVATE_HEADERS});
 const read=request.method==='GET';
 const allowed=read?/^(listings(?:\/MED_[A-Za-z0-9_-]{1,60})?|enquiries(?:\/MEQ_[A-Za-z0-9_-]{1,60})?)$/:/^(listings(?:\/MED_[A-Za-z0-9_-]{1,60}(?:\/enquiries)?)?|enquiries\/MEQ_[A-Za-z0-9_-]{1,60}\/(messages|close|read))$/;
 if(!allowed.test(path))return fail(404);
 if([...url.searchParams.keys()].some(k=>!(read?['page','before']:[]).includes(k)||url.searchParams.getAll(k).length!==1)||url.search.length>200)return fail(422);
 const origin=personalRequestOrigin(request);
 if(request.headers.get('sec-fetch-site')==='cross-site'||!read&&!origin)return fail(403);
 const token=(await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
 if(!token||!/^[A-Za-z0-9_-]{20,256}$/.test(token)||request.headers.get('x-shida-session')!==personalSessionBinding(token))return fail(401);
 let body:string|undefined;
 if(!read){
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return fail(415);
  const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
  if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();return fail(413);}chunks.push(value);}
  body=Buffer.concat(chunks).toString();
  try{const value=JSON.parse(body);if(!value||typeof value!=='object'||Array.isArray(value))return fail(422);}catch{return fail(422);}
 }
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');
  if(base.protocol!=='https:'||base.username||base.password)return fail(503);
  const response=await fetch(new URL(`/api/dashboard/personal/meda/${path}${url.search}`,base.origin),{method:request.method,body,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(15000),headers:{Cookie:`shida_dashboard_session=${token}`,Accept:'application/json',...(origin?{Origin:origin}:{}),...(body?{'Content-Type':'application/json'}:{})}});
  if(!response.ok){const value=await response.json().catch(()=>null);const code=['meda_contact','meda_expired','meda_stale','meda_closed','meda_invalid','meda_personal_required'].includes(value?.detail)?value.detail:'meda_unavailable';return fail(response.status>=400&&response.status<600?response.status:502,code);}
  return Response.json(await response.json(),{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
export const GET=handle;
export const POST=handle;
