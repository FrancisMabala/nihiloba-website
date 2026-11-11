'use client';
import {useEffect,useState} from 'react';
import {jobSearchCopy,jobSearchPath} from '../../lib/job-search-copy';
import {jobSearchRequest,type JobSearchList} from '../../lib/job-search-api';
import type {CandidateApplication} from '../../types/shida-employment';
import {candidateApplicationPath,candidateStatusLabel} from './candidate-employment';
import {SpaceIcon} from './account-space-icon';

export const applicationsCopy={
 fr:{empty:'Aucune candidature envoyée via SHIDA',scope:'Seules les candidatures envoyées via SHIDA apparaissent ici.',one:'Voir mon offre enregistrée',many:'Voir mes offres enregistrées',open:'Voir ma candidature',sent:'Envoyée le',interview:'Entretien prévu',details:'Voir l’entretien'},
 en:{empty:'No applications submitted through SHIDA',scope:'Only applications submitted through SHIDA appear here.',one:'View my saved job',many:'View my saved jobs',open:'View my application',sent:'Submitted on',interview:'Interview scheduled',details:'View interview'},
 ln:{empty:'Candidature moko te etindami na SHIDA',scope:'Kaka ba candidature otindi na SHIDA nde emonanaka awa.',one:'Talá mosala nabombi',many:'Talá misala nabombi',open:'Talá candidature na ngai',sent:'Etindami na',interview:'Entretien ebongisami',details:'Talá entretien'},
 sw:{empty:'Hakuna ombi lililotumwa kupitia SHIDA',scope:'Maombi yaliyotumwa kupitia SHIDA pekee yanaonekana hapa.',one:'Angalia kazi niliyohifadhi',many:'Angalia kazi nilizohifadhi',open:'Angalia ombi langu',sent:'Limetumwa tarehe',interview:'Mahojiano yamepangwa',details:'Angalia mahojiano'}
};
type Locale=keyof typeof applicationsCopy;
function SavedNextStep({locale,binding,refresh,unauthorized}:{refresh:number;locale:Locale;binding:string;unauthorized:()=>void}){
 const [list,setList]=useState<JobSearchList|null>(null),[failed,setFailed]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{const controller=new AbortController();
 jobSearchRequest<JobSearchList>(binding,locale,'saved?preview=1','GET',undefined,controller.signal).then(v=>{if(!controller.signal.aborted){setList(v);setFailed(false);}},e=>{if(controller.signal.aborted)return;if(e.status===401)unauthorized();else setFailed(true);});
 return()=>controller.abort();},[binding,locale,revision,refresh,unauthorized]);
 const t=jobSearchCopy[locale],c=applicationsCopy[locale];
 if(failed)return <div role="alert">{t.error} <button onClick={()=>{setFailed(false);setRevision(v=>v+1);}}>{t.retry}</button></div>;
 if(!list)return <p role="status">{t.loading}</p>;
 if(!list.total)return null;
 const item=list.items[0],one=list.total===1&&item?.available&&item.reference;
 return <a className="workspace-inline-link" href={one?(locale==='en'?'':'/'+locale)+'/shida/emplois/'+encodeURIComponent(item.reference!):jobSearchPath(locale,'saved')}>{one?c.one:c.many} →</a>;
}
// Recruitment stores a calendar date and wall-clock time; do not shift them by inventing a timezone.
function upcoming(item:CandidateApplication){
 if(item.status!=='interview_confirmed')return null;
 const d=item.interview.date,t=item.interview.time;
 if(!d||!t||!/^\d{4}-\d{2}-\d{2}$/.test(d)||!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(t))return null;
 const date=new Date(d+'T'+t);
 return date.getDate()===Number(d.slice(-2))&&date.getTime()>Date.now()?date:null;
}
export function WorkspaceApplications({locale,binding,refresh,applications,unauthorized}:{refresh:number;locale:Locale;binding:string;applications:CandidateApplication[];unauthorized:()=>void}){
 const c=applicationsCopy[locale],dates=new Intl.DateTimeFormat(locale,{dateStyle:'medium'});
 return <>{applications.length?<div className="workspace-app-list">{[...applications].sort((a,b)=>(b.created_at??'').localeCompare(a.created_at??'')).map(item=>{
  const interview=upcoming(item),created=item.created_at?new Date(item.created_at):null;
  return <article className="workspace-record" key={item.reference}><span className="workspace-record-icon app-tile"><SpaceIcon name="requests"/></span>
   <div className="workspace-record-body"><h3>{item.job_title}</h3><p>{[item.employer_name,item.job_location].filter(Boolean).join(' · ')}</p>
    {created&&Number.isFinite(created.getTime())&&<small>{c.sent} <time dateTime={item.created_at!}>{dates.format(created)}</time></small>}</div>
   <div className="workspace-app-status"><span data-status={interview?'interview':item.status}>{interview?c.interview:candidateStatusLabel(locale,item.status)}</span>{interview&&<small>{new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(interview)}</small>}</div>
   <div className="workspace-record-actions"><a href={candidateApplicationPath(locale,item.reference)+(interview?'#interview':'')}>{interview?c.details:c.open} →</a></div>
  </article>;})}</div>:<div className="workspace-record workspace-app-empty"><span className="workspace-record-icon app-tile"><SpaceIcon name="send"/></span><div className="workspace-record-body"><h3>{c.empty}</h3><SavedNextStep refresh={refresh} locale={locale} binding={binding} unauthorized={unauthorized}/></div></div>}
  <p className="workspace-scope">{c.scope}</p></>;
}
