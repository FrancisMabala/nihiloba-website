'use client';
import {intakeDesignText} from '../../lib/restaurant-intake-design-copy';
import {SellerWorkspaceIcon as SpaceIcon} from './services-workspace-icon';
import { useEffect, useRef, useState } from 'react';
import { useRestaurantReturn } from '@/app/lib/use-restaurant-return';
import { intakeSetupCopy } from '@/app/lib/restaurant-intake-setup-copy';
import { localInstant } from '@/app/lib/restaurant-seller';
import { dateText, useWorkRequest, useWorkDraft, type Configuration, type ServiceWindow, type Area } from '@/app/lib/restaurant-work';
import { workText } from '@/app/lib/restaurant-work-copy';
import { receivingCopy, type ReceivingReason } from '@/app/lib/restaurant-receiving';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';
import { LocalTime } from './restaurant-local-time';
import './restaurant-intake.css';
import {useDiscardChanges} from './discard-changes';
import {useConfirmation} from './confirmation-dialog';
import { emptySchedule, validSchedule, scheduleCopy, type WeeklySchedule } from '@/app/lib/restaurant-schedule';
import { WeeklyEditor, WeeklySummary } from './restaurant-weekly-schedule';

type Kind='pickup'|'delivery';
export function RestaurantIntake({path,binding,locale,timezone,onFailure,onOpen}:{path:string;binding:string;locale:RestaurantLocale;timezone:string|null;onFailure:(e:unknown)=>void;onOpen?:(tab:string)=>void}) {
 const r=receivingCopy[locale],t=(k:string)=>workText(locale,k),api=useWorkRequest(binding,onFailure);
 const d=(key:Parameters<typeof intakeDesignText>[1])=>intakeDesignText(locale,key);
 const toggleLock=useRef(false);
 const c=scheduleCopy[locale],u=intakeSetupCopy[locale];
 const {discard,confirmation:discardDialog}=useDiscardChanges(locale);
 const {request:confirm,confirmation:replaceDialog}=useConfirmation(locale);
 const editorHeading=useRef<HTMLHeadingElement>(null);
 const editButtons=useRef<Partial<Record<Kind,HTMLButtonElement|null>>>({});

 const [weekly,setWeekly]=useState<WeeklySchedule>(emptySchedule);
 const [now,setNow]=useState(0);
 const [config,setConfig]=useState<Configuration|null>(null),[kind,setKind]=useState<Kind>('pickup'),[editing,setEditing]=useState(false),[enabled,setEnabled]=useState(false),[windows,setWindows]=useState<ServiceWindow[]>([]),[areas,setAreas]=useState<Area[]>([]),[fee,setFee]=useState({amount:'',currency:'CDF'}),[review,setReview]=useState(false),[fresh,setFresh]=useState(false),[dirty,setDirty]=useState(false);
 useEffect(()=>{if(editing){editorHeading.current?.focus({preventScroll:true});editorHeading.current?.scrollIntoView({block:'start',behavior:'instant'});}},[editing,kind]);
 useWorkDraft(dirty || review || !!api.pending,t('discard'),locale);
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
 async function edit(k:Kind){if(api.busy)return;const current=await api.run<Configuration>(`${path}/order-configuration`);if(!current)return;const change=()=>{fill(current,k);setEditing(true);};if(dirty)discard(change);else change();}
 function periods(values:ServiceWindow[]){return values.length?<ul className="rst-intake-periods">{values.map((w,i)=>{
  const start=localInstant(w.starts_at,timezone),end=localInstant(w.ends_at,timezone);
  return <li key={i}><time>{dateText(w.starts_at,locale,timezone)}</time> → <time>{dateText(w.ends_at,locale,timezone)}</time>{start.slice(0,10)!==end.slice(0,10)&&<small>{r.overnight}</small>}{Date.parse(w.ends_at)<=now?<strong>{r.expiredLabel}</strong>:Date.parse(w.starts_at)<=now?<small>{r.started}</small>:null}</li>;
 })}</ul>:<p>{r.noPeriods}</p>;}
 const editor = editing ? (<form id="restaurant-intake-editor" aria-labelledby="restaurant-intake-editor-title" className="rst-intake-editor" onSubmit={e=>{e.preventDefault();if(api.pending||review)void save();else setReview(true);}}>
   <h3 ref={editorHeading} id="restaurant-intake-editor-title" tabIndex={-1}>{kind==='pickup'?r.editPickup:r.editDelivery}</h3><p>{dirty?r.editing:r.unchanged}</p>
   <fieldset disabled={api.busy||!!api.pending||api.conflict||!fresh||!api.online}>
    <label><input type="checkbox" checked={enabled} disabled={!modern&&blocked.length>0&&!enabled} onChange={e=>{setEnabled(e.target.checked);setReview(false);setDirty(true);}}/>{modern?(kind==='pickup'?u.enablePickup:u.enableDelivery):r.enable}</label>
    <p>{u[kind]}</p><p>{u.optional}</p>{blocked.length>0&&<aside><h4>{r.setup}</h4><ul>{reasons(blocked)}</ul></aside>}
{modern?<><aside className="rst-intake-saved"><h4>{c.saved}</h4><p>{config?.[kind]?.enabled?r.savedOn:r.savedOff}</p>{config?.schedules?.[kind]?<WeeklySummary value={config.schedules[kind]!} locale={locale}/>:<p>{u.notConfigured}</p>}</aside><p>{u.suggestionHelp}</p><button type="button" disabled={!config?.hours?.schedule?.windows.length} onClick={()=>{const replace=()=>{setWeekly({...weekly,weekly_periods:(config?.hours?.schedule?.windows??[]).map(p=>({...p}))});setDirty(true);setReview(false);};if(weekly.weekly_periods.length)confirm({title:u.replaceSuggestion,description:u.suggestionHelp,confirmLabel:u.useHours,severity:'warning',onConfirm:replace});else replace();}}>{u.useHours}</button><WeeklyEditor value={weekly} locale={locale} onChange={value=>{setWeekly(value);setReview(false);setDirty(true);}}/></>:<><h3>{r.periods}</h3><p>{r.periodHelp}</p>{nowLocal&&<p>{nowLocal.slice(0,10)} → {tomorrow.toISOString().slice(0,10)}</p>}<p>{t('timezone')}: {timezone ?? r.timezone}</p>{windows.map((w,i)=><div className="rst-row" key={i}>{(['starts_at','ends_at'] as const).map((k,j)=><label key={k}>{t(j?'to':'from')}<LocalTime value={w[k]} timezone={timezone} locale={locale} onChange={v=>{setWindows(old=>old.map((x,n)=>n===i?{...x,[k]:v}:x));setReview(false);setDirty(true);}}/></label>)}<button type="button" onClick={()=>{setWindows(old=>old.filter((_,n)=>n!==i));setReview(false);setDirty(true);}}>{t('remove')}</button></div>)}<button type="button" disabled={windows.length>=20} onClick={()=>{setWindows(old=>[...old,{starts_at:'',ends_at:''}]);setReview(false);setDirty(true);}}>{t('add')}</button></>}
 {kind==='delivery' && <><h3>{t('fee')}</h3><p>{u.feeHelp}</p><label>{u.feeAmount}<input required={enabled} inputMode="decimal" pattern="[0-9]{1,16}(\.[0-9]{1,2})?" value={fee.amount} onChange={e=>{setFee({...fee,amount:e.target.value});setReview(false);setDirty(true);}}/></label><label>{t('currency')}<select value={fee.currency} onChange={e=>{setFee({...fee,currency:e.target.value});setReview(false);setDirty(true);}}><option>CDF</option><option>USD</option></select></label><h3>{t('areas')}</h3><p>{u.areaHelp}</p>{areas.map((a,i)=><div className="rst-fields" key={i}>{(['country','city','commune','quartier'] as const).map(k=><label key={k}>{t(k)}<input required={enabled && (k!=='quartier' || a.scope==='quartier')} maxLength={200} value={a[k] ?? ''} onChange={e=>{setAreas(old=>old.map((x,n)=>n===i?{...x,[k]:e.target.value}:x));setReview(false);setDirty(true);}}/></label>)}<label>{t('scope')}<select value={a.scope} onChange={e=>{setAreas(old=>old.map((x,n)=>n===i?{...x,scope:e.target.value,quartier:e.target.value==='whole_commune'?null:x.quartier}:x));setReview(false);setDirty(true);}}><option value="whole_commune">{t('whole_commune')}</option><option value="quartier">{t('quartier')}</option></select></label><button type="button" onClick={()=>{setAreas(old=>old.filter((_,n)=>n!==i));setReview(false);setDirty(true);}}>{t('remove')}</button></div>)}<button type="button" disabled={areas.length>=100} onClick={()=>{setAreas(old=>[...old,{country:'',city:'',commune:'',quartier:null,scope:'whole_commune'}]);setReview(false);setDirty(true);}}>{t('add')}</button></>}
   </fieldset>
   {invalidDelivery&&<p>{u.deliveryIncomplete}</p>}
   {!modern&&(enabled||pickupWindowEdits&&!keepPickupPeriods)&&invalidWindows&&<p role="status">{r.windows}</p>}
   {modern&&!legacyPause&&!validSchedule(weekly)&&<p role="status">{c.invalid}</p>}
   {review&&<aside className="rst-intake-confirm"><h4>{kind==='pickup'?r.reviewPickup:r.reviewDelivery}</h4><p>{enabled?r.enableEffect:r.pauseEffect}</p><p>{r[kind]} · {enabled?t('enabled'):r.paused}</p>{scheduleWrite?<WeeklySummary value={weekly} locale={locale}/>:keepPickupPeriods?<p>{r.keepPeriods}</p>:<ul>{windows.map((w,i)=><li key={i}>{w.starts_at.replace('T',' ')} → {w.ends_at.replace('T',' ')} · {timezone}</li>)}</ul>}{kind==='delivery'&&<p>{fee.amount} {fee.currency} · {areas.length} {t('areas')}</p>}</aside>}
   <div className="rst-actions"><button type="button" disabled={api.busy||!!api.pending} onClick={()=>{const cancel=()=>{if(config)fill(config,kind);setEditing(false);requestAnimationFrame(()=>editButtons.current[kind]?.focus());};if(dirty)discard(cancel);else cancel();}}>{r.cancel}</button><button className="button button-primary" disabled={!fresh||!api.online||api.busy||api.conflict||!config||(!api.pending&&(invalid||!dirty))}>{api.pending?t('retry'):review?r.confirm:kind==='pickup'?r.reviewPickup:r.reviewDelivery}</button></div>
  </form>) : null;
 function configured(k:Kind,value=config){return !!value?.[k]&&((value.schedules?.[k]?.weekly_periods.length??0)>0||(value[k]?.windows.length??0)>0)&&(k==='pickup'||!!value.delivery?.areas.length&&value.delivery.fee.amount!=='');}
 function state(k:Kind){if(!verified||!status)return 'unknown';if(!config?.intake_released)return 'blocked';if(!configured(k))return 'setup';if(!config?.[k]?.enabled)return 'paused';if(status[k].web.available||status[k].whatsapp.available)return 'ready';if([...status[k].web.reasons,...status[k].whatsapp.reasons].some(v=>['hours','closure'].includes(v)))return 'closed';return 'blocked';}
 async function toggle(k:Kind){if(toggleLock.current||api.busy)return;toggleLock.current=true;try{const current=await api.run<Configuration>(`${path}/order-configuration`);if(!current)return;if(!configured(k,current)){fill(current,k);setEditing(true);return;}const enabled=!current[k]!.enabled;const saved=current.schedules?.[k];const schedule=saved?{weekly_periods:saved.weekly_periods,minimum_lead_minutes:saved.minimum_lead_minutes,cutoff_minutes:saved.cutoff_minutes,allow_tomorrow:saved.allow_tomorrow}:null;const result=await api.run(`${path}/${k}-intake`,'PUT',{operation_key:crypto.randomUUID(),expected_updated_at:current.revision,enabled,windows:current.schedules?.[k]||k==='pickup'&&!enabled?[]:current[k]!.windows.map(w=>({starts_at:localInstant(w.starts_at,timezone),ends_at:localInstant(w.ends_at,timezone)})),...(schedule?{schedule}:{}),...(k==='delivery'?{fee:current.delivery!.fee,areas:current.delivery!.areas}:{})});if(result)await refresh(false);else setFresh(false);}finally{toggleLock.current=false;}}
 function todayHours(k:Kind){const local=localInstant(status?.evaluated_at,timezone);if(!local)return '';const weekday=(new Date(local.slice(0,10)+'T12:00:00Z').getUTCDay()+6)%7;return config?.schedules?.[k]?.weekly_periods.filter(p=>p.weekday===weekday).map(p=>p.start+'–'+p.end).join(' · ')??'';}
 const friendlyZone=(timezone??'').split('/').pop()?.replaceAll('_',' ')??'';
 const checked=status?new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{timeZone:timezone??'UTC',hour:'2-digit',minute:'2-digit'}).format(new Date(status.evaluated_at)):'';
 return <section className="rst-card rst-work rst-intake rst-intake-redesign" lang={locale}>{discardDialog}{replaceDialog}
  <header><div><h2>{r.title}</h2><p>{d('intro')}</p></div><div className="rst-intake-refresh"><button type="button" disabled={api.busy||!api.online} onClick={()=>void refresh()}>{d('refresh')}</button>{status&&<small>{d('checked').replace('{time}',checked).replace('{zone}',friendlyZone)}</small>}</div></header>
  {(!verified||!api.online)&&<p role="status">{d('error')}</p>}
  <div className="rst-intake-channels">
   {(['pickup','delivery'] as const).map(k=><section key={k} data-service={k}><div className="rst-intake-card-title"><span className="rst-intake-icon"><SpaceIcon name={k==='pickup'?'catalog':'work'}/></span><div><h3>{d(k)}</h3><p>{d(k==='pickup'?'pickupHelp':'deliveryHelp')}</p></div></div><p><strong className={`rst-intake-badge is-${state(k)}`}>{d(state(k))}</strong>{todayHours(k)&&<span className="rst-intake-hours-today">{todayHours(k)}</span>}</p>
   {state(k)==='setup'&&k==='delivery'&&<p>{d('deliveryMissing')}</p>}{verified&&status&&state(k)!=='ready'&&state(k)!=='paused'&&state(k)!=='setup'&&<ul>{reasons([...status[k].web.reasons,...status[k].whatsapp.reasons].filter(v=>v!=='paused'),modern)}</ul>}
   <button className="button button-primary" ref={node=>{editButtons.current[k]=node;}} type="button" disabled={!config||!api.online||api.busy||!!api.pending||api.conflict} onClick={()=>configured(k)?void toggle(k):void edit(k)}>{configured(k)?config?.[k]?.enabled?d('pause'):d('resume'):d(k==='pickup'?'setupPickup':'setupDelivery')}</button>
   {configured(k)&&<button type="button" className="rst-intake-link" disabled={api.busy||!!api.pending} onClick={()=>void edit(k)}>{k==='pickup'?d('editHours'):r.editDelivery}</button>}
   {config?.[k]?.enabled&&<small>{d('preserved')}</small>}
   <details><summary>{d('details')}</summary><dl><div><dt>{r.website}</dt><dd>{availability(status?.[k].web.available)}</dd></div><div><dt>WhatsApp</dt><dd>{availability(status?.[k].whatsapp.available)}</dd></div></dl>{config?.schedules?.[k]?<WeeklySummary value={config.schedules[k]!} locale={locale}/>:periods(config?.[k]?.windows??[])}</details></section>)}
  </div>{editing&&editor}
  <div className="rst-intake-compact"><span className="rst-intake-icon"><SpaceIcon name="catalog"/></span><div><h3>{d('inPerson')}</h3><p>{d('inPersonHelp')}</p></div>{onOpen&&<button type="button" onClick={()=>onOpen('pos')}>{d('take')}</button>}</div>
  {onOpen&&<button type="button" className="rst-intake-compact rst-intake-hours" onClick={()=>onOpen('hours')}><span className="rst-intake-icon"><SpaceIcon name="calendar"/></span><strong>{d('hours')}</strong><span aria-hidden="true">›</span></button>}
  {api.pending&&!editing&&<button type="button" disabled={api.busy||api.conflict} onClick={()=>void toggle(api.pending!.path.includes('/delivery-intake')?'delivery':'pickup')}>{t('retry')}</button>}
  {api.message&&<p role="status">{t(api.message)}</p>}
 </section>;
}
