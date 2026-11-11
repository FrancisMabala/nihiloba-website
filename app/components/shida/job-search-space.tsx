'use client';
import {useEffect,useRef,useState} from 'react';
import {jobSearchCopy,jobSearchPath,jobSearchSections,type JobSearchSection} from '../../lib/job-search-copy';
import {jobSearchRequest,JobSearchError,type JobSearchList,type JobSearchItem} from '../../lib/job-search-api';
import {loadApplicationPage,EmploymentBrowserError} from '../../services/shida/employment-browser-client';
import {EmployerAlerts} from './employer-alerts';
import {WorkspaceApplications} from './workspace-applications';
import {CandidateProfileSpace} from './candidate-profile-space';
import {leaveWork} from '../../lib/wenze-work';
import {useConfirmation} from './confirmation-dialog';
import {jobOverviewCopy as overviewCopy} from '../../lib/job-overview-copy';
import {JobOverview} from './job-search-overview';
import './candidate-profile-space.css';
import './job-search-overview.css';
import './job-search-records.css';
import {FollowedEmployers,followListCopy} from './followed-employers';
import {SavedOffers,savedCopy} from './saved-offers';

type JobSearchSpaceProps={locale:keyof typeof jobSearchCopy;binding:string;initialSection?:string;onUnauthorized:()=>void};
export function JobSearchSpace(props:JobSearchSpaceProps){
 return <JobSearchContents key={`${props.binding}:${props.locale}:${props.initialSection}`} {...props}/>;
}
function JobSearchContents({locale,binding,initialSection='overview',onUnauthorized}:JobSearchSpaceProps){
 const t=jobSearchCopy[locale],prefix=locale==='en'?'':`/${locale}`;
 const section:JobSearchSection=jobSearchSections.includes(initialSection as JobSearchSection)?initialSection as JobSearchSection:'overview';
 const [list,setList]=useState<JobSearchList|null>(null),[applications,setApplications]=useState<Awaited<ReturnType<typeof loadApplicationPage>>|null>(null);
 const [page,setPage]=useState(1),[revision,setRevision]=useState(0),[error,setError]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const tabs=useRef<HTMLElement>(null);
 useEffect(()=>{const nav=tabs.current,active=nav?.querySelector<HTMLElement>('[aria-current="page"]');if(!nav||!active)return;
  const a=active.getBoundingClientRect(),n=nav.getBoundingClientRect();if(a.right>n.right)nav.scrollLeft+=a.right-n.right+8;else if(a.left<n.left)nav.scrollLeft+=a.left-n.left-8;
 },[section]);
 const lock=useRef(false),alive=useRef(false),unauthorized=useRef(onUnauthorized);
 const {request:confirm,confirmation}=useConfirmation(locale);
 useEffect(()=>{unauthorized.current=onUnauthorized;},[onUnauthorized]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  async function load(){
   try{
    if(section==='saved'||section==='following'){
     const items=await jobSearchRequest<JobSearchList>(binding,locale,`${section}?page=${page}${section==='following'?'&cards=1':''}`,'GET',undefined,controller.signal);
     if(active){if(page>1&&!items.items.length){setPage(page-1);return;}setError(false);setList(items);}
    }else if(section==='applications'){
     const items=await loadApplicationPage(controller.signal,page);if(active){setApplications(items);setError(false);}
    }
   }catch(e){if(active){if((e instanceof JobSearchError||e instanceof EmploymentBrowserError)&&e.status===401)unauthorized.current();else {setList(null);setApplications(null);setError(true);}}}
  }
  void load();
  return()=>{active=false;controller.abort();};
 },[binding,locale,section,page,revision]);
 useEffect(()=>{
  const refresh=()=>{if(!lock.current)setRevision(v=>v+1);};
  window.addEventListener('focus',refresh);window.addEventListener('pageshow',refresh);
  return()=>{window.removeEventListener('focus',refresh);window.removeEventListener('pageshow',refresh);};
 },[]);
 function reload(){setList(null);setApplications(null);setError(false);setRevision(v=>v+1);}
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(timer);},[notice]);
 async function mutate(path:string,method:string,body?:unknown,success:string=t.updated){
  if(lock.current)return;lock.current=true;setBusy(true);setError(false);setNotice('');
  try{await jobSearchRequest(binding,locale,path,method,body);if(alive.current){setNotice(success);reload();}}
  catch(e){if(alive.current){if(e instanceof JobSearchError&&e.status===401)unauthorized.current();else if(method!=='DELETE')setError(true);}throw e;}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 function remove(item:JobSearchItem){confirm({title:section==='saved'?t.remove:t.unfollow,description:item.name||t.unavailable,confirmLabel:section==='saved'?t.remove:t.unfollow,cancelLabel:t.cancel,retryLabel:t.retry,onConfirm:()=>mutate(`relations/${item.relation_ref}`,'DELETE',undefined,section==='saved'?savedCopy[locale].removed:item.name?followListCopy[locale].removed.replace('{name}',item.name):t.unfollowedAction)});}
 const destination=(item:JobSearchItem)=>`${prefix}/shida/${item.kind==='job'?'emplois':item.kind==='company'&&!item.employer_ref?'businesses':'emplois/employeurs'}/${encodeURIComponent((item.kind!=='job'&&item.employer_ref)||item.reference!)}`;
 const loading=['saved','following'].includes(section)?!list:section==='applications'?!applications:false;
 return <section className="candidate-workspace job-search-workspace" aria-busy={busy}>
  {confirmation}
  <div className="search-intro"><p>{overviewCopy[locale].intro}</p><a className="space-primary-action" href={`${prefix}/shida/emplois`}>{t.browse} →</a></div>
  <nav ref={tabs} className="search-tabs" aria-label={t.title}>{jobSearchSections.map(key=><a key={key} href={jobSearchPath(locale,key)} aria-current={section===key?'page':undefined} onClick={async e=>{e.preventDefault();const href=e.currentTarget.href;if(await leaveWork())window.location.assign(href);}}>{t[key]}</a>)}</nav>
  {section!=='overview'&&<h2 className="workspace-heading">{t[section]}{section==='applications'&&applications&&<span className="workspace-count">{applications.total}</span>}{(section==='saved'||section==='following')&&list&&<span className="workspace-count">{list.total}</span>}</h2>}
  {notice&&<p className="workspace-toast" role="status">{notice}</p>}
  {error&&<div role="alert"><p>{t.error}</p><button onClick={reload} disabled={busy}>{t.retry}</button></div>}
  {loading&&!error&&<p role="status">{t.loading}</p>}
  {section==='overview'&&<JobOverview revision={revision} locale={locale} binding={binding} destination={destination} unauthorized={onUnauthorized}/>}
  {section==='profiles'&&<CandidateProfileSpace locale={locale} binding={binding} onUnauthorized={onUnauthorized}/>}
  {section==='applications'&&applications&&<WorkspaceApplications refresh={revision} locale={locale} binding={binding} applications={applications.applications} unauthorized={onUnauthorized}/>}
  {section==='applications'&&applications&&(page>1||applications.has_more)&&<nav className="candidate-actions" aria-label={t.applications}>
    {page>1&&<button onClick={()=>{setApplications(null);setPage(page-1);}}>{t.previous}</button>}{applications.has_more&&<button onClick={()=>{setApplications(null);setPage(page+1);}}>{t.next}</button>}
   </nav>}
  {section==='alerts'&&<EmployerAlerts locale={locale} binding={binding} unauthorized={onUnauthorized} revision={revision}/>}
  {list&&<>
   {section==='saved'?<SavedOffers locale={locale} list={list} remove={remove} busy={busy} destination={destination}/>:<FollowedEmployers locale={locale} list={list} remove={remove} busy={busy} destination={destination} retry={reload}/>}
   <nav className="candidate-actions" aria-label={t[section]}>{page>1&&<button disabled={busy} onClick={()=>{setList(null);setPage(p=>p-1);}}>{t.previous}</button>}{list.has_more&&<button disabled={busy} onClick={()=>{setList(null);setPage(p=>p+1);}}>{t.next}</button>}</nav>
  </>}
 </section>;
}
