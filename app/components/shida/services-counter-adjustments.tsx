"use client";
import {useEffect, useRef, useState} from "react";
import {counterAdjustmentCopy} from "../../lib/services-counter-adjustment-copy";
import {counterCopy} from "../../lib/services-counter-copy";
import {financeReviewCopy} from "../../lib/services-finance-copy";
import {useFinancialCommand, type FinancialCommand} from "../../lib/services-financial-state";
import {useWorkDraft} from "../../lib/restaurant-work";
import {serviceLocalInput} from "../../lib/service-time";
import {counterCents, type CounterSale, type Offering, type Line} from "./services-counter";
import type {ProviderLocale} from "../../lib/services-provider-copy";

export type AdjustmentKind="refund"|"payment_reversal"|"bill_correction";
export type AdjustmentReason="customer_refund"|"wrong_amount"|"wrong_items"|"wrong_customer"|"duplicate_record"|"other";
const reasons:AdjustmentReason[]=["customer_refund","wrong_amount","wrong_items","wrong_customer","duplicate_record","other"];
const today=()=>serviceLocalInput(new Date().toISOString()).slice(0,10);
const money=(n:bigint)=>`${n/BigInt(100)}.${String(n%BigInt(100)).padStart(2,"0")}`;

export function ServicesCounterAdjustments({sale,offerings,base,binding,locale,disabled,onSaved,onBusy,onDenied}:{sale:CounterSale;offerings:Offering[];base:string;binding:string;locale:ProviderLocale;disabled:boolean;onSaved:(sale:CounterSale)=>void;onBusy:(busy:boolean)=>void;onDenied:()=>void}){
 const a=counterAdjustmentCopy[locale],t=counterCopy[locale],c=financeReviewCopy[locale],command=useFinancialCommand(binding);
 const [kind,setKind]=useState<AdjustmentKind>("refund"),[reason,setReason]=useState<AdjustmentReason>("customer_refund");
 const [amount,setAmount]=useState(""),[method,setMethod]=useState("cash"),[date,setDate]=useState(today),[receipt,setReceipt]=useState("");
 const [customer,setCustomer]=useState(sale.customer_name??""),[lines,setLines]=useState<Line[]>(sale.lines);
 const [offering,setOffering]=useState(""),[pack,setPack]=useState(""),[price,setPrice]=useState("");
 const [review,setReview]=useState<FinancialCommand|null>(null),[error,setError]=useState("");
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const busy=command.busy||!!command.pending||!!review;
 useEffect(()=>{onBusy(busy);return()=>onBusy(false);},[busy,onBusy]);
 useEffect(()=>{if(command.status==="denied")onDenied();},[command.status,onDenied]);
 useWorkDraft(!!amount||customer!==(sale.customer_name??"")||JSON.stringify(lines)!==JSON.stringify(sale.lines)||!!command.pending,a.review);
 const service=offerings.find(o=>o.public_ref===offering),pkg=service?.packages.find(p=>p.public_ref===pack);
 const credits=sale.lines.reduce((sum,l)=>sum+counterCents(l.amount),BigInt(0))-counterCents(sale.total);
 const total=lines.reduce((sum,l)=>sum+counterCents(l.amount),BigInt(0))-credits;
 function add(){try{const unit=counterCents(price);if(!service||unit<=BigInt(0)||lines.length>=30)throw Error();setLines(old=>[...old,{offering_ref:offering,package_ref:pack||null,quantity:1,unit_price:money(unit),service_name:service.service_name,package_name:pkg?.name??null,amount:money(unit)}]);setError("");}catch{setError(a.invalid);}}
 function quantity(index:number,value:number){if(!Number.isInteger(value)||value<1||value>100)return;setLines(old=>old.map((l,i)=>i===index?{...l,quantity:value,amount:money(counterCents(l.unit_price)*BigInt(value))}:l));}
 function prepare(){try{
  if(sale.revision===undefined||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today())throw Error();
  const body:Record<string,unknown>={kind,expected_revision:sale.revision,reason_code:reason,effective_date:date};
  if(kind==="refund"){const n=counterCents(amount);if(n<=BigInt(0)||n>counterCents(sale.received))throw Error();body.amount=money(n);body.method=method;}
  else if(kind==="payment_reversal"){if(!sale.payments.some(p=>p.receipt_ref===receipt&&!p.reversed))throw Error();body.receipt_ref=receipt;}
  else {if(!lines.length||total<BigInt(0))throw Error();body.lines=lines.map(({offering_ref,package_ref,quantity,unit_price})=>({offering_ref,package_ref,quantity,unit_price}));body.customer_name=customer.trim()||null;}
  setReview({path:`${base}/transactions/finance/counter/${sale.sale_ref}/adjustments`,method:"POST",key:crypto.randomUUID(),body:JSON.stringify(body)});setError("");
 }catch{setError(a.invalid);}}
 async function confirm(){const result=await command.run<CounterSale>(command.pending??review??undefined);if(alive.current&&result){setReview(null);setAmount("");onSaved(result);}}
 return <section className="svc-counter-adjustments"><h3>{a.title}</h3>
  <p>{a.net}: {sale.received} {sale.currency} · {a.refundDue}: {sale.refund_due??"0.00"} {sale.currency}</p>
  <fieldset className="svc-counter-form" disabled={disabled||busy}>
   <label>{a.title}<select value={kind} onChange={e=>{const k=e.target.value as AdjustmentKind;setKind(k);setReason(k==="refund"?"customer_refund":k==="bill_correction"?"wrong_items":"wrong_amount");}}>{(["refund","payment_reversal","bill_correction"] as const).map(k=><option value={k} key={k}>{a[k]}</option>)}</select></label>
   <p>{kind==="refund"?a.refundHelp:kind==="payment_reversal"?a.reversalHelp:a.correctionHelp}</p>
   {kind==="refund"&&<><label>{a.amount}<input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>{t.method}<select value={method} onChange={e=>setMethod(e.target.value)}>{(["cash","mobile_money","bank","other"] as const).map(m=><option key={m} value={m}>{t[m]}</option>)}</select></label></>}
   {kind==="payment_reversal"&&<label>{t.receiptChoice}<select value={receipt} onChange={e=>setReceipt(e.target.value)}><option value="">—</option>{sale.payments.filter(p=>!p.reversed).map(p=><option key={p.receipt_ref} value={p.receipt_ref}>{p.receipt_ref} · {p.amount} {sale.currency}</option>)}</select></label>}
   {kind==="bill_correction"&&<>
    <label>{t.customer}<input maxLength={120} value={customer} onChange={e=>setCustomer(e.target.value)}/></label>
    <ul>{lines.map((l,i)=><li key={i}><strong>{l.service_name} {l.package_name}</strong><label>{t.quantity}<input type="number" min={1} max={100} value={l.quantity} onChange={e=>quantity(i,Number(e.target.value))}/></label><span>{l.unit_price} × {l.quantity} = {l.amount} {sale.currency}</span><button type="button" onClick={()=>setLines(old=>old.filter((_,j)=>i!==j))}>{t.remove}</button></li>)}</ul>
    <label>{t.service}<select value={offering} onChange={e=>{setOffering(e.target.value);setPack("");setPrice("");}}><option value="">—</option>{offerings.filter(o=>o.is_active==="yes").map(o=><option key={o.public_ref} value={o.public_ref}>{o.service_name}</option>)}</select></label>
    <label>{t.package}<select value={pack} onChange={e=>{setPack(e.target.value);setPrice(service?.packages.find(p=>p.public_ref===e.target.value)?.price??"");}}><option value="">{t.custom}</option>{service?.packages.filter(p=>!p.price||p.currency===sale.currency).map(p=><option key={p.public_ref} value={p.public_ref}>{p.name}</option>)}</select></label>
    <label>{t.price}<input inputMode="decimal" value={price} readOnly={!!pkg?.price} onChange={e=>setPrice(e.target.value)}/></label><button type="button" onClick={add}>{t.add}</button><strong>{t.total}: {(total<BigInt(0)?a.invalid:money(total))} {sale.currency}</strong>
   </>}
   <label>{a.reason}<select value={reason} onChange={e=>setReason(e.target.value as AdjustmentReason)}>{reasons.map(r=><option key={r} value={r}>{a[r]}</option>)}</select></label>
   <label>{t.date}<input type="date" min={sale.effective_date} max={today()} value={date} onChange={e=>setDate(e.target.value)}/></label><button type="button" onClick={prepare}>{a[kind]}</button>
  </fieldset>
  {(review||command.pending)&&<div className="svc-counter-review" role="region" aria-label={a.review}><p>{a.review}</p><strong>{a[kind]} · {kind==="bill_correction"?(total<BigInt(0)?a.invalid:money(total)):kind==="refund"?amount:sale.payments.find(p=>p.receipt_ref===receipt)?.amount} {sale.currency} · {a[reason]} · {date}</strong>{kind==="bill_correction"&&<p>{customer} · {lines.map(l=>`${l.service_name} ${l.package_name??""} × ${l.quantity}`).join(", ")}</p>}<button type="button" disabled={command.busy} onClick={()=>void confirm()}>{command.pending?t.retry:t.confirm}</button>{!command.pending&&<button type="button" onClick={()=>setReview(null)}>{t.cancel}</button>}</div>}
  {error&&<p role="alert">{error}</p>}{command.status&&<p role="status">{c[command.status]}</p>}
 </section>;
}
