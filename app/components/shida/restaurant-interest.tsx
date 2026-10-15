'use client';
import {useEffect} from 'react';
import {restorePersonalSession} from '../../lib/personal-session-browser';
import {request} from '../../lib/restaurant-seller-browser';
import {eligibleInterest,interestReceipt,type InterestKind} from '../../lib/restaurant-interest';
import {insightsCopy} from '../../lib/restaurant-insights-copy';
import type {RestaurantLocale} from '../../services/shida/restaurants-client';

export function RestaurantInterest({establishmentRef,locale,menuOnly,menuAvailable}:{establishmentRef:string;locale:RestaurantLocale;menuOnly:boolean;menuAvailable:boolean}){
 useEffect(()=>{
  const receipt=interestReceipt(),sent=new Set<string>(),timers=new Map<string,ReturnType<typeof setTimeout>>();let alive=true;
  const visible=(element:Element|null)=>{if(document.visibilityState!=='visible'||!element)return false;const r=element.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};
  const send=(kind:InterestKind,element:Element|null,item?:string)=>{
   const key=receipt(kind,item);if(sent.has(key)||timers.has(key)||!visible(element))return;
   timers.set(key,setTimeout(()=>{timers.delete(key);if(!alive||!visible(element)||kind==='item_views'&&!element?.hasAttribute('open'))return;
    sent.add(key);void restorePersonalSession().then(session=>{if(!alive)return;return request(`personal/restaurant-orders/establishments/${establishmentRef}/interest`,{method:'POST',body:JSON.stringify({kind,operation_key:key,...(item?{item_ref:item}:{})})},session.binding);}).catch(()=>{sent.delete(key);});
   },1000));
  };
  const interact=(event:Event)=>{
   if(!eligibleInterest(event,document.visibilityState==='visible',navigator.webdriver,navigator.doNotTrack==='1'))return;
   if(!menuOnly)send('profile_opens',document.querySelector('.restaurant-detail-header'));
   if(menuAvailable)send('menu_opens',document.querySelector('#guest-order .rst-checkout-items'));
   if(event.type!=='click'||!(event.target instanceof Element))return;
   const details=event.target.closest('summary')?.parentElement;
   if(details?.dataset.restaurantItemView)queueMicrotask(()=>send('item_views',details,details.dataset.restaurantItemView));
   const selection=event.target.closest<HTMLButtonElement>('button[data-restaurant-item-selection]');
   if(selection&&!selection.disabled)send('item_selections',selection,selection.dataset.restaurantItemSelection);
  };
  const events=['click','pointerdown','keydown','scroll'];events.forEach(name=>document.addEventListener(name,interact,{passive:true}));
  return()=>{alive=false;timers.forEach(clearTimeout);events.forEach(name=>document.removeEventListener(name,interact));};
 },[establishmentRef,menuOnly,menuAvailable]);
 return <p className="restaurant-note">{insightsCopy[locale].customerNotice}</p>;
}
