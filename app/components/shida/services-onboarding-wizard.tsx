'use client';
import Image from 'next/image';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {servicesOnboardingCopy} from '@/app/lib/services-onboarding-copy';
import {useWorkDraft,leaveWork} from '@/app/lib/restaurant-work';
import './services-onboarding-wizard.css';
type Locale=keyof typeof servicesOnboardingCopy;
type Values=Record<string,string|null>;
type Progress={public_ref:string;revision:number;status:string;provider_revision:number|null;fields:Values;service_ref:string|null};
type Identity={public_ref:string;revision:number;name:string|null;bio:string|null;primary_category:string|null};
type Data={progress:Progress[];remaining_capacity:number|null;professional_profile:Identity|null};
function formValues(fields:Values,identity:Identity|null|undefined):Values {return identity?Object.fromEntries(Object.entries(fields).filter(([key])=>!['name','bio','primary_category'].includes(key))):fields;}
type Props={locale:Locale;accountName:string;categories:Record<string,string>;call:(path:string,method?:string,body?:object)=>Promise<Record<string,unknown>>;onCreated:(ref:string)=>Promise<void>};
export function ServicesOnboardingWizard({locale,accountName,categories,call,onCreated}:Props){
 const t=servicesOnboardingCopy[locale],api=useRef(call);
 useEffect(()=>{api.current=call;},[call]);
 const [data,setData]=useState<Data|null>(null),[progress,setProgress]=useState<Progress|null>(null),[values,setValues]=useState<Values>({}),[step,setStep]=useState(1),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[confirmed,setConfirmed]=useState(false);
 const key=useRef<string|null>(null),pending=useRef(false);
 const [finalIntent,setFinalIntent]=useState<Progress|null>(null);
 const dirty=!!progress&&JSON.stringify(values)!==JSON.stringify(progress.fields);
 useWorkDraft(dirty,t.error,locale);
 async function load(){setBusy(true);try{const result=await api.current('/onboarding') as unknown as Data;setData(result);setFinalIntent(null);setConfirmed(false);setMessage('');const active=result.progress.find(row=>row.status==='active');if(active){setProgress(active);setValues(formValues(active.fields,result.professional_profile));setStep(result.professional_profile?2:1);}else{setProgress(null);setValues({});}}catch{setMessage(t.error);}finally{setBusy(false);}}
 useEffect(()=>{
  let active=true;
  async function enter() {
   const result=await api.current('/onboarding') as unknown as Data;
   if(!active)return;
   setData(result);
   let row=result.progress.find(item=>item.status==='active');
   if(!row && result.remaining_capacity!==0 && new URLSearchParams(window.location.search).get('intent')==='create') {
    key.current??=crypto.randomUUID();
    setBusy(true);
    row=await api.current('/onboarding','POST',{action:'start',operation_key:key.current}) as unknown as Progress;
   }
   if(active && row) {
    setProgress(row);setValues(formValues(row.fields,result.professional_profile));setStep(result.professional_profile?2:1);
   }
  }
  void enter().catch(()=>{if(active)setMessage(t.error);}).finally(()=>{if(active)setBusy(false);});
  return()=>{active=false;};
 },[t.error]);
 async function command(body:object){return await api.current('/onboarding','POST',body) as unknown as Progress;}
 async function operate(work:()=>Promise<void>){if(pending.current)return;pending.current=true;setBusy(true);setMessage('');try{await work();}catch{setMessage(t.error);}finally{pending.current=false;setBusy(false);}}
 async function start(){await operate(async()=>{key.current??=crypto.randomUUID();const row=await command({action:'start',operation_key:key.current});setProgress(row);setValues(formValues(row.fields,data?.professional_profile));setStep(data?.professional_profile?2:1);});}
 async function save(){if(!progress)throw Error('missing');const row=await command({action:'save',public_ref:progress.public_ref,revision:progress.revision,fields:values});setProgress(row);setValues(formValues(row.fields,data?.professional_profile));return row;}
 async function next(event:FormEvent){event.preventDefault();await operate(async()=>{await save();setStep(old=>Math.min(3,old+1));setConfirmed(false);});}
 async function create(event:FormEvent){event.preventDefault();if(!confirmed)return;await operate(async()=>{const row=finalIntent??await save();setFinalIntent(row);const result=await command({action:'finalize',public_ref:row.public_ref,revision:row.revision,confirmed:true});if(!result.service_ref)throw Error('missing');setProgress(result);setValues({});setFinalIntent(null);await onCreated(result.service_ref);});}
 function set(name:string,value:string){if(finalIntent)return;setValues(old=>({...old,[name]:value}));setConfirmed(false);}
 const identity=data?.professional_profile;
 const category=(name:string,label:string)=><fieldset className="svc-onboarding-categories"><legend>{label} *</legend>{Object.entries(categories).map(([id,title])=><label key={id} className={values[name]===id?'is-selected':''}><input type="radio" name={name} required value={id} checked={values[name]===id} onChange={()=>set(name,id)}/><span>{title}</span></label>)}</fieldset>;
 return <section className="svc-onboarding" aria-busy={busy}>
  <aside><h2>{identity?t.add:t.title}</h2><p>{t.intro}</p><Image src="/shida/services-onboarding-professions.png" width={1536} height={1024} sizes="(max-width:760px) 220px, 360px" alt="" className="svc-onboarding-art"/><p>{t.private}</p></aside>
  <div className="svc-onboarding-main"><h2>{identity?t.add:t.title}</h2>{data&&<p>{t.remaining}: <strong>{data.remaining_capacity??'—'}</strong></p>}
   <p role="status">{message}</p>{message&&<button type="button" disabled={busy} onClick={async ()=>{if(!dirty||(await leaveWork()))void load();}}>{t.reload}</button>}
   {!data&&<p>{t.loading}</p>}
   {data&&!progress&&<><button type="button" disabled={busy||data.remaining_capacity===0} onClick={()=>void start()}>{identity?t.add:t.title}</button>{data.progress.filter(row=>['expired','cancelled'].includes(row.status)).map(row=><article key={row.public_ref}><h3>{row.fields.service_name||t.steps[1]}</h3><p>{t.expired}</p><button type="button" disabled={busy} onClick={()=>void operate(async()=>{const restored=await command({action:'resume',public_ref:row.public_ref,revision:row.revision,identity_revision:identity?.revision??null});setProgress(restored);setValues(formValues(restored.fields,identity));setStep(identity?2:1);})}>{t.resume}</button></article>)}</>}
   {progress?.status==="completed"&&progress.service_ref&&<button type="button" onClick={()=>void operate(()=>onCreated(progress.service_ref!))}>{t.manage}</button>}
   {data&&!progress&&data.progress.filter(row=>row.status==="completed"&&row.service_ref).slice(0,3).map(row=><button key={row.public_ref} type="button" disabled={busy} onClick={()=>void operate(()=>onCreated(row.service_ref!))}>{t.manage}</button>)}
   {progress&&progress.status==='active'&&<><ol className="svc-onboarding-steps">{t.steps.map((title,index)=><li key={title} aria-current={step===index+1?'step':undefined}><span>{index+1}</span>{index===1&&identity?t.add:title}</li>)}</ol>
   {identity&&<div className="svc-onboarding-notice"><strong>{identity.name}</strong><p>{t.existing}</p>{progress.provider_revision!==identity.revision&&<button type="button" disabled={busy} onClick={()=>void operate(async()=>{const restored=await command({action:"resume",public_ref:progress.public_ref,revision:progress.revision,identity_revision:identity.revision});setProgress(restored);setValues(formValues(restored.fields,identity));})}>{t.resume}</button>}</div>}
   {finalIntent&&<p role="status">{t.retryConfirmation}</p>}<form onSubmit={step===3?create:next}><fieldset disabled={busy}>
    {step===1&&!identity&&<><h3>{t.steps[0]}</h3><div className="svc-onboarding-name-actions">{accountName&&<button type="button" onClick={()=>set('name',accountName)}>{t.personal}</button>}<button type="button" onClick={()=>set('name','')}>{t.brand}</button></div><label>{t.name} *<input required maxLength={200} value={values.name??''} onChange={e=>set('name',e.target.value)}/></label><p>{t.notice}</p>{category('primary_category',t.primary)}<label>{t.bio}<textarea maxLength={2000} value={values.bio??''} onChange={e=>set('bio',e.target.value)}/></label></>}
    {step===2&&<><h3>{identity?t.add:t.steps[1]}</h3><label>{t.service} *<input required maxLength={200} value={values.service_name??''} onChange={e=>set('service_name',e.target.value)}/></label>{category('category',t.category)}<label>{t.description}<textarea maxLength={4000} value={values.description??''} onChange={e=>set('description',e.target.value)}/></label></>}
    {step===3&&<><h3>{t.steps[2]}</h3><dl>{[[t.name,identity?.name??values.name],[t.bio,identity?.bio??values.bio],[t.primary,categories[(identity?.primary_category??values.primary_category)??'']],[t.service,values.service_name],[t.category,categories[values.category??'']],[t.description,values.description]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'—'}</dd></div>)}</dl><p className="svc-onboarding-notice">{t.private}</p><label className="svc-onboarding-confirm"><input type="checkbox" required checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{t.confirm}</label></>}
    <footer><button type="button" disabled={!!finalIntent} onClick={()=>void operate(async()=>{const saved=await save();await command({action:"cancel",public_ref:saved.public_ref,revision:saved.revision});key.current=null;await load();})}>{t.cancel}</button>{step>(identity?2:1)&&<button type="button" disabled={!!finalIntent} onClick={()=>setStep(old=>old-1)}>{t.back}</button>}<button type="button" disabled={!!finalIntent} onClick={()=>void operate(async()=>{await save();setMessage(t.saved);})}>{t.save}</button><button className="svc-primary" type="submit" disabled={data?.remaining_capacity===0||step===3&&!confirmed}>{step===3?t.create:t.next} →</button></footer>
   </fieldset></form></>}
  </div>
 </section>;
}
