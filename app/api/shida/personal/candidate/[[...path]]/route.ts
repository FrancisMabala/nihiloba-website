import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../../lib/personal-request-origin';
import {PERSONAL_SESSION_COOKIE,PRIVATE_HEADERS,personalSessionBinding,clearEmploymentToken} from '../../../employment/route-utils';
export const dynamic='force-dynamic';
const fail=(status:number)=>Response.json({detail:'candidate_unavailable'},{status,headers:PRIVATE_HEADERS});
const photoLimit=5*1024*1024;
const imageTypes=new Set(['image/jpeg','image/png','image/webp']);
async function boundedBody(stream:ReadableStream<Uint8Array>|null,limit:number){
 const reader=stream?.getReader(),chunks:Uint8Array[]=[];let size=0;
 if(reader)for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>limit){await reader.cancel();return null;}chunks.push(chunk.value);}
 return Buffer.concat(chunks);
}
async function handle(request:Request,context:{params:Promise<{path?:string[]}>}){
 const path=(await context.params).path??[],query=new URL(request.url).searchParams;
 const name=path[0]??'',method=request.method;
 const allowed:Record<string,string[]>={'':['GET','POST'],profile:['POST'],document:['POST'],'title-suggestions':['GET'],photo:['GET','POST','DELETE']};
 if(path.length>1||!allowed[name]?.includes(method))return fail(404);
 const queryKeys=name==='title-suggestions'?['language','category','query']:name==='photo'&&method==='GET'?['asset_ref']:name==='photo'&&method==='POST'?['language','target','reference','revision','version']:['language'];
 if([...query.keys()].some(key=>!queryKeys.includes(key)||query.getAll(key).length!==1))return fail(404);
 if(query.has('language')&&!['fr','en','ln','sw'].includes(query.get('language')!))return fail(404);
 if(name==='title-suggestions'&&(!/^[a-z][a-z0-9_]{0,63}$/.test(query.get('category')??'')||(query.get('query')??'').length>80))return fail(404);
 const photoRead=name==='photo'&&method==='GET',photoUpload=name==='photo'&&method==='POST';
 if(photoRead&&!/^AST_[A-Za-z0-9_-]{1,76}$/.test(query.get('asset_ref')??''))return fail(404);
 if(photoUpload){
  const target=query.get('target'),ref=query.get('reference')??'';
  if(!['draft','profile'].includes(target??'')||!/^(COP|CND)_[A-Za-z0-9_-]{1,70}$/.test(ref))return fail(404);
  if(target==='draft'&&(!/^\d{1,10}$/.test(query.get('revision')??'')||query.has('version')))return fail(404);
  if(target==='profile'&&(!(query.get('version')??'').length||(query.get('version')??'').length>64||query.has('revision')))return fail(404);
 }
 const origin=personalRequestOrigin(request);
 if(request.headers.get('sec-fetch-site')==='cross-site'||method!=='GET'&&!origin)return fail(403);
 const token=(await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
 if(!token||!/^[A-Za-z0-9_-]{20,256}$/.test(token)||request.headers.get('X-Shida-Session')!==personalSessionBinding(token))return fail(401);
 const pdf=name==='document',limit=photoUpload?photoLimit:pdf?10*1024*1024:40000;
 let body:Buffer|undefined;
 const contentType=request.headers.get('content-type')?.split(';')[0];
 if(method==='POST'||method==='DELETE'){
  if(photoUpload?!imageTypes.has(contentType??''):contentType!==(pdf?'application/pdf':'application/json'))return fail(415);
  if(Number(request.headers.get('content-length'))>limit)return fail(413);
  const bytes=await boundedBody(request.body,limit);if(!bytes)return fail(413);body=bytes;
  if(!pdf&&!photoUpload)try{const value=JSON.parse(body.toString());if(!value||typeof value!=='object'||Array.isArray(value))return fail(422);}catch{return fail(422);}
 }
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');
  if(base.protocol!=='https:'||base.username||base.password)return fail(503);
  const url=new URL(photoRead?`/api/assets/${query.get('asset_ref')}`:`/api/dashboard/employment/candidate-onboarding${name?'/'+name:''}`,base.origin);
  if(!photoRead)url.search=query.toString();
  const response=await fetch(url,{method,body:body?new Uint8Array(body).buffer:undefined,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(pdf||photoUpload||photoRead?30000:12000),headers:{Cookie:`shida_dashboard_session=${token}`,Accept:photoRead?'image/jpeg':'application/json',...(origin?{Origin:origin}:{}),...(body?{'Content-Type':contentType!}:{})}});
  if(response.status===401)await clearEmploymentToken();
  if(!response.ok)return fail(response.status>=400&&response.status<600?response.status:502);
  if(photoRead){
   if(response.headers.get('content-type')?.split(';')[0]!=='image/jpeg')return fail(502);
   if(Number(response.headers.get('content-length'))>photoLimit){await response.body?.cancel();return fail(502);}
   const bytes=await boundedBody(response.body,photoLimit);if(!bytes||!bytes.length)return fail(502);
   return new Response(new Uint8Array(bytes).buffer,{headers:{...PRIVATE_HEADERS,'Content-Type':'image/jpeg','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'}});
  }
  const value=await response.json();return Response.json(value,{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
export const GET=handle;export const POST=handle;export const DELETE=handle;