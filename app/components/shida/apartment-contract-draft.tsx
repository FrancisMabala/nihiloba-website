'use client';
import {useEffect, useRef, useState} from 'react';
import {apartmentContractCopy} from '../../lib/apartment-contract-copy';

type Draft = {status:string;signing_enabled:boolean;legal_reviewed:boolean;clauses:unknown[];facts:{property_reference:string;city:string|null;commune:string|null;applicant_display_name:string;advertised_monthly_rent:number;currency:string}};
export function ApartmentContractDraft({locale, binding, reference, requestToken}:{locale:keyof typeof apartmentContractCopy;binding:string;reference:string;requestToken:string}) {
 const t=apartmentContractCopy[locale];
 const [draft,setDraft]=useState<Draft|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 const controller=useRef<AbortController|null>(null),button=useRef<HTMLButtonElement>(null),preview=useRef<HTMLElement>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 useEffect(()=>{if(draft)preview.current?.focus();},[draft]);
 async function open(){
  if(controller.current)return;
  const request=new AbortController();controller.current=request;setBusy(true);setError(false);
  try{
   const response=await fetch(`/api/shida/personal/apartments/${reference}/requests/${requestToken}/contract-draft/`,{cache:'no-store',signal:AbortSignal.any([request.signal,AbortSignal.timeout(15000)]),headers:{'x-shida-session':binding}});
   if(!response.ok)throw Error();const result=await response.json() as Draft;
   if(result.status!=='draft_pending_legal_review'||result.signing_enabled!==false||result.legal_reviewed!==false||!Array.isArray(result.clauses)||result.clauses.length||!result.facts)throw Error();
   if(!request.signal.aborted)setDraft(result);
  }catch{if(!request.signal.aborted)setError(true);}
  finally{controller.current=null;if(!request.signal.aborted)setBusy(false);}
 }
 return <div className="apt-contract-draft">
  <button ref={button} type="button" disabled={busy} onClick={()=>void open()}>{t.open}</button>
  {busy&&<p role="status">{t.loading}</p>}{error&&<p role="alert">{t.error}</p>}
  {draft&&<section ref={preview} tabIndex={-1} aria-label={t.title} className="apt-panel">
   <h3>{t.title}</h3><p className="apt-advice"><strong>{t.warning}</strong></p>
   <p>{t.explanation}</p><dl><dt>{t.property}</dt><dd>{draft.facts.property_reference} · {[draft.facts.city,draft.facts.commune].filter(Boolean).join(', ')}</dd>
   <dt>{t.applicant}</dt><dd>{draft.facts.applicant_display_name}</dd><dt>{t.rent}</dt><dd>{draft.facts.advertised_monthly_rent} {draft.facts.currency}</dd></dl>
   <p>{t.separate}</p><p>{t.pending}</p>
   <button type="button" onClick={()=>{setDraft(null);button.current?.focus();}}>{t.close}</button>
  </section>}
 </div>;
}
