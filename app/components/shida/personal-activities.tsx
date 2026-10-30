"use client";
import {useEffect,useState} from 'react';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {spaceSettingsCopy} from '../../lib/space-settings-copy';
import {workspaceText} from '../../lib/personal-workspace-copy';
import {managedActivities,type ManagedActivity} from '../../lib/personal-activities';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {OFFICIAL_CHANNELS} from '../../lib/brand';
import {restaurantText} from '../../lib/restaurant-seller-copy';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
import {activitiesDesignCopy} from '../../lib/activities-design-copy';

type ActivityData={binding:string;items:ManagedActivity[];options:ManagedActivity['market'][];failed:boolean;more:boolean;markets:string[];business:boolean};
const marketIcon=(market:ManagedActivity['market']):SpaceIconName=>market==='wenze'?'shop':market==='restaurants'?'restaurant':'tool';
function ActivityImage({item}:{item:ManagedActivity}){
 const [failed,setFailed]=useState(false);
 return <div className="activity-thumbnail">{item.image&&!failed?/* eslint-disable-next-line @next/next/no-img-element */
 <img src={item.image} alt="" loading="lazy" width="72" height="80" onError={()=>setFailed(true)}/>:<SpaceIcon name={marketIcon(item.market)}/>}</div>;
}
function MarketplaceIllustration(){
 return <svg className="activities-illustration" viewBox="0 0 300 130" fill="none" aria-hidden="true"><path d="M12 129a120 120 0 0 1 240 0" fill="#dde5d2"/><path d="M14 129h274" stroke="#244d40" strokeWidth="2"/><g fill="#8ba184"><path d="M65 129Q20 80 44 60q30 12 21 69M72 129q-5-75 21-73 10 35-21 73M240 128q-20-65 2-69 20 20-2 69M247 129q13-52 34-36-4 27-34 36"/></g><path d="M107 75h90v53h-90Z" fill="#faf8ee" stroke="#244d40" strokeWidth="2"/><path d="m103 75 12-30h74l12 30Z" fill="#faf8ee" stroke="#244d40" strokeWidth="2"/><path d="m128 45-6 30m25-30v30m18-30 6 30m18-30 12 30M103 75q0 17 19 0 12 17 25 0 12 17 24 0 17 17 30 0" stroke="#244d40" strokeWidth="2"/><path d="M120 128V98a10 10 0 0 1 20 0v30M155 91h29v22h-29Z" stroke="#244d40" strokeWidth="2"/><path d="M55 34q7-7 14 0 5-9 13-7M216 25q7-7 14 0 5-9 13-7" stroke="#244d40" strokeWidth="2"/></svg>;
}
export function PersonalActivities({binding,locale}:{binding:string;locale:MarketplaceLocale}){
 const c=mySpaceCopy[locale],d=activitiesDesignCopy[locale],labels=spaceSettingsCopy[locale],t=accountSpaceCopy[locale],n=accountNavigationCopy[locale];
 const prefix=locale==='en'?'':`/${locale}`,w=(key:Parameters<typeof workspaceText>[1])=>workspaceText(locale,key);
 const [restaurantPages,setRestaurantPages]=useState(1),[data,setData]=useState<ActivityData|null>(null),[revision,setRevision]=useState(0),[creating,setCreating]=useState(false);
 useEffect(()=>{
  let active=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  const read=async(path:string)=>{const response=await fetch(`/api/shida/personal/${path}`,{signal:controller.signal,cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding}});if(!response.ok)throw Error('Unavailable activities');return response.json();};
  const lists=Promise.allSettled([
   Promise.all([read('wenze/stores/?archived=false'),read('wenze/stores/?archived=true')]).then(([current,archived])=>managedActivities('wenze',{stores:[...current.stores,...archived.stores]})),
   Promise.all(Array.from({length:restaurantPages},(_,i)=>read(`restaurants/?page=${i+1}&page_size=20`))).then(pages=>managedActivities('restaurants',{...pages[0],items:pages.flatMap(page=>page.items)})),
   Promise.all([read('services/'),read('services/capabilities/')]).then(([value,policy])=>managedActivities('services',value,policy))
  ]);
  const navigation=read('security/navigation/').then(value=>{if(!Array.isArray(value.markets)||typeof value.organization_management!=='boolean')throw Error('Unavailable permissions');return value;});
  void Promise.allSettled([lists,navigation]).then(([results,overview])=>{
   if(!active||results.status!=='fulfilled')return;
   const values=results.value;
   setData({binding,items:values.flatMap(r=>r.status==='fulfilled'?r.value.items:[]),options:values.flatMap((r,i)=>r.status==='fulfilled'&&(r.value.setup||i===0)?[(['wenze','restaurants','services'] as const)[i]]:[]),failed:values.some(r=>r.status==='rejected')||overview.status==='rejected',more:values.some(r=>r.status==='fulfilled'&&r.value.more),markets:overview.status==='fulfilled'?overview.value.markets:[],business:overview.status==='fulfilled'&&overview.value.organization_management});
  }).finally(()=>clearTimeout(timer));
  return()=>{active=false;controller.abort();clearTimeout(timer);};
 },[binding,revision,restaurantPages]);
 const current=data?.binding===binding?data:null;
 const other=current?.markets.filter(m=>['jobs','apartments','hotels','wewa'].includes(m))??[];
 const populated=!!current&&(current.items.length>0||other.length>0);
 const whatsapp=(message:string)=>{const url=new URL(OFFICIAL_CHANNELS.whatsapp);url.searchParams.set('text',message);return url.href;};
 const card=(title:string,help:string,href:string,icon:SpaceIconName,external=false)=><a key={title} href={href} {...external?{target:'_blank',rel:'noopener noreferrer'}:{}}><span className="activity-option-icon"><SpaceIcon name={icon}/></span><span><strong>{title}</strong><small>{help}</small>{external&&<small className="activity-channel">{d.whatsapp}</small>}</span><span aria-hidden="true">›</span></a>;
 const creation=<div className="activity-options">{current?.options.map(market=>card(market==='wenze'?c.shop:market==='restaurants'?c.restaurant:c.service,market==='wenze'?d.shopHelp:market==='restaurants'?d.restaurantHelp:d.serviceHelp,`${prefix}/shida/seller/${market}`,marketIcon(market)))}{card(labels.sell,labels.sellHelp,`${prefix}/shida/wenze/sell`,'orders')}</div>;
 const opportunities=<div className="activity-options">{card(d.seeker,d.seekerHelp,whatsapp(({en:'create candidate profile',fr:'créer profil candidat',ln:'sala profil ya mosala',sw:'unda wasifu wa kazi'})[locale]),'management',true)}{card(d.offer,d.employmentHelp,whatsapp(({en:'employment menu',fr:'menu emploi',ln:'menu mosala',sw:'menyu ajira'})[locale]),'people',true)}{card(d.explore,d.exploreHelp,`${prefix}/shida`,'search')}{current?.business&&card('SHIDA Business',d.businessHelp,'https://business.nihiloba.com/','business')}</div>;
 const label=(market:ManagedActivity['market'])=>market==='wenze'?t.shop:market==='services'?t.services:t.restaurant;
 return <section className="space-managed activities-dashboard">
 {!current?<p role="status">{t.loading}</p>:<>
 {current.failed&&<div className="activities-error" role="alert"><p>{w('partial')}</p><button type="button" onClick={()=>setRevision(v=>v+1)}>{c.retry}</button></div>}
 {populated&&<div className="activities-toolbar"><button type="button" aria-expanded={creating} aria-controls="new-activity-options" onClick={()=>setCreating(v=>!v)}>{creating?d.close:`+ ${d.newActivity}`}</button></div>}
 {!populated&&!current.failed&&<div className="activities-welcome"><div><h2>{d.start}</h2><p>{d.empty}</p></div><MarketplaceIllustration/></div>}
 {populated&&<section aria-labelledby="your-activities-heading"><header className="activities-section-heading"><h2 id="your-activities-heading">{d.yours}</h2>{current.items.length>0&&<p>{(current.failed||current.more||other.length?d.showing:current.items.length===1?d.one:d.count).replace('{count}',String(current.items.length))}</p>}</header>
 <div className="activity-cards">{current.items.map(item=><article key={`${item.market}:${item.ref}`}>
 <ActivityImage item={item}/><div className="activity-card-content"><h3>{item.name||c.unnamed}</h3><span className="activity-category">{label(item.market)}</span><div className="activity-meta">{item.location&&<p className="activity-location">{item.location}</p>}<p className={`activity-state activity-state-${item.status}`}>{item.status==='pending'?d.pending:c[item.status as 'active'|'inactive'|'draft'|'hidden'|'needsUpdate']}</p></div>
 <div className="activity-actions"><a className="activity-manage" href={item.individual?`${prefix}/shida/wenze/sell`:`${prefix}/shida/seller/${item.market}?${item.query}`}>{item.missing.length?d.complete:d.manage}<span className="sr-only"> · {item.name||c.unnamed}</span><span aria-hidden="true"> →</span></a>{item.published&&!item.individual&&<a href={`${prefix}/shida/${item.market}/${encodeURIComponent(item.ref)}`}>{item.market==='wenze'?d.viewShop:d.view}<span className="sr-only"> · {item.name||c.unnamed}</span></a>}</div>
 {item.missing.length>0&&<details className="activity-completion"><summary>{c.missing}</summary><p>{item.missing.filter(k=>k!=='setup').map(k=>k.startsWith('restaurant:')?restaurantText(locale,k.slice(11)):k==='name'?c.missingName:k==='location'?c.missingLocation:c.missingCategory).join(', ')}</p><p>{c.missingSetup}</p></details>}</div></article>)}</div>
 {current.more&&<button className="activities-more" onClick={()=>setRestaurantPages(v=>v+1)}>{c.more}</button>}
 {other.length>0&&<div className="activity-options activity-existing-markets">{other.map(m=>card(n[m as 'jobs'|'apartments'|'hotels'|'wewa'],n.whatsapp,OFFICIAL_CHANNELS.whatsapp,'management'))}</div>}
 </section>}
 {(!populated||creating)&&<section id="new-activity-options" className={populated?'activities-new':''}>{populated&&<h2>{d.newActivity}</h2>}{creation}</section>}
 <section className={populated?'activities-other':'activities-discover'}>{populated&&<><h2>{d.other}</h2><p>{d.otherHelp}</p></>}{opportunities}</section>
 </>}
 <details className="space-legacy-help"><summary>{c.legacy}</summary><p>{c.legacyHelp}</p><a href={`${prefix}/shida/space?view=support`}>{c.support}</a></details>
 </section>;
}
