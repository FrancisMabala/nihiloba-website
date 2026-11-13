"use client";
import {downloadReceipt} from "../../lib/download-receipt";
import {CounterPicker} from "./services-counter-picker";
import {hasPhysicalStore} from "../../lib/wenze-checkout-copy";
import {personalWenzePath} from "../../lib/wenze-seller-api";
import {CashKeypad} from "./wenze-cash-keypad";
import {workplaceCopy} from "../../lib/services-workplace-copy";
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

export type Offering={name?:string;public_ref:string;service_name:string;is_active:string;packages:{public_ref:string;name:string;price:string|null;currency:string|null}[]};
export type Line={offering_ref:string;package_ref:string|null;quantity:number;unit_price:string;service_name:string;package_name:string|null;amount:string};
type CounterSnapshot={sale_ref:string;customer_name:string|null;presentation:{display_name:string;cash_tendered?:string;cash_change?:string};lines:Line[];currency:string;total:string;received:string;outstanding:string;effective_date:string;refund_due?:string;revision?:number};
type Payment={receipt_ref:string;amount:string;method:"cash"|"mobile_money"|"bank"|"other";effective_date:string;reversed?:boolean;document?:CounterSnapshot};
type Adjustment={adjustment_ref:string;kind:AdjustmentKind;reason_code:AdjustmentReason;amount:string;bill_delta:string;method:Payment["method"]|null;effective_date:string;receipt_ref:string|null;document:CounterSnapshot};
export type CounterSale=CounterSnapshot & {payments:Payment[];adjustments?:Adjustment[];original?:CounterSnapshot};
const today=()=>serviceLocalInput(new Date().toISOString()).slice(0,10);
export function counterCents(value:string):bigint{if(!/^\d{1,16}([.,]\d{1,2})?$/.test(value))throw Error();const [a,b=""]=value.replace(",",".").split(".");return BigInt(a)*BigInt(100)+BigInt(b.padEnd(2,"0"));}
function displayMoney(value:string,locale:ProviderLocale){
 const [whole,fraction=""]=value.split(".");
 return new Intl.NumberFormat(locale).format(BigInt(whole))+(Number(fraction)?(locale==="fr"?",":".")+fraction:"");
}
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
  <ul className="svc-document-lines"><li className="svc-receipt-columns"><span>{t.service}</span><span>{t.quantity}</span><span>{t.amount}</span></li>{doc.lines.map((line,i)=><li key={i}><strong>{line.service_name}{line.package_name?` — ${line.package_name}`:""}</strong><span>{line.quantity} × {line.unit_price} {doc.currency}</span><b>{line.amount} {doc.currency}</b></li>)}</ul>
  {itemTotal>counterCents(doc.total)&&<p>{a.credited}: −{money(itemTotal-counterCents(doc.total))} {doc.currency}</p>}
  <p className="svc-receipt-total">{t.total} <strong>{doc.total} {doc.currency}</strong></p>{payment&&<><p>{t.received}: <strong>{payment.amount} {doc.currency}</strong> · {t[payment.method]}</p>{payment.method==="cash"&&index===0&&doc.presentation.cash_tendered&&<><p>{t.paid}: {doc.presentation.cash_tendered} {doc.currency}</p><p>{t.returned}: {doc.presentation.cash_change} {doc.currency}</p></>}<p className="svc-receipt-balance">{t.balance}: {payment.document?.outstanding??money(counterCents(doc.total)-received)} {doc.currency}</p><small>{t.note}</small></>}
  {!payment&&!adjustment&&<p>{t.balance}: {doc.outstanding} {doc.currency}</p>}
  {adjustment&&<><p>{adjustment.kind==="refund"?a.amount:adjustment.kind==="payment_reversal"?a.payment_reversal:a.credited}: <strong>{adjustment.kind==="bill_correction"?adjustment.bill_delta:adjustment.amount} {doc.currency}</strong>{adjustment.method&&` · ${t[adjustment.method]}`}</p><p>{a.net}: {doc.received} {doc.currency}</p><p>{t.balance}: {doc.outstanding} {doc.currency}</p><small>{adjustment.kind==="refund"?a.note:adjustment.kind==="payment_reversal"?a.reversalHelp:a.correctionHelp}</small></>}
  {counterCents(doc.refund_due??"0")>BigInt(0)&&<p>{a.refundDue}: {doc.refund_due} {doc.currency}</p>}
 </article>;
}

