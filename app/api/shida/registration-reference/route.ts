import {personalRequestOrigin} from '../../../lib/personal-request-origin';
import {privateEmploymentJson} from '../employment/route-utils';
export const dynamic='force-dynamic';
async function handle(request:Request){
 const url=new URL(request.url),language=url.searchParams.get('language')||'en',q=url.searchParams.get('q')||'';
 if(!['en','fr','ln','sw'].includes(language)||q.length>150||[...url.searchParams.keys()].some(key=>!['language','q'].includes(key)))return privateEmploymentJson({error:{code:'invalid_fields'}},422);
 const origin=personalRequestOrigin(request,true);
 if(!origin)return privateEmploymentJson({error:{code:'forbidden'}},403);
 let body:string|undefined;
 if(request.method==='POST'){
  if(Number(request.headers.get('content-length')||0)>1024)return privateEmploymentJson({error:{code:'invalid_fields'}},413);
  try{
   const reader=request.body?.getReader();let size=0;const chunks:Uint8Array[]=[];
   if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1024){await reader.cancel();return privateEmploymentJson({error:{code:'invalid_fields'}},413);}chunks.push(value);}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   const data=JSON.parse(new TextDecoder().decode(bytes));if(typeof data.name!=='string'||data.name.length<2||data.name.length>150||Object.keys(data).length!==1)throw Error();body=JSON.stringify({name:data.name});
  }catch{return privateEmploymentJson({error:{code:'invalid_fields'}},422);}
 }
 try{
  const upstream=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');if(upstream.protocol!=='https:'||upstream.username||upstream.password)throw Error();
  const path=request.method==='POST'?'country-suggestions':`countries?${new URLSearchParams({language,q})}`;
  const response=await fetch(`${upstream.origin}/api/dashboard/registration/reference/${path}`,{method:request.method,body,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Origin:origin,'Content-Type':'application/json'}});
  if(!response.ok)return privateEmploymentJson({error:{code:'unavailable'}},response.status);
  return privateEmploymentJson(await response.json());
 }catch{return privateEmploymentJson({error:{code:'unavailable'}},503);}
}
export const GET=handle;
export const POST=handle;
