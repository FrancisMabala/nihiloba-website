"use client";
import { useCallback, useEffect, useState } from "react";
import { request } from "../../lib/restaurant-seller-browser";
import { restaurantReviewCopy, restaurantReviewReasons } from "../../lib/restaurant-review-copy";
import type { RestaurantLocale } from "../../services/shida/restaurants-client";

type Review={review_ref:string;rating:number;comment:string|null;seller_response:string|null;revision:number;verified_experience:boolean};
export function RestaurantSellerReviews({path,binding,locale}:{path:string;binding:string;locale:RestaurantLocale}){
 const t=restaurantReviewCopy[locale];
 const [page,setPage]=useState(1),[items,setItems]=useState<Review[]>([]),[total,setTotal]=useState(0),[active,setActive]=useState<string|null>(null),[response,setResponse]=useState(""),[reason,setReason]=useState("inaccurate"),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const load=useCallback(async(p:number)=>{try{const result=await request(`${path}/reviews?page=${p}&page_size=10`,{},binding) as {items:Review[];total:number};setItems(result.items);setTotal(result.total);setPage(p);}catch{setMessage(t.failed);}},[path,binding,t.failed]);
 useEffect(()=>{void load(1);},[load]);
 async function mutate(item:Review,kind:"response"|"report") {if(busy)return;setBusy(true);setMessage("");try{
  await request(`${path}/reviews/${item.review_ref}/${kind}`,{method:kind==="response"?"PUT":"POST",body:JSON.stringify(kind==="response"?{response,expected_revision:item.revision}:{reason,message:null})},binding);
  setActive(null);setResponse("");setMessage(kind==="report"?t.reportSaved:"");await load(page);
 }catch{setMessage(t.failed);await load(page);}finally{setBusy(false);}}
 return <section className="rst-card"><h2>{t.reviews}</h2>{!total&&<p>{t.noReviews}</p>}
  {items.map(item=><article key={item.review_ref} className="rst-card"><p>{item.rating} ★ · {t.reviewer}{item.verified_experience&&<> · {t.verified}</>}</p>{item.comment&&<p>{item.comment}</p>}{item.seller_response&&<p><strong>{t.response}:</strong> {item.seller_response}</p>}
   {active===item.review_ref?<><label>{t.response}<textarea maxLength={2000} value={response} onChange={event=>setResponse(event.target.value)}/></label><button type="button" disabled={busy||!response.trim()} onClick={()=>void mutate(item,"response")}>{t.publish}</button><label>{t.report}<select value={reason} onChange={event=>setReason(event.target.value)}>{Object.entries(restaurantReviewReasons[locale]).map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label><button type="button" disabled={busy} onClick={()=>void mutate(item,"report")}>{t.report}</button></>:<button type="button" onClick={()=>{setActive(item.review_ref);setResponse(item.seller_response??"");}}>{t.response}</button>}
  </article>)}
  <nav>{page>1&&<button type="button" onClick={()=>void load(page-1)}>{t.previous}</button>}{page*10<total&&<button type="button" onClick={()=>void load(page+1)}>{t.next}</button>}</nav>
  {message&&<p role="status">{message}</p>}
 </section>;
}
