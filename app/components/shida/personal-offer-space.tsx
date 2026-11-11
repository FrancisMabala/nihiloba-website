'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {MissionWizard} from './mission-wizard';
import {missionText} from '../../lib/mission-copy';
import {payload,type MissionValues} from '../../lib/mission-form';
import {useConfirmation} from './confirmation-dialog';
import {confirmationActions} from '../../lib/confirmation-actions';
import {personalOfferCopy} from '../../lib/personal-offer-copy';
import {useWorkDraft,WenzeLeaveDialog} from '../../lib/wenze-work';
import './candidate-profile-space.css';
import './personal-offer-space.css';
type Locale=keyof typeof personalOfferCopy;
type Values=MissionValues;
type Draft={public_ref:string;revision:number;state:string;values:Values;result_job_ref:string|null};
type Data={locations?:{kinshasa_communes:string[];quartiers:Record<string,string[]>};progress:Draft[];capacity:{used:number;limit:number};identity:{name:string;city?:string|null;commune?:string|null}};
export function PersonalOfferSpace({locale,binding,onUnauthorized}:{locale:Locale;binding:string;onUnauthorized:()=>void}){
 const {request:ask,confirmation}=useConfirmation(locale);
 const dialogs=confirmationActions[locale];
 const t=personalOfferCopy[locale],prefix=locale==='en'?'':`/${locale}`;
 const [data,setData]=useState<Data|null>(null),[draft,setDraft]=useState<Draft|null>(null),[values,setValues]=useState<Values>({}),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false),[conflict,setConflict]=useState(false),[message,setMessage]=useState(''),[result,setResult]=useState<string|null>(null),[pending,setPending]=useState(false);
 const alive=useRef(true),lock=useRef(false),key=useRef<string|null>(null),intent=useRef<{action:'finalize';public_ref:string;revision:number;confirmed:true}|null>(null),unauthorized=useRef(onUnauthorized);
 useEffect(()=>{unauthorized.current=onUnauthorized;},[onUnauthorized]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useWorkDraft(dirty,t.error);
 const api=useCallback(async(body?:unknown)=>{const response=await fetch('/api/shida/personal/job-offer',{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{'X-Shida-Session':binding,...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify({...body as object,language:locale})});if(response.status===401)unauthorized.current();if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.field||String(response.status))}return response.json();},[binding,locale]);
 const load=useCallback(async()=>{const next=await api() as Data;if(alive.current)setData(next);return next;},[api]);
 const autoOpened=useRef(false);
 useEffect(()=>{let active=true;void load().then(async next=>{
  if(!active||autoOpened.current||new URLSearchParams(window.location.search).get('intent')!=='mission')return;
  autoOpened.current=true;const target=new URLSearchParams(window.location.search).get('draft');
  const current=next.progress.find(d=>target?d.public_ref===target:d.state==='active');if(current){begin(current.state==='expired'?await api({action:'recover',public_ref:current.public_ref,revision:current.revision}):current);return}if(target){setMessage(t.error);return}
  if(next.capacity.used>=next.capacity.limit||next.progress.some(d=>d.state==='expired'))return;
  key.current??=crypto.randomUUID();const started=await api({action:'start',operation_key:key.current});if(active)begin(started);
 }).catch(()=>{if(active)setMessage(t.error)});return()=>{active=false}},[load,api,t.error]);
 async function run(action:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setMessage('');try{await action();}catch(error){if(alive.current){const stale=error instanceof Error&&error.message==='409';setConflict(stale);setMessage(stale?t.conflict:t.error);}}finally{lock.current=false;if(alive.current)setBusy(false);}}
 function begin(next:Draft){if(!alive.current)return;if(next.state==='completed'){setResult(next.result_job_ref);setDraft(null);setDirty(false);key.current=null;return;}if(next.state!=='active')throw new Error('409');intent.current=null;setPending(false);setDraft(next);setValues(next.values);setDirty(false);setConflict(false);setResult(null);}
 async function save(){if(!draft)throw new Error('missing');const partial=payload(values);const next=await api({action:'save',public_ref:draft.public_ref,revision:draft.revision,values:partial}) as Draft;if(alive.current){setDraft(next);setDirty(false);}return next;}
 async function reload(){const next=await load();if(!alive.current)return;const current=next.progress.find(row=>row.public_ref===draft?.public_ref);if(current?.state==='completed'){setResult(current.result_job_ref);setDraft(null);setDirty(false);setPending(false);intent.current=null;}else if(current?.state==='active')begin(current);else{setDraft(null);setDirty(false);setPending(false);intent.current=null;}setConflict(false);}
 return <section className="candidate-workspace personal-offer-workspace" aria-busy={busy}>
  <WenzeLeaveDialog locale={locale}/>{confirmation}<p>{t.intro}</p>
  {message&&<div role="alert" className="candidate-notice">{message}<button disabled={busy} onClick={()=>void run(reload)}>{t.reload}</button></div>}
  {!data&&!message&&<p role="status">{t.loading}</p>}
  {result&&<p role="status" className="candidate-notice">{t.success} <a href={`${prefix}/shida/emplois/${encodeURIComponent(result)}`}>{t.view} →</a> · <a href={prefix+'/shida/space?view=listings&kind=applications&offer='+encodeURIComponent(result)}>{missionText(locale,'received')}</a> · <a href={prefix+'/shida/space?view=listings&kind=candidates&offer='+encodeURIComponent(result)}>{missionText(locale,'find')}</a></p>}
  {data&&<p>{t.capacity}: {data.capacity.used} / {data.capacity.limit}</p>}
   {data&&draft?<MissionWizard locations={data.locations} key={draft.public_ref} locale={locale} values={values} change={v=>{setValues(v);setDirty(true)}} busy={busy||conflict} pending={pending} preview={v=>api({action:'preview',public_ref:draft.public_ref,revision:draft.revision,values:v})} save={()=>void run(async()=>{await save();setDraft(null);await load()})} publish={()=>void run(async()=>{if(!intent.current){const saved=await save();intent.current={action:'finalize',public_ref:saved.public_ref,revision:saved.revision,confirmed:true};}setPending(true);const completed=await api(intent.current) as Draft;if(alive.current){setResult(completed.result_job_ref);setDraft(null);setDirty(false);setPending(false);intent.current=null;key.current=null;}await load();})}/>:data&&<div className="candidate-profile-panel"><p>{t.privacy}</p>{data.progress.filter(row=>['active','expired'].includes(row.state)).map(row=><article key={row.public_ref}><h2>{row.values.job||t.title}</h2>{row.state==='expired'&&<p>{t.expired}</p>}<button disabled={busy} onClick={()=>void run(async()=>begin(row.state==='expired'?await api({action:'recover',public_ref:row.public_ref,revision:row.revision}):row))}>{row.state==='expired'?t.recover:t.resume}</button><button disabled={busy} onClick={()=>ask({title:dialogs.deleteDraft,description:dialogs.deleteOffer,confirmLabel:dialogs.deleteDraft,cancelLabel:dialogs.keepDraft,severity:'danger',onConfirm:async()=>{await api({action:'cancel',public_ref:row.public_ref,revision:row.revision});key.current=null;void load().catch(()=>setMessage(t.error));}})}>{dialogs.deleteDraft}</button></article>)}<button disabled={busy||data.capacity.used>=data.capacity.limit} className="button-primary" onClick={()=>void run(async()=>{key.current??=crypto.randomUUID();begin(await api({action:'start',operation_key:key.current}));})}>{missionText(locale,'title')}</button></div>}
 </section>;
}
