"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import type {ServiceLocale} from "../../lib/services-i18n";
import type {PublicJob,PublicJobSummary} from "../../types/shida-public";
import {restorePersonalSession,PersonalSessionError,PERSONAL_SESSION_EVENT} from "../../lib/personal-session-browser";
import {JobDetailContent,JobUnavailable,copy} from "./job-presentation";
import {JobAccess} from "./job-access";
import {LOGIN_EVENT} from "../../lib/personal-login-browser";

export function JobDetailPage({locale,slug,embedded=false,preview}:{locale:ServiceLocale;slug:string;embedded?:boolean;preview?:ReactNode}){
  const [result,setResult]=useState<{item:PublicJob;similar:PublicJobSummary[]}|null>(null);
  const [status,setStatus]=useState(0),[attempt,setAttempt]=useState(0);
  const region=useRef<HTMLDivElement>(null),retryFocus=useRef(false);
  useEffect(()=>{if(embedded&&retryFocus.current&&(result||status)){region.current?.focus({preventScroll:true});retryFocus.current=false;}},[embedded,result,status]);
  useEffect(()=>{
    let controller:AbortController;
    const list=(locale==="en"?"":"/"+locale)+"/shida/emplois/";
    async function load(){
      controller?.abort();const active=new AbortController();controller=active;
      setResult(null);setStatus(0);
      try{
        await restorePersonalSession(active.signal);
        const response=await fetch(`/api/shida/public-jobs/${encodeURIComponent(slug)}/full/?language=${locale}`,{signal:active.signal,cache:"no-store"});
        if(!response.ok)throw new PersonalSessionError(response.status);
        const data=await response.json();
        if(!active.signal.aborted)setResult(data);
      }catch(e){
        if(active.signal.aborted)return;
        const code=e instanceof PersonalSessionError?e.status:503;
        if((code===401||code===403)&&!embedded){window.location.replace(list+"?offer="+encodeURIComponent(slug));return;}
        setStatus(code);
      }
    }
    const refresh=()=>{void load();};
    // Never leave member-only text visible while another login is in progress.
    const clear=()=>{controller?.abort();setResult(null);setStatus(401);};
    const storage=(e:StorageEvent)=>{if(e.key===PERSONAL_SESSION_EVENT||e.key===null)refresh();else if(e.key===LOGIN_EVENT)clear();};
    const restore=(e:PageTransitionEvent)=>{if(e.persisted)refresh();};
    refresh();window.addEventListener(PERSONAL_SESSION_EVENT,refresh);window.addEventListener(LOGIN_EVENT,clear);window.addEventListener("storage",storage);window.addEventListener("pageshow",restore);
    return ()=>{controller?.abort();window.removeEventListener(PERSONAL_SESSION_EVENT,refresh);window.removeEventListener(LOGIN_EVENT,clear);window.removeEventListener("storage",storage);window.removeEventListener("pageshow",restore);};
  },[locale,slug,attempt,embedded]);
  if(embedded){
    return <div ref={region} className="job-pane-reader" tabIndex={-1} aria-label={copy[locale].details}>
      {result?<JobDetailContent locale={locale} {...result} embedded/>:status===404?<p role="status">{copy[locale].jobUnavailable}</p>:<>{preview}{status!==0&&status!==401&&status!==403&&<div className="job-pane-error"><p role="alert">{copy[locale].unavailable}</p><button className="button button-secondary" onClick={()=>{retryFocus.current=true;setAttempt(n=>n+1);}}>{copy[locale].retry}</button></div>}</>}
    </div>;
  }
  if(status===404)return <JobUnavailable locale={locale}/>;
  if(status)return <section className="section container"><p role="alert">{copy[locale].unavailable}</p><button onClick={()=>setAttempt(n=>n+1)}>{copy[locale].retry}</button></section>;
  return result?<JobAccess locale={locale}><JobDetailContent locale={locale} {...result}/></JobAccess>:<div aria-busy="true" className="section container">…</div>;
}
