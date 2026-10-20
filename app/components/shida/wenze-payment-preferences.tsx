"use client";
import {useEffect,useState} from "react";
import {paymentText} from "@/app/lib/wenze-payment-copy";
import {useWorkDraft} from "@/app/lib/restaurant-work";

type Preferences={revision:number;selected:string[];available:string[];coming_soon:string[];online_collection_enabled:false};
type Props={path:string;locale:string;request:(path:string,init?:RequestInit)=>Promise<unknown>;onRevision:(revision:number)=>void};
export function WenzePaymentPreferences({path,locale,request,onRevision}:Props){
 const t=(key:string)=>paymentText(locale,key);
 const [data,setData]=useState<Preferences|null>(null),[selected,setSelected]=useState<string[]>([]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[retry,setRetry]=useState(0),[stale,setStale]=useState(false);
 const dirty=!!data&&JSON.stringify(selected)!==JSON.stringify(data.selected);
 useWorkDraft(dirty,t("leave"));
 useEffect(()=>{
  let current=true;
  request(`${path}/payment-preferences`).then(value=>{
   if(!current)return;
   const next=value as Preferences;
   if(!Array.isArray(next.selected)||!Array.isArray(next.available)||!Array.isArray(next.coming_soon))throw new Error("invalid");
   setData(next);setSelected(next.selected);setMessage("");setStale(false);
  }).catch(()=>{if(current)setMessage("error");});
  return()=>{current=false;};
 },[path,request,retry]);
 async function save(){
  if(!data)return;
  setBusy(true);setMessage("");
  try{
   const next=await request(`${path}/payment-preferences`,{method:"PUT",body:JSON.stringify({expected_revision:data.revision,methods:selected})}) as Preferences;
   setData(next);setSelected(next.selected);onRevision(next.revision);setMessage("saved");
  }catch(e){const conflict=!!e&&typeof e==="object"&&"status" in e&&e.status===409;setStale(conflict);setMessage(conflict?"conflict":"error");}
  finally{setBusy(false);}
 }
 return <section aria-label={t("title")}><h3>{t("title")}</h3><p>{t("help")}</p>
  {message&&<p role={message==="saved"?"status":"alert"}>{t(message)}</p>}
  {!data&&!message&&<p role="status">{t("loading")}</p>}
  {data&&<form onSubmit={e=>{e.preventDefault();void save();}}><fieldset disabled={busy||stale} style={{border:0,padding:0}}>
   <legend>{t("title")}</legend>
   {data.available.map(method=><label key={method} style={{display:"flex",alignItems:"center",gap:12,minHeight:48}}><input type="checkbox" checked={selected.includes(method)} onChange={e=>setSelected(data.available.filter(m=>m===method?e.target.checked:selected.includes(m)))}/>{t(method)}</label>)}
   {data.coming_soon.map(method=><label key={method} style={{display:"flex",alignItems:"center",gap:12,minHeight:48}}><input type="checkbox" disabled checked={false}/>{t(method)} · {t("soon")}</label>)}
  </fieldset><button disabled={busy||stale||!dirty}>{t("save")}</button></form>}
  {(stale||message==="error")&&<button disabled={busy} onClick={()=>{setData(null);setMessage("");setRetry(n=>n+1);}}>{t("reload")}</button>}
 </section>;
}
