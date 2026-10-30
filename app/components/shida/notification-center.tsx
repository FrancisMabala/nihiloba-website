"use client";

import {useCallback, useEffect, useRef, useState} from 'react';
import './notification-center.css';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';

import {notificationCopy as copy,modules,moduleNames} from '../../lib/notification-center-copy';
import {messagesText} from '../../lib/messages-design-copy';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import Image from 'next/image';
type Notice = {reference:string; marketplace:string; title:string; description:string; created_at:string; read:boolean; action_required:boolean; expired:boolean; acknowledged:boolean; action_url:string|null;can_handoff?:boolean};
type Locale=keyof typeof copy;
const icons:Record<string,SpaceIconName>={wenze:'shop',services:'tool',employment:'management',restaurants:'restaurant',security:'shield',apartments:'home',hotels:'home',school:'business'};
function validPage(value:unknown):value is {items:Notice[];next_cursor:string|null}{
 if(!value||typeof value!=='object')return false;const v=value as {items:Notice[];next_cursor:string|null};
 return Array.isArray(v.items)&&(v.next_cursor===null||typeof v.next_cursor==='string'&&/^NTF_[A-Za-z0-9_-]{1,36}$/.test(v.next_cursor))&&v.items.every(r=>r&&typeof r.reference==='string'&&/^NTF_[A-Za-z0-9_-]{1,36}$/.test(r.reference)&&typeof r.marketplace==='string'&&typeof r.title==='string'&&typeof r.description==='string'&&typeof r.created_at==='string'&&Number.isFinite(Date.parse(r.created_at))&&['read','action_required','expired','acknowledged'].every(k=>typeof r[k as keyof Notice]==='boolean')&&(r.action_url===null||typeof r.action_url==='string'));
}
function noticeAction(item:Notice,locale:Locale){
 const path=safeActivityUrl(item.action_url)?new URL(item.action_url!).pathname:'';
 return /restaurant-orders|wenze\/orders/.test(path)?messagesText(locale,'order'):/my-applications|mes-candidatures/.test(path)?messagesText(locale,'application'):/service-requests/.test(path)?messagesText(locale,'request'):copy[locale][7];
}
export function safeActivityUrl(value:string|null) {
 if(!value)return undefined;
 try {const u=new URL(value); return u.protocol==='https:' && ['nihiloba.com','business.nihiloba.com'].includes(u.hostname) && !u.username && !u.password ? u.href : undefined;} catch {return undefined;}
}

