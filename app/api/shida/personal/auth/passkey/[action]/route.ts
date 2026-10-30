import {cookies} from 'next/headers';
import {personalRequestOrigin} from '../../../../../../lib/personal-request-origin';
import {privateEmploymentJson as json,setEmploymentToken} from '../../../../employment/route-utils';
export const dynamic='force-dynamic';
const COOKIE='nihiloba_passkey_attempt';
const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/api/shida'};
type Context={params:Promise<{action:string}>};
function upstream(response:Response,name:string){for(const line of response.headers.getSetCookie()){const pair=line.split(';')[0];if(pair.startsWith(name+'=')){const value=pair.slice(name.length+1);if(/^[A-Za-z0-9_-]{32,128}$/.test(value))return value;}}return null;}
async function handle(request:Request,context:Context){
 const origin=personalRequestOrigin(request,true),{action}=await context.params;
 if(!origin)return json({error:{code:'forbidden'}},403);
 if(!['capabilities','options','verify','cancel'].includes(action)||new URL(request.url).search||request.method!==(action==='capabilities'?'GET':'POST'))return json({},404);
 const jar=await cookies();
 if(action==='cancel'){jar.set(COOKIE,'',{...cookieOptions,maxAge:0});return json({cancelled:true});}
 // Independent server gate allows presentation-only releases and immediate rollback.
 if(process.env.SHIDA_PASSKEY_LOGIN_ENABLED!=='true')return action==='capabilities'?json({enabled:false}):json({error:{code:'unavailable'}},404);
 const [reference,deadline,verifier]=(jar.get(COOKIE)?.value??'').split('.');
 let body:string|undefined;
 if(action==='verify'){
  if(!/^PKL_[A-Za-z0-9_-]+$/.test(reference)||!(Number(deadline)>Date.now())||!verifier)return json({error:{code:'authentication_failed'}},400);
  try{const reader=request.body?.getReader();if(!reader)throw Error();let raw='';const decoder=new TextDecoder();for(;;){const {done,value}=await reader.read();if(done)break;raw+=decoder.decode(value,{stream:true});if(raw.length>16384){await reader.cancel();throw Error();}}const value=JSON.parse(raw);if(!value||Object.keys(value).join()!=='credential'||typeof value.credential!=='object')throw Error();body=JSON.stringify({reference,credential:value.credential});}catch{return json({error:{code:'authentication_failed'}},400);}
 }
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');if(base.protocol!=='https:'||base.username||base.password)throw Error();
  const response=await fetch(`${base.origin}/api/dashboard/auth/passkey/${action}`,{method:request.method,body,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Origin:origin,Accept:'application/json',...(body?{'Content-Type':'application/json',Cookie:`shida_passkey_browser=${verifier}`}:{})}});
  if(!response.ok)return json({error:{code:response.status===429?'rate_limited':'authentication_failed'}},response.status>=400?response.status:502);
  const data=await response.json();
  if(action==='capabilities')return json({enabled:data.enabled===true});
  if(action==='options'){const binding=upstream(response,'shida_passkey_browser'),expires=Date.parse(data.expires_at);if(!binding||!/^PKL_[A-Za-z0-9_-]+$/.test(data.reference)||!(expires>Date.now())||!data.options?.challenge)throw Error();jar.set(COOKIE,`${data.reference}.${expires}.${binding}`,{...cookieOptions,maxAge:300});return json({options:data.options,expires_at:data.expires_at});}
  const token=upstream(response,'shida_dashboard_session');if(!token||data.authenticated!==true)throw Error();await setEmploymentToken(token);jar.set(COOKIE,'',{...cookieOptions,maxAge:0});jar.set('nihiloba_personal_challenge','',{...cookieOptions,maxAge:0});return json({authenticated:true});
 }catch{return json({error:{code:'unavailable'}},503);}
}
export const GET=handle;
export const POST=handle;
