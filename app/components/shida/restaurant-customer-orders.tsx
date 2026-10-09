"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { checkoutCopy } from "../../lib/restaurant-checkout-copy";
import { workText } from "../../lib/restaurant-work-copy";
import { dateText, type Order } from "../../lib/restaurant-work";
import { DashboardApiError, request } from "../../lib/restaurant-seller-browser";
import { restorePersonalSession, PERSONAL_SESSION_EVENT, type PersonalSession } from "../../lib/personal-session-browser";
import { PersonalWhatsAppLogin } from "./personal-whatsapp-login";
import { ReceiptCard } from "./restaurant-receipt";
import { RestaurantReviewForm } from "./restaurant-review-form";
import type { RestaurantLocale } from "../../services/shida/restaurants-client";
import "./restaurant-checkout.css";

type Summary={order_ref:string;state:string;establishment_name?:string;submitted_at:string;order_total:string;currency:string};
type Destination={fields:{country:string;city:string;commune:string;quartier?:string|null;street?:string|null;building?:string|null;landmark?:string|null};delivery_instruction?:string|null};
export function RestaurantCustomerOrders({locale,orderRef,receiptOnly=false}:{locale:RestaurantLocale;orderRef?:string;receiptOnly?:boolean}){
 const t=checkoutCopy[locale],home=`${locale==="en"?"":`/${locale}`}/shida/restaurant-orders`;
 const [session,setSession]=useState<PersonalSession|null>(null),[checked,setChecked]=useState(false),[items,setItems]=useState<Summary[]>([]),[order,setOrder]=useState<Order|null>(null),[code,setCode]=useState<string|null>(null),[destination,setDestination]=useState<Destination|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const lastBinding=useRef<string|null>(null);
 const clearPrivate=()=>{setOrder(null);setItems([]);setCode(null);setDestination(null);};
 const loadSession=useCallback(async()=>{try{const value=await restorePersonalSession();if(lastBinding.current&&lastBinding.current!==value.binding)clearPrivate();lastBinding.current=value.binding;setSession(value);}catch{lastBinding.current=null;clearPrivate();setSession(null);}finally{setChecked(true);}},[]);
 useEffect(()=>{void loadSession();const refresh=()=>void loadSession();window.addEventListener(PERSONAL_SESSION_EVENT,refresh);window.addEventListener("focus",refresh);return()=>{window.removeEventListener(PERSONAL_SESSION_EVENT,refresh);window.removeEventListener("focus",refresh);};},[loadSession]);
 const load=useCallback(async()=>{if(!session)return;setMessage("");setCode(null);setDestination(null);try{
   if(orderRef){const value=await request(`personal/restaurant-orders/${orderRef}`,{},session.binding) as Order;if(lastBinding.current!==session.binding)return;setOrder(value);
     if(value.state==="ready"&&value.fulfillment_method==="pickup"&&value.pickup_verification?.required){const result=await request(`personal/restaurant-orders/${orderRef}/pickup-code`,{},session.binding).catch(()=>null) as {pickup_code?:string}|null;if(lastBinding.current!==session.binding)return;if(result?.pickup_code)setCode(result.pickup_code);}
     if(value.state==="out_for_delivery"&&value.fulfillment_method==="delivery"&&value.delivery_verification?.required){const result=await request(`personal/restaurant-orders/${orderRef}/delivery-code`,{},session.binding).catch(()=>null) as {delivery_code?:string}|null;if(lastBinding.current!==session.binding)return;if(result?.delivery_code)setCode(result.delivery_code);}
     if(value.fulfillment_method==="delivery"&&!['completed','rejected','cancelled','expired','delivery_failed'].includes(value.state)){const result=await request(`personal/restaurant-orders/${orderRef}/destination`,{},session.binding).catch(()=>null) as {destination?:Destination|null}|null;if(lastBinding.current!==session.binding)return;setDestination(result?.destination??null);}
   }else{const result=await request("personal/restaurant-orders?page=1&page_size=20",{},session.binding) as {items:Summary[]};if(lastBinding.current!==session.binding)return;setItems(result.items);}
  }catch(error){if(lastBinding.current!==session.binding)return;setOrder(null);setItems([]);setMessage(error instanceof DashboardApiError&&error.status===401?t.expired:t.failed);}},[session?.binding,orderRef,t.expired,t.failed]);
 useEffect(()=>{void load();},[load]);
 async function act(){if(!order||!session||busy)return;setBusy(true);setMessage("");try{const action=['pending','accepted'].includes(order.state)?'cancel':'request_cancellation';const result=await request(`personal/restaurant-orders/${order.order_ref}/actions/${action}`,{method:'POST',body:JSON.stringify({operation_key:crypto.randomUUID().replaceAll('-',''),expected_revision:order.revision})},session.binding) as {current_order:Order};setOrder(result.current_order);}catch{setMessage(t.changed);void load();}finally{setBusy(false);}}
 return <main className="restaurant-public rst-checkout" lang={locale}><div className="container"><nav><a href={home}>{t.history}</a></nav><h1>{orderRef?t.detail:t.history}</h1>{message&&<p role="status" className="rst-checkout-message">{message}</p>}{!checked?<p>{t.loading}</p>:!session?<><p>{t.noAuth}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>void loadSession()}/></>:orderRef?order?<>
   <ReceiptCard order={order} locale={locale}/>
   {code&&<section><h2>{order.fulfillment_method==="pickup"?t.pickupCode:t.deliveryCode}</h2><p className="rst-customer-code">{code}</p><p>{t.codeHelp}</p></section>}
   {order.pickup_verification&&<p>{t.pickupStatus}: {order.pickup_verification.method==="verified"?t.codeVerified:order.pickup_verification.method==="exceptional"?t.codeExceptional:t.codePending}</p>}
   {order.delivery_verification&&<p>{t.deliveryStatus}: {order.delivery_verification.method==="verified"?t.codeVerified:order.delivery_verification.method==="exceptional"?t.codeExceptional:t.codePending}</p>}
   {destination&&<section><h2>{t.address}</h2><p>{[destination.fields.street,destination.fields.building,destination.fields.landmark,destination.fields.quartier,destination.fields.commune,destination.fields.city,destination.fields.country].filter(Boolean).join(", ")}</p>{destination.delivery_instruction&&<p>{t.instruction}: {destination.delivery_instruction}</p>}</section>}
   {!receiptOnly&&(['pending','accepted'].includes(order.state)||['preparing','ready','out_for_delivery'].includes(order.state)&&!order.cancellation_pending)&&<button type="button" disabled={busy} onClick={()=>void act()}>{['pending','accepted'].includes(order.state)?t.cancel:t.requestCancel}</button>}
   {!receiptOnly&&<a href={`${home}/${order.order_ref}/receipt`}>{t.receipt}</a>}
   {!receiptOnly&&order.state==="completed"&&order.establishment_ref&&<RestaurantReviewForm locale={locale} establishmentRef={order.establishment_ref} establishmentName={order.receipt_terms?.establishment_name||t.order}/>}
  </>:<p>{t.failed}</p>:<>{items.length?items.map(item=><article key={item.order_ref}><h2>{item.establishment_name||t.order}</h2><p>{t.state}: {workText(locale,item.state)} · {item.order_total} {item.currency}</p><p>{dateText(item.submitted_at,locale)}</p><a href={`${home}/${item.order_ref}`}>{t.open}</a></article>):<p>{t.noOrders}</p>}</>}</div></main>;
}
