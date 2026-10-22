'use client';
import {useEffect,useRef,useState} from 'react';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {marketplaceAccountCopy} from './marketplace-account-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {PERSONAL_SESSION_EVENT,restorePersonalSession,type PersonalSession} from '../../lib/personal-session-browser';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';
import {useServicesProviderAccess} from './use-services-provider-access';
import {servicesAccountCopy} from '../../lib/services-account-navigation';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import {AccountSpaceOrders} from './account-space-orders';
import './account-space.css';
type View='home'|'orders'|'requests'|'messages'|'receipts'|'settings'|'management';
export function AccountSpace({locale,initialView,inbox=false}:{locale:MarketplaceLocale;initialView?:string;inbox?:boolean}){
 const t=accountSpaceCopy[locale],a=marketplaceAccountCopy[locale],prefix=locale==='en'?'':`/${locale}`,bilingual=locale==='en'?'':'/fr',base=`${prefix}/shida/space`;
 const allowed:View[]=['home','orders','requests','messages','receipts','settings','management'];
 const view:View=inbox||initialView==='inbox'?'messages':allowed.includes(initialView as View)?initialView as View:'home';
 const [session,setSession]=useState<PersonalSession|null>(null),[checking,setChecking]=useState(true),[attempt,setAttempt]=useState(0);
 const dialog=useRef<HTMLDialogElement>(null),menuTrigger=useRef<HTMLButtonElement>(null);
 const access=useServicesProviderAccess(session?.binding??null);
 useEffect(()=>{
  let alive=true,generation=0,controller:AbortController|undefined;
  const load=async()=>{
   const ticket=++generation;controller?.abort();controller=new AbortController();const current=controller;
   setSession(null);setChecking(true);const timer=setTimeout(()=>current.abort(),12000);
   try{const value=await restorePersonalSession(current.signal);if(alive&&ticket===generation)setSession(value);}
   catch{if(alive&&ticket===generation)setSession(null);}
   finally{clearTimeout(timer);if(alive&&ticket===generation)setChecking(false);}
  };
  const refresh=()=>void load(),storage=(event:StorageEvent)=>{if(event.key===PERSONAL_SESSION_EVENT)refresh();},visible=()=>{if(!document.hidden)refresh();};
  void load();window.addEventListener(PERSONAL_SESSION_EVENT,refresh);window.addEventListener('storage',storage);window.addEventListener('focus',refresh);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',visible);
  return()=>{alive=false;++generation;controller?.abort();window.removeEventListener(PERSONAL_SESSION_EVENT,refresh);window.removeEventListener('storage',storage);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',visible);};
 },[attempt]);
 const href=(key:View)=>key==='home'?base:`${base}?view=${key}`;
 const entries:{key:View;label:string;icon:SpaceIconName}[]=[{key:'home',label:t.home,icon:'home'},{key:'orders',label:t.orders,icon:'orders'},{key:'requests',label:t.requests,icon:'requests'},{key:'messages',label:t.messages,icon:'messages'},{key:'receipts',label:t.receipts,icon:'receipts'}];
 const managementLinks=[{label:t.shop,url:`${prefix}/shida/seller/wenze`,icon:'shop' as const},...(access!=='unavailable'?[{label:access==='provider'?t.services:servicesAccountCopy[locale].offer,url:`${prefix}/shida/seller/services`,icon:'management' as const}]:[]),{label:t.restaurant,url:`${prefix}/shida/seller/restaurants`,icon:'restaurant' as const},{label:t.organization,url:'https://business.nihiloba.com/',icon:'management' as const}];
 const managementRows=()=>managementLinks.map(item=><a key={item.url} href={item.url}><SpaceIcon name={item.icon}/><span>{item.label}</span></a>);
 const navigation=(mobile=false)=><nav aria-label={a.space}>
  {entries.map(item=><a key={item.key} href={href(item.key)} aria-current={view===item.key?'page':undefined}><SpaceIcon name={item.icon}/><span>{item.label}</span></a>)}
  <div className="space-nav-divider"/>
  {mobile?<a href={href('management')} aria-current={view==='management'?'page':undefined}><SpaceIcon name="management"/><span>{t.manage}</span></a>:<details className="space-management" open={view==='management'||undefined}><summary><SpaceIcon name="management"/><span>{t.manage}</span></summary><div>{managementRows()}</div></details>}
  <a href={href('settings')} aria-current={view==='settings'?'page':undefined}><SpaceIcon name="settings"/><span>{t.settings}</span></a>
 </nav>;
 const rows=(items:[string,string,SpaceIconName][])=> <div className="space-destinations">{items.map(([label,url,icon])=><a href={url} key={url}><SpaceIcon name={icon}/><span>{label}</span></a>)}</div>;
 const orders:[string,string,SpaceIconName][]=[[t.wenzeOrders,`${bilingual}/shida/wenze/orders`,'shop'],[t.foodOrders,`${prefix}/shida/restaurant-orders`,'restaurant']];
 const requests:[string,string,SpaceIconName][]=[[t.serviceRequests,`${prefix}/shida/service-requests`,'requests'],[t.applications,`${bilingual}/shida/my-applications`,'requests']];
 return <div className="account-space" lang={locale}>
  <aside className="space-sidebar"><h2>{a.space}</h2>{navigation()}</aside>
  <div className="space-content"><p className="space-eyebrow">SHIDA / {a.space}</p>
   <h1>{view==='home'?<>{t.hello}{session?` ${session.user.display_name.split(/\s+/)[0]}`:''}</>:view==='management'?t.manage:t[view]}</h1>
   {view==='home'&&<p className="space-intro">{t.intro}</p>}
   {view==='home'&&(checking?<p role="status">{t.loading}</p>:session?<AccountSpaceOrders key={session.binding} binding={session.binding} locale={locale}/>:<section className="space-sign-in"><p>{t.login}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>setAttempt(n=>n+1)}/></section>)}
   {view==='home'&&<section className="space-links-overview"><h2>{t.orders}</h2>{rows(orders)}<h2>{t.requests}</h2>{rows(requests)}</section>}
   {view==='orders'&&<>{rows(orders)}{session&&<AccountSpaceOrders key={session.binding} binding={session.binding} locale={locale}/>}</>}
   {view==='requests'&&rows(requests)}
   {view==='messages'&&<><p className="space-intro">{t.messageNote}</p>{rows([[t.serviceMessages,`${prefix}/shida/service-requests`,'messages'],[t.applications,`${bilingual}/shida/my-applications`,'messages']])}</>}
   {view==='receipts'&&<><p className="space-intro">{t.receiptNote}</p>{rows([[t.bills,`${prefix}/shida/service-bills`,'receipts'],[t.foodReceipts,`${prefix}/shida/restaurant-orders`,'restaurant'],[t.shopReceipts,`${bilingual}/shida/wenze/orders`,'shop']])}</>}
   {view==='management'&&<><p className="space-intro">{t.managementNote}</p><div className="space-destinations">{managementRows()}</div></>}
   {view==='settings'&&<section className="space-settings"><h2>{t.account}</h2><p>{checking?t.loading:session?.user.display_name||t.login}</p><p>{t.accountNote}</p><label htmlFor="space-language">{t.language}</label><select id="space-language" value={locale} onChange={event=>window.location.assign(`${event.target.value==='en'?'':`/${event.target.value}`}/shida/space?view=settings`)}>{(['fr','en','ln','sw'] as const).map(language=><option key={language} value={language}>{({fr:'Français',en:'English',ln:'Lingala',sw:'Swahili'})[language]}</option>)}</select></section>}
  </div>
  <nav className="space-bottom" aria-label={a.space}>{(['home','messages','management'] as const).map(key=><a key={key} href={href(key)} aria-current={view===key?'page':undefined}><SpaceIcon name={key}/><span>{key==='management'?t.management:t[key]}</span></a>)}<button ref={menuTrigger} type="button" aria-haspopup="dialog" onClick={()=>dialog.current?.showModal()}><SpaceIcon name="menu"/><span>{t.menu}</span></button></nav>
  <dialog className="space-mobile-menu" ref={dialog} aria-labelledby="space-menu-title" onClose={()=>menuTrigger.current?.focus()}><div className="space-menu-heading"><h2 id="space-menu-title">{a.space}</h2><button type="button" onClick={()=>dialog.current?.close()}>{t.close}</button></div>{navigation(true)}</dialog>
 </div>;
}
