"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { checkoutCopy } from "../../lib/restaurant-checkout-copy";
import { DashboardApiError, request } from "../../lib/restaurant-seller-browser";
import { restorePersonalSession, PERSONAL_SESSION_EVENT, type PersonalSession } from "../../lib/personal-session-browser";
import { PersonalWhatsAppLogin } from "./personal-whatsapp-login";
import { FoodTerms } from "./restaurant-receipt";
import type { Terms } from "../../lib/restaurant-work";
import type { Restaurant, RestaurantLocale, RestaurantMenuItem, RestaurantWebOptions } from "../../services/shida/restaurants-client";
import { MenuChoice } from "./restaurant-menu-choice";
import "./restaurant-checkout.css";

type Line = { key:string; item_ref:string; quantity?:number; selected_amount?:string };
type Selections = { standalone:Line[]; plates:{key:string;components:Line[]}[] };
type Basket = {basket_ref:string;establishment_ref?:string;channel:string;revision:number;selections:Selections;quote:Terms|null;quote_ref:string|null;order_ref:string|null;food_preference:string|null;fulfillment_method:string|null;window_ref:string|null};
type Submission = { basket_ref:string; method:"pickup"|"delivery"; operation_key:string; expected_revision:number; quote_ref:string; confirm:true };
const empty = ():Selections => ({standalone:[],plates:[]});
const hasFood = (s:Selections) => !!(s.standalone.length || s.plates.length);
const ref = () => crypto.randomUUID().replaceAll("-", "");
const safe = (value:unknown):value is Selections => !!value && typeof value === "object" && Array.isArray((value as Selections).standalone) && Array.isArray((value as Selections).plates);
const money = (value:string) => /^\d{1,16}(?:[.,]\d{1,2})?$/.test(value.trim()) ? value.trim().replace(",", ".") : null;

