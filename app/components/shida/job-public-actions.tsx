"use client";

import { useEffect, useState, useId, useRef } from "react";
import {OfferText} from './offer-text';
import {JobRelationshipActions} from "./job-relationship-actions";
import type { ServiceLocale as Locale } from "../../lib/services-i18n";
import type { PublicJobExternalAction } from "../../types/shida-public";

const copy = {
  en: { save:"Save in SHIDA", follow:"Follow on SHIDA", share:"Share", shared:"Link copied", report:"Report offer", hint:"Opens in a new tab.", blocked:"Allow a new tab for SHIDA, then try again.", redirect:"Apply on employer website", instructions:"See how to apply", opening:"Opening employer website…", unavailable:"This offer is no longer open for applications.", failed:"The application link is temporarily unavailable." },
  fr: { save:"Enregistrer dans SHIDA", follow:"Suivre sur SHIDA", share:"Partager", shared:"Lien copié", report:"Signaler l’offre", hint:"S’ouvre dans un nouvel onglet.", blocked:"Autorisez l’ouverture d’un nouvel onglet pour SHIDA, puis réessayez.", redirect:"Postuler sur le site officiel", instructions:"Voir comment postuler", opening:"Ouverture du site de l’employeur…", unavailable:"Cette offre n’est plus ouverte aux candidatures.", failed:"Le lien de candidature n’est pas disponible pour le moment." },
  ln: {save:"Bomba na SHIDA",follow:"Landa na SHIDA",share:"Kabola",shared:"Lien ekopiami",report:"Yebisa mokakatano na email",hint:"Ekofungwama na onglet ya sika.",blocked:"Pesa SHIDA nzela ya kofungola onglet ya sika, mpe meká lisusu.",redirect:"Senga na site ya mopesi mosala",instructions:"Tala ndenge ya kosenga",opening:"Site ezali kofungwama…",unavailable:"Bosengi ekangami mpo na mosala oyo.",failed:"Lien ya bosengi ezali kosala te."},
  sw: {save:"Hifadhi kwenye SHIDA",follow:"Fuata kwenye SHIDA",share:"Shiriki",shared:"Kiungo kimenakiliwa",report:"Ripoti kazi kwa barua pepe",hint:"Itafunguka kwenye kichupo kipya.",blocked:"Ruhusu SHIDA kufungua kichupo kipya, kisha ujaribu tena.",redirect:"Omba kwenye tovuti ya mwajiri",instructions:"Ona jinsi ya kuomba",opening:"Inafungua tovuti ya mwajiri…",unavailable:"Kazi hii haipokei maombi tena.",failed:"Kiungo cha ombi hakipatikani kwa sasa."},
} as const;

async function recordEvent(jobReference:string,event:"view"|"share") {
  try { await fetch(`/api/shida/public-jobs/${encodeURIComponent(jobReference)}/${event}`, { method:"POST", credentials:"same-origin" }); } catch { /* Analytics must never block the public experience. */ }
}

export function JobViewTracker({ jobReference }: { jobReference:string }) {
  useEffect(()=>{const key=`shida_job_viewed_${jobReference}`;try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,"1");}catch{/* A blocked session store only reduces client-side deduplication. */}void recordEvent(jobReference,"view");},[jobReference]);
  return null;
}

