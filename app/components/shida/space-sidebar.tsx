import {helpText} from '../../lib/help-questions-copy';
import {usePersonalNotificationCount} from '../../lib/personal-notification-count';
import {jobSearchCopy} from '../../lib/job-search-copy';
import {universalSpaceCopy} from '../../lib/universal-space-copy';
import {useEffect,useRef,type MouseEventHandler} from 'react';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {marketplaceAccountCopy,type MarketplaceLocale} from './marketplace-account-copy';
import {listingCopy} from '../../lib/wenze-listings-copy';
export function SpaceSidebar({locale,view,onNavigate,binding,individualOnly=false,hasListings=false}:{locale:MarketplaceLocale;view:string;binding?:string;onNavigate?:MouseEventHandler<HTMLAnchorElement>;individualOnly?:boolean;hasListings?:boolean}){
 const n=accountNavigationCopy[locale],t=accountSpaceCopy[locale],a=marketplaceAccountCopy[locale];
 const base=`${locale==='en'?'':`/${locale}`}/shida/space`;
 const unread=usePersonalNotificationCount(binding),selector=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
  // Safari may blur to the document before a tapped link receives its click.
  // Dismiss outside presses explicitly instead of treating null focus as outside.
  const outside=(event:PointerEvent)=>{
   const menu=selector.current;
   if(menu?.open&&event.target instanceof Node&&!menu.contains(event.target))menu.open=false;
  };
  document.addEventListener('pointerdown',outside);
  return()=>document.removeEventListener('pointerdown',outside);
 },[]);
 const entries:[string,string,SpaceIconName][]=[['management',n.activities,'management'],['transactions',n.transactions,'orders'],['messages',t.messages,'bell'],['settings',n.account,'settings'],['questions',helpText(locale,'title'),'messages']];
 if(individualOnly&&view!=='job-offer')entries[0]=['listings',listingCopy[locale].title,'orders'];
 else if(hasListings||view==='listings')entries.splice(1,0,['listings',listingCopy[locale].title,'orders']);
 entries.splice(entries.findIndex(e=>e[0]==='transactions'),0,['job-search',jobSearchCopy[locale].title,'people']);
 entries.unshift(['overview',universalSpaceCopy[locale].overview,'home']);
 const selected=(key:string)=>key===view||key==='listings'&&view==='job-offer'||key==='job-search'&&view==='candidate'||key==='settings'&&['support','recovery'].includes(view)||key==='transactions'&&['orders','requests','receipts'].includes(view);
 const links=()=>entries.map(([key,label,icon])=><a key={key} onClick={event=>{if(selector.current)selector.current.open=false;onNavigate?.(event);}} href={`${base}?view=${key}`} aria-current={selected(key)?'page':undefined}><SpaceIcon name={icon}/><span>{label}{key==='messages'&&unread!=null&&unread>0&&<strong className="space-notice-count"> {unread>99?'99+':unread}</strong>}</span>{selected(key)&&<span className="space-selected-mark" aria-hidden="true">✓</span>}</a>);
 return <aside className="space-sidebar"><h2>{a.space}</h2><nav className="space-desktop-sections" aria-label={a.space}>{links()}</nav><details ref={selector} className="space-section-selector" onBlur={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget))event.currentTarget.open=false;}} onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}}}><summary>{entries.find(([key])=>selected(key))?.[1]||a.space}<span aria-hidden="true">⌄</span></summary><nav aria-label={a.space}>{links()}</nav></details></aside>;
}
