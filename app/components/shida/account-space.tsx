'use client';
import {SpaceSidebar} from './space-sidebar';
import {useEffect,useState} from 'react';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {marketplaceAccountCopy} from './marketplace-account-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {PERSONAL_SESSION_EVENT,restorePersonalSession,type PersonalSession} from '../../lib/personal-session-browser';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import {AccountSpaceOrders} from './account-space-orders';
import {PersonalTransactions} from './personal-transactions';
import {PersonalActivities} from './personal-activities';
import {workspaceText} from '../../lib/personal-workspace-copy';
import './account-space.css';
import './account-settings-design.css';
import './activities-design.css';
import {activitiesDesignCopy} from '../../lib/activities-design-copy';
import {AccountRecovery} from './account-recovery';
import {securityText} from '../../lib/account-security-copy';
import {AccountSecurity} from './account-security';
import {AccountRecoveryReview} from './account-recovery-review';
import {AccountSupport} from './account-support';
import {accountSupportCopy} from '../../lib/account-support-copy';
import {PersonalProfileSettings} from './personal-profile-settings';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {MessagesSpace} from './messages-space';
import {resolveSpaceView,type SpaceView as View} from '../../lib/space-view';
export function AccountSpace({locale,initialView,inbox=false}:{locale:MarketplaceLocale;initialView?:string;inbox?:boolean}){
 const w=(key:Parameters<typeof workspaceText>[1])=>workspaceText(locale,key);
 const t=accountSpaceCopy[locale],a=marketplaceAccountCopy[locale],prefix=locale==='en'?'':`/${locale}`,bilingual=locale==='en'?'':'/fr',base=`${prefix}/shida/space`;
 const view=resolveSpaceView(initialView,inbox);
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
 const href=(key:View)=>`${base}?view=${key}`;
 const rows=(items:[string,string,SpaceIconName][])=> <div className="space-destinations">{items.map(([label,url,icon])=><a href={url} key={url}><SpaceIcon name={icon}/><span>{label}</span></a>)}</div>;
 const orders:[string,string,SpaceIconName][]=[[t.wenzeOrders,`${bilingual}/shida/wenze/orders`,'shop'],[t.foodOrders,`${prefix}/shida/restaurant-orders`,'restaurant']];
 const requests:[string,string,SpaceIconName][]=[[t.serviceRequests,`${prefix}/shida/service-requests`,'requests'],[w('applications'),locale==='fr'?'/fr/shida/mes-candidatures':`${prefix}/shida/my-applications`,'requests'],[w('reservations'),`${prefix}/shida/restaurant-reservations`,'restaurant']];
 return <div className={`account-space${view==='settings'?' account-settings-page':view==='management'?' account-activities-page':view==='transactions'?' account-transactions-page':''}`} lang={locale}>
  <SpaceSidebar locale={locale} view={view}/>
  <div className="space-content"><p className="space-eyebrow">SHIDA / {a.space}</p>
   <h1>{view==='management'?n.activities:view==='transactions'?n.transactions:view==='settings'?n.account:view==='support'?accountSupportCopy[locale].title:view==='recovery'?securityText(locale,'report'):t[view]}</h1>
   {view==='messages'&&(checking?<p role="status">{t.loading}</p>:session?<MessagesSpace key={session.binding} binding={session.binding} locale={locale}/>:<PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>setAttempt(n=>n+1)}/>)}
   {view==='recovery'&&<AccountRecovery locale={locale}/>}
   {!session&&view!=='recovery'&&<p><a href={href('recovery')}>{securityText(locale,'report')}</a></p>}
   {view==='support'&&(checking?<p role="status">{t.loading}</p>:session?<AccountSupport key={session.binding} binding={session.binding} locale={locale}/>:<section className="space-sign-in"><p>{t.login}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>setAttempt(n=>n+1)}/></section>)}
   {view==='support'&&session&&<AccountRecoveryReview key={session.binding} binding={session.binding} locale={locale}/>}
   {view==='transactions'&&(checking?<p role="status">{t.loading}</p>:session?<PersonalTransactions key={session.binding} binding={session.binding} locale={locale}/>:<section className="space-sign-in"><p>{t.login}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>setAttempt(n=>n+1)}/></section>)}
   {view==='orders'&&<>{rows(orders)}{session&&<AccountSpaceOrders key={session.binding} binding={session.binding} locale={locale}/>}</>}
   {view==='requests'&&rows(requests)}
   {view==='receipts'&&<><p className="space-intro">{t.receiptNote}</p>{rows([[t.bills,`${prefix}/shida/service-bills`,'receipts']])}</>}
   {view==='management'&&<><p className="space-intro">{activitiesDesignCopy[locale].intro}</p>{checking?<p role="status">{t.loading}</p>:session?<PersonalActivities key={session.binding} binding={session.binding} locale={locale}/>:<section className="space-sign-in"><p>{t.login}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>setAttempt(n=>n+1)}/></section>}</>}
   {!session&&securityResult&&<p role="status">{securityText(locale,securityResult)}</p>}
   {view==='settings'&&session&&<PersonalProfileSettings key={'profile:'+session.binding} binding={session.binding} locale={locale}/>}
   {view==='settings'&&session&&<AccountSecurity key={'security:'+session.binding} binding={session.binding} locale={locale} onCompleted={setSecurityResult}/>}

  </div>
 </div>;
}
