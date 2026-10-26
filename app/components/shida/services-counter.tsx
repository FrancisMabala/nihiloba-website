"use client";
import {createPortal} from "react-dom";
import {useCallback,useEffect,useRef,useState} from "react";
import {counterCopy} from "../../lib/services-counter-copy";
import {counterAdjustmentCopy} from "../../lib/services-counter-adjustment-copy";
import {ServicesCounterAdjustments,type AdjustmentKind,type AdjustmentReason} from "./services-counter-adjustments";
import {financeReviewCopy} from "../../lib/services-finance-copy";
import {providerCopy,type ProviderLocale} from "../../lib/services-provider-copy";
import {financialRequest,useFinancialCommand,type FinancialCommand} from "../../lib/services-financial-state";
import {useWorkDraft} from "../../lib/restaurant-work";
import {serviceLocalInput} from "../../lib/service-time";
import "./services-counter.css";

export type Offering={public_ref:string;service_name:string;is_active:string;packages:{public_ref:string;name:string;price:string|null;currency:string|null}[]};
export type Line={offering_ref:string;package_ref:string|null;quantity:number;unit_price:string;service_name:string;package_name:string|null;amount:string};
type CounterSnapshot={sale_ref:string;customer_name:string|null;presentation:{display_name:string};lines:Line[];currency:string;total:string;received:string;outstanding:string;effective_date:string;refund_due?:string;revision?:number};
type Payment={receipt_ref:string;amount:string;method:"cash"|"mobile_money"|"bank"|"other";effective_date:string;reversed?:boolean;document?:CounterSnapshot};
type Adjustment={adjustment_ref:string;kind:AdjustmentKind;reason_code:AdjustmentReason;amount:string;bill_delta:string;method:Payment["method"]|null;effective_date:string;receipt_ref:string|null;document:CounterSnapshot};
export type CounterSale=CounterSnapshot & {payments:Payment[];adjustments?:Adjustment[];original?:CounterSnapshot};
const today=()=>serviceLocalInput(new Date().toISOString()).slice(0,10);
export function counterCents(value:string):bigint{if(!/^\d{1,16}([.,]\d{1,2})?$/.test(value))throw Error();const [a,b=""]=value.replace(",",".").split(".");return BigInt(a)*BigInt(100)+BigInt(b.padEnd(2,"0"));}
const money=(value:bigint)=>`${value/BigInt(100)}.${String(value%BigInt(100)).padStart(2,"0")}`;

