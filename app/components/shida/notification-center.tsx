"use client";

import {medaParticipationCopy} from '../../lib/meda-participation-copy';
import {useCallback, useEffect, useId, useRef, useState} from 'react';
import './notification-center.css';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';

import {notificationCopy as copy,notificationLayoutCopy,notificationTimestamp,modules,moduleNames} from '../../lib/notification-center-copy';
import {NotificationActionMenu} from './notification-action-menu';
import {publishPersonalNotificationCount,usePersonalNotificationCount,readNotificationCount} from '../../lib/personal-notification-count';
import {helpText} from '../../lib/help-questions-copy';
import {messagesText} from '../../lib/messages-design-copy';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import Image from 'next/image';
type Notice = {reference:string; marketplace:string; title:string; description:string; created_at:string; read:boolean; action_required:boolean; expired:boolean; acknowledged:boolean; action_url:string|null;event_type?:string;activity_reference?:string|null;can_handoff?:boolean};
type Locale=keyof typeof copy;
const icons:Record<string,SpaceIconName>={meda:'meda',wenze:'shop',services:'tool',employment:'management',restaurants:'restaurant',security:'shield',apartments:'home',hotels:'home',school:'business'};
function validPage(value:unknown):value is {items:Notice[];next_cursor:string|null}{
 if(!value||typeof value!=='object')return false;const v=value as {items:Notice[];next_cursor:string|null};
 return Array.isArray(v.items)&&(v.next_cursor===null||typeof v.next_cursor==='string'&&/^NTF_[A-Za-z0-9_-]{1,36}$/.test(v.next_cursor))&&v.items.every(r=>r&&typeof r.reference==='string'&&/^NTF_[A-Za-z0-9_-]{1,36}$/.test(r.reference)&&typeof r.marketplace==='string'&&typeof r.title==='string'&&typeof r.description==='string'&&typeof r.created_at==='string'&&Number.isFinite(Date.parse(r.created_at))&&['read','action_required','expired','acknowledged'].every(k=>typeof r[k as keyof Notice]==='boolean')&&(r.action_url===null||typeof r.action_url==='string'));
}
function noticeAction(item:Notice,locale:Locale){
 if(item.event_type==='question_answered')return helpText(locale,'readAnswer');
 const path=safeActivityUrl(item.action_url)?new URL(item.action_url!).pathname:'';
 if(item.event_type==='private_report_ready'&&item.action_url?.includes('view=reports'))return messagesText(locale,'report');
 if(item.marketplace==='security')return messagesText(locale,'account');
 return /restaurant-orders|wenze\/orders/.test(path)?messagesText(locale,'order'):/my-applications|mes-candidatures/.test(path)?messagesText(locale,'application'):/service-requests/.test(path)?messagesText(locale,'request'):copy[locale][7];
}
export function safeActivityUrl(value:string|null) {
 if(!value)return undefined;
 try {const u=new URL(value); return u.protocol==='https:' && ['nihiloba.com','business.nihiloba.com'].includes(u.hostname) && !u.username && !u.password ? u.href : undefined;} catch {return undefined;}
}

