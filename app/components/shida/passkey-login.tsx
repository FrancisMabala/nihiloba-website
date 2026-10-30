'use client';
import {useEffect,useRef,useState} from 'react';
import {passkeyCeremony} from '../../lib/account-passkeys';
import {authDesignCopy} from '../../lib/auth-design-copy';
import {announceLoginAttempt,authMutation,LOGIN_EVENT,markLoginUnconfirmed} from '../../lib/personal-login-browser';
import {announcePersonalSessionChange,PERSONAL_SESSION_EVENT} from '../../lib/personal-session-browser';
import {SpaceIcon} from './account-space-icon';
export function PasskeyLogin({locale,onAuthenticated}:{locale:keyof typeof authDesignCopy;onAuthenticated:()=>void}){
 const t=authDesignCopy[locale],[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const epoch=useRef(0),alive=useRef(false),controller=useRef<AbortController|null>(null);
 useEffect(()=>{alive.current=true;const generation=epoch;const cancel=()=>{++epoch.current;controller.current?.abort();setBusy(false);};const storage=(e:StorageEvent)=>{if([LOGIN_EVENT,PERSONAL_SESSION_EVENT].includes(e.key??''))cancel();};
 void fetch('/api/shida/personal/auth/passkey/capabilities/',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(v=>{if(alive.current)setEnabled(v?.enabled===true);}).catch(()=>{});
 window.addEventListener(LOGIN_EVENT,cancel);window.addEventListener(PERSONAL_SESSION_EVENT,cancel);window.addEventListener('storage',storage);return()=>{alive.current=false;++generation.current;controller.current?.abort();window.removeEventListener(LOGIN_EVENT,cancel);window.removeEventListener(PERSONAL_SESSION_EVENT,cancel);window.removeEventListener('storage',storage);};},[]);
 async function start(){
  if(busy)return;if(!window.PublicKeyCredential||!navigator.credentials){setMessage(t.unsupported);return;}
  announceLoginAttempt();const current=++epoch.current;setBusy(true);setMessage('');controller.current=new AbortController();
  const active=()=>alive.current&&current===epoch.current;
  try{const accepted=await authMutation(async()=>{
   if(!active())return false;
   const issued=await fetch('/api/shida/personal/auth/passkey/options/',{method:'POST',cache:'no-store',signal:controller.current!.signal});if(!issued.ok)throw Error();const data=await issued.json();
   const credential=await passkeyCeremony(data.options,false,controller.current!.signal);if(!active())return false;
   markLoginUnconfirmed(true);
   try{const result=await fetch('/api/shida/personal/auth/passkey/verify/',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json'},body:JSON.stringify({credential})});
    if(result.ok&&(await result.json()).authenticated===true&&active()){markLoginUnconfirmed(false);return true;}
    if(result.status>=400&&result.status<500){markLoginUnconfirmed(false);throw Error('rejected');}
   }catch(error){if(error instanceof Error&&error.message==='rejected')throw error;}
   // An interrupted/lost response can have issued a cookie. Clean up under the
   // same cross-tab lock before a later login can replace the current identity.
   const cleanup=await fetch('/api/shida/employment/logout/',{method:'POST',cache:'no-store'});if(cleanup.ok)markLoginUnconfirmed(false);throw Error();
  });if(accepted&&active()){onAuthenticated();announcePersonalSessionChange();}}
  catch(error){if(active())setMessage(error instanceof DOMException&&['NotAllowedError','AbortError'].includes(error.name)?t.cancelled:t.failed);}
  finally{if(active())setBusy(false);}
 }
 if(!enabled)return null;
 return <div className="auth-passkey"><button className="button button-primary auth-method" type="button" disabled={busy} onClick={()=>void start()}><SpaceIcon name="key"/>{busy?t.working:t.passkey}<span aria-hidden="true">›</span></button><p className="auth-device">{t.device}</p>{message&&<p role="alert">{message}</p>}</div>;
}
