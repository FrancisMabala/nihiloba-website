'use client';
import {useEffect,useRef,useState} from 'react';
import {deletionReviewText,deletionReviewState} from '../../lib/deletion-review-copy';
import {deletionText} from '../../lib/account-deletion-copy';
import {obligationLabel,type DeletionObligation} from './account-deletion';
type Review={reference:string;state:string;created_at:string;updated_at:string};
type Props={locale:'en'|'fr'|'ln'|'sw';api:(path:string,body?:object)=>Promise<unknown>;authorize:(action:string)=>Promise<string>;run:(action:()=>Promise<void>)=>Promise<void>;obligations:DeletionObligation[]};
export function AccountDeletionReview({locale,api,authorize,run,obligations}:Props){
 const [message,setMessage]=useState(''),[selected,setSelected]=useState<string[]>([]),[rows,setRows]=useState<Review[]|null>(null),[saved,setSaved]=useState(false),[failed,setFailed]=useState(false);
 const initialApi=useRef(api),t=(key:Parameters<typeof deletionReviewText>[1])=>deletionReviewText(locale,key);
 async function refresh(){const result=await api('delete/reviews/') as {requests:Review[]};if(!Array.isArray(result.requests))throw Error();setRows(result.requests);setFailed(false);}
 useEffect(()=>{let current=true;void initialApi.current('delete/reviews/').then(value=>{const result=value as {requests:Review[]};if(!Array.isArray(result.requests))throw Error();if(current)setRows(result.requests);}).catch(()=>{if(current)setFailed(true);});return()=>{current=false;};},[]);
 const open=rows?.find(row=>['deletion_requested','deletion_clarification','deletion_postponed'].includes(row.state));
 return <section className="account-deletion-review"><h4>{t('title')}</h4><p>{t('help')}</p>
 {failed&&<p role="alert">{deletionText(locale,'error')}</p>}
 {rows&&!open&&<form onSubmit={event=>{event.preventDefault();if(!selected.length)return;void run(async()=>{await api('delete/reviews/',{authorization:await authorize('delete'),confirmed:true,message,language:locale,obligations:selected});setMessage('');setSelected([]);setSaved(true);await refresh();});}}>
 <fieldset><legend>{deletionText(locale,'select')}</legend>{obligations.map(item=><label key={item.reference}><input type="checkbox" checked={selected.includes(item.reference)} onChange={event=>setSelected(values=>event.target.checked?[...values,item.reference]:values.filter(value=>value!==item.reference))}/>{obligationLabel(locale,item.kind)} · {item.reference}</label>)}</fieldset>
 <label>{t('message')}<textarea required minLength={1} maxLength={3000} value={message} onChange={event=>setMessage(event.target.value)}/></label>
 <p>{t('consent')}</p><button disabled={!selected.length||!message.trim()}>{t('title')}</button></form>}
 {saved&&<p role="status">{t('sent')}</p>}
 <button type="button" onClick={()=>void run(refresh)}>{t('refresh')}</button>
 {rows&&<ul>{rows.map(row=><li key={row.reference}><p>{row.reference} · {deletionReviewState(locale,row.state)}</p><a href={`?view=support&case=${encodeURIComponent(row.reference)}`}>{t('support')}</a>
 {open?.reference===row.reference&&<button type="button" onClick={()=>void run(async()=>{await api('delete/reviews/cancel/',{reference:row.reference});await refresh();})}>{t('withdraw')}</button>}
 </li>)}</ul>}</section>;
}