export function ServicesCounter(props:{base:string;binding:string;locale:ProviderLocale;offerings:Offering[];onDenied:()=>void;historyOnly?:boolean;documentRef?:{sale:string;receipt:string}}){return <BoundCounter key={`${props.base}:${props.binding}`} {...props}/>;}
function BoundCounter({base,binding,locale,offerings,onDenied,historyOnly=false,documentRef}:{base:string;binding:string;locale:ProviderLocale;offerings:Offering[];onDenied:()=>void;historyOnly?:boolean;documentRef?:{sale:string;receipt:string}}){
 const w=workplaceCopy[locale],t=counterCopy[locale],a=counterAdjustmentCopy[locale],c=financeReviewCopy[locale],command=useFinancialCommand(binding);
 const [tab,setTab]=useState<"sale"|"history">(historyOnly?"history":"sale"),[success,setSuccess]=useState<CounterSale|null>(null);
 const [adjusting,setAdjusting]=useState(false);
 const [composing,setComposing]=useState(true);
 const [lines,setLines]=useState<Line[]>([]),[editing,setEditing]=useState<number|null>(null);
 const [currency,setCurrency]=useState("CDF"),[customer,setCustomer]=useState(""),[date,setDate]=useState(today),[paid,setPaid]=useState("0"),[method,setMethod]=useState<Payment["method"]>("cash");
 const [rows,setRows]=useState<CounterSale[]>([]),[selected,setSelected]=useState<CounterSale|null>(null),[receipt,setReceipt]=useState(""),[format,setFormat]=useState("full"),[due,setDue]=useState(false);
 const [review,setReview]=useState<FinancialCommand|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[next,setNext]=useState<number|null>(null),[business,setBusiness]=useState("");
 const [extraMethod,setExtraMethod]=useState<Payment["method"]>("cash"),[extraDate,setExtraDate]=useState(today);
 const [paymentAmount,setPaymentAmount]=useState(""),[printing,setPrinting]=useState(false);
 const [detail,setDetail]=useState(!!documentRef),[shop,setShop]=useState(""),[pdfBusy,setPdfBusy]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const [payOpen,setPayOpen]=useState(false);
 useEffect(()=>{if(payOpen)dialog.current?.showModal();else dialog.current?.close();},[payOpen]);
 const ticket=useRef(0),alive=useRef(true),deny=useRef(onDenied);useEffect(()=>{deny.current=onDenied;},[onDenied]);
 useEffect(()=>{alive.current=true;const epoch=ticket;return()=>{alive.current=false;epoch.current++;};},[]);
 const parentLocked=command.busy||!!command.pending||!!review;
 const locked=parentLocked||adjusting;
 useWorkDraft(lines.length>0||!!customer||!!paymentAmount||!!command.pending,providerCopy[locale].leave,locale);
 const selectionRef=useRef(selected?.sale_ref);useEffect(()=>{selectionRef.current=selected?.sale_ref;},[selected?.sale_ref]);
 const load=useCallback(async(offset=0)=>{const id=++ticket.current;setLoading(true);setError("");try{
  if(documentRef&&offset===0){
    const sale=await financialRequest<CounterSale>(binding,`${base}/transactions/finance/counter/${documentRef.sale}`);
    if(id!==ticket.current)return;
    setRows([sale]);setSelected(sale);setReceipt(documentRef.receipt);setNext(null);return;
  }
  const data=await financialRequest<{sales:CounterSale[];next_offset:number|null}>(binding,`${base}/transactions/finance/counter?offset=${offset}${due?"&outstanding_only=true":""}`);
  if(id!==ticket.current)return;if(!Array.isArray(data.sales))throw Error();setRows(old=>offset?[...old,...data.sales]:data.sales);setNext(data.next_offset);if(offset===0&&tab==="history"){
   const prior=data.sales.find(s=>s.sale_ref===selectionRef.current),first=prior??data.sales[0]??null;
   setSelected(first);if(!prior)setReceipt(first?.payments.at(-1)?.receipt_ref??"");
  }
 }catch(e){if(id!==ticket.current)return;setError(t.failed);if(e instanceof Error&&["401","403","404"].includes(e.message)){setRows([]);setSelected(null);deny.current();}}finally{if(id===ticket.current)setLoading(false);}},[base,binding,t.failed,documentRef,due,tab]);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active){if(offerings.length||historyOnly)void load();else setLoading(false);}});const refreshName=()=>{void financialRequest<{preview:{display_name:string}}>(binding,`${base}/transactions/bill-presentation`).then(v=>{if(active)setBusiness(v.preview.display_name);}).catch(()=>{});};
 if(offerings.length){refreshName();window.addEventListener("focus",refreshName);}return()=>{active=false;window.removeEventListener("focus",refreshName);};},[load,base,binding,offerings.length,historyOnly]);
 useEffect(()=>{if(command.status==="denied")queueMicrotask(()=>{if(alive.current){setRows([]);setSelected(null);deny.current();}});},[command.status]);
 useEffect(()=>{const done=()=>setPrinting(false);window.addEventListener("afterprint",done);return()=>window.removeEventListener("afterprint",done);},[]);
 useEffect(()=>{
  let active=true;
  if(!historyOnly)void financialRequest<{stores:{public_ref:string;status:string;selling_mode:string;store_type:string}[]}>(binding,personalWenzePath("stores?archived=false"))
   .then(data=>{if(active)setShop(data.stores.find(store=>store.status==="active"&&store.selling_mode!=="individual"&&hasPhysicalStore(store))?.public_ref??"");}).catch(()=>{});
  return()=>{active=false;};
 },[binding,historyOnly]);
 async function downloadPdf(){
  if(!selected||pdfBusy)return;
  setPdfBusy(true);
  try{
   const query=new URLSearchParams({document:receipt||"current",language:locale});
   const response=await fetch(`${base}/transactions/finance/counter/${selected.sale_ref}/document.pdf?${query}`,{headers:{"X-Shida-Session":binding},cache:"no-store",signal:AbortSignal.timeout(20000)});
   if(!response.ok||!response.headers.get("content-type")?.includes("application/pdf"))throw Error();
   downloadReceipt(new File([await response.blob()],(receipt||selected.sale_ref)+".pdf",{type:"application/pdf"}));
  }catch{if(alive.current)setError(t.failed);}finally{if(alive.current)setPdfBusy(false);}
 }
 function showSale(s:CounterSale){setSelected(s);setReceipt(s.payments.at(-1)?.receipt_ref??"");setPaymentAmount("");setDetail(true);}
 function newSale(){setComposing(true);setSuccess(null);setDetail(false);setTab("sale");setEditing(null);if(!lines.length){setDate(today());setMethod("cash");setCurrency("CDF");}setError("");command.clear();}

 const total=lines.reduce((sum,line)=>sum+counterCents(line.amount),BigInt(0));
 function add(service:Offering,pack:Offering["packages"][number]|undefined,price:string,code:string,qty:number){
  try{
   const unit=counterCents(price);
   if(unit<=BigInt(0)||qty<1||qty>100||!Number.isInteger(qty)||(editing===null&&lines.length>=30)||(lines.length>0&&code!==currency))throw Error();
   const line={offering_ref:service.public_ref,package_ref:pack?.public_ref??null,quantity:qty,unit_price:money(unit),service_name:service.service_name,package_name:pack?.name??null,amount:money(unit*BigInt(qty))};
   setLines(old=>editing===null?[...old,line]:old.map((v,i)=>i===editing?line:v));setCurrency(code);setEditing(null);setError("");return true;
  }catch{setError(t.invalid);return false;}
 }
 const tender=/^\d{1,16}([.,]\d{1,2})?$/.test(paid)?counterCents(paid):null;
 function prepare(){try{if(!lines.length||tender===null||(method!=="cash"&&tender>total)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today())throw Error();void confirm({path:`${base}/transactions/finance/counter`,method:"POST",key:crypto.randomUUID(),body:JSON.stringify({lines:lines.map(({offering_ref,package_ref,quantity,unit_price})=>({offering_ref,package_ref,quantity,unit_price})),currency,effective_date:date,customer_name:customer.trim()||null,paid_amount:money(tender>total?total:tender),payment_method:method,...(method==="cash"?{cash_tendered:money(tender)}:{})})});setError("");}catch{setError(t.invalid);}}
 function preparePayment(){try{if(!selected||counterCents(paymentAmount)<=BigInt(0)||counterCents(paymentAmount)>counterCents(selected.outstanding))throw Error();setReview({path:`${base}/transactions/finance/counter/${selected.sale_ref}/payments`,method:"POST",key:crypto.randomUUID(),body:JSON.stringify({amount:money(counterCents(paymentAmount)),method:extraMethod,effective_date:extraDate})});setError("");}catch{setError(t.invalid);}}
 async function confirm(payload?:FinancialCommand){
  const sending=command.pending??payload??review;if(!sending)return;
  const result=await command.run<CounterSale>(sending);
  if(!alive.current||!result)return;
  if(!sending.path.endsWith("/payments")){
   setPayOpen(false);setSuccess(result);setComposing(false);setEditing(null);setLines([]);setCustomer("");setPaid("0");
  }
  setSelected(result);setReceipt(result.payments.at(-1)?.receipt_ref??"");setReview(null);setPaymentAmount("");
  await load();window.dispatchEvent(new Event("services:finance-updated"));
 }

 const payment=selected?.payments.find(p=>p.receipt_ref===receipt),adjustment=selected?.adjustments?.find(v=>v.adjustment_ref===receipt);
 const documentSale=selected&&receipt==="original"&&selected.original?{...selected,...selected.original}:selected;
 const doc=adjustment?.document??payment?.document??documentSale;
 const shareText=doc?[doc.presentation.display_name,adjustment?(adjustment.kind==="refund"?a.refundReceipt:adjustment.kind==="payment_reversal"?a.reversalReceipt:a.correctionReceipt):payment?t.receipt:t.bill,adjustment?.adjustment_ref??payment?.receipt_ref??doc.sale_ref,...doc.lines.map(l=>`${l.service_name}${l.package_name?` — ${l.package_name}`:""}: ${l.quantity} × ${l.unit_price} ${doc.currency}`),`${t.total}: ${doc.total} ${doc.currency}`,payment?`${t.paid}: ${payment.amount} ${doc.currency}`:"",adjustment?`${a[adjustment.kind]}: ${adjustment.kind==="bill_correction"?adjustment.bill_delta:adjustment.amount} ${doc.currency}`:"",adjustment?`${a.reason}: ${a[adjustment.reason_code]}`:"",payment?.reversed?a.reversed:"",payment?t.note:adjustment?.kind==="refund"?a.note:""].filter(Boolean).join("\n"):"";

 return <section className="svc-counter svc-financial-panel" data-print={printing} data-format={format}>
  {!historyOnly&&<div className="svc-counter-tabs" role="group" aria-label={w.newSale}><button type="button" aria-pressed={tab==="sale"} disabled={locked} onClick={()=>setTab("sale")}>{w.newSale}</button><button type="button" aria-pressed={tab==="history"} disabled={locked} onClick={()=>setTab("history")}>{t.archive}</button></div>}

  {!historyOnly&&tab==="sale"&&composing&&<><fieldset disabled={locked} className="svc-counter-form svc-counter-sale"><CounterPicker key={editing??"new"} offerings={offerings} locale={locale} currency={currency} hasLines={lines.length>0} editLine={editing===null?undefined:lines[editing]} onCancel={()=>setEditing(null)} onAdd={add}/>
   <section className="svc-counter-sale-items"><h2>{t.ticket}</h2><ul className="svc-counter-basket">{lines.map((line,i)=><li key={i}><div><strong>{line.package_name??line.service_name}</strong><small>{line.package_name?line.service_name+" · ":""}{line.unit_price} {currency}</small></div><div className="svc-counter-quantity"><button type="button" aria-label={`${t.quantity} − ${line.service_name}`} disabled={line.quantity<=1} onClick={()=>setLines(old=>old.map((v,n)=>n===i?{...v,quantity:v.quantity-1,amount:money(counterCents(v.unit_price)*BigInt(v.quantity-1))}:v))}>−</button><span>{line.quantity}</span><button type="button" aria-label={`${t.quantity} + ${line.service_name}`} disabled={line.quantity>=100} onClick={()=>setLines(old=>old.map((v,n)=>n===i?{...v,quantity:v.quantity+1,amount:money(counterCents(v.unit_price)*BigInt(v.quantity+1))}:v))}>+</button></div><b>{displayMoney(line.amount,locale)} {currency}</b><button type="button" onClick={()=>{setEditing(i);document.querySelector(".svc-counter-picker")?.scrollIntoView({block:"nearest"});}}>{t.edit}</button><button type="button" onClick={()=>{setEditing(null);setLines(old=>old.filter((_,n)=>n!==i));}}>{t.remove}</button></li>)}</ul>
   <label>{t.customer}<input maxLength={120} value={customer} onChange={e=>setCustomer(e.target.value)}/></label>
   <label>{t.date}<input type="date" max={today()} value={date} onChange={e=>setDate(e.target.value)}/></label><div className="svc-counter-checkout"><strong>{t.totalDue} <b>{displayMoney(money(total),locale)} {currency}</b></strong><button type="button" className="svc-primary" disabled={!lines.length||editing!==null||!date||date>today()} onClick={()=>{setPaid(money(total));setError("");setPayOpen(true);}}>{t.checkout}</button></div>
   <p className="svc-counter-signature">{t.receiptName} · {business||offerings[0]?.name} <a target="_blank" rel="noopener" href="?view=settings">{t.edit}</a></p>
   {shop&&<a target="_blank" rel="noopener" href={`${locale==="en"?"":"/"+locale}/shida/seller/wenze/?view=sales&store=${encodeURIComponent(shop)}`}>{t.wenze} ↗</a>}
  </section></fieldset>
  <dialog ref={dialog} className="svc-counter-pay" aria-labelledby="svc-pay-title" onCancel={e=>{e.preventDefault();if(!command.pending&&!command.busy)setPayOpen(false);}}>
   <button className="svc-pay-close" type="button" aria-label={t.close} disabled={command.busy||!!command.pending} onClick={()=>setPayOpen(false)}>×</button><h2 id="svc-pay-title">{t.payment}</h2><p>{lines[0]?.package_name??lines[0]?.service_name} · {business}</p><strong className="svc-pay-total">{t.totalDue} <b>{displayMoney(money(total),locale)} {currency}</b></strong>
   <fieldset disabled={command.busy||!!command.pending}><legend>{t.method}</legend><div className="svc-counter-methods">{(["cash","mobile_money","bank","other"] as const).map(m=><button type="button" key={m} aria-pressed={method===m} onClick={()=>setMethod(m)}>{t[m]}</button>)}</div>
   <label>{t.paid}<input inputMode="decimal" value={paid} onChange={e=>setPaid(e.target.value)}/></label>
   {method==="mobile_money"&&<p>{t.note}</p>}<div className="svc-counter-calculator">{method==="cash"&&<CashKeypad value={paid} total={Number(total)} currency={currency} locale={locale} onChange={setPaid}/>}
   {tender!==null&&<output>{tender>total?t.change:t.balance} · {displayMoney(money(tender>total?tender-total:total-tender),locale)} {currency}</output>}</div>
   </fieldset>{error&&<p role="alert">{error}</p>}{command.status&&<p role="status">{c[command.status]}</p>}
   <div><button type="button" disabled={command.busy||!!command.pending} onClick={()=>setPayOpen(false)}>{t.back}</button><button type="button" className="svc-primary" disabled={command.busy} onClick={prepare}>{command.pending?t.retry:t.pay}</button></div>
  </dialog></>}
  {!payOpen&&(review||command.pending)&&<div className="svc-counter-review" role="region" aria-label={t.review}><p>{t.review}</p><strong>{selected&&review?.path.endsWith("/payments")?`${paymentAmount} ${selected.currency}`:`${money(total)} ${currency} · ${t.paid}: ${paid}`}</strong><button type="button" disabled={command.busy} onClick={()=>void confirm()}>{command.pending?t.retry:t.confirm}</button>{!command.pending&&<button type="button" onClick={()=>setReview(null)}>{t.cancel}</button>}</div>}
  {!payOpen&&error&&<p role="alert">{error}</p>}{!payOpen&&command.status&&<p role="status">{c[command.status]}</p>}
  {tab==="sale"&&success&&<section className="svc-counter-success" role="status"><span aria-hidden="true">✓</span><h2>{w.success}</h2><p>{success.sale_ref}</p><strong>{success.total} {success.currency}</strong><p>{t.note}</p><button type="button" onClick={()=>{setTab("history");setDue(false);showSale(success);command.clear();}}>{w.receipt}</button> <button className="svc-primary" type="button" onClick={newSale}>{t.newSale}</button></section>}
  <div hidden={tab!=="history"} className="svc-counter-archive" data-detail={detail}><div className="svc-counter-history"><h2>{t.history}</h2><select aria-label={t.history} value={due?"due":"all"} onChange={e=>{setDue(e.target.value==="due");setRows([]);setSelected(null);setReceipt("");setDetail(false);}}><option value="all">{t.all}</option><option value="due">{t.due}</option></select>{loading&&<p>{t.loading}</p>}{!loading&&!error&&!rows.length&&<p>{due?t.noMatch:t.empty} {due?<button onClick={()=>setDue(false)}>{t.showAll}</button>:historyOnly?<a href="?view=counter">{t.first}</a>:<button onClick={newSale}>{t.first}</button>}</p>}<button type="button" disabled={loading||locked} onClick={()=>void load()}>{providerCopy[locale].refresh}</button>
  {due&&!loading&&!error&&!next&&rows.length>0&&!rows.some(s=>counterCents(s.outstanding)>BigInt(0))&&<p>{t.noMatch} <button onClick={()=>setDue(false)}>{t.all}</button></p>}<ul>{rows.filter(s=>!due||counterCents(s.outstanding)>BigInt(0)).map(s=><li key={s.sale_ref}><button type="button" disabled={locked} aria-pressed={selected?.sale_ref===s.sale_ref} onClick={()=>showSale(s)}><span>{s.effective_date}</span><strong>{s.lines.map(l=>l.package_name??l.service_name).join(" · ")}</strong><span>{displayMoney(s.total,locale)} {s.currency}</span><b className="svc-counter-status" data-due={counterCents(s.outstanding)>BigInt(0)}>{counterCents(s.outstanding)>BigInt(0)?t.remaining+" "+displayMoney(s.outstanding,locale)+" "+s.currency:t.settled}</b></button></li>)}</ul>{next!==null&&<button type="button" disabled={loading||locked} onClick={()=>void load(next)}>{t.more}</button>}
  </div>
  {printing&&selected&&createPortal(<div className="svc-counter-print" data-format={format}><CounterDocument sale={documentSale??selected} payment={payment} adjustment={adjustment} locale={locale}/></div>,document.body)}
  {selected&&<div className="svc-counter-detail"><button className="svc-counter-list-back" type="button" onClick={()=>setDetail(false)}>{t.backSales}</button><div id="svc-counter-document" className="svc-counter-controls"><label>{t.receiptChoice}<select value={receipt} onChange={e=>setReceipt(e.target.value)}><option value="">{a.current}</option>{selected.original&&<option value="original">{a.original}</option>}{selected.payments.map(p=><option key={p.receipt_ref} value={p.receipt_ref}>{p.effective_date} · {p.amount} {selected.currency}{p.reversed?` · ${a.reversed}`:""}</option>)}{selected.adjustments?.map(v=><option key={v.adjustment_ref} value={v.adjustment_ref}>{a[v.kind]} · {v.effective_date} · {v.kind==="bill_correction"?v.bill_delta:v.amount} {selected.currency}</option>)}</select></label><label>{t.format}<select value={format} onChange={e=>setFormat(e.target.value)}><option value="full">{t.full}</option><option value="58">{t.small} · 58 mm</option><option value="80">{t.small} · 80 mm</option></select></label><button type="button" onClick={()=>{setPrinting(true);setTimeout(()=>window.print(),100);}}>{t.print}</button><button type="button" disabled={pdfBusy} onClick={()=>void downloadPdf()}>{t.pdf}</button><a target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}>{t.share}</a></div>
   <CounterDocument sale={documentSale??selected} payment={payment} adjustment={adjustment} locale={locale}/>
   {counterCents(selected.outstanding)>BigInt(0)&&<fieldset disabled={locked} className="svc-counter-form"><h3>{t.payment} · {t.balance}: {selected.outstanding} {selected.currency}</h3><label>{t.paid}<input inputMode="decimal" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)}/></label><label>{t.date}<input type="date" min={selected.effective_date} max={today()} value={extraDate} onChange={e=>setExtraDate(e.target.value)}/></label><label>{t.method}<select value={extraMethod} onChange={e=>setExtraMethod(e.target.value as Payment["method"])}>{(["cash","mobile_money","bank","other"] as const).map(m=><option key={m} value={m}>{t[m]}</option>)}</select></label><button type="button" onClick={preparePayment}>{t.payment}</button></fieldset>}
   {selected.revision!==undefined&&<ServicesCounterAdjustments key={`${selected.sale_ref}:${selected.revision}`} sale={selected} offerings={offerings} base={base} binding={binding} locale={locale} disabled={parentLocked} onBusy={setAdjusting} onDenied={()=>{setRows([]);setSelected(null);deny.current();}} onSaved={result=>{setSelected(result);setReceipt(result.adjustments?.at(-1)?.adjustment_ref??"");void load();window.dispatchEvent(new Event("services:finance-updated"));}}/>}
   <h3>{a.history}</h3>{!selected.adjustments?.length&&<p>{a.none}</p>}<ul>{selected.adjustments?.map(v=><li key={v.adjustment_ref}><button type="button" onClick={()=>setReceipt(v.adjustment_ref)}>{a[v.kind]} · {v.effective_date} · {v.kind==="bill_correction"?v.bill_delta:v.amount} {selected.currency} · {a[v.reason_code]}</button></li>)}</ul>
  </div>}</div>
 </section>;
}
