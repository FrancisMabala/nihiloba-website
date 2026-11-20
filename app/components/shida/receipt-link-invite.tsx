'use client';
import {WenzeCamera} from './wenze-camera';
import {customerNumberScan} from '../../lib/customer-receipt-contract';
import {useEffect,useRef,useState} from 'react';
import {customerReceiptCopy,type ReceiptLocale} from '../../lib/customer-receipt-copy';
import {sellerReceiptRequest,receiptErrorMessage,ReceiptError} from '../../lib/customer-receipt-client';
import type {ReceiptSource} from '../../lib/customer-receipt-contract';
import './customer-receipts.css';
type Props={locale:ReceiptLocale;binding:string;source:ReceiptSource;merchantRef:string;receiptRef:string;businessRef?:string};
export function ReceiptLinkInvite(props:Props){return <Invitation key={[props.binding,props.businessRef,props.source,props.merchantRef,props.receiptRef].join(':')} {...props}/>;}
function Invitation({locale,binding,source,merchantRef,receiptRef,businessRef}:Props){
 const c=customerReceiptCopy[locale],[open,setOpen]=useState(false),[number,setNumber]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[submitted,setSubmitted]=useState<string|null>(null),[cancelled,setCancelled]=useState(false),[retryPending,setRetryPending]=useState(false);const alive=useRef(true),lock=useRef(false),pending=useRef<{customer_number:string;receipt_version:string;operation_key:string}|null>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const path=`${source}/${encodeURIComponent(merchantRef)}/receipts/${encodeURIComponent(receiptRef)}`;
 async function send(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{
  if(!pending.current){const preview=await sellerReceiptRequest(path,binding,undefined,undefined,businessRef) as {receipt_version?:unknown};if(!alive.current)return;if(typeof preview.receipt_version!=='string'||!/^[a-f0-9]{64}$/.test(preview.receipt_version))throw Error();pending.current={customer_number:number.trim(),receipt_version:preview.receipt_version,operation_key:crypto.randomUUID()};setRetryPending(true);}
  const value=await sellerReceiptRequest(path,binding,pending.current,undefined,businessRef) as {request_ref?:unknown;status?:unknown};
  if(value.status!=='submitted'||typeof value.request_ref!=='string'||!/^CRG_[a-f0-9]{32}$/.test(value.request_ref))throw Error();
  if(alive.current){setSubmitted(value.request_ref);setNumber('');pending.current=null;setRetryPending(false);}
 }catch(e){if(e instanceof ReceiptError&&e.status>=400&&e.status<500){pending.current=null;if(alive.current)setRetryPending(false);}if(alive.current)setError(receiptErrorMessage(e,locale));}finally{lock.current=false;if(alive.current)setBusy(false);}}
 async function revoke(){if(!submitted||lock.current)return;lock.current=true;setBusy(true);setError('');try{await sellerReceiptRequest(`requests/${submitted}/revoke`,binding,{},undefined,businessRef);if(alive.current)setCancelled(true);}catch(e){if(alive.current)setError(receiptErrorMessage(e,locale));}finally{lock.current=false;if(alive.current)setBusy(false);}}
 return <aside className="receipt-link-invite">{!open?<button type="button" onClick={()=>setOpen(true)}>{c.invite}</button>:<><h3>{c.invite}</h3><p>{c.inviteHelp}</p>{error&&<p role="alert">{error}</p>}{submitted?<><p role="status">{cancelled?c.cancelled:c.submitted}</p>{!cancelled&&<button disabled={busy} onClick={()=>void revoke()}>{c.cancelInvite}</button>}</>:<form onSubmit={event=>{event.preventDefault();void send();}}><label>{c.number}<input required autoComplete="off" inputMode="numeric" maxLength={32} value={number} disabled={busy||retryPending} onChange={event=>setNumber(event.target.value)}/></label>{!busy&&!retryPending&&<WenzeCamera locale={locale} requiredFormats={["qr_code"]} parseCode={customerNumberScan} scanCopy={{guide:c.scanGuide,invalid:c.invalid,timeout:c.scanTimeout}} onCode={setNumber}/>}<button disabled={busy||!number.trim()}>{busy?c.loading:retryPending?c.retry:c.send}</button></form>}<button type="button" disabled={busy} onClick={()=>setOpen(false)}>{c.cancel}</button></>}</aside>;
}
