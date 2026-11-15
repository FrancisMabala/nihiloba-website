'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {MarketplaceImage} from './marketplace-image';
import {workspaceCopy} from '../../lib/restaurant-workspace-copy';
import type {MarketplaceLocale} from './marketplace-account-copy';
import './connected-business-workspace.css';
const labels={fr:{menu:'Navigation',full:'Plein écran',exit:'Quitter le plein écran'},en:{menu:'Navigation',full:'Fullscreen',exit:'Exit fullscreen'},ln:{menu:'Navigation',full:'Écran mobimba',exit:'Bima na écran mobimba'},sw:{menu:'Urambazaji',full:'Skrini nzima',exit:'Toka skrini nzima'}};
export function BusinessIdentity({name,photo,children}:{name:string;photo?:string|null;children?:ReactNode}){return <div className="business-identity"><span className="business-avatar" aria-hidden="true"><MarketplaceImage src={photo??null} alt="" sizes="40px" fallback={name.split(/\s+/).slice(0,2).map(n=>n[0]).join('').toLocaleUpperCase()}/></span><div><strong>{name}</strong>{children}</div></div>;}
export function BusinessSidebar({locale,identity,children,current}:{locale:MarketplaceLocale;identity:ReactNode;children:ReactNode;current:string}){
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 function close(){if(dialog.current?.open){dialog.current.close();trigger.current?.focus();}}
 useEffect(()=>{if(dialog.current?.open){dialog.current.close();trigger.current?.focus();}},[current]);
 return <><aside className="connected-sidebar seller-sidebar">{identity}{children}</aside><div className="connected-mobile-bar"><button ref={trigger} type="button" aria-label={labels[locale].menu} onClick={()=>dialog.current?.showModal()}>☰</button>{identity}</div><dialog ref={dialog} className="connected-nav-drawer" aria-label={labels[locale].menu} onCancel={e=>{e.preventDefault();close();}}><button type="button" onClick={close}>{workspaceCopy[locale].close}</button>{identity}{children}</dialog></>;
}
export function BusinessFullscreen({locale}:{locale:MarketplaceLocale}){
 const button=useRef<HTMLButtonElement>(null),[active,setActive]=useState(false);
 useEffect(()=>{const update=()=>setActive(!!document.fullscreenElement);document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update);},[]);
 return <button ref={button} type="button" onClick={async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await button.current?.closest('.connected-workspace')?.requestFullscreen();}catch{/* Browser may deny fullscreen; the page remains usable. */}}}>{active?labels[locale].exit:labels[locale].full}</button>;
}
