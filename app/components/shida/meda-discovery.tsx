'use client';
import Image from 'next/image';
import {useEffect,useId,useRef,useState} from 'react';
import {IllustratedMarketplaceHero} from './illustrated-marketplace-hero';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import {medaCopy,type MedaLocale} from '../../lib/meda-copy';
import {medaDiscoveryCopy} from '../../lib/meda-discovery-copy';
import {medaParticipationCopy} from '../../lib/meda-participation-copy';
import {medaDestination} from '../../lib/meda-navigation';
import {discoveryCities} from '../../lib/discovery-copy';
import type {MedaListing} from './meda-listing-form';
import './stay-travel-discovery.css';

export const medaCategoryIcon:Record<MedaListing['category'],SpaceIconName>={luggage:'luggage',airport:'plane',container:'container'};
export type MedaFilters={origin:string;destination:string;category:string;side:string;after:string};
export const defaultMedaFilters:MedaFilters={origin:'',destination:'',category:'',side:'offer',after:''};
export function readMedaFilters(params:URLSearchParams):MedaFilters{return {origin:(params.get('origin')??'').slice(0,100),destination:(params.get('destination')??'').slice(0,100),category:['luggage','airport','container'].includes(params.get('category')??'')?params.get('category')!:'',side:params.get('side')==='request'?'request':'offer',after:/^\d{4}-\d{2}-\d{2}$/.test(params.get('after')??'')?params.get('after')!:''};}
export function routeLabel(value:string,locale:MedaLocale){if(!/^[A-Z]{2}$/.test(value))return value;try{return new Intl.DisplayNames([locale==='ln'?'fr':locale],{type:'region'}).of(value)??value}catch{return value}}
export function medaDate(value:string,locale:MedaLocale){return Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{day:'numeric',month:'short',year:'numeric'}).format(new Date(value)):medaDiscoveryCopy[locale].unknownDate;}
export function MedaHero({locale}:{locale:MedaLocale}){return <IllustratedMarketplaceHero tone="meda" className="meda-hero" title="Meda" slogan="Mema to tinda biloko na SHIDA!" intro={medaDiscoveryCopy[locale].intro} art={<Image src="/images/marketplace-heroes/meda.png" alt="" width={1536} height={1024} sizes="(max-width: 767px) 0px, 320px"/>}/>;}
export function MedaInvitation({locale}:{locale:MedaLocale}){const t=medaDiscoveryCopy[locale];return <aside className="st-invitation meda-invitation" data-meda-invitation><span className="st-invitation-icon"><SpaceIcon name="meda"/></span><div><h2><span className="meda-desktop-copy">{t.invite}</span><span className="meda-mobile-copy">{t.inviteMobile}</span></h2><p><span className="meda-desktop-copy">{t.inviteHelp}</span><span className="meda-mobile-copy">{t.inviteHelpMobile}</span></p></div><a className="button button-primary" href={medaDestination(locale,'create')}>{t.publish}<span aria-hidden="true">→</span></a></aside>;}