export function CounterDocument({sale,payment,adjustment,locale}:{sale:CounterSale;payment?:Payment;adjustment?:Adjustment;locale:ProviderLocale}){
 const t=counterCopy[locale],a=counterAdjustmentCopy[locale],index=payment?sale.payments.findIndex(p=>p.receipt_ref===payment.receipt_ref):-1;
 const doc=adjustment?.document??payment?.document??sale;
 const title=adjustment?(adjustment.kind==="refund"?a.refundReceipt:adjustment.kind==="payment_reversal"?a.reversalReceipt:a.correctionReceipt):payment?t.receipt:t.bill;
 const itemTotal=doc.lines.reduce((sum,l)=>sum+counterCents(l.amount),BigInt(0));
 const received=payment?sale.payments.slice(0,index+1).reduce((sum,p)=>sum+counterCents(p.amount),BigInt(0)):BigInt(0);
 return <article className="svc-counter-receipt"><h2>{doc.presentation.display_name}</h2><h3>{title}</h3><p>{adjustment?.adjustment_ref??payment?.receipt_ref??doc.sale_ref}</p><p>{adjustment?.effective_date??payment?.effective_date??doc.effective_date}</p>{doc.customer_name&&<p>{doc.customer_name}</p>}
  {adjustment&&<p>{a.reason}: {a[adjustment.reason_code]} · {doc.sale_ref}{adjustment.receipt_ref&&` · ${adjustment.receipt_ref}`}</p>}
  {payment?.reversed&&<p><strong>{a.reversed}</strong> · {a.reversalHelp}</p>}
  <ul>{doc.lines.map((line,i)=><li key={i}><strong>{line.service_name}{line.package_name?` — ${line.package_name}`:""}</strong><span>{line.quantity} × {line.unit_price} {doc.currency}</span><b>{line.amount} {doc.currency}</b></li>)}</ul>
  {itemTotal>counterCents(doc.total)&&<p>{a.credited}: −{money(itemTotal-counterCents(doc.total))} {doc.currency}</p>}
  <p>{t.total}: <strong>{doc.total} {doc.currency}</strong></p>{payment&&<><p>{t.paid}: <strong>{payment.amount} {doc.currency}</strong> · {t[payment.method]}</p><p>{t.balance}: {payment.document?.outstanding??money(counterCents(doc.total)-received)} {doc.currency}</p><small>{t.note}</small></>}
  {adjustment&&<><p>{adjustment.kind==="refund"?a.amount:adjustment.kind==="payment_reversal"?a.payment_reversal:a.credited}: <strong>{adjustment.kind==="bill_correction"?adjustment.bill_delta:adjustment.amount} {doc.currency}</strong>{adjustment.method&&` · ${t[adjustment.method]}`}</p><p>{a.net}: {doc.received} {doc.currency}</p><p>{t.balance}: {doc.outstanding} {doc.currency}</p><small>{adjustment.kind==="refund"?a.note:adjustment.kind==="payment_reversal"?a.reversalHelp:a.correctionHelp}</small></>}
  {counterCents(doc.refund_due??"0")>BigInt(0)&&<p>{a.refundDue}: {doc.refund_due} {doc.currency}</p>}
 </article>;
}

