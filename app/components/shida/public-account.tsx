"use client";

import {MarketplaceControls,marketplaceAccountCopy,type MarketplaceLocale} from "./marketplace-controls";
import {usePathname} from "next/navigation";
import {marketplaceLanguagePath} from "../../lib/marketplace-navigation";
import {useCallback,useEffect,useId,useRef,useState} from 'react';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';
import {PERSONAL_SESSION_EVENT,PersonalSessionError,restorePersonalSession,type PersonalSession} from '../../lib/personal-session-browser';
import {endEmploymentSession} from '../../services/shida/employment-browser-client';
import {publicAccountCopy} from '../../lib/public-account-copy';
import {leaveWork} from '../../lib/restaurant-work';
import {accountSpaceCopy} from "../../lib/account-space-copy";
import {refinementCopy} from "../../lib/registration/refinement-copy";
import './public-account.css';
import NotificationCenter from './notification-center';


export function PublicShidaAccount({locale}:{locale:keyof typeof publicAccountCopy}) {
  const t=publicAccountCopy[locale],title=useId(),pathname=usePathname();
  const r=refinementCopy[locale];
  const a=marketplaceAccountCopy[locale],prefix=locale==="en"?"":`/${locale}`,spaceHref=`${prefix}/shida/space`;
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
    {session&&<NotificationCenter key={'bell:'+session.binding} binding={session.binding} apiBase="/api/shida/personal/notifications" locale={locale} destination={`${spaceHref}?view=messages`}/>}
    <MarketplaceControls enhancedAccount key={session?.binding||"guest"} locale={locale} name={session?.user.display_name} spaceHref={spaceHref} guestLabel={t.signIn}
      registrationLink={!checking&&!session&&process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED==="true"?{label:r.create,href:`${prefix}/shida/register/?returnTo=${encodeURIComponent(pathname)}`}:undefined}
      links={[{label:a.space,href:spaceHref},{label:accountSpaceCopy[locale].messages,href:`${spaceHref}?view=messages`},{label:accountSpaceCopy[locale].settings,href:`${spaceHref}?view=settings`}]}
      languages={/\/shida\/?$/.test(pathname)||/\/shida\/(restaurants|services|seller|space|service-requests|service-bills)(?:\/|$)/.test(pathname)?["fr","en","ln","sw"]:["fr","en"]}
      onLanguage={(lang:MarketplaceLocale)=>{if(leaveWork())window.location.assign(marketplaceLanguagePath(pathname,lang)+window.location.search);}}
      onLogin={()=>setOpen(true)} onAccount={()=>{setOpen(true);void logout(true);}} onLogout={()=>{setOpen(true);void logout();}} pending={pending} beforeNavigate={leaveWork}/>
    <dialog className="shida-account-dialog" ref={dialog} aria-labelledby={title} onClose={()=>setOpen(false)}>
      {open&&<div className="shida-account-content">
        <div className="shida-account-heading"><span>SHIDA</span><button type="button" aria-label={t.close} onClick={()=>dialog.current?.close()}>×</button></div>
        <h2 id={title} className={!session?"sr-only":undefined}>{session?t.title:t.signIn}</h2>
        {session&&<nav className="shida-account-actions" aria-label={a.account}><a href={spaceHref}>{a.space}</a><a href={`${spaceHref}?view=messages`}>{accountSpaceCopy[locale].messages}</a><a href={`${spaceHref}?view=settings`}>{accountSpaceCopy[locale].settings}</a></nav>}
        {pending?<p role="status">{t.working}</p>:logoutFailed?<div role="alert"><p>{t.logoutFailed}</p><button className="button button-secondary" type="button" onClick={()=>void logout(true)}>{t.retry}</button></div>:session?<div className="shida-account-signed-in">
          <p>{t.signedIn}<strong>{session.user.display_name}</strong></p>
          <button className="button button-primary" type="button" onClick={()=>dialog.current?.close()}>{t.close}</button>
          <div className="shida-account-actions"><button type="button" onClick={()=>void logout(true)}>{t.change}</button><button type="button" onClick={()=>void logout()}>{t.signOut}</button></div>
        </div>:<>
          {checking?<p role="status">{t.checking}</p>:<>{failed&&<p role="status">{t.failed}</p>}<PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>{dialog.current?.close();void check(true);}}/></>}
          <button type="button" className="shida-account-browse" onClick={()=>dialog.current?.close()}>{r.browse} →</button>
        </>}
      </div>}
    </dialog>
  </div>;
}
