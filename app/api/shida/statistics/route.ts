import {personalRequestOrigin} from '../../../lib/personal-request-origin';
import {publicJobsApiBase} from '../public-jobs/route-utils';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, max-age=0','Pragma':'no-cache'};
const fail=(status:number)=>Response.json({detail:'statistics_unavailable'},{status,headers});
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const groups={page_group:['nihiloba','shida','employment','employer','wenze','restaurants','services','apartments','hotels','transport','meda','account','help','other'],device:['phone','tablet','desktop','other'],browser:['chrome','safari','firefox','edge','opera','other'],language:['fr','en','ln','sw','other'],source:['direct','search','social','internal','other']};
export async function POST(request:Request){
 const origin=personalRequestOrigin(request);if(!origin)return fail(403);
 if(new URL(request.url).search)return fail(404);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return fail(415);
 if(Number(request.headers.get('content-length'))>2048)return fail(413);
 try{
  const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
  if(reader)for(;;){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>2048){await reader.cancel();return fail(413);}chunks.push(item.value);}
  let value:Record<string,unknown>;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return fail(422);}
  if(!value||typeof value!=='object'||Array.isArray(value))return fail(422);
  const keys=['consent','policy','visitor','session','visit','active_seconds',...Object.keys(groups)];
  if(Object.keys(value).length!==keys.length||Object.keys(value).some(key=>!keys.includes(key))||value.consent!==true||value.policy!=='web-statistics-v1')return fail(422);
  if(['visitor','session','visit'].some(key=>typeof value[key]!=='string'||!uuid.test(value[key] as string)))return fail(422);
  if(Object.entries(groups).some(([key,allowed])=>typeof value[key]!=='string'||!allowed.includes(value[key] as string)))return fail(422);
  if(!Number.isInteger(value.active_seconds)||(value.active_seconds as number)<0||(value.active_seconds as number)>14400)return fail(422);
  const response=await fetch(publicJobsApiBase()+'/api/public/shida/statistics',{method:'POST',redirect:'manual',cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000),headers:{Origin:origin,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(value)});
  return response.status===204?new Response(null,{status:204,headers}):fail(response.status===429?429:503);
 }catch{return fail(503);}
}
