"use client";
import {useEffect,useState} from 'react';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {workspaceText} from '../../lib/personal-workspace-copy';
import {managedActivities,type ManagedActivity} from '../../lib/personal-activities';
import {usePersonalManagement} from './use-personal-management';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {OFFICIAL_CHANNELS} from '../../lib/brand';
import {restaurantText} from '../../lib/restaurant-seller-copy';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
export function PersonalActivities({binding,locale}:{binding:string;locale:MarketplaceLocale}){
 const c=mySpaceCopy[locale];
 const [restaurantPages,setRestaurantPages]=useState(1),[more,setMore]=useState(false);
 const overview=usePersonalManagement(),n=accountNavigationCopy[locale];
 const t=accountSpaceCopy[locale],w=(key:Parameters<typeof workspaceText>[1])=>workspaceText(locale,key),prefix=locale==='en'?'':`/${locale}`;
 const [data,setData]=useState<{binding:string;items:ManagedActivity[];options:ManagedActivity['market'][];failed:boolean}|null>(null),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 const read=async(path:string)=>{const response=await fetch(`/api/shida/personal/${path}`,{signal:controller.signal,cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding}});if(!response.ok)throw Error();return response.json();};
 Promise.allSettled([Promise.all([read('wenze/stores/?archived=false'),read('wenze/stores/?archived=true')]).then(([current,archived])=>managedActivities('wenze',{stores:[...current.stores,...archived.stores]})),Promise.all(Array.from({length:restaurantPages},(_,i)=>read(`restaurants/?page=${i+1}&page_size=20`))).then(pages=>{if(active)setMore(pages[pages.length-1].items.length===20);return managedActivities('restaurants',{...pages[0],items:pages.flatMap(page=>page.items)});}),Promise.all([read('services'),read('services/capabilities')]).then(([value,policy])=>managedActivities('services',value,policy))]).then(results=>{if(active)setData({binding,items:results.flatMap(result=>result.status==='fulfilled'?result.value.items:[]),options:results.flatMap((result,index)=>result.status==='fulfilled'&&(result.value.setup||result.value.more||index===0)?[(['wenze','restaurants','services'] as const)[index]]:[]),failed:results.some(result=>result.status==='rejected')});}).finally(()=>clearTimeout(timer));
 return()=>{active=false;controller.abort();clearTimeout(timer);};},[binding,revision,restaurantPages]);
 const current=data?.binding===binding?data:null,label=(market:ManagedActivity['market'])=>market==='wenze'?t.shop:market==='services'?t.services:t.restaurant;
 const other=overview?.markets.filter(m=>['jobs','apartments','hotels','wewa'].includes(m))??[];
 const create=<div className="space-destinations">{current?.options.map(market=><a key={market} href={`${prefix}/shida/seller/${market}`}>{market==='wenze'?c.shop:market==='services'?c.service:c.restaurant} →</a>)}<a href={`${prefix}/shida/wenze/sell`}>{t.shop} →</a><a href={`${prefix}/shida/emplois`}>{c.jobSeeker} →</a></div>;
 return <section className="space-managed">
 {!current?<p role="status">{t.loading}</p>:<>{current.failed&&<div role="alert"><p>{w('partial')}</p><button type="button" onClick={()=>setRevision(v=>v+1)}>{c.retry}</button></div>}
 {!current.items.length&&!current.failed&&!other.length&&<div className="space-empty"><h2>{c.activitiesEmpty}</h2><p>{c.choose}</p>{create}</div>}
 <div className="space-managed-grid">{current.items.map(item=><article key={`${item.market}:${item.ref}`}><small>{label(item.market)}</small><h2>{item.name||c.unnamed}</h2><p className="space-status">{c[item.status as 'active'|'inactive'|'draft'|'hidden'|'needsUpdate']}</p>{item.location&&<p>{item.location}</p>}{item.missing.length>0&&<>{item.missing.some(k=>k!=='setup')&&<p>{c.missing}: {item.missing.filter(k=>k!=='setup').map(k=>k.startsWith('restaurant:')?restaurantText(locale,k.slice(11)):k==='name'?c.missingName:k==='location'?c.missingLocation:c.missingCategory).join(', ')}</p>}<p>{c.missingSetup}</p></>}<a href={item.individual?`${prefix}/shida/wenze/sell`:`${prefix}/shida/seller/${item.market}?${item.query}`}>{item.missing.length?c.update:w('open')}<span className="sr-only"> · {item.name||c.unnamed}</span> →</a></article>)}</div>
 {more&&<button onClick={()=>setRestaurantPages(v=>v+1)}>{c.more}</button>}
 {(current.items.length>0||other.length>0)&&<details><summary>{c.create}</summary>{create}</details>}</>}
 {other.length>0&&<section><h2>{n.other}</h2><div className="space-managed-grid">{other.map(m=><article key={m}><h3>{n[m as 'jobs'|'apartments'|'hotels'|'wewa']}</h3><a href={OFFICIAL_CHANNELS.whatsapp} target="_blank" rel="noopener noreferrer">{n.whatsapp} →</a></article>)}</div></section>}
 {overview?.organization_management&&<section className="space-organization"><h2>{w('business')}</h2><a href="https://business.nihiloba.com/">SHIDA Business →</a></section>}
 <details className="space-legacy-help"><summary>{c.legacy}</summary><p>{c.legacyHelp}</p><a href={`${prefix}/shida/space?view=support`}>{c.support}</a></details>
 </section>;
}
