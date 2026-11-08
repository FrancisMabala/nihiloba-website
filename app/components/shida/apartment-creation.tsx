'use client';
import {fileValidation} from '../../lib/file-validation';
import {ApartmentCommune} from './apartment-commune';
import {PrivatePhoto} from './apartment-private-photo';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {HomeIcon,CheckIcon,LightbulbIcon} from '../icons';
import {SpaceIcon} from './account-space-icon';
import {apartmentFormCopy} from '../../lib/apartment-form-copy';
import {useWorkDraft,WenzeLeaveDialog,leaveWork} from '../../lib/wenze-work';
import {useCallback, useEffect, useRef, useState} from 'react';
import {WenzeBuyerProvider, useWenzeBuyer} from './wenze-buyer';
import {apartmentCreationCopy} from '../../lib/apartment-creation-copy';
import {apartmentSafetyCopy} from '../../lib/apartment-safety-copy';
import {marketplaceCopy} from './marketplace-copy';
import {apartmentPropertyTypes} from '../../types/shida-public';
import './apartment-creation.css';
type Locale = keyof typeof apartmentCreationCopy;
type Values = {listing_title?:string|null;draft_step?:number|null;public_name:string|null; property_type:string|null; city:string|null; commune:string|null; quartier:string|null; number_of_rooms:number|null; bedroom_count:number|null; size_sqm:number|null; description:string|null; price:number|null; currency:string; advertiser_role:string|null; amenities:Record<string,boolean>|null};
type Draft = {reference:string; revision:number; status:string; values:Values; photos:{reference:string|null;url:string}[];pending_uploads?:string[]};
type Progress = {items:Draft[];identity:{public_name:string;existing_profile:boolean};kinshasa_communes:string[]};
function decodeDraft(value:unknown):Draft {
 const draft = value as Draft;
 if(!draft || !/^APT_[A-Za-z0-9_-]+$/.test(draft.reference) || !Number.isInteger(draft.revision) || !['DRAFT','AVAILABLE','RENTED','SUSPENDED','INACTIVE'].includes(draft.status) || !draft.values || !Array.isArray(draft.photos)) throw Error();
 return draft;
}
export function ApartmentCreation({locale}:{locale:Locale}) {
 return <WenzeBuyerProvider locale={locale} loginMessage={apartmentCreationCopy[locale].login}><BoundCreation locale={locale}/></WenzeBuyerProvider>;
}
function BoundCreation({locale}:{locale:Locale}) {
 const actor = useWenzeBuyer();
 return <Wizard key={actor.binding ?? 'guest'} locale={locale} actor={actor}/>;
}
function Wizard({locale,actor}:{locale:Locale;actor:ReturnType<typeof useWenzeBuyer>}) {
 const router=useRouter();
 const t = apartmentCreationCopy[locale], m = marketplaceCopy[locale], safety = apartmentSafetyCopy[locale];
 const c = apartmentFormCopy[locale];
 const [savedValues,setSavedValues] = useState('');
 const [progress,setProgress] = useState<Progress|null>(null), [draft,setDraft] = useState<Draft|null>(null), [step,setStep] = useState(0);
 const [busy,setBusy] = useState(false), [error,setError] = useState(''), [notice,setNotice] = useState(''), [confirmed,setConfirmed] = useState(false);
 const [pendingPhoto,setPendingPhoto] = useState<{file:File;operation:string}|null>(null);
 const alive = useRef(true), lock = useRef(false), operation = useRef<string|null>(null), panel = useRef<HTMLElement>(null);
 const path = locale === 'en' ? '' : '/'+locale;
 const dirty = Boolean(draft?.status === 'DRAFT' && (JSON.stringify(draft.values)!==savedValues || pendingPhoto));
 useWorkDraft(dirty || busy,c.leave);
 function accept(result:Draft) {setDraft(result);setSavedValues(JSON.stringify(result.values));}
 function resumeStep(result:Draft) {return [0,1,2].includes(result.values.draft_step ?? -1) ? result.values.draft_step! : 0;}
 const request = useCallback(async(body?:unknown) => {
  if(!actor.binding) throw Error();
  const response = await fetch('/api/shida/personal/apartments/',{method:body ? 'POST' : 'GET',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'x-shida-session':actor.binding,...(body ? {'Content-Type':'application/json'} : {})},body:body ? JSON.stringify(body) : undefined});
  if(!response.ok) throw Error(); return response.json();
 },[actor.binding]);
 const load = useCallback(async() => {
  try {
   const value = await request();
   if(!Array.isArray(value.items) || !value.identity || !Array.isArray(value.kinshasa_communes)) throw Error();
   value.items.forEach(decodeDraft);
   const reference = new URLSearchParams(window.location.search).get('draft');
   if(reference) {
    if(!/^APT_[A-Za-z0-9_-]{1,80}$/.test(reference)) throw Error();
    const response = await fetch(`/api/shida/personal/apartments/${reference}/draft/`,{cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'x-shida-session':actor.binding!}});
    if(!response.ok) throw Error();
    const selected = decodeDraft(await response.json());
    if(selected.reference !== reference || selected.status !== 'DRAFT') throw Error();
    if(alive.current) {setDraft(selected);setSavedValues(JSON.stringify(selected.values));setStep(resumeStep(selected));setConfirmed(false);}
   }
   if(alive.current) {setProgress(value); setError('');}
  } catch {if(alive.current) setError(t.error);}
 },[request,t.error,actor.binding]);
 useEffect(() => {alive.current = true; if(actor.binding) void load(); return () => {alive.current = false;};},[actor.binding,load]);
 function move(next:number) {setStep(next); setConfirmed(false); requestAnimationFrame(() => panel.current?.focus());}
 async function action(kind:'start'|'save'|'publish',next?:number) {
  if(lock.current) return false; lock.current = true; setBusy(true); setError(''); setNotice('');
  try {
   if(kind === 'start') operation.current ??= crypto.randomUUID();
   const result = decodeDraft(await request(kind === 'start' ? {action:kind,operation_key:operation.current} : {action:kind,reference:draft!.reference,revision:draft!.revision,...(kind === 'save' ? {values:{...draft!.values,draft_step:next ?? step}} : {confirmed})}));
   if(alive.current) {accept(result);setNotice(kind === 'publish' ? t.published : t.saved); if(next != null) move(next);return true;}
   return false;
  } catch {if(alive.current) setError(t.error);return false;} finally {lock.current = false;if(alive.current)setBusy(false);}
 }
 async function saveForExit(){if(pendingPhoto || !(await action('save')))throw Error();}
 async function saveExit(){try{await saveForExit();router.push(`${path}/shida/appartements/mes-logements/`);}catch{setError(pendingPhoto?t.photoError:t.error);}}
 async function upload(file:File,op=crypto.randomUUID()) {
  if(lock.current || !draft || !actor.binding) return;
  const invalid=fileValidation(file,locale,5,['image/jpeg','image/png','image/webp'],'JPG, PNG, WebP');if(invalid){setError(invalid);return;}
  lock.current = true;setBusy(true);setError('');setNotice('');setPendingPhoto({file,operation:op});
  try {
   const saved = decodeDraft(await request({action:'save',reference:draft.reference,revision:draft.revision,values:{...draft.values,draft_step:step}}));
   if(!alive.current) return;
   accept(saved);
   const response = await fetch(`/api/shida/personal/apartments/${saved.reference}/photos/?revision=${saved.revision}&operation_key=${encodeURIComponent(op)}`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(50000),headers:{'x-shida-session':actor.binding,'Content-Type':file.type},body:file});
   if(!response.ok) throw Error();const result = decodeDraft(await response.json());
   if(alive.current) {accept(result);setPendingPhoto(null);setNotice(t.photoSaved);}
  } catch {if(alive.current)setError(t.photoError);} finally {lock.current = false;if(alive.current)setBusy(false);}
 }
 function set(key:keyof Values,value:Values[keyof Values]) {if(draft) {setDraft({...draft,values:{...draft.values,[key]:value,...(key==='city'?{commune:'',quartier:''}:key==='commune'?{quartier:''}:{})}});setConfirmed(false);}}
 async function remove(reference:string) {
  if(lock.current || !draft || !actor.binding)return;
  lock.current = true;setBusy(true);setError('');
  try {
   const saved = decodeDraft(await request({action:'save',reference:draft.reference,revision:draft.revision,values:{...draft.values,draft_step:step}}));
   if(!alive.current)return;accept(saved);
   const response = await fetch(`/api/shida/personal/apartments/${saved.reference}/photos/${reference}/remove/?revision=${saved.revision}`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','x-shida-session':actor.binding},body:'{}'});
   if(!response.ok)throw Error();const result=decodeDraft(await response.json());if(alive.current)accept(result);
  } catch {if(alive.current)setError(t.error);} finally {lock.current=false;if(alive.current)setBusy(false);}
 }
 const v = draft?.values;
 const residential = !['land','office','commercial'].includes(v?.property_type ?? '');
 const input = (key:keyof Values,label:string,required=false,numeric=false) => <label><span>{label}{required&&<b className="apt-required" aria-hidden="true"> *</b>}</span><input aria-label={label} required={required} type={numeric ? 'number' : 'text'} min={numeric ? (key === 'price'||key==='size_sqm' ? 1 : 0) : undefined} max={numeric ? (key === 'price' ? 10000000 : 10000) : undefined} step={numeric ? 1 : undefined} maxLength={numeric ? undefined : 100} placeholder={key==='listing_title'?c.titlePlaceholder:undefined} value={String(v?.[key] ?? '')} onChange={event => set(key,numeric ? event.target.value === '' ? null : Number(event.target.value) : event.target.value)} readOnly={key === 'public_name'}/> </label>;
 const count=(key:'number_of_rooms'|'bedroom_count',label:string)=><div className="apt-count"><label htmlFor={`apt-${key}`}>{label}<b className="apt-required" aria-hidden="true"> *</b></label><div><button type="button" aria-label={`${c.decrease}: ${label}`} disabled={v?.[key]==null||v[key]!<=0} onClick={()=>set(key,Math.max(0,(v?.[key]??0)-1))}>−</button><input id={`apt-${key}`} aria-label={label} type="number" required min={0} max={10000} step={1} value={v?.[key]??''} onChange={e=>set(key,e.target.value===''?null:Number(e.target.value))}/><button type="button" aria-label={`${c.increase}: ${label}`} disabled={(v?.[key]??0)>=10000} onClick={()=>set(key,(v?.[key]??0)+1)}>+</button></div></div>;
 return <div className="container apt-create" lang={locale}><WenzeLeaveDialog locale={locale} onSave={saveForExit} title={c.leave}/><Link href={`${path}/shida/appartements/`} onClick={async event=>{event.preventDefault();if(!busy && await leaveWork())router.push(`${path}/shida/appartements/`);}}>← {m.apartments}</Link><h1>{t.title}</h1><p>{t.intro}</p>
  {actor.checking ? <p role="status">{t.loading}</p> : !actor.binding ? <button className="button button-primary" onClick={actor.login}>{t.login}</button> : <>
   {!draft ? <section><button className="button button-primary" disabled={busy || !progress} onClick={() => void action('start',0)}>{t.start}</button>{!progress && !error && <p role="status">{t.loading}</p>}
    {progress?.items.map(item => <article key={item.reference}><strong>{item.values.listing_title || item.values.city || t.private} · {item.values.commune}</strong><span>{item.status === 'DRAFT' ? t.private : item.status === 'AVAILABLE' ? t.published : m.actionUnavailable}</span>{['DRAFT','AVAILABLE'].includes(item.status) && <button type="button" onClick={() => {accept(item);move(resumeStep(item));}}>{item.status === 'DRAFT' ? t.resume : t.view}</button>}</article>)}
   </section> : draft.status === 'AVAILABLE' ? <section><h2>{t.published}</h2><Link className="button button-primary" href={`${path}/shida/appartements/${draft.reference}/`}>{t.view}</Link></section> : <section ref={panel} tabIndex={-1} aria-label={t.steps[step]}>
    <ol className="apt-create-steps">{t.steps.map((label,index) => <li key={label} aria-current={step === index ? 'step' : undefined}><span className="apt-step-number">{index<step?<CheckIcon/>:index+1}</span><span><strong>{label}</strong><small>{c.steps[index]}</small></span></li>)}</ol>
    <div className="apt-create-layout"><div>
    <form onSubmit={event => {event.preventDefault();if(step===0&&residential&&v?.bedroom_count!=null&&v.number_of_rooms!=null&&v.bedroom_count>v.number_of_rooms){setError(c.roomsError);return;}void action(step === 2 ? 'publish' : 'save', step === 2 ? undefined : step+1);}}><fieldset disabled={busy}><p className="apt-required-help">{c.required}</p>
     {step === 0 && <><div className="apt-form-card"><h2><SpaceIcon name="people"/>{c.general}</h2><div className="apt-create-fields">
      <div>{input('listing_title',c.title,true)}<small>{c.titleHint}</small></div><div>{input('public_name',t.name)}<small>{c.identity}</small></div>
      <label><span>{t.role}<b className="apt-required" aria-hidden="true"> *</b></span><select aria-label={t.role} required value={v?.advertiser_role ?? ''} onChange={event => set('advertiser_role',event.target.value)}><option value="">{t.unknown}</option>{Object.entries(c.roles).map(([key,label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <label><span>{m.propertyType}<b className="apt-required" aria-hidden="true"> *</b></span><select aria-label={m.propertyType} required value={v?.property_type ?? ''} onChange={event => set('property_type',event.target.value)}><option value="">{t.unknown}</option>{apartmentPropertyTypes.map(key => <option value={key} key={key}>{m.propertyTypes[key]}</option>)}</select></label></div></div>
      <div className="apt-form-card"><h2><SpaceIcon name="home"/>{c.location}</h2><p>{c.locationHint}</p>{input('city',t.city,true)}<div className="apt-create-fields">
      {v?.city?.trim().toLowerCase() === 'kinshasa' ? <ApartmentCommune label={t.commune} value={v.commune ?? ''} options={progress?.kinshasa_communes ?? []} onChange={value=>set('commune',value)}/> : input('commune',t.commune,true)}
      {input('quartier',t.quartier)}</div><small>{c.neighbourhoodHint}</small></div>
      <div className="apt-form-card"><h2><HomeIcon/>{c.features}</h2><div className="apt-create-fields apt-count-fields">{residential&&<>{count('number_of_rooms',t.rooms)}{count('bedroom_count',t.bedrooms)}</>}{input('size_sqm',t.size,false,true)}</div>
      {residential&&v?.bedroom_count!=null&&v.number_of_rooms!=null&&v.bedroom_count>v.number_of_rooms&&<p role="alert">{c.roomsError}</p>}
      <label><span>{t.description}<b className="apt-required" aria-hidden="true"> *</b></span><textarea aria-label={t.description} placeholder={c.descriptionPlaceholder} required maxLength={2000} rows={4} value={v?.description ?? ''} onChange={event => set('description',event.target.value)}/></label><small className="apt-counter">{v?.description?.length??0} / 2 000</small></div>
      <div className="apt-form-card"><h2><SpaceIcon name="management"/>{c.equipment}</h2><p>{c.equipmentHint}</p><div className="apt-create-fields">{Object.entries(t.equipment).filter(([key])=>v?.property_type!=='land'||['water','electricity','parking'].includes(key)).map(([key,label]) => <div key={key} className="apt-amenity" role="group" aria-label={label}><strong>{label}</strong><div>{([true,false,undefined] as const).map((value,index)=><button type="button" key={index} aria-pressed={v?.amenities?.[key]===value} onClick={()=>{const amenities={...v?.amenities};if(value===undefined)delete amenities[key];else amenities[key]=value;set('amenities',amenities);}}>{value===true?c.yes:value===false?c.no:c.unknown}</button>)}</div></div>)}</div></div>
     </>}
     {step === 1 && <div className="apt-form-card"><h2>{t.steps[1]}</h2>{input('price',t.rent,true,true)}<p>{t.terms}</p><h3>{t.photos} · {draft.photos.length}/10</h3><p>{t.photoHelp}</p>
      <label className="apt-photo-upload"><SpaceIcon name="orders"/><span>{t.choose}</span><input aria-label={t.choose} type="file" accept="image/jpeg,image/png,image/webp" disabled={draft.photos.length >= 10 || Boolean(pendingPhoto)} onChange={event => {const file = event.target.files?.[0];if(file)void upload(file);event.target.value = '';}}/></label>
      {pendingPhoto && <p className="apt-upload-name" role="status">{pendingPhoto.file.name}</p>}
      {pendingPhoto && <button type="button" onClick={() => void upload(pendingPhoto.file,pendingPhoto.operation)}>{t.retryPhoto}</button>}
      <PhotoList draft={draft} binding={actor.binding} locale={locale} onRemove={reference => void remove(reference)}/>
     </div>}
     {step === 2 && <div className="apt-form-card"><h2>{t.steps[2]}</h2><dl className="apt-create-review">{Object.entries({[c.title]:v?.listing_title,[t.name]:v?.public_name,[t.role]:v?.advertiser_role ? safety.roles[v.advertiser_role as keyof typeof safety.roles] : null,[m.propertyType]:v?.property_type ? m.propertyTypes[v.property_type as keyof typeof m.propertyTypes] : null,[t.city]:v?.city,[t.commune]:v?.commune,[t.quartier]:v?.quartier,...(residential?{[t.rooms]:v?.number_of_rooms,[t.bedrooms]:v?.bedroom_count}:{}),[t.size]:v?.size_sqm,[t.rent]:v?.price==null?null:`${v.price} USD`,[t.description]:v?.description}).map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value ?? t.unknown}</dd></div>)}</dl>
      <ul>{Object.entries(t.equipment).map(([key,label]) => <li key={key}>{label}: {v?.amenities?.[key] === undefined ? t.unknown : v.amenities[key] ? t.yes : t.no}</li>)}</ul><p>{t.terms}</p><PhotoList draft={draft} binding={actor.binding} locale={locale}/><p>{safety.notice}</p><p>{safety.property}</p><label className="apt-create-confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} required/>{t.authority}</label>
     </div>}
     <div className="apt-create-actions">{step > 0 && <button type="button" className="button button-secondary" onClick={() => move(step-1)}>{t.back}</button>}<button type="button" className="button button-secondary" onClick={() => void saveExit()}>{c.saveExit}</button><button className="button button-primary" disabled={step === 1 && (draft.photos.length < 5 || Boolean(pendingPhoto)) || step === 2 && !confirmed}>{busy ? t.working : step === 2 ? t.publish : c.continue}</button></div>
    </fieldset></form>
    </div><aside className="apt-create-help"><div className="apt-form-card"><Image src="/images/apartment-creation-building.svg" width={400} height={230} alt=""/><h2>{c.benefitTitle}</h2><ul>{c.benefits.map(text=><li key={text}><CheckIcon/>{text}</li>)}</ul></div><div className="apt-form-card"><h2><LightbulbIcon/>{c.tipsTitle}</h2><ul>{c.tips.map(text=><li key={text}>{text}</li>)}</ul></div><div className="apt-form-card"><h2><HomeIcon/>{c.types}</h2><ul>{apartmentPropertyTypes.map(key=><li key={key}><SpaceIcon name={key==='office'?'business':key==='commercial'?'shop':'home'}/>{m.propertyTypes[key]}</li>)}</ul></div></aside></div>
   </section>}
   {error && <div role="alert"><p>{error}</p>{!draft && <button type="button" disabled={busy} onClick={() => void load()}>{t.refresh}</button>}</div>}{notice && <p role="status">{notice}</p>}
  </>}
 </div>;
}
function PhotoList({draft,binding,locale,onRemove}:{draft:Draft;binding:string;locale:Locale;onRemove?:(reference:string)=>void}) {
 const pending={en:'Unfinished upload. Retry the same file or cancel this upload.',fr:'Envoi inachevé. Réessayez le même fichier ou annulez cet envoi.',ln:'Foto etindami naino te. Meka fichier wana lisusu to longola botindi.',sw:'Upakiaji haujakamilika. Jaribu faili ileile au ghairi upakiaji.'}[locale];
 return <div className="apt-create-photos">{draft.photos.map((photo,index) => <div key={photo.reference ?? index}><PrivatePhoto listing={draft.reference} reference={photo.reference} binding={binding} label={`${apartmentCreationCopy[locale].photos} ${index+1}`}/>{onRemove && photo.reference && <button type="button" onClick={() => onRemove(photo.reference!)}>{apartmentCreationCopy[locale].remove}</button>}</div>)}{onRemove&&draft.pending_uploads?.filter(reference=>/^APF_[a-f0-9]{32}$/.test(reference)).map(reference=><div key={reference}><p>{pending}</p><button type="button" onClick={()=>onRemove(reference)}>{apartmentCreationCopy[locale].remove}</button></div>)}</div>;
}
