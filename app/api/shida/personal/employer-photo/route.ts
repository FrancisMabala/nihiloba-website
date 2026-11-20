import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../lib/personal-request-origin';
import {PERSONAL_SESSION_COOKIE,PRIVATE_HEADERS,personalSessionBinding,clearEmploymentToken} from '../../employment/route-utils';
export const dynamic='force-dynamic';
const policy='public-personal-employer-photo-v1',limit=5*1024*1024;
const asset=/^AST_[A-Za-z0-9_-]{1,76}$/,offer=/^JOB_[A-Za-z0-9_-]{1,60}$/,version=/^[a-f0-9]{64}$/;
const fail=(status:number)=>Response.json({detail:'employer_photo_unavailable'},{status,headers:PRIVATE_HEADERS});
async function bytes(stream:ReadableStream<Uint8Array>|null,maximum:number){const reader=stream?.getReader(),chunks:Uint8Array[]=[];let total=0;if(reader)for(;;){const part=await reader.read();if(part.done)break;total+=part.value.length;if(total>maximum){await reader.cancel();return null;}chunks.push(part.value);}return Buffer.concat(chunks);}
async function handle(request:Request){
 const query=new URL(request.url).searchParams,method=request.method,preview=method==='GET'&&query.has('asset_ref');
 if(!['GET','POST','DELETE'].includes(method))return fail(405);
 const keys=preview?['asset_ref']:method==='GET'?['offer_ref']:method==='POST'?['offer_ref','version','policy','public_consent']:[];
 if(query.size!==keys.length||[...query.keys()].some(key=>!keys.includes(key)||query.getAll(key).length!==1))return fail(404);
 if(preview?!asset.test(query.get('asset_ref')??''):method!=='DELETE'&&!offer.test(query.get('offer_ref')??''))return fail(404);
 if(method==='POST'&&(!version.test(query.get('version')??'')||query.get('policy')!==policy||query.get('public_consent')!=='true'))return fail(422);
 const origin=personalRequestOrigin(request);if(request.headers.get('sec-fetch-site')==='cross-site'||method!=='GET'&&!origin)return fail(403);
 const token=(await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;if(!token||!/^[A-Za-z0-9_-]{20,256}$/.test(token)||request.headers.get('X-Shida-Session')!==personalSessionBinding(token))return fail(401);
 try{
  let body:Buffer|undefined,reference=query.get('offer_ref');const contentType=request.headers.get('content-type')?.split(';')[0];
  if(method!=='GET'){
   if(method==='POST'?!['image/jpeg','image/png','image/webp'].includes(contentType??''):contentType!=='application/json')return fail(415);
   const maximum=method==='POST'?limit:1024;if(Number(request.headers.get('content-length'))>maximum)return fail(413);const data=await bytes(request.body,maximum);if(!data)return fail(413);body=data;
   if(method==='DELETE'){
    let value;try{value=JSON.parse(body.toString());}catch{return fail(422);}
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==2||!offer.test(value.offer_ref??'')||!version.test(value.version??''))return fail(422);reference=value.offer_ref;
   }
  }
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');if(base.protocol!=='https:'||base.username||base.password)return fail(503);
  const url=new URL(preview?'/api/assets/'+query.get('asset_ref'):'/api/dashboard/employment/personal-offer-onboarding/employer-photo',base.origin);if(!preview)url.search=query.toString();
  const response=await fetch(url,{method,body:body?new Uint8Array(body).buffer:undefined,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(30000),headers:{Cookie:`shida_dashboard_session=${token}`,Accept:preview?'image/jpeg':'application/json',...(origin?{Origin:origin}:{}),...(body?{'Content-Type':contentType!}:{})}});
  if(response.status===401)await clearEmploymentToken();if(!response.ok)return fail(response.status>=400&&response.status<600?response.status:502);
  if(preview){
   if(response.headers.get('content-type')?.split(';')[0]!=='image/jpeg'||Number(response.headers.get('content-length'))>limit){await response.body?.cancel();return fail(502);}
   const data=await bytes(response.body,limit);if(!data?.length)return fail(502);return new Response(new Uint8Array(data).buffer,{headers:{...PRIVATE_HEADERS,'Content-Type':'image/jpeg','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'}});
  }
  const value=await response.json();if(value?.offer_ref!==reference||!version.test(value?.version??'')||value?.policy!==policy||value.photo!==null&&!asset.test(value?.photo?.asset_ref??''))return fail(502);
  // Provider URLs and all unrecognized metadata stay behind the owner boundary.
  return Response.json({offer_ref:value.offer_ref,version:value.version,policy,photo:value.photo?{asset_ref:value.photo.asset_ref}:null},{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
export const GET=handle;export const POST=handle;export const DELETE=handle;
