'use client';
import {fileValidation} from '../../lib/file-validation';
import {useCallback,useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {candidateCopy} from '../../lib/candidate-profile-copy';
import {useWorkDraft,WenzeLeaveDialog,leaveWork} from '../../lib/wenze-work';
import {candidateUX,candidateResumeStep,candidateOptionalFields} from '../../lib/candidate-ux';
import {useConfirmation} from './confirmation-dialog';
import {confirmationActions} from '../../lib/confirmation-actions';
import {CandidateChips} from './candidate-chips';
import './candidate-profile-space.css';
type Locale=keyof typeof candidateCopy;
type Kind='professional'|'occasional_work';
type Values=Record<string,string|string[]|null>;
type Draft={public_ref:string;profile_type:Kind;state:string;revision:number;values:Values;return_job_ref:string|null;updated_at?:string};
type Profile={reference:string;type:Kind;version:string;archived:boolean;visibility:string;values:Values;has_cv:boolean};
type Data={progress:Draft[];profiles:Profile[];metadata:{categories:{id:string;label:string}[];required:Record<Kind,string[]>}};
const lists=new Set(['desired_titles','skills','work_types','languages','preferred_areas']);
const searchFields=['primary_category','desired_titles','city','work_types','availability'];
const skillFields=['experience_level','skills','description','education','certifications','languages','social_link','work_mode_preference','salary_expectation'];
const inputValues=(values:Values)=>Object.fromEntries(Object.entries(values).map(([key,value])=>[key,Array.isArray(value)?value.join(', '):value??'']));
export function candidateValues(values:Record<string,string>):Values{return Object.fromEntries(Object.entries(values).map(([key,value])=>[key,lists.has(key)?value.split(',').map(v=>v.trim()).filter(Boolean):value]));}
export function CandidateProfileSpace({locale,binding,onUnauthorized}:{locale:Locale;binding:string;onUnauthorized:()=>void}){
 const t=candidateCopy[locale],u=candidateUX[locale],prefix=locale==='en'?'':`/${locale}`;
 const [data,setData]=useState<Data|null>(null),[draft,setDraft]=useState<Draft|null>(null),[profile,setProfile]=useState<Profile|null>(null),[values,setValues]=useState<Record<string,string>>({}),[step,setStep]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[conflict,setConflict]=useState(false),[dirty,setDirty]=useState(false),[confirmed,setConfirmed]=useState(false),[consent,setConsent]=useState<string|null>(null),[success,setSuccess]=useState(false);
 const {request:ask,confirmation}=useConfirmation(locale);
 const dialogs=confirmationActions[locale];
 const finalIntent=useRef<{action:string;public_ref:string;revision:number;confirmed:boolean}|null>(null);
 const [returnJob,setReturnJob]=useState<string|null>(null);
 const [finalPending,setFinalPending]=useState(false);
 const lock=useRef(false),alive=useRef(true),keys=useRef<Partial<Record<Kind,string>>>({});
 const unauthorized=useRef(onUnauthorized);useEffect(()=>{unauthorized.current=onUnauthorized;},[onUnauthorized]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useWorkDraft(dirty,t.error);
 const api=useCallback(async(path='',body?:unknown)=>{const pdf=body instanceof File;const response=await fetch(`/api/shida/personal/candidate${path}?language=${locale}`,{method:body===undefined?'GET':'POST',cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding,...(body!==undefined?{'Content-Type':pdf?'application/pdf':'application/json'}:{})},body:body===undefined?undefined:pdf?body:JSON.stringify(body)});if(response.status===401){unauthorized.current();throw new Error('401');}if(!response.ok)throw new Error(String(response.status));return response.json();},[binding,locale]);
 const opened=useRef(false);
 const [recoverRef,setRecoverRef]=useState<string|null>(null);
 const load=useCallback(()=>api().then((result:Data)=>{
  if(!alive.current)return;setData(result);
  if(opened.current)return;opened.current=true;
  const query=new URLSearchParams(window.location.search),type=query.get('profile'),ref=query.get('record');
  if(type!=='professional'&&type!=='occasional_work')return;
  const existing=result.profiles.find(p=>p.type===type&&!p.archived);
  const drafts=result.progress.filter(d=>d.profile_type===type&&['active','expired'].includes(d.state));
  if(existing&&(!ref||ref===existing.reference)){setProfile(existing);setValues(inputValues(existing.values));return;}
  const target=ref?drafts.find(d=>d.public_ref===ref):drafts[0];
  if(target?.state==='expired'){setRecoverRef(target.public_ref);return;}
  if(ref&&!target||existing)return;
  // A link may open a blank form; only an explicit save creates a private draft.
  const entry=target??{public_ref:'',profile_type:type,state:'new',revision:0,values:{},return_job_ref:null};
  setDraft(entry);setValues(inputValues(entry.values));setReturnJob(entry.return_job_ref);
  setStep(target?candidateResumeStep(entry.values,result.metadata.required[type],type):0);
 }),[api]);
 useEffect(()=>{void load().catch(()=>{if(alive.current)setMessage(t.error);});},[load,t.error]);
 async function run(action:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setMessage('');setConflict(false);try{await action();}catch(error){if(alive.current){setConflict(error instanceof Error&&error.message==='409');setMessage(error instanceof Error&&error.message==='409'?t.conflict:t.error);}}finally{lock.current=false;if(alive.current)setBusy(false);}}
 const begin=(d:Draft)=>{setRecoverRef(null);finalIntent.current=null;setFinalPending(false);setReturnJob(d.return_job_ref);setDraft(d);setProfile(null);setValues(inputValues(d.values));setStep(candidateResumeStep(d.values,data?.metadata.required[d.profile_type]??[],d.profile_type));setDirty(false);setConfirmed(false);setSuccess(false);};
 const kind=profile?.type??draft?.profile_type??'professional';
 const fields=kind==='professional'?(step===0?searchFields:skillFields):(step===0?['work_types','city','preferred_areas','availability']:['short_experience','description','expected_payment']);
 const label=(key:string)=>t.fields[key as keyof typeof t.fields]??key;
 function change(key:string,value:string){finalIntent.current=null;setFinalPending(false);setValues(old=>({...old,[key]:value}));setDirty(true);setConfirmed(false);}
 async function save(){if(profile){await api('/profile',{action:'update',reference:profile.reference,version:profile.version,values:candidateValues(values)});setProfile(null);}else if(draft){let current=draft;
  if(!current.public_ref){keys.current[current.profile_type]??=crypto.randomUUID();current=await api('',{action:'start',profile_type:current.profile_type,operation_key:keys.current[current.profile_type],return_job_ref:returnRef});if(alive.current)setDraft(current);}
  const result=await api('',{action:'save',public_ref:current.public_ref,revision:current.revision,values:candidateValues(values)});if(alive.current){setDraft(result);setDirty(false);}return result as Draft;}setDirty(false);}
 async function exit(){await save();if(alive.current){setDraft(null);setProfile(null);setDirty(false);}await load();}
 const returnRef=returnJob??draft?.return_job_ref??(typeof window!=='undefined'?new URLSearchParams(window.location.search).get('job'):null);
 const returnLink=returnRef&&/^[A-Za-z0-9_-]{1,64}$/.test(returnRef)?`${prefix}/shida/emplois/${encodeURIComponent(returnRef)}`:null;
 function field(key:string){const required=data!.metadata.required[kind].includes(key);if(lists.has(key))return <CandidateChips key={key} label={label(key)} value={values[key]??''} onChange={v=>change(key,v)} required={required} max={key==='desired_titles'?3:20} add={u.add} remove={u.removeItem} suggestions={key==='work_types'?u.contracts:[]}/>;
 const options=key==='availability'?u.availability:key==='experience_level'?u.experience:[];
 return <label key={key} className={['description','short_experience'].includes(key)?'candidate-wide':''}><span>{label(key)} {required?<span className="candidate-required">*</span>:<small>{t.optional}</small>}</span>{key==='primary_category'?<select value={values[key]??''} required={required} onChange={e=>change(key,e.target.value)}><option value="">—</option>{data!.metadata.categories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>:['description','short_experience'].includes(key)?<><textarea maxLength={2000} required={required} value={values[key]??''} onChange={e=>change(key,e.target.value)}/><small className="candidate-count">{(values[key]??'').length} / 2 000</small></>:<><input maxLength={2000} type={key==='social_link'?'url':'text'} list={options.length?`candidate-${key}`:undefined} required={required} value={values[key]??''} onChange={e=>change(key,e.target.value)}/>{options.length>0&&<datalist id={`candidate-${key}`}>{options.map(v=><option key={v} value={v}/>)}</datalist>}</>}</label>;
 }
 return <section className="candidate-workspace" aria-busy={busy}>
  <WenzeLeaveDialog locale={locale} title={u.leave} onSave={async()=>{if(lock.current||finalPending||conflict)throw Error();lock.current=true;try{await save();}finally{lock.current=false;}}}/>
  {confirmation}<p>{t.intro}</p>
  {message&&<div role="alert" className="candidate-notice">{message}<button disabled={busy} onClick={()=>void run(async()=>{await load();if(draft){const next=(await api()) as Data;const current=next.progress.find(d=>d.public_ref===draft.public_ref);if(current&&current.state==='active')begin(current);else{finalIntent.current=null;setFinalPending(false);setDraft(null);setDirty(false);}}else if(profile){const next=(await api()) as Data;const current=next.profiles.find(p=>p.reference===profile.reference);if(current){setProfile(current);setValues(inputValues(current.values));setDirty(false);}}})}>{t.reload}</button></div>}
  {success&&<p role="status" className="candidate-notice">{t.success}</p>}
  {!data&&!message&&<p role="status">{t.loading}</p>}
  {data&&(draft||profile)?<div className="candidate-wizard-layout"><aside className="candidate-wizard-art"><Image src="/images/marketplace-heroes/jobs.svg" width={360} height={190} alt=""/><h2>{t.title}</h2><p>{t.intro}</p><p>{t.privacy}</p></aside><div>
   <ol className="candidate-steps">{t.steps.map((name,index)=><li key={name} aria-current={step===index?'step':undefined}><span>{index+1}</span>{name}</li>)}</ol>
   <form className="candidate-form" onSubmit={e=>{e.preventDefault();if(step<2){setStep(step+1);setConfirmed(false);}else void run(async()=>{if(profile){await exit();return;}const saved=finalIntent.current?null:await save();if(saved)finalIntent.current={action:'finalize',public_ref:saved.public_ref,revision:saved.revision,confirmed};if(finalIntent.current){setFinalPending(true);await api('',finalIntent.current);finalIntent.current=null;setFinalPending(false);setDraft(null);setDirty(false);setSuccess(true);await load();}});}}>
    <h2>{step===2?t.review:t.steps[step]}</h2>
    {step<2?<><p>{u.required}</p><div className="candidate-fields">{fields.filter(key=>!candidateOptionalFields.includes(key)).map(field)}</div>{step===1&&kind==='professional'&&<details className="candidate-optional"><summary>{u.optional}</summary><div className="candidate-fields">{candidateOptionalFields.map(field)}</div></details>}</>:<>{[searchFields,['experience_level','skills','description','short_experience'],[...candidateOptionalFields,'preferred_areas','expected_payment']].map((group,index)=><section className="candidate-review-group" key={index}><header><h3>{u.reviewGroups[index]}</h3><button type="button" disabled={busy||finalPending} onClick={()=>setStep(index===0?0:1)}>{t.edit}</button></header><dl className="candidate-review">{group.filter(key=>values[key]).map(key=><div key={key}><dt>{label(key)}</dt><dd>{key==='primary_category'?data.metadata.categories.find(c=>c.id===values[key])?.label??values[key]:values[key]}</dd></div>)}{index===2&&kind==='professional'&&<div><dt>{t.cv}</dt><dd>{values.cv_choice==='2'?t.noCV:values.cv_asset_ref?t.uploaded:profile?.has_cv?t.keepCV:'—'}</dd></div>}</dl></section>)}<p className="candidate-notice">{t.privacy}</p></>}

    {step===1&&kind==='professional'&&<fieldset><legend>{t.cv}</legend>{profile?.has_cv&&!values.cv_choice&&<p>{t.keepCV}</p>}<label className="candidate-upload">{u.chooseFile}<input aria-label={t.cv} type="file" accept="application/pdf" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(!file)return;const invalid=fileValidation(file,locale,10,['application/pdf'],'PDF');if(invalid){setMessage(invalid);return;}void run(async()=>{const result=await api('/document',file);change('cv_asset_ref',result.asset_ref);change('cv_choice','1');});}}/></label>{values.cv_asset_ref&&values.cv_choice==='1'&&<p role="status">{t.uploaded}</p>}<label className="candidate-checkbox"><input type="checkbox" checked={values.cv_choice==='2'} onChange={e=>{change('cv_choice',e.target.checked?'2':'');if(e.target.checked)change('cv_asset_ref','');}}/>{t.noCV}</label></fieldset>}
    {step===2&&!profile&&<label className="candidate-checkbox"><input type="checkbox" required checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{t.confirm}</label>}
    <div className="candidate-actions">{step>0&&<button type="button" disabled={busy||finalPending} onClick={()=>setStep(step-1)}>{t.back}</button>}<button type="button" disabled={busy||conflict||finalPending} onClick={()=>void run(exit)}>{t.save}</button><button className="button-primary" disabled={busy||conflict||step===2&&!profile&&(!confirmed||kind==='professional'&&!values.cv_choice)}>{step<2?t.next:profile?t.update:t.create}</button></div>
   </form>
  </div></div>:data&&<>
   <p className="candidate-notice">{t.privacy}</p>
   <div className="candidate-profile-grid">{(['professional','occasional_work'] as Kind[]).map(type=>{const existing=data.profiles.find(p=>p.type===type&&!p.archived),progress=data.progress.filter(d=>d.profile_type===type&&['active','expired'].includes(d.state));if(recoverRef&&data.progress.some(d=>d.public_ref===recoverRef&&d.state==='expired')&&!progress.some(d=>d.public_ref===recoverRef))return null;return <article key={type} className="candidate-profile-panel"><h2>{t[type]}</h2><p>{type==='professional'?u.professionalHelp:u.occasionalHelp}</p>{existing?<><p>{t[existing.visibility as 'private']??existing.visibility}</p><p>{existing.values.city}</p><button disabled={busy} onClick={()=>{setProfile(existing);setDraft(null);setValues(inputValues(existing.values));setStep(0);setDirty(false);setConfirmed(false);}}>{t.edit}</button>{type==='professional'&&<details><summary>{t.visibility}</summary><label className="candidate-checkbox"><input type="checkbox" checked={consent===existing.reference} onChange={e=>setConsent(e.target.checked?existing.reference:null)}/>{t.consent}</label><button disabled={busy||consent!==existing.reference} onClick={()=>void run(async()=>{await api('/profile',{action:'visibility',reference:existing.reference,version:existing.version,visibility:'open_to_work',consent:true});setConsent(null);await load();})}>{t.open}</button><button disabled={busy} onClick={()=>void run(async()=>{await api('/profile',{action:'visibility',reference:existing.reference,version:existing.version,visibility:'private'});await load();})}>{t.hide}</button></details>}<button disabled={busy} onClick={()=>ask({title:t.archive,description:dialogs.archiveCandidate,confirmLabel:t.archive,severity:'warning',onConfirm:async()=>{await api('/profile',{action:'archive',reference:existing.reference,version:existing.version});void load().catch(()=>setMessage(t.error));}})}>{t.archive}</button></>:<>{progress.length?progress.filter(d=>!recoverRef||d.public_ref===recoverRef).map(d=><div key={d.public_ref} className="candidate-draft-card"><h3>{u.unfinished}</h3><p>{t.saved} · {d.state==='expired'?t.expired:t.private}</p><p>{t.steps[candidateResumeStep(d.values,data.metadata.required[type],type)]}</p><progress max={3} value={candidateResumeStep(d.values,data.metadata.required[type],type)}/>{d.updated_at&&<p>{u.updated} {new Date(d.updated_at).toLocaleString(locale==='ln'?'fr-CD':locale)}</p>}<button disabled={busy} onClick={()=>void run(async()=>{begin(d.state==='expired'?await api('',{action:'recover',public_ref:d.public_ref,revision:d.revision}):d);})}>{d.state==='expired'?t.recover:t.resume}</button><button disabled={busy} onClick={()=>ask({title:u.remove,description:u.removeHelp,confirmLabel:u.delete,cancelLabel:u.keep,severity:'danger',onConfirm:async()=>{await api('',{action:'cancel',public_ref:d.public_ref,revision:d.revision});setRecoverRef(null);delete keys.current[d.profile_type];void load().catch(()=>setMessage(t.error));}})} className="candidate-danger">{u.delete}</button></div>):<><p>{u.empty}</p><button className="button-primary" disabled={busy} onClick={()=>void run(async()=>{keys.current[type]??=crypto.randomUUID();begin(await api('',{action:'start',profile_type:type,operation_key:keys.current[type],return_job_ref:returnRef}));})}>{t.start}</button></>}</>}</article>;})}</div>
   {data.profiles.some(p=>!['professional','occasional_work'].includes(p.type))&&<p>{t.legacy}</p>}
  </>}
  {returnLink&&<nav className="candidate-actions"><a onClick={async e=>{e.preventDefault();if(await leaveWork())window.location.assign(returnLink);}} href={returnLink}>{t.returnJob} →</a></nav>}
 </section>;
}
