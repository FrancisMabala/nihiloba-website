"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import {localDate} from '../../lib/shida-calendar';
import {personalCalendarCopy} from '../../lib/services-personal-calendar-copy';
import {scheduleCopy} from '../../lib/services-calendar-copy';
import {plannerCopy} from '../../lib/services-planner-copy';
import {copyWorkingHours,validWorkingHours,workingDays,type WorkingInterval} from '../../lib/services-hours-model';
import type {ProviderLocale} from '../../lib/services-provider-copy';
import type {AgendaOffering,CalendarRequest} from './services-personal-agenda';
import {ServicesBookingPreview} from './services-booking-preview';
import {useWorkDraft} from '../../lib/restaurant-work';
export type PersonalPolicy={shared_revision:number;week:WorkingInterval[];absences:{start:string;end:string}[];inherit_week:boolean;travel_minutes:number};
export type CalendarSchedule={offering_ref:string;revision:number;mode:'appointments'|'flexible';confirmation:'provider_approval'|'automatic';hours:WorkingInterval[];duration_minutes:number|null;timezone:string;personal_calendar?:PersonalPolicy};
type PersonalSchedule=CalendarSchedule & {personal_calendar:PersonalPolicy};
function WeekSummary({hours,locale}:{hours:WorkingInterval[];locale:ProviderLocale}){
 const t=scheduleCopy[locale],groups=new Map<string,string[]>();
 workingDays.forEach((day,i)=>{const label=hours.filter(x=>x.day===day).sort((a,b)=>a.start.localeCompare(b.start)).map(x=>x.start+'–'+x.end).join(' · ')||t.closed;groups.set(label,[...(groups.get(label)??[]),t.days[i]]);});
 return <dl className="svc-cal-week">{Array.from(groups,([label,days])=><div key={label}><dt>{days.join(', ')}</dt><dd>{label}</dd></div>)}</dl>;
}
function DraftSlots({draft,request,locale}:{draft:PersonalSchedule;request:CalendarRequest;locale:ProviderLocale}){
 const p=plannerCopy[locale],c=personalCalendarCopy(locale),s=scheduleCopy[locale];
 const [day,setDay]=useState(()=>localDate(new Date().toISOString(),draft.timezone)),[result,setResult]=useState<string[]|null>(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;const timer=setTimeout(async()=>{setResult(null);setFailed(false);
 try{const data=await request('/'+draft.offering_ref+'/schedule-preview',{date:day,mode:draft.mode,hours:draft.hours,personal_calendar:draft.personal_calendar},'POST') as {slots:{start_time:string}[]};
 if(active)setResult(data.slots.map(x=>x.start_time));}catch{if(active)setFailed(true);}},180);
 return()=>{active=false;clearTimeout(timer);};},[day,draft,request,retry]);
 return <section className="svc-cal-preview"><h4>{c.preview}</h4>{draft.mode==='flexible'?<p>{p.flexiblePreview}</p>:<><label>{p.date}<input type="date" value={day} onChange={e=>{if(e.target.value)setDay(e.target.value);}}/></label>{failed?<p role="alert">{p.previewError} <button onClick={()=>setRetry(n=>n+1)}>{s.retry}</button></p>:result===null?<p>{p.loading}</p>:<p>{result.length?result.join(' · '):c.noSlots}</p>}</>}</section>;
}
function HoursDrawer({kind,initial,locale,request,save,close,name}:{kind:'week'|'service'|'absence';initial:PersonalSchedule;locale:ProviderLocale;request:CalendarRequest;save:(s:CalendarSchedule)=>Promise<boolean>;close:()=>void;name:string}){
 const c=personalCalendarCopy(locale),s=scheduleCopy[locale],p=plannerCopy[locale];
 const dialog=useRef<HTMLDialogElement>(null);
 const [draft,setDraft]=useState(initial),[which,setWhich]=useState<string>('monday'),[copy,setCopy]=useState<string[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useWorkDraft(JSON.stringify(initial)!==JSON.stringify(draft),s.leave,locale);
 useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close();},[]);
 const rule=draft.personal_calendar,shared=kind==='week',hours=shared?rule.week:draft.hours,rows=hours.filter(x=>x.day===which);
 const setPolicy=(next:Partial<PersonalPolicy>)=>setDraft({...draft,personal_calendar:{...rule,...next}});
 function setHours(next:WorkingInterval[]){if(shared)setPolicy({week:next});else setDraft({...draft,hours:next});}
 const replaceDay=(values:WorkingInterval[])=>setHours([...hours.filter(x=>x.day!==which),...values]);
 const final=useMemo(()=>{
  if(kind!=='week'||!copy.length)return draft;
  const week=draft.personal_calendar.week;
  const copied=copyWorkingHours(week,which,copy);
  return {...draft,personal_calendar:{...draft.personal_calendar,week:copied}};
 },[draft,kind,copy,which]);
 async function submit(){if(busy)return;if(!validWorkingHours(final.hours)||!validWorkingHours(final.personal_calendar.week)||rule.absences.some(x=>!x.start||!x.end||x.end<x.start)){setError(s.invalid);return;}
 setBusy(true);setError('');if(await save(final))close();else{setBusy(false);setError(s.uncertain);}}
 return <dialog className="svc-cal-drawer" ref={dialog} aria-labelledby="svc-cal-editor-title" onCancel={e=>{e.preventDefault();if(!busy)close();}}><header><h3 id="svc-cal-editor-title">{shared?c.editWeek:kind==='absence'?c.block:c.editService}</h3><button disabled={busy} aria-label={p.cancel} onClick={close}>×</button></header>
 <p>{kind==='service'?name+' · ':''}{s.zone}</p><fieldset disabled={busy}>
 {kind==='absence'?<><h4>{c.blocked}</h4>{rule.absences.map((row,i)=><div className="svc-hours-range" key={i}>{(['start','end'] as const).map(k=><label key={k}>{k==='start'?s.opens:s.closes}<input type="date" value={row[k]} onChange={e=>setPolicy({absences:rule.absences.map((item,n)=>n===i?{...item,[k]:e.target.value}:item)})}/></label>)}<button aria-label={s.remove} onClick={()=>setPolicy({absences:rule.absences.filter((_,n)=>n!==i)})}>×</button></div>)}<button onClick={()=>setPolicy({absences:[...rule.absences,{start:'',end:''}]})}>{c.block}</button></>:<>
 {kind==='service'&&<><label>{s.mode}<select value={draft.mode} onChange={e=>setDraft({...draft,mode:e.target.value as CalendarSchedule['mode']})}><option value="appointments">{s.appointments}</option><option value="flexible">{s.flexible}</option></select></label>{draft.mode==='appointments'&&<label>{s.confirmation}<select value={draft.confirmation} onChange={e=>setDraft({...draft,confirmation:e.target.value as CalendarSchedule['confirmation']})}><option value="automatic">{s.instant}</option><option value="provider_approval">{s.approval}</option></select></label>}
 {[true,false].map(inherit=><label key={String(inherit)}><input type="radio" name="svc-inherit" checked={rule.inherit_week===inherit} onChange={()=>setPolicy({inherit_week:inherit})}/>{inherit?c.inherit:c.custom}</label>)}</>}
 {(shared||!rule.inherit_week)&&<><div className="svc-cal-days">{workingDays.map((day,i)=><button type="button" aria-pressed={which===day} key={day} onClick={()=>{setWhich(day);setCopy([]);}}>{s.days[i]}</button>)}</div>
 <label><input type="checkbox" checked={rows.length>0} onChange={e=>replaceDay(e.target.checked?[{day:which,start:'09:00',end:'17:00'}]:[])}/>{s.days[workingDays.indexOf(which)]} · {s.open}</label>
 {rows.map((row,i)=><div className="svc-hours-range" key={i}>{(['start','end'] as const).map(k=><label key={k}>{k==='start'?s.opens:s.closes}<input type="time" value={row[k]} onChange={e=>replaceDay(rows.map((x,n)=>i===n?{...x,[k]:e.target.value}:x))}/></label>)}<button aria-label={s.remove} onClick={()=>replaceDay(rows.filter((_,n)=>n!==i))}>×</button></div>)}<button disabled={rows.length>=3} onClick={()=>replaceDay([...rows,{day:which,start:rows.at(-1)?.end??'09:00',end:''}])}>{p.addInterval}</button>
 {shared&&<fieldset><legend>{p.copy}</legend><div className="svc-cal-days">{workingDays.filter(x=>x!==which).map(day=><label key={day}><input type="checkbox" checked={copy.includes(day)} onChange={e=>setCopy(e.target.checked?[...copy,day]:copy.filter(x=>x!==day))}/>{s.days[workingDays.indexOf(day)]}</label>)}</div><p>{p.targets} · {[which,...copy].map(x=>s.days[workingDays.indexOf(x)]).join(', ')}</p></fieldset>}</>}
 {kind==='service'&&<label>{c.travel}<input type="number" min="0" max="480" value={rule.travel_minutes} onChange={e=>setPolicy({travel_minutes:Number(e.target.value)})}/></label>}</>}
 </fieldset>{error&&<p role="alert">{error}</p>}<DraftSlots draft={final} locale={locale} request={request}/><footer><button disabled={busy} onClick={close}>{p.cancel}</button><button className="svc-primary" disabled={busy} onClick={submit}>{c.save}</button></footer></dialog>;
}
export function PersonalAvailability({schedule,offering,locale,request,save,edit}:{schedule:PersonalSchedule;offering?:AgendaOffering;locale:ProviderLocale;request:CalendarRequest;save:(s:CalendarSchedule)=>Promise<boolean>;edit?:()=>void}){
 const [drawer,setDrawer]=useState<'week'|'service'|'absence'|null>(null),[initial,setInitial]=useState(schedule);
 const c=personalCalendarCopy(locale),s=scheduleCopy[locale],p=plannerCopy[locale],rule=schedule.personal_calendar;
 function open(kind:NonNullable<typeof drawer>){setInitial(schedule);setDrawer(kind);}
 return <div className="svc-cal-layout"><div><section className="svc-cal-panel"><header><h3>{c.week}</h3><button onClick={()=>open('week')}>{p.edit}</button></header><WeekSummary hours={rule.week} locale={locale}/><button onClick={()=>open('absence')}>{c.block}</button>{rule.absences.map((x,i)=><small key={i}>{x.start} – {x.end}</small>)}</section>
 <section className="svc-cal-panel"><h3>{c.byService}</h3><strong>{offering?.service_name}</strong><p>{rule.inherit_week?c.inherit:c.custom}</p><WeekSummary hours={rule.inherit_week?rule.week:schedule.hours} locale={locale}/><p>{[schedule.mode==='appointments'?s.appointments:s.flexible,schedule.duration_minutes?schedule.duration_minutes+' '+s.minutes:null,schedule.mode==='appointments'?(schedule.confirmation==='automatic'?s.instant:s.approval):null,offering?.home_service_available==='yes'?c.clientSite:null,offering?.commune,rule.travel_minutes?c.journey+' · '+rule.travel_minutes+' '+s.minutes:null].filter(Boolean).join(' · ')}</p><button onClick={()=>open('service')}>{c.editService}</button>{edit&&<button onClick={edit}>{c.services} →</button>}</section></div>
 <aside className="svc-cal-panel"><h3>{c.customer}</h3>{schedule.mode==='flexible'&&<WeekSummary hours={rule.inherit_week?rule.week:schedule.hours} locale={locale}/>}{offering?.visible_to_customers===false||offering?.requests_enabled===false?<p>{offering.visible_to_customers===false?s.publish:s.mode+' · '+s.closed}</p>:<ServicesBookingPreview personal description={[offering?.home_service_available==='yes'?c.clientSite:'',offering?.commune].filter(Boolean).join(' · ')} service={schedule.offering_ref} name={offering?.service_name??''} locale={locale} duration={schedule.duration_minutes} dirty={false} revision={schedule.revision}/>}</aside>
 {drawer&&<HoursDrawer kind={drawer} initial={initial} locale={locale} request={request} save={save} close={()=>setDrawer(null)} name={offering?.service_name??''}/>}</div>;
}
