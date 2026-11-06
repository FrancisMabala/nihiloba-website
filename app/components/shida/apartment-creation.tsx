'use client';
import Link from 'next/link';
import {useCallback, useEffect, useRef, useState} from 'react';
import {WenzeBuyerProvider, useWenzeBuyer} from './wenze-buyer';
import {apartmentCreationCopy} from '../../lib/apartment-creation-copy';
import {apartmentSafetyCopy} from '../../lib/apartment-safety-copy';
import {marketplaceCopy} from './marketplace-copy';
import {apartmentPropertyTypes} from '../../types/shida-public';
import './apartment-creation.css';
type Locale = keyof typeof apartmentCreationCopy;
type Values = {public_name:string|null; property_type:string|null; city:string|null; commune:string|null; quartier:string|null; number_of_rooms:number|null; bedroom_count:number|null; size_sqm:number|null; description:string|null; price:number|null; currency:string; advertiser_role:string|null; amenities:Record<string,boolean>|null};
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
 const t = apartmentCreationCopy[locale], m = marketplaceCopy[locale], safety = apartmentSafetyCopy[locale];
 const [progress,setProgress] = useState<Progress|null>(null), [draft,setDraft] = useState<Draft|null>(null), [step,setStep] = useState(0);
 const [busy,setBusy] = useState(false), [error,setError] = useState(''), [notice,setNotice] = useState(''), [confirmed,setConfirmed] = useState(false);
 const [pendingPhoto,setPendingPhoto] = useState<{file:File;operation:string}|null>(null);
 const alive = useRef(true), lock = useRef(false), operation = useRef<string|null>(null), panel = useRef<HTMLElement>(null);
 const path = locale === 'en' ? '' : '/'+locale;
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
    if(alive.current) {setDraft(selected);setStep(0);setConfirmed(false);}
   }
   if(alive.current) {setProgress(value); setError('');}
  } catch {if(alive.current) setError(t.error);}
 },[request,t.error,actor.binding]);
 useEffect(() => {alive.current = true; if(actor.binding) void load(); return () => {alive.current = false;};},[actor.binding,load]);
 function move(next:number) {setStep(next); setConfirmed(false); requestAnimationFrame(() => panel.current?.focus());}
 async function action(kind:'start'|'save'|'publish',next?:number) {
  if(lock.current) return; lock.current = true; setBusy(true); setError(''); setNotice('');
  try {
   if(kind === 'start') operation.current ??= crypto.randomUUID();
   const result = decodeDraft(await request(kind === 'start' ? {action:kind,operation_key:operation.current} : {action:kind,reference:draft!.reference,revision:draft!.revision,...(kind === 'save' ? {values:draft!.values} : {confirmed})}));
   if(alive.current) {setDraft(result);setNotice(kind === 'publish' ? t.published : t.saved); if(next != null) move(next);}
  } catch {if(alive.current) setError(t.error);} finally {lock.current = false;if(alive.current)setBusy(false);}
 }
 async function upload(file:File,op=crypto.randomUUID()) {
  if(lock.current || !draft || !actor.binding) return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5*1024*1024) {setError(t.photoHelp);return;}
  lock.current = true;setBusy(true);setError('');setNotice('');setPendingPhoto({file,operation:op});
  try {
   const saved = decodeDraft(await request({action:'save',reference:draft.reference,revision:draft.revision,values:draft.values}));
   if(!alive.current) return;
   setDraft(saved);
   const response = await fetch(`/api/shida/personal/apartments/${saved.reference}/photos/?revision=${saved.revision}&operation_key=${encodeURIComponent(op)}`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(50000),headers:{'x-shida-session':actor.binding,'Content-Type':file.type},body:file});
   if(!response.ok) throw Error();const result = decodeDraft(await response.json());
   if(alive.current) {setDraft(result);setPendingPhoto(null);setNotice(t.photoSaved);}
  } catch {if(alive.current)setError(t.photoError);} finally {lock.current = false;if(alive.current)setBusy(false);}
 }
 function set(key:keyof Values,value:Values[keyof Values]) {if(draft) {setDraft({...draft,values:{...draft.values,[key]:value}});setConfirmed(false);}}
 async function remove(reference:string) {
  if(lock.current || !draft || !actor.binding)return;
  lock.current = true;setBusy(true);setError('');
  try {
   const saved = decodeDraft(await request({action:'save',reference:draft.reference,revision:draft.revision,values:draft.values}));
   if(!alive.current)return;setDraft(saved);
   const response = await fetch(`/api/shida/personal/apartments/${saved.reference}/photos/${reference}/remove/?revision=${saved.revision}`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','x-shida-session':actor.binding},body:'{}'});
   if(!response.ok)throw Error();const result=decodeDraft(await response.json());if(alive.current)setDraft(result);
  } catch {if(alive.current)setError(t.error);} finally {lock.current=false;if(alive.current)setBusy(false);}
 }
 const v = draft?.values;
 const input = (key:keyof Values,label:string,required=false,numeric=false) => <label>{label}<input required={required} type={numeric ? 'number' : 'text'} min={numeric ? (key === 'price' ? 1 : 0) : undefined} max={numeric ? (key === 'price' ? 10000000 : 10000) : undefined} step={numeric ? 1 : undefined} maxLength={numeric ? undefined : 100} value={String(v?.[key] ?? '')} onChange={event => set(key,numeric ? event.target.value === '' ? null : Number(event.target.value) : event.target.value)} readOnly={key === 'public_name' && progress?.identity.existing_profile}/> </label>;
 return <div className="container apt-create"><Link href={`${path}/shida/appartements/`}>← {m.apartments}</Link><h1>{t.title}</h1><p>{t.intro}</p>
  {actor.checking ? <p role="status">{t.loading}</p> : !actor.binding ? <button className="button button-primary" onClick={actor.login}>{t.login}</button> : <>
   {!draft ? <section><button className="button button-primary" disabled={busy || !progress} onClick={() => void action('start',0)}>{t.start}</button>{!progress && !error && <p role="status">{t.loading}</p>}
    {progress?.items.map(item => <article key={item.reference}><strong>{item.values.city || t.private} · {item.values.commune}</strong><span>{item.status === 'DRAFT' ? t.private : item.status === 'AVAILABLE' ? t.published : m.actionUnavailable}</span>{['DRAFT','AVAILABLE'].includes(item.status) && <button type="button" onClick={() => {setDraft(item);move(0);}}>{item.status === 'DRAFT' ? t.resume : t.view}</button>}</article>)}
   </section> : draft.status === 'AVAILABLE' ? <section><h2>{t.published}</h2><Link className="button button-primary" href={`${path}/shida/appartements/${draft.reference}/`}>{t.view}</Link></section> : <section ref={panel} tabIndex={-1} aria-label={t.steps[step]}>
    <ol className="apt-create-steps">{t.steps.map((label,index) => <li key={label} aria-current={step === index ? 'step' : undefined}>{index+1}. {label}</li>)}</ol><p className="apt-create-boundary">{t.boundary}</p>
    <form onSubmit={event => {event.preventDefault();void action(step === 2 ? 'publish' : 'save', step === 2 ? undefined : step+1);}}><fieldset disabled={busy}>
     {step === 0 && <><h2>{t.steps[0]}</h2><div className="apt-create-fields">
      {input('public_name',t.name,true)}<label>{t.role}<select required value={v?.advertiser_role ?? ''} onChange={event => set('advertiser_role',event.target.value)}><option value="">{t.unknown}</option>{Object.entries(safety.roles).map(([key,label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <label>{m.propertyType}<select required value={v?.property_type ?? ''} onChange={event => set('property_type',event.target.value)}><option value="">{t.unknown}</option>{apartmentPropertyTypes.map(key => <option value={key} key={key}>{m.propertyTypes[key]}</option>)}</select></label>
      {input('city',t.city,true)}{v?.city?.trim().toLowerCase() === 'kinshasa' ? <label>{t.commune}<select required value={v.commune ?? ''} onChange={event => set('commune',event.target.value)}><option value="">{t.unknown}</option>{progress?.kinshasa_communes.map(name => <option key={name}>{name}</option>)}</select></label> : input('commune',t.commune,true)}
      {input('quartier',t.quartier)}{input('number_of_rooms',t.rooms,true,true)}{input('bedroom_count',t.bedrooms,true,true)}{input('size_sqm',t.size,false,true)}</div>
      {progress?.identity.existing_profile && <p>{t.existingName}</p>}
      <label>{t.description}<textarea required maxLength={2000} rows={4} value={v?.description ?? ''} onChange={event => set('description',event.target.value)}/></label>
      <h3>{t.amenities}</h3><div className="apt-create-fields">{Object.entries(t.equipment).map(([key,label]) => <label key={key}>{label}<select value={v?.amenities?.[key] === undefined ? '' : String(v.amenities[key])} onChange={event => {const amenities = {...v?.amenities};if(event.target.value === '')delete amenities[key];else amenities[key] = event.target.value === 'true';set('amenities',amenities);}}><option value="">{t.unknown}</option><option value="true">{t.yes}</option><option value="false">{t.no}</option></select></label>)}</div>
     </>}
     {step === 1 && <><h2>{t.steps[1]}</h2>{input('price',t.rent,true,true)}<p>{t.terms}</p><h3>{t.photos} · {draft.photos.length}/10</h3><p>{t.photoHelp}</p>
      <label>{t.choose}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={draft.photos.length >= 10 || Boolean(pendingPhoto)} onChange={event => {const file = event.target.files?.[0];if(file)void upload(file);event.target.value = '';}}/></label>
      {pendingPhoto && <button type="button" onClick={() => void upload(pendingPhoto.file,pendingPhoto.operation)}>{t.retryPhoto}</button>}
      <PhotoList draft={draft} binding={actor.binding} locale={locale} onRemove={reference => void remove(reference)}/>
     </>}
     {step === 2 && <><h2>{t.steps[2]}</h2><dl className="apt-create-review">{Object.entries({[t.name]:v?.public_name,[t.role]:v?.advertiser_role ? safety.roles[v.advertiser_role as keyof typeof safety.roles] : null,[m.propertyType]:v?.property_type ? m.propertyTypes[v.property_type as keyof typeof m.propertyTypes] : null,[t.city]:v?.city,[t.commune]:v?.commune,[t.quartier]:v?.quartier,[t.rooms]:v?.number_of_rooms,[t.bedrooms]:v?.bedroom_count,[t.size]:v?.size_sqm,[t.rent]:v?.price,[t.description]:v?.description}).map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value ?? t.unknown}</dd></div>)}</dl>
      <ul>{Object.entries(t.equipment).map(([key,label]) => <li key={key}>{label}: {v?.amenities?.[key] === undefined ? t.unknown : v.amenities[key] ? t.yes : t.no}</li>)}</ul><p>{t.terms}</p><PhotoList draft={draft} binding={actor.binding} locale={locale}/><p>{safety.notice}</p><p>{safety.property}</p><label className="apt-create-confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} required/>{t.authority}</label>
     </>}
     <div className="apt-create-actions">{step > 0 && <button type="button" className="button button-secondary" onClick={() => move(step-1)}>{t.back}</button>}<button type="button" className="button button-secondary" onClick={() => void action('save')}>{t.save}</button><button className="button button-primary" disabled={step === 1 && (draft.photos.length < 5 || Boolean(pendingPhoto)) || step === 2 && !confirmed}>{busy ? t.working : step === 2 ? t.publish : t.next}</button></div>
    </fieldset></form>
   </section>}
   {error && <div role="alert"><p>{error}</p><button type="button" disabled={busy} onClick={() => {setDraft(null);setPendingPhoto(null);void load();}}>{t.refresh}</button></div>}{notice && <p role="status">{notice}</p>}
  </>}
 </div>;
}
function PhotoList({draft,binding,locale,onRemove}:{draft:Draft;binding:string;locale:Locale;onRemove?:(reference:string)=>void}) {
 const pending={en:'Unfinished upload. Retry the same file or cancel this upload.',fr:'Envoi inachevé. Réessayez le même fichier ou annulez cet envoi.',ln:'Foto etindami naino te. Meka fichier wana lisusu to longola botindi.',sw:'Upakiaji haujakamilika. Jaribu faili ileile au ghairi upakiaji.'}[locale];
 return <div className="apt-create-photos">{draft.photos.map((photo,index) => <div key={photo.reference ?? index}><PrivatePhoto listing={draft.reference} reference={photo.reference} binding={binding} label={`${apartmentCreationCopy[locale].photos} ${index+1}`}/>{onRemove && photo.reference && <button type="button" onClick={() => onRemove(photo.reference!)}>{apartmentCreationCopy[locale].remove}</button>}</div>)}{onRemove&&draft.pending_uploads?.filter(reference=>/^APF_[a-f0-9]{32}$/.test(reference)).map(reference=><div key={reference}><p>{pending}</p><button type="button" onClick={()=>onRemove(reference)}>{apartmentCreationCopy[locale].remove}</button></div>)}</div>;
}
function PrivatePhoto({listing,reference,binding,label}:{listing:string;reference:string|null;binding:string;label:string}) {
 const [url,setUrl] = useState<string|null>(null);
 useEffect(() => {let alive = true,object:string|null = null;const controller = new AbortController();
  if(reference && /^APF_[a-f0-9]{32}$/.test(reference)) void fetch(`/api/shida/personal/apartments/${listing}/photos/${reference}/`,{cache:'no-store',headers:{'x-shida-session':binding},signal:controller.signal}).then(async response => {if(!response.ok)throw Error();const blob = await response.blob();if(alive){object = URL.createObjectURL(blob);setUrl(object);}}).catch(() => {});
  return () => {alive = false;controller.abort();if(object)URL.revokeObjectURL(object);};
 },[listing,reference,binding]);
 // Authenticated preview is a short-lived local blob, never a public provider URL.
 // eslint-disable-next-line @next/next/no-img-element
 return url ? <img src={url} alt={label} width={160} height={120}/> : <span>{label}</span>;
}
