'use client';
import {restaurantClarityCopy} from '../../lib/restaurant-clarity-copy';
import { useState } from 'react';
import { useRestaurantReturn } from '@/app/lib/use-restaurant-return';
import { intakeSetupCopy } from '@/app/lib/restaurant-intake-setup-copy';
import { localInstant } from '@/app/lib/restaurant-seller';
import { dateText, useWorkRequest, useWorkDraft, type Configuration, type ServiceWindow, type Area } from '@/app/lib/restaurant-work';
import { workText } from '@/app/lib/restaurant-work-copy';
import { receivingCopy, receivingHeadline, type ReceivingReason } from '@/app/lib/restaurant-receiving';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';
import { LocalTime } from './restaurant-local-time';
import './restaurant-intake.css';
import { emptySchedule, validSchedule, scheduleCopy, type WeeklySchedule } from '@/app/lib/restaurant-schedule';
import { WeeklyEditor, WeeklySummary } from './restaurant-weekly-schedule';

type Kind='pickup'|'delivery';
export function RestaurantIntake({path,binding,locale,timezone,onFailure,onOpen}:{path:string;binding:string;locale:RestaurantLocale;timezone:string|null;onFailure:(e:unknown)=>void;onOpen?:(tab:string)=>void}) {
 const r=receivingCopy[locale],t=(k:string)=>workText(locale,k),api=useWorkRequest(binding,onFailure);
 const c=scheduleCopy[locale],u=intakeSetupCopy[locale];
 const [weekly,setWeekly]=useState<WeeklySchedule>(emptySchedule);
 const [now,setNow]=useState(0);
 const [config,setConfig]=useState<Configuration|null>(null),[kind,setKind]=useState<Kind>('pickup'),[editing,setEditing]=useState(false),[enabled,setEnabled]=useState(false),[windows,setWindows]=useState<ServiceWindow[]>([]),[areas,setAreas]=useState<Area[]>([]),[fee,setFee]=useState({amount:'',currency:'CDF'}),[review,setReview]=useState(false),[fresh,setFresh]=useState(false),[dirty,setDirty]=useState(false);
 useWorkDraft(dirty || review || !!api.pending,t('discard'));
 function fill(value:Configuration,k:Kind){setKind(k);setConfig(value);const saved=value.schedules?.[k];setWeekly(saved?{weekly_periods:saved.weekly_periods,minimum_lead_minutes:saved.minimum_lead_minutes,cutoff_minutes:saved.cutoff_minutes,allow_tomorrow:saved.allow_tomorrow}:emptySchedule());setEnabled(value[k]?.enabled ?? false);setWindows((value[k]?.windows ?? []).map(w=>({starts_at:localInstant(w.starts_at,timezone),ends_at:localInstant(w.ends_at,timezone)})));setAreas(value.delivery?.areas ?? []);setFee(value.delivery?.fee ?? {amount:'',currency:'CDF'});setFresh(true);setReview(false);setDirty(false);}
 async function refresh(recover=true){
  setFresh(false);
  const value=await api.run<Configuration>(`${path}/order-configuration`);
  if(value){
   if(!editing && !api.pending)fill(value,kind);else {
    setConfig(value);setFresh(true);
    if(config?.revision!==value.revision&&!api.pending)setReview(false);
   }
   if(recover&&api.conflict){api.reset();setReview(false);}
  }
 }
 useRestaurantReturn(`${binding}:${path}`,api.busy,()=>refresh(false),(at)=>{setNow(at);setFresh(false);},60000);
 async function save(){
  if(!config)return;
  // Empty pickup windows invoke the Backend's existing pause-with-preservation path.
  const result=await api.run(`${path}/${kind}-intake`,'PUT',{operation_key:crypto.randomUUID(),expected_updated_at:config.revision,enabled,windows:scheduleWrite||keepPickupPeriods?[]:windows,...(scheduleWrite?{schedule:weekly}:{}),...(kind==='delivery'?{fee,areas}:{})});
  if(result){setFresh(false);setDirty(false);setReview(false);const value=await api.run<Configuration>(`${path}/order-configuration`);if(value){fill(value,kind);setEditing(false);}}
 }
 const modern=config?.schedules!==undefined;
 const scheduleWrite=modern&&validSchedule(weekly);
 const legacyPause=modern&&!config?.schedules?.[kind]&&!enabled;
 const status=config?.receiving,verified=fresh&&api.online&&!api.conflict;
 const headline=receivingHeadline(config?.intake_released,status,verified);
 const reasons=(values:ReceivingReason[],weeklyMode=false)=>values.filter((v,i)=>values.indexOf(v)===i).map(v=><li key={v}><span>{v==='paused'?r.pausedReason:weeklyMode&&['windows','expired'].includes(v)?u.scheduleUnavailable:r[v]}</span>{onOpen&&['profile','address','timezone','menu','hours','closure'].includes(v)&&<button type="button" onClick={()=>onOpen(v==='menu'?'items':['hours','closure'].includes(v)?'hours':'profile')}>{v==='menu'?r.goMenu:['hours','closure'].includes(v)?r.goHours:r.goProfile}</button>}</li>);
 const blocked=status?.[kind].activation_blockers??(!config?.intake_released?['release'] as ReceivingReason[]:[]);
 const nowLocal=localInstant(new Date(now).toISOString(),timezone);
 const tomorrow=new Date(`${nowLocal.slice(0,10)||'1970-01-01'}T12:00:00Z`);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
 const invalidWindows=!nowLocal||!windows.length||windows.some(w=>!w.starts_at||!w.ends_at||Date.parse(w.starts_at)<=now||w.starts_at.slice(0,10)!==nowLocal.slice(0,10)||Date.parse(w.ends_at)<=Date.parse(w.starts_at)||w.ends_at.slice(0,10)>tomorrow.toISOString().slice(0,10));
 const invalidDelivery=kind==='delivery'&&(!areas.length||!fee.amount||!modern&&!windows.length||areas.some(a=>!a.country.trim()||!a.city.trim()||!a.commune.trim()||a.scope==='quartier'&&!a.quartier?.trim()));
 const pickupWindowEdits=kind==='pickup'&&JSON.stringify(windows)!==JSON.stringify((config?.pickup?.windows??[]).map(w=>({starts_at:localInstant(w.starts_at,timezone),ends_at:localInstant(w.ends_at,timezone)})));
 const keepPickupPeriods=kind==='pickup'&&!enabled&&(!pickupWindowEdits||!windows.length);
 const invalid=modern?invalidDelivery||!legacyPause&&(!timezone||!validSchedule(weekly)):invalidDelivery||enabled&&(blocked.length>0||!timezone||invalidWindows)||kind==='pickup'&&!keepPickupPeriods&&invalidWindows;
 const availability=(value?:boolean)=>!verified?r.unknown:config&&!config.intake_released?r.blocked:value===undefined?r.unknown:value?r.ready:r.blocked;
 function edit(k:Kind){if(config&&(!dirty||window.confirm(t('discard')))){fill(config,k);setEditing(true);}}
 function periods(values:ServiceWindow[]){return values.length?<ul className="rst-intake-periods">{values.map((w,i)=>{
  const start=localInstant(w.starts_at,timezone),end=localInstant(w.ends_at,timezone);
  return <li key={i}><time>{dateText(w.starts_at,locale,timezone)}</time> → <time>{dateText(w.ends_at,locale,timezone)}</time>{start.slice(0,10)!==end.slice(0,10)&&<small>{r.overnight}</small>}{Date.parse(w.ends_at)<=now?<strong>{r.expiredLabel}</strong>:Date.parse(w.starts_at)<=now?<small>{r.started}</small>:null}</li>;
 })}</ul>:<p>{r.noPeriods}</p>;}
 return <section className="rst-card rst-work rst-intake" lang={locale}>
  <header><h2>{r.title}</h2><p>{restaurantClarityCopy[locale].intake}</p><div className="rst-intake-status" data-state={headline} role="status"><h3>{r[headline]}</h3><p>{!config?.intake_released&&config?r.release:headline==='available'?r.availableHelp:headline==='unknown'?r.noStatus:r.menu}</p>{config&&!config.intake_released&&<p>{r.nextRelease}</p>}</div><button type="button" disabled={api.busy||!api.online} onClick={()=>void refresh()}>{r.refresh}</button>{status&&<small>{r.checked} {dateText(status.evaluated_at,locale,timezone)} · {timezone}</small>}</header>
  {!api.online?<p role="alert">{r.offline}</p>:!fresh&&<p>{r.stale}</p>}
  <p className="rst-intake-preserved">{r.existing}</p>
  <div className="rst-intake-channels">
   <section><h3>{r.inPerson}</h3><strong>{availability(status?.in_person.available)}</strong><p>{r.inPersonHelp}</p>{status&&<ul>{reasons(status.in_person.reasons.filter(v=>v!=='release'))}</ul>}</section>
   {(['pickup','delivery'] as const).map(k=><section key={k} data-service={k}><h3>{r[k]}</h3><p>{u[k]}</p><p><strong>{config?(config[k]?.enabled?r.savedOn:r.savedOff):r.noStatus}</strong></p><details><summary>{restaurantClarityCopy[locale].details}</summary><dl><div><dt>{r.website}</dt><dd>{availability(status?.[k].web.available)}</dd></div><div><dt>WhatsApp</dt><dd>{availability(status?.[k].whatsapp.available)}</dd></div></dl><p>{config?(config[k]?.enabled?r.savedOn:r.savedOff):r.noStatus}</p>{status&&<ul>{reasons([...status[k].web.reasons,...status[k].whatsapp.reasons].filter(v=>v!=='release'),modern)}</ul>}{config&&config.schedules?.[k]?<><h4>{c.saved}</h4><WeeklySummary value={config.schedules[k]!} locale={locale}/></>:config&&<>{modern&&<p>{config[k]?.windows.length?c.migration:u.notConfigured}</p>}{(!modern||!!config[k]?.windows.length)&&periods(config[k]?.windows??[])}</>}{modern&&<><h4>{c.actual}</h4>{verified?[nowLocal.slice(0,10),tomorrow.toISOString().slice(0,10)].map(day=>{const choices=(status?.[k].customer_windows??[]).filter(w=>localInstant(w.starts_at,timezone).slice(0,10)===day);return <details key={day}><summary>{day} {'\u00b7'} {choices.length}</summary>{choices.length?periods(choices):<p>{c.none}</p>}</details>}):<p>{r.stale}</p>}</>}</details><button type="button" disabled={!fresh||!api.online||api.busy||!!api.pending||api.conflict} onClick={()=>edit(k)}>{k==='pickup'?r.editPickup:r.editDelivery}</button></section>)}
  </div>
  {modern&&config?.hours&&<section><h3>{c.exceptions}</h3>{config.hours.exceptional_closures.length?periods(config.hours.exceptional_closures):<p>{u.noClosures}</p>}</section>}
  {onOpen&&<button type="button" onClick={()=>onOpen('hours')}>{r.goHours}</button>}
  {api.message&&<p role="status">{t(api.message)}</p>}
  {editing&&<form className="rst-intake-editor" onSubmit={e=>{e.preventDefault();if(api.pending||review)void save();else setReview(true);}}>
   <h3>{kind==='pickup'?r.editPickup:r.editDelivery}</h3><p>{dirty?r.editing:r.unchanged}</p>
   <fieldset disabled={api.busy||!!api.pending||api.conflict||!fresh||!api.online}>
    <label><input type="checkbox" checked={enabled} disabled={!modern&&blocked.length>0&&!enabled} onChange={e=>{setEnabled(e.target.checked);setReview(false);setDirty(true);}}/>{modern?(kind==='pickup'?u.enablePickup:u.enableDelivery):r.enable}</label>
    <p>{u[kind]}</p><p>{u.optional}</p>{blocked.length>0&&<aside><h4>{r.setup}</h4><ul>{reasons(blocked)}</ul></aside>}
{modern?<><aside className="rst-intake-saved"><h4>{c.saved}</h4><p>{config?.[kind]?.enabled?r.savedOn:r.savedOff}</p>{config?.schedules?.[kind]?<WeeklySummary value={config.schedules[kind]!} locale={locale}/>:<p>{u.notConfigured}</p>}</aside><p>{u.suggestionHelp}</p><button type="button" disabled={!config?.hours?.schedule?.windows.length} onClick={()=>{if(weekly.weekly_periods.length&&!window.confirm(u.replaceSuggestion))return;setWeekly({...weekly,weekly_periods:(config?.hours?.schedule?.windows??[]).map(p=>({...p}))});setDirty(true);setReview(false);}}>{u.useHours}</button><WeeklyEditor value={weekly} locale={locale} onChange={value=>{setWeekly(value);setReview(false);setDirty(true);}}/></>:<><h3>{r.periods}</h3><p>{r.periodHelp}</p>{nowLocal&&<p>{nowLocal.slice(0,10)} → {tomorrow.toISOString().slice(0,10)}</p>}<p>{t('timezone')}: {timezone ?? r.timezone}</p>{windows.map((w,i)=><div className="rst-row" key={i}>{(['starts_at','ends_at'] as const).map((k,j)=><label key={k}>{t(j?'to':'from')}<LocalTime value={w[k]} timezone={timezone} locale={locale} onChange={v=>{setWindows(old=>old.map((x,n)=>n===i?{...x,[k]:v}:x));setReview(false);setDirty(true);}}/></label>)}<button type="button" onClick={()=>{setWindows(old=>old.filter((_,n)=>n!==i));setReview(false);setDirty(true);}}>{t('remove')}</button></div>)}<button type="button" disabled={windows.length>=20} onClick={()=>{setWindows(old=>[...old,{starts_at:'',ends_at:''}]);setReview(false);setDirty(true);}}>{t('add')}</button></>}
 {kind==='delivery' && <><h3>{t('fee')}</h3><p>{u.feeHelp}</p><label>{u.feeAmount}<input required={enabled} inputMode="decimal" pattern="[0-9]{1,16}(\.[0-9]{1,2})?" value={fee.amount} onChange={e=>{setFee({...fee,amount:e.target.value});setReview(false);setDirty(true);}}/></label><label>{t('currency')}<select value={fee.currency} onChange={e=>{setFee({...fee,currency:e.target.value});setReview(false);setDirty(true);}}><option>CDF</option><option>USD</option></select></label><h3>{t('areas')}</h3><p>{u.areaHelp}</p>{areas.map((a,i)=><div className="rst-fields" key={i}>{(['country','city','commune','quartier'] as const).map(k=><label key={k}>{t(k)}<input required={enabled && (k!=='quartier' || a.scope==='quartier')} maxLength={200} value={a[k] ?? ''} onChange={e=>{setAreas(old=>old.map((x,n)=>n===i?{...x,[k]:e.target.value}:x));setReview(false);setDirty(true);}}/></label>)}<label>{t('scope')}<select value={a.scope} onChange={e=>{setAreas(old=>old.map((x,n)=>n===i?{...x,scope:e.target.value,quartier:e.target.value==='whole_commune'?null:x.quartier}:x));setReview(false);setDirty(true);}}><option value="whole_commune">{t('whole_commune')}</option><option value="quartier">{t('quartier')}</option></select></label><button type="button" onClick={()=>{setAreas(old=>old.filter((_,n)=>n!==i));setReview(false);setDirty(true);}}>{t('remove')}</button></div>)}<button type="button" disabled={areas.length>=100} onClick={()=>{setAreas(old=>[...old,{country:'',city:'',commune:'',quartier:null,scope:'whole_commune'}]);setReview(false);setDirty(true);}}>{t('add')}</button></>}
   </fieldset>
   {invalidDelivery&&<p>{u.deliveryIncomplete}</p>}
   {!modern&&(enabled||pickupWindowEdits&&!keepPickupPeriods)&&invalidWindows&&<p role="status">{r.windows}</p>}
   {modern&&!legacyPause&&!validSchedule(weekly)&&<p role="status">{c.invalid}</p>}
   {review&&<aside className="rst-intake-confirm"><h4>{kind==='pickup'?r.reviewPickup:r.reviewDelivery}</h4><p>{enabled?r.enableEffect:r.pauseEffect}</p><p>{r[kind]} · {enabled?t('enabled'):r.paused}</p>{scheduleWrite?<WeeklySummary value={weekly} locale={locale}/>:keepPickupPeriods?<p>{r.keepPeriods}</p>:<ul>{windows.map((w,i)=><li key={i}>{w.starts_at.replace('T',' ')} → {w.ends_at.replace('T',' ')} · {timezone}</li>)}</ul>}{kind==='delivery'&&<p>{fee.amount} {fee.currency} · {areas.length} {t('areas')}</p>}</aside>}
   <div className="rst-actions"><button type="button" disabled={api.busy||!!api.pending} onClick={()=>{if(config)fill(config,kind);setEditing(false);}}>{r.cancel}</button><button className="button button-primary" disabled={!fresh||!api.online||api.busy||api.conflict||!config||(!api.pending&&(invalid||!dirty))}>{api.pending?t('retry'):review?r.confirm:kind==='pickup'?r.reviewPickup:r.reviewDelivery}</button></div>
  </form>}
 </section>;
}
