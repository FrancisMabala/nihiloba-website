'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { RestaurantLocale } from '../../services/shida/restaurants-client';
import type { Envelope, Page, Row } from '../../lib/restaurant-seller';
import { request, DashboardApiError } from '../../lib/restaurant-seller-browser';
import { useWorkRequest, useWorkDraft, dateText, type Order, type Terms, type Configuration } from '../../lib/restaurant-work';
import { basicText } from '../../lib/restaurant-basic-copy';
import { workText } from '../../lib/restaurant-work-copy';
import { workflowText } from '../../lib/restaurant-workflow-copy';
import { FoodTerms, ReceiptCard } from './restaurant-receipt';
import { RestaurantMoney } from './restaurant-money';
import { RestaurantPhoto } from './restaurant-photo';
import { sellingCopy } from '../../lib/restaurant-selling-copy';
import './restaurant-selling.css';
type Basket={basket_ref:string;revision:number;quote:Terms|null;quote_ref:string|null;order_ref:string|null};
type CounterOrder=Order&{bill_group_ref?:string|null};
type Line={key:string;item_ref:string;name:string;unitPrice?:string;amounts?:string[];flexible?:boolean;currency:string;quantity?:number;selected_amount?:string;plate:string};
export function RestaurantCounter({path,binding,locale,onFailure,pos=false,onFreeCounter}:{onFreeCounter?:()=>void;pos?:boolean;path:string;binding:string;locale:RestaurantLocale;onFailure:(e:unknown)=>void}) {
 const salesPath=pos?`${path}/pos`:path;
 const [preference,setPreference]=useState(''),[search,setSearch]=useState(''),[category,setCategory]=useState(''),[recent,setRecent]=useState<CounterOrder[]>([]),[basketOpen,setBasketOpen]=useState(false);
 const [accessLost,setAccessLost]=useState(false);
 const failure=useCallback((error:unknown)=>{if(pos && error instanceof DashboardApiError && [403,404].includes(error.status)){setAccessLost(true);return;}onFailure(error);},[pos,onFailure]);
 const t=(k:string)=>workText(locale,k),api=useWorkRequest(binding,failure);
 const [config,setConfig]=useState<Configuration|null>(null),[items,setItems]=useState<Row[]>([]),[menuPage,setMenuPage]=useState(1),[menuTotal,setMenuTotal]=useState(0),[basket,setBasket]=useState<Basket|null>(null),[lines,setLines]=useState<Line[]>([]),[method,setMethod]=useState('on_premise'),[order,setOrder]=useState<CounterOrder|null>(null),[moneyGroupRef,setMoneyGroupRef]=useState<string|null>(null),[plate,setPlate]=useState(''),[dirty,setDirty]=useState(true),[fresh,setFresh]=useState(false);
 useWorkDraft(!!basket || !!api.pending,t('discard'));
 useEffect(()=>{let alive=true;const controller=new AbortController();
 const load=async()=>{if(pos){const data=await request(`${salesPath}?language=${locale}`,{signal:controller.signal},binding) as {intake_released:boolean;items:Row[];recent:CounterOrder[]};if(!alive)return;setConfig({intake_released:data.intake_released} as Configuration);setItems(data.items);setRecent(data.recent);setMenuTotal(data.items.length);}
 else {const [c,m]=await Promise.all([request(`${path}/order-configuration`,{signal:controller.signal},binding),request(`${path}/menu/items?page=${menuPage}&page_size=20`,{signal:controller.signal},binding)]);if(!alive)return;setConfig(c as Configuration);const menu=m as Envelope<Page<Row>>;setItems(menu.result.items);setMenuTotal(menu.result.total);}setFresh(true);};
 void load().catch(e=>{if(alive)failure(e);});return()=>{alive=false;controller.abort();};},[path,salesPath,pos,locale,binding,menuPage,failure]);
 useEffect(()=>{const stale=()=>setFresh(false);window.addEventListener('offline',stale);document.addEventListener('visibilitychange',stale);return()=>{window.removeEventListener('offline',stale);document.removeEventListener('visibilitychange',stale);};},[]);
 const locked=api.busy || !!api.pending || api.conflict || !api.online || !fresh;
 async function validate(){if(pos){const data=await api.run<{intake_released:boolean;items:Row[];recent:CounterOrder[]}>(`${salesPath}?language=${locale}`);if(!data)return false;setConfig({intake_released:data.intake_released} as Configuration);setItems(data.items);setRecent(data.recent);}else{const c=await api.run<Configuration>(`${path}/order-configuration`);if(!c)return false;setConfig(c);}if(basket){const b=await api.run<Basket>(`${salesPath}/counter-baskets/${basket.basket_ref}`);if(!b)return false;setBasket(b);if(!api.pending)setDirty(true);}setFresh(true);return true;}

 function selections(){const line=(l:Line)=>({key:l.key,item_ref:l.item_ref,...(l.quantity!=null?{quantity:l.quantity}:{selected_amount:l.selected_amount})});return {standalone:lines.filter(l=>!l.plate).map(line),plates:[...new Set(lines.map(l=>l.plate).filter(Boolean))].map(key=>({key,components:lines.filter(l=>l.plate===key).map(line)}))};}
 async function create(){const b=await api.run<Basket>(`${salesPath}/counter-baskets`,'POST',{operation_key:crypto.randomUUID()});if(b){setBasket(b);setOrder(null);setMoneyGroupRef(null);setDirty(true);}}
 async function addItem(item:Row){
  if(!basket){const created=await api.run<Basket>(`${salesPath}/counter-baskets`,'POST',{operation_key:crypto.randomUUID()});if(!created)return;setBasket(created);setOrder(null);setMoneyGroupRef(null);}
  setLines(old=>[...old,{key:crypto.randomUUID(),item_ref:item.public_ref,name:item.name ?? item.public_ref,unitPrice:String(item.unit_price??''),currency:String(item.currency ?? ''),flexible:item.amount_mode==='flexible',amounts:item.allowed_amounts as string[]|undefined,plate,...(item.pricing_model==='UNIT_PRICED'?{quantity:1}:{selected_amount:item.amount_mode==='flexible'?String(item.minimum_amount):(item.allowed_amounts as string[])[0]})}]);setDirty(true);
 }
 const estimate=lines.reduce((totals,line)=>{const raw=line.quantity!=null?Number(line.unitPrice)*line.quantity:Number(line.selected_amount);if(!Number.isFinite(raw)||raw<0||!['CDF','USD'].includes(line.currency))return totals;totals[line.currency as 'CDF'|'USD']+=raw;return totals;},{CDF:0,USD:0});
 async function edit(quote:boolean){if(!basket)return;const result=await api.run<{basket:Basket}>(`${salesPath}/counter-baskets/${basket.basket_ref}${quote?'/quote':''}`,quote?'POST':'PATCH',{operation_key:crypto.randomUUID(),expected_revision:basket.revision,selections:selections(),fulfillment_method:method,food_preference:preference.trim()||null});if(result){setBasket(result.basket);setDirty(!quote);}}
 async function finalize(){if(!basket)return;const result=await api.run<{current_order:Order;bill_group_ref?:string}>(`${salesPath}/counter-baskets/${basket.basket_ref}/finalize`,'POST',{operation_key:crypto.randomUUID(),expected_revision:basket.revision,quote_ref:basket.quote_ref,confirm:true,handoff_confirmed:true,fulfillment_method:method});if(result){setOrder({...result.current_order,bill_group_ref:result.bill_group_ref});setMoneyGroupRef(result.bill_group_ref??null);setBasket(null);setBasketOpen(false);setLines([]);setPreference('');setRecent(old=>[{...result.current_order,bill_group_ref:result.bill_group_ref},...old].slice(0,20));if(pos){setFresh(false);const current=await api.run<{intake_released:boolean;items:Row[];recent:CounterOrder[]}>(`${salesPath}?language=${locale}`);if(current){setItems(current.items);setRecent(current.recent);setConfig({intake_released:current.intake_released} as Configuration);setFresh(true);}}}}
 const c=sellingCopy(locale);
 const categories=Array.from(new Map(items.filter(i=>i.category).map(i=>[i.category!.public_ref,i.category!])).values());
 const filtered=items.filter(i=>(!category||i.category?.public_ref===category)&&(i.name??'').toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 const count=lines.reduce((sum,line)=>sum+(line.quantity??1),0);
 const mixed=new Set(lines.map(line=>line.currency)).size>1;
 const canWrite=!!config?.intake_released&&fresh&&api.online&&!api.busy&&!api.conflict&&!api.pending;
 const menu=<section className="rst-selling-menu" aria-label={c.menu}>
  <div className="rst-selling-menu-head"><div><h3>{c.menu}</h3><p>{c.select}</p></div><span>{filtered.length} {c.items}</span></div>
  <div className="rst-selling-filters"><label>{t('posSearch')}<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>{t('posCategory')}<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">{c.all}</option>{categories.map(value=><option key={value.public_ref} value={value.public_ref}>{value.name}</option>)}</select></label></div>
  <div className="rst-selling-items">{filtered.map(item=><article className="rst-selling-item" key={item.public_ref}>
   <div className="rst-selling-photo"><span aria-hidden="true">◌</span>{typeof item.image_url==='string'&&<RestaurantPhoto src={item.image_url} alt={item.name??''} sizes="(max-width: 600px) 84px, 150px"/>}</div>
   <div className="rst-selling-item-body"><strong>{item.name}</strong><small>{item.category?.name??''}</small><b>{item.pricing_model==='UNIT_PRICED'?String(item.unit_price)+' '+item.currency:item.pricing_model==='AMOUNT_PRICED'?item.amount_mode==='flexible'?basicText(locale,'flexibleFrom')+' '+item.minimum_amount+' '+item.currency:(item.allowed_amounts as string[]).join(' / ')+' '+item.currency:t('unknown')}</b>{item.availability!=='available'&&<span className="rst-selling-unavailable">{c.unavailable}</span>}</div>
   <button type="button" aria-label={t('add')+' '+item.name} disabled={!canWrite||item.availability!=='available'||item.pricing_model==='UNKNOWN'||!!plate&&item.presentation!=='component'} onClick={()=>void addItem(item)}>{t('add')}</button>
  </article>)}</div>
  {!filtered.length&&<p>{t('empty')}</p>}
  {!pos&&menuTotal>20&&<div className="rst-actions"><button type="button" disabled={menuPage===1} onClick={()=>{setFresh(false);setMenuPage(p=>p-1);}}>{t('previous')}</button><button type="button" disabled={menuPage*20>=menuTotal} onClick={()=>{setFresh(false);setMenuPage(p=>p+1);}}>{t('next')}</button></div>}
 </section>;
 if(accessLost)return <article className="rst-card rst-work"><p role="alert">{t('posAccessLost')}</p><button type="button" onClick={onFreeCounter}>{t('counter')}</button></article>;
 return <article className="rst-selling" lang={locale}>
  <header className="rst-selling-header"><div><p className="rst-selling-eyebrow">{c.title}</p><h2>{c.counter}</h2></div><span>{config?.intake_released?c.available:c.closed}</span></header>
  {!fresh&&<p role="status">{t('stale')} <button type="button" disabled={api.busy||!api.online} onClick={()=>void validate()}>{t('refresh')}</button></p>}
  {config&&!config.intake_released&&<p role="status" className="rst-selling-closed">{c.closed}</p>}
  {api.message&&<p role="status">{t(api.message)}</p>}
  {api.conflict&&<button type="button" disabled={api.busy||!api.online} onClick={async()=>{if(await validate()){setDirty(true);api.reset();}}}>{t('review')}</button>}
  {order&&<section className="rst-selling-result"><p>{c.confirmed}</p><h3>{c.reference}</h3><div className="rst-selling-reference"><strong>{order.order_ref}</strong><button type="button" onClick={()=>void navigator.clipboard?.writeText(order.order_ref)}>{c.copy}</button></div><p>{t(order.state)}</p><ReceiptCard order={order} locale={locale}/><Link prefetch={false} href={(locale==='en'?'':'/'+locale)+'/shida/seller/restaurants/'+path.split('/').at(-1)+'/receipts/'+order.order_ref}>{t('receipt')}</Link></section>}
  {moneyGroupRef&&<section className="rst-selling-money"><RestaurantMoney key={path+':'+moneyGroupRef} path={path} groupRef={moneyGroupRef} binding={binding} locale={locale}/></section>}
  <div className="rst-selling-layout">
   {menu}
   <aside className={'rst-selling-basket'+(basketOpen?' is-open':'')} aria-label={c.basket}>
    <div className="rst-selling-basket-head"><div><small>{basket?.quote&&!dirty?c.quoted:c.draft}</small><h3>{c.basket}</h3></div><button type="button" className="rst-selling-close" onClick={()=>setBasketOpen(false)}>{c.closeBasket}</button></div>
    {!basket&&<p>{c.empty}</p>}
    {!basket&&<button type="button" className="rst-selling-new" disabled={!canWrite} onClick={()=>void create()}>{t(api.pending?'retry':'newSale')}</button>}
    {basket&&<><fieldset disabled={locked} className="rst-selling-basket-fields">
     <label>{t('counter')}<select value={method} onChange={e=>{setMethod(e.target.value);setDirty(true);}}><option value="on_premise">{t('on_premise')}</option><option value="takeaway">{t('takeaway')}</option></select></label>
     <label>{t('plate')}<input maxLength={64} value={plate} placeholder={t('standalone')} onChange={e=>setPlate(e.target.value)}/></label>
     {['',...new Set(lines.map(l=>l.plate).filter(Boolean))].map(group=><section className="rst-selling-line-group" key={group}><h4>{group? t('plate')+' · '+group:t('standalone')}</h4>{lines.filter(l=>l.plate===group).map(l=><div className="rst-selling-line" key={l.key}><strong>{l.name}</strong><span>{l.currency} {l.quantity!=null?l.unitPrice:l.selected_amount}</span><label>{t(l.quantity!=null?'quantity':'amount')}{l.quantity!=null?<input type="number" min="1" step="1" value={l.quantity} onChange={e=>{setLines(old=>old.map(x=>x.key===l.key?{...x,quantity:Number(e.target.value)}:x));setDirty(true);}}/>:l.flexible?<input inputMode="decimal" value={l.selected_amount??''} onChange={e=>{setLines(old=>old.map(x=>x.key===l.key?{...x,selected_amount:e.target.value.replace(',','.')}:x));setDirty(true);}}/>:<select value={l.selected_amount} onChange={e=>{setLines(old=>old.map(x=>x.key===l.key?{...x,selected_amount:e.target.value}:x));setDirty(true);}}>{(l.amounts??[l.selected_amount!]).map(a=><option key={a}>{a}</option>)}</select>}</label><button type="button" onClick={()=>{setLines(old=>old.filter(x=>x.key!==l.key));setDirty(true);}}>{t('remove')}</button></div>)}</section>)}
     <label>{t('foodPreference')}<textarea maxLength={400} value={preference} onChange={e=>{setPreference(e.target.value);setDirty(true);}}/></label>
    </fieldset>
    <div className="rst-selling-totals"><small>{c.estimate}</small><p><span>CDF</span><strong>{estimate.CDF.toFixed(2)}</strong></p><p><span>USD</span><strong>{estimate.USD.toFixed(2)}</strong></p></div>
    {mixed&&<p role="status" className="rst-selling-closed">{c.mixed}</p>}
    <div className="rst-selling-actions"><button type="button" disabled={api.busy||api.conflict||!fresh||!api.online||!!api.pending&&api.pending.method!=='PATCH'} onClick={()=>void edit(false)}>{t(api.pending?.method==='PATCH'?'retry':'save')}</button><button type="button" className="button button-primary" disabled={mixed||api.busy||api.conflict||!fresh||!api.online||!lines.length||!!api.pending&&!api.pending.path.endsWith('/quote')} onClick={()=>void edit(true)}>{t(api.pending?.path.endsWith('/quote')?'retry':'quote')}</button></div>
    {basket.quote&&!dirty&&<div className="rst-selling-quote"><h4>{c.quoted}</h4><FoodTerms terms={basket.quote} locale={locale}/><p>{c.quoteNote}</p><p>{c.handover}</p><button type="button" className="button button-primary" disabled={!config?.intake_released&&!api.pending||api.busy||api.conflict||!fresh||!api.online||!!api.pending&&!api.pending.path.endsWith('/finalize')} onClick={()=>void finalize()}>{t(api.pending?.path.endsWith('/finalize')?'retry':'complete')}</button></div>}
    </>}
   </aside>
  </div>
  <button type="button" className="rst-selling-mobile-summary" onClick={()=>setBasketOpen(true)} aria-expanded={basketOpen}><span>{c.openBasket} · {count} {c.items}</span><span>CDF {estimate.CDF.toFixed(2)} · USD {estimate.USD.toFixed(2)}</span></button>
  {pos&&<section className="rst-selling-recent"><h3>{t('posRecent')}</h3>{recent.map(value=><details key={value.order_ref}><summary><strong>{value.order_ref}</strong> · {dateText(value.submitted_at,locale)}</summary><ReceiptCard order={value} locale={locale}/>{value.bill_group_ref&&<button type="button" onClick={()=>setMoneyGroupRef(value.bill_group_ref!)}>{workflowText(locale,'recordPayment')}</button>}</details>)}</section>}
 </article>;
}
