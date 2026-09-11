'use client';
import { useEffect, useRef, useState } from 'react';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';
import { workText } from '@/app/lib/restaurant-work-copy';
import { dateText, type Order, type Terms } from '@/app/lib/restaurant-work';
import { request } from '@/app/lib/restaurant-seller-browser';
export function FoodTerms({terms,locale}:{terms:Terms;locale:RestaurantLocale}) {
 const t=(k:string)=>workText(locale,k);
 const lines=(rows:Terms['standalone'])=><ul>{rows.map((l,i)=><li key={l.key ?? i}>{l.name} · {l.quantity != null ? `${l.quantity} ${l.sale_unit_label ?? ''}` : l.selected_amount} — {l.subtotal} {terms.currency}</li>)}</ul>;
 return <><h3>{t('terms')}</h3>{lines(terms.standalone ?? [])}{(terms.plates ?? []).map((p,i)=><section key={p.key}><h4>{t('plate')} {i+1} · {p.subtotal} {terms.currency}</h4>{lines(p.components)}</section>)}<dl className="rst-details">{[['food',terms.food_subtotal],['fee',terms.delivery_fee],['total',terms.order_total]].map(([k,v])=><div key={k}><dt>{t(k!)}</dt><dd>{v == null ? t('na') : `${v} ${terms.currency}`}</dd></div>)}</dl></>;
}
export function ReceiptCard({order,locale}:{order:Order;locale:RestaurantLocale}) {const t=(k:string)=>workText(locale,k);const zone=order.receipt_terms?.timezone_name ?? order.receipt_terms?.pickup_window?.timezone_name ?? order.receipt_terms?.arrival_window?.timezone_name ?? 'UTC';return <article className="rst-card"><h2>{t('receipt')} · {order.receipt_terms?.establishment_name}</h2><p>{order.order_ref}</p><p>{t('current')}: {t(order.state)} · {t(order.fulfillment_method)}</p><p>{dateText(order.submitted_at,locale,zone)} · {zone.split('/').at(-1)?.replaceAll('_',' ')}</p>{order.response_deadline && <p>{t(order.state==='pending'?'deadline':'savedDeadline')}: {dateText(order.response_deadline,locale,zone)}</p>}{order.receipt_terms && <FoodTerms terms={order.receipt_terms} locale={locale}/>}<p>{t('payment')}</p></article>;}
function ReceiptQR({order,locale,establishment}:{order:Order;locale:RestaurantLocale;establishment?:string}) {
 const [url,setUrl]=useState(''),[error,setError]=useState(false),canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{let alive=true;if(url)void import('qrcode').then(q=>{if(alive && canvas.current)return q.toCanvas(canvas.current,url,{width:256,margin:4,errorCorrectionLevel:'M'});}).catch(()=>{if(alive)setError(true);});return()=>{alive=false;};},[url]);
 const label=workText(locale,'qr');
 return <div className="rst-card"><button type="button" className="button button-secondary" onClick={()=>{const prefix=locale==='en'?'':`/${locale}`;const path=order.entry_source==='customer'?`${prefix}/shida/restaurant-orders/${order.order_ref}/receipt`:`${prefix}/shida/seller/restaurants/${establishment}/receipts/${order.order_ref}`;setUrl(new URL(path,window.location.origin).href);}}>{label}</button>{url && !error && <><p>{workText(locale,order.entry_source==='customer'?'customerReceipt':'operatorReceipt')}</p><canvas className="rst-qr" ref={canvas} role="img" aria-label={label}/><a href={url}>{workText(locale,'receipt')}</a></>}{error && <p role="status">{workText(locale,'unavailable')}</p>}</div>;
}
export function ProtectedReceipt({binding,locale,orderRef,establishment,onFailure}:{binding:string;locale:RestaurantLocale;orderRef:string;establishment?:string;onFailure:(e:unknown)=>void}) {
 const [order,setOrder]=useState<Order|null>(null),[error,setError]=useState(false),[fresh,setFresh]=useState(false);
 useEffect(()=>{
  let alive=true;const controller=new AbortController();let inFlight=false;
  const path=establishment ? `personal/restaurants/${establishment}/orders/${orderRef}/receipt` : `personal/restaurant-orders/${orderRef}/receipt`;
  async function read(){if(inFlight || document.hidden || !navigator.onLine)return;inFlight=true;try{const value=await request(path,{signal:controller.signal},binding);if(alive){setOrder(value as Order);setFresh(true);setError(false);}}catch(e){if(alive){setOrder(null);setFresh(false);setError(true);onFailure(e);}}finally{inFlight=false;}}
  const resume=()=>{setFresh(false);void read();};const offline=()=>setFresh(false);
  void read();window.addEventListener('focus',resume);window.addEventListener('online',resume);window.addEventListener('offline',offline);document.addEventListener('visibilitychange',resume);
  return()=>{alive=false;controller.abort();window.removeEventListener('focus',resume);window.removeEventListener('online',resume);window.removeEventListener('offline',offline);document.removeEventListener('visibilitychange',resume);};
 },[binding,orderRef,establishment,onFailure]);
 return <>{!fresh && <p role="status">{workText(locale,error?'unavailable':order?'stale':'loading')}</p>}{order && fresh && <><ReceiptCard order={order} locale={locale}/><ReceiptQR order={order} locale={locale} establishment={establishment}/></>}</>;
}
