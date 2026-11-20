'use client';
import {useEffect,useState} from 'react';
import type {MarketplaceLocale} from './marketplace-account-copy';
import type {ActivityData} from '../../lib/use-personal-activity-data';
import {myProfilesCopy} from '../../lib/my-profiles-copy';
import {managementSelectorCopy} from '../../lib/management-selector-copy';
import {overviewEntries} from '../../lib/overview-records';
import {SpaceIcon} from './account-space-icon';
import './my-profiles.css';
import {CustomerIdentity,CustomerReceipts} from './customer-receipts';
type Candidate={reference:string;type:'professional'|'occasional_work';archived:boolean};
export function MyProfiles({locale,binding,name,data,onRetry}:{locale:MarketplaceLocale;binding:string;name:string;data:ActivityData|null;onRetry:()=>void}){
 const c=myProfilesCopy[locale],labels=managementSelectorCopy[locale],prefix=locale==='en'?'':`/${locale}`,base=`${prefix}/shida/space`;
 const [candidates,setCandidates]=useState<Candidate[]|null>(null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),12000);let active=true;
  void fetch(`/api/shida/personal/candidate/?language=${locale}`,{cache:'no-store',credentials:'same-origin',signal:abort.signal,headers:{'X-Shida-Session':binding}}).then(async response=>{
   if(!response.ok)throw Error();const result=await response.json();
   if(!Array.isArray(result.profiles)||result.profiles.some((row:Candidate)=>!/^CND_[A-Za-z0-9_-]+$/.test(row.reference)||!['professional','occasional_work'].includes(row.type)||typeof row.archived!=='boolean'))throw Error();
   if(active){setCandidates(result.profiles);setFailed(false);}
  }).catch(()=>{if(active)setFailed(true);}).finally(()=>clearTimeout(timer));
  return()=>{active=false;abort.abort();clearTimeout(timer);};
 },[binding,locale,attempt]);
 const items=data?.items.filter(row=>!row.individual)??[];
 const travel=overviewEntries(locale,[],{listings:[],properties:[],travel:data?.travel??[],seeker:undefined});
 return <div className="my-profiles"><p>{c.intro}</p>
  <section className="my-profile-identity"><h2>{c.personal}</h2><p>{name}</p><a href={`${base}?view=settings#passkey-profile`}>{c.edit} →</a></section>
  <CustomerIdentity locale={locale} binding={binding}/>
  <CustomerReceipts locale={locale} binding={binding}/>
  <section><h2>{c.marketplaces}</h2>{(!data||!candidates)&&!failed&&<p role="status">{c.loading}</p>}
   {(data?.failed||failed)&&<p role="alert">{c.error} <button onClick={()=>{setAttempt(value=>value+1);onRetry();}}>{c.retry}</button></p>}
   <ul className="my-profile-list">{candidates?.map(profile=><li key={profile.reference}><a href={`${base}?view=job-search&section=profiles&profile=${profile.type}&record=${encodeURIComponent(profile.reference)}`}><SpaceIcon name="people"/><span><strong>{profile.type==='professional'?c.professional:c.occasional}</strong>{profile.archived&&<small>{c.archived}</small>}</span><span aria-hidden="true">›</span></a></li>)}
    {data?.employerProfiles?.map(row=><li key={row.offer_ref}><a href={`${base}?view=listings&kind=manage&offer=${encodeURIComponent(row.offer_ref)}#personal-employer-photo`}><SpaceIcon name="people"/><span><strong>{c.publisher}</strong><small>{row.title}</small></span><span aria-hidden="true">›</span></a></li>)}
    {items.map(row=><li key={row.market+':'+(row.providerRef??row.ref)}><a href={`${prefix}/shida/seller/${row.market}?${row.query}`}><SpaceIcon name={row.market==='wenze'?'shop':row.market==='restaurants'?'restaurant':'tool'}/><span><strong>{row.name||labels[row.market]}</strong><small>{labels[row.market]}</small></span><span aria-hidden="true">›</span></a></li>)}
    {travel.map(row=><li key={row.kind+row.ref}><a href={row.url}><SpaceIcon name={row.kind==='hotel'?'business':'people'}/><span><strong>{row.name||c.whatsapp}</strong><small>{c.whatsapp}</small></span><span aria-hidden="true">↗</span></a></li>)}
    {!!data?.counts?.apartments&&<li><a href={`${prefix}/shida/appartements/mes-logements/`}><SpaceIcon name="home"/><strong>{c.housing}</strong><span aria-hidden="true">›</span></a></li>}
   </ul>
   {data&&!data.failed&&candidates?.length===0&&!items.length&&!travel.length&&!data.counts?.apartments&&!data.employerProfiles?.length&&<p>{c.empty}</p>}
   {candidates?.length===0&&<p><a href={`${base}?view=job-search&section=profiles`}>{c.candidate} →</a></p>}
   {data?.employerProfilesMore&&<p><a href={`${base}?view=listings`}>{c.more} →</a></p>}
   {data?.business&&<p><a href="https://business.nihiloba.com/">{c.organization} →</a></p>}
  </section>
 </div>;
}
