"use client";
import {useEffect,useRef,useState} from 'react';
import type {RegistrationLocale} from '../../lib/registration/copy';
import {locationCopy} from '../../lib/registration/location-copy';
type Country={code:string;name:string};
export function RegistrationCountry({id,value,onChange,locale,required=false}:{id:string;value:string;onChange:(value:string)=>void;locale:RegistrationLocale;required?:boolean}){
 const t=locationCopy[locale];
 const [query,setQuery]=useState(value),[items,setItems]=useState<Country[]>([]),[failed,setFailed]=useState(false),[pending,setPending]=useState(false),[busy,setBusy]=useState(false),[attempt,setAttempt]=useState(0),[editing,setEditing]=useState(false);
 const input=useRef<HTMLInputElement>(null);useEffect(()=>{input.current?.setCustomValidity(required&&!value?t.search:"");},[required,value,t.search]);
 const selected=useRef(value),changed=useRef(onChange);useEffect(()=>{changed.current=onChange;},[onChange]);
 useEffect(()=>{if(value!==selected.current){selected.current=value;queueMicrotask(()=>{setQuery(value);setEditing(false);});}},[value]);
 useEffect(()=>{
  const abort=new AbortController();const timer=setTimeout(()=>{
   void fetch(`/api/shida/registration-reference/?${new URLSearchParams({language:locale,q:editing?query:value})}`,{cache:'no-store',signal:abort.signal}).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(data=>{
    if(abort.signal.aborted)return;if(!Array.isArray(data.items))throw Error();setItems(data.items);setFailed(false);
    const match=data.items.find((item:Country)=>item.code===(editing?data.matched_code:value));
    if(match){selected.current=match.code;changed.current(match.code);setQuery(match.name);setEditing(false);}
   }).catch(()=>{if(!abort.signal.aborted)setFailed(true);});
  },editing?180:0);return()=>{clearTimeout(timer);abort.abort();};
 },[locale,query,value,editing,attempt]);
 async function suggest(){if(busy||query.trim().length<2)return;setBusy(true);try{
  const response=await fetch('/api/shida/registration-reference/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:query}),cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();
  if(data.matched_code){changed.current(data.matched_code);selected.current=data.matched_code;setEditing(false);}else setPending(true);
 }catch{setFailed(true);}finally{setBusy(false);}}
 return <div className="registration-country"><input ref={input} id={id} autoComplete="country-name" maxLength={150} placeholder={t.search} value={query} required={required} aria-describedby={`${id}-help`} onChange={event=>{setQuery(event.target.value);setEditing(true);setPending(false);selected.current='';changed.current('');}}/>
 {editing&&!failed&&<ul aria-label={t.country}>{items.length===0&&query.trim()&&<li className="registration-country-empty" role="status">{t.empty}</li>}{items.map(item=><li key={item.code}><button type="button" onClick={()=>{selected.current=item.code;changed.current(item.code);setQuery(item.name);setEditing(false);}}>{item.name}</button></li>)}</ul>}
 <small id={`${id}-help`}>{pending?t.pending:failed?t.failed:''}</small>{failed&&<button type="button" onClick={()=>setAttempt(attempt+1)}>{t.retry}</button>}
 {editing&&!value&&query.trim().length>=2&&<details><summary>{t.missing}</summary><button type="button" disabled={busy||pending} onClick={()=>void suggest()}>{t.suggest}</button></details>}
 </div>;
}
