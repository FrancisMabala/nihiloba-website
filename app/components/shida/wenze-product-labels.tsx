"use client";
import {useEffect,useRef,useState} from 'react';
import {useWenzeApi} from '@/app/lib/wenze-seller-api';
import {posText} from '@/app/lib/wenze-pos-copy';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
import './wenze-product-labels.css';

import {savedText} from '@/app/lib/wenze-saved';
import {ShopIcon} from './wenze-shop-icons';
import {creationText} from '@/app/lib/wenze-creation';
type Label={available:number|null;barcode:string;shop_name:string;name:string;variant:string|null;price:string;currency:string;bars:number[][];width:number};
type Product={public_ref:string;status:string;available_stock?:number|null;variant_type?:string|null;has_variants?:boolean;variants?:{public_ref:string;available_stock?:number|null;is_available:string}[]};
export function WenzeProductLabels({storeRef,productRefs,locale,confirmation=false,onOpen}:{onOpen?:()=>void;confirmation?:boolean;storeRef:string;productRefs:string[];locale:WenzeLocale}){
 const {request,file}=useWenzeApi(),t=(key:string)=>posText(locale,key);
 const [labels,setLabels]=useState<Label[]>([]),[copies,setCopies]=useState<Record<string,number>>({}),[busy,setBusy]=useState(true),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[ready,setReady]=useState(false);
 const [selectedCode,setSelectedCode]=useState(''),[expanded,setExpanded]=useState(false);

 const sc=savedText.bind(null,locale);
 const lock=useRef(false),base=`wenze/contexts/personal/stores/${encodeURIComponent(storeRef)}`,scope=productRefs.join(',');
 useEffect(()=>{let active=true;
  async function load(){await Promise.resolve();if(!active)return;setBusy(true);setReady(false);setFailed(false);setLabels([]);try{
   const products=await Promise.all(scope.split(',').filter(Boolean).map(ref=>request(`${base}/products/${encodeURIComponent(ref)}`) as Promise<Product>));
   const codes=products.filter(p=>p.status==='active').flatMap(p=>p.has_variants||p.variant_type?(p.variants??[]).filter(v=>v.is_available==='yes').map(v=>({ref:v.public_ref,available:v.available_stock??null})):[{ref:p.public_ref,available:p.available_stock??null}]);
   const result=await Promise.all(codes.map(async code=>({...await request(`${base}/labels/${encodeURIComponent(code.ref)}`) as Label,available:code.available})));
   if(active){setExpanded(window.matchMedia('(min-width:761px)').matches);setLabels(result);setCopies(old=>Object.fromEntries(result.map(l=>[l.barcode,old[l.barcode]??1])));setReady(true);}
  }catch{if(active)setFailed(true);}finally{if(active)setBusy(false);}}
  void load();return()=>{active=false;};
 },[base,scope,attempt,request]);
 const selected=labels.filter(l=>(copies[l.barcode]??0)>0),total=selected.reduce((n,l)=>n+copies[l.barcode],0),valid=selected.length>0&&selected.length<=50&&total<=200&&selected.every(l=>Number.isInteger(copies[l.barcode])&&copies[l.barcode]<=100);
 async function output(print:boolean){if(lock.current||!valid)return;lock.current=true;setBusy(true);setFailed(false);const tab=print?window.open('about:blank','_blank'):null;if(tab)tab.opener=null;
  try{const pdf=await file(`${base}/labels/pdf`,{method:'POST',body:JSON.stringify({items:selected.map(l=>({code:l.barcode,copies:copies[l.barcode]}))})});const url=URL.createObjectURL(pdf);if(tab)tab.location.href=url;else{const a=document.createElement('a');a.href=url;a.download=pdf.name;a.click();}setTimeout(()=>URL.revokeObjectURL(url),120000);}catch{tab?.close();setFailed(true);}finally{setBusy(false);lock.current=false;}}
 if(confirmation&&failed)return <div className="wc-warning" role="alert"><strong><ShopIcon name="tag"/>{creationText(locale,'labelsFail')}</strong><button type="button" disabled={busy} onClick={()=>setAttempt(n=>n+1)}>{creationText(locale,'retryLabels')}</button></div>;
 const current=labels.find(l=>l.barcode===selectedCode)??labels[0];
 if(confirmation&&ready&&onOpen)return <button type="button" className="wc-label-entry" onClick={onOpen}>{sc('printLabels')}</button>;
 return <section className="wp-labels wd-labels" aria-label={t('labels')} aria-busy={busy}><h2>{sc('printLabels')}</h2><p>{sc('format')}</p>{busy&&<p role="status">{t('loading')}</p>}{failed&&<p role="alert">{t('labelError')} <button disabled={busy} onClick={()=>setAttempt(n=>n+1)}>{t('retryLabel')}</button></p>}{ready&&!labels.length&&<p role="status">{t('labelUnavailable')}</p>}{ready&&current&&<>
 <div className="wd-label-grid"><div className="wc-card"><table><thead><tr><th>{sc('version')}</th><th>{sc('pieces')}</th><th>{sc('copies')}</th></tr></thead><tbody>{labels.map(l=><tr key={l.barcode} data-selected={current.barcode===l.barcode}><td><button type="button" aria-pressed={current.barcode===l.barcode} onClick={()=>setSelectedCode(l.barcode)}>{productRefs.length>1?l.name+' · ':''}{l.variant||l.name}</button></td><td>{l.available??'—'}</td><td><input type="number" aria-label={sc('copies')+' · '+(l.variant||l.name)} min="0" max="100" step="1" value={copies[l.barcode]??1} onFocus={()=>setSelectedCode(l.barcode)} onChange={e=>setCopies({...copies,[l.barcode]:Math.max(0,Number(e.target.value)||0)})}/></td></tr>)}</tbody></table>
 <button type="button" disabled={busy||labels.every(l=>l.available==null)} onClick={()=>setCopies(Object.fromEntries(labels.map(l=>[l.barcode,l.available??0])))}>{sc('each')}</button></div>
 <details className="wc-card" open={expanded} onToggle={ev=>setExpanded(ev.currentTarget.open)}><summary>{sc('preview')}</summary><div className="wz-label-paper"><small>{current.shop_name}</small><strong>{current.name}</strong>{current.variant&&<span>{current.variant}</span>}<b>{new Intl.NumberFormat(locale).format(Number(current.price))} {current.currency}</b><svg role="img" aria-label={current.barcode} viewBox={`0 0 ${current.width} 40`}>{current.bars.map(([x,w],i)=><rect key={i} x={x} y={0} width={w} height={40} fill="black"/>)}</svg><small>{current.barcode}</small></div></details></div>
 <div className="wc-actions"><button className="seller-primary" disabled={busy||!valid} onClick={()=>void output(true)}>{sc(total===1?'printOne':'printCount',total)}</button><button disabled={busy||!valid} onClick={()=>void output(false)}>{t('download')}</button></div>{!valid&&total>0&&<p>{t('labelLimit')}</p>}</>}</section>;
}
