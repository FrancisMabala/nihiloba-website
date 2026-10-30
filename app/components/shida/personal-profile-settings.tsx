"use client";
import {useEffect,useRef,useState} from 'react';
import {registrationCopy,type RegistrationLocale} from '../../lib/registration/copy';
import {onboardingText} from '../../lib/registration/onboarding-copy';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {announcePersonalSessionChange} from '../../lib/personal-session-browser';
import './registration.css';
import {SpaceIcon} from './account-space-icon';
import {accountDesignText,countryName} from '../../lib/account-design-copy';
import {readAccount,AccountLoadError} from '../../lib/account-load';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
type Profile={revision:string;values:Record<string,string|null>;primary_phone:{masked:string;verified:boolean};neighborhood:string|null};
const fields=['personal_name','city','country_code','area'];
export function PersonalProfileSettings({locale,binding}:{locale:RegistrationLocale;binding:string}){
 const t=registrationCopy[locale],n=accountNavigationCopy[locale];
 const [profile,setProfile]=useState<Profile|null>(null),[values,setValues]=useState<Record<string,string>>({}),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const copy=mySpaceCopy[locale];
 const [loadState,setLoadState]=useState<'loading'|'loaded'|'error'|'auth'>('loading'),[attempt,setAttempt]=useState(0);
 const lock=useRef(false),live=useRef(true);
 const reset=(next:Profile)=>{setProfile(next);setValues(Object.fromEntries(Object.entries(next.values).map(([k,v])=>[k,v??''])));};
 useEffect(()=>{live.current=true;const abort=new AbortController();
 void readAccount('profile/',binding,abort.signal).then((next:Profile)=>{if(abort.signal.aborted)return;if(!next.values||!next.primary_phone||typeof next.revision!=='string')throw Error();reset(next);setLoadState('loaded');}).catch(error=>{if(!abort.signal.aborted)setLoadState(error instanceof AccountLoadError&&error.status===401?'auth':'error');});return()=>{live.current=false;abort.abort();};},[binding,attempt]);
 async function save(){if(!profile||lock.current)return;lock.current=true;setBusy(true);setMessage('');try{
  const response=await fetch('/api/shida/personal/security/profile/',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json','x-shida-session':binding},body:JSON.stringify({revision:profile.revision,values:Object.fromEntries(Object.entries(values).filter(([k,v])=>v!==(profile.values[k]??'')))})});
  if(!live.current)return;if(!response.ok){setMessage(response.status===409?t.changed:t.error);return;}
  const next:Profile=await response.json();if(!live.current)return;reset(next);setEditing(false);setMessage(t.saved);announcePersonalSessionChange();
 }catch{if(live.current)setMessage(t.error);}finally{lock.current=false;if(live.current)setBusy(false);}}
 const label=(key:string)=>key==='country_code'?accountDesignText(locale,'country'):key==='area'?t.area:onboardingText(locale,key);
 return <section className="registration-card space-profile"><header className="space-section-heading"><h2>{t.profile}</h2>{profile&&!editing&&<button type="button" onClick={()=>setEditing(true)}><SpaceIcon name="edit"/>{n.edit}</button>}</header>{loadState==='loading'&&<p role="status">{t.loading}</p>}{(loadState==='error'||loadState==='auth')&&<div role="alert"><p>{loadState==='auth'?copy.auth:copy.loadError}</p><button onClick={()=>{setLoadState('loading');setAttempt(v=>v+1);}}>{copy.retry}</button></div>}{message&&<p role="status">{message}</p>}{profile&&<><dl className="space-profile-details"><div><dt>{n.phone}</dt><dd>{profile.primary_phone.masked} {profile.primary_phone.verified&&<small className="space-verified"><SpaceIcon name="check"/>{n.verified}</small>}</dd></div>{profile.neighborhood&&profile.neighborhood!==profile.values.area&&<div><dt>{n.neighborhood}</dt><dd>{profile.neighborhood}</dd></div>}</dl>{editing?<form onSubmit={e=>{e.preventDefault();void save();}}><fieldset disabled={busy} className="registration-fields">{fields.map(key=><div key={key}><label htmlFor={`profile-${key}`}>{label(key)}</label><input id={`profile-${key}`} value={values[key]??''} maxLength={500} onChange={e=>setValues({...values,[key]:e.target.value})}/></div>)}<button className="button button-primary">{onboardingText(locale,'save')}</button><button type="button" onClick={()=>{reset(profile);setEditing(false);setMessage('');}}>{n.cancel}</button></fieldset></form>:<><dl className="space-profile-details">{fields.map(key=><div key={key}><dt>{label(key)}</dt><dd>{key==='country_code'?countryName(locale,profile.values[key]):profile.values[key]||'—'}</dd></div>)}</dl></>}</>}</section>;
}
