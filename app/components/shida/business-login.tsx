"use client";
import {useEffect,useRef,useState} from 'react';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';
import {PasskeyLogin} from './passkey-login';
import {EmailLogin} from './email-login';
import {restorePersonalSession,PersonalSessionError} from '../../lib/personal-session-browser';
import {authMutation} from '../../lib/personal-login-browser';
import {safeRestaurantReturn} from '../../lib/business-auth/restaurant-return';
import {businessAuthCopy} from '../../lib/business-auth-copy';
import './auth-design.css';
const key='shida-business-return';
export function BusinessLogin({locale}:{locale:keyof typeof businessAuthCopy}){
 const t=businessAuthCopy[locale],base=(locale==='en'?'':'/'+locale)+'/shida';
 const [target,setTarget]=useState('/'),[method,setMethod]=useState('all'),[ready,setReady]=useState(false),[name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(false),[setup,setSetup]=useState(false),[available,setAvailable]=useState<boolean|null>(null);
 const lock=useRef(false),alive=useRef(false);
 useEffect(()=>{alive.current=true;const query=new URLSearchParams(window.location.search);let next=safeRestaurantReturn(query.get('returnTo')),resume=false;
  try{if(!query.has('returnTo')){const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved&&saved.until>Date.now()){next=safeRestaurantReturn(saved.target);resume=true;}}sessionStorage.setItem(key,JSON.stringify({target:next,until:Date.now()+3600000}));}catch{}
  void restorePersonalSession(AbortSignal.timeout(12000)).then(async session=>{if(alive.current){setName(session.user.display_name);if(resume)await proceed(next);}}).catch(caught=>{if(alive.current&&!(caught instanceof PersonalSessionError&&caught.status===401))setError(true);}).finally(()=>{if(alive.current){setTarget(next);setMethod(['passkey','email'].includes(query.get('method')||'')?query.get('method')!:'all');setReady(true);}});
  return()=>{alive.current=false;};
 // Restore once per page mount; the saved destination is passed explicitly, not captured from initial state.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{let active=true;if(!['passkey','email'].includes(method))return;void fetch('/api/shida/personal/auth/'+method+'/capabilities/',{cache:'no-store',signal:AbortSignal.timeout(12000)}).then(async r=>r.ok&&(await r.json()).enabled===true).then(value=>{if(active)setAvailable(value);}).catch(()=>{if(active)setAvailable(false);});return()=>{active=false;};},[method]);
 async function proceed(destination=target){if(lock.current)return;lock.current=true;setBusy(true);setError(false);setSetup(false);
  try{await authMutation(async()=>{
   const profile=await fetch('/api/shida/registration/personal/',{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!profile.ok)throw Error();const state=await profile.json();
   if(state.can_complete!==true){setSetup(true);return;}
   const response=await fetch('/api/shida/registration/business-handoff/',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json'},body:'{}'});if(!response.ok)throw Error();const grant=await response.json();if(!/^[A-Za-z0-9_-]{32,128}$/.test(grant.token)||!alive.current)throw Error();
   const form=document.createElement('form');form.method='POST';form.action='https://business.nihiloba.com/handoff';
   for(const [name,value]of Object.entries({token:grant.token,language:locale,returnTo:destination})){const field=document.createElement('input');field.type='hidden';field.name=name;field.value=value;form.appendChild(field);}
   document.body.appendChild(form);form.submit();form.remove();try{sessionStorage.removeItem(key);}catch{}
  });}catch{if(alive.current)setError(true);}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 async function authenticated(){try{const session=await restorePersonalSession();if(alive.current){setName(session.user.display_name);await proceed();}}catch{setError(true);}}
 function cancel(){try{sessionStorage.removeItem(key);}catch{}}
 return <main id="main-content" className="page-shell" style={{maxWidth:640,padding:'32px 20px',margin:'auto'}}><a href={'https://business.nihiloba.com/login?returnTo='+encodeURIComponent(target)} onClick={cancel}>{t.back}</a><h1>{target==='/?create=organization'?t.create:t.title}</h1><p>{target==='/?create=organization'?t.intent:t.intro}</p>
 {!ready?<p role="status">{t.loading}</p>:name?<><p><strong>{name}</strong></p><button className="button button-primary" disabled={busy} onClick={()=>void proceed()}>{busy?t.loading:t.continue}</button></>:method==='passkey'||method==='email'?<><h2>{method==='passkey'?t.passkey:t.email}</h2>{available===null?<p role="status">{t.loading}</p>:available?method==='passkey'?<PasskeyLogin locale={locale} onAuthenticated={()=>void authenticated()}/>:<EmailLogin locale={locale} onAuthenticated={()=>void authenticated()}/>:<p role="alert">{t.error}</p>}</>:<PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>void authenticated()} returnTo={base+'/business-login/'}/>}
 {error&&<p role="alert">{t.error} <button type="button" onClick={()=>window.location.reload()}>{t.retry}</button></p>}{setup&&<p role="status">{t.setup}</p>}
 <p><a href={base+'/register/?returnTo='+encodeURIComponent(base+'/business-login/')}>{t.register}</a></p>
 {method!=='all'&&<button className="button button-secondary" onClick={()=>{setMethod('all');setError(false);}}>{t.other}</button>}
 </main>;
}
