import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../../../lib/personal-request-origin';
import {privateEmploymentJson as json,setEmploymentToken} from '../../../../employment/route-utils';
export const dynamic='force-dynamic';
const COOKIE='nihiloba_email_attempt';
const options={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/api/shida'};
type Context={params:Promise<{action:string}>};
function secret(response:Response,name:string){
 for(const line of response.headers.getSetCookie()){
  const pair=line.split(';')[0];
  if(pair.startsWith(name+'=')){const value=pair.slice(name.length+1);if(/^[A-Za-z0-9_-]{32,128}$/.test(value))return value;}
 }
 return null;
}
async function payload(request:Request){
 const reader=request.body?.getReader();if(!reader)throw Error();
 const decoder=new TextDecoder();let raw='';let bytes=0;
 for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2048){await reader.cancel();throw Error();}raw+=decoder.decode(value,{stream:true});}
 raw+=decoder.decode();const value=JSON.parse(raw);
 if(!value||Array.isArray(value)||typeof value!=='object')throw Error();return value;
}
async function handle(request:Request,context:Context){
 const origin=personalRequestOrigin(request,true),{action}=await context.params;
 if(!origin)return json({error:{code:'forbidden'}},403);
 if(!['capabilities','start','verify','cancel'].includes(action)||new URL(request.url).search||request.method!==(action==='capabilities'?'GET':'POST'))return json({},404);
 const jar=await cookies();
 if(action==='cancel'){jar.set(COOKIE,'',{...options,maxAge:0});return json({cancelled:true});}
 if(process.env.SHIDA_EMAIL_LOGIN_ENABLED!=='true')return action==='capabilities'?json({enabled:false}):json({error:{code:'unavailable'}},404);
 const [reference,deadline,verifier]=(jar.get(COOKIE)?.value??'').split('.');
 let body:string|undefined;
 if(action!=='capabilities'){
  try{
   const value=await payload(request);
   if(action==='start'){
    if(Object.keys(value).sort().join()!=='email,language'||typeof value.email!=='string'||value.email.length>320||!['en','fr','ln','sw'].includes(value.language))throw Error();
    body=JSON.stringify({email:value.email,language:value.language});
   }else{
    if(Object.keys(value).sort().join()!=='code,reference'||value.reference!==reference||!/^EML_[A-Za-z0-9_-]+$/.test(reference)||!(Number(deadline)>Date.now())||!/^[A-Za-z0-9_-]{32,128}$/.test(verifier)||typeof value.code!=='string'||!/^\d{8}$/.test(value.code))throw Error();
    body=JSON.stringify({reference,code:value.code});
   }
  }catch{return json({error:{code:'authentication_failed'}},400);}
 }
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');if(base.protocol!=='https:'||base.username||base.password)throw Error();
  const response=await fetch(`${base.origin}/api/dashboard/auth/email/${action}`,{method:request.method,body,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Origin:origin,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{}),...(action==='verify'?{Cookie:`shida_email_browser=${verifier}`}:{})}});
  if(!response.ok)return json({error:{code:response.status===429?'rate_limited':'authentication_failed'}},response.status>=400?response.status:502);
  const data=await response.json();
  if(action==='capabilities')return json({enabled:data.enabled===true});
  if(action==='start'){
   const binding=secret(response,'shida_email_browser'),expires=Date.parse(data.expires_at);
   if(!binding||!/^EML_[A-Za-z0-9_-]+$/.test(data.reference)||!(expires>Date.now())||expires>Date.now()+660000)throw Error();
   jar.set(COOKIE,`${data.reference}.${expires}.${binding}`,{...options,maxAge:600});
   return json({reference:data.reference,expires_at:data.expires_at});
  }
  const token=secret(response,'shida_dashboard_session');if(!token||data.authenticated!==true)throw Error();
  await setEmploymentToken(token);jar.set(COOKIE,'',{...options,maxAge:0});
  jar.set('nihiloba_personal_challenge','',{...options,maxAge:0});return json({authenticated:true});
 }catch{return json({error:{code:'unavailable'}},503);}
}
export const GET=handle;
export const POST=handle;
