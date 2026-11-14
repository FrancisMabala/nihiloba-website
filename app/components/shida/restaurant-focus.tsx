'use client';
import {useEffect,useRef,useState} from 'react';
import {operationsCopy} from '../../lib/restaurant-operations-copy';
import './restaurant-counter-ux.css';
import './restaurant-operations.css';
export function restaurantStart(path:string){try{return localStorage.getItem('shida:restaurant:start:'+path)==='sell'?'sell':'today';}catch{return 'today';}}
export function RestaurantFocus({path,tab,locale,name}:{path:string;tab:string;locale:'fr'|'en'|'ln'|'sw';name:string}){
 const c=operationsCopy[locale],host=useRef<HTMLDivElement>(null),menu=useRef<HTMLDetailsElement>(null);
 const [focus,setFocus]=useState(false),[fallback,setFallback]=useState(false),[pinned,setPinned]=useState(false),[saved,setSaved]=useState(false);
 const screen=['pos','counter'].includes(tab)?'sell':'today';
 useEffect(()=>{const timer=setTimeout(()=>{try{setPinned(localStorage.getItem('shida:restaurant:start:'+path)===screen);}catch{setPinned(false);}},0);return()=>clearTimeout(timer);},[path,screen]);
 useEffect(()=>{const element=host.current?.closest('.rst-management-content,.rst-business-content') as HTMLElement|null;if(!element)return;
  element.classList.toggle('rst-focus-mode',focus);
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){setFocus(false);setFallback(false);if(menu.current)menu.current.open=false;}};
  const exited=()=>{setFocus(document.fullscreenElement===element);setFallback(false);};
  const logout=()=>setFocus(false);
  window.addEventListener('keydown',key);document.addEventListener('fullscreenchange',exited);window.addEventListener('shida-signout',logout);
  return()=>{element.classList.remove('rst-focus-mode');window.removeEventListener('keydown',key);document.removeEventListener('fullscreenchange',exited);window.removeEventListener('shida-signout',logout);};
 },[focus]);
 async function toggle(){if(menu.current)menu.current.open=false;if(focus){setFocus(false);setFallback(false);if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});}else{setFocus(true);const element=host.current?.closest('.rst-management-content,.rst-business-content') as HTMLElement|null;try{if(!element?.requestFullscreen)throw new Error('unsupported');await element.requestFullscreen();}catch{setFallback(true);}}}
 return <><div ref={host} className="rst-focus-toolbar"><strong>{focus?'SHIDA · ':''}{name}</strong><div><button className={focus?'':'rst-desktop-fullscreen'} type="button" aria-pressed={focus} onClick={()=>void toggle()}>{focus?c.exit:c.fullscreen}</button><details ref={menu}><summary aria-label={c.more}>⋮</summary><div>{!focus&&<button className="rst-mobile-fullscreen" onClick={()=>void toggle()}>{c.fullscreen}</button>}{['today','pos','counter'].includes(tab)&&<button type="button" aria-pressed={pinned} onClick={()=>{try{if(pinned)localStorage.removeItem('shida:restaurant:start:'+path);else localStorage.setItem('shida:restaurant:start:'+path,screen);setPinned(!pinned);setSaved(true);if(menu.current)menu.current.open=false;}catch{setSaved(false);}}}>{pinned?c.unpin:c.pin}</button>}</div></details></div></div>{fallback&&<p className="rst-focus-notice" role="status">{c.expanded}</p>}{saved&&<span className="sr-only" role="status">{c.saved}</span>}</>;
}
