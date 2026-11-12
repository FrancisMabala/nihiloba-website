"use client";
import {Fragment,useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {useWenzeApi,DashboardApiError} from '@/app/lib/wenze-seller-api';
import {moneyText} from '@/app/lib/wenze-money-copy';
import {sellerText} from '@/app/lib/wenze-seller-copy';
import {wenzeActionConfirmation} from '@/app/lib/wenze-action-confirmation';
import {leaveWork,useWorkDraft} from '@/app/lib/wenze-work';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
import {useWenzeConfirm} from './wenze-confirm';
import {moneyValue} from './wenze-money-dashboard';

type Target={name:string;option:string|null;product_ref:string;target_ref:string;target_type:string;price:string|null;sale_currency:string;unit_cost:string|null;currency:string|null;revision:number;image_url:string|null};
type Revision={revision:number;unit_cost:string|null;currency:string|null;changed_at:string};
const normalized=(s:string)=>s.trim().replace(/[\s\u202f]+/g,'').replace(',','.');
const valid=(s:string)=>/^\d{1,18}(\.\d{1,2})?$/.test(s);
const cents=(s:string)=>{const [whole,frac='']=s.split('.');return BigInt(whole)*BigInt(100)+BigInt(frac.padEnd(2,'0'));};
function margin(price:string|null,amount:string,locale:string,code:string){
 if(price===null||!valid(normalized(price))||!valid(amount))return '—';
 const diff=cents(normalized(price))-cents(amount),abs=diff<BigInt(0)?-diff:diff;
 const fraction=String(abs%BigInt(100)).padStart(2,'0').replace(/0+$/,'');
 const decimal=new Intl.NumberFormat(locale).formatToParts(1.1).find(p=>p.type==='decimal')?.value??'.';
 return (diff<BigInt(0)?'−':'')+new Intl.NumberFormat(locale).format(abs/BigInt(100))+(fraction?decimal+fraction:'')+' '+code;
}

export function PurchaseCosts({base,locale,initialFilter,initialCurrency}:{base:string;locale:WenzeLocale;initialFilter:boolean;initialCurrency:string}){
 const {request}=useWenzeApi(),{confirm,confirmation}=useWenzeConfirm(locale);
 const c=(key:string)=>moneyText(locale,key),t=(key:string)=>sellerText(locale,key);
 const [missing,setMissing]=useState(initialFilter),[search,setSearch]=useState(''),[offset,setOffset]=useState(0),[refresh,setRefresh]=useState(0);
 const [currencyFilter,setCurrencyFilter]=useState(initialCurrency),[page,setPage]=useState<{key:string;items:Target[];total:number}|null>(null);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[edit,setEdit]=useState<Target|null>(null),[amount,setAmount]=useState(''),[currency,setCurrency]=useState('CDF');
 const [saving,setSaving]=useState(false),[saveError,setSaveError]=useState(''),[history,setHistory]=useState<Revision[]|null>(null),[historyOpen,setHistoryOpen]=useState(false),[historyError,setHistoryError]=useState(false);
 const lock=useRef(false),editSequence=useRef(0);
 const path=(row:Target,history=false)=>base+'/products/'+encodeURIComponent(row.product_ref)+'/private-cost'+(history?'/history':'')+(row.target_type==='variant'?'?variant_ref='+encodeURIComponent(row.target_ref):'');
 const key=JSON.stringify([base,missing,currencyFilter,search,offset,refresh]);
 const value=normalized(amount),changed=!!edit&&(edit.unit_cost===null?!!amount:!valid(value)||cents(value)!==cents(edit.unit_cost)||currency!==edit.currency);
 useWorkDraft(changed,t('leave'));
 useEffect(()=>{let current=true;
  const params=new URLSearchParams({missing:String(missing),search,offset:String(offset),limit:'30'});
  if(currencyFilter)params.set('currency',currencyFilter);
  request(base+'/purchase-costs?'+params).then(raw=>{if(!current)return;setError('');const data=raw as {items:Target[];total:number};if(offset>0&&offset>=data.total){setOffset(Math.max(0,offset-30));return;}setPage({...data,key});}).catch(e=>{if(current){setPage(null);setEdit(null);setError(e instanceof DashboardApiError&&[403,404].includes(e.status)?'accessDenied':'unavailable');}});
  return()=>{current=false;};
 },[request,base,missing,currencyFilter,search,offset,refresh,key]);
 async function start(row:Target){if(!await leaveWork())return;editSequence.current++;setEdit(row);setAmount(row.unit_cost??'');setCurrency(row.currency??row.sale_currency);setHistory(null);setHistoryError(false);setHistoryOpen(false);setSaveError('');}
 async function showHistory(row:Target){
  const sequence=editSequence.current;setHistoryError(false);
  try{const result=await request(path(row,true)) as {history:Revision[]};if(sequence===editSequence.current)setHistory(result.history);}
  catch{if(sequence===editSequence.current)setHistoryError(true);}
 }
 async function save(row:Target,remove=false){
  if(lock.current)return;lock.current=true;setSaving(true);setSaveError('');setNotice('');
  try{await request(path(row),{method:remove?'DELETE':'PUT',body:JSON.stringify({expected_revision:row.revision,...(remove?{}:{amount:value,currency})})});
   setEdit(null);setNotice(c(remove?'costRemoved':'costSaved'));setRefresh(v=>v+1);
  }catch(e){if(e instanceof DashboardApiError&&[401,403,404].includes(e.status)){setPage(null);setEdit(null);setError('accessDenied');}else setSaveError(t(e instanceof DashboardApiError&&e.status===409?'conflict':'unavailable'));}
  finally{lock.current=false;setSaving(false);}
 }
 const shown=page?.key===key?page:null;
 const columns=[t('product'),c('sellingPrice'),c('unitCost'),c('unitMargin'),t('manage')];
 return <div className="wm-purchase">{confirmation}<div className="wm-cost-tools">
 <label><span className="wz-visually-hidden">{c('searchProduct')}</span><input type="search" placeholder={c('searchProduct')} value={search} disabled={saving} maxLength={180} onChange={async e=>{const next=e.target.value;if(!await leaveWork())return;setEdit(null);setOffset(0);setSearch(next);}}/></label>
 {[false,true].map(filter=><button key={String(filter)} disabled={saving} aria-pressed={missing===filter} onClick={async()=>{if(!await leaveWork())return;setEdit(null);setMissing(filter);setCurrencyFilter('');setOffset(0);const url=new URL(location.href);if(filter)url.searchParams.set('costFilter','missing');else url.searchParams.delete('costFilter');url.searchParams.delete('costCurrency');window.history.replaceState(window.history.state,'',url);}}>{c(filter?'missingFilter':'allProducts')}</button>)}{currencyFilter&&<small>{currencyFilter}</small>}</div>
 {notice&&<p role="status">{notice}</p>}{error?<p role="alert">{t(error)} <button onClick={()=>{setError('');setRefresh(v=>v+1);}}>{t('retry')}</button></p>:!shown?<p role="status">{t('loading')}</p>:!shown.items.length?<p>{search?c('noProducts'):missing?c('costComplete'):t('empty')}</p>:
 <table className="wm-cost-list wm-ledger"><thead><tr>{columns.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{shown.items.map(row=><Fragment key={row.target_ref}><tr>
 <th scope="row"><div className="wm-product-name">{row.image_url&&<Image unoptimized src={row.image_url} alt="" width={52} height={56}/>}<span>{row.name}{row.option&&<small>{row.option}</small>}</span></div></th>
 <td data-label={columns[1]}>{row.price===null?'—':moneyValue(row.price,locale)+' '+row.sale_currency}</td>
 <td data-label={columns[2]}>{row.unit_cost===null?<span className="wm-partial">{c('missing')}</span>:moneyValue(row.unit_cost,locale)+' '+row.currency}</td>
 <td data-label={columns[3]}>{row.currency===row.sale_currency&&row.unit_cost!==null?margin(row.price,row.unit_cost,locale,row.sale_currency):'—'}</td>
 <td><button disabled={saving} onClick={()=>void start(row)}>{c(row.unit_cost===null?'addCost':'editCost')}</button></td></tr>
 {edit?.target_ref===row.target_ref&&<tr className="wm-edit-row"><td colSpan={5}><section className="wm-editor"><h3>{c(edit.unit_cost===null?'addHeading':'editHeading')}</h3>
 <form onSubmit={e=>{e.preventDefault();if(changed&&valid(value)&&currency===row.sale_currency)void save(row);}}><div className="wm-edit-grid">
 <label>{c('costField')}<input name="amount" autoFocus inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} disabled={saving}/></label>
 <label>{t('currency')}<select value={currency} disabled={saving} onChange={e=>setCurrency(e.target.value)}><option>CDF</option><option>USD</option></select></label>
 <div className="wm-preview-margin" aria-live="polite">{c('previewMargin')}<strong>{currency!==row.sale_currency?'—':margin(row.price,value,locale,currency)}</strong></div></div>
 {currency!==row.sale_currency&&<p>{c('different')}</p>}<p>{c('privateFuture')}</p>{saveError&&<p role="alert">{saveError} {saveError===t('conflict')&&<button type="button" onClick={()=>{setEdit(null);setRefresh(v=>v+1);}}>{t('refresh')}</button>}</p>}<div className="wz-actions"><button className="seller-primary" disabled={saving||!changed||!valid(value)||currency!==row.sale_currency}>{t('save')}</button><button type="button" disabled={saving} onClick={()=>setEdit(null)}>{t('cancel')}</button></div></form>
 {edit.unit_cost!==null&&<button disabled={saving} onClick={()=>void confirm(c('removeCost'),wenzeActionConfirmation[locale].removeCost,()=>save(row,true))}>{c('removeCost')}</button>}
 <details open={historyOpen} onToggle={e=>{const open=e.currentTarget.open;setHistoryOpen(open);if(open&&!history)void showHistory(row);}}><summary>{c('costHistory')}</summary>{historyError?<button onClick={()=>void showHistory(row)}>{t('retry')}</button>:!history?t('loading'):history.map(h=><p key={h.revision}>{h.unit_cost===null?c('costRemoved'):moneyValue(h.unit_cost,locale)+' '+h.currency} · {new Date(h.changed_at).toLocaleString(locale)}</p>)}</details>
 </section></td></tr>}</Fragment>)}</tbody></table>}
 {shown&&shown.total>30&&<div className="wz-actions">{[-30,30].map(delta=><button key={delta} disabled={saving||offset+delta<0||offset+delta>=shown.total} onClick={async()=>{if(await leaveWork()){setEdit(null);setOffset(offset+delta);}}}>{t(delta<0?'previous':'next')}</button>)}</div>}</div>;
}
