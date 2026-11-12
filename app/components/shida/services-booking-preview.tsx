"use client";
import {useEffect,useState} from 'react';
import {localDate} from '../../lib/shida-calendar';
import {personalCalendarCopy} from '../../lib/services-personal-calendar-copy';
import {plannerCopy} from '../../lib/services-planner-copy';
import {scheduleCopy} from '../../lib/services-calendar-copy';
import type {ProviderLocale} from '../../lib/services-provider-copy';
type Preview={appointment_booking:boolean;availability_mode:string;timezone:string;requested_time_requires_provider_confirmation:boolean;slots:{date:string;start_time:string;end_time:string}[]};
export function ServicesBookingPreview({service,name,duration,locale,dirty,revision,personal=false,description}:{personal?:boolean;description?:string;service:string;name:string;duration:number|null;locale:ProviderLocale;dirty:boolean;revision:number}){
 const [selected,setSelected]=useState('');
 const c=personalCalendarCopy(locale);
 const t=plannerCopy[locale],s=scheduleCopy[locale];
 const [day,setDay]=useState(()=>localDate(new Date().toISOString(),'Africa/Kinshasa')),[value,setValue]=useState<Preview|null>(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();queueMicrotask(()=>{setValue(null);setFailed(false);});
  void fetch(`/api/shida/services/availability?${new URLSearchParams({service,date:day})}`,{cache:'no-store',credentials:'omit',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();const data=await response.json();if(data.service_ref!==service||!Array.isArray(data.slots))throw Error();if(!controller.signal.aborted)setValue(data);}).catch(()=>{if(!controller.signal.aborted)setFailed(true);});return()=>controller.abort();
 },[service,day,revision,retry]);
 return <section aria-label={s.bookingPreview} className="svc-booking-preview svc-live-preview">{!personal&&<h3>{s.bookingPreview}</h3>}<strong>{name}</strong>{description&&<p>{description}</p>}<p>{duration?`${duration} ${s.minutes} · `:''}{!value?.timezone||value.timezone==='Africa/Kinshasa'?s.zone:value.timezone}</p><p>{t.savedPreview}</p>{dirty&&<p className="svc-draft-note">{t.draftPreview}</p>}<label>{t.date}<input type="date" required value={day} onChange={event=>{if(event.target.value)setDay(event.target.value);}}/></label>{failed?<div role="alert"><p>{t.previewError}</p><button type="button" onClick={()=>setRetry(value=>value+1)}>{t.retry}</button></div>:!value?<p role="status">{t.loading}</p>:!value.appointment_booking?<><p>{personal?c.arrangeNote:t.flexiblePreview}</p>{personal&&<button disabled>{c.visit}</button>}</>:<><p>{value.requested_time_requires_provider_confirmation?(personal?c.approvalNote:s.approval):s.instant}</p>{value.slots.length?<ul className="svc-preview-slots">{value.slots.map(slot=><li key={`${slot.date}-${slot.start_time}`}>{personal?<button type="button" aria-pressed={selected===slot.date+slot.start_time} onClick={()=>setSelected(slot.date+slot.start_time)}>{slot.start_time}–{slot.end_time}</button>:slot.start_time+'–'+slot.end_time}</li>)}</ul>:<p>{personal?c.noSlots:t.noSlots}</p>}{personal&&<button disabled>{value.requested_time_requires_provider_confirmation?c.ask:c.book}</button>}</>}<small>{t.previewHelp}</small></section>;
}