/** Uses the shared country reference API and the homepage's city suggestions. Free city text remains supported. */
function RouteField({label,value,onChange,locale}:{label:string;value:string;onChange:(value:string)=>void;locale:MedaLocale}){
 const id=useId(),[countries,setCountries]=useState<{code:string;name:string}[]>([]),display=routeLabel(value,locale);
 useEffect(()=>{const controller=new AbortController();const timer=setTimeout(()=>{void fetch(`/api/shida/registration-reference/?${new URLSearchParams({language:locale,q:value})}`,{signal:controller.signal,cache:'no-store'}).then(async r=>r.ok?r.json():null).then(data=>{if(!controller.signal.aborted)setCountries(Array.isArray(data?.items)?data.items:[])}).catch(()=>{});},180);return()=>{clearTimeout(timer);controller.abort();}},[value,locale]);
 return <label className="meda-route-field"><SpaceIcon name="pin"/><span>{label}<input value={display} list={id} placeholder={medaDiscoveryCopy[locale].routeHint} maxLength={100} onChange={e=>onChange(countries.find(c=>c.name===e.target.value)?.code??e.target.value)}/></span><datalist id={id}>{discoveryCities.map(city=><option key={city} value={city}/>)}{countries.map(c=><option key={c.code} value={c.name}/>)}</datalist></label>;
}
export function MedaSearch({locale,filters,setFilters,onSearch,busy}:{locale:MedaLocale;filters:MedaFilters;setFilters:(v:MedaFilters)=>void;onSearch:(v:MedaFilters)=>void;busy:boolean}){
 const t=medaCopy[locale],v=medaDiscoveryCopy[locale],extra=useRef<HTMLDetailsElement>(null);
 const change=(values:Partial<MedaFilters>)=>{const next={...filters,...values};setFilters(next);onSearch(next)};
 const active=[filters.origin,filters.destination,filters.category,filters.after].filter(Boolean).length+(filters.side==='request'?1:0);
 return <form className="meda-search" role="search" aria-label={t.search} onSubmit={e=>{e.preventDefault();onSearch(filters)}}>
  <div className="mp-search-primary meda-route-search"><RouteField label={v.origin} value={filters.origin} onChange={origin=>setFilters({...filters,origin})} locale={locale}/><RouteField label={v.destination} value={filters.destination} onChange={destination=>setFilters({...filters,destination})} locale={locale}/><button className="button button-primary" disabled={busy}>{t.search}</button></div>
  <div className="meda-categories" role="group" aria-label={t.all}>{(['','luggage','airport','container'] as const).map(category=><button key={category} type="button" aria-pressed={filters.category===category} disabled={busy} onClick={()=>change({category})}><SpaceIcon name={category?medaCategoryIcon[category]:'grid'}/>{category==='airport'?v.airport:category?t[category]:v.all}</button>)}</div>
  <div className="meda-search-secondary"><div className="meda-sides" role="group" aria-label={`${v.available} / ${v.needed}`}>{(['offer','request'] as const).map(side=><button key={side} type="button" disabled={busy} aria-pressed={filters.side===side} onClick={()=>change({side})}>{v[side==='offer'?'available':'needed']}</button>)}</div>
   <details ref={extra} className="marketplace-advanced-filters meda-filter-details"><summary><SpaceIcon name="filters"/>{v.filters}{filters.after&&<span className="meda-filter-count">1</span>}</summary><div><label>{t.after}<input type="date" value={filters.after} onChange={e=>setFilters({...filters,after:e.target.value})}/></label><button disabled={busy} onClick={()=>{if(extra.current)extra.current.open=false}}>{t.search}</button></div></details>
  </div>
  {active>0&&<div className="mp-active-filters meda-active-filters" aria-label={v.active}><span>{v.active}: {active}</span>{filters.origin&&<span>{v.origin}: {routeLabel(filters.origin,locale)}</span>}{filters.destination&&<span>{v.destination}: {routeLabel(filters.destination,locale)}</span>}{filters.after&&<span>{t.after}: {filters.after}</span>}<button type="button" disabled={busy} onClick={()=>{setFilters(defaultMedaFilters);onSearch(defaultMedaFilters)}}>{v.reset}</button></div>}
 </form>;
}
export function MedaResultCard({row,locale,busy,onOpen}:{row:MedaListing;locale:MedaLocale;busy:boolean;onOpen:()=>void}){
 const t=medaCopy[locale],v=medaDiscoveryCopy[locale],x=medaParticipationCopy[locale];
 const basis=row.price_basis==='kg'?'kg':row.price_basis==='m3'?'m³':row.price_basis==='package'?x.package:t.total;
 return <article className="meda-card meda-result" data-side={row.side}><div className="meda-result-heading"><span className="meda-category-icon"><SpaceIcon name={medaCategoryIcon[row.category]}/></span><div><span className="meda-tag">{t[row.category]}</span><h2>{row.origin_city} <span aria-hidden="true">→</span> {row.destination_city}</h2></div></div><p className="meda-side-label">{row.side==='offer'?v.available:v.needed}</p><p>{v.departure}: <time dateTime={row.departure_at}>{medaDate(row.departure_at,locale)}</time></p><p>{row.capacity===null?v.unknownCapacity:`${Number(row.capacity).toLocaleString(locale)} ${row.unit==='m3'?'m³':'kg'} ${row.side==='offer'?v.capacityOffer:v.capacityRequest}`}</p><strong className="meda-price">{row.price===null?t.negotiable:`${Number(row.price).toLocaleString(locale)} ${row.currency??''} / ${basis}`}</strong><button className="button button-primary" onClick={onOpen} disabled={busy}>{t.details}<span aria-hidden="true">→</span></button></article>;
}
export function MedaListingRow({row,locale}:{row:MedaListing;locale:MedaLocale}){const t=medaCopy[locale],v=medaDiscoveryCopy[locale];return <article className="personal-listing meda-listing-row"><div className="listing-thumbnail"><SpaceIcon name="meda"/></div><div className="listing-identity"><h2>{row.title||`${row.origin_city} → ${row.destination_city}`}</h2><small>Meda · {t[row.category]} · {v.departure}: {medaDate(row.departure_at,locale)}</small></div><div className="listing-meta">{typeof row.enquiry_count==='number'&&<a href={medaDestination(locale,'enquiries',undefined,row.reference)}>{v.received.replace('{n}',String(row.enquiry_count))}</a>}</div><div className="listing-controls"><span className="listing-status">{t[row.status]}</span><a className="button" href={medaDestination(locale,'review',row.reference)}>{row.status==='draft'?v.draft:v.manage}<span aria-hidden="true">→</span></a></div></article>;}
