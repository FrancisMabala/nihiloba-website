import {PRIVATE_HEADERS} from '../../employment/route-utils';
export const dynamic='force-dynamic';
export async function GET(request:Request,context:{params:Promise<{path?:string[]}>}){
 const path=((await context.params).path??[]).join('/'),url=new URL(request.url);
 const fail=(status:number)=>Response.json({detail:'meda_unavailable'},{status,headers:PRIVATE_HEADERS});
 if(!/^listings(?:\/MED_[A-Za-z0-9_-]{1,60})?$/.test(path))return fail(404);
 if([...url.searchParams.keys()].some(k=>!['category','side','origin','destination','after','page'].includes(k)||url.searchParams.getAll(k).length!==1)||url.search.length>1000)return fail(422);
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');
  if(base.protocol!=='https:'||base.username||base.password)return fail(503);
  const response=await fetch(new URL(`/api/meda/${path}${url.search}`,base.origin),{cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
  if(!response.ok)return fail(response.status>=400&&response.status<600?response.status:502);
  return Response.json(await response.json(),{headers:PRIVATE_HEADERS});
 }catch{return fail(503);}
}