// Mount with a key containing the authenticated session and active context.
export default function NotificationCenter({binding,apiBase,locale,inline=false,destination}:{binding:string;apiBase:string;locale:Locale;inline?:boolean;destination?:string}) {
 const t=copy[locale], [open,setOpen]=useState(inline),[count,setCount]=useState<number|null>(null),[items,setItems]=useState<Notice[]>([]),[cursor,setCursor]=useState<string|null>(null),[mode,setMode]=useState('all'),[market,setMarket]=useState(''),[error,setError]=useState(false),[busy,setBusy]=useState(true),[ticket,setTicket]=useState<string|null>(null),[badge,setBadge]=useState(true);
 const panel=useRef<HTMLDivElement>(null),bell=useRef<HTMLButtonElement>(null),generation=useRef(0),seen=useRef(new Set<string>());
 const call=useCallback(async(path:string,body?:object,method='POST')=>{
  const [pathname,query]=path.split('?');
  const res=await fetch(apiBase+pathname.replace(/\/$/,'')+'/'+(query?'?'+query:''),{method:body?method:'GET',credentials:'include',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{'X-Shida-Session':binding,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!res.ok) throw new Error('unavailable'); return res.json();
 },[apiBase,binding]);
 const refresh=useCallback(async()=>{const g=generation.current;try{const data=await call('/count');if(g===generation.current)setCount(Number.isSafeInteger(data.unread_count)&&data.unread_count>=0?data.unread_count:null);}catch{if(g===generation.current)setCount(null);}},[call]);
 const load=useCallback(async(before?:string)=>{
  const g=++generation.current;setBusy(true);setError(false);setTicket(null);if(!before)setItems([]);
  try{const data=await call('?'+new URLSearchParams({language:locale,mode,...(market?{marketplace:market}:{}),...(before?{before}:{})}));if(!validPage(data))throw Error();if(g!==generation.current)return;setItems(old=>before?[...old,...data.items.filter(row=>!old.some(existing=>existing.reference===row.reference))]:data.items);setCursor(data.next_cursor);await refresh();}
  catch{if(g===generation.current)setError(true);}finally{if(g===generation.current)setBusy(false);}
 },[call,locale,market,mode,refresh]);
 useEffect(()=>{const epoch=generation;let live=true;const tick=()=>{if(live&&document.visibilityState==='visible')void refresh();};tick();const timer=setInterval(tick,30000);window.addEventListener('shida-notifications-changed',tick);window.addEventListener('focus',tick);window.addEventListener('online',tick);document.addEventListener('visibilitychange',tick);return()=>{live=false;epoch.current++;clearInterval(timer);window.removeEventListener('shida-notifications-changed',tick);window.removeEventListener('focus',tick);window.removeEventListener('online',tick);document.removeEventListener('visibilitychange',tick);};},[refresh]);
 useEffect(()=>{const epoch=generation;const timer=open?setTimeout(()=>void load(),0):undefined;return()=>{clearTimeout(timer);epoch.current++;};},[open,load]);
 useEffect(()=>{if(!open||inline)return;const first=panel.current?.querySelector<HTMLButtonElement>('button');first?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);bell.current?.focus();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[open,inline]);
 useEffect(()=>{if(!open||!market)return;let live=true;void call('/preferences').then(data=>{if(live)setBadge(data.preferences.find((p:{marketplace:string})=>p.marketplace===market)?.optional_badge??true);}).catch(()=>{if(live)setError(true);});return()=>{live=false;};},[call,open,market]);
 useEffect(()=>{
  if(!open||!panel.current||!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{const refs=entries.filter(e=>e.isIntersecting&&document.visibilityState==='visible').map(e=>(e.target as HTMLElement).dataset.reference!).filter(r=>!seen.current.has(r));if(!refs.length)return;refs.forEach(r=>seen.current.add(r));void call('/actions',{references:refs,action:'view'}).catch(()=>refs.forEach(r=>seen.current.delete(r)));},{root:panel.current,threshold:0.6});
  panel.current.querySelectorAll('[data-reference]').forEach(el=>observer.observe(el));return()=>observer.disconnect();
 },[call,items,open]);
 async function act(references:string[],action:string){const g=generation.current;setBusy(true);try{await call('/actions',{references,action});window.dispatchEvent(new Event('shida-notifications-changed'));if(g===generation.current)await load();}catch{if(g===generation.current){setError(true);setBusy(false);}}}
 async function handoff(reference:string){const g=generation.current;setBusy(true);setTicket(null);try{const data=await call('/'+reference+'/handoff',{});const url=new URL(data.url);if(g!==generation.current)return;if(url.origin!=='https://wa.me'||url.username||url.password)throw new Error();setTicket(url.href);}catch{if(g===generation.current)setError(true);}finally{if(g===generation.current)setBusy(false);}}

 async function markAll(){
  const g=generation.current;setBusy(true);setError(false);let before:string|undefined;const cursors=new Set<string>();
  try{for(let page=0;page<100;page++){
   const data=await call('?'+new URLSearchParams({language:locale,mode:'unread',limit:'50',...(before?{before}:{})}));
   if(g!==generation.current)return;if(!validPage(data))throw Error();
   if(data.items.length)await call('/actions',{references:data.items.map(row=>row.reference),action:'read'});
   if(g!==generation.current)return;
   if(!data.next_cursor){window.dispatchEvent(new Event('shida-notifications-changed'));await load();return;}
   if(cursors.has(data.next_cursor))throw Error();cursors.add(data.next_cursor);before=data.next_cursor;
  }throw Error();}catch{if(g===generation.current)setError(true);}finally{if(g===generation.current)setBusy(false);}
 }
 if(destination)return <a className="notification-bell notification-header-link" href={destination} aria-label={t[0]+(count===null?'':` (${count})`)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>{count!==null&&count>0&&<strong aria-live="polite">{count>99?'99+':count}</strong>}</a>;
 return <div className={inline?"notification-center notification-inline":"notification-center"}>
  {!inline&&<button ref={bell} type="button" aria-expanded={open} aria-label={t[0]+(count===null?'':` (${count})`)} onClick={()=>setOpen(v=>!v)} className="notification-bell"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span>{t[0]}</span>{count!==null&&count>0&&<strong>{count>99?'99+':count}</strong>}</button>}
  {open&&<div ref={panel} className="notification-panel" role="region" aria-label={t[0]}>
   <header className="notification-toolbar">{!inline&&<h2>{t[0]}</h2>}{inline&&(items.some(i=>!i.read)||(count??0)>0)&&<button disabled={busy} onClick={()=>void markAll()}>{messagesText(locale,'allRead')}</button>}{inline&&count!==null&&count>0&&<span className="notification-count" title={messagesText(locale,'badge')}>{count} · {t[3]}</span>}{!inline&&<button onClick={()=>{setOpen(false);bell.current?.focus();}}>{t[1]}</button>}</header>
   {(items.length>0||mode!=='all'||market!=='')&&<div className="notification-filters"><select disabled={busy} aria-label={t[2]} value={mode} onChange={e=>{setBusy(true);setCursor(null);setItems([]);setMode(e.target.value);}}>{['all','unread','action_required'].map((v,i)=><option key={v} value={v}>{t[i+2]}</option>)}</select><select disabled={busy} aria-label={t[5]} value={market} onChange={e=>{setBusy(true);setCursor(null);setItems([]);setMarket(e.target.value);}}><option value="">{t[5]}</option>{modules.map((m,i)=><option key={m} value={m}>{moduleNames[locale][i]}</option>)}</select></div>}
   {!inline&&market&&market!=='security'&&<label><input type="checkbox" checked={badge} disabled={busy} onChange={async e=>{const value=e.target.checked,g=generation.current;setBusy(true);try{await call('/preferences',{marketplace:market,optional_badge:value},'PUT');if(g===generation.current){setBadge(value);await refresh();}}catch{if(g===generation.current)setError(true);}finally{if(g===generation.current)setBusy(false);}}}/>{t[18]}<small>{t[19]}</small></label>}
   {error&&<p role="alert">{t[13]} <button disabled={busy} onClick={()=>void load()}>{t[20]}</button></p>}
   {busy&&<p role="status">{t[15]}</p>}
   {!busy&&!error&&!items.length&&(cursor?<p>{t[6]}</p>:mode==='all'&&!market?<section className="messages-empty"><Image unoptimized src="/images/shida/notifications-empty.svg" alt="" width={420} height={220}/><h2>{mySpaceCopy[locale].emptyNotifications}</h2><p>{messagesText(locale,'emptyBody')}</p><a href={`${locale==='en'?'':'/'+locale}/shida/`}>{messagesText(locale,'explore')} <span aria-hidden="true">→</span></a></section>:<p>{t[6]}</p>)}
   {!inline&&items.some(i=>!i.read)&&<button disabled={busy} onClick={()=>void act(items.filter(i=>!i.read).slice(0,50).map(i=>i.reference),'read')}>{t[14]}</button>}
   {items.map(item=><article key={item.reference} data-reference={item.reference} className={item.read?'notification-card':'notification-card notification-unread'}><span className="notice-market-icon"><SpaceIcon name={icons[item.marketplace]??'messages'}/></span><div className="notice-content"><small>{moduleNames[locale][modules.indexOf(item.marketplace)]??'SHIDA'}</small><h3>{item.title}</h3><p>{item.description}</p></div><div className="notice-meta"><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString(locale,{dateStyle:'medium',timeStyle:'short'})}</time><span className={`notice-status ${item.action_required&&!item.expired?'notice-attention':!item.read?'notice-new':''}`}>{item.expired?t[16]:item.action_required?t[4]:!item.read?messagesText(locale,'new'):messagesText(locale,'info')}</span></div><div className="notification-actions">{safeActivityUrl(item.action_url)&&<a className="notice-primary" href={safeActivityUrl(item.action_url)}>{noticeAction(item,locale)}</a>}{!item.expired&&item.can_handoff===true&&<button disabled={busy} onClick={()=>void handoff(item.reference)}><SpaceIcon name="whatsapp"/>{t[10]}</button>}{!item.read&&<button className="notice-read" disabled={busy} onClick={()=>void act([item.reference],'read')}>{t[8]}</button>}{!inline&&item.action_required&&!item.expired&&!item.acknowledged&&<button disabled={busy} onClick={()=>void act([item.reference],'acknowledge')}>{t[9]}</button>}</div></article>)}
   {ticket&&<p role="status">{t[11]} <a href={ticket} target="_blank" rel="noopener noreferrer">{t[10]}</a></p>}
   {cursor&&<button disabled={busy} onClick={()=>void load(cursor)}>{t[12]}</button>}
  </div>}
 </div>;
}