// Mount with a key containing the authenticated session and active context.
export default function NotificationCenter({binding,apiBase,locale,inline=false,destination}:{binding:string;apiBase:string;locale:Locale;inline?:boolean;destination?:string}) {
 const t=copy[locale], [open,setOpen]=useState(inline),[localCount,setLocalCount]=useState<number|null>(null),[items,setItems]=useState<Notice[]>([]),[cursor,setCursor]=useState<string|null>(null),[mode,setMode]=useState('all'),[market,setMarket]=useState(''),[error,setError]=useState(false),[busy,setBusy]=useState(true),[ticket,setTicket]=useState<{reference:string;url:string}|null>(null),[badge,setBadge]=useState(true);
 const personal=apiBase==='/api/shida/personal/notifications';
 const layout=notificationLayoutCopy[locale],[ready,setReady]=useState(false),[filtersOpen,setFiltersOpen]=useState(false);
 const filterId=useId();
 const pages=useRef(1),restorePages=useRef(1),restoreScroll=useRef<number|null>(null),mutation=useRef(false);
 const sharedCount=usePersonalNotificationCount(binding),count=personal?sharedCount:localCount;
 const panel=useRef<HTMLDivElement>(null),bell=useRef<HTMLButtonElement>(null),generation=useRef(0),seen=useRef(new Set<string>());
 useEffect(()=>{
  const sync=()=>{const url=new URL(window.location.href),next=url.searchParams.get('notice_mode')??'all',marketplace=url.searchParams.get('notice_market')??'';
   setMode(['all','unread','action_required'].includes(next)?next:'all');setMarket(modules.includes(marketplace)?marketplace:'');
   const saved=window.history.state?.shidaNotificationReturn;
   if(inline&&saved?.path===window.location.pathname+window.location.search&&saved.apiBase===apiBase){restorePages.current=Math.min(100,Math.max(1,Number(saved.pages)||1));restoreScroll.current=Number(saved.scrollY)||0;}
   setReady(true);
  };
  const timer=setTimeout(sync,0);window.addEventListener('popstate',sync);return()=>{clearTimeout(timer);window.removeEventListener('popstate',sync);};
 },[apiBase,inline]);
 // Next merges its own history state. Copying its internal marker into an external
 // update bypasses router synchronization and can restore the old unfiltered URL.
 function remember(){if(inline)window.history.replaceState({shidaNotificationReturn:{path:window.location.pathname+window.location.search,apiBase,pages:pages.current,scrollY:window.scrollY}},'');}
 function filter(nextMode:string,nextMarket:string){
  if(inline){const url=new URL(window.location.href);for(const [key,value] of [['notice_mode',nextMode==='all'?'':nextMode],['notice_market',nextMarket]]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}window.history.replaceState({shidaNotificationReturn:null},'',url);}
  restorePages.current=1;restoreScroll.current=null;setMode(nextMode);setMarket(nextMarket);
 }
 const call=useCallback(async(path:string,body?:object,method='POST')=>{
  const [pathname,query]=path.split('?');
  const res=await fetch(apiBase+pathname.replace(/\/$/,'')+'/'+(query?'?'+query:''),{method:body?method:'GET',credentials:'include',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{'X-Shida-Session':binding,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!res.ok) throw new Error('unavailable'); return res.json();
 },[apiBase,binding]);
 const refresh=useCallback(async(fresh=false)=>{
  const g=generation.current;
  const value=await readNotificationCount(apiBase,binding,()=>call('/count'),fresh);
  if(g!==generation.current||value===undefined)return;
  if(personal)publishPersonalNotificationCount(binding,value);else setLocalCount(value);
 },[apiBase,call,binding,personal]);
 const load=useCallback(async(before?:string)=>{
  const g=++generation.current;setBusy(true);setError(false);setTicket(null);if(!before)setItems([]);
  try{let next=before;const target=before?1:restorePages.current;restorePages.current=1;if(!before)pages.current=0;
   const cursors=new Set<string>();for(let page=0;page<target;page++){
    const data=await call('?'+new URLSearchParams({language:locale,mode,...(market?{marketplace:market}:{}),...(next?{before:next}:{})}));if(!validPage(data))throw Error();if(g!==generation.current)return;
    setItems(old=>page===0&&!before?data.items:[...old,...data.items.filter(row=>!old.some(existing=>existing.reference===row.reference))]);setCursor(data.next_cursor);pages.current++;next=data.next_cursor??undefined;
    if(!next)break;if(cursors.has(next))throw Error();cursors.add(next);
   }void refresh();}
  catch{if(g===generation.current)setError(true);}finally{if(g===generation.current)setBusy(false);}
 },[call,locale,market,mode,refresh]);
 useEffect(()=>{const epoch=generation;let live=true;const tick=()=>{if(live&&document.visibilityState==='visible')void refresh();};tick();const timer=setInterval(tick,30000);window.addEventListener('shida-notifications-changed',tick);window.addEventListener('focus',tick);window.addEventListener('online',tick);document.addEventListener('visibilitychange',tick);return()=>{live=false;epoch.current++;clearInterval(timer);window.removeEventListener('shida-notifications-changed',tick);window.removeEventListener('focus',tick);window.removeEventListener('online',tick);document.removeEventListener('visibilitychange',tick);};},[refresh]);
 useEffect(()=>{const epoch=generation;const timer=open&&ready?setTimeout(()=>void load(),0):undefined;return()=>{clearTimeout(timer);epoch.current++;};},[open,ready,load]);
 useEffect(()=>{if(busy||restoreScroll.current===null)return;const y=restoreScroll.current;restoreScroll.current=null;const frame=requestAnimationFrame(()=>window.scrollTo(0,y));return()=>cancelAnimationFrame(frame);},[busy]);
 useEffect(()=>{if(!open||inline)return;const first=panel.current?.querySelector<HTMLButtonElement>('button');first?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);bell.current?.focus();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[open,inline]);
 useEffect(()=>{if(!open||!market)return;let live=true;void call('/preferences').then(data=>{if(live)setBadge(data.preferences.find((p:{marketplace:string})=>p.marketplace===market)?.optional_badge??true);}).catch(()=>{if(live)setError(true);});return()=>{live=false;};},[call,open,market]);
 useEffect(()=>{
  if(!open||!panel.current||!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{const refs=entries.filter(e=>e.isIntersecting&&document.visibilityState==='visible').map(e=>(e.target as HTMLElement).dataset.reference!).filter(r=>!seen.current.has(r));if(!refs.length)return;refs.forEach(r=>seen.current.add(r));void call('/actions',{references:refs,action:'view'}).catch(()=>refs.forEach(r=>seen.current.delete(r)));},{root:panel.current,threshold:0.6});
  panel.current.querySelectorAll('[data-reference]').forEach(el=>observer.observe(el));return()=>observer.disconnect();
 },[call,items,open]);
 function applyAction(references:string[],action:string){setItems(old=>old.map(row=>references.includes(row.reference)?{...row,...(action==='read'?{read:true}:{acknowledged:true})}:row).filter(row=>mode!=='unread'||!row.read));}
 async function act(references:string[],action:string){if(mutation.current)return false;mutation.current=true;const g=generation.current,focused=document.activeElement,focusedRow=focused?.closest('article');setBusy(true);setError(false);
  try{await call('/actions',{references,action});if(g!==generation.current)return false;applyAction(references,action);await refresh(true);window.dispatchEvent(new Event('shida-notifications-changed'));
   requestAnimationFrame(()=>{if(focused instanceof HTMLElement&&!focused.isConnected)(focusedRow?.isConnected?focusedRow.querySelector<HTMLElement>('a,button'):panel.current?.querySelector<HTMLButtonElement>('.notification-tabs button[aria-pressed=true]'))?.focus({preventScroll:true});});return true;
  }catch{if(g===generation.current)setError(true);return false;}finally{mutation.current=false;if(g===generation.current)setBusy(false);}
 }
 async function handoff(reference:string){
  const g=generation.current;
  const popup=window.open('about:blank','_blank');
  if(popup)popup.opener=null;
  setBusy(true);setTicket(null);
  try{
   const data=await call('/'+reference+'/handoff',{}),url=new URL(data.url);
   if(g!==generation.current){popup?.close();return;}
   if(url.origin!=='https://wa.me'||url.username||url.password)throw Error();
   if(popup&&!popup.closed)popup.location.replace(url.href);
   else setTicket({reference,url:url.href});
  }catch{popup?.close();if(g===generation.current)setError(true);}
  finally{if(g===generation.current)setBusy(false);}
 }
 async function markAll(){
  const g=generation.current;setBusy(true);setError(false);let before:string|undefined;const cursors=new Set<string>();
  try{for(let page=0;page<100;page++){
   const data=await call('?'+new URLSearchParams({language:locale,mode:'unread',limit:'50',...(before?{before}:{})}));
   if(g!==generation.current)return;if(!validPage(data))throw Error();
   if(data.items.length){const references=data.items.map(row=>row.reference);await call('/actions',{references,action:'read'});if(g===generation.current)applyAction(references,'read');}
   if(g!==generation.current)return;
   if(!data.next_cursor){window.dispatchEvent(new Event('shida-notifications-changed'));await refresh(true);return;}
   if(cursors.has(data.next_cursor))throw Error();cursors.add(data.next_cursor);before=data.next_cursor;
  }throw Error();}catch{if(g===generation.current){setError(true);await refresh(true);}}finally{if(g===generation.current)setBusy(false);}
 }
 if(destination)return <a className="notification-bell notification-header-link" href={destination} aria-label={t[0]+(count===null?'':` (${count})`)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>{count!==null&&count>0&&<strong aria-live="polite">{count>99?'99+':count}</strong>}</a>;
 return <div className={inline?"notification-center notification-inline":"notification-center"}>
  {!inline&&<button ref={bell} type="button" aria-expanded={open} aria-label={t[0]+(count===null?'':` (${count})`)} onClick={()=>setOpen(v=>!v)} className="notification-bell"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span>{t[0]}</span>{count!==null&&count>0&&<strong>{count>99?'99+':count}</strong>}</button>}
  {open&&<div ref={panel} className="notification-panel" role="region" aria-label={t[0]}>
   <header className="notification-toolbar">{!inline&&<h2>{t[0]}</h2>}{inline&&<button className="notice-bulk" disabled={busy||!(items.some(i=>!i.read)||(count??0)>0)} onClick={()=>void markAll()}>{messagesText(locale,'allRead')}</button>}{!inline&&<button onClick={()=>{setOpen(false);bell.current?.focus();}}>{t[1]}</button>}</header>
   <div className="notification-controls"><div className="notification-tabs" role="group" aria-label={t[0]}>{['all','unread'].map(value=><button key={value} type="button" disabled={busy} aria-pressed={mode===value} onClick={()=>filter(value,market)}>{value==='all'?layout.all:`${t[3]}${count===null?'':` (${count})`}`}</button>)}</div>
    <button className="notification-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls={filterId} disabled={busy} onClick={()=>setFiltersOpen(v=>!v)}>{layout.filters}{(market||mode==='action_required')&&' · '+[Boolean(market),mode==='action_required'].filter(Boolean).length}</button>
   </div>
   <div id={filterId} className="notification-filters" data-open={filtersOpen}><select disabled={busy} aria-label={t[2]} value={mode} onChange={e=>filter(e.target.value,market)}>{['all','unread','action_required'].map((v,i)=><option key={v} value={v}>{t[i+2]}</option>)}</select><select disabled={busy} aria-label={t[5]} value={market} onChange={e=>filter(mode,e.target.value)}><option value="">{t[5]}</option>{modules.map((m,i)=><option key={m} value={m}>{moduleNames[locale][i]}</option>)}</select>{(market||mode!=='all')&&<button type="button" disabled={busy} onClick={()=>filter('all','')}>{layout.clear}</button>}</div>
   {!inline&&market&&market!=='security'&&market!=='support'&&<label><input type="checkbox" checked={badge} disabled={busy} onChange={async e=>{const value=e.target.checked,g=generation.current;setBusy(true);try{await call('/preferences',{marketplace:market,optional_badge:value},'PUT');if(g===generation.current){setBadge(value);await refresh(true);}}catch{if(g===generation.current)setError(true);}finally{if(g===generation.current)setBusy(false);}}}/>{t[18]}<small>{t[19]}</small></label>}
   {error&&<p role="alert">{t[13]} <button disabled={busy} onClick={()=>{restorePages.current=Math.max(1,pages.current);restoreScroll.current=window.scrollY;void load();}}>{t[20]}</button></p>}
   {busy&&<p role="status">{t[15]}</p>}
   {!busy&&!error&&!items.length&&(cursor?<p>{t[6]}</p>:mode==='all'&&!market?<section className="messages-empty"><Image unoptimized src="/images/shida/notifications-empty.svg" alt="" width={420} height={220}/><h2>{mySpaceCopy[locale].emptyNotifications}</h2><p>{messagesText(locale,'emptyBody')}</p><a href={`${locale==='en'?'':'/'+locale}/shida/`}>{messagesText(locale,'explore')} <span aria-hidden="true">→</span></a></section>:<p>{t[6]}</p>)}
   {!inline&&items.some(i=>!i.read)&&<button disabled={busy} onClick={()=>void act(items.filter(i=>!i.read).slice(0,50).map(i=>i.reference),'read')}>{t[14]}</button>}
   {items.map(item=>{
    const message=item.event_type==='message',whatsapp=item.can_handoff===true&&!item.expired;
    const link=safeActivityUrl(item.action_url),marketName=moduleNames[locale][modules.indexOf(item.marketplace)]??'SHIDA';
    const title=item.marketplace==='meda'?medaParticipationCopy[locale].notice:message?messagesText(locale,item.marketplace==='services'?'reservationMessage':item.marketplace==='employment'?'applicationMessage':item.read?'orderMessage':'newOrderMessage'):item.event_type==='private_report_ready'?messagesText(locale,'reportReady'):item.title;
    const action=message?messagesText(locale,item.read?'openWa':'readWa'):t[10];
    const firstUnread=message&&!item.read&&item.reference===items.find(row=>row.event_type==='message'&&row.can_handoff&&!row.expired&&!row.read)?.reference;
    const waPrimary=whatsapp&&(message||!link),stamp=notificationTimestamp(item.created_at,locale);
    const content=<><span className="notice-market-icon"><SpaceIcon name={icons[item.marketplace]??'bell'}/></span><div className="notice-content"><h3><span className="sr-only">{item.read?layout.read:layout.unread}. </span>{!item.read&&<span className="notice-unread-dot" aria-hidden="true"/>}{title}</h3><p>{item.description}</p><div className="notice-context">{marketName}{item.activity_reference&&<> · {item.activity_reference}</>}</div><time className="notice-meta" dateTime={item.created_at} title={stamp.full} aria-label={stamp.full}>{stamp.short}</time>{item.expired&&<small>{t[16]}</small>}</div></>;
    const menuActions=[...(!item.read?[t[8]]:[]),...(!inline&&item.action_required&&!item.expired&&!item.acknowledged?[t[9]]:[])];
    return <article key={item.reference} data-reference={item.reference} className={item.read?'notification-card':'notification-card notification-unread'}>
     {link&&!waPrimary?<a className="notice-main" href={link} aria-label={`${item.read?layout.read:layout.unread}. ${noticeAction(item,locale)}: ${title}`} onClick={async e=>{
      remember();if(item.read)return;if(busy){e.preventDefault();return;}
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey){void act([item.reference],'read');return;}
      e.preventDefault();if(await act([item.reference],'read')){remember();window.location.assign(link);}
     }}>{content}<span className="notice-arrow" aria-hidden="true">›</span></a>:<div className="notice-main">{content}</div>}
     {menuActions.length>0&&<NotificationActionMenu label={`${layout.actions}: ${title}`} disabled={busy} actions={menuActions} onAction={label=>void act([item.reference],label===t[8]?'read':'acknowledge')}/>}
     {waPrimary&&<div className="notification-actions">{ticket?.reference===item.reference?<a target="_blank" rel="noopener noreferrer" href={ticket.url} onClick={()=>{remember();setTicket(null);}}>{action}</a>:<button disabled={busy} onClick={()=>{remember();void handoff(item.reference);}}>{action}</button>}{firstUnread&&<small>{messagesText(locale,'sendHint')}</small>}</div>}
    </article>;
   })}
   {cursor&&<button disabled={busy} onClick={()=>void load(cursor)}>{t[12]}</button>}
  </div>}
 </div>;
}
