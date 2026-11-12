"use client";
import {useEffect,useRef,useState} from 'react';
import {WenzeReceipt,type Receipt} from './wenze-pos';

import {SellerWorkspaceIcon} from './seller-workspace';
import {useWenzeApi} from '../../lib/wenze-seller-api';
import {moneyText} from '../../lib/wenze-money-copy';
import {posText} from '../../lib/wenze-pos-copy';
import {checkoutText} from '../../lib/wenze-checkout-copy';
import {sellerText} from '../../lib/wenze-seller-copy';
import {moneyValue} from './wenze-money-dashboard';
import type {WenzeLocale} from '../../lib/wenze-copy';

export function WenzeReceiptsBrowser({storeRef,locale,timeZone}:{storeRef:string;locale:WenzeLocale;timeZone:string}){
 const {request}=useWenzeApi(),m=(k:string)=>moneyText(locale,k),t=(k:string)=>posText(locale,k);
 const [receipts,setReceipts]=useState<Receipt[]>([]),[total,setTotal]=useState<number|null>(null),[offset,setOffset]=useState(0);
 const [selected,setSelected]=useState<Receipt|null>(null),[mobile,setMobile]=useState(false),[opened,setOpened]=useState(false);
 const [query,setQuery]=useState(''),[method,setMethod]=useState(''),[date,setDate]=useState(''),[status,setStatus]=useState("");
 const [busy,setBusy]=useState(true),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 const scroll=useRef(0);
 const triggers=useRef<Record<string,HTMLButtonElement|null>>({});
 useEffect(()=>{const media=window.matchMedia('(max-width:760px)'),update=()=>setMobile(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{let active=true;
  const params=new URLSearchParams({offset:String(offset),limit:"20",timezone:timeZone,search:query.trim()});
  if(method)params.set("payment",method);if(date)params.set("day",date);if(status)params.set("status",status);
  request(`wenze/contexts/personal/stores/${encodeURIComponent(storeRef)}/pos/receipts?${params}`).then(value=>{
   if(!active)return;const data=value as {receipts:Receipt[];total:number};setReceipts(data.receipts);setSelected(previous=>data.receipts.find(row=>row.receipt_ref===previous?.receipt_ref)??data.receipts[0]??null);setTotal(data.total);setBusy(false);
  }).catch(()=>{if(active){setReceipts([]);setTotal(null);setSelected(null);setError(true);setBusy(false);}});
  return()=>{active=false;};
 },[storeRef,offset,retry,request,query,date,method,status,timeZone]);
 const dateText=(value:string)=>new Intl.DateTimeFormat(locale,{timeZone,dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
 const matches=receipts;
 function close(){setOpened(false);requestAnimationFrame(()=>{if(selected)triggers.current[selected.receipt_ref]?.focus({preventScroll:true});window.scrollTo(0,scroll.current);});}
 function page(next:number){setBusy(true);setError(false);setOpened(false);setOffset(next);}
 function reset(){page(0);setStatus("");setQuery("");setDate("");setMethod("");}
 const preview=selected&&<WenzeReceipt key={selected.receipt_ref} receipt={selected} locale={locale} onClose={close} management timeZone={timeZone}/>;
 return <div className="wm-receipts"><div className="wm-receipts-layout"><section className="wm-receipt-list" hidden={mobile&&opened} aria-label={t('receipts')}><h3>{total===null?t('receipts'):`${total} ${m(total===1?'receiptCount':'receiptCounts')}`}</h3>
 <div className="wm-receipt-filters"><label>{m('referenceSearch')}<input type="search" value={query} onChange={e=>{page(0);setQuery(e.target.value);}}/></label><details open={!mobile||undefined}><summary>{m('filters')}</summary><div className="wm-ticket-filters">
 <label>{sellerText(locale,'occurred_on')}<input type="date" value={date} onChange={e=>{page(0);setDate(e.target.value);}}/></label>
 <label>{checkoutText(locale,'method')}<select value={method} onChange={e=>{page(0);setMethod(e.target.value);}}><option value="">{m('allMethods')}</option>{['cash','mobile','card'].map(k=><option key={k} value={`seller_recorded_${k}`}>{checkoutText(locale,k)}</option>)}</select></label>
 <label>{sellerText(locale,'status')}<select value={status} onChange={e=>{page(0);setStatus(e.target.value);}}><option value="">{m('allStates')}</option><option value="available">{m('receiptsAvailable')}</option><option value="cancelled">{m('receiptsCancelled')}</option></select></label></div></details></div>
 {busy&&<p role="status">{t('loading')}</p>}{error&&<p role="alert">{t('error')} <button onClick={()=>{setBusy(true);setError(false);setRetry(v=>v+1);}}>{t('retry')}</button></p>}
 {!busy&&!error&&!matches.length&&<div className="wm-empty">{query||date||method||status?<><p>{m('noReceiptResults')}</p><button onClick={reset}>{m('resetFilters')}</button></>:m('noStoreReceipts')}</div>}
 {!busy&&matches.map(r=><button className="wz-receipt-history" ref={el=>{triggers.current[r.receipt_ref]=el;}} aria-pressed={selected?.receipt_ref===r.receipt_ref} key={r.receipt_ref} onClick={()=>{scroll.current=window.scrollY;setSelected(r);setOpened(true);if(mobile)window.scrollTo(0,0);}}><span className="wm-receipt-icon"><SellerWorkspaceIcon name="document"/></span><span>{dateText(r.sold_at)}</span><strong>{r.totals.map(v=>`${moneyValue(v.amount,locale)} ${v.currency}`).join(' · ')}</strong><b>{r.receipt_ref}</b><small>{r.payment.startsWith('seller_recorded_')?checkoutText(locale,r.payment.replace('seller_recorded_','')):t(r.payment==='verified'?'verified':'not_recorded')}</small><small className="wm-status">{r.has_reversals&&r.lines.every(line=>line.reversed)?t('reversed'):m('availableReceipt')}</small></button>)}
 <div className="wz-actions"><button disabled={busy||offset===0} onClick={()=>page(offset-20)}>{t('previous')}</button><span>{Math.floor(offset/20)+1}</span><button disabled={busy||total===null||offset+20>=total} onClick={()=>page(offset+20)}>{t('next')}</button></div></section>
 {(!mobile||opened)&&<aside className="wm-receipt-preview">{!busy&&preview}</aside>}</div></div>;
}
