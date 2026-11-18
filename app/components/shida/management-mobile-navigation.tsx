"use client";
import {useEffect,useId,useRef,useState,type ReactNode} from "react";
import {ShopIcon} from './wenze-shop-icons';
import {SellerWorkspaceIcon} from "./services-workspace-icon";
import "./management-mobile-navigation.css";

export type MobileDestination={key:string;label:string;shortLabel?:string;href?:string;active?:boolean};
const words={fr:{more:"Plus",close:"Fermer",navigation:"Navigation de l’activité"},en:{more:"More",close:"Close",navigation:"Activity navigation"},ln:{more:"Mosusu",close:"Kanga",navigation:"Navigation ya mosala"},sw:{more:"Zaidi",close:"Funga",navigation:"Urambazaji wa shughuli"}};
function DestinationIcon({name}:{name:string}) {
 if(name==='available')return <ShopIcon name="search"/>;
 if(name==='services')return <SellerWorkspaceIcon name="catalog"/>;
 if(name==='pos'||name==='counter')return <ShopIcon name="shop"/>;
 if(name==='shop')return <ShopIcon name="shop"/>;
 const icon=/today|overview/.test(name)?'overview':/order|work|application/.test(name)?'work':/catalog|inventory|stock|product/.test(name)?'stock':/money|finance|daily|report/.test(name)?'finance':/calendar|agenda|reservation/.test(name)?'calendar':/item|menu|offering/.test(name)?'catalog':/shop|activity|profile|team|candidate/.test(name)?'profile':'settings';
 return <SellerWorkspaceIcon name={icon}/>;
}
function MoreHorizontal(){return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="20" cy="12" r="2"/></svg>;}
function X(){return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M18 6 6 18"/></svg>;}
export function ManagementMobileNavigation({locale,items,current,primary,onNavigate,disabled=false,extra,identity,variant}:{locale:keyof typeof words;items:MobileDestination[];current?:string;primary:string[];onNavigate:(key:string)=>void|boolean|Promise<void|boolean>;disabled?:boolean;extra?:ReactNode;identity?:ReactNode;variant?:"services"}) {
 const copy=words[locale],id=useId(),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),nav=useRef<HTMLElement>(null),lock=useRef(false);
 const [slots,setSlots]=useState(5);
 const [keyboard,setKeyboard]=useState(false),[busy,setBusy]=useState(false),[open,setOpen]=useState(false);
 const available=primary.map(key=>items.find(item=>item.key===key)).filter((item):item is MobileDestination=>!!item);
 const needsMore=!!extra||items.some(item=>!primary.includes(item.key));
 const capacity=variant==="services"?4:slots;
 const main=available.slice(0,needsMore||available.length>capacity?capacity-1:capacity),remaining=items.filter(item=>!main.some(p=>p.key===item.key));
 const more=!!extra||remaining.length>0;
 const sizingLabels=available.map(item=>item.shortLabel??item.label).concat(copy.more).join(' ');
 useEffect(()=>{
  const element=nav.current;if(!element)return;
  const canvas=document.createElement('canvas');
  const measure=()=>{
   const button=element.querySelector('button');if(!button||!element.clientWidth)return;const context=canvas.getContext('2d');if(!context)return;
   const font=getComputedStyle(button),box=getComputedStyle(element);context.font=`${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
   const word=Math.max(...sizingLabels.split(/\s+/).map(label=>context.measureText(label).width));
   const width=element.clientWidth-parseFloat(box.paddingLeft)-parseFloat(box.paddingRight);
   setSlots(Math.max(2,Math.min(5,Math.floor((width+2)/(Math.ceil(word)+10)))));
  };
  const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(measure):null;observer?.observe(element);measure();document.fonts?.ready.then(measure);
  return()=>observer?.disconnect();
 },[sizingLabels]);
 function close(){dialog.current?.close();}
 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=previous;};},[open]);
 async function choose(key:string){if(disabled||lock.current)return;lock.current=true;setBusy(true);try{if(await onNavigate(key)!==false)close();}finally{lock.current=false;setBusy(false);}}
 useEffect(()=>{
   const element=nav.current;if(!element)return;
   const measure=()=>document.documentElement.style.setProperty("--management-nav-space",`${element.getBoundingClientRect().height}px`);
   const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(measure):null;observer?.observe(element);measure();
   return()=>{observer?.disconnect();document.documentElement.style.removeProperty("--management-nav-space");};
 },[]);
 useEffect(()=>{
   const viewport=window.visualViewport;
   const update=()=>{const input=document.activeElement?.matches('input,textarea,[contenteditable="true"]');setKeyboard(!!input&&!!viewport&&viewport.height<window.innerHeight*.75);};
   viewport?.addEventListener("resize",update);document.addEventListener("focusin",update);document.addEventListener("focusout",update);
   return()=>{viewport?.removeEventListener("resize",update);document.removeEventListener("focusin",update);document.removeEventListener("focusout",update);};
 },[]);
 useEffect(()=>{const query=window.matchMedia("(min-width: 1024px)");const changed=()=>{if(query.matches)dialog.current?.close();};query.addEventListener("change",changed);return()=>query.removeEventListener("change",changed);},[]);
 const selected=(item:MobileDestination)=>item.active||current===item.key;
 if(!items.length&&!extra)return null;
 return <>
   <nav ref={nav} className={`management-mobile-nav ${variant==="services"?"management-services-nav":""}`} data-keyboard={keyboard||undefined} aria-label={copy.navigation} style={{gridTemplateColumns:`repeat(${variant==="services"&&slots<4?2:main.length+(more?1:0)},minmax(0,1fr))`}}>
     {main.map(item=><button type="button" key={item.key} disabled={disabled||busy} aria-label={item.label} aria-current={selected(item)?"page":undefined} onClick={()=>void choose(item.key)}><DestinationIcon name={item.key}/><span>{item.shortLabel??item.label}</span></button>)}
     {more&&<button ref={trigger} type="button" disabled={disabled||busy} aria-haspopup="dialog" aria-controls={id} aria-current={remaining.some(selected)?"page":undefined} onClick={()=>{dialog.current?.showModal();setOpen(true);}}><MoreHorizontal/><span>{copy.more}</span></button>}
   </nav>
   <dialog ref={dialog} id={id} className={`management-more-sheet ${variant==="services"?"management-services-sheet":""}`} aria-labelledby={`${id}-title`} onClose={()=>{setOpen(false);requestAnimationFrame(()=>trigger.current?.focus());}} onClick={event=>{if(event.target===dialog.current)close();}}>
     <div className="management-sheet-content"><header><h2 id={`${id}-title`}>{copy.more}</h2><button type="button" aria-label={copy.close} onClick={close}><X/></button></header>{identity}
       <nav aria-label={copy.navigation}>{remaining.map(item=><button type="button" key={item.key} aria-label={item.label} disabled={disabled||busy} aria-current={selected(item)?"page":undefined} onClick={()=>void choose(item.key)}><DestinationIcon name={item.key}/><span>{item.label}</span></button>)}</nav>{extra}
     </div>
   </dialog>
 </>;
}
