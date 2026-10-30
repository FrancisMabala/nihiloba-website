"use client";

import {useCallback, useEffect, useRef, useState} from 'react';
import './notification-center.css';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';

const copy = {
 en: ['Notifications','Close','All activity','Unread','Action required','All marketplaces','No alerts in this view.','Open activity','Mark read','Acknowledge','Continue in WhatsApp','Send the prepared message in WhatsApp to continue.','Load more','Notifications are temporarily unavailable. Try again.','Mark this page read','Loading…','Expired','Acknowledged','Optional alerts in badge','Essential alerts remain enabled.','Retry'],
 fr: ['Notifications','Fermer','Toute l’activité','Non lues','Action requise','Tous les marchés','Aucune alerte dans cette vue.','Ouvrir l’activité','Marquer comme lue','Accuser réception','Continuer sur WhatsApp','Envoyez le message préparé dans WhatsApp pour continuer.','Voir la suite','Les notifications sont temporairement indisponibles. Réessayez.','Marquer cette page comme lue','Chargement…','Expirée','Réception confirmée','Alertes facultatives dans le compteur','Les alertes essentielles restent actives.','Réessayer'],
 ln: ['Mayebisi','Kanga','Makambo nyonso','Etángami naino te','Esengeli kosala','Bazando nyonso','Liyebisi ezali te awa.','Fungola likambo','Tya ete otángi','Ndima boyambi','Koba na WhatsApp','Tinda nsango oyo ebongisami na WhatsApp mpo na kokoba.','Tala mosusu','Mayebisi ezali te sikoyo. Meka lisusu.','Tya ete otángi lokasa oyo','Ezali koya…','Ntango esili','Boyambi endimami','Mayebisi ya kopona na motángo','Mayebisi ya ntina ekotikala kosala.','Meka lisusu'],
 sw: ['Arifa','Funga','Shughuli zote','Hazijasomwa','Hatua inahitajika','Masoko yote','Hakuna arifa katika mwonekano huu.','Fungua shughuli','Weka imesomwa','Thibitisha kupokea','Endelea kwenye WhatsApp','Tuma ujumbe ulioandaliwa kwenye WhatsApp ili kuendelea.','Onyesha zaidi','Arifa hazipatikani kwa sasa. Jaribu tena.','Weka ukurasa huu umesomwa','Inapakia…','Muda umeisha','Kupokea kumethibitishwa','Arifa za hiari kwenye hesabu','Arifa muhimu zinaendelea kutumika.','Jaribu tena'],
} as const;
type Locale = keyof typeof copy;
type Notice = {reference:string; marketplace:string; title:string; description:string; created_at:string; read:boolean; action_required:boolean; expired:boolean; acknowledged:boolean; action_url:string|null};
const modules = ['wenze','services','employment','apartments','hotels','restaurants','security','school'];
const moduleNames: Record<Locale,string[]> = {
 en:['Wenze','Services','Employment','Apartments','Hotels','Restaurants & Malewa','Account security','School'],
 fr:['Wenze','Services','Emploi','Logement','Hôtels','Restaurants & Malewa','Sécurité du compte','École'],
 ln:['Wenze','Misala','Mosala','Bandako','Baotɛlɛ','Restaurants & Malewa','Bobateli ya konte','Eteyelo'],
 sw:['Wenze','Huduma','Ajira','Makazi','Hoteli','Restaurants & Malewa','Usalama wa akaunti','Shule'],
};
export function safeActivityUrl(value:string|null) {
 if(!value)return undefined;
 try {const u=new URL(value); return u.protocol==='https:' && ['nihiloba.com','business.nihiloba.com'].includes(u.hostname) && !u.username && !u.password ? u.href : undefined;} catch {return undefined;}
}

