'use client';
import {useEffect,useRef,useState} from 'react';
import {deletionReviewText,deletionReviewState} from '../../lib/deletion-review-copy';
import {deletionText} from '../../lib/account-deletion-copy';
import {deletionUx} from '../../lib/deletion-ux-copy';
import {obligationTitle,type DeletionObligation} from '../../lib/deletion-obligations';
type Review={reference:string;state:string;created_at:string;updated_at:string};
type Props={locale:'en'|'fr'|'ln'|'sw';api:(path:string,body?:object)=>Promise<unknown>;authorize:(action:string)=>Promise<string>;run:(action:()=>Promise<void>)=>Promise<void>;obligations:DeletionObligation[];selectedItem?:string|null;enabled?:boolean;onClose?:()=>void};
export function AccountDeletionReview({locale,api,authorize,run,obligations,selectedItem,enabled=true,onClose}:Props){
 const [message,setMessage]=useState(''),[selected,setSelected]=useState<string[]>(selectedItem?[selectedItem]:[]),[rows,setRows]=useState<Review[]|null>(null),[saved,setSaved]=useState(false),[failed,setFailed]=useState(false),[step,setStep]=useState<'edit'|'confirm'>('edit');
 const initialApi=useRef(api),t=(key:Parameters<typeof deletionReviewText>[1])=>deletionReviewText(locale,key),u=(key:Parameters<typeof deletionUx>[1])=>deletionUx(locale,key);
 const selections=obligations.filter(item=>selected.includes(item.reference));
 const isOpen=(row:Review)=>['deletion_requested','deletion_clarification','deletion_postponed'].includes(row.state);
 async function refresh(){const result=await api('delete/reviews/') as {requests:Review[]};if(!Array.isArray(result.requests))throw Error();setRows(result.requests);setFailed(false);return result.requests;}
 useEffect(()=>{let current=true;void initialApi.current('delete/reviews/').then(value=>{const result=value as {requests:Review[]};if(!Array.isArray(result.requests))throw Error();if(current)setRows(result.requests);}).catch(()=>{if(current)setFailed(true);});return()=>{current=false;};},[]);
 useEffect(()=>{let current=true;if(selectedItem)queueMicrotask(()=>{if(current){setSelected(values=>values.includes(selectedItem)?values:[...values,selectedItem]);setStep('edit');}});return()=>{current=false;};},[selectedItem]);
 const open=rows?.find(isOpen);
 return <section className="account-deletion-review" aria-label={u('review')}><header><h4>{u('review')}</h4>{onClose&&<button type="button" onClick={onClose}>{u('close')}</button>}</header><p>{t('help')}</p>
 {failed&&<p role="alert">{deletionText(locale,'error')}</p>}
 {rows&&!open&&<form onSubmit={event=>{event.preventDefault();if(!enabled||!selections.length||!message.trim())return;if(step==='edit'){setStep('confirm');return;}void run(async()=>{
  // Read existing state before proof/submission; the backend also serializes duplicates.
  if((await refresh()).some(isOpen))return;
  const result=await api('delete/reviews/',{authorization:await authorize('delete'),confirmed:true,message,language:locale,obligations:selections.map(item=>item.reference)}) as Review;
  if(!result.reference||!result.state)throw Error();setRows(previous=>[result,...(previous??[]).filter(row=>row.reference!==result.reference)]);setMessage('');setSelected([]);setSaved(true);setStep('edit');
 });}}><fieldset disabled={!enabled}>
 {step==='edit'?<><fieldset><legend>{deletionText(locale,'select')}</legend>{obligations.map(item=><label key={item.reference}><input type="checkbox" checked={selected.includes(item.reference)} onChange={event=>setSelected(values=>event.target.checked?[...values,item.reference]:values.filter(value=>value!==item.reference))}/>{obligationTitle(locale,item)}</label>)}</fieldset><label>{t('message')}<textarea required minLength={1} maxLength={3000} value={message} onChange={event=>setMessage(event.target.value)}/></label></>:<div className="deletion-review-summary"><h5>{u('reviewSelection')}</h5><ul>{selections.map(item=><li key={item.reference}>{obligationTitle(locale,item)}</li>)}</ul><p>{message}</p><button type="button" onClick={()=>setStep('edit')}>{u('edit')}</button></div>}
 <p>{t('consent')}</p><button className="deletion-primary" disabled={!selections.length||!message.trim()}>{step==='edit'?u('reviewSelection'):t('title')}</button></fieldset></form>}
 {saved&&<p role="status">{t('sent')}</p>}
 <button type="button" onClick={()=>void run(async()=>{await refresh();})}>{t('refresh')}</button>
 {rows&&<ul>{rows.map(row=><li key={row.reference}><p>{row.reference} · {deletionReviewState(locale,row.state)}</p><a href={`?view=support&case=${encodeURIComponent(row.reference)}`}>{t('support')}</a>
 {open?.reference===row.reference&&<button type="button" onClick={()=>void run(async()=>{await api('delete/reviews/cancel/',{reference:row.reference});await refresh();})}>{t('withdraw')}</button>}
 </li>)}</ul>}</section>;
}
