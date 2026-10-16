"use client";
import {useEffect,useState} from 'react';
import {useWenzeApi} from '@/app/lib/wenze-seller-api';
import {sellerText} from '@/app/lib/wenze-seller-copy';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
import {WenzeReportFacts} from './wenze-report-facts';
type Shop={public_ref:string;name:string;catalog_ready?:boolean;order_ready?:boolean};
type Row=Record<string,unknown>;
const object=(value:unknown):Row=>value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{};
const array=(value:unknown):Row[]=>Array.isArray(value)?value as Row[]:[];
export function WenzeToday({store,stores,locale,onChoose,onNavigate}:{store:Shop|null;stores:Shop[];locale:WenzeLocale;onChoose:(shop:Shop)=>void;onNavigate:(tab:string)=>void}){
 const {request}=useWenzeApi(),t=(key:string)=>sellerText(locale,key);
 const [snapshot,setSnapshot]=useState<{plan:Row|null;orders:Row|null;stock:Row|null;report:Row|null}>({plan:null,orders:null,stock:null,report:null});
 const [refresh,setRefresh]=useState(0),[busy,setBusy]=useState(false),[partial,setPartial]=useState(false);
 useEffect(()=>{if(!store)return;let active=true;const base=`wenze/contexts/personal/stores/${encodeURIComponent(store.public_ref)}`;
  async function load(){setBusy(true);setPartial(false);setSnapshot({plan:null,orders:null,stock:null,report:null});
   const results=await Promise.allSettled([request(`${base}/plan`),request(`wenze/contexts/personal/orders?store_ref=${encodeURIComponent(store!.public_ref)}&language=${locale}&bucket=action_required&limit=5`),request(`${base}/inventory/summary`)]);
   if(!active)return;const [p,o,s]=results.map(result=>result.status==='fulfilled'?object(result.value):null);setSnapshot({plan:p,orders:o,stock:s,report:null});let failed=results.some(r=>r.status==='rejected');
   if(p?.plan==='pro'){try{const report=object(await request(`${base}/pro/dashboard?period=today&top_limit=5&low_stock_limit=5`));if(active)setSnapshot(old=>({...old,report}));}catch{failed=true;}}
   if(active){setPartial(failed);setBusy(false);}
  }void load();return()=>{active=false;};
 },[store,locale,request,refresh]);
 if(!store)return <section className="wz-today"><h2>{t('todayTitle')}</h2><p>{t('choose')}</p><div className="wz-grid">{stores.map(shop=><button className="wz-card" key={shop.public_ref} onClick={()=>onChoose(shop)}>{shop.name}</button>)}</div><button onClick={()=>onNavigate('catalog')}>{t('create')}</button></section>;
 const counts=object(snapshot.orders?.counts),stock=snapshot.stock,report=snapshot.report;
 const metric=(title:string,value:unknown,destination:string)=><button className="wz-today-metric" onClick={()=>onNavigate(destination)}><span>{t(title)}</span><strong>{typeof value==='number'?new Intl.NumberFormat(locale).format(value):'—'}</strong><span aria-hidden="true">↗</span></button>;
 return <section className="wz-today"><div className="wz-today-heading"><div><h2>{t('todayTitle')}</h2><p>{t('todayWork')}</p></div><button disabled={busy} onClick={()=>setRefresh(refresh+1)}>{t('refresh')}</button></div>
 {snapshot.plan?.source==='personal_pilot'&&<aside className="wz-pilot"><strong>{t('pilotTitle')}</strong><p>{t('pilotNote')}</p></aside>}
 {busy&&<p role="status">{t('loading')}</p>}{partial&&<p role="alert">{t('partialToday')}</p>}
 <h3>{t('currentWork')}</h3><div className="wz-today-metrics">{metric('actionRequired',counts.action_required,'orders')}{metric('inProgress',counts.in_progress,'orders')}{metric('lowStockCount',stock?.low_stock_items,'inventory')}{metric('stockUnknown',stock?Number(stock.untracked_items??0)+Number(stock.uninitialized_items??0):null,'inventory')}</div>
 {(!store.catalog_ready||!store.order_ready)&&<div className="wz-actions">{!store.catalog_ready&&<button onClick={()=>onNavigate('catalog')}>{t('setupShop')}</button>}{!store.order_ready&&<button onClick={()=>onNavigate('catalog')}>{t('setupOrders')}</button>}</div>}
 <h3>{t('quickActions')}</h3><div className="wz-actions">{['orders','catalog','sales','inventory','expenses','imports'].map(tab=><button key={tab} onClick={()=>onNavigate(tab)}>{t(tab)}</button>)}</div>
 <h3>{t('todayStats')}</h3>{report?<><p>{t('reportHint')}</p>{array(report.currency_summaries).length===0?<p>{t('noTodaySales')}</p>:<div className="wz-grid">{array(report.currency_summaries).map(row=>{const sales=object(row.combined_sales);return <article className="wz-card" key={String(row.currency)}><h4>{String(row.currency)}</h4><WenzeReportFacts locale={locale} value={{total_revenue:sales.total_revenue,quantity_sold:sales.quantity_sold,known_gross_profit:sales.known_gross_profit,recorded_operating_expenses:object(row.recorded_operating_expenses).total,operational_result:row.operational_result}}/>{object(row.completeness).profit_complete===false&&<p className="wz-today-warning">{t('missingCostsWarning')}</p>}</article>;})}</div>}<button onClick={()=>onNavigate('reports')}>{t('reports')} →</button></>:!busy&&snapshot.plan?.plan==='free'?<p>{t('todayFree')}</p>:!busy&&<p>{t('unavailable')}</p>}
 </section>;
}
