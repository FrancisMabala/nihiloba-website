import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../lib/personal-request-origin';
import {PERSONAL_SESSION_COOKIE, PRIVATE_HEADERS, personalSessionBinding} from '../../employment/route-utils';
export const dynamic='force-dynamic';
const fail=(status:number)=>Response.json({detail:'transactions_unavailable'},{status,headers:PRIVATE_HEADERS});
export async function GET(request:Request){
 const query=new URL(request.url).searchParams;
 const rules:Record<string,RegExp>={category:/^(all|orders|requests|documents)$/,page:/^[1-9]\d{0,3}$/,page_size:/^([1-9]|1\d|20)$/,sort:/^(recent|oldest)$/,language:/^(en|fr|ln|sw)$/};
 if([...query].some(([key,value])=>!rules[key]?.test(value)||query.getAll(key).length!==1))return fail(422);
 if(request.headers.get('sec-fetch-site')==='cross-site')return fail(403);
 const origin=personalRequestOrigin(request);
 if(!origin&&request.headers.get('sec-fetch-site')!=='same-origin')return fail(403);
 const token=(await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
 if(!token||!/^[A-Za-z0-9_-]{20,256}$/.test(token)||request.headers.get('x-shida-session')!==personalSessionBinding(token))return fail(401);
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');
  if(base.protocol!=='https:'||base.username||base.password)return fail(503);
  const target=new URL('/api/dashboard/personal/transactions',base.origin);target.search=query.toString();
  const response=await fetch(target,{cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:'application/json',Cookie:`shida_dashboard_session=${token}`,...(origin?{Origin:origin}:{})}});
  if(!response.ok)return fail(response.status>=400&&response.status<600?response.status:502);
  const data=await response.json();
  if(!data||!Array.isArray(data.items)||!data.counts)return fail(502);
  return Response.json(data,{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
