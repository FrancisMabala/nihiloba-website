'use client';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {usePathname} from 'next/navigation';
import {statisticsConsentSnapshot,statisticsServerSnapshot,subscribeStatisticsConsent,websiteStatistics,statisticsDimensions,statisticsCopy} from '../../lib/website-statistics-consent';
import './website-statistics-consent.css';

export function WebsiteStatisticsConsent({language}:{language:string}){
 const consent=useSyncExternalStore(subscribeStatisticsConsent,statisticsConsentSnapshot,statisticsServerSnapshot),pathname=usePathname();
 const [expanded,setExpanded]=useState(false),control=useRef<HTMLButtonElement>(null),previousPath=useRef<string|null>(null);
 const locale=language in statisticsCopy?language as keyof typeof statisticsCopy:'en',t=statisticsCopy[locale];
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
 function choose(value:'accepted'|'declined'){websiteStatistics()?.choose(value);setExpanded(false);requestAnimationFrame(()=>control.current?.focus());}
 return <section className="website-statistics" aria-label={t.settings} lang={locale}>
  {(expanded||consent==='unknown')&&<div id="website-statistics-options" className="website-statistics-options" aria-labelledby="website-statistics-title">
   <div className="website-statistics-copy">
    <h2 id="website-statistics-title">{t.title}</h2>
    <p className="website-statistics-purpose">{t.description}</p>
    <p>{t.details}</p>
    <p>{t.choiceHelp}</p>
   </div>
   {consent==='blocked'&&<p>{t.blocked}</p>}
   <div className="website-statistics-actions"><button type="button" disabled={consent==='blocked'} onClick={()=>choose('accepted')}>{t.accept}</button><button type="button" onClick={()=>choose('declined')}>{t.decline}</button></div>
   <div className="website-statistics-links"><a href={locale==='en'?'/en/privacy':'/fr/privacy'} hrefLang={locale==='en'?'en':'fr'}>{t.privacy}</a>{consent!=='unknown'&&<button type="button" onClick={()=>{setExpanded(false);control.current?.focus();}}>{t.close}</button>}</div>
  </div>}
  <div className="website-statistics-control"><button ref={control} type="button" aria-expanded={expanded||consent==='unknown'} aria-controls="website-statistics-options" onClick={()=>setExpanded(value=>!value)}>{t.settings}</button>{consent!=='unknown'&&<span role="status">{consent==='accepted'?t.on:consent==='blocked'?t.blocked:t.off}</span>}</div>
 </section>;
}
