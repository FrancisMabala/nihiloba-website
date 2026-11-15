import {useEffect,useRef,useState} from 'react';
import {LOGIN_EVENT} from './personal-login-browser';
import {PERSONAL_SESSION_EVENT} from './personal-session-browser';
export type HelpDraft={message:string;key:string};
const prefix='shida-help-draft-v1:',ttl=24*60*60*1000;
// Tab-scoped drafts only. Never persist the session binding, account identity or history.
export function useHelpDrafts(binding:string){
 const [drafts,setDrafts]=useState<Record<string,HelpDraft>>({}),[ready,setReady]=useState(false),[unavailable,setUnavailable]=useState(false);
 const storageKey=useRef('');
 useEffect(()=>{let active=true;
  const clear=()=>{try{for(const key of Object.keys(sessionStorage))if(key.startsWith(prefix))sessionStorage.removeItem(key);}catch{}if(active)setDrafts({});};
  const changed=(event:StorageEvent)=>{if([LOGIN_EVENT,PERSONAL_SESSION_EVENT].includes(event.key??''))clear();};
  window.addEventListener(LOGIN_EVENT,clear);window.addEventListener(PERSONAL_SESSION_EVENT,clear);window.addEventListener('storage',changed);
  void crypto.subtle.digest('SHA-256',new TextEncoder().encode(binding)).then(digest=>{
   if(!active)return;const key=prefix+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');storageKey.current=key;
   try{for(const other of Object.keys(sessionStorage))if(other.startsWith(prefix)&&other!==key)sessionStorage.removeItem(other);
    const saved=JSON.parse(sessionStorage.getItem(key)||'null'),valid:Record<string,HelpDraft>={};
    if(saved?.until>Date.now()&&saved.until<=Date.now()+ttl&&saved.drafts&&typeof saved.drafts==='object')for(const [id,value]of Object.entries(saved.drafts)){
     const draft=value as HelpDraft;if(/^SCT_[A-Za-z0-9_-]{1,100}$/.test(id)&&typeof draft?.message==='string'&&draft.message.length<=4000&&typeof draft.key==='string'&&/^[a-f0-9-]{36}$/.test(draft.key))valid[id]=draft;
    }setDrafts(valid);
   }catch{setUnavailable(true);}setReady(true);
  }).catch(()=>{if(active){setUnavailable(true);setReady(true);}});
  return()=>{active=false;window.removeEventListener(LOGIN_EVENT,clear);window.removeEventListener(PERSONAL_SESSION_EVENT,clear);window.removeEventListener('storage',changed);};
 },[binding]);
 useEffect(()=>{if(!ready||!storageKey.current)return;let active=true;try{const values=Object.fromEntries(Object.entries(drafts).filter(([id,draft])=>id!=='new'&&draft.message));if(Object.keys(values).length)sessionStorage.setItem(storageKey.current,JSON.stringify({until:Date.now()+ttl,drafts:values}));else sessionStorage.removeItem(storageKey.current);}catch{queueMicrotask(()=>{if(active)setUnavailable(true);});}return()=>{active=false;};},[drafts,ready]);
 return {drafts,setDrafts,ready,unavailable};
}
