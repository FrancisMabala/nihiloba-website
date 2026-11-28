'use client';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {usePathname} from 'next/navigation';
import {statisticsConsentSnapshot,subscribeStatisticsConsent,websiteStatistics,statisticsDimensions,statisticsCopy,statisticsLocale,type StatisticsConsent} from '../../lib/website-statistics-consent';
import {CookieSettingsButton,COOKIE_PREFERENCES_ID,OPEN_COOKIE_PREFERENCES} from './cookie-settings-button';
import './website-statistics-consent.css';

const consentBeforeHydration=()=>null;

export function WebsiteStatisticsConsent({language}:{language:string}){
 const consent=useSyncExternalStore(subscribeStatisticsConsent,statisticsConsentSnapshot,consentBeforeHydration),pathname=usePathname();
 const [dismissed,setDismissed]=useState(false),previousPath=useRef<string|null>(null);
 const [draft,setDraft]=useState<{original:StatisticsConsent;checked:boolean;edited:boolean}>({original:'unknown',checked:false,edited:false});
 const dialog=useRef<HTMLDialogElement>(null),title=useRef<HTMLHeadingElement>(null),opener=useRef<HTMLElement|null>(null);
 const locale=statisticsLocale(language),t=statisticsCopy[locale];
 const blocked=consent==='blocked';
 const privacyLink=<a href={locale==='en'?'/en/privacy':'/fr/privacy'} hrefLang={locale==='en'?'en':'fr'}>{t.privacy}</a>;

 useEffect(()=>{
  function open(event:Event){
   const node=dialog.current;
   if(!node||node.open)return;
   const trigger=(event as CustomEvent<unknown>).detail;
   opener.current=trigger instanceof HTMLElement?trigger:null;
   const original=statisticsConsentSnapshot();
   setDraft({original,checked:original==='accepted',edited:false});
   node.showModal();
   node.scrollTop=0;
   title.current?.focus({preventScroll:true});
  }
  window.addEventListener(OPEN_COOKIE_PREFERENCES,open);
  return()=>window.removeEventListener(OPEN_COOKIE_PREFERENCES,open);
 },[]);
 useEffect(()=>{
  if(consent!=='accepted')return;const stats=websiteStatistics();if(!stats)return;
  const dimensions=statisticsDimensions(pathname,language,navigator.userAgent,previousPath.current===null?document.referrer:window.location.origin,window.location.origin);previousPath.current=pathname;
  const observer=stats.observe(dimensions),visible=()=>document.visibilityState==='visible',focused=()=>document.hasFocus();
  const tick=()=>observer.tick(visible(),focused()),activity=(event:Event)=>{if(event.isTrusted){observer.activity();tick();}};
  const events=['pointerdown','keydown','scroll','touchstart'];events.forEach(name=>window.addEventListener(name,activity,{passive:true}));
  document.addEventListener('visibilitychange',tick);window.addEventListener('focus',tick);window.addEventListener('blur',tick);
  const timer=setInterval(tick,5000);tick();
  return()=>{clearInterval(timer);events.forEach(name=>window.removeEventListener(name,activity));document.removeEventListener('visibilitychange',tick);window.removeEventListener('focus',tick);window.removeEventListener('blur',tick);observer.stop(visible(),focused());};
 },[consent,pathname,language]);
 function restoreFocus(){
  const trigger=opener.current;
  opener.current=null;
  if(trigger?.isConnected)trigger.focus({preventScroll:true});
 }
 function choose(value:'accepted'|'declined'){
  websiteStatistics()?.choose(value);
  setDismissed(true);
  dialog.current?.close();
 }
 function analyticsSelected(current:StatisticsConsent|null){
  return current!=='blocked'&&draft.checked&&(draft.edited||draft.original!=='accepted'||current==='accepted');
 }
 function save(){choose(analyticsSelected(statisticsConsentSnapshot())?'accepted':'declined');}

 return <div className="website-statistics" lang={locale}>
  {consent==='unknown'&&!dismissed&&<section className="website-statistics-notice" aria-labelledby="website-statistics-notice-title">
   <header className="website-statistics-heading">
    <h2 id="website-statistics-notice-title">
     <svg className="website-statistics-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 22s7-3.5 7-10V5l-7-3-7 3v7c0 6.5 7 10 7 10Z"/>
      <path d="m9 12 2 2 4-4"/>
     </svg>
     {t.title}
    </h2>
    <button className="website-statistics-close" type="button" onClick={()=>setDismissed(true)} aria-label={t.dismiss}>×</button>
   </header>
   <p>{t.description}</p>
   <div className="website-statistics-actions">
    <button type="button" onClick={()=>choose('accepted')}>{t.accept}</button>
    <button type="button" onClick={()=>choose('declined')}>{t.decline}</button>
   </div>
   <div className="website-statistics-links"><CookieSettingsButton language={locale} initial/>{privacyLink}</div>
  </section>}
  <dialog ref={dialog} id={COOKIE_PREFERENCES_ID} className="website-statistics-options" aria-labelledby="website-statistics-title" onClose={restoreFocus}>
   <header className="website-statistics-heading">
    <h2 ref={title} tabIndex={-1} id="website-statistics-title">{t.preferences}</h2>
    <button className="website-statistics-close" type="button" onClick={()=>dialog.current?.close()} aria-label={t.close}>×</button>
   </header>
   <div className="website-statistics-category">
    <h3>{t.necessary}</h3>
    <strong>{t.always}</strong>
    <p>{t.necessaryDetails}</p>
   </div>
   <div className="website-statistics-category">
    <label className="website-statistics-toggle"><input type="checkbox" checked={analyticsSelected(consent)} disabled={blocked} onChange={event=>{
     setDraft({...draft,checked:event.currentTarget.checked,edited:true});
    }} aria-describedby="website-statistics-details"/>{t.analytics}</label>
    <p id="website-statistics-details">{t.details}</p>
    <p>{t.choiceHelp}</p>
    {blocked&&<p>{t.blocked}</p>}
   </div>
   <div className="website-statistics-actions">
    <button type="button" disabled={blocked} onClick={()=>choose('accepted')}>{t.accept}</button>
    <button type="button" onClick={()=>choose('declined')}>{t.decline}</button>
   </div>
   <button className="website-statistics-save" type="button" onClick={save}>{t.save}</button>
   <div className="website-statistics-links">{privacyLink}</div>
  </dialog>
 </div>;
}
