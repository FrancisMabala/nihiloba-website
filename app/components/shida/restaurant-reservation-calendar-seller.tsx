"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {request} from '../../lib/restaurant-seller-browser';
import {reservationCopy,type Reservation,type ReservationLocale} from '../../lib/restaurant-reservation-copy';
import {workflowText} from '../../lib/restaurant-workflow-copy';
import {monthBounds,restaurantEvent} from '../../lib/shida-calendar';
import {ShidaCalendar} from './shida-calendar';

type Setting={enabled:boolean;revision:number;available:boolean};
type Page={items:Reservation[];has_more:boolean;timezone_name:string};
export function RestaurantReservationCalendarSeller({path,binding,locale}:{path:string;binding:string;locale:ReservationLocale}){
  const t=reservationCopy[locale];
  const [setting,setSetting]=useState<Setting|null>(null),[items,setItems]=useState<Reservation[]>([]),[pending,setPending]=useState<Reservation[]>([]);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[detail,setDetail]=useState<Reservation|null>(null);
  const [zone,setZone]=useState('UTC'),[month,setMonth]=useState(()=>new Date().toISOString().slice(0,7));
  const [selected,setSelected]=useState(()=>new Date().toISOString().slice(0,10));
  const [page,setPage]=useState(1),[pendingPage,setPendingPage]=useState(1),[more,setMore]=useState(false),[morePending,setMorePending]=useState(false);
  const [now,setNow]=useState(0);
  const generation=useRef(0);
  const load=useCallback(async()=>{const ticket=++generation.current;try{
    const {from,to}=monthBounds(month);
    const [current,listing,queue]=await Promise.all([
      request(`${path}/reservations/setting`,{},binding) as Promise<Setting>,
      request(`${path}/reservations/calendar?date_from=${from}&date_to=${to}&page=${page}&page_size=100`,{},binding) as Promise<Page>,
      request(`${path}/reservations/pending?page=${pendingPage}&page_size=50`,{},binding) as Promise<Page>]);
    if(ticket!==generation.current)return;
    setSetting(current);setItems(previous=>page===1?listing.items:[...new Map([...previous,...listing.items].map(row=>[row.reservation_ref,row])).values()]);setPending(queue.items);setMore(listing.has_more);setMorePending(queue.has_more);
    setZone(listing.timezone_name);setError('');
  }catch{if(ticket===generation.current){setItems([]);setPending([]);setDetail(null);setSetting(null);setError(t.retry);}}},[path,binding,t.retry,month,page,pendingPage]);
  useEffect(()=>{const currentGeneration=generation;queueMicrotask(()=>void load());const focus=()=>void load();window.addEventListener('focus',focus);const clock=window.setInterval(()=>setNow(Date.now()),60000);queueMicrotask(()=>setNow(Date.now()));return()=>{currentGeneration.current++;window.clearInterval(clock);window.removeEventListener('focus',focus);};},[load]);
  async function open(ref:string){setBusy(true);setError('');try{const row=await request(`${path}/reservations/${ref}`,{},binding) as Reservation;setDetail(row);}catch{setDetail(null);setError(t.retry);await load();}finally{setBusy(false);}}
  async function configure(){if(!setting||busy)return;setBusy(true);try{await request(`${path}/reservations/setting`,{method:'PUT',body:JSON.stringify({enabled:!setting.enabled,expected_revision:setting.revision,operation_key:crypto.randomUUID().replaceAll('-','')})},binding);await load();}catch{setError(t.retry);await load();}finally{setBusy(false);}}
  async function act(row:Reservation,action:'accept'|'reject'|'cancel'|'arrive'|'complete'){if(busy)return;setBusy(true);try{await request(`${path}/reservations/${row.reservation_ref}/${action}`,{method:'POST',body:JSON.stringify({expected_revision:row.revision,operation_key:crypto.randomUUID().replaceAll('-','')})},binding);setPage(1);await load();await open(row.reservation_ref);}catch{setError(t.retry);setPage(1);await load();await open(row.reservation_ref);}finally{setBusy(false);}}
  const events=items.map(row=>restaurantEvent(row,t[row.state],t.size));
  const time=(row:Reservation)=>new Intl.DateTimeFormat(locale,{timeZone:row.timezone_name,dateStyle:'medium',timeStyle:'short'}).format(new Date(row.starts_at));
  return <section className="rst-card" lang={locale}><h2>{t.requests}</h2><p>{workflowText(locale,'reservationsIntro')}</p>
    {setting&&<><p role="status">{workflowText(locale,setting.enabled?'requestsOn':'requestsOff')}</p>{!setting.available&&<p>{workflowText(locale,'reservationPrerequisites')}</p>}<button type="button" disabled={busy||!setting.enabled&&!setting.available} onClick={()=>void configure()}>{workflowText(locale,setting.enabled?'stopRequests':'receiveRequests')}</button></>}
    <button type="button" disabled={busy} onClick={()=>void load()}>{t.refresh}</button>{error&&<p role="alert">{error}</p>}
    <section aria-label={t.pending}><h3>{t.pending}</h3>{pending.length?<div className="rst-actions">{pending.map(row=><button type="button" key={row.reservation_ref} onClick={()=>void open(row.reservation_ref)}>{time(row)} · {row.party_size} {t.size} · {t.pending}</button>)}</div>:<p>{t.noRows}</p>}{morePending&&<button type="button" onClick={()=>setPendingPage(value=>value+1)}>{t.next}</button>}{pendingPage>1&&<button type="button" onClick={()=>setPendingPage(value=>value-1)}>{t.previous}</button>}</section>
    <ShidaCalendar locale={locale} timeZone={zone} month={month} selected={selected} events={events} onMonthChange={value=>{setMonth(value);setPage(1);setItems([]);setSelected(`${value}-01`);setDetail(null);}} onSelect={setSelected} onOpen={event=>void open(event.destination.reference)} hasMore={more} onMore={()=>setPage(value=>value+1)}/>
    {detail&&<article className="rst-card" aria-label={t.requests}><h3>{time(detail)} · {detail.timezone_name}</h3><p>{detail.party_size} {t.size} · {t[detail.state]}</p><p>{t.overlap}: {detail.overlapping_requests??0}</p><div className="rst-actions">
      {detail.state==='pending'&&now<Date.parse(detail.response_deadline)&&<><button type="button" disabled={busy} onClick={()=>void act(detail,'accept')}>{workflowText(locale,'acceptRequest')}</button><button type="button" disabled={busy} onClick={()=>void act(detail,'reject')}>{t.reject}</button></>}
      {['pending','accepted'].includes(detail.state)&&<button type="button" disabled={busy} onClick={()=>void act(detail,'cancel')}>{t.cancel}</button>}
      {detail.state==='accepted'&&now>=Date.parse(detail.starts_at)-1800000&&<button type="button" disabled={busy} onClick={()=>void act(detail,'arrive')}>{t.arrive}</button>}
      {detail.state==='arrived'&&now>=Date.parse(detail.starts_at)-1800000&&<button type="button" disabled={busy} onClick={()=>void act(detail,'complete')}>{t.complete}</button>}
    </div></article>}
  </section>;
}
