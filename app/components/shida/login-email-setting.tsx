'use client';
import {useState} from 'react';
import {AccountSetting} from './account-setting';
import {emailLoginCopy} from '../../lib/email-login-copy';
import {securityText} from '../../lib/account-security-copy';
const help={en:'Verify an email for normal sign-in without WhatsApp. Your recovery email remains separate.',fr:'Vérifiez un e-mail pour vous connecter sans WhatsApp. Votre e-mail de récupération reste distinct.',ln:'Ndima e-mail mpo na kokɔta kozanga WhatsApp. E-mail ya kozongisa compte etikali ndenge na yango.',sw:'Thibitisha barua pepe ya kuingia bila WhatsApp. Barua pepe ya kurejesha akaunti inabaki tofauti.'};
export function LoginEmailSetting({locale,current,verified,pending,setup,api,run,saved}:{
 locale:keyof typeof emailLoginCopy;current?:string|null;verified?:boolean;pending?:string|null;
 setup:(path:string,action:string,body:object)=>Promise<{reference:string}>;
 api:(path:string,body:object)=>Promise<unknown>;run:(work:()=>Promise<void>)=>Promise<void>;saved:()=>void;
}){
 const [email,setEmail]=useState(''),[reference,setReference]=useState(pending||''),[code,setCode]=useState('');
 const t=emailLoginCopy[locale],reset=()=>{setEmail('');setReference('');setCode('');};
 return <AccountSetting id="job-alert-login-email" icon="email" title={t.email} cancel={t.cancel} onCancel={reset}>
  <p>{help[locale]}</p>{verified&&current&&<p>{current}</p>}
  <form onSubmit={event=>{event.preventDefault();void run(async()=>{
   if(reference){await api('login-email/verify/',{reference,code});reset();saved();}
   else{const issued=await setup('login-email/start/','email_login',{email,language:locale});setReference(issued.reference);}
  });}}>
   {reference?<label>{t.code}<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} value={code} onChange={event=>setCode(event.target.value)} required/></label>:<label>{t.email}<input type="email" autoComplete="email" maxLength={320} value={email} onChange={event=>setEmail(event.target.value)} required/></label>}
   <button type="submit">{securityText(locale,reference?'verify':'send')}</button>
   {reference&&<button type="button" onClick={reset}>{t.restart}</button>}
  </form>
 </AccountSetting>;
}