// Mount with a key containing the authenticated session and active context.
export default function NotificationCenter({binding,apiBase,locale,inline=false,destination}:{binding:string;apiBase:string;locale:Locale;inline?:boolean;destination?:string}) {
 const t=copy[locale], [open,setOpen]=useState(inline),[count,setCount]=useState<number|null>(null),[items,setItems]=useState<Notice[]>([]),[cursor,setCursor]=useState<string|null>(null),[mode,setMode]=useState('all'),[market,setMarket]=useState(''),[error,setError]=useState(false),[busy,setBusy]=useState(false),[ticket,setTicket]=useState<string|null>(null),[badge,setBadge]=useState(true);
 const panel=useRef<HTMLDivElement>(null),bell=useRef<HTMLButtonElement>(null),generation=useRef(0),seen=useRef(new Set<string>());
 const call=useCallback(async(path:string,body?:object,method='POST')=>{
  const res=await fetch(apiBase+path,{method:body?method:'GET',credentials:'include',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{'X-Shida-Session':binding,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!res.ok) throw new Error('unavailable'); return res.json();
 },[apiBase,binding]);
 const refresh=useCallback(async()=>{const g=generation.current;try{const data=await call('/count');if(g===generation.current)setCount(data.unread_count);}catch{if(g===generation.current)setCount(null);}},[call]);
 const load=useCallback(async(before?:string)=>{
  const g=++generation.current;setBusy(true);setError(false);setTicket(null);
  try{const data=await call('?'+new URLSearchParams({language:locale,mode,...(market?{marketplace:market}:{}),...(before?{before}:{})}));if(g!==generation.current)return;setItems(old=>before?[...old,...data.items]:data.items);setCursor(data.next_cursor);await refresh();}
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
 if(destination)return <a className="notification-bell notification-header-link" href={destination} aria-label={t[0]+(count===null?'':` (${count})`)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>{count!==null&&count>0&&<strong aria-live="polite">{count>99?'99+':count}</strong>}</a>;
 return <div className={inline?"notification-center notification-inline":"notification-center"}>
  {!inline&&<button ref={bell} type="button" aria-expanded={open} aria-label={t[0]+(count===null?'':` (${count})`)} onClick={()=>setOpen(v=>!v)} className="notification-bell"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span>{t[0]}</span>{count!==null&&count>0&&<strong>{count>99?'99+':count}</strong>}</button>}
  {open&&<div ref={panel} className="notification-panel" role="region" aria-label={t[0]}>
   <header><h2>{inline?mySpaceCopy[locale].notifications:t[0]}</h2>{!inline&&<button onClick={()=>{setOpen(false);bell.current?.focus();}}>{t[1]}</button>}</header>
   {(items.length>0||mode!=='all'||market!=='')&&<div className="notification-filters"><select disabled={busy} aria-label={t[2]} value={mode} onChange={e=>{setItems([]);setMode(e.target.value);}}>{['all','unread','action_required'].map((v,i)=><option key={v} value={v}>{t[i+2]}</option>)}</select><select disabled={busy} aria-label={t[5]} value={market} onChange={e=>{setItems([]);setMarket(e.target.value);}}><option value="">{t[5]}</option>{modules.map((m,i)=><option key={m} value={m}>{moduleNames[locale][i]}</option>)}</select></div>}
   {market&&market!=='security'&&<label><input type="checkbox" checked={badge} disabled={busy} onChange={async e=>{const value=e.target.checked,g=generation.current;setBusy(true);try{await call('/preferences',{marketplace:market,optional_badge:value},'PUT');if(g===generation.current){setBadge(value);await refresh();}}catch{if(g===generation.current)setError(true);}finally{if(g===generation.current)setBusy(false);}}}/>{t[18]}<small>{t[19]}</small></label>}
   {error&&<p role="alert">{t[13]} <button disabled={busy} onClick={()=>void load()}>{t[20]}</button></p>}
   {busy&&<p role="status">{t[15]}</p>}
   {!busy&&!error&&!items.length&&<p>{mode==='all'&&!market?mySpaceCopy[locale].emptyNotifications:t[6]}</p>}
   {items.some(i=>!i.read)&&<button disabled={busy} onClick={()=>void act(items.filter(i=>!i.read).slice(0,50).map(i=>i.reference),'read')}>{t[14]}</button>}
   {items.map(item=><article key={item.reference} data-reference={item.reference} className={item.read?'':'notification-unread'}><small>{moduleNames[locale][modules.indexOf(item.marketplace)]} · <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString(locale)}</time></small><h3>{item.title}</h3><p>{item.description}</p>{item.expired&&<p>{t[16]}</p>}{item.acknowledged&&<p>{t[17]}</p>}<div className="notification-actions">{safeActivityUrl(item.action_url)&&<a href={safeActivityUrl(item.action_url)}>{t[7]}</a>}{!item.read&&!item.action_required&&<button disabled={busy} onClick={()=>void act([item.reference],'read')}>{t[8]}</button>}{item.action_required&&!item.expired&&!item.acknowledged&&<button disabled={busy} onClick={()=>void act([item.reference],'acknowledge')}>{t[9]}</button>}{!item.expired&&<button disabled={busy} onClick={()=>void handoff(item.reference)}>{t[10]}</button>}</div></article>)}
   {ticket&&<p role="status">{t[11]} <a href={ticket} target="_blank" rel="noopener noreferrer">{t[10]}</a></p>}
   {cursor&&<button disabled={busy} onClick={()=>void load(cursor)}>{t[12]}</button>}
  </div>}
 </div>;
}
