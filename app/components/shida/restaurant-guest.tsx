"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { checkoutCopy } from "../../lib/restaurant-checkout-copy";
import { guestText, type GuestCopyKey } from "../../lib/restaurant-guest-copy";
import { guestReference } from "../../lib/restaurant-guest-contract";
import { emptyGuestSelections, GuestError, guestAction, guestRequest, replayGuestAction, type GuestAction, type GuestBasket, type GuestEntry, type GuestLine, type GuestSelections, type GuestVisit } from "../../lib/restaurant-guest-browser";
import {serviceText} from "../../lib/restaurant-service-copy";
import type {ServiceGroup} from "../../lib/restaurant-service-contract";
import { dateText, type Order, type Terms } from "../../lib/restaurant-work";
import { workText } from "../../lib/restaurant-work-copy";
import { FoodTerms, ReceiptCard } from "./restaurant-receipt";
import { MenuChoice } from "./restaurant-menu-choice";
import type { RestaurantLocale, RestaurantMenuItem, getRestaurantMenu } from "../../services/shida/restaurants-client";
import "./restaurant-checkout.css";
import "./restaurant-guest.css";

type Proposal={proposal_ref:string;group_ref:string;order_ref:string;group_revision:number;visit_revision:number;expires_at:string};
type Proposals={items:Proposal[];copy:Record<string,string>};
type Menu = Awaited<ReturnType<typeof getRestaurantMenu>>;
const key = () => crypto.randomUUID();
export function RestaurantGuest({locale,establishmentRef,menu:initialMenu}:{locale:RestaurantLocale;establishmentRef:string;menu:Menu|null}) {
  const t=checkoutCopy[locale], g=(k:GuestCopyKey)=>guestText(locale,k), storage=`restaurant-guest:${establishmentRef}`;
  const proposalRefs=useRef<string[]>([]);
  const [approvalNotice,setApprovalNotice]=useState('');
  const [approvalNow,setApprovalNow]=useState(()=>Date.now());
  const [proposals,setProposals]=useState<Proposals|null>(null),[serviceGroup,setServiceGroup]=useState<ServiceGroup|null>(null),[declined,setDeclined]=useState<string[]>([]);
  const st=(k:string)=>serviceText(locale,k);
  const [entry,setEntry]=useState<GuestEntry|null>(null),[visitRef,setVisitRef]=useState<string|null>(null),[visit,setVisit]=useState<GuestVisit|null>(null);
  const [basket,setBasket]=useState<GuestBasket|null>(null),[selections,setSelections]=useState<GuestSelections>(emptyGuestSelections),[labels,setLabels]=useState<Record<string,string>>({});
  const [menu,setMenu]=useState(initialMenu),[preference,setPreference]=useState(""),[windowRef,setWindowRef]=useState("");
  const [step,setStep]=useState<"edit"|"review"|"summary">("edit"),[message,setMessage]=useState(""),[pending,setPending]=useState<GuestAction|null>(null);
  const [busy,setBusy]=useState(false),[fresh,setFresh]=useState(false),[retryAt,setRetryAt]=useState(0),[forgetting,setForgetting]=useState(false);
  const [code,setCode]=useState<{order:string;revision:number;value:string}|null>(null);
  const mounted=useRef(false), generation=useRef(0), lock=useRef(false), forgettingRef=useRef(false), retryDeadline=useRef(0), activePoll=useRef(false);
  const publicRefs=useRef<{visit:string|null;basket:string|null}>({visit:null,basket:null});
  const invalidate=useCallback(()=>{generation.current++;},[]);
  const windows=entry?.methods.pickup?.windows ?? [];
  const names=new Map((menu?.items ?? []).map(i=>[i.public_ref,i.name]));
  const name=(id:string)=>names.get(id)||labels[id]||t.selected;
  function navigation(v:string|null,b:string|null) {
    publicRefs.current={visit:v,basket:b};
    try { if(v)sessionStorage.setItem(storage,JSON.stringify({visit:v,basket:b}));else sessionStorage.removeItem(storage); } catch { /* Navigation continuity is optional; no private snapshots. */ }
  }
  const clearPrivate=useCallback(()=>{
    generation.current++; publicRefs.current={visit:null,basket:null};
    try { sessionStorage.removeItem(storage); } catch {}
    proposalRefs.current=[];setApprovalNotice('');setProposals(null);setServiceGroup(null);setDeclined([]);setVisitRef(null);setVisit(null);setBasket(null);setSelections(emptyGuestSelections());setLabels({});setPreference("");setWindowRef("");setCode(null);setPending(null);setFresh(false);setStep("edit");setForgetting(false);forgettingRef.current=false;
  },[storage]);
  const handleError=useCallback((e:unknown,uncertain=false)=>{
    if(e instanceof GuestError && e.authorityRequest && [401,403,404].includes(e.status)) {clearPrivate();setMessage(guestText(locale,"lost"));return;}
    if(e instanceof GuestError && e.status===429) {const at=Date.now()+Math.max(1,e.retryAfter)*1000;retryDeadline.current=at;setRetryAt(at);setMessage(guestText(locale,"rate"));return;}
    const copy=e instanceof GuestError && e.detail==="restaurant_guest_limit" ? "limit" : e instanceof GuestError && (e.status===404 || ["restaurant_guest_closed","restaurant_intake_closed"].includes(e.detail)) ? "closed" : null;
    setMessage(copy ? guestText(locale,copy) : e instanceof GuestError && e.status===409 ? checkoutCopy[locale].changed : e instanceof GuestError && e.status===422 ? checkoutCopy[locale].unavailable : guestText(locale,uncertain ? "uncertain" : "service"));
  },[clearPrivate,locale]);
  const readEntry=useCallback(async()=>{
    try {const value=await guestRequest<GuestEntry>(establishmentRef,`/entry?language=${locale}`);
      if(!value.methods || typeof value.methods!=="object" || Array.isArray(value.methods) || value.methods.pickup && !Array.isArray(value.methods.pickup.windows) || typeof value.entry_context!=="string" || !value.copy || typeof value.copy!=="object")throw new GuestError(503,"restaurant_unavailable");
      if(mounted.current)setEntry(value);return value;
    } catch(e) {if(mounted.current)setEntry(null);throw e;}
  },[establishmentRef,locale]);
  const refresh=useCallback(async(v=publicRefs.current.visit)=>{
    if(!v || forgettingRef.current)return;
    const epoch=generation.current;
    try {
      const value=await guestRequest<GuestVisit>(establishmentRef,`/visits/${v}`);
      const proposed=await guestRequest<Proposals>(establishmentRef,'/visits/'+v+'/service-proposals?language='+locale);
      const associated=await guestRequest<{group:ServiceGroup|null}>(establishmentRef,'/visits/'+v+'/service-group');
      if(!mounted.current || generation.current!==epoch || forgettingRef.current)return;
      const refs=proposed.items.map(p=>p.proposal_ref),removed=proposalRefs.current.some(ref=>!refs.includes(ref));proposalRefs.current=refs;
      setApprovalNotice(old=>associated.group||refs.length?'':removed?serviceText(locale,'expired'):old);
      setProposals(proposed);setServiceGroup(associated.group);setApprovalNow(Date.now());
      activePoll.current=true;
      setVisit(value);setFresh(true);setCode(old=>old && value.rounds.some(o=>o.order_ref===old.order && o.revision===old.revision && o.state==="ready") ? old : null);
      return value;
    } catch(e) {if(mounted.current && generation.current===epoch){setFresh(false);setCode(null);handleError(e);}throw e;}
  },[establishmentRef,handleError,locale]);
  useEffect(()=>{
    mounted.current=true;
    let alive=true;
    void (async()=>{
      try {
        const raw=sessionStorage.getItem(storage), saved=raw ? JSON.parse(raw) as {visit?:string;basket?:string} : null;
        if(saved && guestReference(saved.visit)) {
          publicRefs.current={visit:saved.visit,basket:guestReference(saved.basket)?saved.basket:null};setVisitRef(saved.visit);
          const current=await refresh(saved.visit);
          if(alive && current && publicRefs.current.basket) {
            const b=await guestRequest<GuestBasket>(establishmentRef,`/visits/${saved.visit}/baskets/${publicRefs.current.basket}`);
            if(alive && publicRefs.current.visit===saved.visit){setBasket(b);setSelections(b.order_ref?emptyGuestSelections():b.selections);setPreference(b.order_ref?"":b.food_preference ?? "");setWindowRef(b.window_ref ?? "");setStep(b.order_ref?"summary":"edit");}
          }
        }
      } catch(e) {if(alive)handleError(e);}
      try {await readEntry();}catch(e){if(alive)handleError(e);}
    })();
    const pagehide=()=>{setCode(null);setFresh(false);};
    window.addEventListener("pagehide",pagehide);
    return()=>{alive=false;mounted.current=false;invalidate();window.removeEventListener("pagehide",pagehide);};
  },[establishmentRef,storage,refresh,readEntry,handleError,invalidate]);
  useEffect(()=>{
    if(!visitRef)return;
    let stopped=false,timer:ReturnType<typeof setTimeout>,delay=30000;
    const poll=async(force=false)=>{
      if(stopped)return;
      // A reconnect/focus during a mutation must be checked as soon as that
      // request settles. Queue only this read; never queue or replay a write.
      if(force && lock.current && !document.hidden && navigator.onLine) {timer=setTimeout(()=>void poll(true),250);return;}
      if((force || activePoll.current) && !document.hidden && navigator.onLine && !lock.current && Date.now()>=retryDeadline.current) {
        try {await refresh();await readEntry();delay=30000;}catch(e){if(mounted.current)handleError(e);delay=Math.min(120000,delay*2);}
      }
      if(!stopped)timer=setTimeout(()=>void poll(),delay);
    };
    const resume=()=>{setFresh(false);setCode(null);if(!document.hidden && navigator.onLine){clearTimeout(timer);void poll(true);}};
    const offline=()=>{setFresh(false);setCode(null);};
    timer=setTimeout(()=>void poll(),delay);
    window.addEventListener("online",resume);window.addEventListener("offline",offline);window.addEventListener("focus",resume);window.addEventListener("pageshow",resume);document.addEventListener("visibilitychange",resume);
    return()=>{stopped=true;clearTimeout(timer);window.removeEventListener("online",resume);window.removeEventListener("offline",offline);window.removeEventListener("focus",resume);window.removeEventListener("pageshow",resume);document.removeEventListener("visibilitychange",resume);};
  },[visitRef,refresh,readEntry,handleError]);
  useEffect(()=>{if(!proposals?.items.length)return;const next=Math.min(...proposals.items.map(p=>Date.parse(p.expires_at)).filter(at=>at>approvalNow));if(!Number.isFinite(next))return;const timer=setTimeout(()=>setApprovalNow(Date.now()),Math.max(0,next-Date.now()));return()=>clearTimeout(timer);},[proposals,approvalNow]);
  useEffect(()=>{if(!retryAt)return;const timer=setTimeout(()=>setRetryAt(0),Math.max(0,retryAt-Date.now()));return()=>clearTimeout(timer);},[retryAt]);
  useEffect(()=>{if(!pending)return;const warn=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[pending]);

  async function adopt(action:GuestAction,value:unknown) {
    if(action.method==="DELETE") {clearPrivate();setMessage(g("lost"));return;}
    if(action.path.endsWith("/visits")) {
      const v=value as GuestVisit; navigation(v.visit_ref,null);setVisitRef(v.visit_ref);await refresh(v.visit_ref);return;
    }
    if(action.path.endsWith("/baskets")) {
      const b=value as GuestBasket;navigation(publicRefs.current.visit,b.basket_ref);setBasket(b);setSelections(b.selections);setPreference("");setWindowRef("");setStep("edit");return;
    }
    if(action.path.includes("/baskets/") && !action.path.endsWith("/submit")) {
      const b=(value as {basket:GuestBasket}).basket;setBasket(b);setSelections(b.selections);setPreference(b.food_preference ?? "");setStep(action.path.endsWith("/quote")?"review":"edit");return;
    }
    if(action.path.endsWith("/submit")) {
      const order=(value as {current_order:Order}).current_order;
      // The submit response already confirms this immutable round, even if a
      // later summary read fails. Totals wait for their server projection.
      setFresh(false);setVisit(old=>old?{...old,rounds:old.rounds.some(o=>o.order_ref===order.order_ref)?old.rounds.map(o=>o.order_ref===order.order_ref?order:o):[...old.rounds,order]}:null);
      setStep("summary");setBasket(null);setSelections(emptyGuestSelections());setPreference("");navigation(publicRefs.current.visit,null);
    }
    setCode(null);await refresh();
  }
  async function mutate(action:GuestAction,replay=false):Promise<unknown> {
    const epoch=generation.current;
    let confirmed=false;
    setPending(action);setMessage("");
    try {
      const result=replay ? await replayGuestAction(establishmentRef,publicRefs.current.visit!,action) : await guestRequest(establishmentRef,action.path,{method:action.method,body:action.body});
      if(!mounted.current || generation.current!==epoch)return;
      confirmed=true;
      setPending(null);await adopt(action,result);return result;
    } catch(e) {
      if(!mounted.current || generation.current!==epoch)return;
      if(action.path.endsWith("/visits") && (!(e instanceof GuestError) || e.status>=500)) {setPending(null);setEntry(null);setMessage(g("creationLost"));return;}
      if(action.path.endsWith("/visits"))setPending(null);
      if(e instanceof GuestError && e.status<500 && e.status!==429) {
        setPending(null);
        if(e.status===409 || e.status===422){setBasket(old=>old?{...old,quote:null,quote_ref:null}:null);setStep("edit");if(publicRefs.current.visit)void refresh().catch(()=>{});void readEntry().catch(()=>{});}
      }
      handleError(e,!confirmed);
      if(action.path.endsWith('/approve')&&e instanceof GuestError&&e.status===409)setMessage(serviceText(locale,'expired'));
    }
  }
  async function work(fn:()=>Promise<void>) {
    if(lock.current || Date.now()<retryDeadline.current || !navigator.onLine)return;
    lock.current=true;setBusy(true);
    try {await fn();}catch(e){handleError(e);}finally{lock.current=false;if(mounted.current)setBusy(false);}
  }
  async function start() {
    await work(async()=>{
      const current=await readEntry();if(!current.methods.pickup?.windows.length){setMessage(t.noWindow);return;}
      await mutate(guestAction("/visits","POST",{entry_context:current.entry_context}));
      if(publicRefs.current.visit)await mutate(guestAction(`/visits/${publicRefs.current.visit}/baskets`,"POST",{operation_key:key()}));
    });
  }
  function add(item:RestaurantMenuItem,plate:number|null,quantity:number,amount:string) {
    if(blocked)return;
    if(item.pricing_model==="UNIT_PRICED" && (!Number.isSafeInteger(quantity) || quantity<1 || quantity>1000)){setMessage(t.unavailable);return;}
    if(item.pricing_model==="AMOUNT_PRICED" && !/^\d{1,16}(?:[.,]\d{1,2})?$/.test(amount.trim())){setMessage(t.amountHelp);return;}
    const line:GuestLine={key:key(),item_ref:item.public_ref,...(item.pricing_model==="UNIT_PRICED"?{quantity}:{selected_amount:amount.trim().replace(",",".")})};
    const next=plate===null ? {...selections,standalone:[...selections.standalone,line]} : {...selections,plates:plate<0?[...selections.plates,{key:key(),components:[line]}]:selections.plates.map((p,i)=>i===plate?{...p,components:[...p.components,line]}:p)};
    if(next.standalone.length>50 || next.plates.length>20 || next.plates.some(p=>p.components.length>20)){setMessage(g("limit"));return;}
    setLabels({...labels,[item.public_ref]:item.name||t.selected});setSelections(next);setBasket(b=>b?{...b,quote:null,quote_ref:null}:null);
  }
  async function quote() {
    if(!basket || !windowRef)return;
    await work(async()=>{
      const path=`/visits/${visitRef}/baskets/${basket.basket_ref}`;
      // Reread revision before a new explicit action; retain local public choices.
      const current=await guestRequest<GuestBasket>(establishmentRef,path);
      if(current.order_ref){setStep("summary");setBasket(null);await refresh();return;}
      const edited=await mutate(guestAction(path,"PATCH",{operation_key:key(),expected_revision:current.revision,selections,fulfillment_method:"pickup",window_ref:windowRef,food_preference:preference||null})) as {basket:GuestBasket}|undefined;
      if(edited)await mutate(guestAction(`${path}/quote`,"POST",{operation_key:key(),expected_revision:edited.basket.revision,selections:edited.basket.selections,fulfillment_method:"pickup",window_ref:windowRef}));
    });
  }
  async function showCode(order:Order) {
    await work(async()=>{
      const epoch=generation.current;setCode(null);
      const current=await guestRequest<Order>(establishmentRef,`/visits/${visitRef}/orders/${order.order_ref}`);
      await refresh();if(current.state!=="ready" || generation.current!==epoch)return;
      const result=await guestRequest<{pickup_code:string}>(establishmentRef,`/visits/${visitRef}/orders/${order.order_ref}/pickup-code`);
      if(mounted.current && generation.current===epoch && /^[0-9]{6}$/.test(result.pickup_code))setCode({order:order.order_ref,revision:current.revision,value:result.pickup_code});
    });
  }
  async function pageMenu(page:number) {
    await work(async()=>{
      const response=await fetch(`/api/shida/restaurant-menus/${establishmentRef}?language=${locale}&page=${page}`,{cache:"no-store",credentials:"omit"});
      if(!response.ok)throw new GuestError(response.status,"restaurant_unavailable");
      const value=await response.json() as Menu; if(mounted.current)setMenu(value);
    });
  }
  const blocked=busy || !!pending || !fresh || !!retryAt || !windows.length || !visit?.can_add_round;
  const quotedWindow=basket?.quote?.pickup_window as {starts_at?:string;ends_at:string;timezone_name?:string}|undefined;
  const pickupPoint=(basket?.quote as (Terms&{pickup_location?:string})|null)?.pickup_location;
  const lines=(list:GuestLine[])=><ul>{list.map(l=><li key={l.key}><span>{name(l.item_ref)} · {l.quantity ?? l.selected_amount}</span><button disabled={blocked} onClick={()=>{setSelections(s=>({standalone:s.standalone.filter(x=>x.key!==l.key),plates:s.plates.map(p=>({...p,components:p.components.filter(x=>x.key!==l.key)})).filter(p=>p.components.length)}));setBasket(b=>b?{...b,quote:null,quote_ref:null}:null);}}>{t.remove}</button></li>)}</ul>;
  return <section id="guest-order" className="rst-checkout rst-guest" lang={locale} aria-label={g("title")}>
    <h2>{g("title")}</h2><p>{entry?.copy.restaurant_guest_intro}</p><p>{entry?.copy.restaurant_guest_privacy || g("privacy")}</p><p>{entry?.copy.restaurant_guest_payment || g("payment")}</p>
    {message && <p role="status">{message}</p>}
    {!visitRef && <><button disabled={busy||!!retryAt} onClick={()=>void work(async()=>{try{await readEntry();setMessage("");}catch(e){handleError(e);}})}>{t.refresh}</button>{entry && (windows.length?<button disabled={busy||!!retryAt} onClick={()=>void start()}>{g("start")}</button>:<p role="status">{t.noWindow}</p>)}</>}
    {visitRef && !fresh && <p role="status">{g("stale")}</p>}
    {pending && <><p>{g("uncertain")}</p><button disabled={busy||!!retryAt} onClick={()=>void work(async()=>{await mutate(pending,true);})}>{g("retry")}</button></>}
    {visitRef && !forgetting && <>
      <button disabled={busy||!!retryAt} onClick={()=>void work(async()=>{await refresh();await readEntry();setMessage("");})}>{t.refresh}</button>
      {entry && !windows.length && <p role="status">{t.noWindow}</p>}
      {visit && !visit.can_add_round && <p role="status">{entry?.copy.restaurant_guest_closed || g("limit")}</p>}
      {basket && step!=="summary" && <>
        {step==="edit" && <>{!menu && <p>{t.failed} <button disabled={blocked} onClick={()=>void pageMenu(1)}>{t.retry}</button></p>}<div className="rst-checkout-items">{menu?.items.map(item=><MenuChoice key={item.public_ref} item={item} locale={locale} selections={selections} busy={blocked} onAdd={(plate,quantity,amount)=>add(item,plate,quantity,amount)}/>)}</div>
          {menu && <nav aria-label={g("next")}>{menu.page>1 && <button disabled={blocked} onClick={()=>void pageMenu(menu.page-1)}>{t.back}</button>}{menu.total>menu.page*menu.page_size && <button disabled={blocked} onClick={()=>void pageMenu(menu.page+1)}>{g("next")}</button>}</nav>}
          <h3>{t.basket}</h3>{lines(selections.standalone)}{selections.plates.map((p,i)=><section key={p.key}><h4>{t.plate} {i+1}</h4>{lines(p.components)}</section>)}
          <label>{t.window}<select disabled={blocked} value={windowRef} onChange={e=>setWindowRef(e.target.value)}><option value="">{t.choose}</option>{windows.map(w=><option key={w.public_ref} value={w.public_ref}>{dateText(w.starts_at,locale,w.timezone_name)} – {dateText(w.ends_at,locale,w.timezone_name)}</option>)}</select></label>
          <label>{t.preference}<textarea disabled={blocked} maxLength={400} value={preference} onChange={e=>setPreference(e.target.value)}/></label>
          <button disabled={blocked||!windowRef||!(selections.standalone.length||selections.plates.length)} onClick={()=>void quote()}>{t.quote}</button>
        </>}
        {step==="review" && basket.quote && <><h3>{t.review}</h3><FoodTerms terms={basket.quote} locale={locale}/>{quotedWindow && <p>{t.pickup} · {dateText(quotedWindow.starts_at,locale,quotedWindow.timezone_name)} – {dateText(quotedWindow.ends_at,locale,quotedWindow.timezone_name)}</p>}{pickupPoint && <p>{t.onPremise}: {pickupPoint}</p>}<p>{t.offered} {g("payment")}</p><button disabled={busy||!!pending} onClick={()=>{setStep("edit");setBasket(b=>b?{...b,quote:null,quote_ref:null}:null);}}>{t.update}</button><button disabled={blocked} onClick={()=>void work(async()=>{await mutate(guestAction(`/visits/${visitRef}/baskets/${basket.basket_ref}/submit`,"POST",{operation_key:key(),expected_revision:basket.revision,quote_ref:basket.quote_ref,confirm:true}));})}>{t.confirm}</button></>}
      </>}
      {proposals&&<section aria-label={st('propose')}>
        {approvalNotice&&<p role="status">{approvalNotice}</p>}
        {proposals.items.filter(p=>!declined.includes(p.proposal_ref)).map(p=><article key={p.proposal_ref}>
          <p>{proposals.copy.restaurant_service_approval||st('approval')}</p><p>{t.orderRef}: {p.order_ref}</p><p>{Date.parse(p.expires_at)<=approvalNow?st('expired'):st('pending')+' '+dateText(p.expires_at,locale)}</p>
          <button disabled={busy||!!pending||!fresh||!!retryAt||Date.parse(p.expires_at)<=approvalNow} onClick={()=>void work(async()=>{await mutate(guestAction('/visits/'+visitRef+'/service-proposals/'+p.proposal_ref+'/approve','POST',{operation_key:key(),group_revision:p.group_revision,visit_revision:p.visit_revision,confirm:true}));})}>{st('approve')}</button>
          <button disabled={busy||!!pending} onClick={()=>{setDeclined(old=>[...old,p.proposal_ref]);setMessage(st('declined'));}}>{st('decline')}</button>
        </article>)}
      </section>}
      {serviceGroup&&<section aria-label={st('groups')}><h3>{st('confirmed')}</h3><p>{st('rounds')}</p>{!serviceGroup.can_add_round&&<p>{st('closed')}</p>}
        {serviceGroup.rounds.map(r=><article className="rst-guest-round" key={r.order_ref}><p>{r.entry_source==='assisted'?proposals?.copy.restaurant_service_staff_round||st('staffRound'):st('guestRound')} · {r.order_ref}</p><p>{workText(locale,r.state)} · {r.amount} {r.currency}</p>{r.cancellation_pending&&<p>{workText(locale,'cancellation')}</p>}</article>)}
      </section>}
      {visit && <section aria-label={g("summary")}><h3>{g("summary")}</h3><p>{g("amounts")}</p>{fresh && <dl className="rst-guest-totals">{(["completed","active","excluded"] as const).map(kind=><div key={kind}><dt>{g(kind)}</dt><dd>{visit.totals[kind].CDF} CDF · {visit.totals[kind].USD} USD</dd></div>)}</dl>}
        {visit.rounds.map(order=><section key={order.order_ref} className="rst-guest-round" aria-label={`${t.orderRef} ${order.order_ref}`}><ReceiptCard order={order} locale={locale}/>{order.cancellation_pending && <p>{workText(locale,"cancellation")}</p>}
          {order.entry_source!=="assisted" && !order.cancellation_pending && ["pending","accepted","preparing","ready"].includes(order.state) && <button disabled={busy||!!pending||!fresh||!!retryAt} onClick={()=>void work(async()=>{const action=["pending","accepted"].includes(order.state)?"cancel":"request_cancellation";await mutate(guestAction(`/visits/${visitRef}/orders/${order.order_ref}/${action}`,"POST",{operation_key:key(),expected_revision:order.revision,...(action==="cancel"?{reason:"customer_cancelled"}:{})}));})}>{["pending","accepted"].includes(order.state)?t.cancel:t.requestCancel}</button>}
          {order.entry_source!=="assisted"&&<p>{g("proof")}</p>}{order.entry_source!=="assisted"&&order.state==="ready" && <button disabled={busy||!!pending||!fresh||!!retryAt} onClick={()=>void showCode(order)}>{t.pickupCode}</button>}
          {fresh && order.state==="ready" && code?.order===order.order_ref && code.revision===order.revision && <p className="rst-guest-code">{t.pickupCode}: <strong>{code.value}</strong></p>}
        </section>)}
        <p>{g("until")}: {dateText(visit.order_until,locale)} · {g("access")}: {dateText(visit.access_until,locale)}</p>
      </section>}
      {(!basket||step==="summary") && <button disabled={blocked} onClick={()=>void work(async()=>{await refresh();await readEntry();await mutate(guestAction(`/visits/${visitRef}/baskets`,"POST",{operation_key:key()}));})}>{g("more")}</button>}
      <button disabled={busy||!!pending||!fresh||!!retryAt} onClick={()=>{if(window.confirm(g("closeWarning")))void work(async()=>{await mutate(guestAction(`/visits/${visitRef}/close`,"POST"));});}}>{g("close")}</button>
      <button disabled={busy||!!pending||!!retryAt} onClick={()=>{if(window.confirm(g("forgetWarning")))void work(async()=>{invalidate();forgettingRef.current=true;setForgetting(true);proposalRefs.current=[];setApprovalNotice('');setProposals(null);setServiceGroup(null);setDeclined([]);setVisit(null);setBasket(null);setSelections(emptyGuestSelections());setPreference("");setWindowRef("");setLabels({});setCode(null);await mutate(guestAction(`/visits/${visitRef}`,"DELETE"));});}}>{g("forget")}</button>
    </>}
  </section>;
}
