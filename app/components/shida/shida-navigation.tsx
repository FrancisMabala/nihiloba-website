'use client';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import {wenzeCartPath} from './wenze-cart-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {marketplaceAccountCopy,type MarketplaceLocale} from './marketplace-account-copy';

const copy={en:['Home','Markets','My activity','Manage','Menu','Help','Cart','Business workspace'],fr:['Accueil','Marchés','Mon activité','Gérer','Menu','Aide','Panier','Espace Business'],ln:['Ebandeli','Luka','Misala','Kamba','Menu','Lisalisi','Kitunga','Esika Business'],sw:['Nyumbani','Gundua','Shughuli','Simamia','Menyu','Msaada','Kikapu','Eneo la Business']} as const;
const subscribeHash=(notify:()=>void)=>{window.addEventListener('hashchange',notify);return()=>window.removeEventListener('hashchange',notify);};
export function ShidaNavigation(){
 const hash=useSyncExternalStore(subscribeHash,()=>window.location.hash,()=> '');
 const pathname=usePathname(),query=useSearchParams(),locale=(pathname.match(/^\/(fr|en|ln|sw)(?:\/|$)/)?.[1]||'en') as MarketplaceLocale;
 const prefix=locale==='en'?'':`/${locale}`,base=`${prefix}/shida`,path=pathname.replace(/^\/(fr|en|ln|sw)(?=\/)/,'').replace(/\/$/,''),t=copy[locale],a=accountSpaceCopy[locale];
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),[keyboard,setKeyboard]=useState(false);
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
 const active=path==='/shida/wenze/sell'?3:path==='/shida/register'?4:path==='/shida'?(hash==='#explore'?1:0):personal?(query.get('view')==='management'?3:query.get('view')==='settings'?4:2):1;
 const hrefs=[base,`${base}#explore`,`${base}/space`,`${base}/space?view=management`];
 const icons:SpaceIconName[]=['home','shop','requests','management'];
 const menuLinks=[[a.orders,`${base}/space?view=orders`],[a.requests,`${base}/space?view=requests`],[a.messages,`${base}/space?view=messages`],[a.receipts,`${base}/space?view=receipts`],[a.settings,`${base}/space?view=settings`],[marketplaceAccountCopy[locale].language,`${base}/space?view=settings#space-language`],[t[6],wenzeCartPath(locale)],[t[7],`https://business.nihiloba.com/?lang=${locale}`],[t[5],`${locale==='en'?'/en':'/fr'}/faq`]];
 return <><nav className="shida-navigation" aria-label="SHIDA" data-keyboard={keyboard||undefined}>{hrefs.map((href,index)=><a key={href} href={href} aria-current={active===index?'page':undefined}><SpaceIcon name={icons[index]}/><span>{t[index]}</span></a>)}<button ref={trigger} type="button" aria-haspopup="dialog" aria-controls="shida-menu" aria-current={active===4?'page':undefined} onClick={()=>dialog.current?.showModal()}><SpaceIcon name="menu"/><span>{t[4]}</span></button></nav>
 <dialog id="shida-menu" className="shida-navigation-menu" ref={dialog} aria-labelledby="shida-menu-title" onClose={()=>trigger.current?.focus()}><header><h2 id="shida-menu-title">SHIDA · {t[4]}</h2><button type="button" onClick={()=>dialog.current?.close()}>{a.close}</button></header><nav aria-label={t[4]}>{menuLinks.map(([label,href])=><a href={href} key={label} onClick={()=>dialog.current?.close()}>{label}</a>)}</nav></dialog></>;
}
