'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {jobSearchCopy,jobSearchPath} from '../../lib/job-search-copy';
import {JobSearchError,jobSearchRequest,type JobSearchItem,type JobSearchList} from '../../lib/job-search-api';
import {candidateCopy} from '../../lib/candidate-profile-copy';
import {loadCandidateApplications} from '../../services/shida/employment-browser-client';
import {candidateApplicationPath,candidateStatusLabel} from './candidate-employment';
import {SpaceIcon} from './account-space-icon';

export const overviewCopy={
 fr:{intro:'Vos offres, vos candidatures et vos prochaines étapes.',start:'Votre recherche commence ici.',help:'Explorez les offres, enregistrez celles qui vous intéressent et retrouvez-les ici.',recent:'Dernières candidatures',none:'Aucune candidature pour le moment.',track:'Voir le suivi',open:'Ouverte',all:'Tout voir',cv:'CV ajouté'},
 en:{intro:'Your saved jobs, applications and next steps.',start:'Your job search starts here.',help:'Explore jobs, save the ones you like and find them here.',recent:'Recent applications',none:'No applications yet.',track:'Track application',open:'Open',all:'View all',cv:'CV added'},
 ln:{intro:'Misala obombi, ba candidature na yo mpe makambo ya kosala.',start:'Boluki mosala na yo ebandi awa.',help:'Talá misala mpe bombá oyo olingi mpo ozwa yango awa.',recent:'Ba candidature ya sika',none:'Candidature ezali naino te.',track:'Landá candidature',open:'Efungwami',all:'Talá nyonso',cv:'CV ebakisami'},
 sw:{intro:'Kazi ulizohifadhi, maombi yako na hatua zinazofuata.',start:'Utafutaji wako wa kazi unaanza hapa.',help:'Tazama nafasi za kazi na uhifadhi unazopenda ili uzipate hapa.',recent:'Maombi ya hivi karibuni',none:'Bado hakuna maombi.',track:'Fuatilia ombi',open:'Wazi',all:'Ona zote',cv:'CV imeongezwa'}
};
const single = {
 fr:{saved:'Offre enregistrée',applications:'Candidature',following:'Entreprise suivie'},
 en:{saved:'Saved job',applications:'Application',following:'Followed employer'},
 ln:{saved:'Mosala obombi',applications:'Candidature',following:'Entreprise olandaka'},
 sw:{saved:'Kazi iliyohifadhiwa',applications:'Ombi',following:'Mwajiri unayemfuata'}
};
type Locale=keyof typeof overviewCopy;
type Profiles={profiles:{type:string;archived:boolean;visibility:string;has_cv?:boolean}[];progress:{profile_type:string;state:string}[]};
function useSection<T>(read:(signal:AbortSignal)=>Promise<T>,unauthorized:()=>void){
 const [data,setData]=useState<T|null>(null),[failed,setFailed]=useState(false),[version,setVersion]=useState(0);
 const latest=useRef({read,unauthorized});useEffect(()=>{latest.current={read,unauthorized};});
 useEffect(()=>{const c=new AbortController();setFailed(false);setData(null);
 latest.current.read(c.signal).then(value=>{if(!c.signal.aborted)setData(value);},err=>{if(c.signal.aborted)return;if(err?.status===401)latest.current.unauthorized();else setFailed(true);});
 return()=>c.abort();},[version]);
 return {data,failed,retry:()=>setVersion(v=>v+1)};
}
export function JobOverview({locale,binding,destination,unauthorized}:{locale:Locale;binding:string;destination:(item:JobSearchItem)=>string;unauthorized:()=>void}){
 const t=jobSearchCopy[locale],u=overviewCopy[locale],p=candidateCopy[locale];
 const saved=useSection(s=>jobSearchRequest<JobSearchList>(binding,locale,'saved?page=1','GET',undefined,s),unauthorized);
 const follows=useSection(s=>jobSearchRequest<JobSearchList>(binding,locale,'following?page=1','GET',undefined,s),unauthorized);
 const apps=useSection(loadCandidateApplications,unauthorized);
 const profiles=useSection(async s=>{const r=await fetch('/api/shida/personal/candidate?language='+locale,{headers:{'X-Shida-Session':binding},credentials:'same-origin',cache:'no-store',signal:s});if(!r.ok)throw new JobSearchError(r.status);return await r.json() as Profiles;},unauthorized);
 const path=(section:Parameters<typeof jobSearchPath>[1])=>jobSearchPath(locale,section);
 const browse=(locale==='en'?'':'/'+locale)+'/shida/emplois';
 function panel<T>(title:string,state:ReturnType<typeof useSection<T>>,render:(d:T)=>ReactNode,section:Parameters<typeof path>[0]){
 return <section className="search-panel"><header><h2>{title}</h2><a href={path(section)} aria-label={title+' — '+u.all}>{u.all} →</a></header>{state.failed?<div role="alert">{t.error} <button onClick={state.retry}>{t.retry}</button></div>:state.data===null?<p role="status">{t.loading}</p>:render(state.data)}</section>;
 }
 function relations(list:JobSearchList,job:boolean){return list.items.length?list.items.slice(0,3).map(item=><article key={item.relation_ref}>{item.available&&item.reference?<><strong>{item.name}</strong><small>{item.employer_name} {job&&item.origin==='external'?t.external:''} {job&&item.status?(item.status==='open'?u.open:item.status==='expired'?t.expired:t.unavailable):''}</small><a href={destination(item)}>{job?t.open:t.organisation} →</a></>:<p>{t.unavailable}</p>}</article>):<p>{job?t.emptySaved:t.emptyFollowing}</p>;}
 return <><div className="search-counts">{([['saved',saved.data?.total,'management'],['applications',apps.data?.length,'requests'],['following',follows.data?.total,'business']] as const).map(([key,n,icon])=><a key={key} href={path(key)}><SpaceIcon name={icon}/><span><b>{n??'—'}</b>{n===1?single[locale][key]:t[key]} →</span></a>)}</div>
 {saved.data?.total===0&&follows.data?.total===0&&apps.data?.length===0&&profiles.data&&!profiles.data.profiles.some(v=>!v.archived)&&!profiles.data.progress.some(v=>['expired','active'].includes(v.state))&&<section className="search-panel"><h2>{u.start}</h2><p>{u.help}</p><a href={browse}>{t.browse}</a> · <a href={path('profiles')}>{p.start}</a></section>}
 <div className="search-panels"><div>{panel(t.saved,saved,d=>relations(d,true),'saved')}
 {panel(u.recent,apps,d=>d.length?[...d].sort((a,b)=>(b.created_at??'').localeCompare(a.created_at??'')).slice(0,3).map(a=><article key={a.reference}><strong>{a.job_title}</strong><small>{a.employer_name} · {candidateStatusLabel(locale,a.status)}</small><a href={candidateApplicationPath(locale,a.reference)}>{u.track} →</a></article>):<p>{u.none}</p>,'applications')}</div>
 <div>{panel(t.profiles,profiles,d=>(['professional','occasional_work'] as const).map(kind=>{const profile=d.profiles.find(v=>v.type===kind&&!v.archived),draft=d.progress.find(v=>v.profile_type===kind&&['active','expired'].includes(v.state));return <article key={kind}><strong>{p[kind]}</strong>{profile&&<small>{profile.visibility==='private'?p.private:profile.visibility==='open_to_work'?p.open_to_work:''} {profile.has_cv?u.cv:''}</small>}<a href={path('profiles')}>{profile?p.edit:draft?draft.state==='expired'?p.recover:p.resume:p.start} →</a></article>;}),'profiles')}
 {panel(t.following,follows,d=>relations(d,false),'following')}</div></div></>;
}
