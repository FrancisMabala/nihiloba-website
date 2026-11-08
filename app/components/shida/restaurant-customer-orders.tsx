"use client";
import {mySpaceCopy} from "../../lib/my-space-refinement-copy";
import {TransactionEmpty} from "./transaction-empty";
import { useCallback, useEffect, useRef, useState } from "react";
import { checkoutCopy } from "../../lib/restaurant-checkout-copy";
import { workText } from "../../lib/restaurant-work-copy";
import { dateText, type Order } from "../../lib/restaurant-work";
import { DashboardApiError, request } from "../../lib/restaurant-seller-browser";
import { restorePersonalSession, PERSONAL_SESSION_EVENT, type PersonalSession } from "../../lib/personal-session-browser";
import { PersonalWhatsAppLogin } from "./personal-whatsapp-login";
import { useConfirmation } from "./confirmation-dialog";
import { orderCancellationCopy } from "../../lib/order-detail-copy";
import { RestaurantOrderDetail } from "./restaurant-order-detail";
import { ReceiptCard } from "./restaurant-receipt";
import { RestaurantReviewForm } from "./restaurant-review-form";
import type { RestaurantLocale } from "../../services/shida/restaurants-client";
import "./restaurant-checkout.css";

type Summary={order_ref:string;state:string;establishment_name?:string;submitted_at:string;order_total:string;currency:string};
type Destination={fields:{country:string;city:string;commune:string;quartier?:string|null;street?:string|null;building?:string|null;landmark?:string|null};delivery_instruction?:string|null};
export function RestaurantCustomerOrders({locale,orderRef,receiptOnly=false,embedded=false}:{locale:RestaurantLocale;orderRef?:string;receiptOnly?:boolean;embedded?:boolean}){
 const t=checkoutCopy[locale],home=`${locale==="en"?"":`/${locale}`}/shida/restaurant-orders`;
 const [session,setSession]=useState<PersonalSession|null>(null),[checked,setChecked]=useState(false),[items,setItems]=useState<Summary[]>([]),[order,setOrder]=useState<Order|null>(null),[code,setCode]=useState<string|null>(null),[destination,setDestination]=useState<Destination|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const [page,setPage]=useState(1),[total,setTotal]=useState(0),[loading,setLoading]=useState(true);
 const {request:confirm,confirmation}=useConfirmation(locale);
 const actionLock=useRef(false);
 const loadEpoch=useRef(0);
 const invalidateLoad=useCallback(()=>{++loadEpoch.current;},[]);
 const lastBinding=useRef<string|null>(null);
 const clearPrivate=()=>{setOrder(null);setItems([]);setCode(null);setDestination(null);setPage(1);setTotal(0);++loadEpoch.current;};
 const loadSession=useCallback(async()=>{try{const value=await restorePersonalSession();if(lastBinding.current&&lastBinding.current!==value.binding)clearPrivate();lastBinding.current=value.binding;setSession(value);}catch{lastBinding.current=null;clearPrivate();setSession(null);}finally{setChecked(true);}},[]);
 useEffect(()=>{queueMicrotask(()=>void loadSession());const refresh=()=>void loadSession();window.addEventListener(PERSONAL_SESSION_EVENT,refresh);window.addEventListener("focus",refresh);return()=>{window.removeEventListener(PERSONAL_SESSION_EVENT,refresh);window.removeEventListener("focus",refresh);};},[loadSession]);
 const load=useCallback(async()=>{if(!session)return;const epoch=++loadEpoch.current;const signal=AbortSignal.timeout(15000);setLoading(true);setMessage("");setCode(null);setDestination(null);try{
   if(orderRef){const value=await request(`personal/restaurant-orders/${orderRef}${receiptOnly?"/receipt":""}`,{signal},session.binding) as Order;if(lastBinding.current!==session.binding||epoch!==loadEpoch.current)return;setOrder(value);
     if(!receiptOnly&&value.state==="ready"&&value.fulfillment_method==="pickup"&&value.pickup_verification?.required){const result=await request(`personal/restaurant-orders/${orderRef}/pickup-code`,{signal},session.binding).catch(()=>null) as {pickup_code?:string}|null;if(lastBinding.current!==session.binding||epoch!==loadEpoch.current)return;if(result?.pickup_code)setCode(result.pickup_code);}
     if(!receiptOnly&&value.state==="out_for_delivery"&&value.fulfillment_method==="delivery"&&value.delivery_verification?.required){const result=await request(`personal/restaurant-orders/${orderRef}/delivery-code`,{signal},session.binding).catch(()=>null) as {delivery_code?:string}|null;if(lastBinding.current!==session.binding||epoch!==loadEpoch.current)return;if(result?.delivery_code)setCode(result.delivery_code);}
     if(!receiptOnly&&value.fulfillment_method==="delivery"&&!['completed','rejected','cancelled','expired','delivery_failed'].includes(value.state)){const result=await request(`personal/restaurant-orders/${orderRef}/destination`,{signal},session.binding).catch(()=>null) as {destination?:Destination|null}|null;if(lastBinding.current!==session.binding||epoch!==loadEpoch.current)return;setDestination(result?.destination??null);}
   }else{const result=await request(`personal/restaurant-orders?page=${page}&page_size=20`,{signal},session.binding) as {items:Summary[];total?:number};if(lastBinding.current!==session.binding||epoch!==loadEpoch.current)return;setItems(result.items);setTotal(result.total??(page*20+(result.items.length===20?1:0)));}
  }catch(error){if(lastBinding.current!==session.binding||epoch!==loadEpoch.current)return;setOrder(null);setItems([]);setMessage(error instanceof DashboardApiError&&error.status===401?t.expired:t.failed);}finally{if(epoch===loadEpoch.current)setLoading(false);}},[session,orderRef,receiptOnly,t.expired,t.failed,page]);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active)void load();});return()=>{active=false;invalidateLoad();};},[load,invalidateLoad]);
 function confirmCancellation(){
  if(!order||!session||busy)return;
  const selectedOrder=order, binding=session.binding;
  const immediate=['pending','accepted'].includes(order.state), copy=orderCancellationCopy[locale];
  const operationKey=crypto.randomUUID().replaceAll('-','');
  confirm({title:immediate?copy.cancelTitle:copy.requestTitle,description:immediate?copy.cancelHelp:copy.requestHelp,
   confirmLabel:immediate?t.cancel:t.requestCancel,cancelLabel:copy.keep,severity:'warning',errorMessage:()=>copy.failed,
   onConfirm:async()=>{
    if(lastBinding.current!==binding||actionLock.current)throw new Error('Session changed');
    actionLock.current=true;setBusy(true);setMessage('');
    const epoch=loadEpoch.current;
    try{
     const action=immediate?'cancel':'request_cancellation';
     const result=await request(`personal/restaurant-orders/${selectedOrder.order_ref}/actions/${action}`,{method:'POST',body:JSON.stringify({operation_key:operationKey,expected_revision:selectedOrder.revision})},binding) as {current_order:Order};
     if(lastBinding.current!==binding||epoch!==loadEpoch.current)throw new Error('Session changed');
     setOrder(result.current_order);
    }finally{actionLock.current=false;setBusy(false);}
   }});
 }
 const Wrapper=embedded?"div":"main";
 return <Wrapper className={embedded?"tx-embedded-order":"restaurant-public rst-checkout space-transactions"} lang={locale}><div className={embedded?undefined:"container"}>{orderRef&&!embedded&&<nav><a href={home}>{t.history}</a></nav>}{!embedded&&<h1>{orderRef?t.detail:t.history}</h1>}{message&&<p role="status" className="rst-checkout-message">{message}</p>}{!checked?<p>{t.loading}</p>:!session?<><p>{t.noAuth}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>void loadSession()}/></>:orderRef?order?<>
   {receiptOnly?<ReceiptCard order={order} locale={locale}/>:<RestaurantOrderDetail order={order} locale={locale} receiptHref={`${home}/${order.order_ref}/receipt`}>
   {code&&<section><h2>{order.fulfillment_method==="pickup"?t.pickupCode:t.deliveryCode}</h2><p className="rst-customer-code">{code}</p><p>{t.codeHelp}</p></section>}
   {order.pickup_verification&&<p>{t.pickupStatus}: {order.pickup_verification.method==="verified"?t.codeVerified:order.pickup_verification.method==="exceptional"?t.codeExceptional:t.codePending}</p>}
   {order.delivery_verification&&<p>{t.deliveryStatus}: {order.delivery_verification.method==="verified"?t.codeVerified:order.delivery_verification.method==="exceptional"?t.codeExceptional:t.codePending}</p>}
   {destination&&<section><h2>{t.address}</h2><p>{[destination.fields.street,destination.fields.building,destination.fields.landmark,destination.fields.quartier,destination.fields.commune,destination.fields.city,destination.fields.country].filter(Boolean).join(", ")}</p>{destination.delivery_instruction&&<p>{t.instruction}: {destination.delivery_instruction}</p>}</section>}
   {!receiptOnly&&(['pending','accepted'].includes(order.state)||['preparing','ready','out_for_delivery'].includes(order.state)&&!order.cancellation_pending)&&<button type="button" disabled={busy} onClick={confirmCancellation}>{['pending','accepted'].includes(order.state)?t.cancel:t.requestCancel}</button>}
   </RestaurantOrderDetail>}
   {!receiptOnly&&order.state==="completed"&&order.establishment_ref&&<RestaurantReviewForm locale={locale} establishmentRef={order.establishment_ref} establishmentName={order.receipt_terms?.establishment_name||t.order}/>}
  </>:<div role="status"><p>{loading?t.loading:t.failed}</p>{!loading&&<button onClick={()=>void load()}>{t.retry}</button>}</div>:<>{loading?<p role="status">{t.loading}</p>:message?null:items.length?<div className="transaction-list">{items.map(item=><article className="transaction-card" key={item.order_ref}><h2>{item.establishment_name||t.order}</h2><p>{t.state}: {workText(locale,item.state)} · {item.order_total} {item.currency}</p><p>{dateText(item.submitted_at,locale)}</p><a href={`${home}/${item.order_ref}`}>{t.open}</a></article>)}</div>:<TransactionEmpty locale={locale} message={t.noOrders} market="restaurants"/>}{!loading&&!message&&(items.length>0||page>1)&&<nav className="transaction-pagination"><button disabled={page===1} onClick={()=>setPage(v=>v-1)}>{mySpaceCopy[locale].previous}</button><span>{page}</span><button disabled={page*20>=total} onClick={()=>setPage(v=>v+1)}>{mySpaceCopy[locale].next}</button></nav>}</>}</div>{confirmation}</Wrapper>;
}
