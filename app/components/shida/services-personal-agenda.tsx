"use client";
import {useEffect,useRef,useState} from 'react';
import type {ProviderLocale} from '../../lib/services-provider-copy';
import {calendarCopy,localDate,type ProtectedCalendarProjection} from '../../lib/shida-calendar';
import {personalCalendarCopy} from '../../lib/services-personal-calendar-copy';
import {scheduleCopy} from '../../lib/services-calendar-copy';
import {plannerCopy} from '../../lib/services-planner-copy';

export type AgendaOffering={public_ref:string;service_name:string;booking_mode?:string|null;service_duration_minutes:number|null;requests_enabled?:boolean;visible_to_customers?:boolean;commune?:string|null;home_service_available?:string|null};
export type AgendaRow=ProtectedCalendarProjection & {client?:string; travel?:number;location_type?:string;review_hours?:boolean;arrival_window?:boolean;commune?:string};
export type Unscheduled=Pick<AgendaRow,'title'|'client'|'reference'>;
type Slot={start_time:string;end_time:string;date:string};
type Choice=Slot & {service:AgendaOffering};
export type CalendarRequest=(path:string,body?:object,method?:'POST'|'PATCH')=>Promise<unknown>;
const zone='Africa/Kinshasa';
function shift(day:string,delta:number){const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+delta);return date.toISOString().slice(0,10);}
function ManualBooking({services,day,locale,request,onSaved}:{services:AgendaOffering[];day:string;locale:ProviderLocale;request:CalendarRequest;onSaved:()=>void}){
 const c=personalCalendarCopy(locale),t=scheduleCopy[locale],p=plannerCopy[locale];
 const [slots,setSlots]=useState<Choice[]|null>(null),[start,setStart]=useState(''),[ref,setRef]=useState(''),[client,setClient]=useState('');
 const [failed,setFailed]=useState(false),[reload,setReload]=useState(0),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState('');
 const guard=useRef(false),operation=useRef({key:'',data:''});
 useEffect(()=>{const controller=new AbortController();
  async function load(){setSlots(null);setFailed(false);
   try{const lists=await Promise.all(services.map(async service=>{
    const response=await fetch('/api/shida/services/availability?'+new URLSearchParams({service:service.public_ref,date:day}),{cache:'no-store',signal:controller.signal,credentials:'omit'});
    if(!response.ok)throw Error();const result=await response.json();
    if(result.service_ref!==service.public_ref||!Array.isArray(result.slots))throw Error();
    return (result.slots as Slot[]).filter(slot=>slot.date===day).map(slot=>({...slot,service}));
   }));if(!controller.signal.aborted)setSlots(lists.flat().sort((a,b)=>a.start_time.localeCompare(b.start_time)));}
   catch{if(!controller.signal.aborted)setFailed(true);}
  }void load();return()=>controller.abort();
 },[services,day,reload]);
 const choice=slots?.find(x=>x.service.public_ref===ref&&x.start_time===start);
 async function submit(){if(!choice||!client.trim()||guard.current)return;guard.current=true;setSaving(true);setSaveError('');
 const body={client:client.trim(),date:day,start:choice.start_time,end:choice.end_time},data=JSON.stringify([ref,body]);
 if(operation.current.data!==data)operation.current={key:crypto.randomUUID(),data};
 try{await request('/'+ref+'/manual-appointment',{...body,operation_key:operation.current.key},'POST');onSaved();}
 catch(error){setSaveError(error instanceof Error&&error.message==='409'?t.stale:t.uncertain);if(error instanceof Error&&error.message==='409')setReload(n=>n+1);}
 finally{guard.current=false;setSaving(false);}}
 return <section className="svc-cal-panel"><h3>{c.manual}</h3>{failed?<p role="alert">{p.previewError} <button onClick={()=>setReload(n=>n+1)}>{t.retry}</button></p>:slots===null?<p role="status">{p.loading}</p>:!slots.length?<p>{c.noSlots}</p>:<fieldset disabled={saving}><label>{c.free}<select value={start} onChange={e=>{setStart(e.target.value);setRef('');}}><option value="">—</option>{[...new Set(slots.map(x=>x.start_time))].map(time=><option key={time}>{time}</option>)}</select></label>{start&&<fieldset><legend>{c.fits}</legend>{slots.filter(x=>x.start_time===start).map(x=><label key={x.service.public_ref}><input type="radio" name="calendar-treatment" checked={ref===x.service.public_ref} onChange={()=>setRef(x.service.public_ref)}/>{x.service.service_name} · {x.start_time}–{x.end_time}</label>)}</fieldset>}{choice&&<label>{c.client}<input maxLength={100} value={client} onChange={e=>setClient(e.target.value)}/></label>}<button type="button" className="svc-primary" disabled={!choice||!client.trim()} onClick={submit}>{c.manual}</button></fieldset>}{saveError&&<p role="alert">{saveError}</p>}</section>;
}
export function PersonalAgenda({day,select,locale,events,unscheduled,services,request,onOpen,onSaved}:{day:string;select:(day:string)=>void;locale:ProviderLocale;events:AgendaRow[];unscheduled:Unscheduled[];services:AgendaOffering[];request:CalendarRequest;onOpen:(ref:string)=>void;onSaved:()=>void}){
 const c=personalCalendarCopy(locale),t=scheduleCopy[locale],a=calendarCopy[locale];
 const [manual,setManual]=useState(false);
 const time=(instant:string|number)=>new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:zone}).format(new Date(instant));
 const today=events.filter(x=>localDate(x.startsAt,zone)===day).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
 const waiting=today.filter(x=>x.status==='pending');
 return <div className="svc-cal-layout"><section className="svc-cal-panel"><header><h3>{c.agenda}</h3>{services.length>0&&<button className="svc-primary" aria-expanded={manual} onClick={()=>setManual(!manual)}>{c.manual}</button>}</header>
 <div className="svc-cal-date"><button aria-label={c.previous} onClick={()=>select(shift(day,-1))}>‹</button><input type="date" aria-label={c.agenda} value={day} onChange={e=>{if(e.target.value)select(e.target.value);}}/><button aria-label={c.next} onClick={()=>select(shift(day,1))}>›</button><button onClick={()=>select(localDate(new Date().toISOString(),zone))}>{a.today}</button></div>
 {today.length===0&&<p>{c.empty}</p>}{today.map(row=><article className="svc-cal-event" key={row.reference}>{!!row.travel&&<small>{c.journey} · {time(Date.parse(row.startsAt)-row.travel*60000)}–{time(row.startsAt)}</small>}
 <div><strong>{time(row.startsAt)}{row.endsAt?' – '+time(row.endsAt):''}</strong>{row.endsAt&&<small>{Math.round((Date.parse(row.endsAt)-Date.parse(row.startsAt))/60000)} {t.minutes}</small>}</div>
 <div><strong>{row.title}</strong><small>{[row.client,row.location_type==='remote'?c.remote:row.location_type==='customer_location'||row.location_type==='at_customer'?c.clientSite:row.location_type?c.onsite:'',row.commune].filter(Boolean).join(' · ')}</small>{row.arrival_window&&<small>{c.arrival}</small>}</div>
 <div><span className="svc-cal-badge">{(t.statuses as Record<string,string>)[row.status]??t.statusOther}</span>{row.review_hours&&<small>{c.review}</small>}<button type="button" onClick={()=>onOpen(row.reference)}>{row.arrival_window?c.viewMission:c.viewBooking}</button></div></article>)}</section>
 <aside>{manual&&<ManualBooking services={services} day={day} locale={locale} request={request} onSaved={()=>{setManual(false);onSaved();}}/>}
 {waiting.length>0&&<section className="svc-cal-panel"><h3>{c.pending}</h3>{waiting.map(row=><div className="svc-cal-task" key={row.reference}><strong>{row.client} · {row.title}</strong><span>{time(row.startsAt)}</span><button onClick={()=>onOpen(row.reference)}>{c.confirm}</button></div>)}</section>}
 <section className="svc-cal-panel"><h3>{c.unscheduled}</h3>{unscheduled.length?unscheduled.map(row=><div className="svc-cal-task" key={row.reference}><strong>{row.title}</strong><span>{row.client}</span><button onClick={()=>onOpen(row.reference)}>{c.propose}</button></div>):<span>—</span>}</section></aside></div>;
}
