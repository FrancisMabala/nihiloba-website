import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../lib/personal-request-origin';
import {PRIVATE_HEADERS} from '../../employment/route-utils';
export const dynamic='force-dynamic';
const cookieName='__Host-shida-recovery';
const fail=(status:number)=>Response.json({detail:'recovery_unavailable'},{status,headers:PRIVATE_HEADERS});
export async function POST(request:Request,context:{params:Promise<{path?:string[]}>}){
 const path=((await context.params).path??[]).join('/');
 if(!['','verify','status','phone/start','phone/verify','complete'].includes(path)||new URL(request.url).search)return fail(404);
 const origin=personalRequestOrigin(request);if(!origin||request.headers.get('sec-fetch-site')==='cross-site')return fail(403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return fail(415);
 const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
 if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>20000){await reader.cancel();return fail(413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 let payload:Record<string,unknown>;try{payload=JSON.parse(new TextDecoder().decode(bytes));if(!payload||Array.isArray(payload)||typeof payload!=='object')return fail(422);}catch{return fail(422);}
 const jar=await cookies();
 if(path){const saved=jar.get(cookieName)?.value?.split('.');if(!saved||saved.length!==2||!/^REC_[A-Za-z0-9_-]+$/.test(saved[0])||!/^[A-Za-z0-9_-]{32,128}$/.test(saved[1]))return fail(401);payload.reference=saved[0];payload.browser_token=saved[1];}
 else if('browser_token' in payload||'reference' in payload)return fail(422);
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');if(base.protocol!=='https:'||base.username||base.password)return fail(503);
  const response=await fetch(new URL(`/api/account-recovery${path?'/'+path:''}`,base.origin),{method:'POST',body:JSON.stringify(payload),cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json',Origin:origin}});
  const data=await response.json();if(!response.ok)return fail(response.status>=400&&response.status<600?response.status:502);
  if(!path){if(!/^REC_[A-Za-z0-9_-]+$/.test(data.reference)||!/^[A-Za-z0-9_-]{32,128}$/.test(data.browser_token))return fail(502);jar.set(cookieName,`${data.reference}.${data.browser_token}`,{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:40*86400});return Response.json({reference:data.reference},{headers:PRIVATE_HEADERS});}
  if(path==='complete')jar.set(cookieName,'',{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:0});
  return Response.json(data,{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
