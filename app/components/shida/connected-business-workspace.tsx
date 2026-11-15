'use client';
import {useRef,useSyncExternalStore,type ReactNode} from 'react';
import {MarketplaceImage} from './marketplace-image';
import type {MarketplaceLocale} from './marketplace-account-copy';
import './connected-business-workspace.css';
const labels={fr:{menu:'Autres actions',full:'Plein écran',exit:'Quitter le plein écran'},en:{menu:'More actions',full:'Fullscreen',exit:'Exit fullscreen'},ln:{menu:'Misala mosusu',full:'Écran mobimba',exit:'Bima na écran mobimba'},sw:{menu:'Vitendo vingine',full:'Skrini nzima',exit:'Toka skrini nzima'}};
export function BusinessIdentity({name,photo,children}:{name:string;photo?:string|null;children?:ReactNode}){return <div className="business-identity"><span className="business-avatar" aria-hidden="true"><MarketplaceImage src={photo??null} alt="" sizes="40px" fallback={name.split(/\s+/).slice(0,2).map(n=>n[0]).join('').toLocaleUpperCase()}/></span><div><strong>{name}</strong>{children}</div></div>;}
export function BusinessSidebar({identity,children,locale}:{locale:MarketplaceLocale;identity:ReactNode;children:ReactNode;current:string}){
 return <><aside className="connected-sidebar seller-sidebar">{identity}{children}</aside><div className="connected-mobile-bar">{identity}<BusinessFullscreen locale={locale} menu/></div></>;
}
const subscribeFullscreen=(notify:()=>void)=>{document.addEventListener('fullscreenchange',notify);return()=>document.removeEventListener('fullscreenchange',notify);};
export function BusinessFullscreen({locale,menu=false}:{locale:MarketplaceLocale;menu?:boolean}){
 const button=useRef<HTMLButtonElement>(null),actions=useRef<HTMLDetailsElement>(null);
 const supported=useSyncExternalStore(subscribeFullscreen,()=>!!document.fullscreenEnabled,()=>false);
 const active=useSyncExternalStore(subscribeFullscreen,()=>!!document.fullscreenElement,()=>false);
 if(!supported)return null;
 const control=<button className={menu?'business-fullscreen-action':'business-fullscreen'} aria-label={active?labels[locale].exit:labels[locale].full} ref={button} type="button" onClick={async()=>{if(actions.current)actions.current.open=false;try{if(document.fullscreenElement)await document.exitFullscreen();else await button.current?.closest('.connected-workspace')?.requestFullscreen();}catch{/* Browser denial leaves the ordinary page usable. */}if(menu)actions.current?.querySelector('summary')?.focus();}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg><span>{active?labels[locale].exit:labels[locale].full}</span></button>;
 return menu?<details ref={actions} className="business-secondary-actions" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))event.currentTarget.open=false;}} onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}}}><summary aria-label={labels[locale].menu}>⋮</summary><div>{control}</div></details>:control;
}