export function ServicesCounter(props:{base:string;binding:string;locale:ProviderLocale;offerings:Offering[];onDenied:()=>void;historyOnly?:boolean}){return <BoundCounter key={`${props.base}:${props.binding}`} {...props}/>;}
function BoundCounter({base,binding,locale,offerings,onDenied,historyOnly=false}:{base:string;binding:string;locale:ProviderLocale;offerings:Offering[];onDenied:()=>void;historyOnly?:boolean}){
 const t=counterCopy[locale],a=counterAdjustmentCopy[locale],c=financeReviewCopy[locale],command=useFinancialCommand(binding);
 const [adjusting,setAdjusting]=useState(false);
 const [composing,setComposing]=useState(true);
 const [lines,setLines]=useState<Line[]>([]),[offering,setOffering]=useState(""),[pack,setPack]=useState(""),[price,setPrice]=useState(""),[qty,setQty]=useState(1);
 const [currency,setCurrency]=useState("CDF"),[customer,setCustomer]=useState(""),[date,setDate]=useState(today),[paid,setPaid]=useState("0"),[method,setMethod]=useState<Payment["method"]>("cash");
 const [rows,setRows]=useState<CounterSale[]>([]),[selected,setSelected]=useState<CounterSale|null>(null),[receipt,setReceipt]=useState(""),[format,setFormat]=useState("full"),[due,setDue]=useState(false);
 const [review,setReview]=useState<FinancialCommand|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[next,setNext]=useState<number|null>(null),[business,setBusiness]=useState("");
 const [paymentAmount,setPaymentAmount]=useState(""),[printing,setPrinting]=useState(false);
 const ticket=useRef(0),alive=useRef(true),deny=useRef(onDenied);useEffect(()=>{deny.current=onDenied;},[onDenied]);
 useEffect(()=>{alive.current=true;const epoch=ticket;return()=>{alive.current=false;epoch.current++;};},[]);
 const parentLocked=command.busy||!!command.pending||!!review;
 const locked=parentLocked||adjusting;
 useWorkDraft(lines.length>0||!!customer||!!paymentAmount||!!command.pending,providerCopy[locale].leave);
 const load=useCallback(async(offset=0)=>{const id=++ticket.current;setLoading(true);setError("");try{
  const data=await financialRequest<{sales:CounterSale[];next_offset:number|null}>(binding,`${base}/transactions/finance/counter?offset=${offset}`);
  if(id!==ticket.current)return;if(!Array.isArray(data.sales))throw Error();setRows(old=>offset?[...old,...data.sales]:data.sales);setNext(data.next_offset);if(offset===0)setSelected(old=>old?data.sales.find(s=>s.sale_ref===old.sale_ref)??old:null);
 }catch(e){if(id!==ticket.current)return;setError(t.failed);if(e instanceof Error&&["401","403","404"].includes(e.message)){setRows([]);setSelected(null);deny.current();}}finally{if(id===ticket.current)setLoading(false);}},[base,binding,t.failed]);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active)void load();});void financialRequest<{preview:{display_name:string}}>(binding,`${base}/transactions/bill-presentation`).then(v=>{if(active)setBusiness(v.preview.display_name);}).catch(()=>{});return()=>{active=false;};},[load,base,binding]);
 useEffect(()=>{if(command.status==="denied")queueMicrotask(()=>{if(alive.current){setRows([]);setSelected(null);deny.current();}});},[command.status]);
 useEffect(()=>{const done=()=>setPrinting(false);window.addEventListener("afterprint",done);return()=>window.removeEventListener("afterprint",done);},[]);
 const service=offerings.find(row=>row.public_ref===offering),pkg=service?.packages.find(row=>row.public_ref===pack);
 const total=lines.reduce((sum,line)=>sum+counterCents(line.amount),BigInt(0));
 function add(){try{const unit=counterCents(price);if(!service||unit<=BigInt(0)||qty<1||qty>100||!Number.isInteger(qty)||lines.length>=30)throw Error();setLines(old=>[...old,{offering_ref:offering,package_ref:pack||null,quantity:qty,unit_price:money(unit),service_name:service.service_name,package_name:pkg?.name??null,amount:money(unit*BigInt(qty))}]);setError("");}catch{setError(t.invalid);}}
 function prepare(){try{if(!lines.length||counterCents(paid)>total||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today())throw Error();setReview({path:`${base}/transactions/finance/counter`,method:"POST",key:crypto.randomUUID(),body:JSON.stringify({lines:lines.map(({offering_ref,package_ref,quantity,unit_price})=>({offering_ref,package_ref,quantity,unit_price})),currency,effective_date:date,customer_name:customer.trim()||null,paid_amount:money(counterCents(paid)),payment_method:method})});setError("");}catch{setError(t.invalid);}}
 function preparePayment(){try{if(!selected||counterCents(paymentAmount)<=BigInt(0)||counterCents(paymentAmount)>counterCents(selected.outstanding))throw Error();setReview({path:`${base}/transactions/finance/counter/${selected.sale_ref}/payments`,method:"POST",key:crypto.randomUUID(),body:JSON.stringify({amount:money(counterCents(paymentAmount)),method,effective_date:date})});setError("");}catch{setError(t.invalid);}}
 async function confirm(){const result=await command.run<CounterSale>(command.pending??review??undefined);if(!alive.current)return;if(result){setSelected(result);setReceipt(result.payments.at(-1)?.receipt_ref??"");setReview(null);setComposing(false);setLines([]);setCustomer("");setPaid("0");setPaymentAmount("");await load();window.dispatchEvent(new Event("services:finance-updated"));}}
 const payment=selected?.payments.find(p=>p.receipt_ref===receipt),adjustment=selected?.adjustments?.find(v=>v.adjustment_ref===receipt);
 const documentSale=selected&&receipt==="original"&&selected.original?{...selected,...selected.original}:selected;
 const doc=adjustment?.document??payment?.document??documentSale;
 const shareText=doc?[doc.presentation.display_name,adjustment?(adjustment.kind==="refund"?a.refundReceipt:adjustment.kind==="payment_reversal"?a.reversalReceipt:a.correctionReceipt):payment?t.receipt:t.bill,adjustment?.adjustment_ref??payment?.receipt_ref??doc.sale_ref,...doc.lines.map(l=>`${l.service_name}${l.package_name?` — ${l.package_name}`:""}: ${l.quantity} × ${l.unit_price} ${doc.currency}`),`${t.total}: ${doc.total} ${doc.currency}`,payment?`${t.paid}: ${payment.amount} ${doc.currency}`:"",adjustment?`${a[adjustment.kind]}: ${adjustment.kind==="bill_correction"?adjustment.bill_delta:adjustment.amount} ${doc.currency}`:"",adjustment?`${a.reason}: ${a[adjustment.reason_code]}`:"",payment?.reversed?a.reversed:"",payment?t.note:adjustment?.kind==="refund"?a.note:""].filter(Boolean).join("\n"):"";

 return <section className="svc-counter svc-financial-panel" data-print={printing} data-format={format}>
  {!historyOnly&&!composing&&<button type="button" className="svc-primary" disabled={locked} onClick={()=>setComposing(true)}>{t.newSale}</button>}
  {!historyOnly&&composing&&<><p><strong>{business||t.business}</strong> · {t.businessHelp}</p><fieldset disabled={locked} className="svc-counter-form">
   <label>{t.currency}<select value={currency} disabled={lines.length>0} onChange={e=>{setCurrency(e.target.value);setPack("");setPrice("");}}><option>CDF</option><option>USD</option></select></label>
   <label>{t.service}<select value={offering} onChange={e=>{setOffering(e.target.value);setPack("");setPrice("");}}><option value="">—</option>{offerings.filter(o=>o.is_active==="yes").map(o=><option key={o.public_ref} value={o.public_ref}>{o.service_name}</option>)}</select></label>
   <label>{t.package}<select value={pack} onChange={e=>{setPack(e.target.value);const p=service?.packages.find(p=>p.public_ref===e.target.value);setPrice(p?.price??"");}}><option value="">{t.custom}</option>{service?.packages.filter(p=>!p.price||p.currency===currency).map(p=><option key={p.public_ref} value={p.public_ref}>{p.name}</option>)}</select></label>
   <label>{t.price}<input inputMode="decimal" value={price} readOnly={!!pkg?.price} onChange={e=>setPrice(e.target.value)}/></label><label>{t.quantity}<input type="number" min={1} max={100} value={qty} onChange={e=>setQty(Number(e.target.value))}/></label><button type="button" onClick={add}>{t.add}</button>
   <ul>{lines.map((line,i)=><li key={i}>{line.service_name} {line.package_name} · {line.quantity} × {line.unit_price} {currency} <button type="button" onClick={()=>setLines(old=>old.filter((_,n)=>n!==i))}>{t.remove}</button></li>)}</ul>
   <strong>{t.total}: {money(total)} {currency}</strong><label>{t.customer}<input maxLength={120} value={customer} onChange={e=>setCustomer(e.target.value)}/></label>
   <label>{t.date}<input type="date" max={today()} value={date} onChange={e=>setDate(e.target.value)}/></label><label>{t.paid}<input inputMode="decimal" value={paid} onChange={e=>setPaid(e.target.value)}/></label><label>{t.method}<select value={method} onChange={e=>setMethod(e.target.value as Payment["method"])}>{(["cash","mobile_money","bank","other"] as const).map(m=><option key={m} value={m}>{t[m]}</option>)}</select></label><button type="button" className="svc-primary" onClick={prepare}>{t.save}</button>
  </fieldset></>}
  {(review||command.pending)&&<div className="svc-counter-review" role="region" aria-label={t.review}><p>{t.review}</p><strong>{selected&&review?.path.endsWith("/payments")?`${paymentAmount} ${selected.currency}`:`${money(total)} ${currency} · ${t.paid}: ${paid}`}</strong><button type="button" disabled={command.busy} onClick={()=>void confirm()}>{command.pending?t.retry:t.confirm}</button>{!command.pending&&<button type="button" onClick={()=>setReview(null)}>{t.cancel}</button>}</div>}
  {error&&<p role="alert">{error}</p>}{command.status&&<p role="status">{c[command.status]}</p>}
  <h2>{t.history}</h2><label><input type="checkbox" checked={due} onChange={e=>setDue(e.target.checked)}/>{t.due}</label>{loading&&<p>{t.loading}</p>}{!loading&&!rows.length&&<p>{t.empty}</p>}<button type="button" disabled={loading||locked} onClick={()=>void load()}>{providerCopy[locale].refresh}</button>
  <ul>{rows.filter(s=>!due||counterCents(s.outstanding)>BigInt(0)).map(s=><li key={s.sale_ref}><button type="button" disabled={locked} onClick={()=>{setSelected(s);setReceipt(s.payments.at(-1)?.receipt_ref??"");setPaymentAmount("");}}>{s.customer_name||s.lines[0]?.service_name} · {s.effective_date} · {s.total} {s.currency} · {t.balance}: {s.outstanding}</button></li>)}</ul>{next!==null&&<button type="button" disabled={loading||locked} onClick={()=>void load(next)}>{t.more}</button>}
  {printing&&selected&&createPortal(<div className="svc-counter-print" data-format={format}><CounterDocument sale={documentSale??selected} payment={payment} adjustment={adjustment} locale={locale}/></div>,document.body)}
  {selected&&<><div className="svc-counter-controls"><label>{t.receiptChoice}<select value={receipt} onChange={e=>setReceipt(e.target.value)}><option value="">{a.current}</option>{selected.original&&<option value="original">{a.original}</option>}{selected.payments.map(p=><option key={p.receipt_ref} value={p.receipt_ref}>{p.effective_date} · {p.amount} {selected.currency}{p.reversed?` · ${a.reversed}`:""}</option>)}{selected.adjustments?.map(v=><option key={v.adjustment_ref} value={v.adjustment_ref}>{a[v.kind]} · {v.effective_date} · {v.kind==="bill_correction"?v.bill_delta:v.amount} {selected.currency}</option>)}</select></label><label>{t.format}<select value={format} onChange={e=>setFormat(e.target.value)}><option value="full">{t.full}</option><option value="58">{t.small} · 58 mm</option><option value="80">{t.small} · 80 mm</option></select></label><button type="button" onClick={()=>{setPrinting(true);setTimeout(()=>window.print(),100);}}>{t.print}</button><a target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}>{t.share}</a></div>
   <CounterDocument sale={documentSale??selected} payment={payment} adjustment={adjustment} locale={locale}/>
   {counterCents(selected.outstanding)>BigInt(0)&&<fieldset disabled={locked} className="svc-counter-form"><h3>{t.payment} · {t.balance}: {selected.outstanding} {selected.currency}</h3><label>{t.paid}<input inputMode="decimal" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)}/></label><label>{t.date}<input type="date" min={selected.effective_date} max={today()} value={date} onChange={e=>setDate(e.target.value)}/></label><label>{t.method}<select value={method} onChange={e=>setMethod(e.target.value as Payment["method"])}>{(["cash","mobile_money","bank","other"] as const).map(m=><option key={m} value={m}>{t[m]}</option>)}</select></label><button type="button" onClick={preparePayment}>{t.payment}</button></fieldset>}
   {selected.revision!==undefined&&<ServicesCounterAdjustments key={`${selected.sale_ref}:${selected.revision}`} sale={selected} offerings={offerings} base={base} binding={binding} locale={locale} disabled={parentLocked} onBusy={setAdjusting} onDenied={()=>{setRows([]);setSelected(null);deny.current();}} onSaved={result=>{setSelected(result);setReceipt(result.adjustments?.at(-1)?.adjustment_ref??"");void load();window.dispatchEvent(new Event("services:finance-updated"));}}/>}
   <h3>{a.history}</h3>{!selected.adjustments?.length&&<p>{a.none}</p>}<ul>{selected.adjustments?.map(v=><li key={v.adjustment_ref}><button type="button" onClick={()=>setReceipt(v.adjustment_ref)}>{a[v.kind]} · {v.effective_date} · {v.kind==="bill_correction"?v.bill_delta:v.amount} {selected.currency} · {a[v.reason_code]}</button></li>)}</ul>
  </>}
 </section>;
}
