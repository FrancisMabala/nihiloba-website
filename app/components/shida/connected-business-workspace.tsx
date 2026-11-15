'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {MarketplaceImage} from './marketplace-image';
import type {MarketplaceLocale} from './marketplace-account-copy';
import './connected-business-workspace.css';
const labels={fr:{menu:'Navigation',full:'Plein écran',exit:'Quitter le plein écran'},en:{menu:'Navigation',full:'Fullscreen',exit:'Exit fullscreen'},ln:{menu:'Navigation',full:'Écran mobimba',exit:'Bima na écran mobimba'},sw:{menu:'Urambazaji',full:'Skrini nzima',exit:'Toka skrini nzima'}};
export function BusinessIdentity({name,photo,children}:{name:string;photo?:string|null;children?:ReactNode}){return <div className="business-identity"><span className="business-avatar" aria-hidden="true"><MarketplaceImage src={photo??null} alt="" sizes="40px" fallback={name.split(/\s+/).slice(0,2).map(n=>n[0]).join('').toLocaleUpperCase()}/></span><div><strong>{name}</strong>{children}</div></div>;}
export function BusinessSidebar({identity,children}:{locale:MarketplaceLocale;identity:ReactNode;children:ReactNode;current:string}){
 return <><aside className="connected-sidebar seller-sidebar">{identity}{children}</aside><div className="connected-mobile-bar">{identity}</div></>;
}
export function BusinessFullscreen({locale}:{locale:MarketplaceLocale}){
 const button=useRef<HTMLButtonElement>(null),[active,setActive]=useState(false);
 useEffect(()=>{const update=()=>setActive(!!document.fullscreenElement);document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update);},[]);
 return <button className="business-fullscreen" aria-label={active?labels[locale].exit:labels[locale].full} title={active?labels[locale].exit:labels[locale].full} ref={button} type="button" onClick={async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await button.current?.closest('.connected-workspace')?.requestFullscreen();}catch{/* Browser may deny fullscreen; the page remains usable. */}}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg><span>{active?labels[locale].exit:labels[locale].full}</span></button>;
}
