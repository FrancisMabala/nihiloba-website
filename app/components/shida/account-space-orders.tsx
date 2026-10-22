'use client';
import {useEffect,useState} from 'react';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {SpaceIcon} from './account-space-icon';
import {workText} from '../../lib/restaurant-work-copy';
import {progressText} from './wenze-order-timeline';
type RestaurantOrder={order_ref:string;establishment_name?:string;state:string;submitted_at:string;order_total:string;currency:string};
type ShopOrder={reference:string;store_name:string;total:string|null;currency:string;timeline?:{current:string}};
export function AccountSpaceOrders({binding,locale}:{binding:string;locale:MarketplaceLocale}){
 const t=accountSpaceCopy[locale],prefix=locale==='en'?'':`/${locale}`,bilingual=locale==='en'?'':'/fr';
 const [data,setData]=useState<{food:RestaurantOrder[];shops:ShopOrder[];failed:boolean}|null>(null),[revision,setRevision]=useState(0);
 useEffect(()=>{
  let active=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  const read=async(path:string)=>{const response=await fetch(path,{signal:controller.signal,cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding}});if(!response.ok)throw Error();return response.json();};
  Promise.allSettled([read('/api/shida/personal/restaurant-orders/?page=1&page_size=5'),read('/api/shida/personal/wenze-buyer/orders/?offset=0&limit=5')]).then(([food,shops])=>{
   if(!active)return;
   const foodItems=food.status==='fulfilled'&&Array.isArray(food.value.items)?food.value.items:null,shopItems=shops.status==='fulfilled'&&Array.isArray(shops.value.orders)?shops.value.orders:null;
   setData({food:foodItems??[],shops:shopItems??[],failed:!foodItems||!shopItems});
  }).finally(()=>clearTimeout(timer));
  return()=>{active=false;controller.abort();clearTimeout(timer);};
 },[binding,revision]);
 const money=(amount:string|null,currency:string)=>amount===null?t.unknown:`${new Intl.NumberFormat(locale==='ln'?'fr':locale).format(Number(amount))} ${currency}`;
 return <section className="space-recent"><div className="space-section-heading"><h2>{t.recent}</h2><button type="button" onClick={()=>{setData(null);setRevision(n=>n+1);}}>{t.retry}</button></div>
 {!data?<p role="status">{t.loading}</p>:<>{data.failed&&<p role="status">{t.failed}</p>}{!data.failed&&!data.food.length&&!data.shops.length&&<p>{t.empty}</p>}
 {data.food.map(order=><a className="space-activity-row" key={order.order_ref} href={`${prefix}/shida/restaurant-orders/${encodeURIComponent(order.order_ref)}`}><span className="space-activity-icon"><SpaceIcon name="restaurant"/></span><span className="space-activity-title"><strong>{order.establishment_name||t.foodOrders}</strong><small>{new Date(order.submitted_at).toLocaleDateString(locale==='ln'?'fr':locale)} · {money(order.order_total,order.currency)}</small></span><span className="space-status">{workText(locale,order.state)}</span></a>)}
 {data.shops.map(order=><a className="space-activity-row" key={order.reference} href={`${bilingual}/shida/wenze/orders#${encodeURIComponent(order.reference)}`}><span className="space-activity-icon"><SpaceIcon name="shop"/></span><span className="space-activity-title"><strong>{order.store_name}</strong><small>Wenze · {money(order.total,order.currency)}</small></span><span className="space-status">{progressText(locale,order.timeline?.current??'progress')}</span></a>)}
 </>}
 </section>;
}
