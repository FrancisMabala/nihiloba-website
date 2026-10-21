"use client";
import {useEffect,useId,useRef,useState,type ReactNode} from "react";
import type {WenzeLocale} from "@/app/lib/wenze-copy";
import "./wenze-header.css";

const labels={
 en:{language:"Seller language",account:"Account",switch:"Change account",logout:"Sign out"},
 fr:{language:"Langue de l’espace vendeur",account:"Compte",switch:"Changer de compte",logout:"Se déconnecter"},
 ln:{language:"Lokota ya moteki",account:"Konti",switch:"Bobongola konti",logout:"Bima"},
 sw:{language:"Lugha ya muuzaji",account:"Akaunti",switch:"Badilisha akaunti",logout:"Ondoka"}
};
export function WenzeHeader({locale,name,brandHref,onLanguage,onAccount,onLogout,pending=false,children}:{locale:WenzeLocale;name?:string|null;brandHref:string;onLanguage:(locale:WenzeLocale)=>void;onAccount:()=>void;onLogout:()=>void;pending?:boolean;children?:ReactNode}){
 const [open,setOpen]=useState<"language"|"account"|null>(null),root=useRef<HTMLElement>(null),language=useRef<HTMLButtonElement>(null),account=useRef<HTMLButtonElement>(null),id=useId(),t=labels[locale];
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!(open==="language"?language:account).current?.parentElement?.contains(event.target as Node))setOpen(null);};
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();setOpen(null);(open==="language"?language:account).current?.focus();}};
  document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);
  return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};
 },[open]);
 const initials=name?.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase()||"S";
 return <header ref={root} className="wz-header" onBlur={event=>{if(!(open==="language"?language:account).current?.parentElement?.contains(event.relatedTarget as Node))setOpen(null);}}>
  <div className="wz-header-row"><a className="wz-header-brand" href={brandHref}>SHIDA <span>Wenze</span></a><div className="wz-header-controls">
   <div className="wz-header-disclosure"><button ref={language} type="button" className="wz-header-trigger" disabled={pending} aria-label={t.language} aria-expanded={open==="language"} aria-controls={`${id}-language`} onClick={()=>setOpen(open==="language"?null:"language")}>{locale.toUpperCase()}<span aria-hidden="true">⌄</span></button>
    {open==="language"&&<nav id={`${id}-language`} className="wz-header-panel" aria-label={t.language}>{(["fr","en","ln","sw"] as const).map(lang=><button type="button" key={lang} aria-current={locale===lang?"true":undefined} onClick={()=>{setOpen(null);onLanguage(lang);}}>{({fr:"Français",en:"English",ln:"Lingala",sw:"Swahili"})[lang]}</button>)}</nav>}
   </div>
   {name&&<div className="wz-header-disclosure"><button ref={account} type="button" className="wz-header-trigger wz-account-trigger" disabled={pending} aria-label={`${t.account} · ${name}`} aria-expanded={open==="account"} aria-controls={`${id}-account`} onClick={()=>setOpen(open==="account"?null:"account")}><span className="wz-avatar" aria-hidden="true">{initials}</span><span className="wz-account-name">{name}</span><span aria-hidden="true">⌄</span></button>
    {open==="account"&&<div id={`${id}-account`} className="wz-header-panel"><p>{name}</p><button type="button" onClick={()=>{setOpen(null);onAccount();}}>{t.switch}</button><button type="button" onClick={()=>{setOpen(null);onLogout();}}>{t.logout}</button></div>}
   </div>}
  </div></div>{children}
 </header>;
}
