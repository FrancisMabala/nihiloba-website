"use client";
import {useEffect,useRef,useState} from 'react';
import {registrationCopy,type RegistrationLocale} from '../../lib/registration/copy';
import {onboardingText} from '../../lib/registration/onboarding-copy';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {announcePersonalSessionChange} from '../../lib/personal-session-browser';
import './registration.css';
import {addressCopy} from "../../lib/registration/address-copy";
import {RegistrationLocation} from "./registration-location";
import {RegistrationCountry} from "./registration-country";
import {SpaceIcon} from './account-space-icon';
import {accountDesignText,countryName} from '../../lib/account-design-copy';
import {readAccount,AccountLoadError} from '../../lib/account-load';
import {profileCopy,profileLabel,registrationLanguages} from "../../lib/registration/profile-copy";
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
import {signalPasskeyUser} from '../../lib/account-passkeys';
import {passkeyLabelCopy} from '../../lib/passkey-label-copy';
type Profile={revision:string;values:Record<string,string|null>;primary_phone:{masked:string;verified:boolean};neighborhood:string|null};
const fields=['personal_name','city','country_code','area','commune','avenue','landmark','region','postal_code','parcel_number','preferred_language'];
export function PersonalProfileSettings({locale,binding,onPhone}:{locale:RegistrationLocale;binding:string;onPhone?:(phone:Profile["primary_phone"])=>void}){
 const t=registrationCopy[locale],n=accountNavigationCopy[locale];
 const [profile,setProfile]=useState<Profile|null>(null),[values,setValues]=useState<Record<string,string>>({}),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const copy=mySpaceCopy[locale];
 const [loadState,setLoadState]=useState<'loading'|'loaded'|'error'|'auth'>('loading'),[attempt,setAttempt]=useState(0);
 const lock=useRef(false),live=useRef(true);
 const reset=(next:Profile)=>{setProfile(next);setValues(Object.fromEntries(Object.entries(next.values).map(([k,v])=>[k,v??''])));};
 useEffect(()=>{live.current=true;const abort=new AbortController();
 void readAccount('profile/',binding,abort.signal).then((next:Profile)=>{if(abort.signal.aborted)return;if(!next.values||!next.primary_phone||typeof next.revision!=='string')throw Error();reset(next);onPhone?.(next.primary_phone);setLoadState('loaded');}).catch(error=>{if(!abort.signal.aborted)setLoadState(error instanceof AccountLoadError&&error.status===401?'auth':'error');});return()=>{live.current=false;abort.abort();};},[binding,attempt,onPhone]);
 useEffect(()=>{
  const open=()=>{if(window.location.hash==='#passkey-profile')setEditing(true);};
  open();window.addEventListener('hashchange',open);return()=>window.removeEventListener('hashchange',open);
 },[]);
 useEffect(()=>{if(editing&&profile&&window.location.hash==='#passkey-profile')document.getElementById('profile-first_name')?.focus();},[editing,profile]);
 async function save(){if(!profile||lock.current)return;lock.current=true;setBusy(true);setMessage('');try{
  const response=await fetch('/api/shida/personal/security/profile/',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json','x-shida-session':binding},body:JSON.stringify({revision:profile.revision,values:Object.fromEntries(Object.entries(values).filter(([k,v])=>v!==(profile.values[k]??'')))})});
  if(!live.current)return;if(!response.ok){setMessage(response.status===409?t.changed:t.error);return;}
  const next:Profile=await response.json();if(!live.current)return;reset(next);setEditing(false);setMessage(t.saved);
  // Refresh canonical labels after saving; never signal unsaved input.
  try{const current=await readAccount('',binding,AbortSignal.timeout(12000));if(live.current)void signalPasskeyUser(current.passkey_user);}catch{/* Profile is saved even if metadata refresh is unavailable. */}
  if(!live.current)return;
  if(window.location.hash==='#passkey-profile')window.location.hash='job-alert-passkey';
  announcePersonalSessionChange();
 }catch{if(live.current)setMessage(t.error);}finally{lock.current=false;if(live.current)setBusy(false);}}
 const editFields=[...(profile?.values.first_name?[]:["personal_name"]),"first_name","family_name","additional_name","preferred_language"];
 const label=(key:string)=>profileLabel(locale,key)??(key in addressCopy[locale]?addressCopy[locale][key as keyof typeof addressCopy.en]:key==='country_code'?accountDesignText(locale,'country'):key==='area'?t.area:onboardingText(locale,key));
 return <section id="passkey-profile" className="registration-card space-profile"><header className="space-section-heading"><h2>{accountDesignText(locale,'detailsTitle')}</h2>{profile&&!editing&&<button type="button" onClick={()=>setEditing(true)}><SpaceIcon name="edit"/>{n.edit}</button>}</header>{loadState==='loading'&&<p role="status">{t.loading}</p>}{(loadState==='error'||loadState==='auth')&&<div role="alert"><p>{loadState==='auth'?copy.auth:copy.loadError}</p><button onClick={()=>{setLoadState('loading');setAttempt(v=>v+1);}}>{copy.retry}</button></div>}{message&&<p role="status">{message}</p>}{profile&&<><dl className="space-profile-details">{profile.neighborhood&&profile.neighborhood!==profile.values.area&&<div><dt>{n.neighborhood}</dt><dd>{profile.neighborhood}</dd></div>}</dl>{editing?<form onSubmit={e=>{e.preventDefault();void save();}}><fieldset disabled={busy} className="registration-fields">{typeof window!=='undefined'&&window.location.hash==='#passkey-profile'&&<p>{passkeyLabelCopy[locale].name}</p>}{!profile.values.first_name&&<p>{profileCopy[locale].legacy}</p>}{editFields.map(key=><div key={key}><label htmlFor={`profile-${key}`}>{label(key)}</label>{key==='country_code'?<RegistrationCountry id={`profile-${key}`} value={values[key]??''} onChange={value=>setValues(previous=>({...previous,[key]:value}))} locale={locale}/>:key==='preferred_language'?<select id={`profile-${key}`} value={values[key]??'fr'} onChange={e=>setValues({...values,[key]:e.target.value})}>{registrationLanguages.map(language=><option key={language.code} value={language.code}>{language.name}</option>)}</select>:<input required={typeof window!=='undefined'&&window.location.hash==='#passkey-profile'&&['first_name','family_name'].includes(key)} id={`profile-${key}`} value={values[key]??''} maxLength={500} onChange={e=>setValues({...values,[key]:e.target.value})}/>}</div>)}<RegistrationLocation prefix="profile" values={values} onChange={setValues} locale={locale}/><button className="button button-primary">{onboardingText(locale,'save')}</button><button type="button" onClick={()=>{reset(profile);setEditing(false);setMessage('');}}>{n.cancel}</button></fieldset></form>:<><dl className="space-profile-details">{fields.filter(key=>!["commune","avenue","landmark","region","postal_code","parcel_number"].includes(key)||profile.values[key]).map(key=><div key={key}><dt>{label(key)}</dt><dd>{key==='preferred_language'?registrationLanguages.find(language=>language.code===profile.values[key])?.name||'—':key==='country_code'?countryName(locale,profile.values[key]):profile.values[key]||'—'}</dd></div>)}</dl></>}</>}</section>;
}
