'use client';
import Image from 'next/image';
import {useState} from 'react';
import {SpaceIcon} from './account-space-icon';
import {ProfessionalShare} from './professional-share';
import {QuickListingActions} from './quick-listing-actions';
import {listingCopy,articleListingCopy} from '../../lib/wenze-listings-copy';
import {quickSellCopy} from '../../lib/quick-sell-copy';
import {articleListingState} from '../../lib/quick-sell-listing';
import type {WenzeLocale} from '../../lib/wenze-copy';

type Listing=Parameters<typeof articleListingState>[0]&{name:string;price:string;currency:string;condition:string};

export function QuickListingCard({item,locale,location,href,onManage,busy,onAction,onPhotos}:{item:Listing;locale:WenzeLocale;location:string;href:string;onManage:()=>void;busy:boolean;onAction:(action:'hide'|'show'|'sold'|'archive'|'restore',returnFocus:()=>HTMLElement|null)=>void;onPhotos:()=>void}){
 const [failed,setFailed]=useState(false),l=listingCopy[locale],a=articleListingCopy[locale],t=quickSellCopy[locale];
 const state=articleListingState(item);
 const visibility=state.archived?a.archivedState:state.online?a.online:state.hidden?a.hiddenState:l.unpublished;
 const commercial=state.sold?a.soldState:state.unavailable?a.unavailableState:null;
 return <article className="qs-listing-card">
  <div className="qs-listing-image">{item.photos[0]&&!failed?<Image unoptimized src={item.photos[0].url} width={120} height={96} alt="" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<SpaceIcon name="orders"/>}</div>
  <div className="qs-listing-content">
   <h3>{item.name}</h3>
   <strong className="qs-price">{item.price} {item.currency}</strong>
   <p className="qs-listing-meta">{t[item.condition as 'used']||t.other}{location&&<> · {location}</>}</p>
   <div className="qs-state-list">
    <span className={`qs-listing-state qs-state-${state.online?'available':'unpublished'}`}>{visibility}</span>
    {state.pending&&<span className="qs-listing-state qs-state-pending">{l.pending}</span>}
    {commercial&&<span className={`qs-listing-state qs-state-${state.sold?'sold':'unpublished'}`}>{commercial}</span>}
   </div>
   {state.sold&&item.sale_provenance&&<p className="qs-provenance">{l[item.sale_provenance]}</p>}
  </div>
  <div className="qs-listing-controls">
   {state.active&&<button type="button" className="button button-primary qs-manage" disabled={busy} onClick={onManage}>{a.manage}</button>}
   <QuickListingActions locale={locale} name={item.name}>{(close,returnFocus)=>{
    const act=(action:()=>void)=>()=>{close();action();};
    return <>
     {state.online&&<><a href={href}>{l.view}</a><ProfessionalShare locale={locale} path={href} name={item.name}/></>}
     {state.active&&<>
      <button type="button" disabled={busy} onClick={act(onManage)}>{t.edit}</button>
      <button type="button" disabled={busy} onClick={act(onPhotos)}>{l.photos}</button>
      {state.online&&<button type="button" disabled={busy} onClick={act(()=>onAction('hide',returnFocus))}>{t.hide}</button>}
      {state.mayShow&&<button type="button" disabled={busy} onClick={act(()=>onAction('show',returnFocus))}>{t.show}</button>}
      {state.mayMarkSold&&<button type="button" disabled={busy} onClick={act(()=>onAction('sold',returnFocus))}>{t.sold}</button>}
      {!state.pending&&<button type="button" className="qs-context-warning" disabled={busy} onClick={act(()=>onAction('archive',returnFocus))}>{l.archive}</button>}
     </>}
     {state.archived&&<button type="button" disabled={busy} onClick={act(()=>onAction('restore',returnFocus))}>{l.restore}</button>}
    </>;
   }}</QuickListingActions>
  </div>
 </article>;
}
