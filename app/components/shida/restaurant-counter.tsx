'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {useDiscardChanges} from './discard-changes';
import { useRestaurantReturn } from '../../lib/use-restaurant-return';
import type { RestaurantLocale } from '../../services/shida/restaurants-client';
import type { Envelope, Page, Row } from '../../lib/restaurant-seller';
import { DashboardApiError } from '../../lib/restaurant-seller-browser';
import { useWorkRequest, useWorkDraft, leaveWork, dateText, type Order, type Terms, type Configuration } from '../../lib/restaurant-work';
import { basicText } from '../../lib/restaurant-basic-copy';
import { workText } from '../../lib/restaurant-work-copy';
import { ReceiptCard } from './restaurant-receipt';
import { RestaurantMoney } from './restaurant-money';
import { RestaurantPhoto } from './restaurant-photo';
import { sellingCopy } from '../../lib/restaurant-selling-copy';
import './restaurant-selling.css';
import './restaurant-counter-ux.css';
import {soloCopy} from '../../lib/restaurant-solo-copy';
import {checkoutCopy} from '../../lib/restaurant-sales-checkout-copy';
import {counterCopy} from '../../lib/restaurant-counter-copy';
import {cents,decimal,displayMoney,sameCounterChoice,type CounterOptions} from '../../lib/restaurant-counter-values';
import {RestaurantItemChoice,type ItemChoice} from './restaurant-item-choice';
import {posCopy} from '../../lib/restaurant-pos-copy';
import {RestaurantPosDialog,RestaurantBasketPanel} from './restaurant-pos-dialog';
import './restaurant-pos-redesign.css';
import {SpaceIcon} from './account-space-icon';
type Selection=ItemChoice&{key:string;item_ref:string};
type Basket={selections?:{standalone:Selection[];plates:{key:string;components:Selection[]}[]};fulfillment_method?:string;food_preference?:string|null;expires_at?:string;basket_ref:string;revision:number;quote:Terms|null;quote_ref:string|null;order_ref:string|null};
type CounterOrder=Order&{bill_group_ref?:string|null;balance_due?:string};
type Line=ItemChoice&{options?:CounterOptions;key:string;item_ref:string;name:string;unitPrice?:string;amounts?:string[];flexible?:boolean;currency:string;quantity?:number;selected_amount?:string;plate:string};
export function RestaurantCounter({path,binding,locale,onFailure,pos=false,onFreeCounter}:{onFreeCounter?:()=>void;pos?:boolean;path:string;binding:string;locale:RestaurantLocale;onFailure:(e:unknown)=>void}) {
 const pc=posCopy[locale];
 const [editing,setEditing]=useState<string|null>(null),[paymentBusy,setPaymentBusy]=useState(false),[unpaidOpen,setUnpaidOpen]=useState(false),[unpaidTotal,setUnpaidTotal]=useState<number|null>(null),[heldTotal,setHeldTotal]=useState<number|null>(null),[heldPage,setHeldPage]=useState(1);
 const [lastSale,setLastSale]=useState<{order:CounterOrder;amount:string;change:string;currency:string;method:string}|null>(null);
 const {discard,confirmation}=useDiscardChanges(locale);
 const ux=counterCopy(locale), solo=soloCopy[locale];
 const [choice,setChoice]=useState<Row|null>(null),[held,setHeld]=useState<Basket[]>([]),[heldOpen,setHeldOpen]=useState(false),[heldMore,setHeldMore]=useState(false),[showPayment,setShowPayment]=useState(false);
 const simple=checkoutCopy[locale], intent=useRef<'pay'|'later'>('pay');
 const [autoPrepare,setAutoPrepare]=useState(false),[priceChanged,setPriceChanged]=useState(false),[notice,setNotice]=useState(''),[unpaid,setUnpaid]=useState<CounterOrder[]>([]),[unpaidPage,setUnpaidPage]=useState(1),[unpaidMore,setUnpaidMore]=useState(false),[loadFailed,setLoadFailed]=useState(false);
 const salesPath=pos?`${path}/pos`:path;
 const [preference,setPreference]=useState(''),[search,setSearch]=useState(''),[category,setCategory]=useState(''),[recent,setRecent]=useState<CounterOrder[]>([]),[basketOpen,setBasketOpen]=useState(false);
 const [accessLost,setAccessLost]=useState(false);
 const failure=useCallback((error:unknown)=>{if(pos && error instanceof DashboardApiError && [403,404].includes(error.status)){setAccessLost(true);return;}onFailure(error);},[pos,onFailure]);
 const t=(k:string)=>workText(locale,k),api=useWorkRequest(binding,failure);
 const queues=useWorkRequest(binding,()=>{});
 const [config,setConfig]=useState<Configuration|null>(null),[items,setItems]=useState<Row[]>([]),[menuPage,setMenuPage]=useState(1),[menuTotal,setMenuTotal]=useState(0),[basket,setBasket]=useState<Basket|null>(null),[lines,setLines]=useState<Line[]>([]),[method,setMethod]=useState('on_premise'),[order,setOrder]=useState<CounterOrder|null>(null),[moneyGroupRef,setMoneyGroupRef]=useState<string|null>(null),[plate,setPlate]=useState(''),[dirty,setDirty]=useState(true),[fresh,setFresh]=useState(false);
 useWorkDraft(!!basket&&!order&&dirty || !!api.pending,t('discard'),locale);
 const [basketChanged,setBasketChanged]=useState(false);
 useRestaurantReturn(`${binding}:${salesPath}:${locale}:${menuPage}:${unpaidPage}`,api.busy,()=>validate(),()=>setFresh(false));
 const locked=api.busy || !!api.pending || api.conflict || basketChanged || !api.online || !fresh;
 async function validate(acceptRevision=false){
  setFresh(false);setLoadFailed(false);
  let current:Configuration,menu:Row[],total:number,recentOrders:CounterOrder[]|undefined;
  if(pos){
   const data=await api.run<{intake_released:boolean;items:Row[];recent:CounterOrder[]}>(`${salesPath}?language=${locale}`);
   if(!data){setLoadFailed(true);return false;}
   current={intake_released:data.intake_released} as Configuration;menu=data.items;total=menu.length;recentOrders=data.recent;
  }else{
   const data=await api.run<Configuration>(`${path}/order-configuration`);if(!data){setLoadFailed(true);return false;}
   const result=await api.run<Envelope<Page<Row>>>(`${path}/menu/items?page=${menuPage}&page_size=20`);if(!result)return false;
   current=data;menu=result.result.items;total=result.result.total;
  }
  if(basket&&!order){
   const b=await api.run<Basket>(`${salesPath}/counter-baskets/${basket.basket_ref}`);if(!b)return false;
   // Retain the reviewed quote and original revision for uncertain exact retries.
   // Changed remote baskets need explicit conflict review before adopting a revision.
   if(!api.pending || api.conflict&&acceptRevision){
    const changed=b.revision!==basket.revision||b.quote_ref!==basket.quote_ref||b.order_ref!==basket.order_ref;
    setBasketChanged(!!b.order_ref||changed&&!acceptRevision);
    if(!changed||acceptRevision){setBasket(b);if(changed)setDirty(true);}
   }
  }
  setConfig(current);setItems(menu);setMenuTotal(total);if(recentOrders)setRecent(recentOrders);setFresh(true);
  if(pos){const queue=await queues.run<{items:CounterOrder[];has_more:boolean;total:number}>(`${path}/counter-unpaid?page=${unpaidPage}`);if(queue){setUnpaid(queue.items);setUnpaidMore(queue.has_more);setUnpaidTotal(queue.total);}else{setUnpaidTotal(null);setUnpaid([]);}}
  const drafts=await queues.run<{items:Basket[];has_more:boolean;total:number}>(`${salesPath}/counter-baskets?page=${heldPage}`);if(drafts){setHeld(drafts.items);setHeldMore(drafts.has_more);setHeldTotal(drafts.total);}else{setHeldTotal(null);setHeld([]);}
  setConfig(current);setItems(menu);setMenuTotal(total);if(recentOrders)setRecent(recentOrders);
  setFresh(true);return true;
 }

 function selections(){const line=(l:Line)=>({key:l.key,item_ref:l.item_ref,...(l.quantity!=null?{quantity:l.quantity}:{selected_amount:l.selected_amount}),...(l.portion_key?{portion_key:l.portion_key}:{}),...(l.extra_keys?.length?{extra_keys:l.extra_keys}:{}),...(l.note?{note:l.note}:{})});return {standalone:lines.filter(l=>!l.plate).map(line),plates:[...new Set(lines.map(l=>l.plate).filter(Boolean))].map(key=>({key,components:lines.filter(l=>l.plate===key).map(line)}))};}
 async function create(){const b=await api.run<Basket>(`${salesPath}/counter-baskets`,'POST',{operation_key:crypto.randomUUID()});if(b){setBasket(b);setOrder(null);setMoneyGroupRef(null);setDirty(true);}}
 async function addItem(item:Row,chosen:ItemChoice){
  if(!basket){const created=await api.run<Basket>(`${salesPath}/counter-baskets`,'POST',{operation_key:crypto.randomUUID()});if(!created)return;setBasket(created);setOrder(null);setMoneyGroupRef(null);}
  setLines(old=>{const existing=old.find(line=>line.key===editing);const line:Line={key:editing??crypto.randomUUID(),item_ref:item.public_ref,name:item.name??item.public_ref,unitPrice:String(item.unit_price??''),currency:String(item.currency??''),options:item.counter_options as CounterOptions,flexible:item.amount_mode==='flexible',amounts:item.allowed_amounts as string[]|undefined,plate:existing?.plate??plate,...chosen};const others=old.filter(value=>value.key!==editing);const match=others.find(value=>sameCounterChoice(value,line));return match?others.map(value=>value.key===match.key?{...value,quantity:value.quantity!+line.quantity!}:value):[...others,line];});setDirty(true);setChoice(null);if(editing)setBasketOpen(true);setEditing(null);
 }
 const lineTotal=(line:Line)=>{if(line.quantity==null)return cents(line.selected_amount??'')??BigInt(0);const unit=cents(line.options?.portions.find(p=>p.key===line.portion_key)?.amount??line.unitPrice??'')??BigInt(0);const extra=line.options?.extras.filter(p=>line.extra_keys?.includes(p.key)).reduce((n,p)=>n+(cents(p.amount)??BigInt(0)),BigInt(0))??BigInt(0);return (unit+extra)*BigInt(Number.isSafeInteger(line.quantity)&&line.quantity>0?line.quantity:0);};
 const estimate=lines.reduce((total,line)=>{if(line.currency==='CDF'||line.currency==='USD')total[line.currency]+=lineTotal(line);return total;},{CDF:BigInt(0),USD:BigInt(0)});
 const totalText=Object.entries(estimate).filter(([,v])=>v>BigInt(0)).map(([currency,v])=>displayMoney(decimal(v),locale)+' '+currency).join(' · ')||'—';
 async function loadHeld(page=1){const data=await queues.run<{items:Basket[];has_more:boolean;total:number}>(`${salesPath}/counter-baskets?page=${page}`);if(data){setHeld(data.items);setHeldMore(data.has_more);setHeldTotal(data.total);setHeldPage(page);setHeldOpen(true);}}
 async function hold(){if(!basket||!lines.length)return;const result=await api.run<{basket:Basket}>(`${salesPath}/counter-baskets/${basket.basket_ref}`,'PATCH',{operation_key:crypto.randomUUID(),expected_revision:basket.revision,selections:selections(),fulfillment_method:method,food_preference:preference.trim()||null});if(result){setBasket(null);setLines([]);setPreference('');setDirty(false);setBasketOpen(false);await loadHeld();}}
 async function resume(ref:string){
  if(basket&&dirty){discard(async()=>{if(!await loadBasket(ref))throw new Error('resume_failed');});return;}
  await loadBasket(ref);
 }
 async function loadBasket(ref:string){const saved=await api.run<Basket>(`${salesPath}/counter-baskets/${ref}`);if(!saved||saved.order_ref||!saved.selections)return false;const selected=[...saved.selections.standalone.map(l=>({...l,plate:''})),...saved.selections.plates.flatMap(p=>p.components.map(l=>({...l,plate:p.key})))];const resolved=[...items];for(const ref of new Set(selected.map(l=>l.item_ref))){if(!resolved.some(i=>i.public_ref===ref)){const found=await api.run<Envelope<Row>>(`${path}/menu/items/${ref}`);if(!found)return false;resolved.push(found.result);}}setLines(selected.map(l=>{const item=resolved.find(i=>i.public_ref===l.item_ref);return {...l,name:item?.name??l.item_ref,unitPrice:String(item?.unit_price??''),currency:String(item?.currency??''),options:item?.counter_options as CounterOptions,amounts:item?.allowed_amounts as string[]|undefined,flexible:item?.amount_mode==='flexible'};}));setBasket(saved);setMethod(saved.fulfillment_method??'takeaway');setPreference(saved.food_preference??'');setDirty(true);setBasketChanged(false);setHeldOpen(false);setBasketOpen(true);setOrder(null);setMoneyGroupRef(null);return true;}
 async function checkout(next:'pay'|'later'){
  if(order){setBasketOpen(false);setShowPayment(true);return;}
  intent.current=next;
  if(basket?.quote&&!dirty){await finalize();return;}
  if(!basket)return;
  const result=await api.run<{basket:Basket}>(`${salesPath}/counter-baskets/${basket.basket_ref}/quote`,'POST',{operation_key:crypto.randomUUID(),expected_revision:basket.revision,selections:selections(),fulfillment_method:method,food_preference:preference.trim()||null});
  if(result){setBasket(result.basket);setDirty(false);setPriceChanged(!!result.basket.quote&&cents(result.basket.quote.order_total)!==estimate[result.basket.quote.currency as 'CDF'|'USD']);if(result.basket.quote&&cents(result.basket.quote.order_total)===estimate[result.basket.quote.currency as 'CDF'|'USD'])setAutoPrepare(true);}
 }
 useEffect(()=>{if(autoPrepare){const timer=setTimeout(()=>{setAutoPrepare(false);void finalize();},0);return()=>clearTimeout(timer);}},[autoPrepare]); // eslint-disable-line react-hooks/exhaustive-deps
 async function finalize(){if(!basket?.quote)return;const result=await api.run<{current_order:Order;bill_group_ref?:string}>(`${salesPath}/counter-baskets/${basket.basket_ref}/prepare`,'POST',{operation_key:crypto.randomUUID(),expected_revision:basket.revision,quote_ref:basket.quote_ref,confirm:true,fulfillment_method:method});if(result){
  const saved={...result.current_order,bill_group_ref:result.bill_group_ref};setBasketOpen(false);setDirty(false);
  setRecent(old=>[saved,...old.filter(v=>v.order_ref!==saved.order_ref)].slice(0,20));setUnpaid(old=>[saved,...old.filter(v=>v.order_ref!==saved.order_ref)]);
  if(intent.current==='pay'){setOrder(saved);setMoneyGroupRef(result.bill_group_ref??null);setShowPayment(true);}else{setBasket(null);setLines([]);setPlate('');setPreference('');setOrder(null);setMoneyGroupRef(null);setShowPayment(false);setNotice(simple.saved);}setUnpaidTotal(value=>value===null?null:value+1);
 }}
 async function newSale(){if(!(await leaveWork()))return;setOrder(null);setMoneyGroupRef(null);setShowPayment(false);setNotice('');setBasket(null);setLines([]);setPreference('');setPlate('');setDirty(false);void validate();}
 const c=sellingCopy(locale);
 const categories=Array.from(new Map(items.filter(i=>i.category).map(i=>[i.category!.public_ref,i.category!])).values());
 const filtered=items.filter(i=>(!category||i.category?.public_ref===category)&&(i.name??'').toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 const count=lines.reduce((sum,line)=>sum+(line.quantity??1),0);
 const mixed=new Set(lines.map(line=>line.currency)).size>1;
 const canWrite=!order&&!!config?.intake_released&&fresh&&api.online&&!api.busy&&!api.conflict&&!basketChanged&&!api.pending;
 const menu=<section className="rst-selling-menu" aria-label={c.menu}>
  <div className="rst-selling-menu-head"><div><h3>{c.menu}</h3><p>{c.select}</p></div><span>{filtered.length} {c.items}</span></div>
  <div className="rst-selling-filters"><label>{ux.search}<input type="search" value={search} placeholder={ux.search} onChange={e=>setSearch(e.target.value)}/></label></div>
  <div className="rst-pos-categories" aria-label={t('posCategory')}><button type="button" aria-pressed={!category} onClick={()=>setCategory('')}>{c.all}</button>{categories.map(value=><button type="button" key={value.public_ref} aria-pressed={category===value.public_ref} onClick={()=>setCategory(value.public_ref)}>{value.name}</button>)}</div>
  <div className="rst-actions rst-plate-tools"><button type="button" aria-pressed={!!plate} disabled={!canWrite} onClick={()=>setPlate(plate?'':'plate-'+(new Set(lines.map(l=>l.plate).filter(Boolean)).size+1))}>{plate?solo.plate+' '+plate.split('-').at(-1):solo.assemble}</button>{plate&&<button type="button" disabled={!canWrite} onClick={()=>setPlate('plate-'+(new Set(lines.map(l=>l.plate).filter(Boolean)).size+1))}>{solo.nextPlate}</button>}</div>
  <div className="rst-selling-items">{filtered.map(item=><article className={'rst-selling-item'+(lines.some(line=>line.item_ref===item.public_ref)?' is-selected':'')} key={item.public_ref}>
   <div className="rst-selling-photo"><span aria-hidden="true"><SpaceIcon name="restaurant"/></span>{typeof item.image_url==='string'&&<RestaurantPhoto src={item.image_url} alt={item.name??''} sizes="(max-width: 600px) 84px, 150px"/>}</div>
   <div className="rst-selling-item-body"><strong>{item.name}</strong><small>{item.category?.name??''}</small><b>{item.pricing_model==='UNIT_PRICED'?displayMoney(String(item.unit_price),locale)+' '+item.currency:item.pricing_model==='AMOUNT_PRICED'?item.amount_mode==='flexible'?basicText(locale,'flexibleFrom')+' '+item.minimum_amount+' '+item.currency:(item.allowed_amounts as string[]).join(' / ')+' '+item.currency:t('unknown')}</b>{item.availability!=='available'&&<span className="rst-selling-unavailable">{c.unavailable}</span>}</div>
   <button type="button" aria-label={t('add')+' '+item.name} disabled={!canWrite||item.availability!=='available'||item.pricing_model==='UNKNOWN'||!!plate&&item.presentation!=='component'} onClick={()=>{const options=item.counter_options as CounterOptions|undefined;if(item.pricing_model==='UNIT_PRICED'&&!options?.portions.length)void addItem(item,{quantity:1});else{setEditing(null);setChoice(item);}}}>{lines.filter(line=>line.item_ref===item.public_ref).reduce((n,line)=>n+(line.quantity??1),0)||'+'}</button>
  </article>)}</div>
  {!filtered.length&&<p>{t('empty')}</p>}
  {!pos&&menuTotal>20&&<div className="rst-actions"><button type="button" disabled={menuPage===1} onClick={()=>{setFresh(false);setMenuPage(p=>p-1);}}>{t('previous')}</button><button type="button" disabled={menuPage*20>=menuTotal} onClick={()=>{setFresh(false);setMenuPage(p=>p+1);}}>{t('next')}</button></div>}
 </section>;
 if(accessLost)return <article className="rst-card rst-work"><p role="alert">{t('posAccessLost')}</p><button type="button" onClick={onFreeCounter}>{t('counter')}</button></article>;
 return <article className="rst-selling" lang={locale}>
  {confirmation}
  <header className="rst-selling-header"><h2>{ux.title}</h2><div className="rst-pos-queues"><button type="button" disabled={api.busy} onClick={()=>void loadHeld()}>{pc.drafts} ({heldTotal??'—'})</button>{pos&&<button type="button" disabled={api.busy} onClick={()=>{setUnpaidOpen(true);void validate();}}>{simple.due} ({unpaidTotal??'—'})</button>}</div></header>
  {!fresh&&<p role="status">{loadFailed?simple.failed:simple.loading}{loadFailed&&<button type="button" disabled={api.busy||!api.online} onClick={()=>void validate()}>{simple.refresh}</button>}</p>}
  {notice&&<p role="status">{notice}</p>}
  {config&&!config.intake_released&&<p role="status" className="rst-selling-closed">{c.closed}</p>}
  {api.message&&api.message!=='saved'&&<p role="status">{t(api.message)}</p>}
  {(api.conflict||basketChanged)&&<><p role="status">{t('conflict')}</p><button type="button" disabled={api.busy||!api.online} onClick={async()=>{if(await validate(true)){setDirty(true);api.reset();}}}>{t('review')}</button></>}
  {lastSale&&<div className="rst-pos-success" role="status"><strong>{pc.paid}</strong><span>{displayMoney(lastSale.amount,locale)} {lastSale.currency} · {lastSale.method} · {ux.change} {displayMoney(lastSale.change,locale)} {lastSale.currency}</span><button type="button" disabled={paymentBusy||!!order} onClick={()=>{setOrder(lastSale.order);setMoneyGroupRef(lastSale.order.bill_group_ref??null);setShowPayment(true);}}>{ux.receipt}</button></div>}
  {order&&moneyGroupRef&&<RestaurantPosDialog open={showPayment} title={ux.payment} back={pc.back} busy={paymentBusy} onClose={()=>{setShowPayment(false);if(lastSale?.order.order_ref===order.order_ref){setOrder(null);setMoneyGroupRef(null);}}}><RestaurantMoney counter key={path+':'+moneyGroupRef} path={path} groupRef={moneyGroupRef} binding={binding} locale={locale} onBusyChange={setPaymentBusy} onPaid={lastSale?.order.order_ref===order.order_ref?undefined:value=>{setLastSale({order,...value});setShowPayment(false);setBasket(null);setLines([]);setPlate('');setPreference('');setDirty(false);setOrder(null);setMoneyGroupRef(null);setPaymentBusy(false);setUnpaid(old=>old.filter(v=>v.order_ref!==order.order_ref));setUnpaidTotal(n=>n===null?null:Math.max(0,n-1));}}/></RestaurantPosDialog>}
  {order&&!moneyGroupRef&&<p role="alert">{ux.noMethods}</p>}
  {order&&!basket&&!showPayment&&<div className="rst-actions"><button type="button" onClick={()=>setShowPayment(true)}>{ux.payment}</button><button type="button" onClick={()=>void newSale()}>{ux.newSale}</button></div>}
  <div className="rst-selling-layout">
   {menu}
   <RestaurantBasketPanel open={basketOpen&&!showPayment&&!choice&&!plate&&!heldOpen&&!unpaidOpen} title={pc.basket} back={ux.menu} busy={api.busy} onClose={()=>setBasketOpen(false)}><aside className={'rst-selling-basket'+(basketOpen?' is-open':'')} aria-label={c.basket}>
    <div className="rst-selling-basket-head"><div><small>{basket?.quote&&!dirty?c.quoted:c.draft}</small><h3>{pc.basket}</h3></div><button type="button" className="rst-selling-close" onClick={()=>setBasketOpen(false)}>{ux.menu}</button></div>
    {!basket&&<p>{c.empty}</p>}
    {!basket&&<button type="button" className="rst-selling-new" disabled={api.pending?.path===`${salesPath}/counter-baskets`?api.busy||!fresh||!api.online||api.conflict:!canWrite} onClick={()=>void create()}>{api.pending?ux.retry:ux.newSale}</button>}
    {order&&<p role="status">{pc.recorded}</p>}{basket&&<><fieldset disabled={locked||!!order} className="rst-selling-basket-fields">
     <div className="rst-pos-categories"><button type="button" aria-pressed={method==='on_premise'} onClick={()=>{setMethod('on_premise');setDirty(true);}}>{ux.onSite}</button><button type="button" aria-pressed={method==='takeaway'} onClick={()=>{setMethod('takeaway');setDirty(true);}}>{ux.takeaway}</button></div>

     {['',...new Set(lines.map(l=>l.plate).filter(Boolean))].map(group=><section className="rst-selling-line-group" key={group}>{group&&<h4>{t('plate')+' '+group.split('-').at(-1)}</h4>}{lines.filter(l=>l.plate===group).map(l=><div className="rst-selling-line" key={l.key}><strong>{l.name}</strong><span>{displayMoney(decimal(lineTotal(l)),locale)} {l.currency}</span>{l.portion_key&&<small>{l.options?.portions.find(p=>p.key===l.portion_key)?.label}</small>}{l.extra_keys?.map(key=><small key={key}>+ {l.options?.extras.find(p=>p.key===key)?.label}</small>)}{l.note&&<small>{l.note}</small>}<label>{t(l.quantity!=null?'quantity':'amount')}{l.quantity!=null?<span className="rst-pos-quantity"><button type="button" aria-label={pc.decrease+' · '+l.name} disabled={l.quantity!<=1} onClick={()=>{setLines(old=>old.map(x=>x.key===l.key?{...x,quantity:x.quantity!-1}:x));setDirty(true);}}>−</button><input type="number" min="1" step="1" value={l.quantity} onChange={e=>{setLines(old=>old.map(x=>x.key===l.key?{...x,quantity:Number(e.target.value)}:x));setDirty(true);}}/><button type="button" aria-label={pc.increase+' · '+l.name} disabled={l.quantity!>=999} onClick={()=>{setLines(old=>old.map(x=>x.key===l.key?{...x,quantity:x.quantity!+1}:x));setDirty(true);}}>+</button></span>:l.flexible?<input inputMode="decimal" value={l.selected_amount??''} onChange={e=>{setLines(old=>old.map(x=>x.key===l.key?{...x,selected_amount:e.target.value.replace(',','.')}:x));setDirty(true);}}/>:<select value={l.selected_amount} onChange={e=>{setLines(old=>old.map(x=>x.key===l.key?{...x,selected_amount:e.target.value}:x));setDirty(true);}}>{(l.amounts??[l.selected_amount!]).map(a=><option key={a}>{a}</option>)}</select>}</label><button type="button" onClick={()=>{const item=items.find(item=>item.public_ref===l.item_ref);if(item){setBasketOpen(false);setEditing(l.key);setChoice(item);}}}>{pc.customize}</button><button type="button" onClick={()=>{setLines(old=>old.filter(x=>x.key!==l.key));setDirty(true);}}>{t('remove')}</button></div>)}</section>)}
     <details><summary>{pc.note}</summary><label>{ux.note}<textarea maxLength={400} value={preference} onChange={e=>{setPreference(e.target.value);setDirty(true);}}/></label></details>
    </fieldset>
    <div className="rst-selling-totals"><small>{ux.estimate}</small><strong>{totalText}</strong></div>
    {mixed&&<p role="status" className="rst-selling-closed">{c.mixed}</p>}
    <div className="rst-selling-actions"><button type="button" className="button button-primary" disabled={mixed||autoPrepare||api.busy||api.conflict||basketChanged||!fresh||!api.online||!lines.length||!!api.pending&&intent.current!=='pay'} onClick={()=>void checkout('pay')}>{api.pending?ux.retry:ux.payment} · {totalText}</button>{!order&&<div className="rst-pos-secondary"><button type="button" disabled={mixed||autoPrepare||locked||!lines.length} onClick={()=>void checkout('later')}>{pc.later}</button><button type="button" disabled={locked||!lines.length} onClick={()=>void hold()}>{ux.hold}</button></div>}</div>
    {priceChanged&&basket.quote&&!dirty&&!autoPrepare&&!api.busy&&<div className="rst-selling-quote"><p>{simple.changed}</p><strong>{displayMoney(basket.quote.order_total,locale)} {basket.quote.currency}</strong><button disabled={api.busy||!fresh||!api.online||api.conflict} onClick={()=>void finalize()}>{simple.continue}</button></div>}

    </>}
   </aside></RestaurantBasketPanel>
  </div>
  {!showPayment&&<button type="button" className="rst-selling-mobile-summary" onClick={()=>setBasketOpen(true)} aria-expanded={basketOpen}><span>{ux.view} · {count} {c.items}</span><span>{totalText}</span></button>}
  {pos&&<RestaurantPosDialog open={unpaidOpen} title={simple.due} back={ux.menu} busy={api.busy} onClose={()=>setUnpaidOpen(false)}><section className="rst-selling-recent"><h3>{simple.due}</h3>{unpaidTotal===null&&<p role="alert">{simple.failed}<button type="button" disabled={queues.busy} onClick={()=>void validate()}>{simple.refresh}</button></p>}{unpaid.map(value=><article key={value.order_ref}><strong>{value.order_ref} · {value.receipt_terms?.standalone?.map(l=>String(l.name??'')).join(', ')||ux.orders}</strong><p>{dateText(value.submitted_at,locale)} · {displayMoney(value.balance_due??value.receipt_terms?.order_total??'0',locale)} {value.receipt_terms?.currency}</p><button type="button" onClick={async ()=>{if(!(await leaveWork()))return;setUnpaidOpen(false);setBasketOpen(false);setBasket(null);setLines([]);setDirty(false);setOrder(value);setMoneyGroupRef(value.bill_group_ref??null);setShowPayment(true);}}>{ux.payment}</button></article>)}<div className="rst-actions">{unpaidPage>1&&<button onClick={()=>setUnpaidPage(p=>p-1)}>{t('previous')}</button>}{unpaidMore&&<button onClick={()=>setUnpaidPage(p=>p+1)}>{t('next')}</button>}</div><details><summary>{simple.details}</summary>{recent.map(value=><details key={value.order_ref}><summary>{dateText(value.submitted_at,locale)}</summary><ReceiptCard order={value} locale={locale}/>{value.bill_group_ref&&<button onClick={async ()=>{if(!(await leaveWork()))return;setUnpaidOpen(false);setBasketOpen(false);setBasket(null);setLines([]);setDirty(false);setOrder(value);setMoneyGroupRef(value.bill_group_ref!);setShowPayment(true);}}>{ux.receipt}</button>}</details>)}</details></section></RestaurantPosDialog>}
  <RestaurantPosDialog open={!!plate&&!choice} title={t('plate')} back={ux.menu} busy={api.busy} onClose={()=>setPlate('')}><h2>{t('plate')} {plate.split('-').at(-1)}</h2><div className="rst-pos-composer">{items.filter(item=>item.presentation==='component').map(item=><button type="button" key={item.public_ref} disabled={!canWrite||item.availability!=='available'||item.pricing_model==='UNKNOWN'} onClick={()=>{const options=item.counter_options as CounterOptions|undefined;if(item.pricing_model==='UNIT_PRICED'&&!options?.portions.length)void addItem(item,{quantity:1});else{setEditing(null);setChoice(item);}}}>{item.name} · {item.pricing_model==='UNIT_PRICED'?displayMoney(String(item.unit_price),locale):basicText(locale,'flexibleFrom')} {String(item.currency)}</button>)}</div>{!items.some(item=>item.presentation==='component')&&<p>{t('empty')}</p>}<ul>{lines.filter(line=>line.plate===plate).map(line=><li key={line.key}>{line.quantity??1} × {line.name} · {displayMoney(decimal(lineTotal(line)),locale)} {line.currency}</li>)}</ul><button type="button" onClick={()=>{setPlate('');setBasketOpen(true);}}>{ux.view}</button></RestaurantPosDialog>
  {choice&&<RestaurantItemChoice item={choice} initial={lines.find(line=>line.key===editing)} locale={locale} busy={api.busy||!api.online||!fresh||api.conflict||basketChanged} onClose={()=>{setChoice(null);if(editing)setBasketOpen(true);}} onAdd={value=>void addItem(choice,value)}/>}
  <RestaurantPosDialog open={heldOpen} title={pc.drafts} back={ux.menu} busy={api.busy} onClose={()=>setHeldOpen(false)}><section className="rst-held"><header><h2>{pc.drafts} ({heldTotal??'—'})</h2><button type="button" disabled={locked} onClick={()=>setHeldOpen(false)}>{ux.menu}</button></header><p>{ux.heldHelp}</p>{!held.length&&<p>{ux.heldEmpty}</p>}{held.map(value=><article key={value.basket_ref}><h3>{ux.draft} · {value.basket_ref}</h3><p>{[...(value.selections?.standalone??[]),...(value.selections?.plates.flatMap(p=>p.components)??[])].map(l=>(l.quantity??1)+' × '+(items.find(i=>i.public_ref===l.item_ref)?.name??l.item_ref)).join(' · ')}</p><p>{ux.expires} {dateText(value.expires_at,locale)}</p>{value.quote&&<strong>{displayMoney(value.quote.order_total,locale)} {value.quote.currency}</strong>}<button type="button" disabled={locked} onClick={()=>void resume(value.basket_ref)}>{ux.resume}</button></article>)}<div className="rst-actions"><button type="button" disabled={heldPage===1||api.busy} onClick={()=>void loadHeld(heldPage-1)}>{t('previous')}</button><button type="button" disabled={!heldMore||api.busy} onClick={()=>void loadHeld(heldPage+1)}>{t('next')}</button></div></section></RestaurantPosDialog>
 </article>;
}
