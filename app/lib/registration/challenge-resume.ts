import {authMutation,loginUnconfirmed} from '../personal-login-browser';

export type ResumedChallenge = {
 status:'pending'|'verified';challenge_ref:string;expires_at:string;language:'fr'|'en'|'ln'|'sw';
};

/** Recover a bound step, not an identity or a successful code exchange. */
export async function resumeRegistrationChallenge(signal?:AbortSignal):Promise<ResumedChallenge|null>{
 return authMutation(async()=>{
  if(signal?.aborted)throw new Error('cancelled');
  if(loginUnconfirmed()) throw new Error('uncertain');
  const response=await fetch('/api/shida/personal/auth/whatsapp/registration/resume/',{
   method:'GET',credentials:'same-origin',cache:'no-store',signal,
  });
  if(response.status===404)return null;
  if(!response.ok)throw new Error(response.status===429?'rate_limited':'unavailable');
  const data=await response.json();
  if(!data || !['pending','verified'].includes(data.status) ||
     typeof data.challenge_ref!=='string' || !/^DWC_[A-Za-z0-9_-]{8,100}$/.test(data.challenge_ref) ||
     !['fr','en','ln','sw'].includes(data.language) ||
     typeof data.expires_at!=='string' || !(Date.parse(data.expires_at)>Date.now()))throw new Error('unavailable');
  return {status:data.status,challenge_ref:data.challenge_ref,expires_at:data.expires_at,language:data.language};
 },signal);
}
