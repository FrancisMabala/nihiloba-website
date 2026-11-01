"use client";
import Image from 'next/image';
import {useState,type ReactNode} from 'react';
import {SpaceIcon} from './account-space-icon';
import {ProfessionalShare} from './professional-share';
import {listingCopy} from '../../lib/wenze-listings-copy';
import {quickSellCopy} from '../../lib/quick-sell-copy';
import type {WenzeLocale} from '../../lib/wenze-copy';

export function QuickListingCard({item,locale,location,href,children}:{item:{public_ref:string;name:string;price:string;currency:string;condition:string;quick_sell_state?:string;available_stock:number|null;sale_provenance?:'shida_completed'|'seller_reported'|'unknown';photos:{url:string}[]};locale:WenzeLocale;location:string;href:string;children:ReactNode}){
 const [failed,setFailed]=useState(false),l=listingCopy[locale],t=quickSellCopy[locale];
 const state=item.quick_sell_state;
 const stateLabel=state&&['available','unpublished','pending','sold','archived'].includes(state)?l[state as 'available']:l.unknown;
 return <article className="qs-listing-card">
  <div className="qs-listing-image">{item.photos[0]&&!failed?<Image unoptimized src={item.photos[0].url} width={140} height={130} alt="" onError={()=>setFailed(true)}/>:<SpaceIcon name="orders"/>}</div>
  <div className="qs-listing-content"><h3>{item.name}</h3><strong className="qs-price">{item.price} {item.currency}</strong><p className="qs-listing-meta">{t[item.condition as 'used']||t.other}{location&&<> · {location}</>}</p><span className={`qs-listing-state qs-state-${state||'unknown'}`}>{stateLabel}</span>{item.available_stock===0&&<p className="qs-provenance">{l[item.sale_provenance||'unknown']}</p>}</div>
  <div className="qs-listing-controls"><a className="qs-listing-view" href={href}>{l.view} <span aria-hidden="true">→</span></a><ProfessionalShare locale={locale} path={href} name={item.name}/><details><summary>{l.next}</summary><div className="qs-actions">{children}</div></details></div>
 </article>;
}
