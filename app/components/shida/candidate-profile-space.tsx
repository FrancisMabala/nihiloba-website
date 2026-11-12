'use client';
import {candidateWorkspaceCopy} from '../../lib/candidate-workspace-copy';
import {SpaceIcon} from './account-space-icon';
import {fileValidation} from '../../lib/file-validation';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ProfessionalProfileForm} from './professional-profile-form';
import {candidateCopy} from '../../lib/candidate-profile-copy';
import {useWorkDraft,WenzeLeaveDialog,leaveWork} from '../../lib/wenze-work';
import {candidateUX,candidateResumeStep} from '../../lib/candidate-ux';
import {useConfirmation} from './confirmation-dialog';
import {confirmationActions} from '../../lib/confirmation-actions';
import {OccasionalSummary} from './occasional-profile-summary';
import {initial} from '../../lib/occasional-form';
import {OccasionalWizard} from './occasional-wizard';
import {occText} from '../../lib/occasional-copy';
import './candidate-profile-space.css';
type Locale=keyof typeof candidateCopy;
type Kind='professional'|'occasional_work';
type Values=Record<string,string|string[]|null>;
type Draft={editing?:string|null;public_ref:string;profile_type:Kind;state:string;revision:number;values:Values;return_job_ref:string|null;updated_at?:string};
type Profile={reference:string;type:Kind;version:string;archived:boolean;visibility:string;values:Values;has_cv:boolean};
type Data={progress:Draft[];profiles:Profile[];metadata:{communes?:string[];categories:{id:string;label:string}[];required:Record<Kind,string[]>}};
const lists=new Set(['desired_titles','skills','work_types','languages','preferred_areas']);
const inputValues=(values:Values)=>Object.fromEntries(Object.entries(values).map(([key,value])=>[key,Array.isArray(value)?value.join(', '):value??'']));
export function candidateValues(values:Record<string,string>):Values{return Object.fromEntries(Object.entries(values).map(([key,value])=>[key,lists.has(key)?value.split(',').map(v=>v.trim()).filter(Boolean):value]));}
function SavedHouseholdProfile({profile,communes,locale,compact=false}:{profile:Profile;communes:string[];locale:Locale;compact?:boolean}){
 const values=inputValues(profile.values);
 const answers=initial(values,communes);
 return <>
  <OccasionalSummary locale={locale} answers={answers} compact={compact} legacy={values.occasional_answers?undefined:values}/>
  {!compact&&<h3>{candidateCopy[locale].visibility}</h3>}
  <p>{occText(locale,answers.discovery?'visible':'private')}</p>
 </>;
}
export function CandidateProfileSpace({locale,binding,onUnauthorized}:{locale:Locale;binding:string;onUnauthorized:()=>void}){
 const t=candidateCopy[locale],u=candidateUX[locale],prefix=locale==='en'?'':`/${locale}`;
 const [data,setData]=useState<Data|null>(null),[draft,setDraft]=useState<Draft|null>(null),[profile,setProfile]=useState<Profile|null>(null),[values,setValues]=useState<Record<string,string>>({}),[step,setStep]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[conflict,setConflict]=useState(false),[dirty,setDirty]=useState(false),[confirmed,setConfirmed]=useState(false),[consent,setConsent]=useState<string|null>(null),[success,setSuccess]=useState<Kind|null>(null);
 const [reading,setReading]=useState<Profile|null>(null),[updated,setUpdated]=useState(false);
 const {request:ask,confirmation}=useConfirmation(locale);
 const dialogs=confirmationActions[locale];
 const finalIntent=useRef<{action:string;public_ref:string;revision:number;confirmed:boolean}|null>(null);
 const [returnJob,setReturnJob]=useState<string|null>(null);
 const [finalPending,setFinalPending]=useState(false);
 const lock=useRef(false),alive=useRef(true),keys=useRef<Partial<Record<Kind,string>>>({});
 const unauthorized=useRef(onUnauthorized);useEffect(()=>{unauthorized.current=onUnauthorized;},[onUnauthorized]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useWorkDraft(dirty,t.error);
 const api=useCallback(async(path='',body?:unknown)=>{const pdf=body instanceof File;const response=await fetch(`/api/shida/personal/candidate${path}/?language=${locale}`,{method:body===undefined?'GET':'POST',cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding,...(body!==undefined?{'Content-Type':pdf?'application/pdf':'application/json'}:{})},body:body===undefined?undefined:pdf?body:JSON.stringify(body)});if(response.status===401){unauthorized.current();throw new Error('401');}if(!response.ok)throw new Error(String(response.status));return response.json();},[binding,locale]);
 const opened=useRef(false);
 const [recoverRef,setRecoverRef]=useState<string|null>(null);
 const load=useCallback(()=>api().then((result:Data)=>{
  if(!alive.current)return;setData(result);
  if(opened.current)return;opened.current=true;
  const query=new URLSearchParams(window.location.search),type=query.get('profile'),ref=query.get('record');
  if(type!=='professional'&&type!=='occasional_work')return;
  const existing=result.profiles.find(p=>p.type===type&&!p.archived);
  if(type==='occasional_work'&&query.get('mode')==='view'){if(existing&&existing.reference===ref)setReading(existing);return;}
  const drafts=result.progress.filter(d=>d.profile_type===type&&['active','expired'].includes(d.state));
  const editingDraft=existing&&drafts.find(d=>d.editing===existing.reference);
  if(editingDraft&&editingDraft.state==='active'&&(!ref||ref===existing?.reference||ref===editingDraft.public_ref)){setDraft(editingDraft);setValues(inputValues(editingDraft.values));return;}
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
 const begin=(d:Draft)=>{setRecoverRef(null);finalIntent.current=null;setFinalPending(false);setReturnJob(d.return_job_ref);setDraft(d);setProfile(null);setValues(inputValues(d.values));setStep(candidateResumeStep(d.values,data?.metadata.required[d.profile_type]??[],d.profile_type));setDirty(false);setConfirmed(false);setSuccess(null);};
 function editRecord(existing:Profile){
  const edit=data?.progress.find(d=>d.editing===existing.reference&&['active','expired'].includes(d.state));
  setReading(null);setSuccess(null);
  if(edit){void run(async()=>begin(edit.state==='expired'?await api('',{action:'recover',public_ref:edit.public_ref,revision:edit.revision}):edit));return;}
  delete keys.current[existing.type];setProfile(existing);setDraft(null);setValues(inputValues(existing.values));setStep(0);setDirty(false);setConfirmed(false);
 }
 const profilesPath=prefix+'/shida/space/?view=job-search&section=profiles';
 const kind=profile?.type??draft?.profile_type??'professional';
 function change(key:string,value:string){finalIntent.current=null;setFinalPending(false);setValues(old=>({...old,[key]:value}));setDirty(true);setConfirmed(false);}
 async function save(){if(kind==='occasional_work'&&(draft||profile)){let current=draft;
  if(!current?.public_ref){keys.current.occasional_work??=crypto.randomUUID();current=await api('',{action:'start',profile_type:kind,operation_key:keys.current.occasional_work,return_job_ref:returnRef,...(profile?{edit_ref:profile.reference,edit_version:profile.version}:{})});setDraft(current);}
  const payload=candidateValues(values);delete payload._edit_version;
  const result=await api('',{action:'save',public_ref:current!.public_ref,revision:current!.revision,values:payload});setDraft(result);setDirty(false);return result as Draft;
 }if(profile){await api('/profile',{action:'update',reference:profile.reference,version:profile.version,values:candidateValues(values)});setProfile(null);}else if(draft){let current=draft;
  if(!current.public_ref){keys.current[current.profile_type]??=crypto.randomUUID();current=await api('',{action:'start',profile_type:current.profile_type,operation_key:keys.current[current.profile_type],return_job_ref:returnRef});if(alive.current)setDraft(current);}
  const result=await api('',{action:'save',public_ref:current.public_ref,revision:current.revision,values:current.profile_type==='professional'?{...candidateValues(values),cv_choice:values.cv_choice||(values.cv_asset_ref?'1':'2')}:candidateValues(values)});if(alive.current){setDraft(result);setDirty(false);}return result as Draft;}setDirty(false);}
 async function exit(){await save();if(alive.current){setDraft(null);setProfile(null);setDirty(false);}await load();}
 const returnRef=returnJob??draft?.return_job_ref??(typeof window!=='undefined'?new URLSearchParams(window.location.search).get('job'):null);
 const returnLink=returnRef&&/^[A-Za-z0-9_-]{1,64}$/.test(returnRef)?`${prefix}/shida/emplois/${encodeURIComponent(returnRef)}`:null;
 async function finishProfessional(){
  if(profile){await exit();return;}
  if(!confirmed)return;
  if(!finalIntent.current){
   const saved=await save();
   if(!saved)return;
   finalIntent.current={action:'finalize',public_ref:saved.public_ref,revision:saved.revision,confirmed:true};
  }
  setFinalPending(true);
  await api('',finalIntent.current);
  finalIntent.current=null;setFinalPending(false);delete keys.current.professional;
  setDraft(null);setDirty(false);setSuccess('professional');await load();
 }
 return <section className="candidate-workspace" aria-busy={busy}>
  <WenzeLeaveDialog locale={locale} title={u.leave} onSave={async()=>{if(lock.current||finalPending||conflict)throw Error();lock.current=true;try{await save();}finally{lock.current=false;}}}/>
  {confirmation}
  {message&&<div role="alert" className="candidate-notice">{message}<button disabled={busy} onClick={()=>void run(async()=>{await load();if(draft){const next=(await api()) as Data;const current=next.progress.find(d=>d.public_ref===draft.public_ref);if(current&&current.state==='active')begin(current);else{finalIntent.current=null;setFinalPending(false);setDraft(null);setDirty(false);}}else if(profile){const next=(await api()) as Data;const current=next.profiles.find(p=>p.reference===profile.reference);if(current){setProfile(current);setValues(inputValues(current.values));setDirty(false);}}})}>{t.reload}</button></div>}
  {success&&<p role="status" className="candidate-notice">{success==='professional'?t.success:occText(locale,updated?'updated':'saved')}</p>}
  {!data&&!message&&<p role="status">{t.loading}</p>}
  {data&&(draft||profile)&&kind==='occasional_work'?<OccasionalWizard locale={locale} values={values} communes={data.metadata.communes??[]} editing={!!profile||!!draft?.editing} busy={busy||conflict} pending={finalPending} change={v=>change('occasional_answers',v)} onSave={()=>void run(exit)} onFinish={()=>void run(async()=>{if(!finalIntent.current){const s=await save();if(!s)return;finalIntent.current={action:'finalize',public_ref:s.public_ref,revision:s.revision,confirmed:true};}setFinalPending(true);await api('',finalIntent.current);setFinalPending(false);finalIntent.current=null;setDraft(null);setProfile(null);setDirty(false);setUpdated(Boolean(profile||draft?.editing));setSuccess('occasional_work');delete keys.current.occasional_work;if(returnRef&&new URLSearchParams(window.location.search).get("from")==="mission"){window.location.assign(prefix+"/shida/space?"+new URLSearchParams({view:"job-offer",kind:"apply",offer:returnRef}));return}await load();})}/>:data&&(draft||profile)?<ProfessionalProfileForm key={draft?.profile_type??profile?.reference} locale={locale} values={values} step={step}
    categories={data.metadata.categories} editing={Boolean(profile)} existingCV={Boolean(profile?.has_cv)}
    busy={busy||conflict} frozen={finalPending} confirmed={confirmed} setConfirmed={setConfirmed}
    setStep={setStep} change={change} save={()=>void run(exit)} finish={()=>void run(finishProfessional)}
    upload={async file=>{
     const error=fileValidation(file,locale,10,['application/pdf'],'PDF');if(error)throw Error(error);
     if(lock.current)throw Error(t.error);lock.current=true;setBusy(true);
     try{const result=await api('/document',file);if(!result.asset_ref)throw Error();change('cv_asset_ref',result.asset_ref);change('cv_filename',file.name);change('cv_choice','1');}
     catch{throw Error(t.error);}finally{lock.current=false;setBusy(false);}
    }}/>:data&&reading?<div className="occ-read">
   <a href={profilesPath}>← {occText(locale,'backProfiles')}</a><h2>{occText(locale,'profileTitle')}</h2>
   <div className="candidate-profile-panel"><SavedHouseholdProfile locale={locale} profile={reading} communes={data.metadata.communes??[]}/>
   <a className="space-primary-action" href={profilesPath+'&profile=occasional_work&record='+encodeURIComponent(reading.reference)}>{occText(locale,'editProfile')}</a></div></div>:data&&<>
   <div className="candidate-profile-grid job-profile-cards">{(['professional','occasional_work'] as Kind[]).map(type=>{const existing=data.profiles.find(p=>p.type===type&&!p.archived),progress=data.progress.filter(d=>d.profile_type===type&&['active','expired'].includes(d.state));if(recoverRef&&data.progress.some(d=>d.public_ref===recoverRef&&d.state==='expired')&&!progress.some(d=>d.public_ref===recoverRef))return null;return <article key={type} className="candidate-profile-panel"><h3><SpaceIcon name={type==='professional'?'management':'people'}/>{candidateWorkspaceCopy[locale][type==='professional'?'company':'individual']}</h3>{(!existing||type==='professional')&&<p>{candidateWorkspaceCopy[locale][type==='professional'?'companyHelp':'individualHelp']}</p>}{existing?<> {type==='occasional_work'?<>
   <SavedHouseholdProfile locale={locale} profile={existing} communes={data.metadata.communes??[]} compact/>
   <a className="space-primary-action" href={profilesPath+'&profile=occasional_work&mode=view&record='+encodeURIComponent(existing.reference)}>{occText(locale,'view')}</a>
  </>:<><p>{t[existing.visibility as 'private']??existing.visibility}</p><p>{existing.values.city}</p></>}
  <button disabled={busy} onClick={()=>editRecord(existing)}>{type==='occasional_work'?occText(locale,'editProfile'):t.edit}</button>{type==='professional'&&<details><summary>{t.visibility}</summary><label className="candidate-checkbox"><input type="checkbox" checked={consent===existing.reference} onChange={e=>setConsent(e.target.checked?existing.reference:null)}/>{t.consent}</label><button disabled={busy||consent!==existing.reference} onClick={()=>void run(async()=>{await api('/profile',{action:'visibility',reference:existing.reference,version:existing.version,visibility:'open_to_work',consent:true});setConsent(null);await load();})}>{t.open}</button><button disabled={busy} onClick={()=>void run(async()=>{await api('/profile',{action:'visibility',reference:existing.reference,version:existing.version,visibility:'private'});await load();})}>{t.hide}</button></details>}<button className={type==='occasional_work'?'occ-text-action':undefined} disabled={busy} onClick={()=>ask({title:t.archive,description:dialogs.archiveCandidate,confirmLabel:t.archive,severity:'warning',onConfirm:async()=>{await api('/profile',{action:'archive',reference:existing.reference,version:existing.version});void load().catch(()=>setMessage(t.error));}})}>{t.archive}</button></>:<>{progress.length?progress.filter(d=>!recoverRef||d.public_ref===recoverRef).map(d=><div key={d.public_ref} className="candidate-draft-card"><p className="profile-privacy"><SpaceIcon name="lock"/>{d.state==='expired'?t.expired:candidateWorkspaceCopy[locale].draft}</p><button className="button-primary" disabled={busy} onClick={()=>void run(async()=>{begin(d.state==='expired'?await api('',{action:'recover',public_ref:d.public_ref,revision:d.revision}):d);})}>{d.state==='expired'?t.recover:candidateWorkspaceCopy[locale].resume}</button><button disabled={busy} onClick={()=>ask({title:u.remove,description:u.removeHelp,confirmLabel:u.delete,cancelLabel:u.keep,severity:'danger',onConfirm:async()=>{await api('',{action:'cancel',public_ref:d.public_ref,revision:d.revision});setRecoverRef(null);delete keys.current[d.profile_type];void load().catch(()=>setMessage(t.error));}})} className="candidate-danger">{candidateWorkspaceCopy[locale].remove}</button></div>):<><button className="button-primary" disabled={busy} onClick={()=>void run(async()=>{keys.current[type]??=crypto.randomUUID();begin(await api('',{action:'start',profile_type:type,operation_key:keys.current[type],return_job_ref:returnRef}));})}>{candidateWorkspaceCopy[locale].start}</button></>}</>}</article>;})}</div>
   {data.profiles.some(p=>!['professional','occasional_work'].includes(p.type))&&<p>{t.legacy}</p>}
  </>}
  {returnLink&&<nav className="candidate-actions"><a onClick={async e=>{e.preventDefault();if(await leaveWork())window.location.assign(returnLink);}} href={returnLink}>{t.returnJob} →</a></nav>}
 </section>;
}
