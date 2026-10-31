"use client";
import {useEffect,useRef,useState} from "react";
import {todayCopy} from "../../lib/services-today-copy";
import {providerCopy,type ProviderLocale} from "../../lib/services-provider-copy";
import {serviceCategoryExperience} from "../../lib/services-category-experience";
import type {TodayOffering} from "../../lib/services-today-model";
import type {PostedRequest} from "../../lib/services-request-browser";
import {serviceTimestamp} from "../../lib/service-time";
export function ServicesTodayOpportunities({base,binding,locale,offerings,onDenied,onOpen,onAll}:{base:string;binding:string;locale:ProviderLocale;offerings:TodayOffering[];onDenied:()=>void;onOpen:(request:string,offering:string)=>void;onAll:(offering:string)=>void}){
 const eligible=offerings.filter(row=>row.is_active==="yes"&&row.requests_enabled&&row.visible_to_customers===true);
 const [selected,setSelected]=useState(eligible[0]?.public_ref??""),[reload,setReload]=useState(0);
 const offering=eligible.find(row=>row.public_ref===selected)?.public_ref??eligible[0]?.public_ref??"";
 const [result,setResult]=useState<{scope:string;items:PostedRequest[];failed:boolean}|null>(null);
 const denied=useRef(onDenied);useEffect(()=>{denied.current=onDenied;},[onDenied]);
 const scope=`${binding}:${offering}:${locale}:${reload}`,t=todayCopy[locale],ui=providerCopy[locale];
 useEffect(()=>{
  if(!offering)return;let active=true;const controller=new AbortController();
  fetch(`${base}/transactions/competition/postings/available?offering_ref=${encodeURIComponent(offering)}`,{credentials:"include",cache:"no-store",signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]),headers:{Accept:"application/json","X-Shida-Session":binding}})
   .then(async response=>{if(!response.ok){if(active&&[401,403].includes(response.status))denied.current();throw Error();}return response.json();})
   .then(value=>{if(!Array.isArray(value.requests))throw Error();if(active)setResult({scope,items:value.requests.filter((row:PostedRequest)=>row.status==="OPEN").slice(0,3),failed:false});})
   .catch(()=>{if(active)setResult({scope,items:[],failed:true});});
  return()=>{active=false;controller.abort();};
 },[base,binding,offering,scope]);
 if(!offering)return null;
 const current=result?.scope===scope?result:null;
 return <section className="svc-daily-panel svc-daily-opportunities"><header><h3>{t.opportunities}</h3><button onClick={()=>onAll(offering)}>{t.all} →</button></header><label>{ui.services}<select value={offering} onChange={event=>setSelected(event.target.value)}>{eligible.map(row=><option key={row.public_ref} value={row.public_ref}>{row.service_name}</option>)}</select></label>{!current?<div className="svc-daily-skeleton" role="status"><span className="sr-only">{t.loading}</span></div>:current.failed?<div role="alert"><p>{t.failed}</p><button onClick={()=>setReload(value=>value+1)}>{t.retry}</button></div>:current.items.length?<ul>{current.items.map(row=><li key={row.posted_ref}><div><h4>{serviceCategoryExperience(row.summary.category,locale)?.service??ui.available}</h4><p>{row.summary.description?.slice(0,180)}</p><p>{[row.summary.city,row.summary.commune].filter(Boolean).join(" · ")}</p><small>{serviceTimestamp(row.created_at,locale)}</small></div><button onClick={()=>onOpen(row.posted_ref,offering)}>{t.open}<span className="sr-only"> {row.posted_ref}</span> →</button></li>)}</ul>:<div className="svc-daily-empty"><strong>{t.noOpportunities}</strong><p>{t.opportunitiesHelp}</p></div>}</section>;
}
