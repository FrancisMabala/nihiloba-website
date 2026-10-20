"use client";
import {serviceTimestamp} from "../../lib/service-time";
import {useEffect,useState} from "react";
import {servicesText,type ServicesLocale} from "./services-transaction-copy";

type Job={reservation_ref:string;offering:string;status:string;requested_datetime:string|null;requested_date:string|null;created_at:string|null;completed_at:string|null;request_ref:string|null;quote_ref:string|null;thread_ref:string|null;bill_family_ref:string|null};
const words={
 en:{title:"Past work with a customer",intro:"Choose one of your bookings to see other work with the same customer. Only this provider's work appears.",customer:"Customer",select:"Choose a booking",booking:"Booking",request:"Request",quote:"Quote",messages:"Messages",bill:"Issued bill history",costs:"Job costs",earlier:"Earlier bookings",later:"Later bookings",more:"More work",previous:"Previous work",empty:"No matching work.",failed:"Customer history is unavailable. Check your access.",date:"Requested"},
 fr:{title:"Travaux passés avec un client",intro:"Choisissez une réservation pour voir vos autres missions avec ce client, pour ce prestataire seulement.",customer:"Client",select:"Choisir une réservation",booking:"Réservation",request:"Demande",quote:"Devis",messages:"Messages",bill:"Historique des factures émises",costs:"Coûts de la mission",earlier:"Réservations précédentes",later:"Réservations suivantes",more:"Autres missions",previous:"Missions précédentes",empty:"Aucune mission correspondante.",failed:"Historique indisponible. Vérifiez votre accès.",date:"Demandé"},
 ln:{title:"Misala ya kala na client",intro:"Pona réservation mpo na komona misala mosusu na client yango, ya mopesi mosala oyo kaka.",customer:"Client",select:"Pona réservation",booking:"Réservation",request:"Bosengi",quote:"Devis",messages:"Ba messages",bill:"Lisolo ya ba facture oyo ebimisami",costs:"Depanse ya mosala",earlier:"Ba réservation ya liboso",later:"Ba réservation ya sima",more:"Misala mosusu",previous:"Misala ya liboso",empty:"Mosala ya ndenge wana ezali te.",failed:"Lisolo ekoki te komonana. Tala ndingisa.",date:"Mokolo ya bosengi"},
 sw:{title:"Kazi za awali na mteja",intro:"Chagua nafasi ili kuona kazi zako nyingine na mteja huyu kwa mtoa huduma huyu pekee.",customer:"Mteja",select:"Chagua nafasi",booking:"Nafasi",request:"Ombi",quote:"Nukuu",messages:"Ujumbe",bill:"Historia ya bili zilizotolewa",costs:"Gharama za kazi",earlier:"Nafasi za awali",later:"Nafasi zinazofuata",more:"Kazi zaidi",previous:"Kazi zilizotangulia",empty:"Hakuna kazi inayolingana.",failed:"Historia haipatikani. Angalia ruhusa.",date:"Iliombwa"},
} as const;

export function ServicesCustomerHistory({base,binding,locale,financeAvailable,reservationRef,onOpen,onDenied}:{base:string;binding:string;locale:ServicesLocale;financeAvailable:boolean;reservationRef:string;onDenied:()=>void;onOpen:(kind:"requests"|"reservations"|"messages",ref:string,quoteRef?:string)=>void}){
 const t=words[locale]??words.en;
 const [expanded,setExpanded]=useState(false),[jobs,setJobs]=useState<Job[]>([]),[offset,setOffset]=useState(0),[next,setNext]=useState<number|null>(null),[customer,setCustomer]=useState(""),[failed,setFailed]=useState(false),[busy,setBusy]=useState(false),[refresh,setRefresh]=useState(0);
 useEffect(()=>{
  if(!expanded)return;
  let active=true;
  queueMicrotask(()=>{if(active){setJobs([]);setNext(null);setCustomer("");setFailed(false);setBusy(true);}});
  fetch(`${base}/transactions/reservations/${encodeURIComponent(reservationRef)}/customer-history?offset=${offset}`,{credentials:"include",cache:"no-store",headers:{Accept:"application/json","X-Shida-Session":binding}})
   .then(async response=>{if(!response.ok){if(active&&[401,403,404].includes(response.status))onDenied();throw Error();}return response.json();})
   .then(data=>{if(active){setJobs(Array.isArray(data.jobs)?data.jobs:[]);setNext(typeof data.next_offset==="number"?data.next_offset:null);setCustomer(typeof data.customer==="string"?data.customer:"");}})
   .catch(()=>{if(active)setFailed(true);}).finally(()=>{if(active)setBusy(false);});
  return()=>{active=false;};
 },[base,binding,reservationRef,expanded,offset,refresh,onDenied]);
 useEffect(()=>{const focus=()=>{setJobs([]);setCustomer("");setRefresh(value=>value+1);};window.addEventListener("focus",focus);return()=>window.removeEventListener("focus",focus);},[]);
 return <details className="svc-customer-history" onToggle={event=>setExpanded(event.currentTarget.open)} style={{margin:"1rem 0",padding:"1rem",border:"1px solid #cbd5e1",borderRadius:12,overflowWrap:"anywhere"}}>
  <summary>{t.title}</summary>
  {expanded&&<div aria-busy={busy}>
   {busy&&<p role="status">…</p>}
   {failed&&<p role="alert">{t.failed} <button type="button" onClick={()=>setRefresh(value=>value+1)}>{servicesText(locale,"refresh")}</button></p>}
   {!busy&&!failed&&<><h4>{t.customer}: {customer||"—"}</h4>{jobs.length===0&&<p>{t.empty}</p>}{jobs.map(job=><article key={job.reservation_ref} style={{borderTop:"1px solid #cbd5e1",padding:".7rem 0"}}>
    <strong>{job.offering}</strong><p>{servicesText(locale,job.status)} · {t.date}: {job.requested_datetime||job.requested_date||serviceTimestamp(job.created_at??"",locale)||"—"}</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
     <button type="button" onClick={()=>onOpen("reservations",job.reservation_ref)}>{t.booking}</button>
     {job.request_ref&&<button type="button" onClick={()=>onOpen("requests",job.request_ref!)}>{t.request}</button>}
     {job.request_ref&&job.quote_ref&&<button type="button" onClick={()=>onOpen("requests",job.request_ref!,job.quote_ref!)}>{t.quote}</button>}
     {job.thread_ref&&<button type="button" onClick={()=>onOpen("messages",job.thread_ref!)}>{t.messages}</button>}
     {financeAvailable&&<button type="button" onClick={()=>window.dispatchEvent(new CustomEvent("services:job-cost",{detail:job.reservation_ref}))}>{t.costs}</button>}
     {job.bill_family_ref&&<button type="button" onClick={()=>onOpen("reservations",job.reservation_ref)}>{t.bill}</button>}
    </div>
   </article>)}<div style={{display:"flex",gap:8}}>{offset>0&&<button type="button" onClick={()=>setOffset(Math.max(0,offset-20))}>{t.previous}</button>}{next!==null&&<button type="button" onClick={()=>setOffset(next)}>{t.more}</button>}</div></>}
  </div>}
 </details>;
}
