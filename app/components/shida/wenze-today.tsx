"use client";
import {hasPhysicalStore} from '@/app/lib/wenze-checkout-copy';
import Image from 'next/image';
import {SellerWorkspaceIcon} from './seller-workspace';
import {wenzeUX} from '@/app/lib/wenze-ux-copy';
import {todayText} from '@/app/lib/wenze-today-copy';
import './wenze-today-design.css';
import {useEffect,useState} from 'react';
import {useWenzeApi} from '@/app/lib/wenze-seller-api';
import {sellerText} from '@/app/lib/wenze-seller-copy';
import {wenzeDesignText} from '@/app/lib/wenze-design-copy';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
type Shop={store_type?:unknown;public_ref:string;name:string;city?:string;catalog_ready?:boolean;order_ready?:boolean};
type Daily={date:string;timezone:string;followers:number;new_followers:number;orders_today:number;reviews:{count:number;average:number|null};financial_access:boolean;currency_summaries:{currency:string;revenue:string;quantity:number;known_profit:string;profit_complete:boolean;expenses:string}[]|null;sold_items:{product_ref:string;variant_ref:string|null;label:string;currency:string;quantity:number;revenue:string;image_url:string|null}[]};
type Row=Record<string,number>;
type Order={reference:string;buyer_name:string;created_at:string;status_label:string;bucket:string;total:string;currency:string;items:{quantity:number}[]};
type Orders={counts:Row;orders:Order[]};
export function WenzeToday({store,stores,locale,onChoose,onNavigate,onOpenOrder}:{store:Shop|null;stores:Shop[];locale:WenzeLocale;onChoose:(shop:Shop)=>void;onNavigate:(tab:string)=>void;onOpenOrder:(reference:string)=>void}){
 const {request}=useWenzeApi(),t=(key:string)=>sellerText(locale,key),d=(key:string)=>wenzeDesignText(locale,key),c=(key:Parameters<typeof todayText>[1])=>todayText(locale,key);
 const [daily,setDaily]=useState<Daily|null>(null),[orders,setOrders]=useState<Orders|null>(null),[stock,setStock]=useState<Row|null>(null);
 const [zone,setZone]=useState(store?.city?.toLowerCase()==='lubumbashi'?'Africa/Lubumbashi':'Africa/Kinshasa');
 const [refresh,setRefresh]=useState(0),[busy,setBusy]=useState(true),[partial,setPartial]=useState(false);
 useEffect(()=>{if(!store)return;let active=true;const base=`wenze/contexts/personal/stores/${encodeURIComponent(store.public_ref)}`;
  async function load(){setBusy(true);setDaily(null);setOrders(null);setStock(null);setPartial(false);
   const results=await Promise.allSettled([request(`${base}/today?timezone=${encodeURIComponent(zone)}`),request(`wenze/contexts/personal/orders?store_ref=${encodeURIComponent(store!.public_ref)}&language=${locale}&bucket=all&limit=5`),request(`${base}/inventory/summary`)]);
   if(!active)return;setDaily(results[0].status==='fulfilled'?results[0].value as Daily:null);setOrders(results[1].status==='fulfilled'?results[1].value as Orders:null);setStock(results[2].status==='fulfilled'?results[2].value as Row:null);setPartial(results.some(r=>r.status==='rejected'));setBusy(false);
  }void load();const timer=setInterval(()=>void load(),60000);return()=>{active=false;clearInterval(timer);};
 },[store,locale,request,refresh,zone]);
 if(!store)return <section className="wz-today"><h2>{t('todayTitle')}</h2><p>{t('choose')}</p><div className="wz-grid">{stores.map(shop=><button className="wz-card" key={shop.public_ref} onClick={()=>onChoose(shop)}>{shop.name}</button>)}</div><button onClick={()=>onNavigate('catalog')}>{t('create')}</button></section>;
 const money=(value:string,currency:string)=>`${new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(Number(value))} ${currency}`;
 const metrics=daily?.currency_summaries;
 const metric=(title:string,value:React.ReactNode,destination:string,accent:string,icon:Parameters<typeof SellerWorkspaceIcon>[0]['name'])=><button className="wt-metric" data-accent={accent} onClick={()=>onNavigate(destination)}><span className="wt-icon"><SellerWorkspaceIcon name={icon}/></span><span>{title}</span><strong>{value??'—'}</strong></button>;
 // Readiness comes from backend setup policy, never sales volume or visibility.
 const setup=store.catalog_ready===false||store.order_ready===false;
 const alerts=[
  {value:orders?.counts.action_required,label:t('actionRequired'),tab:'orders'},
  {value:orders?.counts.in_progress,label:t('inProgress'),tab:'orders'},
  {value:stock?.low_stock_items,label:t('lowStockCount'),tab:'inventory'},
  {value:stock?.items_out_of_stock,label:c('outStock'),tab:'inventory'},
  {value:stock?.untracked_items,label:c('untracked'),tab:'inventory'},
  {value:stock?.uninitialized_items,label:c('uninitialized'),tab:'inventory'},
 ];
 const clear=alerts.every(row=>typeof row.value==='number'&&row.value===0);
 return <section className="wz-today wt-dashboard" aria-busy={busy}>
 <div className="wt-toolbar"><div><p>{daily?new Intl.DateTimeFormat(locale,{dateStyle:'full',timeZone:'UTC'}).format(new Date(daily.date+'T12:00:00Z')):t('todayWork')}</p><label>{d('localDay')}<select value={zone} onChange={e=>setZone(e.target.value)}><option value="Africa/Kinshasa">Kinshasa</option><option value="Africa/Lubumbashi">Lubumbashi</option></select></label></div><div className="wt-tools"><button disabled={busy} onClick={()=>setRefresh(refresh+1)}>{t('refresh')}</button>{hasPhysicalStore(store)&&<button className="seller-primary" onClick={()=>onNavigate('sales')}>＋ {wenzeUX(locale,'newSale')}</button>}</div></div>
 {busy&&<p role="status">{t('loading')}</p>}{partial&&<p role="alert">{t('partialToday')}</p>}
 {setup&&<section className="wt-setup"><span className="wt-shop-art" aria-hidden="true"><svg viewBox="0 0 120 110" fill="none"><circle cx="62" cy="52" r="48" fill="#e0e7d4"/><path d="M22 50h76v50H22z" fill="#fffdf4" stroke="currentColor" strokeWidth="2"/><path d="M18 48l12-27h60l12 27" fill="#f6f5e9" stroke="currentColor" strokeWidth="2"/><path d="M30 21l-6 27h15l3-27M54 21v27h15l-3-27M78 21l6 27h15l-9-27" fill="#87a08c"/><path d="M18 48c0 13 17 13 17 0 0 13 17 13 17 0 0 13 17 13 17 0 0 13 17 13 17 0 0 13 16 13 16 0" stroke="currentColor" strokeWidth="2"/><path d="M35 100V67h22v33M69 67h17v17H69zM8 101h104" stroke="currentColor" strokeWidth="2"/></svg></span><div><h3>{c('setup')}</h3><p>{c('setupHelp')}</p><button className="seller-primary" onClick={()=>onNavigate('shop')}>{c('complete')}</button></div></section>}
 <div className="wt-metrics">{metric(c('recorded'),metrics?(metrics.length?metrics.map(row=><span key={row.currency}>{money(row.revenue,row.currency)}</span>):'0'):null,'reports','sales','reports')}{metric(d('dailyOrders'),daily?.orders_today,'orders','orders','catalog')}{metric(d('itemsSold'),metrics?metrics.reduce((sum,row)=>sum+row.quantity,0):null,'reports','items','stock')}<article className="wt-metric" data-accent="followers"><span className="wt-icon"><SellerWorkspaceIcon name="profile"/></span><span>{d('followers')}</span><strong>{daily?.followers??'—'}</strong></article></div>
 <p className="wz-soft-note">{daily&&!daily.financial_access?t('todayFree'):d('salesHelp')}</p>
 {alerts.some(row=>(row.value??0)>0)&&<section className="wt-attention"><h3>{c('attention')}</h3><p className="wz-soft-note">{d('attentionHelp')}</p><div>{alerts.filter(row=>(row.value??0)>0).map(row=><button key={row.label} onClick={()=>onNavigate(row.tab)}><SellerWorkspaceIcon name={row.tab==='orders'?'work':'stock'}/><span><strong>{row.value} · {row.label}</strong><small>{row.tab==='orders'?t('orders'):wenzeUX(locale,'productsStock')} →</small></span></button>)}</div></section>}
 {!busy&&!partial&&clear&&<div className="wt-clear"><span aria-hidden="true">✓</span><div><strong>{c('clear')}</strong><p>{c('clearHelp')}</p></div></div>}
 <div className="wt-columns"><div className="wt-side wt-primary"><section className="wt-panel wt-orders"><header><h3><SellerWorkspaceIcon name="work"/>{c('recent')}</h3><button onClick={()=>onNavigate('orders')}>{c('viewAll')} →</button></header>
 {orders?.orders?.map(row=><button className="wt-order" key={row.reference} onClick={()=>onOpenOrder(row.reference)}><span><strong>{row.reference}</strong><small>{new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short',timeZone:zone}).format(new Date(row.created_at))}</small></span><span>{row.buyer_name}<small>{row.items.reduce((sum,item)=>sum+item.quantity,0)} · {money(row.total,row.currency)}</small></span><span className="wt-status" data-bucket={row.bucket}>{row.status_label}</span></button>)}
 {!orders?<p className="wt-empty">{busy?t('loading'):c('unavailable')}</p>:orders.orders?.length===0&&<div className="wt-empty"><SellerWorkspaceIcon name="work"/><strong>{c('noOrders')}</strong><p>{c('noOrdersHelp')}</p></div>}
 </section><section className="wt-panel wt-sold"><header><h3><SellerWorkspaceIcon name="catalog"/>{d('soldToday')}</h3></header>
 {daily?.sold_items.map(row=><article className="wt-sold-row" key={`${row.product_ref}:${row.variant_ref}:${row.currency}`}><div>{row.image_url?<Image unoptimized src={row.image_url} alt="" width={46} height={48}/>:<span className="wt-product-fallback" aria-hidden="true"><SellerWorkspaceIcon name="stock"/></span>}<strong>{row.label}</strong></div><span><small>{t('quantity_sold')}</small>{row.quantity}</span><strong>{money(row.revenue,row.currency)}</strong></article>)}
 {!daily?.sold_items.length&&<p className="wt-compact-empty">{!daily?(busy?t('loading'):c('unavailable')):!daily.financial_access?t('todayFree'):c('noSold')}</p>}
 {!!daily?.sold_items.length&&metrics?.map(row=><div className="wt-sold-total" key={row.currency}><strong>{c('totalToday')}</strong><strong>{money(row.revenue,row.currency)}</strong></div>)}
 </section></div><div className="wt-side"><section className="wt-panel"><h3><SellerWorkspaceIcon name="reports"/>{c('performance')}</h3><dl className="wt-stats"><div className="wt-followers-stat"><SellerWorkspaceIcon name="profile"/><dt>{d('newFollowers')}</dt><dd>{daily?.new_followers??'—'}</dd></div><div className="wt-reviews-stat"><SellerWorkspaceIcon name="document"/><dt>{d('customerReviews')}</dt><dd>{daily?.reviews.count??'—'}</dd></div><div><dt>{c('rating')}</dt><dd>{daily?.reviews.average==null?'—':new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(daily.reviews.average)+' / 5'}</dd></div></dl></section>
 <section className="wt-panel"><header><h3><SellerWorkspaceIcon name="stock"/>{c('stock')}</h3><button onClick={()=>onNavigate('inventory')}>{c('viewAll')} →</button></header><dl className="wt-stock">{[['items_in_stock',c('inStock')],['low_stock_items',t('lowStockCount')],['items_out_of_stock',c('outStock')],['untracked_items',c('untracked')],['uninitialized_items',c('uninitialized')]].map(([key,label])=><div key={key} data-stock={key}><dt>{label}</dt><dd>{stock?.[key]??'—'}</dd></div>)}</dl></section></div></div>
 <section className="wt-panel wt-financial"><header><h3><SellerWorkspaceIcon name="finance"/>{c('financialToday')}</h3><button className="wt-report-link" onClick={()=>onNavigate('reports')}>{c('fullReport')} →</button></header>
 {metrics?.map(row=><div className="wt-financial-currency" key={row.currency}><dl><div><dt>{c('recorded')}</dt><dd>{money(row.revenue,row.currency)}</dd></div><div><dt>{c('knownProfit')}</dt><dd>{money(row.known_profit,row.currency)}</dd></div><div><dt>{t('recorded_operating_expenses')}</dt><dd>{money(row.expenses,row.currency)}</dd></div></dl>{!row.profit_complete&&<p className="wt-cost-warning">{t('missingCostsWarning')}</p>}</div>)}
 {!metrics?.length&&<p className="wt-compact-empty">{!daily?(busy?t('loading'):c('unavailable')):!daily.financial_access?t('todayFree'):c('noFinancial')}</p>}
 </section>
 {setup&&<section className="wt-panel wt-next"><h3>{c('next')}</h3><button onClick={()=>onNavigate('catalog')}>{d('addProduct')} →</button><button onClick={()=>onNavigate('shop')}>{d('shopDetails')} →</button></section>}
 </section>;
}
