'use client';
import {useEffect,useState} from 'react';
import {restorePersonalSession,PersonalSessionError} from '../../lib/personal-session-browser';
import {individualApplicationCopy} from '../../lib/individual-application-copy';
import {listingText,type MissionLocale} from '../../lib/personal-missions-copy';
import {candidateApplicationPath} from './candidate-employment';
import {listingEligibility,eligibilityFailure,individualEligibilityCopy,type IndividualEligibility} from '../../lib/individual-job-eligibility';

export function IndividualJobAction({locale,reference,available,lifecycle}:{locale:MissionLocale;reference:string;available:boolean;lifecycle:string}){
 const [state,setState]=useState<IndividualEligibility>(()=>listingEligibility(lifecycle,available));
 const [application,setApplication]=useState<string|null>(null),[attempt,setAttempt]=useState(0);
 const c=individualApplicationCopy[locale],copy=individualEligibilityCopy[locale],prefix=locale==='en'?'':'/'+locale;
 const applyPath=prefix+'/shida/space?'+new URLSearchParams({view:'job-offer',kind:'apply',offer:reference});
 useEffect(()=>{
  const ctrl=new AbortController(),known=listingEligibility(lifecycle,available);
  void restorePersonalSession(ctrl.signal).then(async session=>{
   const response=await fetch('/api/shida/personal/job-offer/?'+new URLSearchParams({kind:'apply',offer:reference}),{cache:'no-store',signal:ctrl.signal,headers:{'X-Shida-Session':session.binding}});
   const value=await response.json();
   if(ctrl.signal.aborted)return;
   if(!response.ok){setState(response.status===404&&known!=='loading'?known:eligibilityFailure(response.status,value?.code));return;}
   if(typeof value.application==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(value.application)){setApplication(value.application);setState('applied');return;}
   // A private profile response cannot enable an unavailable public application.
   if(known!=='loading'){setState(known);return;}
   if(!Object.hasOwn(value,'profile')){setState('error');return;}
   setState(value.profile?'open':'profile');
  }).catch(error=>{if(!ctrl.signal.aborted)setState(error instanceof PersonalSessionError?eligibilityFailure(error.status):'error');});
  return()=>ctrl.abort();
 },[reference,available,lifecycle,attempt]);
 let href:string|null=null,label:string|null=null;
 if(state==='applied'&&application){href=candidateApplicationPath(locale,application);label=c.application;}
 else if(state==='open'){href=applyPath;label=listingText(locale,'apply');}
 else if(state==='profile'){href=applyPath;label=copy.profileAction;}
 else if(state==='signin'){href=applyPath;label=copy.signinAction;}
 else if(state==='owner'){href=prefix+'/shida/space?'+new URLSearchParams({view:'listings',kind:'manage',offer:reference});label=copy.manage;}
 else if(['closed','expired','disabled','unavailable'].includes(state)){href=prefix+'/shida/emplois';label=c.browse;}
 return <div className="mission-eligibility" aria-busy={state==='loading'} data-state={state}>
  <p role={state==='error'?'alert':'status'}>{copy[state]}</p>
  {href&&<a className={'button '+(['open','profile','signin','applied'].includes(state)?'button-primary':'button-secondary')} href={href}>{label}</a>}
  {(state==='error'||state==='unavailable')&&<button type="button" className="button button-secondary" onClick={()=>{setState('loading');setAttempt(value=>value+1);}}>{copy.retry}</button>}
 </div>;
}
