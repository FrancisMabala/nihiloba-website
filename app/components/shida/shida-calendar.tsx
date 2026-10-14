"use client";
import {useRef, useState, type KeyboardEvent} from 'react';
import {calendarCopy, localDate, monthBounds, shiftMonth, type CalendarEvent, type CalendarLocale} from '../../lib/shida-calendar';
import './shida-calendar.css';
import './shida-calendar-mobile.css';

type Props={locale:CalendarLocale;timeZone:string;month:string;selected:string;events:CalendarEvent[];
  onMonthChange:(month:string)=>void;onSelect:(date:string)=>void;onOpen?:(event:CalendarEvent)=>void;
  hasMore?:boolean;onMore?:()=>void;dateOnly?:boolean};

export function ShidaCalendar({locale,timeZone,month,selected,events,onMonthChange,onSelect,onOpen,hasMore,onMore,dateOnly=false}:Props){
  const t=calendarCopy[locale], [view,setView]=useState<'calendar'|'list'>('calendar');
  const buttons=useRef<HTMLDivElement>(null);
  const {from,to}=monthBounds(month), count=Math.round((Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/86400000);
  const firstDay=new Date(from+'T00:00:00Z').getUTCDay();
  const today=localDate(new Date().toISOString(),timeZone);
  const monthTitle=new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(from+'T12:00:00Z'));
  const dayEvents=(day:string)=>events.filter(event=>localDate(event.startsAt,timeZone)===day);
  const format=(event:CalendarEvent)=>new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{timeZone:event.timeZone,hour:'2-digit',minute:'2-digit'}).format(new Date(event.startsAt));
  function choose(day:string){if(day.slice(0,7)!==month)onMonthChange(day.slice(0,7));onSelect(day);}
  function arrows(event:KeyboardEvent<HTMLButtonElement>,day:string){
    const movement:{[key:string]:number}={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
    if(!(event.key in movement))return;
    event.preventDefault();const next=new Date(Date.parse(day+'T12:00:00Z')+movement[event.key]*86400000).toISOString().slice(0,10);
    choose(next);requestAnimationFrame(()=>buttons.current?.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)?.focus());
  }
  function entries(rows:CalendarEvent[]){return rows.map(event=><li key={`${event.marketplace}:${event.reference}`} className={`shida-cal-event shida-cal-${event.tone}`}>
    <span className="shida-cal-time">{format(event)} <span>{event.timeZone}</span></span>
    <strong>{event.title}</strong><span className="shida-cal-status">{event.status}</span>
    {onOpen&&<button type="button" onClick={()=>onOpen(event)}>{t.open}</button>}
  </li>);}
  return <section className="shida-calendar" lang={locale} aria-label={t.calendar}>
    <div className="shida-cal-toolbar"><button type="button" onClick={()=>onMonthChange(shiftMonth(month,-1))} aria-label={t.previous}>‹</button>
      <h3 aria-live="polite">{monthTitle}</h3><button type="button" onClick={()=>onMonthChange(shiftMonth(month,1))} aria-label={t.next}>›</button>
      <button type="button" onClick={()=>choose(today)}>{t.today}</button>
      {!dateOnly&&<div className="shida-cal-view"><button type="button" aria-pressed={view==='calendar'} onClick={()=>setView('calendar')}>{t.calendar}</button><button type="button" aria-pressed={view==='list'} onClick={()=>setView('list')}>{t.list}</button></div>}
    </div>
    {view==='calendar'||dateOnly?<div className="shida-cal-grid" ref={buttons} role="group" aria-label={monthTitle}>
      {t.weekdays.map((label,index)=><span className="shida-cal-weekday" key={index}>{label}</span>)}
      {Array.from({length:firstDay},(_,index)=><span key={`blank-${index}`} aria-hidden="true"/>)}
      {Array.from({length:count},(_,index)=>{const day=new Date(Date.parse(from+'T12:00:00Z')+index*86400000).toISOString().slice(0,10), matches=dayEvents(day);
        return <button type="button" key={day} data-day={day} className="shida-cal-day" aria-pressed={selected===day} aria-label={`${new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{dateStyle:'full',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'))}${matches.length?`, ${matches.length}`:''}`} onClick={()=>choose(day)} onKeyDown={event=>arrows(event,day)}><span>{index+1}</span>{!dateOnly&&matches.length>0&&<small>{matches.length}<span className="shida-cal-dot"/></small>}</button>})}
    </div>:<ol className="shida-cal-list">{entries(events.filter(event=>{const day=localDate(event.startsAt,timeZone);return day>=from&&day<to;}).sort((a,b)=>a.startsAt.localeCompare(b.startsAt)))}</ol>}
    {!dateOnly&&<div className="shida-cal-agenda"><h4>{t.agenda} · {new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{dateStyle:'full',timeZone:'UTC'}).format(new Date(selected+'T12:00:00Z'))}</h4>{dayEvents(selected).length?<ol className="shida-cal-list">{entries(dayEvents(selected).sort((a,b)=>a.startsAt.localeCompare(b.startsAt)))}</ol>:<p>{t.empty}</p>}</div>}
    {!dateOnly&&hasMore&&onMore&&<button type="button" onClick={onMore}>{t.more}</button>}
  </section>;
}
