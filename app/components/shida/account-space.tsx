'use client';
import {useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {marketplaceAccountCopy} from './marketplace-account-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import NotificationCenter from './notification-center';
import {PERSONAL_SESSION_EVENT,restorePersonalSession,type PersonalSession} from '../../lib/personal-session-browser';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import {AccountSpaceOrders} from './account-space-orders';
import {PersonalActivities} from './personal-activities';
import {PersonalActivityOverview} from './personal-activity-overview';
import {workspaceText} from '../../lib/personal-workspace-copy';
import './account-space.css';
import {AccountRecovery} from './account-recovery';
import {securityText} from '../../lib/account-security-copy';
import {AccountSecurity} from './account-security';
import {AccountRecoveryReview} from './account-recovery-review';
import {AccountSupport} from './account-support';
import {accountSupportCopy} from '../../lib/account-support-copy';
import {PersonalProfileSettings} from './personal-profile-settings';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
type View='home'|'orders'|'requests'|'messages'|'receipts'|'settings'|'management'|'support'|'recovery'|'transactions';
export function AccountSpace({locale,initialView,inbox=false}:{locale:MarketplaceLocale;initialView?:string;inbox?:boolean}){
 const router=useRouter();
 const w=(key:Parameters<typeof workspaceText>[1])=>workspaceText(locale,key);
 const t=accountSpaceCopy[locale],a=marketplaceAccountCopy[locale],prefix=locale==='en'?'':`/${locale}`,bilingual=locale==='en'?'':'/fr',base=`${prefix}/shida/space`;
 const allowed:View[]=['home','orders','requests','messages','receipts','settings','management','support','recovery','transactions'];
 const view:View=inbox||initialView==='inbox'?'messages':allowed.includes(initialView as View)?initialView as View:'home';
 const [session,setSession]=useState<PersonalSession|null>(null),[checking,setChecking]=useState(true),[attempt,setAttempt]=useState(0);
 const [securityResult,setSecurityResult]=useState<'deleted'|'logout'|null>(null);
 const n=accountNavigationCopy[locale];
 useEffect(()=>{
  let alive=true,generation=0,controller:AbortController|undefined;
  const load=async(clear=false)=>{
   const ticket=++generation;controller?.abort();controller=new AbortController();const current=controller;
   if(clear){setSession(null);setChecking(true);}const timer=setTimeout(()=>current.abort(),12000);
   try{const value=await restorePersonalSession(current.signal);if(alive&&ticket===generation)setSession(value);}
   catch{if(alive&&ticket===generation)setSession(null);}
   finally{clearTimeout(timer);if(alive&&ticket===generation)setChecking(false);}
  };
  const refresh=()=>void load(),reset=()=>void load(true),storage=(event:StorageEvent)=>{if(event.key===PERSONAL_SESSION_EVENT)reset();},visible=()=>{if(!document.hidden)refresh();};
  void load(true);window.addEventListener(PERSONAL_SESSION_EVENT,reset);window.addEventListener('storage',storage);window.addEventListener('focus',refresh);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',visible);
  return()=>{alive=false;++generation;controller?.abort();window.removeEventListener(PERSONAL_SESSION_EVENT,reset);window.removeEventListener('storage',storage);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',visible);};
 },[attempt]);
 const href=(key:View)=>key==='home'?base:`${base}?view=${key}`;
 const entries:{key:View;label:string;icon:SpaceIconName}[]=[{key:'management',label:n.activities,icon:'management'},{key:'transactions',label:n.transactions,icon:'orders'},{key:'messages',label:t.messages,icon:'messages'},{key:'settings',label:n.account,icon:'settings'}];
 const navigation=()=><nav aria-label={a.space}>{entries.map(item=><a key={item.key} href={href(item.key)} aria-current={(view===item.key||item.key==='transactions'&&['orders','requests','receipts'].includes(view))?'page':undefined}><SpaceIcon name={item.icon}/><span>{item.label}</span></a>)}</nav>;
 const rows=(items:[string,string,SpaceIconName][])=> <div className="space-destinations">{items.map(([label,url,icon])=><a href={url} key={url}><SpaceIcon name={icon}/><span>{label}</span></a>)}</div>;
 const orders:[string,string,SpaceIconName][]=[[t.wenzeOrders,`${bilingual}/shida/wenze/orders`,'shop'],[t.foodOrders,`${prefix}/shida/restaurant-orders`,'restaurant']];
 const requests:[string,string,SpaceIconName][]=[[t.serviceRequests,`${prefix}/shida/service-requests`,'requests'],[w('applications'),locale==='fr'?'/fr/shida/mes-candidatures':`${prefix}/shida/my-applications`,'requests'],[w('reservations'),`${prefix}/shida/restaurant-reservations`,'restaurant']];
 return <div className="account-space" lang={locale}>
  <aside className="space-sidebar"><h2>{a.space}</h2>{navigation()}</aside>
  <div className="space-content"><p className="space-eyebrow">SHIDA / {a.space}</p>
   <h1>{view==='home'?<>{t.hello}{session?` ${session.user.display_name.split(/\s+/)[0]}`:''}</>:view==='management'?n.activities:view==='transactions'?n.transactions:view==='settings'?n.account:view==='support'?accountSupportCopy[locale].title:view==='recovery'?securityText(locale,'report'):t[view]}</h1>
   {view==='messages'&&<p className="space-intro">{mySpaceCopy[locale].messageIntro}</p>}
   {session&&view==='messages'&&<NotificationCenter key={"notifications:"+session.binding+view} inline={view==='messages'} binding={session.binding} apiBase="/api/shida/personal/notifications" locale={locale}/>}
   {view==='home'&&<p className="space-intro">{t.intro}</p>}
   {view==='home'&&(checking?<p role="status">{t.loading}</p>:session?<PersonalActivityOverview key={session.binding} binding={session.binding} locale={locale}/>:<section className="space-sign-in"><p>{t.login}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>setAttempt(n=>n+1)}/></section>)}
   {view==='home'&&<section className="space-links-overview"><h2>{w('quick')}</h2>{rows(entries.map(item=>[item.label,href(item.key),item.icon]))}</section>}
   {view==='recovery'&&<AccountRecovery locale={locale}/>}
   {(view==='settings'||!session)&&view!=='recovery'&&<p><a href={href('recovery')}>{securityText(locale,'report')}</a></p>}
   {view==='support'&&(checking?<p role="status">{t.loading}</p>:session?<AccountSupport key={session.binding} binding={session.binding} locale={locale}/>:<section className="space-sign-in"><p>{t.login}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>setAttempt(n=>n+1)}/></section>)}
   {view==='support'&&session&&<AccountRecoveryReview key={session.binding} binding={session.binding} locale={locale}/>}
   {view==='transactions'&&<><h2>{t.orders}</h2>{rows(orders)}<h2>{t.requests}</h2>{rows(requests)}<h2>{t.receipts}</h2>{rows([[t.bills,`${prefix}/shida/service-bills`,'receipts']])}</>}
   {view==='orders'&&<>{rows(orders)}{session&&<AccountSpaceOrders key={session.binding} binding={session.binding} locale={locale}/>}</>}
   {view==='requests'&&rows(requests)}
   {view==='messages'&&!session&&!checking&&<PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>setAttempt(n=>n+1)}/>}
   {view==='receipts'&&<><p className="space-intro">{t.receiptNote}</p>{rows([[t.bills,`${prefix}/shida/service-bills`,'receipts']])}</>}
   {view==='management'&&<><p className="space-intro">{t.managementNote}</p>{checking?<p role="status">{t.loading}</p>:session?<PersonalActivities key={session.binding} binding={session.binding} locale={locale}/>:<section className="space-sign-in"><p>{t.login}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>setAttempt(n=>n+1)}/></section>}</>}
   {view==='settings'&&<section className="space-settings"><label htmlFor="space-language">{t.language}</label><select id="space-language" value={locale} onChange={event=>router.push(`${event.target.value==='en'?'':`/${event.target.value}`}/shida/space?view=settings`)}>{(['fr','en','ln','sw'] as const).map(language=><option key={language} value={language}>{({fr:'Français',en:'English',ln:'Lingala',sw:'Swahili'})[language]}</option>)}</select></section>}
   {!session&&securityResult&&<p role="status">{securityText(locale,securityResult)}</p>}
   {view==='settings'&&session&&<PersonalProfileSettings key={session.binding} binding={session.binding} locale={locale}/>}
   {view==='settings'&&session&&<AccountSecurity key={session.binding} binding={session.binding} locale={locale} onCompleted={setSecurityResult}/>}

  </div>
 </div>;
}
