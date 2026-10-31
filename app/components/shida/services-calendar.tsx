"use client";
import {ServicesHoursEditor} from './services-hours-editor';
import {ServicesBookingPreview} from './services-booking-preview';
import {plannerCopy} from '../../lib/services-planner-copy';
import {validWorkingHours} from '../../lib/services-hours-model';
import './services-planner.css';
import Image from 'next/image';
import {workdayCopy} from '../../lib/services-workday-copy';
import {serviceCalendarLabel,calendarStateCopy} from '../../lib/services-calendar-labels';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ShidaCalendar} from './shida-calendar';
import {servicesEvent,localDate,monthBounds,type ProtectedCalendarProjection} from '../../lib/shida-calendar';
import {scheduleCopy} from '../../lib/services-calendar-copy';
import type {ProviderLocale} from '../../lib/services-provider-copy';
import {useWorkDraft,leaveWork} from '../../lib/restaurant-work';

type Offering={category?:string;public_ref:string;service_name:string;is_active:string;publication_origin:string;service_duration_minutes:number|null};
type Hours={day:string;start:string;end:string};
type Schedule={offering_ref:string;revision:number;mode:'appointments'|'flexible';confirmation:'provider_approval'|'automatic';hours:Hours[];duration_minutes:number|null;timezone:string};
type Share={name:string;url:string;qr_image:string};
const nowDay=()=>localDate(new Date().toISOString(),'Africa/Kinshasa');
export function ServicesCalendar({base,binding,locale,offerings,initialService,initialTab="calendar",sharingOnly=false,onSaved,onOpen,onDenied,onEditDuration,refreshToken=0,onBusy}:{base:string;binding:string;locale:ProviderLocale;offerings:Offering[];initialService?:string|null;sharingOnly?:boolean;initialTab?:"calendar"|"hours"|"share";refreshToken?:number;onBusy?:(busy:boolean)=>void;onSaved:()=>void;onOpen:(ref:string)=>void;onDenied:()=>void;onEditDuration?:(ref:string)=>void}){
 const t=scheduleCopy[locale],p=plannerCopy[locale];
 const [reload,setReload]=useState(0),[hoursEditing,setHoursEditing]=useState(false);
 const lastRefresh=useRef(refreshToken);
 const [tab,setTab]=useState<'calendar'|'hours'|'share'>(initialTab),[service,setService]=useState(initialService??offerings.find(row=>row.is_active==='yes')?.public_ref??'');
 const [filter,setFilter]=useState(''),[month,setMonth]=useState(()=>nowDay().slice(0,7)),[day,setDay]=useState(nowDay),[page,setPage]=useState(1);
 const [events,setEvents]=useState<ProtectedCalendarProjection[]>([]),[more,setMore]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [schedule,setSchedule]=useState<Schedule|null>(null),[saved,setSaved]=useState(''),[share,setShare]=useState<Share|null>(null),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[pending,setPending]=useState<object|null>(null);
 const epoch=useRef(0),saveEpoch=useRef(0),busyRef=useRef(false),denied=useRef(onDenied),savedCallback=useRef(onSaved);
 useEffect(()=>{denied.current=onDenied;savedCallback.current=onSaved;},[onDenied,onSaved]);
 useEffect(()=>{onBusy?.(busy||!!pending);return()=>onBusy?.(false);},[busy,pending,onBusy]);
 const dirty=!!schedule&&JSON.stringify(schedule)!==saved;
 useWorkDraft(dirty||!!pending,t.leave);
 const request=useCallback(async(path:string,body?:object)=>{
  const response=await fetch(`${base}${path}`,{method:body?'PATCH':'GET',credentials:'include',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{Accept:'application/json','X-Shida-Session':binding,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  if(!response.ok){if([401,403].includes(response.status))denied.current();throw new Error(String(response.status));}
  return response.json();
 },[base,binding]);
 const loadCalendar=useCallback(async()=>{
  const ticket=++epoch.current;setLoading(true);setError('');
  const range=monthBounds(month),params=new URLSearchParams({date_from:range.from,date_to:range.to,page:String(page)});if(filter)params.set('offering_ref',filter);
  try{const result=await request(`/calendar?${params}`);if(ticket!==epoch.current)return;
   if(!Array.isArray(result.items))throw new Error('invalid');
   setEvents(old=>page===1?result.items:[...old,...result.items]);setMore(result.has_more===true);
  }catch{if(ticket===epoch.current){setEvents([]);setMore(false);setError(t.failed);}}finally{if(ticket===epoch.current)setLoading(false);}
 },[filter,month,page,request,t.failed]);
 useEffect(()=>{queueMicrotask(()=>void loadCalendar());const current=epoch;return()=>{current.current++;};},[loadCalendar]);
 useEffect(()=>{const current=saveEpoch;return()=>{current.current++;};},[]);
 useEffect(()=>{
  const ticket=++saveEpoch.current;
  queueMicrotask(()=>{
  if(ticket!==saveEpoch.current)return;
  setSchedule(null);setShare(null);setNotice('');setPending(null);
  if(!service||tab==='calendar'){setBusy(false);return;}
  setBusy(true);
  void request(`/${service}/${tab==='hours'?'schedule':`share?language=${locale}`}`).then(result=>{
   if(ticket!==saveEpoch.current)return;
   if(tab==='hours'){setSchedule(result);setSaved(JSON.stringify(result));}
   else if(typeof result.url==='string'&&/^https?:\/\//.test(result.url)&&typeof result.qr_image==='string'&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(result.qr_image)){setShare(result);}else throw new Error('invalid');
  }).catch(caught=>{if(ticket===saveEpoch.current)setNotice(caught instanceof Error&&caught.message==='409'?t.publish:t.failed);}).finally(()=>{if(ticket===saveEpoch.current)setBusy(false);});
  });
 },[service,tab,request,locale,t.failed,t.publish,reload]);
 useEffect(()=>{if(lastRefresh.current===refreshToken)return;lastRefresh.current=refreshToken;if(busyRef.current||pending||!leaveWork())return;queueMicrotask(()=>{setReload(value=>value+1);if(page===1)void loadCalendar();else setPage(1);});},[refreshToken,pending,page,loadCalendar]);
 function switchTab(next:typeof tab){if(busy||pending||(dirty||hoursEditing)&&!leaveWork())return;setTab(next);}
 function selectService(next:string){if(busy||pending||(dirty||hoursEditing)&&!leaveWork())return;setService(next);}
 function update(values:Partial<Schedule>){if(schedule){setSchedule({...schedule,...values});setNotice('');}}
 async function save(){
  if(!schedule||busyRef.current||hoursEditing)return;
  if(!pending&&!validWorkingHours(schedule.hours)){setNotice(t.invalid);return;}
  const payload=pending??{expected_revision:schedule.revision,operation_key:crypto.randomUUID(),mode:schedule.mode,confirmation:schedule.confirmation,hours:schedule.hours};
  busyRef.current=true;setBusy(true);setPending(payload);setNotice('');const ticket=saveEpoch.current;
  try{const result=await request(`/${service}/schedule`,payload);if(ticket!==saveEpoch.current)return;setSchedule(result);setSaved(JSON.stringify(result));setPending(null);setNotice(t.saved);savedCallback.current();void loadCalendar();}
  catch(caught){if(ticket!==saveEpoch.current)return;const status=caught instanceof Error?caught.message:'';
   if(status==='409'){setPending(null);setSchedule(null);setNotice(t.stale);try{const latest=await request(`/${service}/schedule`);if(ticket===saveEpoch.current){setSchedule(latest);setSaved(JSON.stringify(latest));}}catch{setNotice(t.failed);}}
   else if(status==='422'){setPending(null);setNotice(t.invalid);}else if(['401','403','404'].includes(status)){setPending(null);setSchedule(null);setNotice(t.failed);}else setNotice(t.uncertain);
  }finally{busyRef.current=false;if(ticket===saveEpoch.current)setBusy(false);}
 }
 async function copy(){if(!share)return;try{await navigator.clipboard.writeText(share.url);setNotice(t.copied);}catch{setNotice(t.failed);}}
 async function nativeShare(){if(!share)return;if(!navigator.share){await copy();return;}try{await navigator.share({title:share.name,url:share.url});}catch(caught){if(!(caught instanceof Error&&caught.name==='AbortError'))setNotice(t.failed);}}
 const active=offerings.filter(row=>row.is_active==='yes');
 return <section className="svc-planner" aria-label={t.calendar}>
  {!sharingOnly&&<div className="svc-planner-tabs" role="group" aria-label={t.calendar}>{(['calendar','hours'] as const).map(item=><button type="button" key={item} aria-pressed={tab===item} disabled={busy||!!pending} onClick={()=>switchTab(item)}>{t[item]}</button>)}</div>}
  {tab==='calendar'?<div className="svc-editor-card"><div className="svc-planner-toolbar"><label>{t.service}<select value={filter} onChange={event=>{setFilter(event.target.value);setPage(1);setEvents([]);}}><option value="">{t.all}</option>{active.map(row=><option key={row.public_ref} value={row.public_ref}>{row.service_name}</option>)}</select></label><span>{t.zone}</span>{!onBusy&&<button type="button" disabled={loading} onClick={()=>{if(page===1)void loadCalendar();else setPage(1);}}>{t.refresh}</button>}</div>{loading&&<p role="status">{calendarStateCopy[locale].loading}</p>}{error&&<p role="alert">{error}</p>}
   {!error&&!loading&&<ShidaCalendar zoneLabel={t.zone} refinedServices agendaLabel={serviceCalendarLabel(offerings.find(row=>row.public_ref===filter)?.category,locale)} locale={locale} timeZone="Africa/Kinshasa" month={month} selected={day} events={events.map(row=>servicesEvent({...row,status:(t.statuses as Record<string,string>)[row.status]??t.statusOther}))} onMonthChange={value=>{setMonth(value);setDay(`${value}-01`);setPage(1);setEvents([]);}} onSelect={setDay} onOpen={event=>onOpen(event.reference)} hasMore={more} onMore={()=>setPage(value=>value+1)}/>}
  </div>:<div className="svc-editor-card"><div className="svc-planner-toolbar"><label>{t.service}<select disabled={busy||!!pending} value={service} onChange={event=>selectService(event.target.value)}>{active.map(row=><option key={row.public_ref} value={row.public_ref}>{row.service_name}</option>)}</select></label><span>{t.zone}</span></div>{!active.length&&<p>{t.noServices}</p>}{notice&&<p role="status" className="svc-notice">{notice}</p>}
   {tab==='hours'&&busy&&!schedule&&<p role="status">{calendarStateCopy[locale].loading}</p>}{tab==='hours'&&!schedule&&!busy&&active.length>0&&<button type="button" onClick={()=>setReload(value=>value+1)}>{t.retry}</button>}{tab==='hours'&&schedule&&<form onSubmit={event=>{event.preventDefault();void save();}}><fieldset disabled={busy||!!pending} className="svc-hours-fields">
    {schedule.mode==='appointments'?<><p>{t.hoursHelp}</p>{!schedule.duration_minutes&&<div role="alert"><p>{t.duration}</p>{onEditDuration&&<button type="button" onClick={()=>{if(!(dirty||hoursEditing)||leaveWork())onEditDuration(service);}}>{t.editDuration}</button>}</div>}<ServicesHoursEditor key={`${service}-${schedule.revision}`} locale={locale} hours={schedule.hours} onChange={hours=>update({hours})} onEditing={setHoursEditing}/></>:<p>{t.flexibleHelp}</p>}
<h3>{p.settings}</h3><div className="svc-form-grid svc-booking-settings"><label>{t.mode}<select disabled={hoursEditing} value={schedule.mode} onChange={event=>update({mode:event.target.value as Schedule['mode']})}><option value="flexible">{t.flexible}</option><option value="appointments">{t.appointments}</option></select></label>{schedule.mode==='appointments'&&<label>{t.confirmation}<select value={schedule.confirmation} onChange={event=>update({confirmation:event.target.value as Schedule['confirmation']})}><option value="provider_approval">{t.approval}</option><option value="automatic">{t.instant}</option></select></label>}</div>
   </fieldset><ServicesBookingPreview key={service} service={service} name={active.find(row=>row.public_ref===service)?.service_name??''} duration={schedule.duration_minutes} locale={locale} dirty={dirty} revision={schedule.revision+reload}/>
   <div className="svc-form-actions"><button className="svc-primary" type="submit" disabled={busy||hoursEditing||schedule.mode==='appointments'&&!schedule.duration_minutes}>{pending?t.retry:t.save}</button><button type="button" disabled={busy||!!pending||hoursEditing||!dirty} onClick={()=>{setSchedule(JSON.parse(saved));setNotice('');}}>{p.discard}</button></div></form>}
   {tab==='share'&&share&&<div className="svc-sharing"><div className="svc-qr-paper"><span>SHIDA</span><h3>{share.name}</h3><Image unoptimized src={share.qr_image} width={240} height={240} alt={t.share}/><p>{t.preview}</p></div><div><h3>{t.shareLink}</h3><p>{calendarStateCopy[locale].linkHelp}</p><p>{t.shareHelp}</p><label>{t.copy}<input readOnly value={share.url} onFocus={event=>event.currentTarget.select()}/></label><div className="svc-share-actions"><button className="svc-primary" type="button" onClick={()=>void nativeShare()}>{t.shareLink}</button><button type="button" onClick={()=>void copy()}>{t.copy}</button><a href={`https://wa.me/?text=${encodeURIComponent(share.url)}`} target="_blank" rel="noopener noreferrer">{workdayCopy[locale].whatsapp}</a><a className="button" href={share.qr_image} download="shida-service-qr.png">{t.download}</a><a href={share.url} target="_blank" rel="noopener noreferrer">{t.preview} ↗</a></div></div></div>}
  </div>}
 </section>;
}
