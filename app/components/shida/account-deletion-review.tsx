'use client';
import {useState} from 'react';
import {deletionReviewText,deletionReviewState} from '../../lib/deletion-review-copy';
type Review={reference:string;state:string;created_at:string;updated_at:string};
type Props={locale:'en'|'fr'|'ln'|'sw';api:(path:string,body?:object)=>Promise<{requests?:Review[]} & Partial<Review>>;authorize:(action:string)=>Promise<string>;run:(action:()=>Promise<void>)=>Promise<void>};
export function AccountDeletionReview({locale,api,authorize,run}:Props){
 const [message,setMessage]=useState(''),[consent,setConsent]=useState(false),[rows,setRows]=useState<Review[]|null>(null),[saved,setSaved]=useState(false);
 const t=(key:Parameters<typeof deletionReviewText>[1])=>deletionReviewText(locale,key);
 async function refresh(){const result=await api('delete/reviews/');if(!Array.isArray(result.requests))throw Error();setRows(result.requests);}
 return <section className="account-deletion-review"><h3>{t('title')}</h3><p>{t('help')}</p>
 <form onSubmit={event=>{event.preventDefault();if(!consent)return;void run(async()=>{await api('delete/reviews/',{authorization:await authorize('delete'),confirmed:true,message,language:locale});setMessage('');setConsent(false);setSaved(true);await refresh();});}}>
 <label>{t('message')}<textarea required minLength={1} maxLength={3000} value={message} onChange={event=>setMessage(event.target.value)}/></label>
 <label><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/>{t('consent')}</label>
 <button disabled={!consent||!message.trim()}>{t('title')}</button></form>
 {saved&&<p role="status">{t('sent')}</p>}
 <button type="button" onClick={()=>void run(refresh)}>{t('refresh')}</button>
 {rows?.length===0&&<p>{t('empty')}</p>}
 {rows&&<ul>{rows.map(row=><li key={row.reference}><p>{row.reference} · {deletionReviewState(locale,row.state)}</p>
 <a href="?view=support">{t('support')}</a>
 {['deletion_requested','deletion_clarification','deletion_postponed'].includes(row.state)&&<button type="button" onClick={()=>void run(async()=>{await api('delete/reviews/cancel/',{reference:row.reference});await refresh();})}>{t('withdraw')}</button>}
 </li>)}</ul>}</section>;
}
