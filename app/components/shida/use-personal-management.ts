'use client';
import {useEffect,useState} from 'react';
import {PERSONAL_SESSION_EVENT,restorePersonalSession} from '../../lib/personal-session-browser';
export type ManagementOverview={can_manage:boolean;markets:string[];organization_management:boolean};
// No identity data is persisted. Focus, account changes and visible polling all
// recheck current backend authority; stale account responses cannot restore links.
export function usePersonalManagement(){
 const [overview,setOverview]=useState<ManagementOverview|null>(null);
 useEffect(()=>{
  let alive=true,generation=0,controller:AbortController|undefined;
  const load=async(clear=false)=>{const ticket=++generation;controller?.abort();controller=new AbortController();const signal=controller.signal;if(clear)setOverview(null);
   try{const session=await restorePersonalSession(signal);if(!session){if(alive&&ticket===generation)setOverview(null);return;}const result=await fetch('/api/shida/personal/security/navigation/',{cache:'no-store',headers:{'x-shida-session':session.binding},signal});if(!result.ok)throw Error();const data=await result.json();if(alive&&ticket===generation)setOverview(data);}
   catch{if(alive&&ticket===generation)setOverview(null);}
  };
  const reset=()=>void load(true),refresh=()=>{if(!document.hidden)void load();},storage=(event:StorageEvent)=>{if(event.key===PERSONAL_SESSION_EVENT)reset();};
  reset();const timer=setInterval(refresh,30000);window.addEventListener(PERSONAL_SESSION_EVENT,reset);window.addEventListener('storage',storage);window.addEventListener('focus',refresh);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{alive=false;++generation;controller?.abort();clearInterval(timer);window.removeEventListener(PERSONAL_SESSION_EVENT,reset);window.removeEventListener('storage',storage);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[]);
 return overview;
}
