'use client';
import {useEffect,useRef,useState} from 'react';
import {counterCopy} from '../../lib/restaurant-counter-copy';
import './restaurant-counter-ux.css';
export function restaurantStart(path:string){try{return localStorage.getItem('shida:restaurant:start:'+path)==='sell'?'sell':'today';}catch{return 'today';}}
export function RestaurantFocus({path,tab,locale,name}:{path:string;tab:string;locale:'fr'|'en'|'ln'|'sw';name:string}){
 const c=counterCopy(locale),host=useRef<HTMLDivElement>(null);
 const [focus,setFocus]=useState(false),[pinned,setPinned]=useState(false);
 const screen=['pos','counter'].includes(tab)?'sell':'today';
 useEffect(()=>{const timer=setTimeout(()=>{try{setPinned(localStorage.getItem('shida:restaurant:start:'+path)===screen);}catch{setPinned(false);}},0);return()=>clearTimeout(timer);},[path,screen]);
 useEffect(()=>{const element=host.current?.closest('.rst-management-content,.rst-business-content') as HTMLElement|null;if(!element)return;
  element.classList.toggle('rst-focus-mode',focus);
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setFocus(false);};
  const exited=()=>{if(!document.fullscreenElement)setFocus(false);};
  const logout=()=>setFocus(false);
  window.addEventListener('keydown',key);document.addEventListener('fullscreenchange',exited);window.addEventListener('shida-signout',logout);
  return()=>{element.classList.remove('rst-focus-mode');window.removeEventListener('keydown',key);document.removeEventListener('fullscreenchange',exited);window.removeEventListener('shida-signout',logout);};
 },[focus]);
 async function toggle(){if(focus){setFocus(false);if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});}else{setFocus(true);const element=host.current?.closest('.rst-management-content,.rst-business-content') as HTMLElement|null;try{await element?.requestFullscreen?.();}catch{/* The expanded workspace remains available where native fullscreen is unsupported. */}}}
 return <div ref={host} className="rst-focus-toolbar"><strong>{focus?'SHIDA · ':''}{name}</strong><div>{['today','pos','counter'].includes(tab)&&<button type="button" aria-pressed={pinned} onClick={()=>{try{if(pinned)localStorage.removeItem('shida:restaurant:start:'+path);else localStorage.setItem('shida:restaurant:start:'+path,screen);setPinned(!pinned);}catch{/* Preference is optional; no order data is stored. */}}}>{pinned?'◆ '+c.pinned:c.pin}</button>}<button type="button" aria-pressed={focus} onClick={()=>void toggle()}>{focus?c.exit:c.fullscreen}</button></div></div>;
}
