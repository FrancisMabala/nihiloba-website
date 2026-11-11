'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {jobSearchCopy,jobSearchPath,type JobSearchSection} from '../../lib/job-search-copy';
import {jobOverviewCopy} from '../../lib/job-overview-copy';
import {JobSearchError,jobSearchRequest,JOB_PREVIEW_LIMIT,type JobSearchItem,type JobSearchList} from '../../lib/job-search-api';
import {loadCandidateApplications} from '../../services/shida/employment-browser-client';
import {candidateApplicationPath,candidateStatusLabel} from './candidate-employment';
import {SpaceIcon} from './account-space-icon';
import {MarketplaceImage} from './marketplace-image';

type Locale=keyof typeof jobOverviewCopy;
type Profiles={profiles:{type:string;archived:boolean;reference:string}[];progress:{profile_type:string;state:string;public_ref:string}[]};

function useSection<T>(read:(signal:AbortSignal)=>Promise<T>,unauthorized:()=>void,revision:number){
 const [data,setData]=useState<T|null>(null),[failed,setFailed]=useState(false),[version,setVersion]=useState(0);
 const latest=useRef({read,unauthorized});useEffect(()=>{latest.current={read,unauthorized};});
 useEffect(()=>{
  const controller=new AbortController();
  latest.current.read(controller.signal).then(value=>{
   if(!controller.signal.aborted){setData(value);setFailed(false);}
  },err=>{
   if(controller.signal.aborted)return;
   if(err?.status===401)latest.current.unauthorized();
   else {setData(null);setFailed(true);}
  });
  return ()=>controller.abort();
 },[revision,version]);
 return {data,failed,retry:()=>{setFailed(false);setVersion(v=>v+1);}};
}

export function JobOverview({locale,binding,destination,unauthorized,revision}:{locale:Locale;binding:string;destination:(item:JobSearchItem)=>string;unauthorized:()=>void;revision:number}){
 const t=jobSearchCopy[locale],u=jobOverviewCopy[locale];
 const saved=useSection(s=>jobSearchRequest<JobSearchList>(binding,locale,'saved?preview=1','GET',undefined,s),unauthorized,revision);
 const follows=useSection(s=>jobSearchRequest<JobSearchList>(binding,locale,'following?preview=1','GET',undefined,s),unauthorized,revision);
 const apps=useSection(loadCandidateApplications,unauthorized,revision);
 const profiles=useSection(async signal=>{
  const r=await fetch('/api/shida/personal/candidate?language='+locale,{headers:{'X-Shida-Session':binding},credentials:'same-origin',cache:'no-store',signal});
  if(!r.ok)throw new JobSearchError(r.status);return await r.json() as Profiles;
 },unauthorized,revision);
 const path=(section:JobSearchSection)=>jobSearchPath(locale,section);
 function panel<T>(title:string,state:ReturnType<typeof useSection<T>>,render:(d:T)=>ReactNode,more?:JobSearchSection){
  return <section className="search-panel"><header><h2>{title}</h2>{more&&<a href={path(more)} aria-label={title+' — '+u.all}>{u.all} →</a>}</header>
   {state.failed?<div role="alert">{t.error} <button onClick={state.retry}>{t.retry}</button></div>:state.data===null?<p role="status">{t.loading}</p>:render(state.data)}</section>;
 }
 const plural=new Intl.PluralRules(locale),fmt=new Intl.NumberFormat(locale);
 return <>
  <div className="activities-summary search-counts">{([['saved',saved.data?.total,'bookmark',''],['applications',apps.data?.length,'requests','summary-blue'],['following',follows.data?.total,'business','summary-amber']] as const).map(([key,n,icon,tint],i)=>
   <a key={key} className={tint} href={path(key)}><SpaceIcon name={icon}/><span><strong>{n===undefined?'—':fmt.format(n)}</strong><small>{u.counts[i][n!==undefined&&plural.select(n)==='one'?0:1]}</small></span></a>)}</div>
  <div className="search-panels">
   {panel(t.saved,saved,list=>list.items.length?list.items.slice(0,JOB_PREVIEW_LIMIT).map(item=>{
    if(!item.available||!item.reference)return <p key={item.relation_ref}>{t.unavailable}</p>;
    const status=item.status==='open'?u.open:item.status==='expired'?t.expired:item.status==='closed'||item.status==='archived'?u.closed:t.unavailable;
    return <article className="search-row" key={item.relation_ref}><div><strong>{item.name}</strong><small>{[item.employer_name,item.location].filter(Boolean).join(' · ')}</small></div>
     <div className="search-badges">{item.origin&&<span>{item.origin==='external'?t.external:u.direct}</span>}<span data-open={item.status==='open'}>{status}</span></div>
     <a className="search-end" href={destination(item)}>{t.open} →</a></article>;
   }):<p>{t.emptySaved}</p>,(saved.data?.total??0)>JOB_PREVIEW_LIMIT?'saved':undefined)}
   {panel(u.recent,apps,list=>list.length?[...list].sort((a,b)=>(b.created_at??'').localeCompare(a.created_at??'')).slice(0,JOB_PREVIEW_LIMIT).map(a=>
    <article className="search-row" key={a.reference}><div><strong>{a.job_title}</strong><small>{[a.employer_name,candidateStatusLabel(locale,a.status)].filter(Boolean).join(' · ')}</small></div>
     <a className="search-end" href={candidateApplicationPath(locale,a.reference)}>{u.track} →</a></article>):<p>{u.emptyApplications}</p>,(apps.data?.length??0)>JOB_PREVIEW_LIMIT?'applications':undefined)}
   {panel(t.profiles,profiles,d=>(['professional','occasional_work'] as const).map(kind=>{
    const profile=d.profiles.find(v=>v.type===kind&&!v.archived),draft=d.progress.find(v=>v.profile_type===kind&&['active','expired'].includes(v.state));
    const query=new URLSearchParams({profile:kind});const ref=profile?.reference||draft?.public_ref;if(ref)query.set('record',ref);
    return <a className="search-profile-row" key={kind} href={path('profiles')+'&'+query}>{u[kind][profile?2:draft?1:0]} <span aria-hidden="true">›</span></a>;
   }))}
   {panel(t.following,follows,list=>list.items.length?list.items.slice(0,JOB_PREVIEW_LIMIT).map(item=>!item.available||!item.reference?<p key={item.relation_ref}>{t.unavailable}</p>:
    <article className="search-row" key={item.relation_ref}><div className="search-org"><span className="search-avatar" aria-hidden="true"><MarketplaceImage src={item.logo??null} alt="" fallback={Array.from(item.name?.trim()||'')[0]?.toLocaleUpperCase(locale)||'•'} sizes="40px"/></span><strong>{item.name}</strong></div>
     <a className="search-end" href={destination(item)}>{t.organisation} →</a></article>):<p>{t.emptyFollowing}</p>,(follows.data?.total??0)>JOB_PREVIEW_LIMIT?'following':undefined)}
  </div></>;
}
