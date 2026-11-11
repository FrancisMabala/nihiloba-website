'use client';
import {useEffect,useState} from 'react';
import {listingText} from '../../lib/personal-missions-copy';
import {occText,type OccLocale} from '../../lib/occasional-copy';
import type {Mission} from '../../lib/occasional-form';
const labels={fr:['Candidats pour cette mission','Candidatures reçues','Aucun résultat pour cette mission.','Accès indisponible.','Voir les détails','Chargement…'],en:['Candidates for this mission','Received applications','No results for this mission.','Access unavailable.','View details','Loading…'],ln:['Bato mpo na mosala oyo','Bosɛngi oyo ezwami','Eloko moko te mpo na mosala oyo.','Okoki kotala te.','Tala makambo','Ezali kofungwama…'],sw:['Wagombea kwa kazi hii','Maombi yaliyopokelewa','Hakuna matokeo kwa kazi hii.','Hairuhusiwi.','Tazama maelezo','Inapakia…']};
type Work={example?:string;frequency?:string[];message?:string;name:string;city:string;communes:string[];missions:Mission[];days:string[];slots:string[]};
type Row={reference:string;name?:string;job?:string;work:Work|null};
export type OwnedOffer={reference:string;title:string;open:boolean};
export function MissionPeople({locale,binding}:{locale:OccLocale;binding:string}){
 const l=labels[locale],t=(v:string)=>occText(locale,v);
 const [data,setData]=useState<{offers?:OwnedOffer[];records?:Row[]}|null>(null),[error,setError]=useState(false);
 const q=new URLSearchParams(typeof window==='undefined'?'':window.location.search),offer=q.get('offer'),kind=q.get('kind'),record=q.get('record');
 const link=(ref:string,k:string,r?:string)=>'?'+new URLSearchParams({view:'listings',offer:ref,kind:k,...(r?{record:r}:{})}).toString();
 useEffect(()=>{let active=true;let controller:AbortController;
 const clear=()=>{controller?.abort();setData(null)};
 const load=async()=>{clear();if(document.hidden)return;const req=new AbortController();controller=req;setError(false);
 try{const qs=offer&&kind?'?'+new URLSearchParams({offer,kind,...(record?{record}:{})}):'';
 const res=await fetch('/api/shida/personal/job-offer'+qs,{cache:'no-store',headers:{'X-Shida-Session':binding},signal:req.signal});if(!res.ok)throw Error();const d=await res.json();if(active&&!req.signal.aborted)setData(d);
 }catch{if(active&&!req.signal.aborted)setError(true)}};
 void load();document.addEventListener('visibilitychange',load);window.addEventListener('pageshow',load);window.addEventListener('pagehide',clear);return()=>{active=false;controller?.abort();document.removeEventListener('visibilitychange',load);window.removeEventListener('pageshow',load);window.removeEventListener('pagehide',clear)}},[binding,kind,offer,record]);
 if(error)return <p role="alert">{l[3]}</p>;if(!data)return <p role="status">{l[5]}</p>;
 if(!offer||!kind)return <>{data.offers?.map(j=><article className="candidate-profile-panel" key={j.reference}><h3>{j.title}</h3><div className="candidate-actions">{j.open&&<a href={link(j.reference,'candidates')}>{l[0]} →</a>}<a href={link(j.reference,'applications')}>{l[1]} →</a></div></article>)}</>;
 return <section><h3>{l[kind==='candidates'?0:1]}</h3>{data.records?.length?data.records.map(r=><article className="candidate-profile-panel" key={r.reference}><h4>{r.work?.name||r.name}</h4><p>{[r.job,r.work?.city,...(r.work?.communes||[])].filter(Boolean).join(' · ')}</p>{record?<>{r.work?.example&&<p>{r.work.example}</p>}{r.work?.message&&<blockquote>{r.work.message}</blockquote>}{r.work?.missions.map(m=><p key={m.name||m.category}><strong>{m.name||t(m.category)}</strong> · {m.tasks.join(', ')} · {t(m.experience)} {m.rate==='agree'?t('flexible'):m.rate==='amount'?[m.amount,m.currency,t(m.unit)].join(' '):''}</p>)}<p>{[...(r.work?.days||[]),...(r.work?.slots||[]),...(r.work?.frequency||[])].map(t).join(' · ')}</p></>:<a href={link(offer,kind,r.reference)}>{kind==='candidates'?listingText(locale,'seeProfile'):l[4]} →</a>}</article>):<p>{l[2]}</p>}</section>
}