'use client';
import {useEffect,useState} from 'react';
import {request} from '../../lib/restaurant-seller-browser';
import {financeText as text,type FinanceKey} from '../../lib/restaurant-finance-design-copy';
import {formatMoney,moneyCents} from '../../lib/restaurant-finance-display';
type Row={entry_ref:string;kind:string;description:string|null;amount:string;currency:string;recorded_at:string;method:string|null};
export function RestaurantFinanceHistory({path,binding,locale,date,currency,zone}:{path:string;binding:string;locale:string;date:string;currency:string;zone?:string|null}){
 const [rows,setRows]=useState<Row[]|null>(null),[before,setBefore]=useState(''),[next,setNext]=useState<string|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);const t=(key:FinanceKey)=>text(locale,key);
 useEffect(()=>{let active=true;const timer=setTimeout(()=>{setError(false);void request(`${path}/service/financial/activity?${new URLSearchParams({local_date:date,currency,before,limit:'50'})}`,{},binding).then(result=>{if(!active)return;const data=result as {items:Row[];next_before:string|null};setRows(old=>before?[...(old??[]),...data.items]:data.items);setNext(data.next_before);}).catch(()=>{if(active)setError(true);});},0);return()=>{active=false;clearTimeout(timer);};},[path,binding,date,currency,before,retry]);
 return <section className="rst-finance-recent"><h3>{t('history')}</h3>{rows?.map(row=><article key={row.entry_ref}><div><strong>{row.description||t(row.kind==='refund'?'refundOperation':row.kind as FinanceKey)}</strong><small>{new Date(row.recorded_at).toLocaleString(locale==='ln'?'fr':locale,{timeZone:zone??undefined})} · {row.method??t('cash')}</small></div><b>{moneyCents(row.amount)>=BigInt(0)?'+ ':''}{formatMoney(row.amount,locale)} {row.currency}</b></article>)}{error?<p role="alert">{t('error')} <button onClick={()=>setRetry(n=>n+1)}>{t('retry')}</button></p>:rows===null?<p>{t('loading')}</p>:rows.length===0?<p>{t('none')}</p>:null}{next&&<button onClick={()=>setBefore(next)}>{t('more')}</button>}</section>;
}
