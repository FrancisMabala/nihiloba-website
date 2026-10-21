'use client';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRestaurantReturn } from '../../lib/use-restaurant-return';
import type { RestaurantLocale } from '../../services/shida/restaurants-client';
import type { Envelope, Page, Row } from '../../lib/restaurant-seller';
import { DashboardApiError } from '../../lib/restaurant-seller-browser';
import { useWorkRequest, useWorkDraft, leaveWork, terminal, dateText, type Order, type Terms, type Configuration } from '../../lib/restaurant-work';
import { basicText } from '../../lib/restaurant-basic-copy';
import { workText } from '../../lib/restaurant-work-copy';
import { workflowText } from '../../lib/restaurant-workflow-copy';
import { FoodTerms, ReceiptCard } from './restaurant-receipt';
import { RestaurantMoney } from './restaurant-money';
import { RestaurantPhoto } from './restaurant-photo';
import { sellingCopy } from '../../lib/restaurant-selling-copy';
import './restaurant-selling.css';
import './restaurant-counter-ux.css';
import {soloCopy} from '../../lib/restaurant-solo-copy';
import {counterCopy} from '../../lib/restaurant-counter-copy';
import {cents,decimal,displayMoney,type CounterOptions} from '../../lib/restaurant-counter-values';
import {RestaurantItemChoice,type ItemChoice} from './restaurant-item-choice';
type Selection=ItemChoice&{key:string;item_ref:string};
type Basket={selections?:{standalone:Selection[];plates:{key:string;components:Selection[]}[]};fulfillment_method?:string;food_preference?:string|null;expires_at?:string;basket_ref:string;revision:number;quote:Terms|null;quote_ref:string|null;order_ref:string|null};
type CounterOrder=Order&{bill_group_ref?:string|null};
type Line=ItemChoice&{options?:CounterOptions;key:string;item_ref:string;name:string;unitPrice?:string;amounts?:string[];flexible?:boolean;currency:string;quantity?:number;selected_amount?:string;plate:string};
export function RestaurantCounter({path,binding,locale,onFailure,pos=false,onFreeCounter}:{onFreeCounter?:()=>void;pos?:boolean;path:string;binding:string;locale:RestaurantLocale;onFailure:(e:unknown)=>void}) {
 const ux=counterCopy(locale), solo=soloCopy[locale];
 const [choice,setChoice]=useState<Row|null>(null),[held,setHeld]=useState<Basket[]>([]),[heldOpen,setHeldOpen]=useState(false),[heldMore,setHeldMore]=useState(false),[showPayment,setShowPayment]=useState(false);
 const salesPath=pos?`${path}/pos`:path;
 const [preference,setPreference]=useState(''),[search,setSearch]=useState(''),[category,setCategory]=useState(''),[recent,setRecent]=useState<CounterOrder[]>([]),[basketOpen,setBasketOpen]=useState(false);
 const [accessLost,setAccessLost]=useState(false);
 const failure=useCallback((error:unknown)=>{if(pos && error instanceof DashboardApiError && [403,404].includes(error.status)){setAccessLost(true);return;}onFailure(error);},[pos,onFailure]);
 const t=(k:string)=>workText(locale,k),api=useWorkRequest(binding,failure);
 const [config,setConfig]=useState<Configuration|null>(null),[items,setItems]=useState<Row[]>([]),[menuPage,setMenuPage]=useState(1),[menuTotal,setMenuTotal]=useState(0),[basket,setBasket]=useState<Basket|null>(null),[lines,setLines]=useState<Line[]>([]),[method,setMethod]=useState('on_premise'),[order,setOrder]=useState<CounterOrder|null>(null),[moneyGroupRef,setMoneyGroupRef]=useState<string|null>(null),[plate,setPlate]=useState(''),[dirty,setDirty]=useState(true),[fresh,setFresh]=useState(false);
 useWorkDraft(!!basket&&dirty || !!api.pending,t('discard'));
 const [basketChanged,setBasketChanged]=useState(false);
 useRestaurantReturn(`${binding}:${salesPath}:${locale}:${menuPage}`,api.busy,()=>validate(),()=>setFresh(false));
 const locked=api.busy || !!api.pending || api.conflict || basketChanged || !api.online || !fresh;
 async function validate(acceptRevision=false){
  setFresh(false);
  let current:Configuration,menu:Row[],total:number,recentOrders:CounterOrder[]|undefined;
  if(pos){
   const data=await api.run<{intake_released:boolean;items:Row[];recent:CounterOrder[]}>(`${salesPath}?language=${locale}`);
   if(!data)return false;
   current={intake_released:data.intake_released} as Configuration;menu=data.items;total=menu.length;recentOrders=data.recent;
  }else{
   const data=await api.run<Configuration>(`${path}/order-configuration`);if(!data)return false;
   const result=await api.run<Envelope<Page<Row>>>(`${path}/menu/items?page=${menuPage}&page_size=20`);if(!result)return false;
   current=data;menu=result.result.items;total=result.result.total;
  }
  if(basket){
   const b=await api.run<Basket>(`${salesPath}/counter-baskets/${basket.basket_ref}`);if(!b)return false;
   // Retain the reviewed quote and original revision for uncertain exact retries.
   // Changed remote baskets need explicit conflict review before adopting a revision.
   if(!api.pending || api.conflict&&acceptRevision){
    const changed=b.revision!==basket.revision||b.quote_ref!==basket.quote_ref||b.order_ref!==basket.order_ref;
    setBasketChanged(!!b.order_ref||changed&&!acceptRevision);
    if(!changed||acceptRevision){setBasket(b);if(changed)setDirty(true);}
   }
  }
  setConfig(current);setItems(menu);setMenuTotal(total);if(recentOrders)setRecent(recentOrders);
  setFresh(true);return true;
 }

 function selections(){const line=(l:Line)=>({key:l.key,item_ref:l.item_ref,...(l.quantity!=null?{quantity:l.quantity}:{selected_amount:l.selected_amount}),...(l.portion_key?{portion_key:l.portion_key}:{}),...(l.extra_keys?.length?{extra_keys:l.extra_keys}:{}),...(l.note?{note:l.note}:{})});return {standalone:lines.filter(l=>!l.plate).map(line),plates:[...new Set(lines.map(l=>l.plate).filter(Boolean))].map(key=>({key,components:lines.filter(l=>l.plate===key).map(line)}))};}
 async function create(){const b=await api.run<Basket>(`${salesPath}/counter-baskets`,'POST',{operation_key:crypto.randomUUID()});if(b){setBasket(b);setOrder(null);setMoneyGroupRef(null);setDirty(true);}}
 async function addItem(item:Row,chosen:ItemChoice){
  if(!basket){const created=await api.run<Basket>(`${salesPath}/counter-baskets`,'POST',{operation_key:crypto.randomUUID()});if(!created)return;setBasket(created);setOrder(null);setMoneyGroupRef(null);}
  setLines(old=>[...old,{key:crypto.randomUUID(),item_ref:item.public_ref,name:item.name ?? item.public_ref,unitPrice:String(item.unit_price??''),currency:String(item.currency ?? ''),options:item.counter_options as CounterOptions, ...chosen,flexible:item.amount_mode==='flexible',amounts:item.allowed_amounts as string[]|undefined,plate,...chosen}]);setDirty(true);setChoice(null);
 }
 const lineTotal=(line:Line)=>{if(line.quantity==null)return cents(line.selected_amount??'')??BigInt(0);const unit=cents(line.options?.portions.find(p=>p.key===line.portion_key)?.amount??line.unitPrice??'')??BigInt(0);const extra=line.options?.extras.filter(p=>line.extra_keys?.includes(p.key)).reduce((n,p)=>n+(cents(p.amount)??BigInt(0)),BigInt(0))??BigInt(0);return (unit+extra)*BigInt(Number.isSafeInteger(line.quantity)&&line.quantity>0?line.quantity:0);};
 const estimate=lines.reduce((total,line)=>{if(line.currency==='CDF'||line.currency==='USD')total[line.currency]+=lineTotal(line);return total;},{CDF:BigInt(0),USD:BigInt(0)});
 const totalText=Object.entries(estimate).filter(([,v])=>v>BigInt(0)).map(([currency,v])=>displayMoney(decimal(v),locale)+' '+currency).join(' · ')||'—';
 async function loadHeld(){const data=await api.run<{items:Basket[];has_more:boolean}>(`${salesPath}/counter-baskets`);if(data){setHeld(data.items);setHeldMore(data.has_more);setHeldOpen(true);}}
 async function hold(){if(!basket||!lines.length)return;const result=await api.run<{basket:Basket}>(`${salesPath}/counter-baskets/${basket.basket_ref}`,'PATCH',{operation_key:crypto.randomUUID(),expected_revision:basket.revision,selections:selections(),fulfillment_method:method,food_preference:preference.trim()||null});if(result){setBasket(null);setLines([]);setPreference('');setDirty(false);setBasketOpen(false);await loadHeld();}}
 async function resume(ref:string){if(basket&&dirty&&!window.confirm(t('discard')))return;const saved=await api.run<Basket>(`${salesPath}/counter-baskets/${ref}`);if(!saved||saved.order_ref||!saved.selections)return;const selected=[...saved.selections.standalone.map(l=>({...l,plate:''})),...saved.selections.plates.flatMap(p=>p.components.map(l=>({...l,plate:p.key})))];const resolved=[...items];for(const ref of new Set(selected.map(l=>l.item_ref))){if(!resolved.some(i=>i.public_ref===ref)){const found=await api.run<Envelope<Row>>(`${path}/menu/items/${ref}`);if(!found)return;resolved.push(found.result);}}setLines(selected.map(l=>{const item=resolved.find(i=>i.public_ref===l.item_ref);return {...l,name:item?.name??l.item_ref,unitPrice:String(item?.unit_price??''),currency:String(item?.currency??''),options:item?.counter_options as CounterOptions,amounts:item?.allowed_amounts as string[]|undefined,flexible:item?.amount_mode==='flexible'};}));setBasket(saved);setMethod(saved.fulfillment_method??'takeaway');setPreference(saved.food_preference??'');setDirty(true);setBasketChanged(false);setHeldOpen(false);setBasketOpen(true);setOrder(null);setMoneyGroupRef(null);}
 async function edit(quote:boolean){if(!basket)return;const result=await api.run<{basket:Basket}>(`${salesPath}/counter-baskets/${basket.basket_ref}${quote?'/quote':''}`,quote?'POST':'PATCH',{operation_key:crypto.randomUUID(),expected_revision:basket.revision,selections:selections(),fulfillment_method:method,food_preference:preference.trim()||null});if(result){setBasket(result.basket);setDirty(!quote);}}
 async function finalize(){if(!basket)return;const result=await api.run<{current_order:Order;bill_group_ref?:string}>(`${salesPath}/counter-baskets/${basket.basket_ref}/prepare`,'POST',{operation_key:crypto.randomUUID(),expected_revision:basket.revision,quote_ref:basket.quote_ref,confirm:true,fulfillment_method:method});if(result){setOrder({...result.current_order,bill_group_ref:result.bill_group_ref});setMoneyGroupRef(result.bill_group_ref??null);setShowPayment(false);setBasket(null);setBasketOpen(false);setLines([]);setPlate('');setPreference('');setRecent(old=>[{...result.current_order,bill_group_ref:result.bill_group_ref},...old].slice(0,20));if(pos){setFresh(false);const current=await api.run<{intake_released:boolean;items:Row[];recent:CounterOrder[]}>(`${salesPath}?language=${locale}`);if(current){setItems(current.items);setRecent(current.recent);setConfig({intake_released:current.intake_released} as Configuration);setFresh(true);}}}}
 async function serveAction(action:'solo_ready'|'assisted_handover'){
  if(!order)return;
  const result=await api.run<{current_order:Order}>(`${path}/orders/${order.order_ref}/actions/${action}`,'POST',{operation_key:crypto.randomUUID(),expected_revision:order.revision,confirm:true});
  if(result){const next={...result.current_order,bill_group_ref:moneyGroupRef};setOrder(next);setRecent(old=>old.map(row=>row.order_ref===next.order_ref?next:row));}
 }
 const c=sellingCopy(locale);
 const categories=Array.from(new Map(items.filter(i=>i.category).map(i=>[i.category!.public_ref,i.category!])).values());
 const filtered=items.filter(i=>(!category||i.category?.public_ref===category)&&(i.name??'').toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 const count=lines.reduce((sum,line)=>sum+(line.quantity??1),0);
 const mixed=new Set(lines.map(line=>line.currency)).size>1;
 const canWrite=!!config?.intake_released&&fresh&&api.online&&!api.busy&&!api.conflict&&!basketChanged&&!api.pending;
 const menu=<section className="rst-selling-menu" aria-label={c.menu}>
  <div className="rst-selling-menu-head"><div><h3>{c.menu}</h3><p>{c.select}</p></div><span>{filtered.length} {c.items}</span></div>
  <div className="rst-selling-filters"><label>{ux.search}<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>{t('posCategory')}<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">{c.all}</option>{categories.map(value=><option key={value.public_ref} value={value.public_ref}>{value.name}</option>)}</select></label></div>
  <div className="rst-actions rst-plate-tools"><button type="button" aria-pressed={!!plate} disabled={!canWrite} onClick={()=>setPlate(plate?'':'plate-'+(new Set(lines.map(l=>l.plate).filter(Boolean)).size+1))}>{plate?solo.plate+' '+plate.split('-').at(-1):solo.assemble}</button>{plate&&<button type="button" disabled={!canWrite} onClick={()=>setPlate('plate-'+(new Set(lines.map(l=>l.plate).filter(Boolean)).size+1))}>{solo.nextPlate}</button>}</div>
  <div className="rst-selling-items">{filtered.map(item=><article className="rst-selling-item" key={item.public_ref}>
   <div className="rst-selling-photo"><span aria-hidden="true">◌</span>{typeof item.image_url==='string'&&<RestaurantPhoto src={item.image_url} alt={item.name??''} sizes="(max-width: 600px) 84px, 150px"/>}</div>
   <div className="rst-selling-item-body"><strong>{item.name}</strong><small>{item.category?.name??''}</small><b>{item.pricing_model==='UNIT_PRICED'?displayMoney(String(item.unit_price),locale)+' '+item.currency:item.pricing_model==='AMOUNT_PRICED'?item.amount_mode==='flexible'?basicText(locale,'flexibleFrom')+' '+item.minimum_amount+' '+item.currency:(item.allowed_amounts as string[]).join(' / ')+' '+item.currency:t('unknown')}</b>{item.availability!=='available'&&<span className="rst-selling-unavailable">{c.unavailable}</span>}</div>
   <button type="button" aria-label={t('add')+' '+item.name} disabled={!canWrite||item.availability!=='available'||item.pricing_model==='UNKNOWN'||!!plate&&item.presentation!=='component'} onClick={()=>{const options=item.counter_options as CounterOptions|undefined;if(item.pricing_model==='UNIT_PRICED'&&item.presentation==='fixed_dish'&&!options?.portions.length&&!options?.extras.length)void addItem(item,{quantity:1});else setChoice(item);}}>{t('add')}</button>
  </article>)}</div>
  {!filtered.length&&<p>{t('empty')}</p>}
  {!pos&&menuTotal>20&&<div className="rst-actions"><button type="button" disabled={menuPage===1} onClick={()=>{setFresh(false);setMenuPage(p=>p-1);}}>{t('previous')}</button><button type="button" disabled={menuPage*20>=menuTotal} onClick={()=>{setFresh(false);setMenuPage(p=>p+1);}}>{t('next')}</button></div>}
 </section>;
 if(accessLost)return <article className="rst-card rst-work"><p role="alert">{t('posAccessLost')}</p><button type="button" onClick={onFreeCounter}>{t('counter')}</button></article>;
 return <article className="rst-selling" lang={locale}>
  <header className="rst-selling-header"><h2>{ux.title}</h2><button type="button" disabled={locked} onClick={()=>void loadHeld()}>{ux.held}</button></header>
  {!fresh&&<p role="status">{t('stale')} <button type="button" disabled={api.busy||!api.online} onClick={()=>void validate()}>{t('refresh')}</button></p>}
  {config&&!config.intake_released&&<p role="status" className="rst-selling-closed">{c.closed}</p>}
  {api.message&&<p role="status">{t(api.message)}</p>}
  {(api.conflict||basketChanged)&&<><p role="status">{t('conflict')}</p><button type="button" disabled={api.busy||!api.online} onClick={async()=>{if(await validate(true)){setDirty(true);api.reset();}}}>{t('review')}</button></>}
  {order&&!showPayment&&!heldOpen&&<section className="rst-selling-result"><p>{c.confirmed}</p><h3>{c.reference}</h3><div className="rst-selling-reference"><strong>{order.order_ref}</strong><button type="button" onClick={()=>void navigator.clipboard?.writeText(order.order_ref)}>{c.copy}</button></div><p>{t(order.state)}</p><p>{solo.later}</p>{['accepted','preparing','ready'].includes(order.state)&&<button type="button" className="button button-primary" disabled={api.busy||!fresh||!api.online||api.conflict||!!api.pending&&!api.pending.path.includes('/actions/')} onClick={()=>void serveAction(order.state==='ready'?'assisted_handover':'solo_ready')}>{api.pending?solo.retry:order.state==='ready'?solo.serve:solo.ready}</button>}<details><summary>{ux.receipt}</summary><ReceiptCard order={order} locale={locale}/></details><button type="button" onClick={()=>{if(!leaveWork())return;setOrder(null);setMoneyGroupRef(null);setShowPayment(false);}}>{ux.newSale}</button><Link prefetch={false} href={(locale==='en'?'':'/'+locale)+'/shida/seller/restaurants/'+path.split('/').at(-1)+'/receipts/'+order.order_ref}>{t('receipt')}</Link></section>}
  {moneyGroupRef&&<button type="button" onClick={()=>{if(leaveWork())setShowPayment(!showPayment);}}>{showPayment?ux.back:ux.payment}</button>}
  {moneyGroupRef&&showPayment&&<section className="rst-selling-money"><RestaurantMoney counter key={path+':'+moneyGroupRef} path={path} groupRef={moneyGroupRef} binding={binding} locale={locale}/></section>}
  {!order&&!showPayment&&!heldOpen&&<div className="rst-selling-layout">
   {menu}
   <aside className={'rst-selling-basket'+(basketOpen?' is-open':'')} aria-label={c.basket}>
    <div className="rst-selling-basket-head"><div><small>{basket?.quote&&!dirty?c.quoted:c.draft}</small><h3>{ux.basket}</h3></div><button type="button" className="rst-selling-close" onClick={()=>setBasketOpen(false)}>{ux.menu}</button></div>
    {!basket&&<p>{c.empty}</p>}
    {!basket&&<button type="button" className="rst-selling-new" disabled={api.pending?.path===`${salesPath}/counter-baskets`?api.busy||!fresh||!api.online||api.conflict:!canWrite} onClick={()=>void create()}>{api.pending?ux.retry:ux.newSale}</button>}
    {basket&&<><fieldset disabled={locked} className="rst-selling-basket-fields">
     <label>{ux.title}<select value={method} onChange={e=>{setMethod(e.target.value);setDirty(true);}}><option value="on_premise">{ux.onSite}</option><option value="takeaway">{ux.takeaway}</option></select></label>
     <details><summary>{t('plate')}</summary><input aria-label={t('plate')} maxLength={64} value={plate} placeholder={t('standalone')} onChange={e=>setPlate(e.target.value)}/></details>
     {['',...new Set(lines.map(l=>l.plate).filter(Boolean))].map(group=><section className="rst-selling-line-group" key={group}><h4>{group? t('plate')+' · '+group:t('standalone')}</h4>{lines.filter(l=>l.plate===group).map(l=><div className="rst-selling-line" key={l.key}><strong>{l.name}</strong><span>{displayMoney(decimal(lineTotal(l)),locale)} {l.currency}</span>{l.portion_key&&<small>{l.options?.portions.find(p=>p.key===l.portion_key)?.label}</small>}{l.extra_keys?.map(key=><small key={key}>+ {l.options?.extras.find(p=>p.key===key)?.label}</small>)}{l.note&&<small>{l.note}</small>}<label>{t(l.quantity!=null?'quantity':'amount')}{l.quantity!=null?<input type="number" min="1" step="1" value={l.quantity} onChange={e=>{setLines(old=>old.map(x=>x.key===l.key?{...x,quantity:Number(e.target.value)}:x));setDirty(true);}}/>:l.flexible?<input inputMode="decimal" value={l.selected_amount??''} onChange={e=>{setLines(old=>old.map(x=>x.key===l.key?{...x,selected_amount:e.target.value.replace(',','.')}:x));setDirty(true);}}/>:<select value={l.selected_amount} onChange={e=>{setLines(old=>old.map(x=>x.key===l.key?{...x,selected_amount:e.target.value}:x));setDirty(true);}}>{(l.amounts??[l.selected_amount!]).map(a=><option key={a}>{a}</option>)}</select>}</label><button type="button" onClick={()=>{setLines(old=>old.filter(x=>x.key!==l.key));setDirty(true);}}>{t('remove')}</button></div>)}</section>)}
     <label>{ux.note}<textarea maxLength={400} value={preference} onChange={e=>{setPreference(e.target.value);setDirty(true);}}/></label>
    </fieldset>
    <div className="rst-selling-totals"><small>{ux.estimate}</small><strong>{totalText}</strong></div>
    {mixed&&<p role="status" className="rst-selling-closed">{c.mixed}</p>}
    <div className="rst-selling-actions"><button type="button" disabled={api.busy||api.conflict||basketChanged||!fresh||!api.online||!!api.pending&&api.pending.method!=='PATCH'} onClick={()=>void hold()}>{api.pending?.method==='PATCH'?ux.retry:ux.hold}</button><button type="button" className="button button-primary" disabled={mixed||api.busy||api.conflict||basketChanged||!fresh||!api.online||!lines.length||!!api.pending&&!api.pending.path.endsWith('/quote')} onClick={()=>void edit(true)}>{api.pending?.path.endsWith('/quote')?ux.retry:ux.review}</button></div>
    {basket.quote&&!dirty&&<div className="rst-selling-quote"><h4>{ux.total} · {displayMoney(basket.quote.order_total,locale)} {basket.quote.currency}</h4><details><summary>{ux.review}</summary><FoodTerms terms={basket.quote} locale={locale}/></details><p>{ux.quoteHelp}</p><button type="button" className="button button-primary" disabled={!config?.intake_released&&!api.pending||api.busy||api.conflict||basketChanged||!fresh||!api.online||!!api.pending&&!api.pending.path.endsWith('/prepare')} onClick={()=>void finalize()}>{api.pending?.path.endsWith('/prepare')?ux.retry:ux.confirm}</button></div>}
    </>}
   </aside>
  </div>}
  {!order&&!showPayment&&!heldOpen&&<button type="button" className="rst-selling-mobile-summary" onClick={()=>setBasketOpen(true)} aria-expanded={basketOpen}><span>{ux.view} · {count} {c.items}</span><span>{totalText}</span></button>}
  {pos&&!order&&!showPayment&&!heldOpen&&<section className="rst-selling-recent"><h3>{ux.orders}</h3>{recent.map(value=><details key={value.order_ref}><summary><strong>{value.order_ref}</strong> · {dateText(value.submitted_at,locale)}</summary><ReceiptCard order={value} locale={locale}/>{!terminal(value)&&<button type="button" onClick={()=>{setOrder(value);setMoneyGroupRef(value.bill_group_ref??null);setShowPayment(false);}}>{solo.orders}</button>}{value.bill_group_ref&&<button type="button" onClick={()=>{setOrder(value);setMoneyGroupRef(value.bill_group_ref!);setShowPayment(true);}}>{workflowText(locale,'recordPayment')}</button>}</details>)}</section>}
  {choice&&<RestaurantItemChoice item={choice} locale={locale} busy={api.busy||!api.online||!fresh||api.conflict||basketChanged} onClose={()=>setChoice(null)} onAdd={value=>void addItem(choice,value)}/>}
  {heldOpen&&<section className="rst-held"><header><h2>{ux.held} ({held.length}{heldMore?'+':''})</h2><button type="button" disabled={locked} onClick={()=>setHeldOpen(false)}>{ux.menu}</button></header><p>{ux.heldHelp}</p>{!held.length&&<p>{ux.heldEmpty}</p>}{heldMore&&<p>{ux.moreHeld}</p>}{held.map(value=><article key={value.basket_ref}><h3>{ux.draft} · {value.basket_ref}</h3><p>{[...(value.selections?.standalone??[]),...(value.selections?.plates.flatMap(p=>p.components)??[])].map(l=>(l.quantity??1)+' × '+(items.find(i=>i.public_ref===l.item_ref)?.name??l.item_ref)).join(' · ')}</p><p>{ux.expires} {dateText(value.expires_at,locale)}</p>{value.quote&&<strong>{displayMoney(value.quote.order_total,locale)} {value.quote.currency}</strong>}<button type="button" disabled={locked} onClick={()=>void resume(value.basket_ref)}>{ux.resume}</button></article>)}</section>}
 </article>;
}
