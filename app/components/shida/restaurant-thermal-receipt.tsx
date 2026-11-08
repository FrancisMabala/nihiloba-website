'use client';
import {useEffect,useRef,useState} from 'react';
import {receiptCopy} from '../../lib/restaurant-receipt-copy';
import {counterCopy} from '../../lib/restaurant-counter-copy';
import {displayMoney} from '../../lib/restaurant-counter-values';
import './restaurant-thermal-receipt.css';
type Line={name:string;quantity?:number;subtotal?:string;portion_label?:string;extras?:{key:string;label:string}[]};
export type CustomerReceipt={number:string;restaurant:string;date:string;currency:string;total:string;paid:boolean;standalone:Line[];plates:Line[][];payments:{method:string;amount:string;kind:string;received?:string|null;change?:string|null}[];url:string|null;food_subtotal:string;delivery_fee:string|null};
export function ThermalReceipt({value,locale,paper=80,qrOnly=false,onReady}:{value:CustomerReceipt;locale:keyof typeof receiptCopy;paper?:58|80;qrOnly?:boolean;onReady?:(url:string)=>void}){
 const receiptUrl=value.url?.replace(/language=(fr|en|ln|sw)/,'language='+locale);
 const c=receiptCopy[locale],canvas=useRef<HTMLCanvasElement>(null),[qrState,setQrState]=useState<{url:string;status:'ready'|'error'}|null>(null);
 const ready=!!receiptUrl&&qrState?.url===receiptUrl&&qrState.status==='ready';
 const error=!!receiptUrl&&qrState?.url===receiptUrl&&qrState.status==='error';
 useEffect(()=>{
  let alive=true;
  if(receiptUrl)void import('qrcode').then(async q=>{
   if(!alive||!canvas.current)return;
   await q.toCanvas(canvas.current,receiptUrl,{width:192,margin:4,errorCorrectionLevel:'M'});
   if(alive){setQrState({url:receiptUrl,status:'ready'});onReady?.(receiptUrl);}
  }).catch(()=>{if(alive)setQrState({url:receiptUrl,status:'error'});});
  return()=>{alive=false;};
 },[receiptUrl,onReady]);

 const money=(amount:string)=>displayMoney(amount,locale);
 const lines=(items:Line[])=>items.map((l,i)=><div className="rst-ticket-line" key={i}><span>{l.quantity!=null&&`${l.quantity} × `}{l.name}{l.portion_label&&<small>{l.portion_label}</small>}{l.extras?.map((x,j)=><small key={j}>+ {x.label}</small>)}</span><span>{l.subtotal?money(l.subtotal):''}</span></div>);
 return <section className={'rst-thermal '+(paper===58?'is-58':'')+(qrOnly?' qr-only':'')}>
 {!qrOnly&&<><h3>{value.restaurant}</h3><p>{c.receipt} {value.number}</p><p>{new Date(value.date).toLocaleString(locale==='ln'?'fr':locale)}</p><hr/>{lines(value.standalone)}{value.plates.map((p,i)=><div key={i}><h4>#{i+1}</h4>{lines(p)}</div>)}<hr/>{value.delivery_fee&&Number(value.delivery_fee)>0&&<p>+ {money(value.delivery_fee)} {value.currency}</p>}<div className="rst-ticket-total"><b>{c.total}</b><b>{money(value.total)} {value.currency}</b></div><p><b>{value.paid?c.paid:c.due}</b></p>{value.payments.map((p,i)=><p key={i}>{p.method} · {['refund','reversal'].includes(p.kind)?'− ':''}{money(p.amount)} {value.currency}{p.received!=null&&<small>{counterCopy(locale).received}: {money(p.received)} · {counterCopy(locale).change}: {money(p.change??'0')}</small>}</p>)}</>}
 {qrOnly&&<h3>{c.scan}</h3>}<canvas ref={canvas} aria-label={c.qr} role="img" hidden={!ready}/>{(error||!value.url)&&<p role="status">{c.qrUnavailable}</p>}{value.url&&<a className="rst-ticket-link" href={receiptUrl} target="_blank" rel="noopener noreferrer">{c.pdf}</a>}
 {!qrOnly&&<><p className="rst-ticket-disclaimer">{c.commercial}</p><small>{c.powered}</small></>}
 </section>;
}
