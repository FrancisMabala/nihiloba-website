'use client';
import {useEffect,useState,useSyncExternalStore} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import {usePersonalManagement} from './use-personal-management';
import {type MarketplaceLocale} from './marketplace-account-copy';

const copy={en:['Home','Markets','My space','Manage','Menu','Help','Cart','Business workspace'],fr:['Accueil','Marchés','Mon espace','Gérer','Menu','Aide','Panier','Espace Business'],ln:['Ebandeli','Luka','Esika na ngai','Kamba','Menu','Lisalisi','Kitunga','Esika Business'],sw:['Nyumbani','Gundua','Eneo langu','Simamia','Menyu','Msaada','Kikapu','Eneo la Business']} as const;
const subscribeHash=(notify:()=>void)=>{window.addEventListener('hashchange',notify);return()=>window.removeEventListener('hashchange',notify);};
export function ShidaNavigation(){
 const hash=useSyncExternalStore(subscribeHash,()=>window.location.hash,()=> '');
 const pathname=usePathname(),query=useSearchParams(),locale=(pathname.match(/^\/(fr|en|ln|sw)(?:\/|$)/)?.[1]||'en') as MarketplaceLocale;
 const prefix=locale==='en'?'':`/${locale}`,base=`${prefix}/shida`,path=pathname.replace(/^\/(fr|en|ln|sw)(?=\/)/,'').replace(/\/$/,''),t=copy[locale];
 const management=usePersonalManagement(),[keyboard,setKeyboard]=useState(false);
 useEffect(()=>{
  const viewport=window.visualViewport;
  // Focus alone does not mean a keyboard is open (desktop and external keyboards).
  // Keep the bar hidden until the visual viewport recovers, including on blur.
  const update=()=>queueMicrotask(()=>setKeyboard(viewport
   ? window.innerHeight-viewport.height-viewport.offsetTop>120
   : Boolean(document.activeElement?.matches('input:not([type=checkbox]):not([type=radio]),textarea,select,[contenteditable=true]'))));
  update();
  viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);
  document.addEventListener('focusin',update);document.addEventListener('focusout',update);
  return()=>{viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);document.removeEventListener('focusin',update);document.removeEventListener('focusout',update);};
 },[]);
 const personal=/^\/shida\/(space|my-applications|mes-candidatures|service-requests|service-bills|restaurant-orders|restaurant-reservations|inbox)(?:\/|$)/.test(path)||path==='/shida/wenze/orders';
 const active=path==='/shida/wenze/sell'?3:path==='/shida/register'?2:path==='/shida'?(hash==='#explore'?1:0):personal?(query.get('view')==='management'?3:2):1;
 const hrefs=[base,`${base}#explore`,`${base}/space`,...(management?.can_manage?[`${base}/space?view=management`]:[])];
 const icons:SpaceIconName[]=['home','shop','requests','management'];
 return <nav className="shida-navigation" aria-label="SHIDA" data-keyboard={keyboard||undefined}>{hrefs.map((href,index)=><a key={href} href={href} aria-current={active===index?'page':undefined}><SpaceIcon name={icons[index]}/><span>{t[index]}</span></a>)}</nav>;
}
