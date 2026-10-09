"use client";
import { useCallback, useEffect, useState } from "react";
import { request } from "../../lib/restaurant-seller-browser";
import { restorePersonalSession, PERSONAL_SESSION_EVENT } from "../../lib/personal-session-browser";
import { restaurantReviewCopy, restaurantReviewReasons } from "../../lib/restaurant-review-copy";
import type { RestaurantLocale } from "../../services/shida/restaurants-client";

type OwnReview = {review_ref:string;rating:number;comment:string|null;status:string;revision:number};
type Eligibility = {eligible:boolean;existing_review:OwnReview|null;verification:string|null};

export function RestaurantReviewForm({locale,establishmentRef,establishmentName}:{locale:RestaurantLocale;establishmentRef:string;establishmentName:string}) {
 const t=restaurantReviewCopy[locale];
 const [binding,setBinding]=useState<string|null>(null),[eligibility,setEligibility]=useState<Eligibility|null>(null);
 const [rating,setRating]=useState(5),[comment,setComment]=useState(""),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const refresh=useCallback(async()=>{try{const session=await restorePersonalSession();setBinding(session.binding);
  const value=await request(`personal/restaurant-orders/establishments/${establishmentRef}/review-eligibility`,{},session.binding) as Eligibility;
  setEligibility(value);setRating(value.existing_review?.rating??5);setComment(value.existing_review?.comment??"");
 }catch{setBinding(null);setEligibility(null);}},[establishmentRef]);
 useEffect(()=>{void refresh();const changed=()=>void refresh();window.addEventListener(PERSONAL_SESSION_EVENT,changed);return()=>window.removeEventListener(PERSONAL_SESSION_EVENT,changed);},[refresh]);
 if(!binding||!eligibility?.eligible||eligibility.existing_review?.status==="hidden")return null;
 const own=eligibility.existing_review;
 async function save(){if(!binding||busy)return;setBusy(true);setMessage("");try{
  await request(`personal/restaurant-orders/establishments/${establishmentRef}/review`,{method:"PUT",body:JSON.stringify({rating,comment:comment.trim()||null,expected_revision:own?.revision??null})},binding);
  setEditing(false);await refresh();
 }catch{setMessage(t.failed);await refresh();}finally{setBusy(false);}}
 async function withdraw(){if(!binding||!own||busy)return;setBusy(true);setMessage("");try{
  await request(`personal/restaurant-orders/establishments/${establishmentRef}/review/withdraw`,{method:"POST",body:JSON.stringify({expected_revision:own.revision})},binding);
  setEditing(false);await refresh();
 }catch{setMessage(t.failed);await refresh();}finally{setBusy(false);}}
 return <section className="rst-card" aria-label={t.reviews}><h2>{establishmentName}</h2>
  {own?.status==="visible"&&!editing?<><p>{t.update}: {own.rating} ★{own.comment&&<> · {own.comment}</>}</p><button type="button" onClick={()=>setEditing(true)}>{t.update}</button> <button type="button" disabled={busy} onClick={()=>void withdraw()}>{t.withdraw}</button></>:
  <form onSubmit={event=>{event.preventDefault();void save();}}><h3>{own?.status==="visible"?t.update:t.leave}</h3>
   <label>{t.rating} <select value={rating} onChange={event=>setRating(Number(event.target.value))}>{[1,2,3,4,5].map(value=><option key={value} value={value}>{value} ★</option>)}</select></label>
   <label>{t.comment} <textarea maxLength={2000} value={comment} onChange={event=>setComment(event.target.value)}/></label>
   <p>{t.verified}</p><button disabled={busy} type="submit">{t.publish}</button>
  </form>}
  {message&&<p role="status">{message}</p>}
 </section>;
}

export function RestaurantReviewReport({locale,establishmentRef,reviewRef}:{locale:RestaurantLocale;establishmentRef:string;reviewRef:string}) {
 const t=restaurantReviewCopy[locale],[binding,setBinding]=useState<string|null>(null),[open,setOpen]=useState(false),[reason,setReason]=useState("inaccurate"),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{void restorePersonalSession().then(value=>setBinding(value.binding)).catch(()=>setBinding(null));},[]);
 if(!binding)return null;
 async function send(){if(!binding||busy)return;setBusy(true);try{
  await request(`personal/restaurant-orders/establishments/${establishmentRef}/reviews/${reviewRef}/report`,{method:"POST",body:JSON.stringify({reason,message:null})},binding);
  setMessage(t.reportSaved);setOpen(false);
 }catch{setMessage(t.failed);}finally{setBusy(false);}}
 return <div>{!open?<button type="button" onClick={()=>setOpen(true)}>{t.report}</button>:
  <form onSubmit={event=>{event.preventDefault();void send();}}><label>{t.report}<select value={reason} onChange={event=>setReason(event.target.value)}>{Object.entries(restaurantReviewReasons[locale]).map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label><button disabled={busy} type="submit">{t.report}</button></form>}
  {message&&<p role="status">{message}</p>}</div>;
}
