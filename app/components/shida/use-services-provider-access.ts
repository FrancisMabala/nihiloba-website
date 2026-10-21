"use client";
import {useEffect,useState} from "react";
import {PERSONAL_SESSION_EVENT,restorePersonalSession} from "../../lib/personal-session-browser";
import {servicesProviderAccess,type ServicesProviderAccess} from "../../lib/services-account-navigation";

// Navigation only. Every destination still independently checks current access.
// Undefined binding is used by the account landing page, which restores its own session.
export function useServicesProviderAccess(binding?:string|null) {
 const [result,setResult]=useState<{binding:string;access:ServicesProviderAccess}|null>(null);
 useEffect(()=>{
  let active=true,generation=0,controller:AbortController|null=null;
  async function check(){
   const ticket=++generation;controller?.abort();controller=new AbortController();
   const current=controller,timeout=setTimeout(()=>current.abort(),12000);
   setResult(null);
   try{
    const key=binding===undefined?(await restorePersonalSession(current.signal)).binding:binding;
    if(!key)return;
    const options={credentials:"include" as const,cache:"no-store" as const,signal:current.signal,headers:{Accept:"application/json","X-Shida-Session":key}};
    const responses=await Promise.all([fetch("/api/shida/personal/services",options),fetch("/api/shida/personal/services/capabilities",options)]);
    if(responses.some(response=>!response.ok))throw new Error("unavailable");
    const [profiles,policy]=await Promise.all(responses.map(response=>response.json()));
    if(active&&ticket===generation)setResult({binding:key,access:servicesProviderAccess(profiles?.profiles,policy?.capabilities)});
   }catch{if(active&&ticket===generation)setResult(null);}
   finally{clearTimeout(timeout);}
  }
  const changed=()=>void check(),storage=(event:StorageEvent)=>{if(event.key===PERSONAL_SESSION_EVENT)changed();};
  const visible=()=>{if(!document.hidden)changed();};
  const offline=()=>{++generation;controller?.abort();setResult(null);};
  queueMicrotask(()=>{if(active)void check();});
  window.addEventListener(PERSONAL_SESSION_EVENT,changed);window.addEventListener("storage",storage);
  window.addEventListener("focus",changed);window.addEventListener("online",changed);window.addEventListener("offline",offline);document.addEventListener("visibilitychange",visible);
  return()=>{active=false;++generation;controller?.abort();window.removeEventListener(PERSONAL_SESSION_EVENT,changed);window.removeEventListener("storage",storage);window.removeEventListener("focus",changed);window.removeEventListener("online",changed);window.removeEventListener("offline",offline);document.removeEventListener("visibilitychange",visible);};
 },[binding]);
 return result&&(binding===undefined||binding===result.binding)?result.access:"unavailable";
}
