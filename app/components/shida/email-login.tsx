'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {emailLoginCopy} from '../../lib/email-login-copy';
import {announceLoginAttempt,authMutation,LOGIN_EVENT,markLoginUnconfirmed} from '../../lib/personal-login-browser';
import {announcePersonalSessionChange,PERSONAL_SESSION_EVENT} from '../../lib/personal-session-browser';

export function EmailLogin({locale,onAuthenticated}:{locale:keyof typeof emailLoginCopy;onAuthenticated:()=>void}){
 const t=emailLoginCopy[locale],id=useId();
 const [enabled,setEnabled]=useState(false),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const [email,setEmail]=useState(''),[code,setCode]=useState(''),[reference,setReference]=useState(''),[message,setMessage]=useState('');
 const epoch=useRef(0),alive=useRef(false);
 useEffect(()=>{
  alive.current=true;const generation=epoch;
  const cancel=()=>{++epoch.current;setOpen(false);setBusy(false);setEmail('');setCode('');setReference('');setMessage('');};
  const storage=(event:StorageEvent)=>{if([LOGIN_EVENT,PERSONAL_SESSION_EVENT].includes(event.key??''))cancel();};
  void fetch('/api/shida/personal/auth/email/capabilities/',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(v=>{if(alive.current)setEnabled(v?.enabled===true);}).catch(()=>{});
  window.addEventListener(LOGIN_EVENT,cancel);window.addEventListener(PERSONAL_SESSION_EVENT,cancel);window.addEventListener('storage',storage);
  return()=>{alive.current=false;++generation.current;window.removeEventListener(LOGIN_EVENT,cancel);window.removeEventListener(PERSONAL_SESSION_EVENT,cancel);window.removeEventListener('storage',storage);};
 },[]);
 async function submit(){
  if(busy)return;const current=epoch.current;const active=()=>alive.current&&epoch.current===current;
  setBusy(true);setMessage('');
  try{
   const accepted=await authMutation(async()=>{
    if(!active())return false;
    if(!reference){
     const response=await fetch('/api/shida/personal/auth/email/start/',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json'},body:JSON.stringify({email,language:locale})});
     if(!response.ok)throw Error();const data=await response.json();
     if(active()){setReference(data.reference);setCode('');}return false;
    }
    markLoginUnconfirmed(true);
    try{
     const response=await fetch('/api/shida/personal/auth/email/verify/',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json'},body:JSON.stringify({reference,code})});
     if(response.ok&&(await response.json()).authenticated===true&&active()){markLoginUnconfirmed(false);return true;}
     if(response.status>=400&&response.status<500){markLoginUnconfirmed(false);throw Error('rejected');}
    }catch(error){if(error instanceof Error&&error.message==='rejected')throw error;}
    const cleanup=await fetch('/api/shida/employment/logout/',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(12000)});
    if(cleanup.ok)markLoginUnconfirmed(false);throw Error();
   });
   if(accepted&&active()){onAuthenticated();announcePersonalSessionChange();}
  }catch{if(active())setMessage(t.failed);}finally{if(active())setBusy(false);}
 }
 async function reset(){
  if(busy)return;
  const current=++epoch.current,restarting=Boolean(reference);
  const active=()=>alive.current&&epoch.current===current;
  setBusy(true);setMessage('');
  try{
   await authMutation(async()=>{
    if(!active())return;
    const response=await fetch('/api/shida/personal/auth/email/cancel/',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error();
   });
   if(active()){setReference('');setCode('');if(!restarting){setEmail('');setOpen(false);}}
  }catch{if(active())setMessage(t.failed);}finally{if(active())setBusy(false);}
 }
 if(!enabled)return null;
 return <div className="auth-email">{!open?<button className="button button-secondary auth-method" type="button" onClick={()=>{announceLoginAttempt();setOpen(true);}}>{t.method}</button>:<form className="candidate-form" onSubmit={event=>{event.preventDefault();void submit();}}>
  <p>{reference?t.sent:t.help}</p>
  <label htmlFor={id}>{reference?t.code:t.email}</label>
  {reference?<input id={id} value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,'').slice(0,8))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} required disabled={busy}/>:<input id={id} type="email" autoComplete="email" maxLength={320} value={email} onChange={event=>setEmail(event.target.value)} required disabled={busy}/>}
  <button className="button button-primary" type="submit" disabled={busy||Boolean(reference)&&code.length!==8}>{busy?t.busy:reference?t.verify:t.send}</button>
  <button className="button button-secondary" type="button" disabled={busy} onClick={()=>void reset()}>{reference?t.restart:t.cancel}</button>
  {message&&<p role="alert">{message}</p>}
 </form>}</div>;
}
