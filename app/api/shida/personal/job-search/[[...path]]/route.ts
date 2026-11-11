import {jobLocation} from '../../../../../lib/job-location';
import {getJob,getJobEmployer,ShidaApiError} from '../../../../../services/shida/public-client';
import {JOB_PREVIEW_LIMIT,type JobSearchItem,type JobSearchList} from '../../../../../lib/job-search-api';
import {safePublicImageUrl} from '../../../../../lib/safe-public-url';
import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../../lib/personal-request-origin';
import {PERSONAL_SESSION_COOKIE,PRIVATE_HEADERS,personalSessionBinding,clearEmploymentToken} from '../../../employment/route-utils';
export const dynamic='force-dynamic';
const fail=(status:number)=>Response.json({detail:'job_search_unavailable'},{status,headers:PRIVATE_HEADERS});
// The personal list owns the count and the references. Supplement only its visible
// preview rows with display fields from the same public projections as their links.
async function enrich(list:JobSearchList,locale:'en'|'fr'|'ln'|'sw',preview:boolean){
 const items=await Promise.all((preview?list.items.slice(0,JOB_PREVIEW_LIMIT):list.items).map(async(item:JobSearchItem)=>{
  if(!item.available||!item.reference)return item;
  try{
   if(item.kind==='job'){
    const job=await getJob(item.reference,locale);
    return {...item,location:jobLocation(job),status:['expired','archived','closed','source_invalid'].includes(job.lifecycle_state)?job.lifecycle_state:item.status};
   }
   const employer=item.employer_ref||(item.kind==='organization_directory'?item.reference:null);
   if(employer){
    const profile=await getJobEmployer(employer,locale);
    return {...item,logo:safePublicImageUrl(profile.profile_image?.url)};
   }
  }catch(error){if(error instanceof ShidaApiError&&error.kind==='not-found')return {...item,available:false,reference:null};/* The optional location or logo must not hide a saved record. */}
  return item;
 }));
 return {...list,items};
}
async function handle(request:Request,context:{params:Promise<{path?:string[]}>}){
 const path=(await context.params).path??[],query=new URL(request.url).searchParams,method=request.method;
 const reference=/^[A-Za-z0-9_-]{1,100}$/;
 const allowed=(method==='GET'&&path.length===1&&['saved','following','alerts'].includes(path[0]))
  ||(path.length===2&&['jobs','employers'].includes(path[0])&&reference.test(path[1])&&['GET','PUT'].includes(method))
  ||(path.length===2&&path[0]==='relations'&&/^REL_[a-f0-9]{64}$/.test(path[1])&&method==='DELETE')
  ||(path.length===3&&path[0]==='relations'&&/^REL_[a-f0-9]{64}$/.test(path[1])&&path[2]==='notifications'&&method==='PUT')
  ||(path.length===1&&path[0]==='alerts'&&method==='PUT');
 const overview=method==='GET'&&path.length===1&&['saved','following'].includes(path[0])&&query.getAll('preview').length===1&&query.get('preview')==='1'&&!query.has('page');
 if(overview)query.delete('preview');
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
  const result=await response.json();
  return Response.json(overview||method==='GET'&&path[0]==='saved'?await enrich(result,(query.get('language')||'fr') as 'en'|'fr'|'ln'|'sw',overview):result,{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
export const GET=handle;export const PUT=handle;export const DELETE=handle;
