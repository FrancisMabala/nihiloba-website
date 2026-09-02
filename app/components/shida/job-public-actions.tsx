"use client";

import { useEffect, useState } from "react";
import type { Locale } from "../../lib/i18n";
import type { PublicJobExternalAction } from "../../types/shida-public";

const copy = {
  en: { save:"Save in SHIDA", follow:"Follow on SHIDA", share:"Share", shared:"Link copied", report:"Report offer", redirect:"Apply on employer website", instructions:"See how to apply", opening:"Opening employer website…", unavailable:"This offer is no longer open for applications.", failed:"The application link is temporarily unavailable." },
  fr: { save:"Enregistrer dans SHIDA", follow:"Suivre sur SHIDA", share:"Partager", shared:"Lien copié", report:"Signaler l’offre", redirect:"Postuler sur le site de l’employeur", instructions:"Voir comment postuler", opening:"Ouverture du site de l’employeur…", unavailable:"Cette offre n’est plus ouverte aux candidatures.", failed:"Le lien de candidature n’est pas disponible pour le moment." },
} as const;

async function recordEvent(jobReference:string,event:"view"|"share") {
  try { await fetch(`/api/shida/public-jobs/${encodeURIComponent(jobReference)}/${event}`, { method:"POST", credentials:"same-origin" }); } catch { /* Analytics must never block the public experience. */ }
}

export function JobViewTracker({ jobReference }: { jobReference:string }) {
  useEffect(()=>{const key=`shida_job_viewed_${jobReference}`;try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,"1");}catch{/* A blocked session store only reduces client-side deduplication. */}void recordEvent(jobReference,"view");},[jobReference]);
  return null;
}

export function ExternalJobAction({ locale, jobReference, action }: { locale:Locale; jobReference:string; action:PublicJobExternalAction }) {
  const t=copy[locale], [busy,setBusy]=useState(false), [message,setMessage]=useState(""), [instructions,setInstructions]=useState("");
  async function activate(){if(busy)return;setBusy(true);setMessage(action.mode==="redirect"?t.opening:"");setInstructions("");try{const response=await fetch(`/api/shida/public-jobs/${encodeURIComponent(jobReference)}/external-action`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({action:action.action,idempotency_key:crypto.randomUUID()})});const result:unknown=await response.json();if(!response.ok){setMessage(response.status===409?t.unavailable:t.failed);return;}if(!result||typeof result!=="object"||Array.isArray(result)){setMessage(t.failed);return;}const value=result as Record<string,unknown>;if(value.mode==="redirect"&&typeof value.redirect_url==="string"){window.location.assign(value.redirect_url);return;}if(value.mode==="instructions"&&typeof value.instructions==="string"){setInstructions(value.instructions);setMessage("");return;}setMessage(t.failed);}catch{setMessage(t.failed);}finally{setBusy(false);}}
  return <div className="job-external-action"><button type="button" className="button button-primary" onClick={()=>void activate()} disabled={busy} aria-describedby={message||instructions?`external-action-status-${jobReference}`:undefined}>{action.mode==="redirect"?t.redirect:t.instructions}</button>{(message||instructions)&&<p id={`external-action-status-${jobReference}`} className={instructions?"job-application-instructions":"job-action-status"} role="status" aria-live="polite">{instructions||message}</p>}</div>;
}

export function JobPublicActions({ locale, jobReference, title, path, origin, canShare=true, saveUrl, followUrl, employerName, compact=false }: { locale:Locale; jobReference:string; title:string; path:string; origin:"direct"|"external"; canShare?:boolean; saveUrl?:string|null; followUrl?:string|null; employerName?:string; compact?:boolean }) {
  const t=copy[locale], [shared,setShared]=useState(false);
  async function share(){const url=new URL(path,window.location.origin).toString();try{if(navigator.share)await navigator.share({title,url});else await navigator.clipboard.writeText(url);if(origin==="external")void recordEvent(jobReference,"share");setShared(true);}catch{/* Cancellation leaves the page unchanged. */}}
  const reportHref=`mailto:support@nihiloba.com?subject=${encodeURIComponent(`Report public job ${jobReference}`)}`;
  return <div className={compact?"job-public-actions job-public-actions-compact":"job-public-actions"}>
    {saveUrl&&<a className="job-action-button" href={saveUrl} target="_blank" rel="noopener noreferrer">{t.save}</a>}
    {followUrl&&<a className="job-action-button" href={followUrl} target="_blank" rel="noopener noreferrer">{employerName?`${t.follow} · ${employerName}`:t.follow}</a>}
    {canShare&&<button type="button" className="job-action-button" onClick={()=>void share()}>{shared?t.shared:t.share}</button>}
    {!compact&&<a className="job-action-button" href={reportHref}>{t.report}</a>}
    <span className="sr-only" role="status" aria-live="polite">{shared?t.shared:""}</span>
  </div>;
}
