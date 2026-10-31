"use client";
import {useEffect,useRef,useState} from 'react';
import {WenzeReceipt,type Receipt} from './wenze-pos';
import {CheckoutDialog} from './wenze-checkout-dialog';
import {SellerWorkspaceIcon} from './seller-workspace';
import {useWenzeApi} from '../../lib/wenze-seller-api';
import {moneyText} from '../../lib/wenze-money-copy';
import {posText} from '../../lib/wenze-pos-copy';
import {checkoutText} from '../../lib/wenze-checkout-copy';
import {sellerText} from '../../lib/wenze-seller-copy';
import {moneyValue} from './wenze-money-dashboard';
import type {WenzeLocale} from '../../lib/wenze-copy';

// The existing receipt API is paginated, without server search. Filters are
// explicitly scoped to the current page; never infer all-time financial totals.
export function WenzeReceiptsBrowser({storeRef,locale,timeZone}:{storeRef:string;locale:WenzeLocale;timeZone:string}){
 const {request}=useWenzeApi(),m=(k:string)=>moneyText(locale,k),t=(k:string)=>posText(locale,k);
 const [receipts,setReceipts]=useState<Receipt[]>([]),[total,setTotal]=useState<number|null>(null),[offset,setOffset]=useState(0);
 const [selected,setSelected]=useState<Receipt|null>(null),[mobile,setMobile]=useState(false),[opened,setOpened]=useState(false);
 const [query,setQuery]=useState(''),[method,setMethod]=useState(''),[date,setDate]=useState(''),[reversed,setReversed]=useState(false);
 const [busy,setBusy]=useState(true),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 const triggers=useRef<Record<string,HTMLButtonElement|null>>({});
 useEffect(()=>{const media=window.matchMedia('(max-width:760px)'),update=()=>setMobile(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{let active=true;
  request(`wenze/contexts/personal/stores/${encodeURIComponent(storeRef)}/pos/receipts?offset=${offset}&limit=20`).then(value=>{
   if(!active)return;const data=value as {receipts:Receipt[];total:number};setReceipts(data.receipts);setTotal(data.total);setBusy(false);
  }).catch(()=>{if(active){setReceipts([]);setTotal(null);setSelected(null);setError(true);setBusy(false);}});
  return()=>{active=false;};
 },[storeRef,offset,retry,request]);
 const localDate=(value:string)=>new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
 const dateText=(value:string)=>new Intl.DateTimeFormat(locale,{timeZone,dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
 const matches=receipts.filter(r=>(!method||r.payment===method)&&(!date||localDate(r.sold_at)===date)&&(!reversed||r.has_reversals)&&[r.receipt_ref,dateText(r.sold_at),localDate(r.sold_at),...r.totals.flatMap(v=>[v.amount,moneyValue(v.amount,locale),v.currency])].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 function close(){setOpened(false);if(selected)triggers.current[selected.receipt_ref]?.focus();}
 function page(next:number){setBusy(true);setError(false);setReceipts([]);setSelected(null);setOpened(false);setOffset(next);}
 const preview=selected&&<WenzeReceipt key={selected.receipt_ref} receipt={selected} locale={locale} onClose={close} management timeZone={timeZone}/>;
 return <div className="wm-receipts"><p>{m('receiptIntro')}</p>{busy&&<p role="status">{t('loading')}</p>}{error&&<p role="alert">{t('error')} <button onClick={()=>{setError(false);setBusy(true);setRetry(v=>v+1);}}>{t('retry')}</button></p>}
 {total!==null&&<div className="wm-receipt-summary"><span className="wm-receipt-icon"><SellerWorkspaceIcon name="document"/></span><div><span>{m('totalReceipts')}</span><strong>{moneyValue(total,locale)}</strong></div></div>}
 <div className="wm-receipts-layout"><section className="wm-receipt-list" aria-label={t('receipts')}><div className="wm-receipt-filters"><label>{m('receiptSearch')}<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><details><summary>{m('filters')}</summary><label>{checkoutText(locale,'method')}<select value={method} onChange={e=>setMethod(e.target.value)}><option value="">{m('allMethods')}</option>{['cash','mobile','card'].map(k=><option key={k} value={`seller_recorded_${k}`}>{checkoutText(locale,k)}</option>)}</select></label><label>{sellerText(locale,'occurred_on')}<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label><input type="checkbox" checked={reversed} onChange={e=>setReversed(e.target.checked)}/>{t('reversed')}</label></details></div><p className="wm-page-scope">{m('pageFilterHelp')}</p>
 {!busy&&!error&&!matches.length&&<p className="wm-empty">{receipts.length?m('noMatches'):t('noReceipts')}</p>}
 {matches.map(r=><button className="wz-receipt-history" ref={el=>{triggers.current[r.receipt_ref]=el;}} aria-pressed={selected?.receipt_ref===r.receipt_ref&&opened} key={r.receipt_ref} onClick={()=>{setSelected(r);setOpened(true);}}><span className="wm-receipt-icon"><SellerWorkspaceIcon name="document"/></span><span>{dateText(r.sold_at)}</span><strong>{r.totals.map(v=>`${moneyValue(v.amount,locale)} ${v.currency}`).join(' · ')}</strong><b>{r.receipt_ref}</b><small>{r.payment.startsWith('seller_recorded_')?checkoutText(locale,r.payment.replace('seller_recorded_','')):t(r.payment==='verified'?'verified':'not_recorded')}</small><small className="wm-status">{r.has_reversals?t('reversed'):selected?.receipt_ref===r.receipt_ref&&opened?m('selected'):m('availableReceipt')}</small></button>)}
 <div className="wz-actions"><button disabled={busy||offset===0} onClick={()=>page(offset-20)}>{t('previous')}</button><span>{Math.floor(offset/20)+1}</span><button disabled={busy||total===null||offset+20>=total} onClick={()=>page(offset+20)}>{t('next')}</button></div></section>
 {!mobile&&<aside className="wm-receipt-preview">{opened&&preview?preview:<div className="wm-receipt-placeholder"><SellerWorkspaceIcon name="document"/><p>{m('selectReceipt')}</p></div>}</aside>}</div>
 {mobile&&opened&&selected&&<CheckoutDialog title={m('receiptPreview')} locale={locale} onClose={close}>{preview}</CheckoutDialog>}
 </div>;
}
