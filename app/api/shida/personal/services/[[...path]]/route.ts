import {transactionPath,transactionQuery,transactionSearch} from "../../../../../lib/services-transaction-contract";
import {cookies} from "next/headers";
import {personalRequestOrigin} from "../../../../../lib/personal-request-origin";
import {PERSONAL_SESSION_COOKIE,PRIVATE_HEADERS,personalSessionBinding,clearEmploymentToken} from "../../../employment/route-utils";

export const dynamic="force-dynamic";
type Context={params:Promise<{path?:string[]}>};
const fail=(status:number,detail="service_unavailable")=>Response.json({detail},{status,headers:PRIVATE_HEADERS});
function allowed(parts:string[],method:string){
 if(parts.length===0)return method==="GET"||method==="POST";
 if(parts.length===1&&["capabilities","calendar","today"].includes(parts[0]))return method==="GET";
 if(!/^SVC_[A-Za-z0-9_-]+$/.test(parts[0]))return false;
 if(parts.length===1)return ["GET","PATCH","DELETE"].includes(method);
 if(parts.length===2&&parts[1]==="schedule")return ["GET","PATCH"].includes(method);
 if(parts.length===2&&parts[1]==="share")return method==="GET";
 if(parts.length===2)return parts[1]==="reactivate"&&method==="POST"||["details","professional-profile","professional-work"].includes(parts[1])&&method==="PATCH"||parts[1]==="pilot-review"&&["GET","PATCH"].includes(method)||parts[1]==="reviews"&&method==="GET"||parts[1]==="request-capability"&&method==="PATCH"||parts[1]==="packages"&&method==="POST";
 if(parts[1]!=="packages"||!/^SPK_[A-Za-z0-9_-]+$/.test(parts[2]))return false;
 if(parts.length===3)return method==="PATCH";
 return parts.length===4&&parts[3]==="archive"&&method==="POST";
}
async function handle(request:Request,context:Context){
 const parts=(await context.params).path??[];
 const query=new URL(request.url).searchParams;
 const transaction=transactionPath(parts,request.method);
 const lifecycle=/^SVC_[A-Za-z0-9_-]+$/.test(parts[0]??"")&&(parts.length===1&&request.method==="DELETE"||parts.length===2&&parts[1]==="reactivate"&&request.method==="POST");
 const lifecycleQuery=lifecycle&&[...query].length===1&&/^[1-9][0-9]{0,8}$/.test(query.get("expected_revision")??"");
 const calendar=parts.length===1&&parts[0]==="calendar"&&request.method==="GET";
 const localized=(parts.length===1&&parts[0]==="today"||parts.length===2&&["reviews","share"].includes(parts[1]))&&request.method==="GET";
 const unique=[...query.keys()].length===new Set(query.keys()).size;
 const calendarQuery=calendar&&unique&&[...query.keys()].every(key=>["date_from","date_to","page","offering_ref"].includes(key))&&/^\d{4}-\d{2}-\d{2}$/.test(query.get("date_from")??"")&&/^\d{4}-\d{2}-\d{2}$/.test(query.get("date_to")??"")&&(!query.has("page")||/^[1-9][0-9]{0,3}$/.test(query.get("page")!))&&(!query.has("offering_ref")||/^SVC_[A-Za-z0-9_-]+$/.test(query.get("offering_ref")!));
 const sharing=parts.length===2&&parts[1]==="share";
 const shareQuery=unique&&[...query.keys()].every(key=>["language","target"].includes(key))&&(!query.has("language")||["en","fr","ln","sw"].includes(query.get("language")!))&&(!query.has("target")||["profile","service"].includes(query.get("target")!));
 const validQuery=sharing?shareQuery:calendar?calendarQuery:lifecycle?lifecycleQuery:localized?(![...query].length||[...query].length===1&&["fr","en","ln","sw"].includes(query.get("language")??"")):![...query].length;
 if(transaction?!transactionQuery(parts,query,request.method):(!allowed(parts,request.method)||!validQuery))return fail(404);
 if(request.headers.get("sec-fetch-site")==="cross-site")return fail(403);
 const origin=personalRequestOrigin(request);
 if(request.method!=="GET"&&!origin)return fail(403);
 const token=(await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
 if(!token||!/^[A-Za-z0-9_-]{20,256}$/.test(token)||request.headers.get("X-Shida-Session")!==personalSessionBinding(token))return fail(401);
 let body:string|undefined;
 const bodyLimit=parts[0]==="transactions"&&parts[1]==="competition"?65536:10000;
 if(request.method!=="GET"){
  if(!request.headers.get("content-type")?.startsWith("application/json"))return fail(415);
  if(Number(request.headers.get("content-length"))>bodyLimit)return fail(413);
  const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
  if(reader)for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>bodyLimit){await reader.cancel();return fail(413);}chunks.push(part.value);}
  const raw=Buffer.concat(chunks).toString("utf8");
  try{const value:unknown=JSON.parse(raw);if(!value||typeof value!=="object"||Array.isArray(value))return fail(422);}catch{return fail(422);}
  body=raw;
 }
 const key=request.headers.get("Idempotency-Key");
 if(methodNeedsKey(parts,request.method)&&(!key||!/^[A-Za-z0-9_-]{1,200}$/.test(key)))return fail(422);
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??"https://api.nihiloba.com");
  if(base.protocol!=="https:"||base.username||base.password)return fail(503);
  const target=new URL(transaction?`/api/dashboard/${transaction}`:`/api/dashboard/service-profiles${parts.length?`/${parts.join("/")}`:""}`,base.origin);
  if(transaction)target.search=transactionSearch(parts,query).toString();
  if(lifecycle)target.search=new URLSearchParams({expected_revision:query.get("expected_revision")!}).toString();
  if(calendar)target.search=query.toString();
  if(localized)target.search=new URLSearchParams({language:query.get("language")??"fr"}).toString();
  if(sharing&&query.has("target"))target.searchParams.set("target",query.get("target")!);
  const response=await fetch(target,{method:request.method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(12000),headers:{Accept:"application/json",Cookie:`shida_dashboard_session=${token}`,...(origin?{Origin:origin}:{}),...(body?{"Content-Type":"application/json"}:{}),...(key&&methodNeedsKey(parts,request.method)?{"Idempotency-Key":key}:{})},body});
  if(response.status===401)await clearEmploymentToken();
  if(transaction?.endsWith('.csv'))return new Response(await response.arrayBuffer(),{status:response.status,headers:{...PRIVATE_HEADERS,"Content-Type":response.ok?"text/csv; charset=utf-8":"application/json",...(response.ok?{"Content-Disposition":response.headers.get("content-disposition")??"attachment; filename=services-report.csv"}:{})}});
  const value=await response.json().catch(()=>null);
  if(!response.ok)return fail(response.status>=400&&response.status<600?response.status:502);
  if(!value||typeof value!=="object"||Array.isArray(value))return fail(502);
  return Response.json(value,{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
const methodNeedsKey=(parts:string[],method:string)=>method==="POST"&&(parts.length===0||parts[0]==="transactions"&&parts[1]==="finance");
export const GET=handle;export const POST=handle;export const PATCH=handle;export const DELETE=handle;
export const PUT=()=>fail(405);export const HEAD=PUT;export const OPTIONS=PUT;
