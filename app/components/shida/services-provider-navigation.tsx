"use client";
import {useRef,useState} from "react";
import {providerCopy,type ProviderLocale,type ProviderView} from "../../lib/services-provider-copy";
import {todayCopy} from "../../lib/services-today-copy";
import {workdayCopy} from "../../lib/services-workday-copy";
import {SellerWorkspaceIcon} from "./seller-workspace";

export function ServicesProviderNavigation({locale,items,current,onNavigate}:{locale:ProviderLocale;items:ProviderView[];current:ProviderView;onNavigate:(view:ProviderView)=>void}){
 const trigger=useRef<HTMLButtonElement>(null);
 const [expanded,setExpanded]=useState(false),t=providerCopy[locale],w=workdayCopy[locale];
 const main:ProviderView[]=["overview","work","calendar"];
 const tools:ProviderView[]=["reports","templates","settings"];
 const choose=(view:ProviderView)=>{onNavigate(view);setExpanded(false);};
 const button=(key:ProviderView)=><button type="button" key={key} aria-current={current===key?"page":undefined} onClick={()=>choose(key)}><SellerWorkspaceIcon name={key==="counter"?"finance":key==="share"?"document":key==="services"?"catalog":key==="available"||key==="proposals"?"work":key==="templates"?"document":key}/><span>{key==="services"?w.services:t[key]}</span></button>;
 return <nav onKeyDown={event=>{if(event.key==="Escape"&&expanded){setExpanded(false);trigger.current?.focus();}}} className="svc-workday-nav" aria-label={t.navigation} data-expanded={expanded}>
  <div className="svc-workday-primary">{main.filter(key=>items.includes(key)).map(button)}<button type="button" ref={trigger} className="svc-mobile-more" aria-expanded={expanded} aria-controls="svc-workday-tools" onClick={()=>setExpanded(!expanded)}><SellerWorkspaceIcon name="settings"/><span>{t.tools}</span></button></div>
  <div className="svc-workday-tools" id="svc-workday-tools">
   {([["groupWork",["proposals"]],["groupFind",["available"]],["groupServices",["services","share"]],["groupManagement",["counter","finance"]]] as const).map(([label,keys])=>keys.some(key=>items.includes(key))?<div className="svc-nav-group" key={label}><p>{todayCopy[locale][label]}</p>{keys.filter(key=>items.includes(key)).map(button)}</div>:null)}
   {items.some(key=>tools.includes(key))&&<details className="svc-secondary-tools" open={tools.includes(current)||undefined}><summary>{t.tools}</summary><nav aria-label={t.tools}>{items.filter(key=>tools.includes(key)).map(button)}</nav></details>}
   <button type="button" className="svc-mobile-close" onClick={()=>{setExpanded(false);trigger.current?.focus();}}>{w.close}</button>
  </div>
 </nav>;
}
