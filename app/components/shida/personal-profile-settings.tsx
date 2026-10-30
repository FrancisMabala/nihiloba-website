"use client";
import {useEffect,useRef,useState} from 'react';
import {registrationCopy,type RegistrationLocale} from '../../lib/registration/copy';
import {onboardingText} from '../../lib/registration/onboarding-copy';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {announcePersonalSessionChange} from '../../lib/personal-session-browser';
import './registration.css';
type Profile={revision:string;values:Record<string,string|null>;primary_phone:{masked:string;verified:boolean};neighborhood:string|null};
const fields=['personal_name','city','country_code','area'];
export function PersonalProfileSettings({locale,binding}:{locale:RegistrationLocale;binding:string}){
 const t=registrationCopy[locale],n=accountNavigationCopy[locale];
 const [profile,setProfile]=useState<Profile|null>(null),[values,setValues]=useState<Record<string,string>>({}),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const lock=useRef(false),live=useRef(true);
 const reset=(next:Profile)=>{setProfile(next);setValues(Object.fromEntries(Object.entries(next.values).map(([k,v])=>[k,v??''])));};
 useEffect(()=>{live.current=true;const abort=new AbortController();void fetch('/api/shida/personal/security/profile/',{cache:'no-store',headers:{'x-shida-session':binding},signal:abort.signal}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then((next:Profile)=>{if(!abort.signal.aborted)reset(next);}).catch(()=>{if(!abort.signal.aborted)setMessage(t.error);});return()=>{live.current=false;abort.abort();};},[binding,t.error]);
 async function save(){if(!profile||lock.current)return;lock.current=true;setBusy(true);setMessage('');try{
  const response=await fetch('/api/shida/personal/security/profile/',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','x-shida-session':binding},body:JSON.stringify({revision:profile.revision,values:Object.fromEntries(Object.entries(values).filter(([k,v])=>v!==(profile.values[k]??'')))})});
  if(!live.current)return;if(!response.ok){setMessage(response.status===409?t.changed:t.error);return;}
  const next:Profile=await response.json();if(!live.current)return;reset(next);setEditing(false);setMessage(t.saved);announcePersonalSessionChange();
 }catch{if(live.current)setMessage(t.error);}finally{lock.current=false;if(live.current)setBusy(false);}}
 const label=(key:string)=>key==='area'?t.area:onboardingText(locale,key);
 return <section className="registration-card"><h2>{t.profile}</h2>{message&&<p role="status">{message}</p>}{profile&&<><p>{n.phone}: {profile.primary_phone.masked} {profile.primary_phone.verified&&<>· {n.verified}</>}</p>{profile.neighborhood&&<p>{n.neighborhood}: {profile.neighborhood}</p>}{editing?<form onSubmit={e=>{e.preventDefault();void save();}}><fieldset disabled={busy} className="registration-fields">{fields.map(key=><div key={key}><label htmlFor={`profile-${key}`}>{label(key)}</label><input id={`profile-${key}`} value={values[key]??''} maxLength={500} onChange={e=>setValues({...values,[key]:e.target.value})}/></div>)}<button className="button button-primary">{onboardingText(locale,'save')}</button><button type="button" onClick={()=>{reset(profile);setEditing(false);setMessage('');}}>{n.cancel}</button></fieldset></form>:<><dl>{fields.map(key=><div key={key}><dt>{label(key)}</dt><dd>{profile.values[key]||'—'}</dd></div>)}</dl><button type="button" onClick={()=>setEditing(true)}>{n.edit}</button></>}</>}</section>;
}
