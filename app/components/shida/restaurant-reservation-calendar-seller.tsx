"use client";
import {restaurantClarityCopy} from "../../lib/restaurant-clarity-copy";
import {useCallback,useEffect,useRef,useState} from 'react';
import {DashboardApiError,request} from '../../lib/restaurant-seller-browser';
import {reservationCopy,type Reservation,type ReservationLocale} from '../../lib/restaurant-reservation-copy';
import {sellerReservationCopy} from '../../lib/restaurant-reservation-seller-copy';
import {workflowText} from '../../lib/restaurant-workflow-copy';
import {localDate,monthBounds,restaurantEvent} from '../../lib/shida-calendar';
import {ShidaCalendar} from './shida-calendar';
import './restaurant-reservation-calendar-seller.css';

type Setting={enabled:boolean;revision:number;available:boolean};
type Page={items:Reservation[];has_more:boolean;timezone_name?:string};
type Action='accept'|'reject'|'cancel'|'arrive'|'complete';
type Choice={row:Reservation;action:Action;key:string};
const unique=(rows:Reservation[])=>[...new Map(rows.map(row=>[row.reservation_ref,row])).values()];
const valid=(row:Reservation)=>Boolean(row?.reservation_ref&&row?.starts_at&&row?.timezone_name&&Number.isFinite(row.party_size));

