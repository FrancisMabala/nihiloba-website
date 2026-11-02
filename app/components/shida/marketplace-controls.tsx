"use client";
import {useEffect,useId,useRef,useState} from "react";
import "./marketplace-chrome.css";
import {AccountIcon} from "./account-menu-icon";
import "./account-menu.css";

import {marketplaceAccountCopy,type MarketplaceLocale} from "./marketplace-account-copy";
export {marketplaceAccountCopy,type MarketplaceLocale} from "./marketplace-account-copy";
export type AccountDestination={label:string;href:string};
export function MarketplaceControls({locale,name,spaceHref,links,onLanguage,onAccount,onLogout,onLogin,pending=false,languages=["fr","en","ln","sw"],beforeNavigate,guestLabel,registrationLink,accountType="personal"}:{
 locale:MarketplaceLocale;name?:string|null;spaceHref:string;links:AccountDestination[];
 onLanguage:(locale:MarketplaceLocale)=>void;onAccount?:()=>void;onLogout:()=>void;onLogin?:()=>void;
 pending?:boolean;languages?:MarketplaceLocale[];beforeNavigate?:()=>boolean|Promise<boolean>;
 guestLabel?:string;accountType?:"personal"|"organization";
 registrationLink?:AccountDestination;
}){
 const t=marketplaceAccountCopy[locale],id=useId(),[open,setOpen]=useState<"language"|"account"|null>(null);
 const language=useRef<HTMLButtonElement>(null),account=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  const trigger=(open==="language"?language:account).current;
  const outside=(event:PointerEvent)=>{if(!trigger?.parentElement?.contains(event.target as Node))setOpen(null);};
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();setOpen(null);trigger?.focus();}};
  document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);
  return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};
 },[open]);
 const accountPanel=useRef<HTMLElement>(null);
 useEffect(()=>{if(open==='account')accountPanel.current?.querySelector<HTMLElement>('a,button')?.focus();},[open]);
 const initials=name?.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join("").toUpperCase()||"S";
 async function navigate(event:React.MouseEvent<HTMLAnchorElement>,href:string){
  setOpen(null);
  if(beforeNavigate){event.preventDefault();if(await beforeNavigate())window.location.assign(href);}
 }
 const destinations=[{label:t.space,href:spaceHref},...links.filter(link=>link.href!==spaceHref)];
 // Safari can blur to the document when tapping a button without focusing it.
 // A null destination must not unmount the menu before that button's click.
 // Outside pointer presses and Escape already dismiss it; keyboard focus moving
 // to another control still closes it here.
 return <div className="market-controls" onBlur={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget as Node))setOpen(null);}}>
  <div className="market-disclosure"><button ref={language} className="market-language" type="button" disabled={pending} aria-label={t.language} aria-expanded={open==="language"} aria-controls={`${id}-languages`} onClick={()=>setOpen(open==="language"?null:"language")}>{locale.toUpperCase()}</button>
   {open==="language"&&<nav id={`${id}-languages`} className="market-menu" aria-label={t.language}>{languages.map(lang=><button type="button" key={lang} aria-current={lang===locale?"true":undefined} onClick={()=>{setOpen(null);onLanguage(lang);}}>{({fr:"Français",en:"English",ln:"Lingala",sw:"Swahili"})[lang]}</button>)}</nav>}
  </div>
  {!name&&registrationLink&&<a className="market-register" href={registrationLink.href} onClick={event=>void navigate(event,registrationLink.href)}>{registrationLink.label}</a>}
  {<div className="market-disclosure"><button ref={account} className={!name&&guestLabel?"market-sign-in":"market-avatar"} type="button" disabled={pending} aria-label={name?`${t.account} · ${name}`:t.login} aria-haspopup={!name&&onLogin?"dialog":undefined} aria-expanded={open==="account"} aria-controls={`${id}-account`} onClick={()=>{if(!name&&onLogin){onLogin();return;}setOpen(open==="account"?null:"account");}}>{name?initials:guestLabel||<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>}</button>
   {open==="account"&&<nav ref={accountPanel} id={`${id}-account`} className="market-menu auth-account-menu" aria-label={t.account} onKeyDown={event=>{const entries=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a,button'));const at=entries.indexOf(document.activeElement as HTMLElement);if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();entries[event.key==='Home'?0:event.key==='End'?entries.length-1:(at+(event.key==='ArrowDown'?1:-1)+entries.length)%entries.length]?.focus();}}}>
    {name&&<header className="auth-account-identity"><span aria-hidden="true">{initials}</span><div><strong>{name}</strong><small>{t[accountType]}</small></div><button type="button" aria-label={t.close} onClick={()=>{setOpen(null);account.current?.focus();}}>×</button></header>}
    {destinations.map((link,index)=><a key={link.href} href={link.href} onClick={event=>void navigate(event,link.href)}><AccountIcon name={index===0?"space":index===1?"messages":"settings"}/><span>{link.label}</span><span aria-hidden="true">›</span></a>)}
    {name&&<><hr/>{onAccount&&<button type="button" onClick={()=>{setOpen(null);account.current?.focus();onAccount();}}><AccountIcon name="people"/>{t.change}</button>}<button type="button" onClick={()=>{setOpen(null);account.current?.focus();onLogout();}}><AccountIcon name="logout"/>{t.logout}</button></>}
   </nav>}
  </div>}
 </div>;
}
