"use client";

import {MarketplaceControls,marketplaceAccountCopy,type MarketplaceLocale} from "./marketplace-controls";
import {readAccount} from "../../lib/account-load";
import {isServiceLocale} from "../../lib/services-i18n";
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
import {testDataCopy} from '../../lib/test-data-copy';


export function PublicShidaAccount({locale}:{locale:keyof typeof publicAccountCopy}) {
  const t=publicAccountCopy[locale],title=useId(),pathname=usePathname();
  const r=refinementCopy[locale];
  const a=marketplaceAccountCopy[locale],prefix=locale==="en"?"":`/${locale}`,spaceHref=`${prefix}/shida/space`;
  const [open,setOpen]=useState(false),[session,setSession]=useState<PersonalSession|null>(null);
  const [checking,setChecking]=useState(true),[failed,setFailed]=useState(false);
  const [pending,setPending]=useState(false),[logoutFailed,setLogoutFailed]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null),alive=useRef(false),generation=useRef(0);
  const reading=useRef<AbortController|null>(null),mutating=useRef(false);

  const choosing=useRef(false);
  const [languageError,setLanguageError]=useState(false);
  const destination=useCallback((lang:MarketplaceLocale)=>marketplaceLanguagePath(pathname,lang)+window.location.search+window.location.hash,[pathname]);
  const binding=session?.binding;
  useEffect(()=>{
    // An explicit locale in a shared link wins. Restore the preference on default entries.
    if(checking||failed||!/^\/shida(?:\/(?:wenze|restaurants|services|emplois|appartements|hotels|transport)(?:\/|$)|\/?$)/.test(pathname))return;
    const controller=new AbortController();
    async function restore(){
      try{
        const lang=binding?(await readAccount("profile/",binding,controller.signal)).values?.preferred_language:localStorage.getItem("shida-market-language");
        if(!controller.signal.aborted&&!choosing.current&&isServiceLocale(lang)&&lang!==locale)window.location.replace(destination(lang));
      }catch{/* Public browsing stays available when storage or the private profile is unavailable. */}
    }
    void restore();return ()=>controller.abort();
  },[checking,failed,binding,pathname,locale,destination]);

  async function chooseLanguage(lang:MarketplaceLocale){
    if(choosing.current||!(await leaveWork()))return;
    choosing.current=true;setPending(true);setLanguageError(false);
    try{
      let active=session;
      if(!active&&failed){
        try{active=await restorePersonalSession(AbortSignal.timeout(12000));}
        catch(error){if(!(error instanceof PersonalSessionError&&error.status===401))throw error;}
      }
      if(active){
        const profile=await readAccount("profile/",active.binding,AbortSignal.timeout(12000));
        if(profile.values.preferred_language!==lang){
          const saved=await fetch("/api/shida/personal/security/profile/",{method:"POST",cache:"no-store",signal:AbortSignal.timeout(12000),headers:{"Content-Type":"application/json","x-shida-session":active.binding},body:JSON.stringify({revision:profile.revision,values:{preferred_language:lang}})});
          if(!saved.ok)throw Error();
        }
      }
      try{localStorage.setItem("shida-market-language",lang);}catch{/* The localized URL still persists across refresh. */}
      window.location.assign(destination(lang));
    }catch{setLanguageError(true);choosing.current=false;setPending(false);}
  }

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
    if(mutating.current||!(await leaveWork()))return;
    mutating.current=true;++generation.current;reading.current?.abort();setSession(null);
    setPending(true);setFailed(false);setLogoutFailed(false);setChecking(false);
    try {await endEmploymentSession();if(alive.current&&!change)dialog.current?.close();}
    catch {if(alive.current)setLogoutFailed(true);}
    finally {mutating.current=false;if(alive.current)setPending(false);}
  }

  return <div className="shida-public-account" lang={locale}>
    {session?.user.test_data && <span className="shida-test-account-label">{testDataCopy[locale]}</span>}
    {session&&<NotificationCenter key={'bell:'+session.binding} binding={session.binding} apiBase="/api/shida/personal/notifications" locale={locale} destination={`${spaceHref}?view=messages`}/>}
    <MarketplaceControls key={session?.binding||"guest"} locale={locale} name={session?.user.display_name} spaceHref={spaceHref} guestLabel={t.signIn}
      registrationLink={!checking&&!session&&process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED==="true"?{label:r.create,href:`${prefix}/shida/register/?returnTo=${encodeURIComponent(pathname)}`}:undefined}
      links={[{label:a.space,href:spaceHref},{label:accountSpaceCopy[locale].messages,href:`${spaceHref}?view=messages`},{label:accountSpaceCopy[locale].settings,href:`${spaceHref}?view=settings`}]}
      checkingLanguage={checking} onLanguage={chooseLanguage}
      onLogin={()=>setOpen(true)} onAccount={()=>{setOpen(true);void logout(true);}} onLogout={()=>{setOpen(true);void logout();}} pending={pending} beforeNavigate={leaveWork}/>
    {languageError&&<span role="alert">{{en:"Could not save your language. Please try again.",fr:"Impossible d’enregistrer votre langue. Réessayez.",ln:"Tokoki kobomba lokota te. Meka lisusu.",sw:"Imeshindikana kuhifadhi lugha. Jaribu tena."}[locale]}</span>}
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
