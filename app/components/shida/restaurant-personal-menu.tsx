'use client';

import { useState } from 'react';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';
import type { Row } from '@/app/lib/restaurant-seller';
import { personalMenuCopy } from '@/app/lib/restaurant-personal-menu-copy';
import { preparationCopy, soloPreparationCopy } from '@/app/lib/restaurant-preparation-copy';
import { restaurantText } from '@/app/lib/restaurant-seller-copy';
import { managementCopy } from '@/app/lib/restaurant-management-copy';
import { photoText } from '@/app/lib/restaurant-photo-copy';
import { RestaurantPhoto } from './restaurant-photo';
import type { RoutingPage } from './restaurant-item-routing';
import './restaurant-personal-menu.css';

type Binding = { menu_item_ref: string; item_ref: string; active: boolean };
type Props = { items: Row[]; routes: RoutingPage | null; bindings: Binding[] | null; offerings: Row[] | null;
  publicAvailability: Record<string,string>|null; publicCheck: boolean; locale: RestaurantLocale; fresh: boolean; loadFailed: boolean; busy: boolean;
  stockEnabled: boolean; onRefresh: () => void; onEdit: (row: Row) => void; onPhoto: (row: Row) => void;
  onAdd: () => void; onCategories: () => void; onBatch: () => void; onStock: () => void;
  onOfferings: () => void };

export function RestaurantPersonalMenu({items,routes,bindings,offerings,publicAvailability,publicCheck,locale,fresh,loadFailed,busy,stockEnabled,onRefresh,onEdit,onPhoto,onAdd,onCategories,onBatch,onStock,onOfferings}:Props) {
 const m=personalMenuCopy[locale], t=(key:string)=>restaurantText(locale,key);
 const [search,setSearch]=useState(''),[filter,setFilter]=useState('all');
 const routeFor=(row:Row)=>routes?.items.find(value=>value.item_ref===row.public_ref)?.station;
 const needsSetup=(row:Row)=>!row.category?.public_ref || row.pricing_model==='UNKNOWN' || !row.pricing_model || routeFor(row)===null;
 const configured=(row:Row)=>row.visible!==false && row.category?.visible!==false && row.availability==='available' && row.pricing_model!=='UNKNOWN';
 const offered=(row:Row)=>configured(row) && (!publicAvailability || publicAvailability[row.public_ref]==='available');
 const filtered=items.filter(row=>{
   const match=(row.name??'').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) || (row.category?.name??'').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
   return match && (filter==='all'||filter==='setup'&&needsSetup(row)||filter==='available'&&offered(row)||filter==='unavailable'&&!offered(row));
 }).sort((a,b)=>Number(offered(b))-Number(offered(a)) || (a.name??'').localeCompare(b.name??'',locale));
 function price(row:Row) {
   if(row.pricing_model==='UNIT_PRICED') return `${row.unit_price ?? '—'} ${row.currency ?? ''}${row.sale_unit_label ? ' / '+row.sale_unit_label : ''}`;
   if(row.pricing_model==='AMOUNT_PRICED') return `${row.amount_mode==='flexible' ? (row.minimum_amount ?? '—')+'+' : Array.isArray(row.allowed_amounts) ? row.allowed_amounts.join(' / ') : '—'} ${row.currency ?? ''}`;
   return m.unknown;
 }
 function preparation(row:Row) {
   if(!routes)return m.routeUnknown;
   const station=routeFor(row);
   return station==='serve'?soloPreparationCopy[locale].serve:station==='kitchen'?preparationCopy[locale].kitchen:station==='bar'?preparationCopy[locale].bar:m.unconfigured;
 }
 return <section className="rst-personal-menu" aria-label={m.all}>
   <header className="rst-menu-heading"><div><h2>{t('items')}</h2><p>{m.intro}</p></div><div className="rst-actions"><button type="button" className="button button-primary" disabled={busy||!fresh} onClick={onAdd}>+ {m.addItem}</button><button type="button" disabled={busy} onClick={onRefresh}>{m.refresh}</button><button type="button" disabled={busy} onClick={onBatch}>{photoText(locale,'batch')}</button></div></header>
   {loadFailed ? <p role="alert" className="rst-menu-notice">{m.failed}</p> : !fresh && <p role="status" className="rst-menu-notice">{m.stale}</p>}
   {!routes && !!items.length && <p role="alert" className="rst-menu-notice">{m.routeUnknown} <button type="button" onClick={onRefresh}>{m.refresh}</button></p>}
   {publicCheck && !publicAvailability && !loadFailed && <p role="status" className="rst-menu-notice">{m.publicUnknown} <button type="button" onClick={onRefresh}>{m.refresh}</button></p>}
   <div className="rst-menu-filters"><label>{m.search}<input type="search" value={search} onChange={event=>setSearch(event.target.value)}/></label><label>{m.filter}<select value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">{m.all}</option><option value="available">{m.available}</option><option value="unavailable">{m.unavailable}</option><option value="setup">{m.setup}</option></select></label><span aria-live="polite">{filtered.length} {m.count}</span></div>
   {!items.length && !loadFailed && <p className="rst-menu-empty">{m.empty}</p>}
   {!!items.length && !filtered.length && <p className="rst-menu-empty">{m.noResults}</p>}
   <div className="rst-menu-rows">{filtered.map(row=>{
     const stock=bindings?.find(value=>value.menu_item_ref===row.public_ref);
     const dated=offerings?.filter(value=>value.item?.public_ref===row.public_ref && value.state!=='expired');
     return <article className="rst-menu-row" key={row.public_ref}>
       <div className="rst-item-identity"><div className="rst-photo-thumb"><span aria-hidden="true">◌</span><RestaurantPhoto src={typeof row.image_url==='string'?row.image_url:null} alt={row.name??''} sizes="64px"/></div><div><h3>{row.name}</h3><p>{row.category?.name??m.category}</p></div></div>
       <p className="rst-price"><strong>{price(row)}</strong></p>
       <div className="rst-menu-status"><strong className={offered(row)?'is-available':'is-unavailable'}>{row.visible===false?m.hidden:row.pricing_model==='UNKNOWN'?m.unknown:publicAvailability ? publicAvailability[row.public_ref] ? t(publicAvailability[row.public_ref]) : m.unavailable : configured(row) ? m.configuredAvailable : t(String(row.availability??'unknown'))}</strong><small>{m.preparation}: {preparation(row)}</small></div>
       <div className="rst-menu-meta"><span>{m.stock}: {stock?stock.active?stock.item_ref:m.unavailable:stockEnabled&&bindings===null?m.stockUnknown:m.noStock}</span><span>{m.dated}: {dated?dated.length?dated.map(value=>t(String(value.state??'unknown'))).join(', '):m.noDated:m.datedUnknown}</span></div>
       <div className="rst-actions"><button type="button" disabled={busy||!fresh} onClick={()=>onEdit(row)}>{t('edit')}</button><button type="button" disabled={busy} onClick={()=>onPhoto(row)}>{managementCopy[locale].photo}</button></div>
     </article>;
   })}</div>
   <div className="rst-menu-secondary"><button type="button" onClick={onCategories}>{t('categories')}</button><button type="button" onClick={onOfferings}>{m.dated}</button>{stockEnabled&&<button type="button" onClick={onStock}>{m.stock}</button>}</div>
 </section>;
}