export function ExternalJobAction({ locale, jobReference, action, label }: { locale:Locale; jobReference:string; action:PublicJobExternalAction; label?:string }) {
  const statusId = useId(), hintId = useId(), t = copy[locale];
  const redirect = action.mode === "redirect";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [instructions, setInstructions] = useState("");

  async function activate() {
    if (busy) return;
    // Reserve the tab during the click. The validated destination arrives asynchronously.
    const tab = redirect ? window.open("about:blank", "_blank") : null;
    if (redirect && !tab) {
      setMessage(t.blocked);
      return;
    }
    setBusy(true);
    setInstructions("");
    setMessage(redirect ? t.opening : "");
    let navigated = false;
    try {
      if (tab) {
        tab.opener = null;
        tab.document.documentElement.lang = locale;
        tab.document.title = t.opening;
        tab.document.body.textContent = t.opening;
      }
      const response = await fetch(`/api/shida/public-jobs/${encodeURIComponent(jobReference)}/external-action`, {
        method: "POST", credentials: "same-origin", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({action: action.action, idempotency_key: crypto.randomUUID()}),
      });
      if (!response.ok) {
        setMessage(response.status === 409 ? t.unavailable : t.failed);
        return;
      }
      const value = await response.json();
      if (tab && value?.mode === "redirect" && typeof value.redirect_url === "string") {
        if (!tab.closed) {
          tab.location.replace(value.redirect_url);
          navigated = true;
        }
        setMessage("");
      } else if (value?.mode === "instructions" && typeof value.instructions === "string") {
        setInstructions(value.instructions);
        setMessage("");
      } else {
        setMessage(t.failed);
      }
    } catch {
      setMessage(t.failed);
    } finally {
      if (tab && !navigated && !tab.closed) tab.close();
      setBusy(false);
    }
  }
  const describedBy = [redirect && hintId, (message || instructions) && statusId].filter(Boolean).join(" ");
  return <div className="job-external-action">
    <button type="button" className="button button-primary" onClick={activate} disabled={busy} aria-describedby={describedBy || undefined}>
      {label || (redirect ? t.redirect : t.instructions)}{redirect && <span aria-hidden="true"> ↗</span>}
    </button>
    {redirect && <small className="job-new-tab-hint" id={hintId}>{t.hint}</small>}
    {(message || instructions) && <div id={statusId} className={instructions ? "job-application-instructions" : "job-action-status"} role="status">
      {instructions ? <OfferText value={instructions}/> : message}
    </div>}
  </div>;
}

export function JobPublicActions({ locale, jobReference, title, path, origin, canShare=true, canSave=false, canFollow=false, compact=false }: { locale:Locale; jobReference:string; title:string; path:string; origin:"direct"|"external"; canShare?:boolean; canSave?:boolean; canFollow?:boolean; compact?:boolean }) {
  const t=copy[locale], [shared,setShared]=useState(false);
  async function share(){const url=new URL(path,window.location.origin).toString();try{if(navigator.share)await navigator.share({title,url});else await navigator.clipboard.writeText(url);if(origin==="external")void recordEvent(jobReference,"share");setShared(true);}catch{/* Cancellation leaves the page unchanged. */}}
  // Report links live alongside the applicant safety information.
  return <div className={compact?"job-public-actions job-public-actions-compact":"job-public-actions"}>
    <JobRelationshipActions key={`${locale}:${jobReference}`} locale={locale} jobReference={jobReference} canSave={canSave} canFollow={canFollow} detail={!compact}/>
    {canShare&&<button type="button" className="job-action-button" onClick={()=>void share()}>{shared?t.shared:t.share}</button>}

    <span className="sr-only" role="status" aria-live="polite">{shared?t.shared:""}</span>
  </div>;
}

export function JobReportLink({locale,jobReference}:{locale:Locale;jobReference:string}){
 return <a href={`mailto:support@nihiloba.com?subject=${encodeURIComponent("Report public job "+jobReference)}`}>{copy[locale].report}</a>;
}
export function JobResultsLink({locale,href}:{locale:Locale;href:string}){
 const anchor = useRef<HTMLAnchorElement>(null);
 useEffect(()=>{if(!anchor.current || !document.referrer)return;const previous=new URL(document.referrer);
 if(previous.origin===location.origin&&previous.pathname.replace(/\/$/,'')===href.replace(/\/$/,''))anchor.current.href=previous.pathname+previous.search;},[href]);
 return <a ref={anchor} href={href}>← {{fr:'Toutes les offres',en:'All jobs',ln:'Misala nyonso',sw:'Kazi zote'}[locale]}</a>;
}
