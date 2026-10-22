"use client";
import { useEffect, useRef, useState } from "react";
import { registrationCopy, type RegistrationLocale } from "../../lib/registration/copy";
import { onboardingText } from "../../lib/registration/onboarding-copy";
import { announcePersonalSessionChange } from "../../lib/personal-session-browser";
import "./registration.css";
type Profile = { revision:string; values:Record<string,string|null> };
export function PersonalProfileSettings({locale}:{locale:RegistrationLocale}) {
  const t=registrationCopy[locale];
  const [profile,setProfile]=useState<Profile|null>(null),[values,setValues]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const lock=useRef(false);
  useEffect(()=>{const controller=new AbortController();void fetch("/api/shida/registration/profile/",{cache:"no-store",signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();return response.json();}).then((next:Profile)=>{setProfile(next);setValues(Object.fromEntries(Object.entries(next.values).map(([k,v])=>[k,v??""])));}).catch(()=>{if(!controller.signal.aborted)setMessage(t.error);});return()=>controller.abort();},[t.error]);
  async function save(){if(!profile||lock.current)return;lock.current=true;setBusy(true);setMessage("");try{
    const response=await fetch("/api/shida/registration/profile/",{method:"PATCH",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({revision:profile.revision,values:Object.fromEntries(Object.entries(values).filter(([key,value])=>value!==(profile.values[key]??"")))})});
    if(!response.ok){setMessage(response.status===409?t.changed:t.error);return;}
    const next:Profile=await response.json();setProfile(next);setValues(Object.fromEntries(Object.entries(next.values).map(([k,v])=>[k,v??""])));setMessage(t.saved);announcePersonalSessionChange();
  }catch{setMessage(t.error);}finally{lock.current=false;setBusy(false);}}
  return <section className="registration-card"><h2>{t.profile}</h2>{message&&<p role="status">{message}</p>}{profile&&<form onSubmit={event=>{event.preventDefault();void save();}}><fieldset disabled={busy} className="registration-fields">{["personal_name","city","country_code","area"].map(key=><div key={key}><label htmlFor={`profile-${key}`}>{key==="area"?t.area:onboardingText(locale,key)}</label><input id={`profile-${key}`} value={values[key]??""} maxLength={500} onChange={event=>setValues({...values,[key]:event.target.value})}/></div>)}<button className="button button-primary" type="submit">{onboardingText(locale,"save")}</button></fieldset></form>}</section>;
}
