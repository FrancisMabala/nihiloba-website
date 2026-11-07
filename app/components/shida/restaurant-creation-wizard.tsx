'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import type {RestaurantLocale} from '@/app/services/shida/restaurants-client';
import {request,DashboardApiError} from '@/app/lib/restaurant-seller-browser';
import {restaurantText} from '@/app/lib/restaurant-seller-copy';
import {restaurantOnboardingCopy} from '@/app/lib/restaurant-onboarding-copy';
import {useWorkDraft,leaveWork} from '@/app/lib/restaurant-work';
import './restaurant-creation-wizard.css';
import {ShopIcon} from './wenze-shop-icons';

type Values=Record<string,string|boolean|null>;
type Progress={draft_ref:string;revision:string;status:string;fields:Values;establishment_ref:string|null};
const identity=['name','food_business_type','city','commune','quartier','description'];
const location=['timezone_name','address_visibility','public_address','landmark','confirm_location'];
const kinds=['restaurant','malewa','cafe','fast_food','catering'];

export function RestaurantCreationWizard({binding,locale,operationKey,onClose,onCreated}:{binding:string;locale:RestaurantLocale;operationKey:string;onClose:()=>void;onCreated:(ref:string)=>Promise<void>}) {
  const c=restaurantOnboardingCopy[locale], t=(key:string)=>restaurantText(locale,key);
  const [progress,setProgress]=useState<Progress|null>(null),[values,setValues]=useState<Values>({});
  const [step,setStep]=useState(0),[busy,setBusy]=useState(true),[error,setError]=useState(''),[blocked,setBlocked]=useState(false),[confirmed,setConfirmed]=useState(false),[saved,setSaved]=useState(false);
  const lock=useRef(false),alive=useRef(true),heading=useRef<HTMLHeadingElement>(null);
  const dirty=!!progress && JSON.stringify(values)!==JSON.stringify(progress.fields);
  useWorkDraft(dirty,t('discard'),locale);
  const base='personal/restaurants/onboarding';
  const storageKey=`restaurant-onboarding:${binding}`;
  function accept(next:Progress){setProgress(next);setValues(next.fields);setBlocked(false);setConfirmed(false);try{sessionStorage.setItem(storageKey,next.draft_ref);}catch{/* Progress remains recoverable from the authenticated backend. */}}
  async function finish(ref:string){await onCreated(ref);try{sessionStorage.removeItem(storageKey);}catch{/* Storage may be disabled. */}}
  async function perform(work:()=>Promise<void>){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{await work();}catch(e){if(alive.current){setBlocked(true);setError(e instanceof DashboardApiError&&[401,403,404].includes(e.status)?t('denied'):e instanceof DashboardApiError&&e.status===409?t('conflict'):t('unavailable'));}}
    finally{lock.current=false;if(alive.current)setBusy(false);}
  }
  async function recover(){await perform(async()=>{
    let ref=progress?.draft_ref;
    if(!ref)try{const stored=sessionStorage.getItem(storageKey);if(stored&&/^RON_[a-f0-9]+$/.test(stored))ref=stored;}catch{/* Storage may be disabled. */}
    const next=await request(ref?`${base}/${ref}`:base,ref?{}:{method:'POST',body:JSON.stringify({operation_key:operationKey})},binding) as Progress;
    if(!alive.current)return;
    accept(next);
    if(next.status==='completed'&&next.establishment_ref)await finish(next.establishment_ref);
  });}
  useEffect(()=>{alive.current=true;void recover();return()=>{alive.current=false;};},[]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{heading.current?.focus();},[step]);
  function change(key:string,value:string|boolean){setValues(old=>({...old,[key]:value,...(['city','commune','quartier','address_visibility','public_address','landmark'].includes(key)?{confirm_location:false}:{})}));setSaved(false);setConfirmed(false);}
  async function advance(event:FormEvent){event.preventDefault();if(!progress||blocked)return;await perform(async()=>{
    if(step===2){
      if(!confirmed)return;
      const done=await request(`${base}/${progress.draft_ref}/confirm`,{method:'POST',body:JSON.stringify({revision:progress.revision,confirmed:true})},binding) as Progress;
      if(alive.current&&done.establishment_ref){accept(done);await finish(done.establishment_ref);}return;
    }
    const next=await request(`${base}/${progress.draft_ref}`,{method:'PATCH',body:JSON.stringify({revision:progress.revision,fields:values})},binding) as Progress;
    if(alive.current){accept(next);setSaved(true);setStep(step+1);}
  });}
  function label(key:string){return t(key);}
  function field(key:string,required=false){const value=String(values[key]??'');return <label className={key==='description'||key==='public_address'?'rc-wide':''} key={key}><span>{label(key)} {required?'*':`(${c.optional})`}</span>{key==='description'?<textarea maxLength={4000} value={value} onChange={e=>change(key,e.target.value)}/>:key==='timezone_name'?<select value={value} onChange={e=>change(key,e.target.value)}><option value="">—</option>{[...new Set([value,...Intl.supportedValuesOf('timeZone')])].filter(Boolean).map(zone=><option key={zone} value={zone}>{zone.replaceAll('_',' ')}</option>)}</select>:<input required={required} name={key} maxLength={['public_address','landmark'].includes(key)?2000:200} value={value} onChange={e=>change(key,e.target.value)}/>}</label>;}
  return <section className="rc-wizard container" aria-label={c.title}>
    <aside className="rc-aside"><h2>{c.aside}</h2><p>{c.pitch}</p><img src="/images/shida/restaurant-creation.svg" alt="" width="360" height="290"/><ul>{c.benefits.map((benefit,i)=><li key={benefit}><span aria-hidden="true"><ShopIcon name={(['shop','cash','eye'] as const)[i]}/></span><strong>{benefit}</strong></li>)}</ul></aside>
    <div className="rc-content"><header><span className="rc-store-icon" aria-hidden="true"><ShopIcon name="shop"/></span><div><h1>{c.title}</h1><p>{c.intro}</p></div></header>
      <ol className="rc-steps">{c.steps.map((title,i)=><li key={title} aria-current={i===step?'step':undefined}><span>{i+1}</span>{title}</li>)}</ol>
      <h2 ref={heading} tabIndex={-1}>{step+1}. {c.headings[step]}</h2>
      {error&&<div role="alert" className="rc-notice"><p>{error}</p><p>{c.recovery}</p><button type="button" disabled={busy} onClick={()=>void recover()}>{t('reload')}</button></div>}
      {!progress&&!error&&<p role="status">{t('loading')}</p>}
      {progress&&<form onSubmit={advance}>
        <fieldset disabled={busy||blocked}>
          {step===0&&<><div className="rc-fields">{field('name',true)}</div><fieldset className="rc-types"><legend>{t('food_business_type')} *</legend>{kinds.slice(0,2).map(kind=><label key={kind}><input type="radio" name="food_business_type" value={kind} checked={values.food_business_type===kind} onChange={()=>change('food_business_type',kind)}/><span><strong>{t(kind)}</strong><small>{kind==='restaurant'?c.restaurant:c.malewa}</small></span></label>)}</fieldset><label className="rc-other">{t('food_business_type')}<select value={String(values.food_business_type??'restaurant')} onChange={e=>change('food_business_type',e.target.value)}>{kinds.map(kind=><option key={kind} value={kind}>{t(kind)}</option>)}</select></label><div className="rc-fields">{['city','commune','quartier','description'].map(key=>field(key))}</div></>}
          {step===1&&<><p>{c.location}</p><div className="rc-fields">{field('timezone_name')}<label><span>{t('address_visibility')}</span><select value={String(values.address_visibility??'broad')} onChange={e=>change('address_visibility',e.target.value)}><option value="broad">{t('broad')}</option><option value="public">{t('public')}</option></select></label>{field('public_address')}{field('landmark')}</div><label className="rc-check"><input type="checkbox" checked={values.confirm_location===true} required={values.address_visibility==='public'} onChange={e=>change('confirm_location',e.target.checked)}/><span>{c.consent}</span></label><p className="rc-notice">{c.later}</p></>}
          {step===2&&<><div className="rc-review">{[identity,location].map((keys,i)=><section key={i}><h3>{c.steps[i]} <button type="button" onClick={()=>setStep(i)}>{c.edit}</button></h3><dl>{keys.map(key=><div key={key}><dt>{label(key)}</dt><dd>{key==='confirm_location'?(values[key]===true?'✓':'—'):['food_business_type','address_visibility'].includes(key)?t(String(values[key]??'')):String(values[key]||'—')}</dd></div>)}</dl></section>)}</div><p className="rc-notice">{c.private}</p><label className="rc-check"><input type="checkbox" required checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>{c.confirm}</span></label></>}
        </fieldset>
        <footer><button type="button" disabled={busy} onClick={async ()=>{if(step>0&&!blocked)setStep(step-1);else if((await leaveWork()))onClose();}}>{step>0&&!blocked?c.back:c.cancel}</button><button className="button button-primary" disabled={busy||blocked||step===2&&!confirmed}>{busy?t('saving'):step===2?c.create:c.next} <span aria-hidden="true">→</span></button></footer>
        <p role="status" className="rc-progress">{saved?c.saved:c.resume}</p>
      </form>}
    </div>
  </section>;
}
