"use client";

import {useCallback,useEffect,useId,useRef,useState} from 'react';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';
import {PERSONAL_SESSION_EVENT,PersonalSessionError,restorePersonalSession,type PersonalSession} from '../../lib/personal-session-browser';
import {endEmploymentSession} from '../../services/shida/employment-browser-client';
import {publicAccountCopy} from '../../lib/public-account-copy';
import {leaveWork} from '../../lib/restaurant-work';
import './public-account.css';

export function PublicShidaAccount({locale}:{locale:keyof typeof publicAccountCopy}) {
  const t=publicAccountCopy[locale],title=useId();
  const [open,setOpen]=useState(false),[session,setSession]=useState<PersonalSession|null>(null);
  const [checking,setChecking]=useState(true),[failed,setFailed]=useState(false);
  const [pending,setPending]=useState(false),[logoutFailed,setLogoutFailed]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null),alive=useRef(false),generation=useRef(0);
  const reading=useRef<AbortController|null>(null),mutating=useRef(false);

  const check=useCallback(async(clear=false)=>{
    if(mutating.current||!alive.current)return;
    const current=++generation.current;
    reading.current?.abort();
    const controller=new AbortController();reading.current=controller;
    const timeout=setTimeout(()=>controller.abort(),12000);
    if(clear)setSession(null);
    try {
      const value=await restorePersonalSession(controller.signal);
      if(alive.current&&current===generation.current){setSession(value);setFailed(false);}
    } catch(error) {
      if(alive.current&&current===generation.current){
        setSession(null);
        setFailed(!(error instanceof PersonalSessionError&&[401,403].includes(error.status)));
      }
    } finally {
      clearTimeout(timeout);
      if(reading.current===controller)reading.current=null;
      if(alive.current&&current===generation.current)setChecking(false);
    }
  },[]);

  useEffect(()=>{
    alive.current=true;
    const currentGeneration=generation;
    const changed=()=>void check(true);
    const storage=(event:StorageEvent)=>{if(event.key===PERSONAL_SESSION_EVENT)changed();};
    const focus=()=>{if(!document.hidden)void check();};
    queueMicrotask(()=>void check());
    window.addEventListener(PERSONAL_SESSION_EVENT,changed);window.addEventListener('storage',storage);
    window.addEventListener('focus',focus);window.addEventListener('online',focus);document.addEventListener('visibilitychange',focus);
    return()=>{alive.current=false;++currentGeneration.current;reading.current?.abort();window.removeEventListener(PERSONAL_SESSION_EVENT,changed);window.removeEventListener('storage',storage);window.removeEventListener('focus',focus);window.removeEventListener('online',focus);document.removeEventListener('visibilitychange',focus);};
  },[check]);

  useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();},[open]);

  async function logout(change=false){
    if(mutating.current||!leaveWork())return;
    mutating.current=true;++generation.current;reading.current?.abort();setSession(null);
    setPending(true);setFailed(false);setLogoutFailed(false);setChecking(false);
    try {await endEmploymentSession();if(alive.current&&!change)dialog.current?.close();}
    catch {if(alive.current)setLogoutFailed(true);}
    finally {mutating.current=false;if(alive.current)setPending(false);}
  }

  return <div className="shida-public-account" lang={locale}>
    <button className="shida-account-trigger" type="button" aria-label={session?t.accountLabel:t.signInLabel} aria-haspopup="dialog" onClick={()=>setOpen(true)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/></svg>
      <span>{session?t.account:t.signIn}</span>
    </button>
    <dialog className="shida-account-dialog" ref={dialog} aria-labelledby={title} onClose={()=>setOpen(false)}>
      {open&&<div className="shida-account-content">
        <div className="shida-account-heading"><span>SHIDA</span><button type="button" aria-label={t.close} onClick={()=>dialog.current?.close()}>×</button></div>
        <h2 id={title}>{t.title}</h2><p className="shida-account-intro">{t.intro}</p>
        {pending?<p role="status">{t.working}</p>:logoutFailed?<div role="alert"><p>{t.logoutFailed}</p><button className="button button-secondary" type="button" onClick={()=>void logout(true)}>{t.retry}</button></div>:session?<div className="shida-account-signed-in">
          <p>{t.signedIn}<strong>{session.user.display_name}</strong></p>
          <button className="button button-primary" type="button" onClick={()=>dialog.current?.close()}>{t.close}</button>
          <div className="shida-account-actions"><button type="button" onClick={()=>void logout(true)}>{t.change}</button><button type="button" onClick={()=>void logout()}>{t.signOut}</button></div>
        </div>:<>
          {checking?<p role="status">{t.checking}</p>:<>{failed&&<p role="status">{t.failed}</p>}<PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>void check(true)}/></>}
          <p className="shida-account-guest">{t.guest}</p>
          <button type="button" className="shida-account-browse" onClick={()=>dialog.current?.close()}>{t.close} →</button>
        </>}
      </div>}
    </dialog>
  </div>;
}
