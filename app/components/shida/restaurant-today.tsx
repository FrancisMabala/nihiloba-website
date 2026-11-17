'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {request,DashboardApiError} from '../../lib/restaurant-seller-browser';
import {workText} from '../../lib/restaurant-work-copy';
import {operationsCopy,operationDay,operationTime} from '../../lib/restaurant-operations-copy';
import {displayMoney} from '../../lib/restaurant-counter-values';
import './restaurant-operations.css';
import {SpaceIcon} from './account-space-icon';

type Locale='fr'|'en'|'ln'|'sw';
type Order={order_ref:string;state:string;submitted_at:string;fulfillment_method:string};
type Reservation={reservation_ref:string;state:string;starts_at:string;party_size:number};
type Page<T>={items:T[];total?:number;has_more?:boolean};
type Snapshot={pending?:Page<Order>;preparing?:Page<Order>;ready?:Page<Order>;reservations?:Page<Reservation>;upcoming?:Page<Reservation>;visits?:Page<{group_ref:string;state:string}>;stock?:Page<{item_ref:string;name:string;low_stock:boolean}>;intake?:{intake_released:boolean};money?:{as_of:string;time_zone:string;currencies:Record<string,{recorded_net:string;balance_due:string}>}};
type Key=keyof Snapshot;
type Failure='unavailable'|'restricted'|'zoneRequired';
export function RestaurantToday({path,binding,locale,zone,canSell,canStock,canEditIntake,canReservations=false,onOpen}:{path:string;binding:string;locale:Locale;zone:string|null;canPrepare:boolean;canSell:boolean;canStock:boolean;canEditIntake:boolean;canReservations?:boolean;onOpen:(tab:string)=>void}){
 const c=operationsCopy[locale], [data,setData]=useState<Snapshot>({}),[errors,setErrors]=useState<Partial<Record<Key,Failure>>>({}),[busy,setBusy]=useState<Key[]>([]),[updated,setUpdated]=useState<string|null>(null),[now,setNow]=useState(()=>new Date());
 const active=useRef(new Map<Key,AbortController>()),epoch=useRef(0);
 const day=operationDay(zone,now);
 const load=useCallback(async(only?:Key)=>{
  if(active.current.size)return;
  const generation=epoch.current;
  const until=day?new Date(Date.parse(day+'T12:00:00Z')+7*86400000).toISOString().slice(0,10):null;
  const reads:[Key,string][]=[['pending',`${path}/orders?states=pending&page=1&page_size=5`],['preparing',`${path}/orders?states=accepted&states=preparing&page=1&page_size=1`],['ready',`${path}/orders?states=ready&page=1&page_size=5`],['intake',`${path}/order-configuration`]];
  if(canReservations){reads.push(['reservations',`${path}/reservations/pending?page=1&page_size=5`]);if(day)reads.push(['upcoming',`${path}/reservations/calendar?date_from=${day}&date_to=${until}&page=1&page_size=10`]);}
  if(canSell)reads.push(['visits',`${path}/service/groups?page=1`]);
  if(canSell&&canEditIntake)reads.push(['money',`${path}/service/daily/summary`]);
  if(canStock)reads.push(['stock',`${path}/inventory?low_stock=true&page=1&page_size=3`]);
  const selected=reads.filter(([key])=>(!only||key===only)&&!active.current.has(key)).map(([key,url])=>{const controller=new AbortController();active.current.set(key,controller);return {key,url,controller};});
  if(!selected.length)return;
  setBusy(keys=>[...new Set([...keys,...selected.map(r=>r.key)])]);
  // These reads share ownership locks on the backend. A dashboard must not
  // occupy all four admission slots with a burst of competing requests.
  let complete=true;
  for(const {key,url,controller} of selected){
   if(generation!==epoch.current||controller.signal.aborted)return;
   try{
    const value=await request(url,{signal:controller.signal},binding);
    if(generation!==epoch.current)return;
    setData(previous=>({...previous,[key]:value}));
    setErrors(previous=>{const next={...previous};delete next[key];return next;});
   }catch(error){
    if(generation!==epoch.current)return;
    complete=false;
    const failure:Failure=error instanceof DashboardApiError&&[401,403,404].includes(error.status)?'restricted':error instanceof DashboardApiError&&error.detail==='restaurant_time_zone_required'?'zoneRequired':'unavailable';
    setErrors(previous=>({...previous,[key]:failure}));
    if(failure==='restricted')setData(previous=>{const next={...previous};delete next[key];return next;});
   }finally{
    if(generation===epoch.current){if(active.current.get(key)===controller)active.current.delete(key);setBusy(keys=>keys.filter(value=>value!==key));}
   }
  }
  if(!only&&complete)setUpdated(new Date().toISOString());
 },[path,binding,day,canSell,canEditIntake,canStock,canReservations]);
 useEffect(()=>{epoch.current++;const controllers=active.current,generation=epoch;queueMicrotask(()=>void load());const refresh=(event:Event)=>{if((event as CustomEvent).detail?.path===path){setNow(new Date());void load();}};window.addEventListener('rst-refresh',refresh);return()=>{generation.current++;controllers.forEach(controller=>controller.abort());controllers.clear();window.removeEventListener('rst-refresh',refresh);};},[load,path]);
 function open(tab:string,query:Record<string,string>={}){const url=new URL(location.href);['order','orderStates','reservation','stockFilter'].forEach(key=>url.searchParams.delete(key));Object.entries(query).forEach(([key,value])=>url.searchParams.set(key,value));history.replaceState(history.state,'',url);onOpen(tab);}
 const number=(key:Key)=>{const page=data[key];if(!page)return busy.includes(key)?'…':'—';if('items' in page)return new Intl.NumberFormat(locale).format(page.total??page.items.length)+(page.total===undefined&&page.has_more?'+':'');return '—';};
 const problem=(key:Key)=>errors[key]?<div className="rst-ops-error" role="status"><span>{c[errors[key]!]} {data[key]?c.stale:''}</span><button type="button" disabled={busy.length>0} onClick={()=>void load(key)}>{c.retry}</button></div>:null;
 const money=(value:string)=>`${value.startsWith('-')?'−':''}${displayMoney(value.replace(/^-/,'') ,locale)}`;
 const work=[...(data.pending?.items??[]),...(data.ready?.items??[])].sort((a,b)=>Number(b.state==='pending')-Number(a.state==='pending')||a.submitted_at.localeCompare(b.submitted_at)).slice(0,5);
 const reservations=(data.reservations?.items??[]).slice(0,Math.max(0,5-work.length));
 const actionKeys:Key[]=['pending','ready',...(canReservations?['reservations' as const]:[])];
 const actionsLoading=actionKeys.some(key=>busy.includes(key)&&!data[key]);
 const actionsIncomplete=actionKeys.some(key=>errors[key]||!data[key]);
 return <section className="rst-today rst-operations" lang={locale}>
  <header className="rst-ops-heading"><div className="rst-ops-date"><h2>{c.today}</h2><p>{day?new Intl.DateTimeFormat(locale,{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:zone!}).format(now):c.unknownZone}</p></div><div className="rst-ops-actions">{canSell&&<button className="primary" type="button" onClick={()=>open('pos')}>+ {c.newSale}</button>}<button className="rst-today-refresh" type="button" aria-label={c.refresh} aria-busy={busy.length>0} disabled={busy.length>0} onClick={()=>{setNow(new Date());void load();}}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 7a9 9 0 1 0 1 7M20 2v6h-6"/></svg><span>{c.refresh}</span></button></div></header>
  <div className="rst-ops-metrics">
   <article className="rst-metric-incoming"><button onClick={()=>open('orders',{orderStates:'pending'})}><span className="rst-ops-metric-label"><i><SpaceIcon name="orders"/></i>{c.incoming}</span><strong>{number('pending')}</strong></button>{problem('pending')}</article>
   <article className="rst-metric-preparing"><button onClick={()=>open('orders',{orderStates:'accepted,preparing'})}><span className="rst-ops-metric-label"><i><SpaceIcon name="restaurant"/></i>{c.preparing}</span><strong>{number('preparing')}</strong></button><button className="rst-ops-secondary-count" onClick={()=>open('orders',{orderStates:'ready'})}>{c.ready} <b>{number('ready')}</b></button>{problem('preparing')}{problem('ready')}</article>
   {canReservations&&<article><button onClick={()=>open('reservations')}><span className="rst-ops-metric-label"><i><SpaceIcon name="requests"/></i>{c.reservations}</span><strong>{number('reservations')} <small>{c.requests}</small></strong></button><span className="rst-ops-secondary-count">{c.upcoming} {data.upcoming?data.upcoming.items.filter(r=>r.state==='accepted').length+(data.upcoming.has_more?'+':''):'—'}</span>{problem('reservations')}{problem('upcoming')}</article>}
   {canStock&&<article className={!errors.stock&&!busy.includes('stock')&&data.stock&&(data.stock.total??data.stock.items.length)>0?'rst-metric-stock-attention':'rst-metric-stock'}><button onClick={()=>open('inventory',{stockFilter:'low'})}><span className="rst-ops-metric-label"><i><SpaceIcon name="warning"/></i>{c.lowStock}</span><strong>{number('stock')}</strong></button>{problem('stock')}</article>}
   {canSell&&<article className="rst-metric-visits"><button aria-label={c.visits} onClick={()=>open('service')}><span className="rst-ops-metric-label"><i><SpaceIcon name="people"/></i>{c.visitsShort}</span><strong>{data.visits?data.visits.items.filter(r=>r.state!=='closed').length+(data.visits.has_more?'+':''):busy.includes('visits')?'…':'—'}</strong></button>{problem('visits')}</article>}
  </div>
  {Object.keys(errors).length>1&&<p className="rst-ops-partial" role="status">{c.partial}</p>}
  <div className="rst-ops-columns">
   <section className="rst-ops-panel"><header><h3>{c.actions}</h3><button className="text-link" onClick={()=>open('orders')}>{c.all}</button></header>
    {work.map(order=><article className="rst-ops-work" key={order.order_ref}><div><strong>{order.order_ref} · {workText(locale,order.fulfillment_method)}</strong><p>{operationTime(order.submitted_at,locale,zone,true)}</p></div><span className={`rst-ops-status ${order.state}`}>{workText(locale,order.state)}</span><button onClick={()=>open('orders',{order:order.order_ref})}>{c.order}</button></article>)}
    {reservations.map(reservation=><article className="rst-ops-work" key={reservation.reservation_ref}><div><strong>{c.reservation.replace('{count}',String(reservation.party_size))}</strong><p>{operationTime(reservation.starts_at,locale,zone,true)}</p></div><button onClick={()=>open('reservations',{reservation:reservation.reservation_ref})}>{c.request}</button></article>)}
    {actionsIncomplete&&<p className="rst-ops-incomplete" role="status">{actionsLoading?c.loading:c.incomplete}</p>}
    {!actionsIncomplete&&!work.length&&!reservations.length&&<p>{c.empty}</p>}
   </section>
   {canSell&&canEditIntake&&<section className="rst-ops-panel rst-ops-money"><header><h3>{c.collections}</h3></header>{problem('money')}
    {data.money?<><dl>{Object.entries(data.money.currencies).map(([currency,value])=><div key={currency}><dt>{currency}</dt><dd>{money(value.recorded_net)}</dd></div>)}</dl><details className="rst-money-explanation"><summary>{c.due}</summary><dl>{Object.entries(data.money.currencies).map(([currency,value])=><div key={currency}><dt>{currency}</dt><dd>{money(value.balance_due)}</dd></div>)}</dl></details></>:!errors.money&&<p>{busy.includes('money')?c.loading:c.unavailable}</p>}
    <details className="rst-money-explanation"><summary>{c.about}</summary><small>{c.recorded}</small><p>{c.coverage}</p></details><button className="text-link" onClick={()=>open('daily')}>{c.moneyLink} →</button>
   </section>}
  </div>
  {canStock&&!!data.stock?.items.length&&<aside className="rst-ops-stock"><div><strong>{data.stock.total===1?c.checkOne:c.checkMany.replace('{count}',number('stock'))}</strong><p>{data.stock.items.map(item=>item.name).join(' · ')}</p></div><button onClick={()=>open('inventory',{stockFilter:'low'})}>{c.stockLink}</button></aside>}
  {data.intake&&!data.intake.intake_released&&<p>{c.closed} {canEditIntake&&<button className="text-link" onClick={()=>open('intake')}>{c.intake}</button>}</p>}
  {updated&&<p className="rst-ops-updated">{c.updated.replace('{time}',operationTime(updated,locale,zone))}</p>}
 </section>;
}