export function RestaurantReservationCalendarSeller({path,binding,locale,onSettings,onHours,seated=true,capable=true}:{path:string;binding:string;locale:ReservationLocale;onSettings?:()=>void;onHours?:()=>void;seated?:boolean;capable?:boolean}){
 const t=reservationCopy[locale],s=sellerReservationCopy[locale];
 const [setting,setSetting]=useState<Setting|null>(null),[history,setHistory]=useState<Reservation[]>([]),[pending,setPending]=useState<Reservation[]>([]),[calendar,setCalendar]=useState<Reservation[]>([]);
 const [zone,setZone]=useState('UTC'),[month,setMonth]=useState(()=>new Date().toISOString().slice(0,7)),[selected,setSelected]=useState(()=>new Date().toISOString().slice(0,10));
 const [historyPage,setHistoryPage]=useState(1),[pendingPage,setPendingPage]=useState(1),[calendarPage,setCalendarPage]=useState(1);
 const [historyMore,setHistoryMore]=useState(false),[pendingMore,setPendingMore]=useState(false),[calendarMore,setCalendarMore]=useState(false);
 const [view,setView]=useState<'list'|'calendar'>('list'),[search,setSearch]=useState(''),[status,setStatus]=useState('all'),[date,setDate]=useState('');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[loadedAt,setLoadedAt]=useState('');
 const [choice,setChoice]=useState<Choice|null>(null),[detail,setDetail]=useState<Reservation|null>(null),[now,setNow]=useState(0);
 const generation=useRef(0),initialZone=useRef(false),pendingWrite=useRef(false),settingKey=useRef<string|null>(null),confirmRef=useRef<HTMLButtonElement>(null),actionRef=useRef<HTMLButtonElement>(null);
 const load=useCallback(async()=>{
  const ticket=++generation.current;setLoading(true);
  try{
   const {from,to}=monthBounds(month);
   const [config,queue,list,range]=await Promise.all([
    request(`${path}/reservations/setting`,{},binding) as Promise<Setting>,
    request(`${path}/reservations/pending?page=${pendingPage}&page_size=100`,{},binding) as Promise<Page>,
    request(`${path}/reservations?page=${historyPage}&page_size=50`,{},binding) as Promise<Page>,
    request(`${path}/reservations/calendar?date_from=${from}&date_to=${to}&page=${calendarPage}&page_size=100`,{},binding) as Promise<Page>
   ]);
   if(ticket!==generation.current)return;
   const nextZone=range.timezone_name||'UTC';
   setSetting(config);setPending(old=>pendingPage===1?queue.items.filter(valid):unique([...old,...queue.items.filter(valid)]));setPendingMore(queue.has_more);
   setHistory(old=>historyPage===1?list.items.filter(valid):unique([...old,...list.items.filter(valid)]));setHistoryMore(list.has_more);
   setCalendar(old=>calendarPage===1?range.items.filter(valid):unique([...old,...range.items.filter(valid)]));setCalendarMore(range.has_more);
   setChoice(old=>old&&list.items.some(row=>row.reservation_ref===old.row.reservation_ref&&row.revision!==old.row.revision)?null:old);
   setZone(nextZone);setLoadedAt(new Date().toISOString());setError('');
   if(!initialZone.current&&nextZone!=='UTC'){initialZone.current=true;const local=localDate(new Date().toISOString(),nextZone);setSelected(local);setMonth(local.slice(0,7));}
  }catch{if(ticket===generation.current)setError(s.loadFailed);}finally{if(ticket===generation.current)setLoading(false);}
 },[path,binding,month,historyPage,pendingPage,calendarPage,s.loadFailed]);
 useEffect(()=>{const currentGeneration=generation;queueMicrotask(()=>void load());const focus=()=>void load();window.addEventListener('focus',focus);const timer=window.setInterval(()=>setNow(Date.now()),60000);queueMicrotask(()=>setNow(Date.now()));return()=>{currentGeneration.current++;window.clearInterval(timer);window.removeEventListener('focus',focus);};},[load]);
 useEffect(()=>{if(choice)confirmRef.current?.focus();},[choice]);
 const today=localDate(new Date(now).toISOString(),zone);
 const stamp=(row:Reservation)=>new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{timeZone:row.timezone_name,dateStyle:'medium',timeStyle:'short'}).format(new Date(row.starts_at));
 const deadline=(row:Reservation)=>new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{timeZone:row.timezone_name,dateStyle:'medium',timeStyle:'short'}).format(new Date(row.response_deadline));
 const canReply=(row:Reservation)=>!error&&row.state==='pending'&&now<Date.parse(row.response_deadline)&&now<Date.parse(row.starts_at);
 const matches=(row:Reservation)=>row.reservation_ref.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())&&(status==='all'||row.state===status)&&(!date||localDate(row.starts_at,row.timezone_name)===date);
 const queue=pending.filter(matches),day=unique([...calendar,...history]).filter(row=>['accepted','arrived'].includes(row.state)&&localDate(row.starts_at,row.timezone_name)===today&&matches(row));
 const upcoming=history.filter(row=>localDate(row.starts_at,row.timezone_name)>today&&row.state!=='pending'&&matches(row));
 const past=history.filter(row=>localDate(row.starts_at,row.timezone_name)<today||['rejected','cancelled','expired','completed'].includes(row.state)).filter(row=>matches(row));
 const label=(action:Action)=>action==='reject'?s.decline:t[action];
 function begin(row:Reservation,action:Action){setChoice({row,action,key:crypto.randomUUID().replaceAll('-','')});setNotice('');}
 async function open(ref:string){setBusy(true);try{setDetail(await request(`${path}/reservations/${ref}`,{},binding) as Reservation);setError('');}catch{setError(s.loadFailed);}finally{setBusy(false);}}
 async function respond(){if(!choice||pendingWrite.current)return;pendingWrite.current=true;setBusy(true);const current=choice;
  try{const changed=await request(`${path}/reservations/${current.row.reservation_ref}/${current.action}`,{method:'POST',body:JSON.stringify({expected_revision:current.row.revision,operation_key:current.key})},binding) as Reservation;
   setChoice(null);setDetail(changed);setPending(old=>old.filter(row=>row.reservation_ref!==changed.reservation_ref));setHistory(old=>old.map(row=>row.reservation_ref===changed.reservation_ref?changed:row));setCalendar(old=>old.map(row=>row.reservation_ref===changed.reservation_ref?changed:row));setNotice(current.action==='accept'?s.acceptedNotice:current.action==='reject'?s.declinedNotice:`${t[changed.state]}. ${s.updated}.`);await load();
  }catch(caught){if(caught instanceof DashboardApiError&&caught.kind==='conflict'){setChoice(null);setNotice(s.stale);}else setNotice(s.uncertain);await load();
  }finally{pendingWrite.current=false;setBusy(false);}}
 async function copy(ref:string){try{await navigator.clipboard.writeText(ref);setNotice(s.copied);}catch{setNotice(s.copyFailed);}}
 async function configure(){if(!setting||busy||!seated||!capable)return;setBusy(true);const key=settingKey.current??crypto.randomUUID().replaceAll('-','');settingKey.current=key;try{await request(`${path}/reservations/setting`,{method:'PUT',body:JSON.stringify({enabled:!setting.enabled,expected_revision:setting.revision,operation_key:key})},binding);settingKey.current=null;await load();}catch(caught){if(caught instanceof DashboardApiError&&caught.kind==='conflict'){settingKey.current=null;setNotice(s.stale);}else setNotice(s.uncertain);await load();}finally{setBusy(false);}}
 function card(row:Reservation){return <article className="rst-res-row" key={row.reservation_ref}>
  <div><strong>{s.guest}</strong><p><time dateTime={row.starts_at}>{stamp(row)}</time> · {row.timezone_name}</p><p>{row.party_size} {t.size} · <strong>{t[row.state]}</strong></p><p className="rst-res-muted">{s.source}</p><p className="rst-res-ref">{s.reference}: <code>{row.reservation_ref}</code> <button type="button" onClick={()=>void copy(row.reservation_ref)} aria-label={`${s.copy} ${row.reservation_ref}`}>{s.copy}</button></p></div>
  <div className="rst-res-next">{canReply(row)?<><small>{s.replyBy} {deadline(row)} · {row.timezone_name}</small><button type="button" disabled={busy||Boolean(choice)} onClick={()=>begin(row,'accept')}>{t.accept}</button><button type="button" disabled={busy||Boolean(choice)} onClick={()=>begin(row,'reject')}>{s.decline}</button></>:row.state==='pending'?<p>{error?s.loadFailed:s.deadlinePassed}</p>:<span>{t[row.state]}</span>}{!error&&row.state==='accepted'&&now>=Date.parse(row.starts_at)-1800000&&<button type="button" disabled={busy||Boolean(choice)} onClick={()=>begin(row,'arrive')}>{t.arrive}</button>}{!error&&row.state==='arrived'&&now>=Date.parse(row.starts_at)-1800000&&<button type="button" disabled={busy||Boolean(choice)} onClick={()=>begin(row,'complete')}>{t.complete}</button>}{!error&&['pending','accepted'].includes(row.state)&&<button type="button" disabled={busy||Boolean(choice)} onClick={()=>begin(row,'cancel')}>{t.cancel}</button>}</div>
 </article>;}
 return <section className="rst-reservations rst-card" lang={locale} aria-label={t.requests}>
  <header className="rst-res-header"><div><h2>{t.requests}</h2><p>{restaurantClarityCopy[locale].reservations}</p><details><summary>{restaurantClarityCopy[locale].details}</summary><p>{s.noGuarantee}</p><p className="rst-res-muted">{s.sourceLimit}</p></details></div><button type="button" disabled={loading||busy} onClick={()=>void load()}>{s.refresh}</button></header>
  {setting&&<aside className="rst-res-intake" role="status"><strong>{setting.available&&seated&&capable?workflowText(locale,'requestsOn'):!seated||!capable?s.ineligible:s.closed}</strong>{setting.available&&seated&&capable&&<p>{t.settingHelp}</p>}<div className="rst-res-actions">{seated&&capable&&<button type="button" disabled={busy} onClick={()=>onSettings?onSettings():void configure()}>{onSettings?s.settings:setting.enabled?t.disable:t.enable}</button>}{!setting.available&&(!seated||!capable)&&onSettings&&<button type="button" onClick={onSettings}>{s.settings}</button>}{!setting.available&&onHours&&<button type="button" onClick={onHours}>{s.hours}</button>}</div></aside>}
  {loading&&!loadedAt&&<p role="status">{s.loading}</p>}{error&&<p role="alert">{error}</p>}{notice&&<p role="status" className="rst-res-notice">{notice}</p>}{loadedAt&&<small className="rst-res-muted">{s.updated}: <time dateTime={loadedAt}>{new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{timeZone:zone,dateStyle:'medium',timeStyle:'short'}).format(new Date(loadedAt))}</time> · {zone}</small>}
  <div className="rst-res-view" role="group" aria-label={t.requests}><button type="button" aria-pressed={view==='list'} onClick={()=>setView('list')}>{s.list}</button><button type="button" aria-pressed={view==='calendar'} onClick={()=>setView('calendar')}>{s.calendar}</button></div>
  {view==='list'?<><div className="rst-res-filters"><label>{s.search}<input type="search" value={search} onChange={event=>setSearch(event.target.value)}/></label><label>{s.status}<select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">{s.all}</option>{(['pending','accepted','rejected','cancelled','expired','arrived','completed'] as const).map(state=><option key={state} value={state}>{t[state]}</option>)}</select></label><label>{s.date}<input type="date" value={date} onChange={event=>setDate(event.target.value)}/></label><button type="button" onClick={()=>{setSearch('');setStatus('all');setDate('');}}>{s.clear}</button></div>
   <section aria-label={s.queue}><h3>{s.queue} <span>{queue.length}</span></h3>{queue.length?queue.map(card):<p>{search||date||status!=='all'?s.emptyFilter:s.emptyQueue}</p>}{pendingMore&&<button type="button" disabled={loading} onClick={()=>setPendingPage(value=>value+1)}>{s.more}</button>}</section>
   <section aria-label={s.today}><h3>{s.today} <span>{day.length}</span></h3>{day.length?day.map(card):<p>{search||date||status!=='all'?s.emptyFilter:s.emptyToday}</p>}</section>
   <section aria-label={s.upcoming}><h3>{s.upcoming}</h3>{upcoming.length?upcoming.map(card):<p>{search||date||status!=='all'?s.emptyFilter:s.emptyUpcoming}</p>}</section>
   <section aria-label={s.past}><h3>{s.past}</h3>{past.length?past.map(card):<p>{search||date||status!=='all'?s.emptyFilter:s.emptyPast}</p>}</section>
   {historyMore&&<><p className="rst-res-muted">{s.recent}</p><button type="button" disabled={loading} onClick={()=>setHistoryPage(value=>value+1)}>{s.more}</button></>}
  </>:<section aria-label={s.planning}><h3>{s.planning}</h3><ShidaCalendar locale={locale} timeZone={zone} month={month} selected={selected} events={calendar.map(row=>restaurantEvent(row,t[row.state],t.size))} onMonthChange={value=>{setMonth(value);setSelected(`${value}-01`);setCalendarPage(1);setCalendar([]);setDetail(null);}} onSelect={setSelected} onOpen={event=>void open(event.reference)} hasMore={calendarMore} onMore={()=>setCalendarPage(value=>value+1)}/>{detail&&<div className="rst-res-detail">{card(detail)}</div>}</section>}
  {choice&&<div className="rst-res-confirm" role="dialog" aria-modal="true" aria-label={s.confirm} onKeyDown={event=>{if(event.key==='Escape'&&!busy)setChoice(null);if(event.key==='Tab'&&event.shiftKey&&document.activeElement===confirmRef.current){event.preventDefault();actionRef.current?.focus();}else if(event.key==='Tab'&&!event.shiftKey&&document.activeElement===actionRef.current){event.preventDefault();confirmRef.current?.focus();}}}><h3>{s.confirm}</h3><p>{choice.action==='accept'?s.confirmAccept:choice.action==='reject'?s.confirmDecline:`${label(choice.action)}?`}</p><p>{stamp(choice.row)} · {choice.row.timezone_name} · {choice.row.party_size} {t.size}</p><p>{s.noGuarantee}</p><div className="rst-res-actions"><button ref={confirmRef} type="button" disabled={busy} onClick={()=>setChoice(null)}>{s.back}</button><button ref={actionRef} type="button" disabled={busy} onClick={()=>void respond()}>{label(choice.action)}</button></div></div>}
 </section>;
}