export function RestaurantCheckout({locale,establishment,options,menu}:{locale:RestaurantLocale;establishment:Restaurant;options:RestaurantWebOptions;menu:Awaited<ReturnType<typeof import("../../services/shida/restaurants-client").getRestaurantMenu>>|null}) {
 const t=checkoutCopy[locale], base=`${locale==="en"?"":`/${locale}`}/shida/restaurants/${establishment.public_ref}`;
 const path="personal/restaurant-orders", prefix=`shida-restaurant-web:${establishment.public_ref}:`;
 const [session,setSession]=useState<PersonalSession|null>(null),[checked,setChecked]=useState(false);
 const [basket,setBasket]=useState<Basket|null>(null),[selections,setSelections]=useState<Selections>(empty),[labels,setLabels]=useState<Record<string,string>>({});
 const [method,setMethod]=useState<"pickup"|"delivery">(options.pickup?"pickup":"delivery"),[windowRef,setWindowRef]=useState(""),[areaIndex,setAreaIndex]=useState(0);
 const [preference,setPreference]=useState(""),[instruction,setInstruction]=useState(""),[address,setAddress]=useState({street:"",building:"",landmark:""});
 const [destinationSaved,setDestinationSaved]=useState(false),[step,setStep]=useState<"menu"|"basket"|"fulfillment"|"review"|"submitted">("menu");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[orderRef,setOrderRef]=useState<string|null>(null),[pending,setPending]=useState<Submission|null>(null);
 const lock=useRef(false),lastBinding=useRef<string|null>(null);
 const itemMap=new Map((menu?.items??[]).map(item=>[item.public_ref,item]));
 const selectedName=(id:string)=>itemMap.get(id)?.name||labels[id]||t.selected;
 const saveDraft=(next:Selections)=>{try{sessionStorage.setItem(prefix+"selections",JSON.stringify(next));}catch{ /* Optional pre-auth continuity. */ }};
 const adopt=()=>{try{const active=sessionStorage.getItem("shida-restaurant-active");if(active&&active!==establishment.public_ref){if(!window.confirm(t.confirmReplace))return false;for(const suffix of ["selections","labels","basket","create","submit"])sessionStorage.removeItem(`shida-restaurant-web:${active}:${suffix}`);}sessionStorage.setItem("shida-restaurant-active",establishment.public_ref);}catch{}return true;};
 const explain=(error:unknown)=>error instanceof DashboardApiError ? error.status===401?t.expired:error.detail==="restaurant_order_item_unavailable"?`${t.unavailable}${error.itemRef?` ${selectedName(error.itemRef)}`:""}`:error.detail==="restaurant_quote_changed"?`${t.changed}${error.changedItems?.length?` ${error.changedItems.map(selectedName).join(", ")}`:""}`:error.status===409?t.changed:error.status===422?t.unavailable:t.problem:t.problem;
 const perform=useCallback(async <T,>(suffix:string,method="GET",body?:unknown,binding=session?.binding):Promise<T>=>{
   if(!binding)throw new Error("auth");
   return await request(`${path}${suffix}`,{method,body:body===undefined?undefined:JSON.stringify(body)},binding) as T;
 },[session?.binding]);
 const loadSession=useCallback(async()=>{try{const value=await restorePersonalSession();if(lastBinding.current&&lastBinding.current!==value.binding){setBasket(null);setSelections(empty());setPending(null);try{for(const suffix of ["basket","selections","submit","create"])sessionStorage.removeItem(prefix+suffix);}catch{}}lastBinding.current=value.binding;setSession(value);}catch{setSession(null);}finally{setChecked(true);}},[prefix]);
 useEffect(()=>{try{const raw=sessionStorage.getItem(prefix+"selections");if(raw){const parsed:unknown=JSON.parse(raw);if(safe(parsed))setSelections(parsed);}const names=sessionStorage.getItem(prefix+"labels");if(names)setLabels(JSON.parse(names) as Record<string,string>);const uncertain=sessionStorage.getItem(prefix+"submit");if(uncertain)setPending(JSON.parse(uncertain) as Submission);}catch{}void loadSession();const changed=()=>void loadSession();window.addEventListener(PERSONAL_SESSION_EVENT,changed);window.addEventListener("focus",changed);return()=>{window.removeEventListener(PERSONAL_SESSION_EVENT,changed);window.removeEventListener("focus",changed);};},[loadSession,prefix]);
 useEffect(()=>{if(!session)return;let alive=true;const stored=(()=>{try{return sessionStorage.getItem(prefix+"basket");}catch{return null;}})();if(!stored)return;void perform<Basket>(`/baskets/${stored}`,"GET",undefined,session.binding).then(value=>{if(!alive)return;if(value.channel!=="web"||value.establishment_ref!==establishment.public_ref)throw new Error("wrong basket");setBasket(value);setSelections(value.selections);saveDraft(value.selections);setPreference(value.food_preference||"");if(value.fulfillment_method==="delivery")setMethod("delivery");if(value.window_ref)setWindowRef(value.window_ref);if(value.order_ref){setOrderRef(value.order_ref);setStep("submitted");}}).catch(()=>{if(alive){setBasket(null);try{sessionStorage.removeItem(prefix+"basket");}catch{}}});return()=>{alive=false;};},[session?.binding,prefix,perform,establishment.public_ref]);
 async function ensureBasket(current:Selections):Promise<Basket>{
   if(basket)return basket;
   if(!session)throw new Error("auth");
   let key:string;try{key=sessionStorage.getItem(prefix+"create")||ref();sessionStorage.setItem(prefix+"create",key);}catch{key=ref();}
   const value=await perform<Basket>("/baskets","POST",{establishment_ref:establishment.public_ref,operation_key:key});
   if(value.channel!=="web")throw new Error("wrong channel");
   try{sessionStorage.setItem(prefix+"basket",value.basket_ref);sessionStorage.removeItem(prefix+"create");}catch{}
   setBasket(value);
   if(!hasFood(current))return value;
   const changed=await perform<{basket:Basket}>(`/baskets/${value.basket_ref}`,"PATCH",{operation_key:ref(),expected_revision:value.revision,selections:current,fulfillment_method:method,window_ref:windowRef||null});
   setBasket(changed.basket);return changed.basket;
 }
 async function update(next:Selections){
   if(lock.current)return;lock.current=true;setBusy(true);setMessage("");
   try{
     if(!session){setSelections(next);saveDraft(next);return;}
     const current=await ensureBasket(empty());
     const result=await perform<{basket:Basket}>(`/baskets/${current.basket_ref}`,"PATCH",{operation_key:ref(),expected_revision:current.revision,selections:next,fulfillment_method:method,window_ref:windowRef||null,food_preference:preference||null});
     setBasket(result.basket);setSelections(next);saveDraft(next);setStep("basket");
   }catch(error){setMessage(explain(error));}finally{lock.current=false;setBusy(false);}
 }
 function remember(item:RestaurantMenuItem){const next={...labels,[item.public_ref]:item.name||t.selected};setLabels(next);try{sessionStorage.setItem(prefix+"labels",JSON.stringify(next));}catch{}}
 function add(item:RestaurantMenuItem, plate:number|null, quantity:number, amount:string){
   if(!adopt())return;
   if(item.availability!=="available"||item.pricing_model==="UNKNOWN")return;
   const line:Line={key:ref(),item_ref:item.public_ref,...(item.pricing_model==="UNIT_PRICED"?{quantity}:{selected_amount:money(amount)||"0"})};
   if(item.pricing_model==="AMOUNT_PRICED"&&!money(amount)){setMessage(t.amountHelp);return;}
   remember(item);
   const next:Selections=plate===null?{...selections,standalone:[...selections.standalone,line]}:{...selections,plates:plate<0?[...selections.plates,{key:ref(),components:[line]}]:selections.plates.map((p,i)=>i===plate?{...p,components:[...p.components,line]}:p)};
   void update(next);
 }
 function remove(key:string){const next={standalone:selections.standalone.filter(l=>l.key!==key),plates:selections.plates.map(p=>({...p,components:p.components.filter(l=>l.key!==key)})).filter(p=>p.components.length)};void update(next);}
 function changeLine(line:Line,quantity:number,amount:string){const replacement:Line={...line,...(line.quantity!==undefined?{quantity}:{selected_amount:money(amount)||line.selected_amount})};const next={standalone:selections.standalone.map(l=>l.key===line.key?replacement:l),plates:selections.plates.map(p=>({...p,components:p.components.map(l=>l.key===line.key?replacement:l)}))};void update(next);}
 async function quote(){if(lock.current||!hasFood(selections))return;lock.current=true;setBusy(true);setMessage("");try{
    if(!session){setMessage(t.signInFirst);return;}
    let current=await ensureBasket(selections);
    const edited=await perform<{basket:Basket}>(`/baskets/${current.basket_ref}`,"PATCH",{operation_key:ref(),expected_revision:current.revision,selections,fulfillment_method:method,window_ref:windowRef||null,food_preference:preference||null});current=edited.basket;setBasket(current);
    if(method==="delivery"){
      const area=options.delivery?.areas[areaIndex];if(!area)throw new Error("area");
      const result=await perform<{revision:number}>(`/baskets/${current.basket_ref}/destination`,"PUT",{operation_key:ref(),expected_revision:current.revision,confirm:true,fields:{country:area.country,city:area.city,commune:area.commune,quartier:area.quartier,street:address.street||null,building:address.building||null,landmark:address.landmark||null},delivery_instruction:instruction||null});
      current={...current,revision:result.revision};setDestinationSaved(true);
    }
    const quoted=await perform<{basket:Basket}>(`/baskets/${current.basket_ref}/quote`,"POST",{operation_key:ref(),expected_revision:current.revision,selections,fulfillment_method:method,window_ref:windowRef});
    setBasket(quoted.basket);setStep("review");
   }catch(error){setMessage(explain(error));if(error instanceof DashboardApiError&&error.status===409)setStep("basket");}finally{lock.current=false;setBusy(false);}}
 async function recoverSubmission(value:Submission){if(!session)return;setMessage(t.pendingAction);try{let found:string;
   try{const outcome=await perform<{operation_outcome:{order_ref:string}}>(`/establishments/${establishment.public_ref}/operations/recover`,"POST",{target_ref:value.basket_ref,kind:value.method==="pickup"?"submit":"delivery_submit",operation_key:value.operation_key});found=outcome.operation_outcome.order_ref;}
   catch(error){if(!(error instanceof DashboardApiError)||error.detail!=="restaurant_operation_expired")throw error;
     const retried=await perform<{current_order:{order_ref:string}}>(`/baskets/${value.basket_ref}/submit/${value.method}`,"POST",{operation_key:value.operation_key,expected_revision:value.expected_revision,quote_ref:value.quote_ref,confirm:true});found=retried.current_order.order_ref;}
   setOrderRef(found);setStep("submitted");setPending(null);setAddress({street:"",building:"",landmark:""});setInstruction("");try{sessionStorage.removeItem(prefix+"submit");}catch{}setMessage(t.pending);
  }catch(error){if(error instanceof DashboardApiError&&(error.status===409||error.status===422)){try{const current=await perform<Basket>(`/baskets/${value.basket_ref}`);setBasket(current);if(current.order_ref){setOrderRef(current.order_ref);setStep("submitted");setPending(null);try{sessionStorage.removeItem(prefix+"submit");}catch{}setMessage(t.pending);return;}}catch{}setPending(null);try{sessionStorage.removeItem(prefix+"submit");}catch{}setStep("basket");setMessage(explain(error));return;}setMessage(t.problem);}}
 async function confirm(){if(lock.current||!basket?.quote_ref||!basket.quote||!session)return;lock.current=true;setBusy(true);setMessage("");const envelope:Submission=pending??{basket_ref:basket.basket_ref,method,operation_key:ref(),expected_revision:basket.revision,quote_ref:basket.quote_ref,confirm:true};setPending(envelope);try{sessionStorage.setItem(prefix+"submit",JSON.stringify(envelope));}catch{}
   try{const value=await perform<{current_order:{order_ref:string;state:string}}>(`/baskets/${envelope.basket_ref}/submit/${envelope.method}`,"POST",{operation_key:envelope.operation_key,expected_revision:envelope.expected_revision,quote_ref:envelope.quote_ref,confirm:true});setOrderRef(value.current_order.order_ref);setStep("submitted");setAddress({street:"",building:"",landmark:""});setInstruction("");setPending(null);try{sessionStorage.removeItem(prefix+"submit");}catch{}setMessage(t.pending);}
   catch(error){if(error instanceof DashboardApiError&&(error.status===409||error.status===422)){if(error.status===409)try{const current=await perform<Basket>(`/baskets/${envelope.basket_ref}`);setBasket(current);if(current.order_ref){setOrderRef(current.order_ref);setStep("submitted");setPending(null);try{sessionStorage.removeItem(prefix+"submit");}catch{}return;}}catch{}setPending(null);try{sessionStorage.removeItem(prefix+"submit");}catch{}setStep("basket");setMessage(explain(error));}else if(error instanceof DashboardApiError&&error.status===401){setMessage(t.expired);}else await recoverSubmission(envelope);}
   finally{lock.current=false;setBusy(false);}}
 const displayLine=(line:Line)=><li key={line.key}><span>{selectedName(line.item_ref)} · {line.quantity??line.selected_amount}</span> <button type="button" disabled={busy} onClick={()=>remove(line.key)}>{t.remove}</button>{line.quantity!==undefined&&<button type="button" disabled={busy} onClick={()=>changeLine(line,line.quantity!+1,"")}>+</button>}{line.quantity!==undefined&&line.quantity>1&&<button type="button" disabled={busy} onClick={()=>changeLine(line,line.quantity!-1,"")}>−</button>}{line.selected_amount!==undefined&&<label>{t.amount}<input inputMode="decimal" defaultValue={line.selected_amount} aria-label={`${selectedName(line.item_ref)} ${t.amount}`} onBlur={event=>{if(event.target.value!==line.selected_amount)changeLine(line,0,event.target.value);}}/></label>}</li>;
 return <main className="restaurant-public rst-checkout" lang={locale}><div className="container"><nav><a href={`${base}/menu`}>{t.back}</a> · <a href={`${locale==="en"?"":`/${locale}`}/shida/restaurant-orders`}>{t.history}</a></nav><h1>{establishment.name} · {t.order}</h1><p>{t.offered}</p>
  {message&&<p role="status" className="rst-checkout-message">{message}</p>}
  {pending&&<button type="button" disabled={busy||!session} onClick={()=>void recoverSubmission(pending)}>{t.submitRecover}</button>}
  {step==="menu"&&<><h2>{t.order}</h2>{menu?.items.length? <div className="rst-checkout-items">{menu.items.map(item=><MenuChoice key={item.public_ref} item={item} locale={locale} selections={selections} busy={busy} onAdd={(plate,quantity,amount)=>add(item,plate,quantity,amount)}/>)}</div>:<p role="status">{t.failed}</p>}{menu&&menu.total>menu.page*menu.page_size&&<a href={`${base}/order?page=${menu.page+1}`}>{t.continue}</a>}{menu&&menu.page>1&&<a href={`${base}/order?page=${menu.page-1}`}>{t.back}</a>}<button type="button" disabled={!hasFood(selections)||busy} onClick={()=>setStep("basket")}>{t.basket}</button></>}
  {(step==="basket"||step==="fulfillment")&&<section><h2>{t.basket}</h2>{!hasFood(selections)&&<p>{t.empty}</p>}{selections.standalone.length>0&&<ul>{selections.standalone.map(displayLine)}</ul>}{selections.plates.map((plate,i)=><section key={plate.key}><h3>{t.plate} {i+1}</h3><ul>{plate.components.map(displayLine)}</ul></section>)}<button type="button" onClick={()=>setStep("menu")}>{t.add}</button></section>}
  {step==="basket"&&<button type="button" disabled={!hasFood(selections)} onClick={()=>setStep("fulfillment")}>{t.continue}</button>}
  {step==="fulfillment"&&<section><h2>{t.review}</h2>{!checked?<p>{t.loading}</p>:!session?<><p>{t.signIn}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>void loadSession()}/></>:<>
    <fieldset disabled={busy}><legend>{t.choose}</legend>{options.pickup&&<label><input type="radio" name="fulfillment" checked={method==="pickup"} onChange={()=>{setMethod("pickup");setWindowRef("");}}/>{t.pickup}</label>}{options.delivery&&<label><input type="radio" name="fulfillment" checked={method==="delivery"} onChange={()=>{setMethod("delivery");setWindowRef("");}}/>{t.delivery}</label>}</fieldset>
    {method==="delivery"&&options.delivery&&<><label>{t.area}<select value={areaIndex} onChange={e=>setAreaIndex(Number(e.target.value))}>{options.delivery.areas.map((area,i)=><option key={i} value={i}>{[area.city,area.commune,area.quartier].filter(Boolean).join(", ")}</option>)}</select></label><p>{t.fee}: {options.delivery.fee.amount} {options.delivery.fee.currency}</p><fieldset><legend>{t.address}</legend><p>{t.addressPrivate}</p>{(["street","building","landmark"] as const).map(field=><label key={field}>{t[field]}<input value={address[field]} onChange={e=>setAddress({...address,[field]:e.target.value})} maxLength={200}/></label>)}<label>{t.instruction}<textarea value={instruction} onChange={e=>setInstruction(e.target.value)} maxLength={400}/></label></fieldset></>}
    <label>{t.window}<select value={windowRef} onChange={e=>setWindowRef(e.target.value)}><option value="">{t.choose}</option>{(method==="pickup"?options.pickup?.windows:options.delivery?.windows)?.map(window=><option key={window.public_ref} value={window.public_ref}>{new Intl.DateTimeFormat(locale==="ln"?"fr":locale,{dateStyle:"medium",timeStyle:"short"}).format(new Date(window.starts_at))} – {new Intl.DateTimeFormat(locale==="ln"?"fr":locale,{timeStyle:"short"}).format(new Date(window.ends_at))}</option>)}</select></label>
    <label>{t.preference}<textarea value={preference} onChange={e=>setPreference(e.target.value)} maxLength={400}/></label>
    <button type="button" disabled={busy||!windowRef||(method==="delivery"&&!((address.street&&address.building)||address.landmark))} onClick={()=>void quote()}>{busy?t.loading:t.quote}</button>
   </>}</section>}
  {step==="review"&&basket?.quote&&<section><h2>{t.review}</h2><FoodTerms terms={basket.quote} locale={locale}/><p>{method==="pickup"?t.pickup:t.delivery} · {t.window}: {(() => {const q=basket.quote as Terms&{pickup_window?:{starts_at?:string;ends_at:string};arrival_window?:{starts_at?:string;ends_at:string}};const w=method==="pickup"?q.pickup_window:q.arrival_window;return w?.starts_at?`${new Intl.DateTimeFormat(locale==="ln"?"fr":locale,{dateStyle:"medium",timeStyle:"short"}).format(new Date(w.starts_at))} – ${new Intl.DateTimeFormat(locale==="ln"?"fr":locale,{timeStyle:"short"}).format(new Date(w.ends_at))}`:t.noWindow;})()}</p>{method==="pickup"&&<p>{t.onPremise}: {(basket.quote as Terms&{pickup_location?:string}).pickup_location}</p>}{method==="delivery"&&<><p>{t.addressPrivate} {destinationSaved&&t.saved}</p><p>{t.address}: {[address.street,address.building,address.landmark].filter(Boolean).join(", ")}</p>{instruction&&<p>{t.instruction}: {instruction}</p>}</>}<p>{t.payment} {t.offered}</p><button type="button" onClick={()=>setStep("fulfillment")}>{t.back}</button><button type="button" disabled={busy||!!pending} onClick={()=>void confirm()}>{busy?t.loading:t.confirm}</button></section>}
  {step==="submitted"&&orderRef&&<section><h2>{t.pending}</h2><p>{t.orderRef}: {orderRef}</p><p>{t.notPaid}</p><a href={`${locale==="en"?"":`/${locale}`}/shida/restaurant-orders/${orderRef}`}>{t.detail}</a></section>}
 </div></main>;
}
