'use client';
import {useState,useEffect,type ReactNode} from 'react';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import {overviewEntries,type OverviewEntry} from '../../lib/overview-records';
import type {ActivityData} from '../../lib/use-personal-activity-data';
import {overviewCopy} from '../../lib/activity-overview-copy';
import {managedActivityCopy} from '../../lib/managed-activity-copy';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
import {activitiesDesignCopy} from '../../lib/activities-design-copy';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {apartmentOwnerCopy} from '../../lib/apartment-owner-copy';
import {listingText} from '../../lib/personal-missions-copy';
import {workspaceText} from '../../lib/personal-workspace-copy';
import {personalWenzePath} from '../../lib/wenze-seller-api';
import {PrivateMenuPreview} from './restaurant-projection';
import './managed-activity-list.css';

const groups={shop:'shop',food:'restaurant',profile:'people',service:'tool',apartment:'home',hotel:'business',driver:'people',job:'management',item:'orders'} as const;
function groupOf(row:OverviewEntry):keyof typeof groups{
 if(row.kind==='restaurant'||row.kind==='malewa')return 'food';
 return row.standaloneService?'service':row.kind;
}
function statusText(locale:MarketplaceLocale,row:OverviewEntry){
 const c=mySpaceCopy[locale],t=managedActivityCopy[locale];
 if(row.kind==='apartment'&&row.status){
   const a=apartmentOwnerCopy[locale];
   if(row.status==='RENTED')return t.rented;
   return row.status==='DRAFT'?a.draft:row.status==='AVAILABLE'&&row.publicUrl?a.available:a.hidden;
 }
 switch(row.status){
 case 'active':return row.kind==='shop'?t.activeShop:t.active;
 case 'inactive':case 'needsUpdate':case 'hidden':case 'draft':return c[row.status];
 case 'pending':return activitiesDesignCopy[locale].pending;
 case 'mixed':return t.mixed;
 case 'open':return t.published;
 case 'closed':case 'online':case 'archived':case 'sold':return listingText(locale,row.status);
 }
}
function ShopPreview({row,binding,locale}:{row:OverviewEntry;binding:string;locale:MarketplaceLocale}){
 const [card,setCard]=useState<{name:string;description?:string;city?:string}|null>(null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
   const controller=new AbortController();
   async function load(){
     const res=await fetch(personalWenzePath('stores/'+encodeURIComponent(row.ref)+'/preview'),{signal:controller.signal,cache:'no-store',headers:{'X-Shida-Session':binding}});
     if(!res.ok)throw Error();
     const data=await res.json();
     if(data.public_ref!==row.ref||typeof data.name!=='string')throw Error();
     if(!controller.signal.aborted)setCard(data);
   }
   load().catch(()=>{if(!controller.signal.aborted)setFailed(true);});
   return ()=>controller.abort();
 },[row.ref,binding]);
 if(!card)return <p role="status">{failed?mySpaceCopy[locale].loadError:accountSpaceCopy[locale].loading}</p>;
 return <div className="managed-preview"><strong>{card.name}</strong><p>{[card.city,card.description].filter(Boolean).join(' · ')}</p></div>;
}
function ActivityCard({row,binding,locale,icon}:{row:OverviewEntry;binding:string;locale:MarketplaceLocale;icon:SpaceIconName}){
 const t=managedActivityCopy[locale],d=activitiesDesignCopy[locale];
 const [failedImage,setFailedImage]=useState(''),[previewing,setPreviewing]=useState(false);
 const manage=row.kind==='shop'?t.manageShop:row.standaloneService?t.manageService:row.kind==='profile'?t.manageProfile:overviewCopy[locale][row.kind][2];
 const view=row.kind==='shop'?d.viewShop:row.kind==='job'?t.viewJob:row.kind==='apartment'?t.viewHome:row.kind==='profile'&&!row.standaloneService?t.viewProfile:d.view;
 const name=row.name||mySpaceCopy[locale].unnamed;
 const suffix=<span className="sr-only"> · {name}</span>;
 return <article data-ref={row.ref}>
  <div className="managed-image">{row.image&&failedImage!==row.image?/* eslint-disable-next-line @next/next/no-img-element */
    <img src={row.image} alt="" loading="lazy" onError={()=>setFailedImage(row.image!)}/>:<SpaceIcon name={icon}/>}</div>
  <div className="managed-identity"><h3>{name}</h3><p>{[row.location,statusText(locale,row)].filter(Boolean).join(' · ')}</p></div>
  <div className="managed-actions"><a className="button button-primary" href={row.url}>{manage}{suffix}</a>
   {row.publicUrl&&<a className="button button-secondary" href={row.publicUrl}>{view}{suffix}</a>}
   {row.preview&&<button className="button button-secondary" type="button" aria-expanded={previewing} onClick={()=>setPreviewing(!previewing)}>{t.preview}{suffix}</button>}
  </div>
  {previewing&&<div className="managed-preview-panel">{row.kind==='shop'?<ShopPreview row={row} binding={binding} locale={locale}/>:<PrivateMenuPreview path={'personal/restaurants/'+encodeURIComponent(row.ref)} binding={binding} locale={locale}/>}</div>}
 </article>;
}

export function ManagedActivityList({locale,current,creation,onRetry}:{locale:MarketplaceLocale;current:ActivityData|null;creation:ReactNode;onRetry:()=>void}){
 const [creating,setCreating]=useState(false),t=managedActivityCopy[locale],c=mySpaceCopy[locale],d=activitiesDesignCopy[locale];
 const entries=current?.overview?overviewEntries(locale,current.items,current.overview):[];
 return <section className="managed-activities activities-dashboard">
  <header className="managed-heading"><h1>{accountNavigationCopy[locale].activities}</h1>
   {current?.overview&&<button className="button button-primary" type="button" aria-expanded={creating} aria-controls="new-activity-options" onClick={()=>setCreating(!creating)}>{creating?d.close:'+ '+d.newActivity}</button>}</header>
  {creating&&<div id="new-activity-options">{creation}</div>}
  {!current?.overview?<p role="status">{accountSpaceCopy[locale].loading}</p>:<>
   {current.failed&&<div role="alert" className="activities-error">{workspaceText(locale,'partial')} <button type="button" onClick={onRetry}>{c.retry}</button></div>}
   {!entries.length&&!current.failed&&<p className="managed-empty">{t.empty}</p>}
   {(Object.keys(groups) as (keyof typeof groups)[]).map(group=>{
    const rows=entries.filter(row=>groupOf(row)===group);
    if(!rows.length)return null;
    return <section key={group} className="managed-group"><h2><SpaceIcon name={groups[group]}/>{t[group][rows.length===1?0:1]} ({rows.length})</h2>
     <div className={'managed-cards'+(rows.length===1?' full-row':'')+(entries.length===1?' single-row':'')}>{rows.map(row=><ActivityCard key={row.kind+row.ref} row={row} binding={current.binding} locale={locale} icon={groups[group]}/>)}</div></section>;
   })}
  </>}
  <details className="space-legacy-help"><summary>{c.legacy}</summary><p>{c.legacyHelp}</p><a href={(locale==='en'?'':'/'+locale)+'/shida/space?view=support'}>{c.support}</a></details>
 </section>;
}