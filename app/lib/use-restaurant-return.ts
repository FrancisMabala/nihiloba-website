'use client';
import { useEffect, useEffectEvent, useRef } from 'react';

// Restaurant reads only. Never retries a mutation or replaces its envelope.
export function useRestaurantReturn(scope:string,busy:boolean,refresh:()=>Promise<unknown>,invalidate:(at:number)=>void,interval=0) {
 const queued=useRef(false),generation=useRef(0),running=useRef(false);
 const kick=useRef<()=>void>(()=>{});
 const stale=useEffectEvent(invalidate);
 const read=useEffectEvent(async()=>{
  if(busy||running.current||document.hidden||!navigator.onLine)return;
  queued.current=false;running.current=true;const version=generation.current;
  try {await refresh();} finally {
   running.current=false;
   if(version!==generation.current||document.hidden||!navigator.onLine)stale(Date.now());
   if(queued.current)kick.current();
  }
 });
 useEffect(()=>{
  let alive=true,timer:ReturnType<typeof setTimeout>;
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(alive&&queued.current)void read();},80);};
  const invalidateOnly=()=>{generation.current++;queued.current=true;stale(Date.now());};
  const resume=()=>{invalidateOnly();schedule();};
  kick.current=schedule;
  window.addEventListener('blur',invalidateOnly);window.addEventListener('focus',resume);
  window.addEventListener('online',resume);window.addEventListener('offline',resume);
  window.addEventListener('pageshow',resume);document.addEventListener('visibilitychange',resume);
  const clock=interval?setInterval(resume,interval):undefined;
  resume();
  return()=>{alive=false;queued.current=false;clearTimeout(timer);clearInterval(clock);kick.current=()=>{};
   window.removeEventListener('blur',invalidateOnly);window.removeEventListener('focus',resume);
   window.removeEventListener('online',resume);window.removeEventListener('offline',resume);
   window.removeEventListener('pageshow',resume);document.removeEventListener('visibilitychange',resume);
  };
 },[scope,interval]);
 useEffect(()=>{if(!busy&&queued.current)kick.current();},[busy]);
}
