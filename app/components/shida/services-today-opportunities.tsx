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
 const [reload,setReload]=useState(0);
 const offeringRefs=eligible.map(row=>row.public_ref).join(",");
 const [result,setResult]=useState<{scope:string;items:(PostedRequest & {offering:string})[];failed:boolean}|null>(null);
 const denied=useRef(onDenied);useEffect(()=>{denied.current=onDenied;},[onDenied]);
 const scope=`${binding}:${offeringRefs}:${locale}:${reload}`,t=todayCopy[locale],ui=providerCopy[locale];
 useEffect(()=>{
  let active=true;const controller=new AbortController();
  const refs=offeringRefs?offeringRefs.split(","):[];
  Promise.all(refs.map(async offering=>{
   const response=await fetch(`${base}/transactions/competition/postings/available?offering_ref=${encodeURIComponent(offering)}`,{credentials:"include",cache:"no-store",signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]),headers:{Accept:"application/json","X-Shida-Session":binding}});
   if(!response.ok){if(active&&[401,403].includes(response.status))denied.current();throw Error();}
   const value=await response.json();if(!Array.isArray(value.requests))throw Error();
   return (value.requests as PostedRequest[]).filter(row=>row.status==="OPEN").map(row=>({...row,offering}));
  })).then(groups=>{if(active){const items=Array.from(new Map(groups.flat().map(row=>[row.posted_ref,row])).values()).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));setResult({scope,items:items.slice(0,3),failed:false});}})
   .catch(()=>{if(active)setResult({scope,items:[],failed:true});});
  return()=>{active=false;controller.abort();};
 },[base,binding,offeringRefs,scope]);

 const current=result?.scope===scope?result:null;
 return <section className="svc-daily-panel svc-daily-opportunities"><header><h3>{t.opportunities}</h3><button onClick={()=>onAll(eligible[0]?.public_ref||"")}>{t.groupFind} →</button></header>{!current?<div className="svc-daily-skeleton" role="status"><span className="sr-only">{t.loading}</span></div>:current.failed?<div role="alert"><p>{t.failed}</p><button onClick={()=>setReload(value=>value+1)}>{t.retry}</button></div>:current.items.length?<ul>{current.items.map(row=><li key={row.posted_ref}><div><h4>{serviceCategoryExperience(row.summary.category,locale)?.service??ui.available}</h4><p>{row.summary.description?.slice(0,180)}</p><p>{[row.summary.city,row.summary.commune].filter(Boolean).join(" · ")}</p><small>{serviceTimestamp(row.created_at,locale)}</small></div><button onClick={()=>onOpen(row.posted_ref,row.offering)}>{t.open}<span className="sr-only"> {row.posted_ref}</span> →</button></li>)}</ul>:<div className="svc-daily-empty"><strong>{t.noOpportunities}</strong></div>}</section>;
}
