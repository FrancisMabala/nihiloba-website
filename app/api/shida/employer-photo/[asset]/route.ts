import {publicJobsApiBase} from '../../public-jobs/route-utils';
export const dynamic='force-dynamic';
const maximum=5*1024*1024,headers={'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache','X-Content-Type-Options':'nosniff'};
const fail=(status:number)=>Response.json({detail:'employer_photo_unavailable'},{status,headers});
export async function GET(request:Request,context:{params:Promise<{asset:string}>}){
 const {asset}=await context.params;if(!/^AST_[A-Za-z0-9_-]{1,76}$/.test(asset)||new URL(request.url).search)return fail(404);
 try{
  const response=await fetch(publicJobsApiBase()+'/api/public/emploi/employer-photos/'+asset,{cache:'no-store',credentials:'omit',redirect:'manual',signal:AbortSignal.timeout(15000),headers:{Accept:'image/jpeg'}});
  if(!response.ok)return fail(response.status===404?404:502);
  if(response.headers.get('content-type')?.split(';')[0]!=='image/jpeg'||Number(response.headers.get('content-length'))>maximum){await response.body?.cancel();return fail(502);}
  const reader=response.body?.getReader(),chunks:Uint8Array[]=[];let size=0;if(reader)for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>maximum){await reader.cancel();return fail(502);}chunks.push(part.value);}
  if(!size)return fail(502);return new Response(new Uint8Array(Buffer.concat(chunks)).buffer,{headers:{...headers,'Content-Type':'image/jpeg','Content-Disposition':'inline'}});
 }catch{return fail(503);}
}
