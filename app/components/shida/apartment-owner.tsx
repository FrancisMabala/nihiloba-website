'use client';
import {useEffect,useRef,useState} from 'react';
import {WenzeBuyerProvider,useWenzeBuyer} from './wenze-buyer';
import {apartmentOwnerCopy,apartmentDraftCopy} from '../../lib/apartment-owner-copy';
import {OFFICIAL_CHANNELS} from '../../lib/brand';
import './apartment-detail.css';
import {PrivatePhoto} from './apartment-private-photo';
import {useConfirmation} from './confirmation-dialog';
import {ApartmentContractDraft} from './apartment-contract-draft';
type Locale=keyof typeof apartmentOwnerCopy;
type Property={reference:string;commune:string;status:string;visible:boolean;requests:number;web_draft:boolean;revision?:number;draft_summary?:{information_complete:boolean;photo_count:number;minimum_photos:number;photo_reference?:string|null;updated_at:string|null}};
type Applicant={token:string;name:string;message:string;people_count:number|null;status:string;visit:{status:string;date:string;time:string}|null};
type Page<T>={items:T[];page:number;has_more:boolean};
export function ApartmentOwner({locale}:{locale:Locale}){return <WenzeBuyerProvider locale={locale} loginMessage={apartmentOwnerCopy[locale].login}><Bound locale={locale}/></WenzeBuyerProvider>;}
function Bound({locale}:{locale:Locale}){const actor=useWenzeBuyer();return <Owner key={actor.binding} locale={locale} actor={actor}/>;}
function Owner({locale,actor}:{locale:Locale;actor:ReturnType<typeof useWenzeBuyer>}){
 const d=apartmentDraftCopy[locale],{request,confirmation}=useConfirmation(locale);
 const t=apartmentOwnerCopy[locale],prefix=locale==='en'?'':'/'+locale;
 const [data,setData]=useState<Page<Property>|null>(null),[selected,setSelected]=useState<Property|null>(null),[requests,setRequests]=useState<Page<Applicant>|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState(Boolean(actor.binding));
 const alive=useRef(true),lock=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{
  if(!actor.binding)return;const controller=new AbortController();lock.current=true;
  fetch('/api/shida/personal/apartments/manage/',{cache:'no-store',signal:controller.signal,headers:{'x-shida-session':actor.binding}}).then(async response=>{if(!response.ok)throw Error();const result=await response.json();if(!Array.isArray(result.items))throw Error();if(alive.current)setData(result);}).catch(()=>{if(alive.current&&!controller.signal.aborted)setError(true);}).finally(()=>{lock.current=false;if(alive.current)setBusy(false);});
  return()=>controller.abort();
 },[actor.binding]);

 async function call(path:string,body?:object){const response=await fetch('/api/shida/personal/apartments/'+path,{method:body?'POST':'GET',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{'x-shida-session':actor.binding!,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw Error(String(response.status));return response.json();}
 async function load(property:Property|null=null,page=1){if(!actor.binding){actor.login();return;}if(lock.current)return;lock.current=true;setBusy(true);setError(false);try{const result=await call(property?`${property.reference}/requests/?page=${page}`:`manage/?page=${page}`);if(!Array.isArray(result.items))throw Error();if(alive.current){if(property){setSelected(property);setRequests(result);}else{setData(result);setSelected(null);setRequests(null);}}}catch{if(alive.current)setError(true);}finally{lock.current=false;if(alive.current)setBusy(false);}}
 async function shortlist(item:Applicant){if(!selected||lock.current)return;lock.current=true;setBusy(true);setError(false);try{const result=await call(`${selected.reference}/requests/${item.token}/shortlist/`,{});if(result.status!=='shortlisted')throw Error();if(alive.current)setRequests(old=>old?{...old,items:old.items.map(row=>row.token===item.token?{...row,status:'shortlisted'}:row)}:old);}catch{if(alive.current)setError(true);}finally{lock.current=false;if(alive.current)setBusy(false);}}
 async function discard(item:Property){
  if(!item.web_draft || !item.revision || busy)return;
  const body={action:'discard',reference:item.reference,revision:item.revision,confirmed:true};
  await request({title:d.confirm,description:d.consequence,confirmLabel:d.remove,severity:'danger',onConfirm:async()=>{
   const result=await call('',body);
   if(result.status!=='DELETED')throw Error();
   if(alive.current)setData(old=>old?{...old,items:old.items.filter(row=>row.reference!==item.reference)}:old);
  }});
 }
 const state=(value:string)=>Object.hasOwn(t,value)?t[value as keyof typeof t]:t.status;
 const whatsapp=new URL(OFFICIAL_CHANNELS.whatsapp);whatsapp.searchParams.set('text','apartment interests');
 const active=selected?requests:data;
 return <section className="apt-detail" lang={locale}>{confirmation}<div className="container"><a href={`${prefix}/shida/space?view=management`}>← {t.back}</a><h1>{t.title}</h1>
 <div className="apt-publish"><button className="button button-primary" disabled={busy||actor.checking} onClick={()=>void load(selected,active?.page??1)}>{t.refresh}</button><a href={`${prefix}/shida/appartements/publier/`}>{t.create}</a></div>
 {!actor.binding&&!busy&&<p>{t.login}</p>}{busy&&<p role="status">{t.loading}</p>}{error&&<p role="alert">{t.error}</p>}
 {selected?<><button type="button" disabled={busy} onClick={()=>{setSelected(null);setRequests(null);}}>{t.previous}</button><h2>{selected.commune} · {selected.reference}</h2><p>{t.help}</p><a href={whatsapp.href} target="_blank" rel="noopener noreferrer">{t.schedule}</a><div className="apt-panels">{requests?.items.map(item=><article className="apt-panel" key={item.token}><h2>{item.name}</h2><p>{state(item.status)}</p>{item.people_count!=null&&<p>{t.people}: {item.people_count}</p>}<p className="apt-description">{item.message}</p>{item.visit&&<p>{state(item.visit.status)} · {item.visit.date} · {item.visit.time}</p>}{item.status==='pending_owner_review'&&selected.status==='AVAILABLE'&&selected.visible&&<button disabled={busy} onClick={()=>void shortlist(item)}>{t.shortlist}</button>}{item.status==='shortlisted'&&selected.status==='AVAILABLE'&&selected.visible&&actor.binding&&<ApartmentContractDraft key={item.token} locale={locale} binding={actor.binding} reference={selected.reference} requestToken={item.token}/>}</article>)}</div></>:<div className="apt-panels">{data?.items.map(item=><article className="apt-panel apt-owner-card" key={item.reference}><h2>{item.status==='DRAFT'?d.title:(item.commune||t.title)}</h2><p>{item.status==='DRAFT'?d.status:item.status==='AVAILABLE'&&item.visible?t.available:t.hidden}</p>{(item.status!=='DRAFT'||item.requests>0)&&<><p>{item.requests} · {t.requests}</p><button disabled={busy} onClick={()=>void load(item)}>{t.requests}</button></>}{item.status==='DRAFT'&&item.draft_summary&&<div className="apt-draft-readiness">{actor.binding&&item.draft_summary.photo_reference&&<PrivatePhoto listing={item.reference} reference={item.draft_summary.photo_reference} binding={actor.binding} label={d.photos}/>}<p>{item.draft_summary.information_complete?d.review:d.information}</p><p>{d.photos}: {item.draft_summary.photo_count} / {item.draft_summary.minimum_photos}</p>{item.draft_summary.updated_at&&<p>{d.updated}: {new Date(item.draft_summary.updated_at).toLocaleString(locale)}</p>}</div>}{item.web_draft&&<p><a href={`${prefix}/shida/appartements/publier/?draft=${encodeURIComponent(item.reference)}`}>{d.resume}</a></p>}{item.web_draft&&item.revision&&<button type="button" disabled={busy} onClick={()=>void discard(item)}>{d.remove}</button>}</article>)}</div>}
 {active?.items.length===0&&<p>{t.empty}</p>}<nav aria-label={t.title}>{active&&active.page>1&&<button disabled={busy} onClick={()=>void load(selected,active.page-1)}>{t.previous}</button>}{active?.has_more&&<button disabled={busy} onClick={()=>void load(selected,active.page+1)}>{t.next}</button>}</nav></div></section>;
}
