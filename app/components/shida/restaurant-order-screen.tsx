'use client';
import Link from 'next/link';
import { FoodSummary } from './restaurant-projection';
import { useEffect, useRef, useState } from 'react';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';
import { request, DashboardApiError } from '@/app/lib/restaurant-seller-browser';
import { actionsFor, dateText, terminal, useWorkRequest, useWorkDraft, type Order, type Configuration } from '@/app/lib/restaurant-work';
import { workText } from '@/app/lib/restaurant-work-copy';
import { orderReasons } from '@/app/lib/restaurant-orders-contract';
import { FoodTerms } from './restaurant-receipt';
type Feed={changed:Order[];removed:string[];cursor:string;as_of:string};
type List={items:Order[];total:number;as_of:string};
export function RestaurantOrderScreen({path,binding,locale,timezone,onFailure}:{path:string;binding:string;locale:RestaurantLocale;timezone:string|null;onFailure:(e:unknown)=>void}) {
 const t=(k:string)=>workText(locale,k), api=useWorkRequest(binding,onFailure);
 const [filter,setFilter]=useState('pending'),[page,setPage]=useState(1),[list,setList]=useState<List|null>(null),[detail,setDetail]=useState<Order|null>(null),[destination,setDestination]=useState<Record<string,string>|null>(null),[configuration,setConfiguration]=useState<Configuration|null>(null);
 const [status,setStatus]=useState('loading'),[checked,setChecked]=useState(''),[action,setAction]=useState(''),[reason,setReason]=useState(''),[refresh,setRefresh]=useState(0),[awake,setAwake]=useState(false),[awakeActive,setAwakeActive]=useState(false);
 const selected=useRef<Order|null>(null), failure=useRef(onFailure), selection=useRef(0), refreshNow=useRef(()=>{});
 useWorkDraft(!!api.pending,t('discard'));
 useEffect(()=>{failure.current=onFailure;selected.current=detail;},[onFailure,detail]);
 useEffect(()=>{let disposed=false;let lock:WakeLockSentinel|null=null;
  async function acquire(){if(!awake || document.hidden || !navigator.wakeLock)return;try{const result=await navigator.wakeLock.request('screen');if(disposed || document.hidden){await result.release();return;}lock=result;setAwakeActive(!result.released);result.addEventListener('release',()=>{if(!disposed)setAwakeActive(false);});}catch{if(!disposed)setAwakeActive(false);}}
  const visible=()=>{if(document.hidden){void lock?.release();setAwakeActive(false);}else void acquire();};void acquire();document.addEventListener('visibilitychange',visible);
  return()=>{disposed=true;void lock?.release();document.removeEventListener('visibilitychange',visible);};
 },[awake]);
 useEffect(()=>{
  let alive=true,inFlight=false,cursor='',asOf='',errors=0,timer:ReturnType<typeof setTimeout>|undefined;
  const controller=new AbortController();
  const states=filter === 'active' ? ['accepted','preparing','ready','out_for_delivery'] : filter ? [filter] : [];
  const q=new URLSearchParams();states.forEach(s=>q.append('states',s));
  const read=<T,>(url:string)=>request(url,{signal:controller.signal},binding) as Promise<T>;
  async function tick(full=false){
   if(!alive || inFlight)return;
   clearTimeout(timer);
   if(document.hidden || !navigator.onLine){setStatus(navigator.onLine?'stale':'offline');setDestination(null);return;}
   inFlight=true;
   try {
    if(full || !cursor){
     setStatus('loading');setDestination(null);
     const initial=await read<Feed>(`${path}/order-feed?${q}&limit=50`);if(!alive)return;cursor=initial.cursor;
     const c=await read<Configuration>(`${path}/order-configuration`);if(!alive)return;setConfiguration(c);
     const rows=await read<List>(`${path}/orders?${q}&page=${page}&page_size=20`);if(!alive)return;asOf=rows.as_of;setList(rows);
    }
    const feed=await read<Feed>(`${path}/order-feed?${q}&limit=50&cursor=${encodeURIComponent(cursor)}`);if(!alive)return;cursor=feed.cursor;
    if(feed.changed.length || feed.removed.length){
     // Refill just the bounded visible page: the feed intentionally supplies no
     // filtered total. This keeps pagination/counts authoritative after removals.
     setList(old=>old ? {...old,items:old.items.filter(o=>!feed.removed.includes(o.order_ref)).map(o=>feed.changed.find(n=>n.order_ref===o.order_ref && n.revision>=o.revision) ?? o)}:old);
     const rows=await read<List>(`${path}/orders?${q}&page=${page}&page_size=20${page>1?`&as_of=${encodeURIComponent(asOf)}`:''}`);if(!alive)return;setList(rows);
    }
    const current=selected.current;
    if(current && (full || feed.removed.includes(current.order_ref) || feed.changed.some(o=>o.order_ref===current.order_ref && o.revision>current.revision))){
     setDestination(null);const ticket=selection.current;
     const next=await read<Order>(`${path}/orders/${current.order_ref}`);if(!alive)return;if(ticket===selection.current)setDetail(next);
    }
    errors=0;setStatus('');setChecked(feed.as_of);
   }catch(e){if(!alive)return;setDestination(null);if(e instanceof DashboardApiError && [401,403,404].includes(e.status)){setList(null);setDetail(null);failure.current(e);return;}if(e instanceof DashboardApiError && e.detail==='restaurant_feed_refresh_required')cursor='';setStatus(navigator.onLine?'unavailable':'offline');errors++;}
   finally{inFlight=false;if(alive && !document.hidden && navigator.onLine)timer=setTimeout(()=>void tick(),Math.min(120000,15000*2**Math.min(errors,3)));}
  }
  const resume=()=>{setDestination(null);setStatus(navigator.onLine?'stale':'offline');if(!document.hidden && navigator.onLine)void tick(true);else clearTimeout(timer);};
  refreshNow.current=()=>void tick(true);void tick(true);document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);window.addEventListener('offline',resume);
  return()=>{alive=false;controller.abort();clearTimeout(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);window.removeEventListener('offline',resume);};
 },[path,binding,filter,page,refresh]);
 async function open(order:Order){const ticket=++selection.current;setDestination(null);setAction('');const value=await api.run<Order>(`${path}/orders/${order.order_ref}`);if(value && ticket===selection.current)setDetail(value);}
 async function commit(){if(!detail || status || !action)return;const value=await api.run<{current_order:Order}>(`${path}/orders/${detail.order_ref}/actions/${action}`,'POST',{operation_key:crypto.randomUUID(),expected_revision:detail.revision,...(reason?{reason}:{})});if(value){setDetail(value.current_order);setDestination(null);setAction('');refreshNow.current();}}
 const blocked=!!status || api.busy || !api.online;
 const receiptPath=detail ? `${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/${path.split('/').at(-1)}/receipts/${detail.order_ref}` : '';
 return <div className="rst-work"><div className="rst-actions"><label>{t('orders')}<select disabled={!!api.pending} value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);setStatus('loading');}}><option value="pending">{t('incoming')}</option><option value="active">{t('active')}</option><option value="">{t('history')}</option></select></label><button type="button" className="button button-secondary" onClick={()=>{setStatus('stale');setRefresh(n=>n+1);}}>{t('refresh')}</button><label><input type="checkbox" checked={awake} onChange={e=>{setAwakeActive(false);setAwake(e.target.checked);}}/>{t('awake')}</label></div>
 {awake && <p role="status">{t(awakeActive?'awakeOn':'awakeOff')} {!awakeActive && t('awakeHelp')}</p>}
 {configuration && !configuration.intake_released && <p className="rst-notice">{t('closed')}</p>}
 {status && <p role="status">{t(status)} {list && t('stale')}</p>}<p>{t('updated')}: {dateText(checked,locale,timezone)}</p><p>{t('detailHelp')}</p>
 <div className="rst-order-layout"><div>{list && <><p>{list.total} · {t('orders')}</p>{!list.items.length && !status && <p>{t('empty')}</p>}{list.items.map(o=><article className="rst-card" key={o.order_ref}><h3>{o.order_ref}</h3><p>{t(o.state)} · {t(o.fulfillment_method)}</p><FoodSummary preview={o.food_preview} locale={locale}/>{o.state==='pending' && o.response_deadline && <p>{t('deadline')}: {dateText(o.response_deadline,locale,timezone)}</p>}<p>{o.order_total} {o.currency}</p><p>{dateText(o.submitted_at,locale,timezone)}</p>{o.cancellation_pending && <p>{t('cancellation')}</p>}<button type="button" className="button button-secondary" disabled={blocked || !!api.pending} onClick={()=>void open(o)}>{t('review')}</button></article>)}<div className="rst-actions"><button type="button" disabled={page===1 || blocked} onClick={()=>{setPage(n=>n-1);setStatus('loading');}}>{t('previous')}</button><span>{page}</span><button type="button" disabled={page*20>=list.total || blocked} onClick={()=>{setPage(n=>n+1);setStatus('loading');}}>{t('next')}</button></div></>}</div>
 {detail && <article className="rst-card"><h2>{detail.order_ref}</h2><p>{t('current')}: {t(detail.state)} · {t(detail.fulfillment_method)}</p>{detail.response_deadline && <p>{t(detail.state==='pending'?'deadline':'savedDeadline')}: {dateText(detail.response_deadline,locale,timezone)}</p>}{detail.cancellation_pending && <p>{t('cancellation')}</p>}{detail.receipt_terms && <FoodTerms terms={detail.receipt_terms} locale={locale}/>}<Link prefetch={false} href={receiptPath}>{t('receipt')}</Link>
 {!terminal(detail) && detail.fulfillment_method==='delivery' && <><button type="button" disabled={blocked} onClick={async()=>{const ticket=selection.current;const result=await api.run<{destination:{fields:Record<string,string>}|null}>(`${path}/orders/${detail.order_ref}/destination`);if(result && ticket===selection.current && selected.current?.revision===detail.revision && !terminal(selected.current))setDestination(result.destination?.fields ?? null);}}>{t('destination')}</button>{destination && !status && <p>{Object.values(destination).filter(Boolean).join(', ')}</p>}</>}
 <p role="status">{api.message && t(api.message)}</p>
 {api.conflict ? <button type="button" disabled={blocked} onClick={async()=>{const fresh=await api.run<Order>(`${path}/orders/${detail.order_ref}`);if(fresh){setDetail(fresh);setAction('');api.reset();refreshNow.current();}}}>{t('review')}</button> : action ? <div className="rst-confirm"><h3>{t(action==='ready'?'readyAction':action)}</h3><p>{t('confirmAction')}</p><label>{t('reason')}<select disabled={!!api.pending} value={reason} onChange={e=>setReason(e.target.value)}><option value="">—</option>{orderReasons.filter(r=>action!=='delivery_failed' || ['destination_inaccessible','recipient_unavailable','unable_to_complete'].includes(r)).map(r=><option key={r} value={r}>{t(r)}</option>)}</select></label><button type="button" className="button button-primary" disabled={blocked || ['reject','cancel','approve_cancellation','uncollected','delivery_failed'].includes(action) && !reason} onClick={()=>void commit()}>{t(api.pending?'retry':'confirm')}</button>{!api.pending && <button type="button" onClick={()=>setAction('')}>{t('back')}</button>}</div> : <div className="rst-actions">{actionsFor(detail).map(a=><button type="button" className="button button-secondary" disabled={blocked} key={a} onClick={()=>{setAction(a);setReason('');}}>{t(a==='ready'?'readyAction':a)}</button>)}</div>}</article>}
 </div></div>;
}
