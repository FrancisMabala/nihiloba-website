'use client';
import {useEffect,useRef,useState} from 'react';
import {WenzeBuyerProvider,useWenzeBuyer} from './wenze-buyer';
import {apartmentInterestCopy} from '../../lib/apartment-interest-copy';
import './wenze-safety.css';
type Props={locale:keyof typeof apartmentInterestCopy;reference:string;title:string};
export function ApartmentInterest(props:Props) {
 return <WenzeBuyerProvider locale={props.locale} loginMessage={apartmentInterestCopy[props.locale].login}><Bound {...props}/></WenzeBuyerProvider>;
}
function Bound(props:Props){const actor=useWenzeBuyer();return <Interest key={`${actor.binding}:${props.reference}`} {...props} actor={actor}/>;}
function Interest({locale,reference,title,actor}:Props&{actor:ReturnType<typeof useWenzeBuyer>}) {
 const t=apartmentInterestCopy[locale],dialog=useRef<HTMLDialogElement>(null),alive=useRef(true),lock=useRef(false);
 const [people,setPeople]=useState(''),[message,setMessage]=useState(''),[review,setReview]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false),[status,setStatus]=useState('');
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const endpoint=`/api/shida/personal/apartments/${encodeURIComponent(reference)}/interest/`;
 async function open(){
  if(!actor.binding){actor.login();return;} if(lock.current)return;
  dialog.current?.showModal();lock.current=true;setBusy(true);setError(false);
  try {const response=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(15000),headers:{'x-shida-session':actor.binding}});if(!response.ok)throw Error();const value=await response.json();if(alive.current)setStatus(typeof value.request?.status==='string'?value.request.status:'');}
  catch{if(alive.current)setError(true);}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 async function submit(){
  if(!actor.binding||lock.current||!review)return;lock.current=true;setBusy(true);setError(false);
  try{const response=await fetch(endpoint,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','x-shida-session':actor.binding},body:JSON.stringify({message:message.trim(),people_count:people?Number(people):null,confirmed:true})});if(!response.ok)throw Error();const value=await response.json();if(value.listing_ref!==reference||typeof value.status!=='string')throw Error();if(alive.current){setStatus(value.status);setMessage('');setPeople('');}}
  catch{if(alive.current)setError(true);}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 return <><button type="button" className="button button-primary marketplace-visit-button" disabled={actor.checking} onClick={()=>void open()}>{t.title}</button>
 <dialog ref={dialog} className="wzp-report-dialog" aria-label={t.title}><header><h2>{t.title}</h2><button type="button" onClick={()=>dialog.current?.close()} aria-label={t.close}>×</button></header><p>{title}</p>
 {busy?<p role="status">{t.loading}</p>:status?<div role="status"><h3>{t.saved}</h3><p>{status==='pending_owner_review'?t.pending:t.status}</p><a href={`${locale==='en'?'':'/'+locale}/shida/space?view=transactions`}>{t.follow}</a></div>:<form onSubmit={event=>{event.preventDefault();if(review)void submit();else setReview(true);}}>
 <p>{t.privacy}</p>{review?<dl><dt>{t.people}</dt><dd>{people||'—'}</dd><dt>{t.message}</dt><dd style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{message||'—'}</dd></dl>:<fieldset><label>{t.people}<input type="number" min="1" max="100" step="1" value={people} onChange={event=>setPeople(event.target.value)}/></label><label>{t.message}<textarea rows={4} maxLength={500} value={message} onChange={event=>setMessage(event.target.value)}/></label></fieldset>}
 {review&&<button type="button" onClick={()=>setReview(false)}>{t.edit}</button>}<button className="button button-primary">{review?t.send:t.review}</button></form>}
 {error&&<p role="alert">{t.error}</p>}<button type="button" onClick={()=>dialog.current?.close()}>{t.close}</button></dialog></>;
}
