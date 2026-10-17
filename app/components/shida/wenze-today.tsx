"use client";
import Image from 'next/image';
import {useEffect,useState} from 'react';
import {useWenzeApi} from '@/app/lib/wenze-seller-api';
import {sellerText} from '@/app/lib/wenze-seller-copy';
import {wenzeDesignText} from '@/app/lib/wenze-design-copy';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
type Shop={public_ref:string;name:string;city?:string;catalog_ready?:boolean;order_ready?:boolean};
type Daily={date:string;timezone:string;followers:number;new_followers:number;orders_today:number;reviews:{count:number;average:number|null};financial_access:boolean;currency_summaries:{currency:string;revenue:string;quantity:number;known_profit:string;profit_complete:boolean;expenses:string}[]|null;sold_items:{product_ref:string;variant_ref:string|null;label:string;currency:string;quantity:number;revenue:string;image_url:string|null}[]};
type Row=Record<string,unknown>;
export function WenzeToday({store,stores,locale,onChoose,onNavigate}:{store:Shop|null;stores:Shop[];locale:WenzeLocale;onChoose:(shop:Shop)=>void;onNavigate:(tab:string)=>void}){
 const {request}=useWenzeApi(),t=(key:string)=>sellerText(locale,key),d=(key:string)=>wenzeDesignText(locale,key);
 const [daily,setDaily]=useState<Daily|null>(null),[orders,setOrders]=useState<Row|null>(null),[stock,setStock]=useState<Row|null>(null);
 const [zone,setZone]=useState(store?.city?.toLowerCase()==='lubumbashi'?'Africa/Lubumbashi':'Africa/Kinshasa');
 const [refresh,setRefresh]=useState(0),[busy,setBusy]=useState(false),[partial,setPartial]=useState(false);
 useEffect(()=>{if(!store)return;let active=true;const base=`wenze/contexts/personal/stores/${encodeURIComponent(store.public_ref)}`;
  async function load(){setBusy(true);setDaily(null);setOrders(null);setStock(null);setPartial(false);
   const results=await Promise.allSettled([request(`${base}/today?timezone=${encodeURIComponent(zone)}`),request(`wenze/contexts/personal/orders?store_ref=${encodeURIComponent(store!.public_ref)}&language=${locale}&bucket=action_required&limit=5`),request(`${base}/inventory/summary`)]);
   if(!active)return;setDaily(results[0].status==='fulfilled'?results[0].value as Daily:null);setOrders(results[1].status==='fulfilled'?(results[1].value as {counts:Row}).counts:null);setStock(results[2].status==='fulfilled'?results[2].value as Row:null);setPartial(results.some(r=>r.status==='rejected'));setBusy(false);
  }void load();const timer=setInterval(()=>void load(),60000);return()=>{active=false;clearInterval(timer);};
 },[store,locale,request,refresh,zone]);
 if(!store)return <section className="wz-today"><h2>{t('todayTitle')}</h2><p>{t('choose')}</p><div className="wz-grid">{stores.map(shop=><button className="wz-card" key={shop.public_ref} onClick={()=>onChoose(shop)}>{shop.name}</button>)}</div><button onClick={()=>onNavigate('catalog')}>{t('create')}</button></section>;
 const money=(value:string,currency:string)=>`${new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(Number(value))} ${currency}`;
 const metrics=daily?.currency_summaries;
 const metric=(title:string,value:React.ReactNode,destination:string)=><button className="wz-today-metric" onClick={()=>onNavigate(destination)}><span>{title}</span><strong>{value??'—'}</strong><span aria-hidden="true">↗</span></button>;
 return <section className="wz-today"><div className="wz-today-heading"><div><h2>{daily?new Intl.DateTimeFormat(locale,{dateStyle:'full',timeZone:'UTC'}).format(new Date(daily.date+'T12:00:00Z')):t('todayWork')}</h2></div><button disabled={busy} onClick={()=>setRefresh(refresh+1)}>{t('refresh')}</button></div>
 <label className="wz-day-zone">{d('localDay')}<select value={zone} onChange={e=>setZone(e.target.value)}><option value="Africa/Kinshasa">Kinshasa</option><option value="Africa/Lubumbashi">Lubumbashi</option></select></label>
 {busy&&<p role="status">{t('loading')}</p>}{partial&&<p role="alert">{t('partialToday')}</p>}
 <div className="wz-today-metrics">{metric(d('dailySales'),metrics?(metrics.length?metrics.map(row=><span key={row.currency}>{money(row.revenue,row.currency)}</span>):'0') : null,'reports')}{metric(d('dailyOrders'),daily?.orders_today,'orders')}{metric(d('itemsSold'),metrics?metrics.reduce((sum,row)=>sum+row.quantity,0):null,'reports')}<article className="wz-today-metric"><span>{d('followers')}</span><strong>{daily?.followers??'—'}</strong></article></div>
 <p className="wz-soft-note">{d('salesHelp')}</p>
 <div className="wz-community"><span>{d('newFollowers')}: <strong>{daily?.new_followers??'—'}</strong></span><span>{d('customerReviews')}: <strong>{!daily?'—':daily.reviews.count?`${daily.reviews.average} / 5 · ${daily.reviews.count}`:d('noReviews')}</strong></span></div>
 <div className="wz-today-columns"><div><h3>{d('soldToday')}</h3>{daily?.sold_items.map(row=><article className="wz-sold-row" key={`${row.product_ref}:${row.variant_ref}:${row.currency}`}>{row.image_url?<Image unoptimized src={row.image_url} alt="" width={56} height={70}/>:<span className="wz-photo-fallback" aria-hidden="true">{row.label.slice(0,1)}</span>}<div><strong>{row.label}</strong><p>{t('quantity_sold')}: {row.quantity}</p></div><strong>{money(row.revenue,row.currency)}</strong></article>)}{daily&&daily.sold_items.length===0&&<p className="wz-empty">{daily.financial_access?d('noSales'):t('todayFree')}</p>}</div><div><h3>{t('actionRequired')}</h3><p className="wz-soft-note">{d('attentionHelp')}</p><div className="wz-attention">{metric(t('actionRequired'),orders?.action_required as number,'orders')}{metric(t('inProgress'),orders?.in_progress as number,'orders')}{metric(t('lowStockCount'),stock?.low_stock_items as number,'inventory')}{metric(t('stockUnknown'),stock?Number(stock.untracked_items??0)+Number(stock.uninitialized_items??0):null,'inventory')}</div></div></div>
 {!!metrics?.length&&<details className="wz-daily-details"><summary>{t('reports')}</summary>{metrics.map(row=><div key={row.currency}><h4>{row.currency}</h4><p>{t('known_gross_profit')}: {money(row.known_profit,row.currency)}</p><p>{t('recorded_operating_expenses')}: {money(row.expenses,row.currency)}</p>{!row.profit_complete&&<p>{t('missingCostsWarning')}</p>}</div>)}<button onClick={()=>onNavigate('reports')}>{t('reports')} →</button></details>}
 <div className="wz-actions">{['catalog','orders','sales'].map(tab=><button key={tab} onClick={()=>onNavigate(tab)}>{t(tab)}</button>)}</div>
 </section>;
}
