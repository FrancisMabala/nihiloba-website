'use client';
import {useEffect, useState} from 'react';
import type {RestaurantLocale} from '../../services/shida/restaurants-client';
import type {Establishment, Envelope, Hours} from '../../lib/restaurant-seller';
import {request, DashboardApiError} from '../../lib/restaurant-seller-browser';
import {useWorkDraft, useWorkRequest} from '../../lib/restaurant-work';
import {settingsCopy} from '../../lib/restaurant-settings-copy';
import {restaurantText} from '../../lib/restaurant-seller-copy';
import {workText} from '../../lib/restaurant-work-copy';
import {managementCopy} from '../../lib/restaurant-management-copy';
import {reservationCopy} from '../../lib/restaurant-reservation-copy';
import {RestaurantIntake} from './restaurant-intake';
import {RestaurantGuestAutoAccept} from './restaurant-guest-auto-accept';
import './restaurant-settings.css';

type ReservationSetting = {enabled:boolean; available:boolean; revision:number};
type Method = {method_ref:string; label:string; enabled:boolean; currencies:string[]};
export function RestaurantSettings({path,binding,locale,establishment,capabilities,onOpen,onFailure}:{path:string;binding:string;locale:RestaurantLocale;establishment:Establishment;capabilities:string[];onOpen:(tab:string)=>void;onFailure:(error:unknown)=>void}) {
 const c=settingsCopy[locale], t=(key:string)=>restaurantText(locale,key), m=managementCopy[locale];
 const [hours,setHours]=useState<Hours|null>(null),[methods,setMethods]=useState<Method[]|null>(null),[fresh,setFresh]=useState(false);
 const paid=capabilities.includes('restaurant.pos'), seated=establishment.profile.service_modes?.split(',').some(mode=>mode.trim().toLowerCase()==='eat_there')??false;
 useEffect(()=>{
  let alive=true;
  const reads=[request(`${path}/hours?language=${locale}`,{},binding),...(paid?[request(`${path}/service/payment-methods`,{},binding)]:[])];
  void Promise.allSettled(reads).then(results=>{
   if(!alive)return;
   results.forEach((result,index)=>{if(result.status==='fulfilled'){if(index===0)setHours((result.value as Envelope<Hours>).result);else setMethods((result.value as {items:Method[]}).items);}else if(result.reason instanceof DashboardApiError&&[401,403,404].includes(result.reason.status))onFailure(result.reason);});
   setFresh(results.every(result=>result.status==='fulfilled'));
  });
  const stale=()=>setFresh(false);window.addEventListener('offline',stale);window.addEventListener('focus',stale);
  return()=>{alive=false;window.removeEventListener('offline',stale);window.removeEventListener('focus',stale);};
 },[path,binding,locale,paid,onFailure]);
 const link=(tab:string,label:string)=> <button type="button" onClick={()=>onOpen(tab)}>{label}</button>;
 const state=(value:boolean)=>value?c.on:c.off;
 return <div className="rst-settings" lang={locale}>
  <header><h2>{c.title}</h2><p>{c.intro}</p>{!fresh&&<p role="status">{c.reload}</p>}{link('settings',c.refresh)}</header>
  <nav className="rst-settings-jump" aria-label={c.title}>{(['profile','hours','intake','reservations','payments'] as const).map((key)=><a key={key} href={`#settings-${key==='profile'?'establishment':key}`}>{c[key]}</a>)}</nav>
  <aside className="rst-settings-notice">{c.preserved}</aside>
  <section className="rst-card" id="settings-establishment"><h3>{c.profile}</h3><p>{c.profileHelp}</p><dl className="rst-details">{['name','food_business_type','city','commune','public_address','timezone_name'].map(key=><div key={key}><dt>{t(key)}</dt><dd>{establishment.profile[key]?(key==='food_business_type'?t(establishment.profile[key]!):establishment.profile[key]):c.unknown}</dd></div>)}<div><dt>{c.published}</dt><dd>{state(establishment.status==='active')}</dd></div></dl>{establishment.missing_publication_fields.length>0&&<p>{c.setup}: {establishment.missing_publication_fields.map(t).join(', ')}</p>}{link('profile',`${c.edit} · ${c.profile}`)}</section>
  <section className="rst-card" id="settings-hours"><h3>{c.hours}</h3><p>{c.hoursHelp}</p><p>{c.saved}: {hours?t(hours.status):c.unknown} · {hours?.timezone_name??c.setup}</p>{hours?.schedule?hours.schedule.windows.map((w,i)=><p key={i}>{t(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'][w.weekday])}: {w.start}–{w.end}</p>):<p>{c.setup}: {c.hours}</p>}{hours&&<p>{t('closures')}: {hours.exceptional_closures.length}</p>}{establishment.actions.includes('hours')&&link('hours',`${c.edit} · ${c.hours}`)}</section>
  <section className="rst-card" id="settings-intake"><h3>{c.intake}</h3><p>{c.menuHelp}</p><div className="rst-actions">{establishment.actions.includes('menu')&&link('items',m.menu)}{link(paid?'pos':'counter',m.selling)}</div>{establishment.actions.includes('edit')&&<><RestaurantIntake path={path} binding={binding} locale={locale} timezone={establishment.profile.timezone_name} onOpen={onOpen} onFailure={onFailure}/><RestaurantGuestAutoAccept path={path} binding={binding} locale={locale} onFailure={onFailure}/></>}</section>
  <section className="rst-card" id="settings-reservations"><h3>{c.reservations}</h3><p>{c.reservationHelp}</p><dl className="rst-details"><div><dt>{c.seated}</dt><dd>{state(seated)} {!seated&&link('profile',c.edit)}</dd></div><div><dt>{c.published}</dt><dd>{state(establishment.status==='active')} {establishment.status!=='active'&&link('profile',c.edit)}</dd></div><div><dt>{c.capability}</dt><dd>{state(capabilities.includes('restaurant.reservations'))}</dd></div><div><dt>{c.hours}</dt><dd>{hours?.schedule&&hours.confirmed_at?c.saved:c.setup} {establishment.actions.includes('hours')&&link('hours',c.edit)}</dd></div><div><dt>{t('timezone_name')}</dt><dd>{establishment.profile.timezone_name??c.setup} {!establishment.profile.timezone_name&&link('profile',c.edit)}</dd></div></dl>{capabilities.includes('restaurant.reservations')&&<ReservationControl canEnable={seated&&establishment.status==='active'&&!!establishment.profile.timezone_name&&!!hours?.schedule&&!!hours.confirmed_at} path={path} binding={binding} locale={locale} onFailure={onFailure}/>} {link('reservations',m.reservations)}</section>
  <section className="rst-card" id="settings-payments"><h3>{c.payments}</h3><p>{c.paymentHelp}</p>{paid?<><p>{c.saved}</p>{methods?methods.length?methods.map(method=><div className="rst-settings-method" key={method.method_ref}><strong>{method.label}</strong><span>{state(method.enabled)}</span><span>{method.currencies.join(' · ')}</span></div>):<p>{c.noMethods}</p>:<p>{c.unknown}</p>}{link('paymentMethods',`${c.edit} · ${c.payments}`)}</>:<p>{c.paymentAccess}</p>}</section>
 </div>;
}

function ReservationControl({path,binding,locale,onFailure,canEnable}:{canEnable:boolean;path:string;binding:string;locale:RestaurantLocale;onFailure:(error:unknown)=>void}) {
 const c=settingsCopy[locale],r=reservationCopy[locale],api=useWorkRequest(binding,onFailure);
 const [saved,setSaved]=useState<ReservationSetting|null>(null),[desired,setDesired]=useState<boolean|null>(null),[fresh,setFresh]=useState(false);
 useWorkDraft(desired!==null||!!api.pending,workText(locale,'discard'));
 useEffect(()=>{let alive=true;void request(`${path}/reservations/setting`,{},binding).then(value=>{if(alive){setSaved(value as ReservationSetting);setFresh(true);}}).catch(error=>{if(alive)onFailure(error);});const stale=()=>setFresh(false);window.addEventListener('offline',stale);window.addEventListener('focus',stale);return()=>{alive=false;window.removeEventListener('offline',stale);window.removeEventListener('focus',stale);};},[path,binding]); // eslint-disable-line react-hooks/exhaustive-deps
 async function refresh(){const value=await api.run<ReservationSetting>(`${path}/reservations/setting`);if(value){setSaved(value);setFresh(true);if(api.conflict){api.reset();setDesired(null);}}}
 async function save(){if(!saved||desired===null)return;const value=await api.run<ReservationSetting>(`${path}/reservations/setting`,'PUT',{enabled:desired,expected_revision:saved.revision,operation_key:crypto.randomUUID()});if(value){setDesired(null);setFresh(false);await refresh();}}
 return <div className="rst-settings-reservation"><p>{c.saved}: {saved?(saved.enabled?c.on:c.off):c.unknown}</p><p>{c.available}: {saved?(saved.available?c.on:c.off):c.unknown}</p>{(!fresh||api.conflict)&&<p>{c.reload}</p>}{api.message&&<p role="status">{workText(locale,api.message)}</p>}<div className="rst-actions"><button type="button" disabled={api.busy||!api.online} onClick={()=>void refresh()}>{c.refresh}</button><button type="button" disabled={!saved||!fresh||api.busy||!!api.pending||api.conflict||!api.online||!saved.enabled&&!canEnable} onClick={()=>setDesired(!saved!.enabled)}>{saved?.enabled?r.disable:r.enable}</button></div>{desired!==null&&<aside className="rst-settings-review" aria-label={c.draft}><h4>{c.effect}</h4><p>{desired?c.enableEffect:c.disableEffect}</p><p>{c.reservationHelp}</p><div className="rst-actions"><button type="button" disabled={api.busy||!!api.pending} onClick={()=>setDesired(null)}>{c.cancel}</button><button type="button" disabled={!fresh||api.busy||api.conflict||!api.online} onClick={()=>void save()}>{api.pending?workText(locale,'retry'):c.confirm}</button></div></aside>}</div>;
}
