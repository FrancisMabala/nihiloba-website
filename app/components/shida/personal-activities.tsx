"use client";
import {useState} from 'react';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {spaceSettingsCopy} from '../../lib/space-settings-copy';
import {workspaceText} from '../../lib/personal-workspace-copy';
import {type ManagedActivity} from '../../lib/personal-activities';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {OFFICIAL_CHANNELS} from '../../lib/brand';
import {restaurantText} from '../../lib/restaurant-seller-copy';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
import {quickSellCopy} from '../../lib/quick-sell-copy';
import {type ActivityData} from '../../lib/use-personal-activity-data';
import {universalSpaceCopy} from '../../lib/universal-space-copy';
import {stayTravelOnboarding} from '../../lib/stay-travel-onboarding';
import {activitiesDesignCopy} from '../../lib/activities-design-copy';


const marketIcon=(market:ManagedActivity['market']):SpaceIconName=>market==='wenze'?'shop':market==='restaurants'?'restaurant':'tool';
function ActivityImage({item}:{item:ManagedActivity}){
 const [failed,setFailed]=useState(false);
 return <div className="activity-thumbnail">{item.image&&!failed?/* eslint-disable-next-line @next/next/no-img-element */
 <img src={item.image} alt="" loading="lazy" width="72" height="80" onError={()=>setFailed(true)}/>:<SpaceIcon name={marketIcon(item.market)}/>}</div>;
}
function MarketplaceIllustration(){
 return <svg className="activities-illustration" viewBox="0 0 300 130" fill="none" aria-hidden="true"><path d="M12 129a120 120 0 0 1 240 0" fill="#dde5d2"/><path d="M14 129h274" stroke="#244d40" strokeWidth="2"/><g fill="#8ba184"><path d="M65 129Q20 80 44 60q30 12 21 69M72 129q-5-75 21-73 10 35-21 73M240 128q-20-65 2-69 20 20-2 69M247 129q13-52 34-36-4 27-34 36"/></g><path d="M107 75h90v53h-90Z" fill="#faf8ee" stroke="#244d40" strokeWidth="2"/><path d="m103 75 12-30h74l12 30Z" fill="#faf8ee" stroke="#244d40" strokeWidth="2"/><path d="m128 45-6 30m25-30v30m18-30 6 30m18-30 12 30M103 75q0 17 19 0 12 17 25 0 12 17 24 0 17 17 30 0" stroke="#244d40" strokeWidth="2"/><path d="M120 128V98a10 10 0 0 1 20 0v30M155 91h29v22h-29Z" stroke="#244d40" strokeWidth="2"/><path d="M55 34q7-7 14 0 5-9 13-7M216 25q7-7 14 0 5-9 13-7" stroke="#244d40" strokeWidth="2"/></svg>;
}
export function PersonalActivities({locale,current,onMore,onRetry,overview=false}:{overview?:boolean;locale:MarketplaceLocale;current:ActivityData|null;onMore:()=>void;onRetry:()=>void}){
 const u=universalSpaceCopy[locale],c=mySpaceCopy[locale],d=activitiesDesignCopy[locale],labels=spaceSettingsCopy[locale],t=accountSpaceCopy[locale],n=accountNavigationCopy[locale];
 const prefix=locale==='en'?'':`/${locale}`,w=(key:Parameters<typeof workspaceText>[1])=>workspaceText(locale,key);
 const [creating,setCreating]=useState(false);

 const other=current?.markets.filter(m=>['jobs','apartments','hotels','wewa'].includes(m))??[];
 const populated=!!current&&(current.items.length>0||other.length>0||current.business||Object.values(current.counts??{}).some(count=>count>0));
 const whatsapp=(message:string)=>{const url=new URL(OFFICIAL_CHANNELS.whatsapp);url.searchParams.set('text',message);return url.href;};
 const managementLink=(market:string)=>market==='hotels'&&current?.business?'https://business.nihiloba.com/':whatsapp(market==='jobs'?({en:'employment menu',fr:'menu emploi',ln:'menu mosala',sw:'menyu ajira'})[locale]:market==='wewa'?'wewa profile':market==='hotels'?'hotel dashboard':({en:'my profile',fr:'mon profil',ln:'profil na ngai',sw:'wasifu wangu'})[locale]);
 const card=(title:string,help:string,href:string,icon:SpaceIconName,external=false)=><a key={title} href={href} {...external?{target:'_blank',rel:'noopener noreferrer'}:{}}><span className="activity-option-icon"><SpaceIcon name={icon}/></span><span><strong>{title}</strong><small>{help}</small>{external&&<small className="activity-channel">{d.whatsapp}</small>}</span><span aria-hidden="true">›</span></a>;
 const creation=<div className="activity-options">{current?.options.map(market=>card(market==='wenze'?c.shop:market==='restaurants'?c.restaurant:c.service,market==='wenze'?d.shopHelp:market==='restaurants'?d.restaurantHelp:d.serviceHelp,`${prefix}/shida/seller/${market}`,marketIcon(market)))}{card(labels.sell,labels.sellHelp,`${prefix}/shida/wenze/sell`,'orders')}{card(u.property,u.propertyHelp,whatsapp(stayTravelOnboarding.apartments[locale]),'home',true)}{card(u.hotel,u.hotelHelp,current?.business?'https://business.nihiloba.com/':whatsapp(stayTravelOnboarding.hotels[locale]),'business',!current?.business)}{card(u.driver,u.driverHelp,whatsapp(stayTravelOnboarding.transport[locale]),'people',true)}{card(d.offer,d.employmentHelp,whatsapp(({en:'employment menu',fr:'menu emploi',ln:'menu mosala',sw:'menyu ajira'})[locale]),'management',true)}</div>;
 const opportunities=<div className="activity-options">{card(d.seeker,d.seekerHelp,`${prefix}/shida/space?view=candidate`,'management')}{card(d.explore,d.exploreHelp,`${prefix}/shida`,'search')}{current?.business&&card('SHIDA Business',d.businessHelp,'https://business.nihiloba.com/','business')}</div>;
 const label=(market:ManagedActivity['market'])=>market==='wenze'?t.shop:market==='services'?t.services:t.restaurant;
 const extra=({en:{profiles:'Professional profiles',offerings:'services',mixed:'Different service statuses',more:'Do more with SHIDA'},fr:{profiles:'Profils professionnels',offerings:'services',mixed:'Statuts des services différents',more:'Faites plus avec SHIDA'},ln:{profiles:'Baprofili ya mosala',offerings:'misala',mixed:'Misala ezali na bizaleli ekeseni',more:'Sala mingi na SHIDA'},sw:{profiles:'Wasifu wa kitaalamu',offerings:'huduma',mixed:'Hali tofauti za huduma',more:'Fanya zaidi na SHIDA'}})[locale];
 const groups=current?[
  {id:'shops',market:'wenze' as const,title:t.shop,items:current.items.filter(i=>i.market==='wenze'&&!i.individual)},
  {id:'quick-sales',market:'wenze' as const,title:quickSellCopy[locale].individual,items:current.items.filter(i=>i.market==='wenze'&&i.individual)},
  {id:'restaurants',market:'restaurants' as const,title:t.restaurant,items:current.items.filter(i=>i.market==='restaurants')},
  {id:'services',market:'services' as const,title:extra.profiles,items:current.items.filter(i=>i.market==='services')}
 ]:[];
 return <section className="space-managed activities-dashboard">
 {!current?<p role="status">{t.loading}</p>:<>
 {!overview&&<div className="activities-toolbar"><button type="button" aria-expanded={creating} aria-controls="new-activity-options" onClick={()=>setCreating(v=>!v)}>{creating?d.close:`+ ${d.newActivity}`}</button></div>}
 {current.failed&&<div className="activities-error" role="alert"><p>{w('partial')}</p><button type="button" onClick={onRetry}>{c.retry}</button></div>}
 {overview&&<div className="activities-hero"><p className="activities-slogan" lang="ln">Misala na yo nyonso, na esika moko!</p><MarketplaceIllustration/><div className="activities-toolbar"><button type="button" aria-expanded={creating} aria-controls="new-activity-options" onClick={()=>setCreating(v=>!v)}>{creating?d.close:`+ ${d.newActivity}`}</button></div></div>}
 {overview&&<nav className="activities-summary" aria-label={d.yours}>{groups.filter(group=>group.id!=='quick-sales'&&(current.counts?.[group.market]??group.items.length)>0).map(group=><a key={group.id} className={`summary-${group.market}`} href={group.items.length?`${prefix}/shida/space?view=management#activities-${group.id}`:`${prefix}/shida/seller/${group.market}`}><SpaceIcon name={marketIcon(group.market)}/><span><strong>{current.counts?.[group.market]??(!current.loaded.includes(group.market)?'—':`${group.items.length}${group.market==='restaurants'&&current.more?'+':''}`)}</strong><small>{group.title}</small></span></a>)}
 {(current.counts?.listings??0)>0&&<a className="summary-wenze" href={`${prefix}/shida/space?view=listings`}><SpaceIcon name="orders"/><span><strong>{current.counts!.listings}</strong><small>{u.listings}</small></span></a>}
 {other.filter(m=>(current.counts?.[m as 'jobs'|'apartments'|'hotels'|'wewa']??0)>0).map(m=><a key={m} className={`summary-${m}`} href={managementLink(m)} target="_blank" rel="noopener noreferrer"><SpaceIcon name={m==='apartments'?'home':m==='hotels'?'business':'management'}/><span><strong>{current.counts![m as 'jobs'|'apartments'|'hotels'|'wewa']}</strong><small>{n[m as 'jobs'|'apartments'|'hotels'|'wewa']}</small></span></a>)}
 </nav>}
 {!populated&&!current.failed&&<div className="activities-welcome"><div><h2>{d.start}</h2><p>{d.empty}</p></div><MarketplaceIllustration/></div>}
 {populated&&(!overview||other.length>0||current.items.some(item=>item.individual))&&<section aria-labelledby="your-activities-heading"><header className="activities-section-heading"><h2 id="your-activities-heading">{overview?u.managed:d.yours}</h2></header>{overview&&current.items.some(item=>item.individual)&&<div className="activity-options">{card(u.listings,u.listingHelp,`${prefix}/shida/space?view=listings`,'orders')}</div>}
 {!overview&&<div className="activity-groups">{groups.filter(group=>group.items.length).map(group=><section id={`activities-${group.id}`} className={`activity-group group-${group.market}`} key={group.id}><h3><SpaceIcon name={marketIcon(group.market)}/>{group.title}{group.id!=='quick-sales'&&<> ({group.items.length}{group.market==='restaurants'&&current.more?'+':''})</>}</h3><div className="activity-cards">{group.items.map(item=><article key={`${item.market}:${item.ref}`}>
 <ActivityImage item={item}/><div className="activity-card-content"><h3>{item.name||c.unnamed}</h3><span className="activity-category">{item.individual?quickSellCopy[locale].individual:item.providerRef?extra.profiles:label(item.market)}</span>{item.offeringCount&&<p className="activity-offering-count">{item.offeringCount} {extra.offerings}</p>}<div className="activity-meta">{item.location&&<p className="activity-location">{item.location}</p>}<p className={`activity-state activity-state-${item.status}`}>{item.status==='mixed'?extra.mixed:item.status==='pending'?d.pending:c[item.status as 'active'|'inactive'|'draft'|'hidden'|'needsUpdate']}</p></div>
 <div className="activity-actions"><a className="activity-manage" href={item.individual?`${prefix}/shida/space?view=listings`:`${prefix}/shida/seller/${item.market}?${item.query}`}>{item.missing.length?d.complete:d.manage}<span className="sr-only"> · {item.name||c.unnamed}</span><span aria-hidden="true"> →</span></a>{item.published&&!item.individual&&<a href={`${prefix}/shida/${item.market}/${item.providerRef?'providers/':''}${encodeURIComponent(item.providerRef||item.ref)}`}>{item.market==='wenze'?d.viewShop:d.view}<span className="sr-only"> · {item.name||c.unnamed}</span></a>}</div>
 {item.missing.length>0&&<details className="activity-completion"><summary>{c.missing}</summary><p>{item.missing.filter(k=>k!=='setup').map(k=>k.startsWith('restaurant:')?restaurantText(locale,k.slice(11)):k==='name'?c.missingName:k==='location'?c.missingLocation:c.missingCategory).join(', ')}</p><p>{c.missingSetup}</p></details>}</div></article>)}</div></section>)}</div>}
 {!overview&&current.more&&<button className="activities-more" onClick={onMore}>{c.more}</button>}
 {other.length>0&&<div className="activity-options activity-existing-markets">{other.map(m=>card(n[m as 'jobs'|'apartments'|'hotels'|'wewa'],n.whatsapp,m==='hotels'&&current.business?'https://business.nihiloba.com/':whatsapp(m==='jobs'?({en:'employment menu',fr:'menu emploi',ln:'menu mosala',sw:'menyu ajira'})[locale]:m==='wewa'?'wewa profile':m==='hotels'?'hotel dashboard':({en:'my profile',fr:'mon profil',ln:'profil na ngai',sw:'wasifu wangu'})[locale]),m==='apartments'?'home':m==='hotels'?'business':'management',!(m==='hotels'&&current.business)))}</div>}
 </section>}
 <section id="new-activity-options" className={populated?'activities-new':''}>{(populated||current.failed)&&<h2>{u.create}</h2>}{populated&&<p>{u.expand}</p>}{populated?<details open={creating} onToggle={event=>setCreating(event.currentTarget.open)}><summary>{d.newActivity}</summary>{creation}</details>:creation}</section>
 <section className={populated?'activities-other':'activities-discover'}><h2>{u.other}</h2><p>{d.otherHelp}</p>{opportunities}</section>
 </>}
 <details className="space-legacy-help"><summary>{c.legacy}</summary><p>{c.legacyHelp}</p><a href={`${prefix}/shida/space?view=support`}>{c.support}</a></details>
 </section>;
}
