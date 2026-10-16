export const dynamic='force-dynamic';
export async function GET(request:Request,context:{params:Promise<{store:string}>}){
 const {store}=await context.params,query=new URL(request.url).searchParams,page=query.get('page')??'1';
 const headers={'Cache-Control':'no-store'};
 if(!/^[A-Za-z0-9_-]{4,64}$/.test(store)||!/^[1-9]\d{0,3}$/.test(page)||[...query.keys()].some(k=>k!=='page')||query.getAll('page').length>1)return Response.json({detail:'invalid_request'},{status:400,headers});
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');if(base.protocol!=='https:'||base.username||base.password)throw Error();
  const response=await fetch(new URL(`/api/public/shida/wenze/stores/${store}/reviews?page=${page}`,base.origin),{cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error();
  return Response.json(await response.json(),{headers});
 }catch{return Response.json({detail:'reviews_unavailable'},{status:503,headers});}
}
