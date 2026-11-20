import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../../lib/personal-request-origin';
import {customerRoute,receiptBody,receiptCodes} from '../../../../../lib/customer-receipt-contract';
import {PERSONAL_SESSION_COOKIE,PRIVATE_HEADERS,personalSessionBinding,clearEmploymentToken} from '../../../employment/route-utils';
export const dynamic='force-dynamic';
async function bytes(stream:ReadableStream<Uint8Array>|null,limit:number){const chunks:Uint8Array[]=[];let size=0;const reader=stream?.getReader();if(reader)for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>limit){await reader.cancel();throw Error();}chunks.push(part.value);}return Buffer.concat(chunks);}
async function handle(request:Request,context:{params:Promise<{path:string[]}>}){
 const fail=(status:number,detail='customer_receipt_unavailable')=>Response.json({detail},{status,headers:PRIVATE_HEADERS});
 const path=(await context.params).path.join('/'),target=customerRoute(path,request.method),query=new URL(request.url).searchParams;
 if(!target)return fail(404);
 if([...query].some(([key,value])=>path!=='receipts'||!['offset','limit'].includes(key)||query.getAll(key).length!==1||!/^\d{1,5}$/.test(value)||Number(value)>(key==='limit'?50:10000)||key==='limit'&&Number(value)<1))return fail(422);
 const origin=personalRequestOrigin(request);if(request.headers.get('sec-fetch-site')==='cross-site'||request.method!=='GET'&&!origin)return fail(403);
 const token=(await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
 if(!token||!/^[A-Za-z0-9_-]{20,256}$/.test(token)||request.headers.get('X-Shida-Session')!==personalSessionBinding(token))return fail(401);
 let body:string|undefined;
 if(request.method==='POST'){if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return fail(415);try{body=(await bytes(request.body,2048)).toString();if(!receiptBody(path,JSON.parse(body)))return fail(422);}catch{return fail(422);}}
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');if(base.protocol!=='https:'||base.username||base.password)return fail(503);
  const url=new URL('/api/dashboard/personal/'+target,base.origin);url.search=query.toString();const png=path==='id/qr';
  const response=await fetch(url,{method:request.method,body,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Cookie:`shida_dashboard_session=${token}`,Origin:origin??new URL(request.url).origin,Accept:png?'image/png':'application/json',...(body?{'Content-Type':'application/json'}:{})}});
  if(response.status===401)await clearEmploymentToken();const data=await bytes(response.body,png?100000:1000000);
  if(!response.ok){let detail;try{detail=JSON.parse(data.toString()).detail;}catch{}return fail(response.status>=400&&response.status<600?response.status:502,receiptCodes.has(detail)?detail:undefined);}
  if(png){if(response.headers.get('content-type')?.split(';')[0]!=='image/png'||!data.length)return fail(502);return new Response(new Uint8Array(data),{headers:{...PRIVATE_HEADERS,'Content-Type':'image/png','X-Content-Type-Options':'nosniff'}});}
  return Response.json(JSON.parse(data.toString()),{status:response.status,headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
export const GET=handle;export const POST=handle;
