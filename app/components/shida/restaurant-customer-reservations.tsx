"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DashboardApiError, request } from "../../lib/restaurant-seller-browser";
import { reservationCopy, type Reservation, type ReservationLocale } from "../../lib/restaurant-reservation-copy";
import { restorePersonalSession, PERSONAL_SESSION_EVENT, type PersonalSession } from "../../lib/personal-session-browser";
import { PersonalWhatsAppLogin } from "./personal-whatsapp-login";
import {ShidaCalendar} from './shida-calendar';
import {localCandidates} from './restaurant-local-time';
import {reservationDateCopy} from '../../lib/restaurant-reservation-calendar-copy';
import {localDate} from '../../lib/shida-calendar';
import "./restaurant-checkout.css";

export function RestaurantCustomerReservations({locale,establishmentRef,establishmentName,timezoneName,available}:{locale:ReservationLocale;establishmentRef?:string;establishmentName?:string;timezoneName?:string;available?:boolean}) {
  const t=reservationCopy[locale];
  const d=reservationDateCopy[locale];
  const [session,setSession]=useState<PersonalSession|null>(null),[checked,setChecked]=useState(false),[items,setItems]=useState<Reservation[]>([]);
  const [date,setDate]=useState(""),[time,setTime]=useState(""),[occurrence,setOccurrence]=useState(""),[month,setMonth]=useState(()=>new Date().toISOString().slice(0,7)),[size,setSize]=useState(2),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const [page,setPage]=useState(1);
  const binding=useRef<string|null>(null),key=useRef('');
  const loadSession=useCallback(async()=>{try{const value=await restorePersonalSession();if(binding.current!==value.binding)setItems([]);binding.current=value.binding;setSession(value);}catch{binding.current=null;setItems([]);setSession(null);}finally{setChecked(true);}},[]);
  useEffect(()=>{queueMicrotask(()=>void loadSession());const update=()=>void loadSession();window.addEventListener(PERSONAL_SESSION_EVENT,update);window.addEventListener('focus',update);return()=>{window.removeEventListener(PERSONAL_SESSION_EVENT,update);window.removeEventListener('focus',update);};},[loadSession]);
  const load=useCallback(async()=>{if(!session)return;try{const result=await request(`personal/restaurant-reservations?page=${page}&page_size=20`,{},session.binding) as {items:Reservation[]};if(binding.current===session.binding)setItems(result.items);}catch{if(binding.current===session.binding)setMessage(t.retry);}},[session,t.retry,page]);
  useEffect(()=>{queueMicrotask(()=>void load());},[load]);
  const localTime=(item:Reservation)=>new Intl.DateTimeFormat(locale,{timeZone:item.timezone_name,dateStyle:'medium',timeStyle:'short'}).format(new Date(item.starts_at));
  const candidates=date&&time&&timezoneName?localCandidates(`${date}T${time}`,timezoneName):[];
  const chosen=candidates.length===1?candidates[0]:candidates.includes(occurrence)?occurrence:'';
  const today=timezoneName?localDate(new Date().toISOString(),timezoneName):new Date().toISOString().slice(0,10);
  async function submit(event:FormEvent){event.preventDefault();if(!session||!establishmentRef||!available||busy||!chosen)return;setBusy(true);setMessage("");try{
    key.current ||= crypto.randomUUID().replaceAll('-','');
    await request(`personal/restaurant-reservations/establishments/${establishmentRef}`,{method:'POST',body:JSON.stringify({starts_at:chosen,party_size:size,operation_key:key.current})},session.binding);
    key.current=crypto.randomUUID().replaceAll('-','');setDate("");setTime("");setOccurrence("");setMessage(t.saved);await load();
  }catch(error){setMessage(error instanceof DashboardApiError&&error.status===422?t.closed:t.retry);await load();}finally{setBusy(false);}}
  async function cancel(item:Reservation){if(!session||busy)return;setBusy(true);setMessage("");try{
    await request(`personal/restaurant-reservations/${item.reservation_ref}/cancel`,{method:'POST',body:JSON.stringify({expected_revision:item.revision,operation_key:crypto.randomUUID().replaceAll('-','')})},session.binding);
    await load();
  }catch{setMessage(t.retry);await load();}finally{setBusy(false);}}
  return <main className="restaurant-public rst-checkout" lang={locale}><div className="container"><h1>{establishmentRef?`${establishmentName||t.reserve} · ${t.reserve}`:t.mine}</h1>
    {!checked?<p>{t.retry}</p>:!session?<><p>{t.login}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>void loadSession()}/></>:<>
      {establishmentRef&&<section><h2>{t.reserve}</h2>{available?<form onSubmit={event=>void submit(event)}><p>{d.guidance}</p><p>{t.noOrder}</p><p>{t.noCapacity}</p><ShidaCalendar locale={locale} timeZone={timezoneName||'UTC'} month={month} selected={date||today} events={[]} onMonthChange={setMonth} onSelect={value=>{setDate(value);setOccurrence('');key.current=crypto.randomUUID().replaceAll('-','');}} dateOnly/><label>{t.date} ({timezoneName})<input type="date" required value={date} onChange={event=>{setDate(event.target.value);setMonth(event.target.value.slice(0,7));setOccurrence('');key.current=crypto.randomUUID().replaceAll('-','');}}/></label><label>{d.time}<input type="time" required value={time} onChange={event=>{setTime(event.target.value);setOccurrence('');key.current=crypto.randomUUID().replaceAll('-','');}}/></label>{date&&time&&candidates.length===0&&<p role="alert">{d.invalid}</p>}{candidates.length>1&&<label>{d.ambiguous}<select required value={occurrence} onChange={event=>setOccurrence(event.target.value)}><option value=""></option>{candidates.map((candidate,index)=><option key={candidate} value={candidate}>{index===0?d.first:d.second}</option>)}</select></label>}<label>{t.size}<input type="number" min="1" max="30" required value={size} onChange={event=>{setSize(Number(event.target.value));key.current=crypto.randomUUID().replaceAll('-','');}}/></label><button type="submit" disabled={busy||!chosen}>{t.send}</button></form>:<p>{t.closed}</p>}</section>}
      <section><h2>{t.mine}</h2><button type="button" disabled={busy} onClick={()=>void load()}>{t.refresh}</button>{items.length?items.map(item=><article key={item.reservation_ref} className="rst-card"><h3>{item.establishment_name}</h3><p>{localTime(item)} · {item.timezone_name} · {item.party_size} {t.size}</p><p>{t[item.state]}</p>{['pending','accepted'].includes(item.state)&&<button type="button" disabled={busy} onClick={()=>void cancel(item)}>{t.cancel}</button>}</article>):<p>{t.noRows}</p>}<div className="rst-actions"><button type="button" disabled={busy||page<=1} onClick={()=>setPage(page-1)}>{t.previous}</button><span>{page}</span><button type="button" disabled={busy||items.length<20} onClick={()=>setPage(page+1)}>{t.next}</button></div></section>
    </>}{message&&<p role="status">{message}</p>}
  </div></main>;
}
