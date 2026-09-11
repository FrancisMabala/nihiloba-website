import { useEffect, useRef, useState } from 'react';
import { request, DashboardApiError } from './restaurant-seller-browser';
import type { Operation } from './restaurant-seller';
export type FoodLine = { key:string; item_ref:string; name:string; quantity?:number; selected_amount?:string; subtotal:string; sale_unit_label?:string };
export type Terms = { establishment_name?:string; currency:string; food_subtotal:string; delivery_fee:string|null; order_total:string; standalone:FoodLine[]; plates:{key:string; components:FoodLine[]; subtotal:string}[]; pickup_window?:{ends_at:string;timezone_name?:string}; arrival_window?:{ends_at:string;timezone_name?:string}; timezone_name?:string };
export type Order = { food_preview?:import("./restaurant-projections").FoodPreview; order_ref:string; revision:number; state:string; entry_source:string; fulfillment_method:string; submitted_at:string; response_deadline?:string|null; cancellation_pending:boolean; receipt_terms?:Terms; payment_verified?:false; order_total?:string; currency?:string };
export type Configuration = {revision:string;intake_released:boolean;pickup:null|{enabled:boolean;windows:ServiceWindow[]};delivery:null|{enabled:boolean;windows:ServiceWindow[];fee:{amount:string;currency:string};areas:Area[]}};
export type ServiceWindow = {starts_at:string;ends_at:string};
export type Area = {country:string;city:string;commune:string;quartier?:string|null;scope:string};
export function actionsFor(order:Order, now = Date.now()) {
 const {state:s,fulfillment_method:m} = order;
 const result = s === 'pending' ? ['accept','reject'] : s === 'accepted' ? ['start','cancel'] : s === 'preparing' ? ['ready','cancel'] : s === 'ready' ? [m === 'delivery' ? 'dispatch' : 'complete','cancel'] : s === 'out_for_delivery' ? ['complete','delivery_failed','cancel'] : [];
 if (order.cancellation_pending && ['preparing','ready','out_for_delivery'].includes(s)) result.push('approve_cancellation','deny_cancellation');
 if (s === 'ready' && m === 'pickup' && order.receipt_terms?.pickup_window && now >= Date.parse(order.receipt_terms.pickup_window.ends_at)+1800000) result.push('uncollected');
 return result;
}
export const terminal = (o:Order) => ['completed','rejected','cancelled','expired','uncollected','delivery_failed'].includes(o.state);
export function dateText(value:string|undefined|null,locale:string,timezone?:string|null) { if (!value) return '—'; try {return new Intl.DateTimeFormat(locale === 'ln' ? 'fr' : locale,{dateStyle:'medium',timeStyle:'short',timeZone:timezone || 'UTC'}).format(new Date(value));} catch{return '—';} }
export function useWorkDraft(dirty:boolean, message:string) {
 useEffect(()=>{if(!dirty)return;const leave=(e:Event)=>{if(!window.confirm(message))e.preventDefault();};const unload=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener('rst-work-leave',leave);window.addEventListener('beforeunload',unload);return()=>{window.removeEventListener('rst-work-leave',leave);window.removeEventListener('beforeunload',unload);};},[dirty,message]);
}
export const leaveWork = () => window.dispatchEvent(new Event('rst-work-leave',{cancelable:true}));
// Each mounted scope owns one mutation. An uncertain envelope is immutable until
// the original outcome is recovered. No storage, offline queue or revision swap.
export function useWorkRequest(binding:string,onFailure:(e:unknown)=>void) {
 const alive=useRef(true), lock=useRef(false), failure=useRef(onFailure);
 useEffect(()=>{failure.current=onFailure;},[onFailure]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[pending,setPending]=useState<Operation|null>(null),[conflict,setConflict]=useState(false),[online,setOnline]=useState(true);
 useEffect(()=>{alive.current=true;const update=()=>setOnline(navigator.onLine);update();window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{alive.current=false;window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
 useEffect(()=>{if(!pending)return;const warn=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[pending]);
 async function run<T>(path:string,method='GET',body?:unknown):Promise<T|undefined> {
  if (lock.current || !navigator.onLine || method !== 'GET' && (conflict || pending && (pending.path !== path || pending.method !== method))) return;
  lock.current=true;setBusy(true);setMessage('');
  const operation = method === 'GET' ? null : pending ?? Object.freeze({path,method,body:JSON.stringify(body)});
  if(operation)setPending(operation);
  try { const value=await request(path,operation ? {method:operation.method,body:operation.body} : {},binding) as T;
   if(!alive.current)return;
   if(operation){setPending(null);setMessage('saved');} return value;
  } catch(e) {if(!alive.current)return;
   if(e instanceof DashboardApiError && [401,403,404].includes(e.status)){setPending(null);failure.current(e);}
   else if(e instanceof DashboardApiError && e.status === 409){setConflict(true);setMessage('conflict');}
   else if(e instanceof DashboardApiError && e.status === 422){setPending(null);setMessage('validation');}
   else setMessage(operation ? 'uncertain' : 'unavailable');
  } finally {lock.current=false;if(alive.current)setBusy(false);}
 }
 return {run,busy,message,pending,conflict,online,reset:()=>{setConflict(false);setPending(null);setMessage('');}};
}
