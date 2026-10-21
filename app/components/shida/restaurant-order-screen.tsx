'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';
import { request, DashboardApiError } from '@/app/lib/restaurant-seller-browser';
import {soloCopy} from '../../lib/restaurant-solo-copy';
import {serviceText} from '../../lib/restaurant-service-copy';
import { actionsFor, dateText, terminal, useWorkRequest, useWorkDraft, type Order, type Configuration } from '@/app/lib/restaurant-work';
import { workText } from '@/app/lib/restaurant-work-copy';
import { orderReasons, pickupExceptionReasons, deliveryExceptionReasons } from '@/app/lib/restaurant-orders-contract';
import { FoodTerms } from './restaurant-receipt';
import { ordersCopy } from '@/app/lib/restaurant-orders-copy';
import { soloPreparationCopy } from '@/app/lib/restaurant-preparation-copy';
import { RestaurantOrderQueue, nextStep } from './restaurant-order-queue';
import './restaurant-orders.css';
type PrivateDestination={fields:Record<string,string|null>;delivery_instruction?:string|null};
type Feed={changed:Order[];removed:string[];cursor:string;as_of:string};
type List={items:Order[];total:number;as_of:string};
const sections = {
 decision:['pending'],
 preparation:['accepted','preparing'],
 handover:['ready','out_for_delivery'],
 history:['completed','rejected','cancelled','expired','uncollected','delivery_failed'],
} as const;
type Section=keyof typeof sections;
const sectionKeys=Object.keys(sections) as Section[];
const pageSize=20;
export function RestaurantOrderScreen({path,binding,locale,timezone,onFailure,onIntake,onSelling}:{path:string;binding:string;locale:RestaurantLocale;timezone:string|null;onFailure:(e:unknown)=>void;onIntake?:()=>void;onSelling?:()=>void}) {
 const t=(k:string)=>k==='solo_ready'?soloCopy[locale].ready:workText(locale,k), api=useWorkRequest(binding,onFailure);
 const [preparationPending,setPreparationPending]=useState(false);
 useEffect(()=>{const dirty=(event:Event)=>setPreparationPending((event as CustomEvent<boolean>).detail);window.addEventListener('rst-work-dirty',dirty);return()=>window.removeEventListener('rst-work-dirty',dirty);},[]);
 const [pages,setPages]=useState<Record<Section,number>>({decision:1,preparation:1,handover:1,history:1}),[lists,setLists]=useState<Partial<Record<Section,List>>>({}),[detail,setDetail]=useState<Order|null>(null),[destination,setDestination]=useState<PrivateDestination|null>(null),[configuration,setConfiguration]=useState<Configuration|null>(null);
 const [status,setStatus]=useState('loading'),[checked,setChecked]=useState(''),[action,setAction]=useState(''),[reason,setReason]=useState(''),[handoffCode,setPickupCode]=useState(''),[refresh,setRefresh]=useState(0),[awake,setAwake]=useState(false),[awakeActive,setAwakeActive]=useState(false),[copied,setCopied]=useState(false);
 const detailRef=detail?.order_ref;
 useEffect(()=>{if(detailRef)document.querySelector('.rst-order-next-detail')?.scrollIntoView({block:'start'});},[detailRef]);
 const selected=useRef<Order|null>(null), failure=useRef(onFailure), selection=useRef(0), refreshNow=useRef(()=>{});
 useWorkDraft(!!api.pending,t('discard'));
 useEffect(()=>{failure.current=onFailure;selected.current=detail;},[onFailure,detail]);
 useEffect(()=>{let disposed=false;let lock:WakeLockSentinel|null=null;
  async function acquire(){if(!awake || document.hidden || !navigator.wakeLock)return;try{const result=await navigator.wakeLock.request('screen');if(disposed || document.hidden){await result.release();return;}lock=result;setAwakeActive(!result.released);result.addEventListener('release',()=>{if(!disposed)setAwakeActive(false);});}catch{if(!disposed)setAwakeActive(false);}}
  const visible=()=>{if(document.hidden){void lock?.release();setAwakeActive(false);}else void acquire();};void acquire();document.addEventListener('visibilitychange',visible);
  return()=>{disposed=true;void lock?.release();document.removeEventListener('visibilitychange',visible);};
 },[awake]);
 useEffect(()=>{
  let alive=true,inFlight=false,cursor='',errors=0,timer:ReturnType<typeof setTimeout>|undefined;
  const controller=new AbortController();
  const read=<T,>(url:string)=>request(url,{signal:controller.signal},binding) as Promise<T>;
  async function readLists(){
   const entries=await Promise.all(sectionKeys.map(async key=>{
    const q=new URLSearchParams({page:String(pages[key]),page_size:String(pageSize)});
    sections[key].forEach(state=>q.append('states',state));
    return [key,await read<List>(`${path}/orders?${q}`)] as const;
   }));
   if(alive)setLists(Object.fromEntries(entries));
  }
  async function tick(full=false){
   if(!alive || inFlight)return;
   clearTimeout(timer);
   if(document.hidden || !navigator.onLine){setStatus(navigator.onLine?'stale':'offline');setDestination(null);return;}
   inFlight=true;
   try {
    if(full || !cursor){
     setStatus('loading');setDestination(null);
     const initial=await read<Feed>(`${path}/order-feed?limit=50`);if(!alive)return;cursor=initial.cursor;
     const c=await read<Configuration>(`${path}/order-configuration`);if(!alive)return;setConfiguration(c);
     await readLists();if(!alive)return;
    }
    const feed=await read<Feed>(`${path}/order-feed?limit=50&cursor=${encodeURIComponent(cursor)}`);if(!alive)return;cursor=feed.cursor;
    if(feed.changed.length || feed.removed.length)await readLists();
    const current=selected.current;
    if(current && (full || feed.removed.includes(current.order_ref) || feed.changed.some(o=>o.order_ref===current.order_ref && o.revision>current.revision))){
     setDestination(null);const ticket=selection.current;
     const next=await read<Order>(`${path}/orders/${current.order_ref}`);if(!alive)return;if(ticket===selection.current)setDetail(next);
    }
    errors=0;setStatus('');setChecked(feed.as_of);
   }catch(e){if(!alive)return;setDestination(null);if(e instanceof DashboardApiError && [401,403,404].includes(e.status)){setLists({});setDetail(null);failure.current(e);return;}if(e instanceof DashboardApiError && e.detail==='restaurant_feed_refresh_required')cursor='';setStatus(navigator.onLine?'unavailable':'offline');errors++;}
   finally{inFlight=false;if(alive && !document.hidden && navigator.onLine)timer=setTimeout(()=>void tick(),Math.min(120000,15000*2**Math.min(errors,3)));}
  }
  const resume=()=>{setDestination(null);setStatus(navigator.onLine?'stale':'offline');if(!document.hidden && navigator.onLine)void tick(true);else clearTimeout(timer);};
  refreshNow.current=()=>void tick(true);void tick(true);document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);window.addEventListener('offline',resume);
  return()=>{alive=false;controller.abort();clearTimeout(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);window.removeEventListener('offline',resume);};
 },[path,binding,pages,refresh]);
 async function open(order:Order){const ticket=++selection.current;setDestination(null);setAction('');setCopied(false);const value=await api.run<Order>(`${path}/orders/${order.order_ref}`);if(value && ticket===selection.current)setDetail(value);}
 async function commit(){if(!detail || status || !action)return;const value=await api.run<{current_order:Order}>(`${path}/orders/${detail.order_ref}/actions/${action}`,'POST',{operation_key:crypto.randomUUID(),expected_revision:detail.revision,...(reason?{reason}:{}),...(['delivery_exception','assisted_handover','table_handover','solo_ready'].includes(action)?{confirm:true}:{}),...(action==='verify_pickup'?{pickup_code:handoffCode}:action==='verify_delivery'?{delivery_code:handoffCode}:{})});if(value){setPickupCode('');setDetail(value.current_order);setDestination(null);setAction('');refreshNow.current();}}
 const blocked=!!status || api.busy || !api.online || preparationPending;
 const receiptPath=detail ? `${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/${path.split('/').at(-1)}/receipts/${detail.order_ref}` : '';
 return <div className="rst-work rst-orders-screen"><RestaurantOrderQueue locale={locale} timezone={timezone} lists={lists} pages={pages} configuration={configuration} blocked={blocked || !!api.pending} onPage={(key,page)=>{setPages(old=>({...old,[key]:page}));setStatus('loading');}} onOpen={order=>void open(order)} onIntake={onIntake} onSelling={onSelling}/>
 <div className="rst-order-tools"><button type="button" onClick={()=>{setStatus('stale');setRefresh(n=>n+1);}}>{t('refresh')}</button><label><input type="checkbox" checked={awake} onChange={e=>{setAwakeActive(false);setAwake(e.target.checked);}}/>{t('awake')}</label></div>
 {awake && <p role="status">{t(awakeActive?'awakeOn':'awakeOff')} {!awakeActive && t('awakeHelp')}</p>}
 {status && <p role="status">{t(status)} {Object.keys(lists).length>0 && t('stale')}</p>}{checked&&<p className="rst-order-checked">{t('updated')}: {dateText(checked,locale,timezone)}</p>}
 <div className="rst-order-layout">
 {detail && <div className="rst-order-next-detail"><p><strong>{ordersCopy(locale).nextAction}:</strong> {nextStep(detail,locale)}</p>{detail.state==='ready' && detail.preparation && Object.keys(detail.preparation).length===0 && <p>{soloPreparationCopy[locale].serve}</p>}<button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(detail.order_ref);setCopied(true);}catch{setCopied(false);}}}>{copied?ordersCopy(locale).copied:ordersCopy(locale).copy}: {detail.order_ref}</button></div>}
 {detail && <article className="rst-card rst-order-detail"><div className="rst-order-detail-heading"><h2>{detail.order_ref}</h2><button type="button" onClick={()=>{selection.current++;setDetail(null);setAction('');setDestination(null);}}>{t('back')}</button></div><p>{t('current')}: {t(detail.state)} · {t(detail.fulfillment_method)}</p>{detail.response_deadline && <p>{t(detail.state==='pending'?'deadline':'savedDeadline')}: {dateText(detail.response_deadline,locale,timezone)}</p>}{detail.cancellation_pending && <p>{t('cancellation')}</p>}{detail.receipt_terms && <FoodTerms terms={detail.receipt_terms} locale={locale}/>}{detail.pickup_verification && (detail.pickup_verification.required || ['verified','exceptional'].includes(detail.pickup_verification.method)) && <p>{t(detail.pickup_verification.method==='verified'?'pickupVerified':detail.pickup_verification.method==='exceptional'?'pickupExceptional':detail.pickup_verification.legacy?'pickupLegacy':'pickupRequired')}</p>}{detail.delivery_verification && (detail.delivery_verification.required || ['verified','exceptional'].includes(detail.delivery_verification.method)) && <p>{t(detail.delivery_verification.method==='verified'?'deliveryVerified':detail.delivery_verification.method==='exceptional'?'deliveryExceptional':detail.delivery_verification.legacy?'deliveryLegacy':'deliveryRequired')}</p>}<Link prefetch={false} href={receiptPath}>{t('receipt')}</Link>
 {!terminal(detail) && detail.fulfillment_method==='delivery' && <><button type="button" disabled={blocked} onClick={async()=>{const ticket=selection.current;const result=await api.run<{destination:PrivateDestination|null}>(`${path}/orders/${detail.order_ref}/destination`);if(result && ticket===selection.current && selected.current?.revision===detail.revision && !terminal(selected.current))setDestination(result.destination ?? null);}}>{t('destination')}</button>{destination && !status && <div><p>{Object.values(destination.fields).filter(Boolean).join(', ')}</p>{destination.delivery_instruction && <p><strong>{t('deliveryInstruction')}:</strong> {destination.delivery_instruction}</p>}</div>}</>}
 <p role="status">{api.message && t(api.message)}</p>
 {api.conflict ? <button type="button" disabled={blocked} onClick={async()=>{const fresh=await api.run<Order>(`${path}/orders/${detail.order_ref}`);if(fresh){setDetail(fresh);setAction('');api.reset();refreshNow.current();}}}>{t('review')}</button> : action ? <div className="rst-confirm"><h3>{t(action==='ready'?'readyAction':action)}</h3><p>{action==='solo_ready'?soloCopy[locale].readyHelp:['assisted_handover','table_handover'].includes(action)?serviceText(locale,'handoverConfirm'):t(action==='pickup_exception'?'pickupExceptionWarning':action==='delivery_exception'?'deliveryExceptionWarning':action==='assisted_handover'?'assistedHandoverWarning':'confirmAction')}</p>{['verify_pickup','verify_delivery'].includes(action) && <label>{t(action==='verify_pickup'?'pickupCodePrompt':'deliveryCodePrompt')}<input type="password" inputMode="numeric" autoComplete="off" maxLength={6} disabled={!!api.pending} value={handoffCode} onChange={e=>setPickupCode(e.target.value.replace(/[^0-9]/g,'').slice(0,6))}/></label>}{!['verify_pickup','verify_delivery','assisted_handover','table_handover','solo_ready'].includes(action) && <label>{t('reason')}<select disabled={!!api.pending} value={reason} onChange={e=>setReason(e.target.value)}><option value="">—</option>{orderReasons.filter(r=>action==='pickup_exception' ? pickupExceptionReasons.includes(r) : action==='delivery_exception' ? deliveryExceptionReasons.includes(r) : action==='delivery_failed' ? ['destination_inaccessible','recipient_unavailable','unable_to_complete'].includes(r) : !pickupExceptionReasons.includes(r)).map(r=><option key={r} value={r}>{t(r)}</option>)}</select></label>}<button type="button" className="button button-primary" disabled={blocked || (['reject','cancel','approve_cancellation','uncollected','delivery_failed','pickup_exception','delivery_exception'].includes(action) && !reason || ['verify_pickup','verify_delivery'].includes(action) && !/^[0-9]{6}$/.test(handoffCode))} onClick={()=>void commit()}>{t(api.pending?'retry':'confirm')}</button>{!api.pending && <button type="button" onClick={()=>setAction('')}>{t('back')}</button>}</div> : <div className="rst-actions">{[...(['accepted','preparing'].includes(detail.state)?['solo_ready']:[]),...actionsFor(detail).filter(a=>!['start','ready'].includes(a))].map(a=><button type="button" className="button button-secondary" disabled={blocked} key={a} onClick={()=>{setAction(a);setReason('');setPickupCode('');}}>{t(a==='ready'?'readyAction':a)}</button>)}</div>}</article>}
 </div></div>;
}
