'use client';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {statisticsConsentSnapshot,statisticsServerSnapshot,subscribeStatisticsConsent,statisticsCopy} from '../../lib/website-statistics-consent';
import './website-statistics-consent.css';

export function WebsiteStatisticsConsent({language}:{language:string}){
 const consent=useSyncExternalStore(subscribeStatisticsConsent,statisticsConsentSnapshot,statisticsServerSnapshot);
 const [show,setExpanded]=useState(false),control=useRef<HTMLButtonElement>(null);
 const dialog=useRef<HTMLDialogElement>(null),title=useRef<HTMLHeadingElement>(null);
 const locale=language in statisticsCopy?language as keyof typeof statisticsCopy:'en',t=statisticsCopy[locale];
 useEffect(()=>{
  if(!show)return;
  const node=dialog.current,opener=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';node?.showModal();
  if(node)node.scrollTop=0;
  title.current?.focus({preventScroll:true});
  return()=>{node?.close();document.body.style.overflow=overflow;if(opener instanceof HTMLElement&&opener.isConnected)opener.focus({preventScroll:true});};
 },[show]);
 function close(){setExpanded(false);}
 return <section className="website-statistics" aria-label={t.settings} lang={locale}>
  <dialog ref={dialog} id="website-statistics-options" className="website-statistics-options" aria-labelledby="website-statistics-title" onCancel={event=>{event.preventDefault();close();}}>
   <div className="website-statistics-copy">
    <header className="website-statistics-heading"><h2 ref={title} tabIndex={-1} id="website-statistics-title">{t.title}</h2><button type="button" onClick={close} aria-label={t.close}>×</button></header>
    <p className="website-statistics-purpose">{t.blocked}</p>
   </div>
   <div className="website-statistics-links"><a href={locale==='en'?'/en/privacy':'/fr/privacy'} hrefLang={locale==='en'?'en':'fr'}>{t.privacy}</a></div>
  </dialog>
  <div className="website-statistics-control"><button ref={control} type="button" aria-expanded={show} aria-haspopup="dialog" aria-controls="website-statistics-options" onClick={()=>setExpanded(true)}>{t.settings}</button>{consent==='blocked'&&<span role="status">{t.blocked}</span>}</div>
 </section>;
}
