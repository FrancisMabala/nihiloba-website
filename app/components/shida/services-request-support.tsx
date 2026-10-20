"use client";
import {useState} from "react";
import type {ServiceLocale} from "../../lib/services-category-experience";
import {requestSupportCopy,safeSupportUrl} from "../../lib/services-request-support-copy";
export function ServicesRequestSupport({reference,url,locale}:{reference:string;url?:string|null;locale:ServiceLocale}){
 const t=requestSupportCopy(locale),[message,setMessage]=useState(""),href=safeSupportUrl(url);
 async function copy(){try{if(!navigator.clipboard)throw new Error("unavailable");await navigator.clipboard.writeText(reference);setMessage(t.copied);}catch{setMessage(t.manual);}}
 return <details className="svc-request-support"><summary>{t.report}</summary><p>{t.help}</p>
  <label>{t.reference}<input readOnly value={reference} onFocus={event=>event.currentTarget.select()}/></label>
  <div className="svc-request-actions"><button type="button" onClick={()=>void copy()}>{t.copy}</button>
  {href?<a className="button" href={href} target="_blank" rel="noopener noreferrer">{t.open} ↗</a>:<p>{t.unavailable}</p>}</div>
  {message&&<p role="status">{message}</p>}
 </details>;
}
