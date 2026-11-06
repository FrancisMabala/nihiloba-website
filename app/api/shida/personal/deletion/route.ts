import {employmentToken,personalSessionBinding,privateEmploymentJson} from '../../employment/route-utils';
import {personalRequestOrigin} from '../../../../lib/personal-request-origin';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const origin=personalRequestOrigin(request,true),token=await employmentToken();
 if(!origin)return privateEmploymentJson({detail:'forbidden'},403);
 if(!token)return privateEmploymentJson({detail:'unauthorized'},401);
 try{
  const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');
  if(base.protocol!=='https:'||base.username||base.password)throw Error();
  const response=await fetch(new URL('/api/dashboard/personal/security/delete/status',base.origin),{cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Origin:origin,Cookie:`shida_dashboard_session=${token}`}});
  if(!response.ok)return privateEmploymentJson({detail:'unavailable'},response.status===401?401:503);
  const value=await response.json();
  if(value.deletion!==null&&(!value.deletion?.reference||!Number.isFinite(Date.parse(value.deletion.scheduled_at))))throw Error();
  return privateEmploymentJson({deletion:value.deletion,binding:personalSessionBinding(token)});
 }catch{return privateEmploymentJson({detail:'unavailable'},503);}
}
