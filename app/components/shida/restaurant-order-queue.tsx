'use client';
import {soloCopy} from '../../lib/restaurant-solo-copy';
import { useState } from 'react';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';
import type { Order, Configuration } from '@/app/lib/restaurant-work';
import { actionsFor, dateText } from '@/app/lib/restaurant-work';
import { workText } from '@/app/lib/restaurant-work-copy';
import { ordersCopy } from '@/app/lib/restaurant-orders-copy';
import { soloPreparationCopy } from '@/app/lib/restaurant-preparation-copy';
import { FoodSummary } from './restaurant-projection';

export type QueueSection='decision'|'preparation'|'handover'|'history';
export type QueueList={items:Order[];total:number;as_of:string};
const keys:QueueSection[]=['decision','preparation','handover','history'];
const pageSize=20;

export function nextStep(order:Order,locale:RestaurantLocale){
 const c=ordersCopy(locale), t=(key:string)=>workText(locale,key);
 if(order.cancellation_pending)return c.reviewCancellation;
 if(order.state==='pending')return t('accept')+' / '+t('reject');
 if(['accepted','preparing'].includes(order.state))return soloCopy[locale].ready;
 if(order.state==='ready' || order.state==='out_for_delivery'){
  const actions=actionsFor(order);
  const next=['assisted_handover','table_handover','dispatch','verify_pickup','verify_delivery','pickup_exception','delivery_exception'].find(a=>actions.includes(a));
  const step=next==='table_handover'?c.handoverAction:next?t(next):c.waiting;
  return order.state==='ready' && order.preparation && Object.keys(order.preparation).length===0 ? soloPreparationCopy[locale].serve+' · '+step : step;
 }
 return c.receipt;
}
function source(order:Order,locale:RestaurantLocale){
 const c=ordersCopy(locale);
 if(order.entry_source==='counter')return c.counter;
 if(order.entry_source==='assisted')return c.assisted;
 return order.channel==='web'?c.customerWeb:order.channel==='whatsapp'?c.customerWhatsapp:c.customer;
}
export function RestaurantOrderQueue({locale,timezone,lists,pages,configuration,blocked,onPage,onOpen,onIntake,onSelling}:{locale:RestaurantLocale;timezone:string|null;lists:Partial<Record<QueueSection,QueueList>>;pages:Record<QueueSection,number>;configuration:Configuration|null;blocked:boolean;onPage:(key:QueueSection,page:number)=>void;onOpen:(order:Order)=>void;onIntake?:()=>void;onSelling?:()=>void}){
 const c=ordersCopy(locale),t=(key:string)=>workText(locale,key),[copied,setCopied]=useState('');
 const total=keys.reduce((sum,key)=>sum+(lists[key]?.total??0),0);
 const active=keys.slice(0,3).reduce((sum,key)=>sum+(lists[key]?.total??0),0);
 const loaded=keys.every(key=>!!lists[key]);
 async function copy(ref:string){try{await navigator.clipboard.writeText(ref);setCopied(ref);}catch{setCopied('');}}
 return <div className="rst-order-queue">
  <div className="rst-order-heading"><div><p className="rst-order-eyebrow">{t('orders')}</p><h2>{c.title}</h2><p>{c.intro}</p></div>{onSelling&&<button type="button" disabled={blocked} onClick={onSelling}>{c.selling}</button>}</div>
  {configuration && !configuration.intake_released && <div className="rst-order-notice"><p>{c.closed}</p>{onIntake&&<button type="button" disabled={blocked} onClick={onIntake}>{workText(locale,'intake')}</button>}</div>}
  {loaded && total===0 && <div className="rst-order-empty"><strong>{c.noneYet}</strong><p>{c.noneYetHelp}</p>{onSelling&&<button type="button" disabled={blocked} onClick={onSelling}>{c.selling}</button>}</div>}
  {loaded && active===0 && total>0 && <p className="rst-order-quiet"><strong>{c.nothingNow}.</strong> {c.nothingNowHelp}</p>}
  {loaded && total>0 && keys.map(key=>{
   const list=lists[key]!;
   if(key!=='history' && !list.total)return null;
   return <section className="rst-order-section" key={key} aria-label={c[key]}>
    <div className="rst-order-section-heading"><div><h3>{c[key]}</h3><p>{c[`${key}Help` as keyof typeof c]}</p></div><strong>{list.total}</strong></div>
    {!list.total && <p className="rst-order-section-empty">{c.noHistory}</p>}
    <div className="rst-order-rows">{list.items.map(order=><article className={`rst-order-row${order.cancellation_pending?' has-cancellation':''}`} key={order.order_ref}>
     <div className="rst-order-row-head"><div><h4>{order.order_ref}</h4><button type="button" className="rst-order-copy" onClick={()=>void copy(order.order_ref)} aria-label={`${c.copy}: ${order.order_ref}`}>{copied===order.order_ref?c.copied:c.copy}</button></div><span className="rst-order-state">{t(order.state)}</span></div>
     <div className="rst-order-meta"><span><b>{c.source}:</b> {source(order,locale)}</span><span><b>{c.placed}:</b> {dateText(order.submitted_at,locale,timezone)}</span><span><b>{c.fulfillment}:</b> {t(order.fulfillment_method)}</span></div>
     <FoodSummary preview={order.food_preview} locale={locale}/>
     {order.response_deadline && order.state==='pending' && <p className="rst-order-deadline"><strong>{c.response}:</strong> {dateText(order.response_deadline,locale,timezone)}</p>}
     {order.cancellation_pending && <p className="rst-order-cancellation">{t('cancellation')}</p>}
     <div className="rst-order-next"><p><span>{c.nextAction}</span><strong>{nextStep(order,locale)}</strong></p><button type="button" className="button button-secondary" disabled={blocked} onClick={()=>onOpen(order)}>{key==='history'?c.receipt:order.cancellation_pending?c.reviewCancellation:c.open}</button></div>
    </article>)}</div>
    {list.total>pageSize && <div className="rst-order-pages"><span>{c.showing} {(pages[key]-1)*pageSize+1}–{Math.min(pages[key]*pageSize,list.total)} {c.of} {list.total}</span><button type="button" disabled={blocked||pages[key]===1} onClick={()=>onPage(key,pages[key]-1)}>{t('previous')}</button><button type="button" disabled={blocked||pages[key]*pageSize>=list.total} onClick={()=>onPage(key,pages[key]+1)}>{t('next')}</button></div>}
   </section>;
  })}
 </div>;
}
