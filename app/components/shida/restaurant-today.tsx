'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {request,DashboardApiError} from '../../lib/restaurant-seller-browser';
import {workText} from '../../lib/restaurant-work-copy';
import {operationsCopy,operationDay,operationTime} from '../../lib/restaurant-operations-copy';
import {displayMoney} from '../../lib/restaurant-counter-values';
import './restaurant-operations.css';
import {SpaceIcon} from './account-space-icon';
import {todayOrderKeys,validTodayOrders} from '../../lib/restaurant-today-contract';
import {todayRecoveryCopy} from '../../lib/restaurant-today-recovery-copy';

type Locale='fr'|'en'|'ln'|'sw';
type Order={order_ref:string;state:string;submitted_at:string;fulfillment_method:string};
type Reservation={reservation_ref:string;state:string;starts_at:string;party_size:number};
type Page<T>={items:T[];total?:number;has_more?:boolean};
type Snapshot={pending?:Page<Order>;preparing?:Page<Order>;ready?:Page<Order>;reservations?:Page<Reservation>;upcoming?:Page<Reservation>;visits?:Page<{group_ref:string;state:string}>;stock?:Page<{item_ref:string;name:string;low_stock:boolean}>;intake?:{intake_released:boolean};money?:{as_of:string;time_zone:string;currencies:Record<string,{recorded_net:string;balance_due:string}>}};
type Key=keyof Snapshot;
type Failure='unavailable'|'restricted'|'zoneRequired'|'summaryLimit'|'intakeUnknown';
type Job={key:Key|'orders';keys:Key[];url:string};
const orderKeys:Key[]=[...todayOrderKeys,'intake'];
const priority:Key[]=['pending','ready','reservations','preparing','stock','visits','money','upcoming','intake'];
async function timedSummary(path:string,binding:string,signal:AbortSignal){
 const controller=new AbortController(),abort=()=>controller.abort();
 signal.addEventListener('abort',abort,{once:true});
 if(signal.aborted)controller.abort();
 const timer=setTimeout(abort,12000);
 try{return await request(`${path}/today-orders`,{signal:controller.signal},binding);}
 finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
}
export function RestaurantToday({path,binding,locale,zone,canSell,canStock,canEditIntake,canReservations=false,onOpen}:{path:string;binding:string;locale:Locale;zone:string|null;canPrepare:boolean;canSell:boolean;canStock:boolean;canEditIntake:boolean;canReservations?:boolean;onOpen:(tab:string)=>void}){
 const c={...operationsCopy[locale],...todayRecoveryCopy[locale]}, [data,setData]=useState<Snapshot>({}),[errors,setErrors]=useState<Partial<Record<Key,Failure>>>({}),[busy,setBusy]=useState<Key[]>([]),[updated,setUpdated]=useState<string|null>(null),[now,setNow]=useState(()=>new Date());
 const active=useRef(new Map<Key,AbortController>()),epoch=useRef(0),retryQueue=useRef<Key[]>([]);
 const summarySupported=useRef(true);
 const summaryRetryAt=useRef(0),summaryLastError=useRef<unknown>(null);
 const [summaryFailure,setSummaryFailure]=useState<Failure|null>(null),[retryAt,setRetryAt]=useState(0),[retryClock,setRetryClock]=useState(()=>Date.now());
 useEffect(()=>{if(retryAt<=Date.now())return;const timer=setTimeout(()=>setRetryClock(Date.now()),Math.min(1000,retryAt-Date.now()));return()=>clearTimeout(timer);},[retryAt,retryClock]);
 const day=operationDay(zone,now);
 const load=useCallback(async(only?:Key)=>{
  if(only&&orderKeys.includes(only)&&summarySupported.current&&Date.now()<summaryRetryAt.current)return;
  if(active.current.size){
   // Queue a failed section behind the current read instead of holding its retry
   // control disabled until unrelated money/stock requests finish. Deduplicate taps.
   if(only&&!active.current.has(only)&&!retryQueue.current.includes(only)){
    retryQueue.current.push(only);setBusy(keys=>[...new Set([...keys,only])]);
   }
   return;
  }
  const generation=epoch.current;
  const until=day?new Date(Date.parse(day+'T12:00:00Z')+7*86400000).toISOString().slice(0,10):null;
  const reads:[Key,string][]=[['pending',`${path}/orders?states=pending&page=1&page_size=5`],['preparing',`${path}/orders?states=accepted&states=preparing&page=1&page_size=1`],['ready',`${path}/orders?states=ready&page=1&page_size=5`]];
  if(canReservations){reads.push(['reservations',`${path}/reservations/pending?page=1&page_size=5`]);if(day)reads.push(['upcoming',`${path}/reservations/calendar?date_from=${day}&date_to=${until}&page=1&page_size=10`]);}
  if(canSell)reads.push(['visits',`${path}/service/groups?page=1`]);
  if(canSell&&canEditIntake)reads.push(['money',`${path}/service/daily/summary`]);
  if(canStock)reads.push(['stock',`${path}/inventory?low_stock=true&page=1&page_size=3`]);
  const jobs=(key?:Key):Job[]=>[
   ...(summarySupported.current?[{key:'orders' as const,keys:orderKeys,url:`${path}/today-orders`}]:[]),
   ...reads.filter(([candidate])=>!summarySupported.current||!orderKeys.includes(candidate)).map(([candidate,url])=>({key:candidate,keys:[candidate],url})),
  ].filter(job=>!key||job.keys.includes(key)).sort((a,b)=>priority.indexOf(a.keys[0])-priority.indexOf(b.keys[0]));
  const schedule=(job:Job)=>{const controller=new AbortController();job.keys.forEach(key=>active.current.set(key,controller));setBusy(keys=>[...new Set([...keys,...job.keys])]);return {...job,controller};};
  const selected=jobs(only).filter(job=>!job.keys.some(key=>active.current.has(key))).map(schedule);
  if(!selected.length)return;
  // These reads share ownership locks on the backend. A dashboard must not
  // occupy all four admission slots with a burst of competing requests.
  let complete=summarySupported.current;
  while(selected.length){
   const {key,keys,url,controller}=selected.shift()!;
   let compatibility=false,fromCooldown=false;
   if(generation!==epoch.current||controller.signal.aborted)return;
   try{
    if(key==='orders'){
     if(Date.now()<summaryRetryAt.current){fromCooldown=true;throw summaryLastError.current;}
     const value=await timedSummary(path,binding,controller.signal);
     if(!validTodayOrders(value))throw new DashboardApiError('unavailable',502);
     if(generation!==epoch.current||controller.signal.aborted)return;
     const intake=typeof value.intake_released==='boolean'?{intake_released:value.intake_released}:undefined;
     setData(previous=>({...previous,...value.sections,intake}));
     setErrors(previous=>{const next={...previous};orderKeys.forEach(key=>delete next[key]);if(!intake)next.intake='intakeUnknown';return next;});
     if(!intake)complete=false;
     summaryRetryAt.current=0;summaryLastError.current=null;setRetryAt(0);setSummaryFailure(null);
    }else{
     const value=await request(url,{signal:controller.signal},binding);
     if(generation!==epoch.current||controller.signal.aborted)return;
     setData(previous=>({...previous,[key]:value}));
     setErrors(previous=>{const next={...previous};delete next[key];return next;});
    }
   }catch(error){
    if(generation!==epoch.current||controller.signal.aborted)return;
    complete=false;
    if(key==='orders'&&error instanceof DashboardApiError&&[404,405].includes(error.status)&&error.detail==='restaurant_today_unsupported'){
     summarySupported.current=false;compatibility=true;setSummaryFailure(null);
     setData(previous=>({...previous,intake:undefined}));setErrors(previous=>({...previous,intake:'intakeUnknown'}));
    }else{
     const failure:Failure=error instanceof DashboardApiError&&[401,403,404].includes(error.status)?'restricted':error instanceof DashboardApiError&&error.detail==='restaurant_today_limit'?'summaryLimit':error instanceof DashboardApiError&&error.detail==='restaurant_time_zone_required'?'zoneRequired':'unavailable';
     setErrors(previous=>({...previous,...Object.fromEntries(keys.map(key=>[key,failure]))}));
     if(key==='orders'){
      setSummaryFailure(failure);
      if(!fromCooldown){summaryLastError.current=error;summaryRetryAt.current=Date.now()+(error instanceof DashboardApiError?error.retryAfterMs??0:0);setRetryAt(summaryRetryAt.current);setRetryClock(Date.now());}
     }
     if(failure==='restricted'||key==='orders')setData(previous=>{const next={...previous};keys.forEach(key=>{if(failure==='restricted'||key==='intake')delete next[key];});return next;});
    }
   }finally{
    if(generation===epoch.current){keys.forEach(key=>{if(active.current.get(key)===controller)active.current.delete(key);});setBusy(previous=>previous.filter(value=>!keys.includes(value)));}
   }
   if(compatibility){selected.push(...jobs().filter(job=>todayOrderKeys.includes(job.key as typeof todayOrderKeys[number])).map(schedule));selected.sort((a,b)=>priority.indexOf(a.keys[0])-priority.indexOf(b.keys[0]));}
   // Still exactly one request in flight. A retry takes the next queue slot.
   for(const retry of retryQueue.current.splice(0).reverse()){
    for(const job of jobs(retry).reverse())if(!job.keys.some(key=>active.current.has(key)))selected.unshift(schedule(job));
   }
  }
  if(!only&&complete)setUpdated(new Date().toISOString());
 },[path,binding,day,canSell,canEditIntake,canStock,canReservations]);
 useEffect(()=>{epoch.current++;const controllers=active.current,generation=epoch;queueMicrotask(()=>void load());const refresh=(event:Event)=>{if((event as CustomEvent).detail?.path===path){setNow(new Date());void load();}};window.addEventListener('rst-refresh',refresh);return()=>{generation.current++;retryQueue.current=[];controllers.forEach(controller=>controller.abort());controllers.clear();window.removeEventListener('rst-refresh',refresh);};},[load,path]);
 function open(tab:string,query:Record<string,string>={}){const url=new URL(location.href);['order','orderStates','reservation','stockFilter'].forEach(key=>url.searchParams.delete(key));Object.entries(query).forEach(([key,value])=>url.searchParams.set(key,value));history.replaceState(history.state,'',url);onOpen(tab);}
 const number=(key:Key)=>{const page=data[key];if(!page)return busy.includes(key)?'…':'—';if('items' in page)return new Intl.NumberFormat(locale).format(page.total??page.items.length)+(page.total===undefined&&page.has_more?'+':'');return '—';};
 const problem=(key:Key)=>errors[key]&&!(summaryFailure&&orderKeys.includes(key))?<div className="rst-ops-error" role="status"><span>{c[errors[key]!]} {data[key]?c.stale:''}</span><button type="button" disabled={busy.includes(key)} onClick={()=>void load(key)}>{c.retry}</button></div>:null;
 const retrySeconds=Math.max(0,Math.ceil((retryAt-retryClock)/1000));
 const money=(value:string)=>`${value.startsWith('-')?'−':''}${displayMoney(value.replace(/^-/,'') ,locale)}`;
 const work=[...(data.pending?.items??[]),...(data.ready?.items??[])].sort((a,b)=>Number(b.state==='pending')-Number(a.state==='pending')||a.submitted_at.localeCompare(b.submitted_at)).slice(0,5);
 const reservations=(data.reservations?.items??[]).slice(0,Math.max(0,5-work.length));
 const actionKeys:Key[]=['pending','ready',...(canReservations?['reservations' as const]:[])];
 const actionsLoading=actionKeys.some(key=>busy.includes(key)&&!data[key]);
 const actionsIncomplete=actionKeys.some(key=>errors[key]||!data[key]);
 return <section className="rst-today rst-operations" lang={locale}>
  <header className="rst-ops-heading"><div className="rst-ops-date"><h2>{c.today}</h2><p>{day?new Intl.DateTimeFormat(locale,{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:zone!}).format(now):c.unknownZone}</p></div><div className="rst-ops-actions">{canSell&&<button className="primary" type="button" onClick={()=>open('pos')}>+ {c.newSale}</button>}<button className="rst-today-refresh" type="button" aria-label={c.refresh} aria-busy={busy.length>0} disabled={busy.length>0} onClick={()=>{setNow(new Date());void load();}}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 7a9 9 0 1 0 1 7M20 2v6h-6"/></svg><span>{c.refresh}</span></button></div></header>
  {summaryFailure&&<div className="rst-ops-error rst-today-summary-error" role="status"><span>{c[summaryFailure]} {todayOrderKeys.some(key=>data[key])?c.stale:''}</span><button type="button" disabled={orderKeys.some(key=>busy.includes(key))||retrySeconds>0} onClick={()=>void load('pending')}>{retrySeconds?c.retryWait.replace('{seconds}',String(retrySeconds)):c.retry}</button></div>}
  <div className="rst-ops-metrics">
   <article className="rst-metric-incoming shida-summary-card" data-summary-tone="blue"><button onClick={()=>open('orders',{orderStates:'pending'})}><span className="rst-ops-metric-label"><i><SpaceIcon name="orders"/></i>{c.incoming}</span><strong>{number('pending')}</strong></button>{problem('pending')}</article>
   <article className="rst-metric-preparing shida-summary-card" data-summary-tone="amber"><button onClick={()=>open('orders',{orderStates:'accepted,preparing'})}><span className="rst-ops-metric-label"><i><SpaceIcon name="restaurant"/></i>{c.preparing}</span><strong>{number('preparing')}</strong></button><button className="rst-ops-secondary-count" onClick={()=>open('orders',{orderStates:'ready'})}>{c.ready} <b>{number('ready')}</b></button>{problem('preparing')}{problem('ready')}</article>
   {canReservations&&<article className="shida-summary-card" data-summary-tone="green"><button onClick={()=>open('reservations')}><span className="rst-ops-metric-label"><i><SpaceIcon name="requests"/></i>{c.reservations}</span><strong>{number('reservations')} <small>{c.requests}</small></strong></button><span className="rst-ops-secondary-count">{c.upcoming} {data.upcoming?data.upcoming.items.filter(r=>r.state==='accepted').length+(data.upcoming.has_more?'+':''):'—'}</span>{problem('reservations')}{problem('upcoming')}</article>}
   {canStock&&<article data-summary-tone="amber" className={!errors.stock&&!busy.includes('stock')&&data.stock&&(data.stock.total??data.stock.items.length)>0?'rst-metric-stock-attention shida-summary-card':'rst-metric-stock shida-summary-card'}><button onClick={()=>open('inventory',{stockFilter:'low'})}><span className="rst-ops-metric-label"><i><SpaceIcon name="warning"/></i>{c.lowStock}</span><strong>{number('stock')}</strong></button>{problem('stock')}</article>}
   {canSell&&<article className="rst-metric-visits shida-summary-card" data-summary-tone="purple"><button aria-label={c.visits} onClick={()=>open('service')}><span className="rst-ops-metric-label"><i><SpaceIcon name="people"/></i>{c.visitsShort}</span><strong>{data.visits?data.visits.items.filter(r=>r.state!=='closed').length+(data.visits.has_more?'+':''):busy.includes('visits')?'…':'—'}</strong></button>{problem('visits')}</article>}
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
  {!summaryFailure&&errors.intake&&<p role="status">{c.intakeUnknown} {canEditIntake&&<button className="text-link" onClick={()=>open('intake')}>{c.intake}</button>}</p>}
  {!errors.intake&&data.intake?.intake_released===false&&<p>{c.closed} {canEditIntake&&<button className="text-link" onClick={()=>open('intake')}>{c.intake}</button>}</p>}
  {updated&&<p className="rst-ops-updated">{c.updated.replace('{time}',operationTime(updated,locale,zone))}</p>}
 </section>;
}
