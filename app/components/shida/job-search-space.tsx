'use client';
import {useEffect,useRef,useState} from 'react';
import {jobSearchCopy,jobSearchPath,jobSearchSections,type JobSearchSection} from '../../lib/job-search-copy';
import {jobSearchRequest,JobSearchError,type JobSearchList,type JobAlerts,type JobSearchItem} from '../../lib/job-search-api';
import {loadCandidateApplications,EmploymentBrowserError} from '../../services/shida/employment-browser-client';
import type {CandidateApplication} from '../../types/shida-employment';
import {CandidateApplicationsView} from './candidate-employment';
import {CandidateProfileSpace} from './candidate-profile-space';
import {leaveWork} from '../../lib/wenze-work';
import {useConfirmation} from './confirmation-dialog';
import './candidate-profile-space.css';

type JobSearchSpaceProps={locale:keyof typeof jobSearchCopy;binding:string;initialSection?:string;onUnauthorized:()=>void};
export function JobSearchSpace(props:JobSearchSpaceProps){
 return <JobSearchContents key={`${props.binding}:${props.locale}:${props.initialSection}`} {...props}/>;
}
function JobSearchContents({locale,binding,initialSection='overview',onUnauthorized}:JobSearchSpaceProps){
 const t=jobSearchCopy[locale],prefix=locale==='en'?'':`/${locale}`;
 const section:JobSearchSection=jobSearchSections.includes(initialSection as JobSearchSection)?initialSection as JobSearchSection:'overview';
 const [list,setList]=useState<JobSearchList|null>(null),[applications,setApplications]=useState<CandidateApplication[]|null>(null),[alerts,setAlerts]=useState<JobAlerts|null>(null);
 const [page,setPage]=useState(1),[revision,setRevision]=useState(0),[error,setError]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const lock=useRef(false),alive=useRef(false),unauthorized=useRef(onUnauthorized);
 const {request:confirm,confirmation}=useConfirmation(locale);
 useEffect(()=>{unauthorized.current=onUnauthorized;},[onUnauthorized]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  async function load(){
   try{
    if(section==='saved'||section==='following'||section==='alerts'){
     const [items,preferences]=await Promise.all([jobSearchRequest<JobSearchList>(binding,locale,`${section==='saved'?'saved':'following'}?page=${page}`,'GET',undefined,controller.signal),section==='alerts'?jobSearchRequest<JobAlerts>(binding,locale,'alerts','GET',undefined,controller.signal):null]);
     if(active){setList(items);setAlerts(preferences);}
    }else if(section==='applications'){
     const items=await loadCandidateApplications();if(active)setApplications(items);
    }
   }catch(e){if(active){if((e instanceof JobSearchError||e instanceof EmploymentBrowserError)&&e.status===401)unauthorized.current();else setError(true);}}
  }
  void load();
  return()=>{active=false;controller.abort();};
 },[binding,locale,section,page,revision]);
 function reload(){setList(null);setApplications(null);setAlerts(null);setError(false);setRevision(v=>v+1);}
 async function mutate(path:string,method:string,body?:unknown){
  if(lock.current)return;lock.current=true;setBusy(true);setError(false);setNotice('');
  try{await jobSearchRequest(binding,locale,path,method,body);if(alive.current){setNotice(t.updated);reload();}}
  catch(e){if(alive.current){if(e instanceof JobSearchError&&e.status===401)unauthorized.current();else setError(true);}throw e;}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 function remove(item:JobSearchItem){confirm({title:section==='saved'?t.remove:t.unfollow,description:item.name||t.unavailable,confirmLabel:section==='saved'?t.remove:t.unfollow,cancelLabel:t.cancel,onConfirm:()=>mutate(`relations/${item.relation_ref}`,'DELETE')});}
 const destination=(item:JobSearchItem)=>`${prefix}/shida/${item.kind==='job'?'emplois':item.kind==='company'?'businesses':'emplois/employeurs'}/${encodeURIComponent(item.reference!)}`;
 const loading=['saved','following','alerts'].includes(section)?!list:section==='applications'?!applications:false;
 return <section className="candidate-workspace job-search-workspace" aria-busy={busy}>
  {confirmation}
  <nav className="candidate-actions" aria-label={t.title}>{jobSearchSections.map(key=><a key={key} href={jobSearchPath(locale,key)} aria-current={section===key?'page':undefined} onClick={async e=>{e.preventDefault();const href=e.currentTarget.href;if(await leaveWork())window.location.assign(href);}}>{t[key]}</a>)}</nav>
  <h2>{t[section]}</h2>
  {notice&&<p role="status">{notice}</p>}
  {error&&<div role="alert"><p>{t.error}</p><button onClick={reload} disabled={busy}>{t.retry}</button></div>}
  {loading&&!error&&<p role="status">{t.loading}</p>}
  {section==='overview'&&<><p>{t.intro}</p><div className="space-destinations">{jobSearchSections.filter(k=>k!=='overview').map(key=><a key={key} href={jobSearchPath(locale,key)}>{t[key]} →</a>)}</div><p>{t.optIn}</p><a href={`${prefix}/shida/emplois`}>{t.browse}</a></>}
  {section==='profiles'&&<CandidateProfileSpace locale={locale} binding={binding} onUnauthorized={onUnauthorized}/>}
  {section==='applications'&&<><p>{t.directApplications}</p><p>{t.externalGap}</p>{applications&&<CandidateApplicationsView locale={locale} applications={applications}/>}</>}
  {section==='alerts'&&alerts&&<section className="candidate-private-panel"><h3>{t.matching}</h3><p>{t.matchingHelp}</p>{alerts.profile_count?<><p>{alerts.enabled_count===0?t.disabled:alerts.enabled_count===alerts.profile_count?t.enabled:t.mixed}</p><button disabled={busy} onClick={()=>void mutate('alerts','PUT',{enabled:alerts.enabled_count!==alerts.profile_count}).catch(()=>{})}>{alerts.enabled_count===alerts.profile_count?t.disable:t.enable}</button></>:<><p>{t.needProfile}</p><a href={jobSearchPath(locale,'profiles')}>{t.profiles}</a></>}<p>{t.alertGap}</p></section>}
  {section==='alerts'&&<><h3>{t.employerAlerts}</h3><p>{t.optIn}</p></>}
  {list&&<>
   {!list.items.length&&<p>{section==='saved'?t.emptySaved:t.emptyFollowing}</p>}
   <div className="candidate-application-list">{list.items.map(item=><article className="candidate-application-card" key={item.relation_ref}>
    <h3>{item.name||t.unavailable}</h3>{item.employer_name&&<p>{item.employer_name}</p>}
    {item.kind!=='job'&&<p>{item.kind==='company'?t.shida:t.directory}</p>}
    {item.kind==='job'&&item.origin==='external'&&<p>{t.external}</p>}
    {(!item.available||item.status&&item.status!=='open')&&<p>{item.status==='expired'?t.expired:t.unavailable}</p>}
    <div className="candidate-actions">{item.available&&item.reference&&<a href={destination(item)}>{item.kind==='job'?t.open:t.organisation} →</a>}
    <button disabled={busy} onClick={()=>remove(item)}>{item.kind==='job'?t.remove:t.unfollow}</button></div>
    {item.kind!=='job'&&<p>{t.notifications}: {item.notifications?t.enabled:t.disabled}</p>}
    {section==='alerts'&&item.available&&<button disabled={busy} onClick={()=>void mutate(`relations/${item.relation_ref}/notifications`,'PUT',{enabled:!item.notifications}).catch(()=>{})}>{item.notifications?t.disable:t.enable}</button>}
   </article>)}</div>
   <nav className="candidate-actions" aria-label={t[section]}>{page>1&&<button disabled={busy} onClick={()=>{setList(null);setPage(p=>p-1);}}>{t.previous}</button>}{list.has_more&&<button disabled={busy} onClick={()=>{setList(null);setPage(p=>p+1);}}>{t.next}</button>}<button disabled={busy} onClick={reload}>{t.refresh}</button></nav>
  </>}
 </section>;
}
