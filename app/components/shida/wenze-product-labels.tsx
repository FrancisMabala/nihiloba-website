"use client";
import {useEffect,useRef,useState} from 'react';
import {useWenzeApi} from '@/app/lib/wenze-seller-api';
import {posText} from '@/app/lib/wenze-pos-copy';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
import './wenze-product-labels.css';

type Label={barcode:string;shop_name:string;name:string;variant:string|null;price:string;currency:string;bars:number[][];width:number};
type Product={public_ref:string;status:string;variant_type?:string|null;has_variants?:boolean;variants?:{public_ref:string;is_available:string}[]};
export function WenzeProductLabels({storeRef,productRefs,locale}:{storeRef:string;productRefs:string[];locale:WenzeLocale}){
 const {request,file}=useWenzeApi(),t=(key:string)=>posText(locale,key);
 const [labels,setLabels]=useState<Label[]>([]),[copies,setCopies]=useState<Record<string,number>>({}),[busy,setBusy]=useState(true),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[ready,setReady]=useState(false);
 const lock=useRef(false),base=`wenze/contexts/personal/stores/${encodeURIComponent(storeRef)}`,scope=productRefs.join(',');
 useEffect(()=>{let active=true;
  async function load(){await Promise.resolve();if(!active)return;setBusy(true);setReady(false);setFailed(false);setLabels([]);try{
   const products=await Promise.all(scope.split(',').filter(Boolean).map(ref=>request(`${base}/products/${encodeURIComponent(ref)}`) as Promise<Product>));
   const codes=products.filter(p=>p.status==='active').flatMap(p=>p.has_variants||p.variant_type?(p.variants??[]).filter(v=>v.is_available==='yes').map(v=>v.public_ref):[p.public_ref]);
   const result=await Promise.all(codes.map(code=>request(`${base}/labels/${encodeURIComponent(code)}`) as Promise<Label>));
   if(active){setLabels(result);setCopies(old=>Object.fromEntries(result.map(l=>[l.barcode,old[l.barcode]??1])));setReady(true);}
  }catch{if(active)setFailed(true);}finally{if(active)setBusy(false);}}
  void load();return()=>{active=false;};
 },[base,scope,attempt,request]);
 const selected=labels.filter(l=>(copies[l.barcode]??0)>0),total=selected.reduce((n,l)=>n+copies[l.barcode],0),valid=selected.length>0&&selected.length<=50&&total<=200;
 async function output(print:boolean){if(lock.current||!valid)return;lock.current=true;setBusy(true);setFailed(false);const tab=print?window.open('about:blank','_blank'):null;if(tab)tab.opener=null;
  try{const pdf=await file(`${base}/labels/pdf`,{method:'POST',body:JSON.stringify({items:selected.map(l=>({code:l.barcode,copies:copies[l.barcode]}))})});const url=URL.createObjectURL(pdf);if(tab)tab.location.href=url;else{const a=document.createElement('a');a.href=url;a.download=pdf.name;a.click();}setTimeout(()=>URL.revokeObjectURL(url),120000);}catch{tab?.close();setFailed(true);}finally{setBusy(false);lock.current=false;}}
 return <section className="wp-labels" aria-label={t('labels')} aria-busy={busy}><h3>{t('labels')}</h3><p>{t('labelHint')}</p>{busy&&<p role="status">{t('loading')}</p>}{failed&&<p role="alert">{t('labelError')} <button disabled={busy} onClick={()=>setAttempt(n=>n+1)}>{t('retryLabel')}</button></p>}{ready&&!labels.length&&<p role="status">{t('labelUnavailable')}</p>}{ready&&labels.length>0&&<><p role="status">{t('labelReady')}</p><div className="wp-label-grid">{labels.map(l=><article key={l.barcode}><div className="wz-label-paper"><small>{l.shop_name}</small><strong>{l.name}</strong>{l.variant&&<span>{l.variant}</span>}<b>{new Intl.NumberFormat(locale).format(Number(l.price))} {l.currency}</b><svg role="img" aria-label={l.barcode} viewBox={`0 0 ${l.width} 40`}>{l.bars.map(([x,w],i)=><rect key={i} x={x} y={0} width={w} height={40} fill="black"/>)}</svg><small>{l.barcode}</small></div><label>{t('copies')} · {l.variant||l.name}<input type="number" min="0" max="100" step="1" value={copies[l.barcode]??1} onChange={e=>setCopies({...copies,[l.barcode]:Math.max(0,Math.min(100,Math.floor(Number(e.target.value)||0)))})}/></label></article>)}</div><div className="wz-actions"><button className="seller-primary" disabled={busy||!valid} onClick={()=>void output(true)}>{t('print')}</button><button disabled={busy||!valid} onClick={()=>void output(false)}>{t('download')}</button></div>{!valid&&<p>{t('labelLimit')}</p>}</>}</section>;
}
