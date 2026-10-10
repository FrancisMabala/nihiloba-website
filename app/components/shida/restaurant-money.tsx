'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {request,DashboardApiError} from '../../lib/restaurant-seller-browser';
import {servicePath,type ServiceAssignment} from '../../lib/restaurant-service-contract';
import {moneyText,type MoneyLocale} from '../../lib/restaurant-money-copy';
import {workText} from '../../lib/restaurant-work-copy';
import './restaurant-money.css';

type Currency='CDF'|'USD';
type Round={order_ref:string;state:string;currency:Currency;amount:string};
type Method={method_ref:string;label:string;kind:'cash'|'external_mobile_money';currencies:Currency[];enabled:boolean;revision:number};
type Entry={entry_ref:string;kind:string;target_ref:string|null;currency:Currency;amount:string;change_returned:string;net_amount:string;method:{method_ref:string;label:string;kind:string;provider_verified:false};allocations:{order_ref:string;amount:string}[]};
type Totals={chargeable:string;net_allocated:string;balance_due:string;refund_owed:string};
type Bill={group_ref:string;group_revision:number;payment_revision:number;bill_revision:string;state:'open'|'checkout'|'closed';chargeable_rounds:Round[];pending_rounds:Round[];excluded_rounds:Round[];currencies:Record<Currency,Totals>;entries:Entry[]};
type Receipt={bill_revision:string;payment_revision:number;original_rounds:(Round&{immutable_terms:{food_subtotal:string;delivery_fee:string|null;order_total:string;currency:Currency;food:{standalone:Record<string,unknown>[];plates:{components:Record<string,unknown>[]}[]}}})[];entries:Entry[];currencies:Record<Currency,Totals>;statement:string;settlement_statement:string;settled_in_restaurant_records:boolean};
type Kind='receipt'|'reversal'|'refund'|'reconciliation';
type Pending=Readonly<{path:string;body:string;kind:Kind;binding:string;billPath:string;recoverPath:string;scope:string;absence:boolean}>;
const decimal=(s:string)=>/^\d{1,15}(?:\.\d{1,2})?$/.test(s)&&Number(s)>0;
const safeChange=(s:string)=>s===''||/^\d{1,15}(?:\.\d{1,2})?$/.test(s);
const endpoint:Record<Kind,string>={receipt:'receipts',reversal:'reversals',refund:'refunds',reconciliation:'reconcile-excess'};

export function RestaurantMoney({path,groupRef,groupRevision,binding,locale,assignment,paymentAssignment,onChanged,recoveryOnly=false}:{path:string;groupRef:string;groupRevision?:number;binding:string;locale:MoneyLocale;assignment?:ServiceAssignment;paymentAssignment?:ServiceAssignment;onChanged?:()=>void;recoveryOnly?:boolean}){
 const t=useCallback((key:string)=>moneyText(locale,key),[locale]);
 const owner=!assignment,canPay=owner||!!paymentAssignment;
 const serviceRef=assignment?.assignment_ref,serviceRevision=assignment?.assignment_revision,paymentRef=paymentAssignment?.assignment_ref,paymentRevision=paymentAssignment?.assignment_revision;
 const service=useCallback((suffix:string,query:Record<string,string>={})=>servicePath(path,suffix,serviceRef&&serviceRevision?{assignment_ref:serviceRef,assignment_revision:serviceRevision}:undefined,query),[path,serviceRef,serviceRevision]);
 const payment=useCallback((suffix:string)=>servicePath(path,suffix,owner?undefined:paymentRef&&paymentRevision?{assignment_ref:paymentRef,assignment_revision:paymentRevision}:undefined),[path,owner,paymentRef,paymentRevision]);
 const root='/groups/'+groupRef;
 const [bill,setBill]=useState<Bill|null>(null),[methods,setMethods]=useState<Method[]>([]),[receipt,setReceipt]=useState<Receipt|null>(null);
 const [kind,setKind]=useState<Kind>('receipt'),[methodRef,setMethodRef]=useState(''),[currency,setCurrency]=useState<Currency|''>(''),[amount,setAmount]=useState(''),[change,setChange]=useState(''),[target,setTarget]=useState(''),[order,setOrder]=useState(''),[reason,setReason]=useState('');
 const [pending,setPending]=useState<Pending|null>(null),[busy,setBusy]=useState(false),[fresh,setFresh]=useState(false),[message,setMessage]=useState('');
 const live=useRef(true),epoch=useRef(0),lock=useRef(false);
 const clear=useCallback(()=>{epoch.current++;setBill(null);setMethods([]);setReceipt(null);setPending(null);setFresh(false);setMethodRef('');setCurrency('');setAmount('');setChange('');setTarget('');setOrder('');setReason('');},[]);
 const lost=useCallback((e:unknown)=>{if(e instanceof DashboardApiError&&[401,403,404].includes(e.status)){clear();setMessage(t('stale'));return true;}return false;},[clear,t]);
 const read=useCallback(async()=>{
  if(!navigator.onLine||document.hidden)return false;
  const generation=epoch.current;
  try{
   const next=await request(service(root+'/bill'),{},binding) as Bill;
   const choices=canPay?await request(payment(root+'/payment-methods'),{},binding) as {items:Method[]}:{items:[]};
   if(!live.current||generation!==epoch.current)return false;
   setBill(next);setMethods(choices.items);setReceipt(old=>old&&old.bill_revision===next.bill_revision&&old.payment_revision===next.payment_revision?old:null);setFresh(true);return true;
  }catch(e){if(live.current&&generation===epoch.current){setFresh(false);if(!lost(e))setMessage(t('stale'));}return false;}
 },[service,payment,root,binding,canPay,lost,t]);
 useEffect(()=>{live.current=true;let stopped=false,timer:ReturnType<typeof setTimeout>,delay=30000;
  const poll=async()=>{if(stopped)return;if(lock.current){timer=setTimeout(()=>void poll(),500);return;}lock.current=true;setBusy(true);const ok=await read();lock.current=false;setBusy(false);delay=ok?30000:Math.min(120000,delay*2);if(!stopped)timer=setTimeout(()=>void poll(),delay);};
  const resume=()=>{setFresh(false);if(!document.hidden&&navigator.onLine)void poll();};void poll();window.addEventListener('focus',resume);window.addEventListener('online',resume);document.addEventListener('visibilitychange',resume);window.addEventListener('shida-signout',clear);
  return()=>{stopped=true;live.current=false;clearTimeout(timer);clear();window.removeEventListener('focus',resume);window.removeEventListener('online',resume);document.removeEventListener('visibilitychange',resume);window.removeEventListener('shida-signout',clear);};
 },[read,clear]);
 useEffect(()=>{if(groupRevision===undefined)return;const timer=setTimeout(()=>void read(),0);return()=>clearTimeout(timer);},[groupRevision,read]);
 const execute=async(pathToCall:string,body:object,onSuccess:(value:unknown)=>void)=>{if(lock.current||!fresh||pending||!navigator.onLine)return;lock.current=true;setBusy(true);setMessage('');const generation=epoch.current;
  try{const value=await request(pathToCall,{method:'POST',body:JSON.stringify(body)},binding);if(!live.current||generation!==epoch.current)return;onSuccess(value);await read();onChanged?.();}
  catch(e){if(!live.current||generation!==epoch.current)return;if(!lost(e)){setFresh(false);setMessage(e instanceof DashboardApiError&&e.status===409?t('stale'):t('uncertain'));await read();}}
  finally{lock.current=false;if(live.current)setBusy(false);}
 };
 const checkout=()=>{if(!bill||bill.pending_rounds.length||bill.state!=='open')return;if(!window.confirm(t('freeze')))return;void execute(service(root+'/checkout'),{operation_key:crypto.randomUUID(),expected_revision:bill.group_revision},value=>setBill((value as {bill:Bill}).bill));};
 const reopen=()=>{if(!bill||bill.state!=='checkout'||bill.payment_revision)return;if(!window.confirm(t('reopen')))return;void execute(service(root+'/reopen'),{operation_key:crypto.randomUUID(),expected_revision:bill.group_revision,expected_payment_revision:bill.payment_revision},value=>setBill((value as {bill:Bill}).bill));};
 const selected=methods.find(m=>m.method_ref===methodRef),original=bill?.entries.find(e=>e.entry_ref===target);
 const valid=!!bill&&canPay&&!!selected&&(selected.enabled||kind==='reversal')&&!!currency&&selected.currencies.includes(currency)&&decimal(amount)&&safeChange(change)&&
  (selected.kind==='cash'||!change||Number(change)===0)&&(kind==='receipt'||!change||Number(change)===0)&&Number(change||0)<Number(amount)&&
  (kind==='receipt'||owner&&!recoveryOnly&&kind==='reconciliation'&&!!order||owner&&['reversal','refund'].includes(kind)&&!!original&&original.currency===currency&&reason.trim().length>0&&reason.length<=240);
 const moneyWrite=async()=>{if(!bill||!valid||lock.current||pending||!fresh)return;
  const body={operation_key:crypto.randomUUID(),method_ref:methodRef,currency,amount,change_returned:change||'0',expected_bill_revision:bill.bill_revision,expected_payment_revision:bill.payment_revision,...(['reversal','refund'].includes(kind)?{target_ref:target,reason:reason.trim()}:{}),...(kind==='refund'?{actually_returned:true}:{}),...(kind==='reconciliation'?{order_ref:order,reason:'received_before_conflict'}:{})};
  const summary=`${t(kind==='receipt'?'record':kind==='reconciliation'?'excess':kind)}\n${selected?.label} · ${currency} · ${amount}${change&&Number(change)>0?` · ${t('change')}: ${change}`:''}`;
  if(!window.confirm(`${t('confirm')}\n\n${summary}`))return;
  const envelope:Pending=Object.freeze({path:payment(root+'/money/'+endpoint[kind]),body:JSON.stringify(body),kind,binding,billPath:service(root+'/bill'),recoverPath:payment(root+'/money/recover'),scope:`${path}:${groupRef}:${assignment?.assignment_ref??'owner'}:${assignment?.assignment_revision??0}:${paymentAssignment?.assignment_ref??'owner'}:${paymentAssignment?.assignment_revision??0}`,absence:false});lock.current=true;setBusy(true);setMessage('');setPending(envelope);const generation=epoch.current;
  try{const value=await request(envelope.path,{method:'POST',body:envelope.body},binding) as {bill:Bill};if(!live.current||generation!==epoch.current)return;setPending(null);setBill(value.bill);setReceipt(null);setAmount('');setChange('');setTarget('');setReason('');await read();}
  catch(e){if(!live.current||generation!==epoch.current)return;if(e instanceof DashboardApiError&&e.status<500&&e.status!==429){setPending(null);if(!lost(e)){setAmount('');setChange('');setMessage(t('stale'));await read();}}else setMessage(t('uncertain'));}
  finally{lock.current=false;if(live.current)setBusy(false);}
 };
 const recover=async()=>{if(!pending||lock.current||!navigator.onLine)return;lock.current=true;setBusy(true);const generation=epoch.current;
  try{const latest=await request(pending.billPath,{},pending.binding) as Bill;const outcome=await request(pending.recoverPath,{method:'POST',body:JSON.stringify({...JSON.parse(pending.body),kind:pending.kind})},pending.binding) as {found:boolean;bill:Bill;operation_outcome?:{entry_ref:string}};
   if(!live.current||generation!==epoch.current)return;setBill(outcome.bill??latest);setReceipt(null);setFresh(true);if(outcome.found){setPending(null);setAmount('');setChange('');setMethodRef('');setCurrency('');setMessage(t('found'));}else{setPending({...pending,absence:true});setMessage(t('absent'));}}
  catch(e){if(!live.current||generation!==epoch.current)return;if(!lost(e)){setPending({...pending,absence:false});setMessage(t('uncertain'));}}
  finally{lock.current=false;if(live.current)setBusy(false);}
 };
 const retry=async()=>{if(!pending?.absence||lock.current||!navigator.onLine)return;lock.current=true;setBusy(true);const generation=epoch.current;
  try{const value=await request(pending.path,{method:'POST',body:pending.body},pending.binding) as {bill:Bill};if(!live.current||generation!==epoch.current)return;setBill(value.bill);setReceipt(null);setPending(null);setAmount('');setChange('');setMethodRef('');setCurrency('');setMessage(t('found'));await read();}
  catch(e){if(!live.current||generation!==epoch.current)return;if(!lost(e)){setPending({...pending,absence:false});setMessage(t('uncertain'));}}
  finally{lock.current=false;if(live.current)setBusy(false);}
 };
 const showReceipt=async()=>{if(!bill||lock.current)return;lock.current=true;setBusy(true);const generation=epoch.current;try{const value=await request(service(root+'/receipt',{language:locale}),{},binding) as Receipt;if(live.current&&generation===epoch.current)setReceipt(value);}catch(e){if(!lost(e))setMessage(t('stale'));}finally{lock.current=false;if(live.current)setBusy(false);}};
 const rounds=(label:string,rows:Round[])=><section><h4>{t(label)}</h4>{rows.map(r=><p key={r.order_ref}>{r.order_ref} · {workText(locale,r.state)} · {r.amount} {r.currency}</p>)}</section>;
 const entryKind=(value:string)=>t(value==='receipt'?'entryReceipt':value==='reversal'?'entryReversal':value==='refund'?'entryRefund':'entryExcess');
 const lineText=(line:Record<string,unknown>)=>Object.entries(line).map(([k,v])=>`${t(k)}: ${typeof v==='string'?t(v):String(v)}`).join(' · ');
 return <section className="rst-money" lang={locale}><h3>{t('title')}</h3>{message&&<p role="status">{message}</p>}<button disabled={busy} onClick={()=>void read()}>{t('refresh')}</button>
 {bill&&(!recoveryOnly||bill.state!=='open')&&<>{rounds('chargeable',bill.chargeable_rounds)}{rounds('pending',bill.pending_rounds)}{rounds('excluded',bill.excluded_rounds)}
 <div className="rst-money-totals">{(['CDF','USD'] as const).map(c=><section key={c}><h4>{c}</h4><dl><div><dt>{t('charge')}</dt><dd>{bill.currencies[c].chargeable}</dd></div><div><dt>{t('allocated')}</dt><dd>{bill.currencies[c].net_allocated}</dd></div><div><dt>{t('due')}</dt><dd>{bill.currencies[c].balance_due}</dd></div><div><dt>{t('owed')}</dt><dd>{bill.currencies[c].refund_owed}</dd></div></dl></section>)}</div>
 {bill.state==='open'&&!recoveryOnly&&<button disabled={busy||!fresh||!!pending||!!bill.pending_rounds.length} onClick={checkout}>{t('freeze')}</button>}
 {bill.state==='checkout'&&<p role="status">{t('frozen')}</p>}{bill.state==='checkout'&&bill.payment_revision===0&&!recoveryOnly&&<button disabled={busy||!fresh||!!pending} onClick={reopen}>{t('reopen')}</button>}
 <h4>{t('entries')}</h4>{bill.entries.map(e=><p key={e.entry_ref}>{e.entry_ref} · {entryKind(e.kind)} · {e.method.label} · {e.currency} {e.amount} · {t('change')} {e.change_returned} · {t('allocated')} {e.net_amount}</p>)}
 {bill.state!=='open'&&<button disabled={busy||!fresh} onClick={()=>void showReceipt()}>{t('show')}</button>}
 {receipt&&<section className="rst-money-receipt"><h4>{t('receipt')}</h4><p>{receipt.statement}</p><p>{receipt.settlement_statement}</p>{receipt.settled_in_restaurant_records&&<p>{t('settled')}</p>}<p>{t('notInvoice')}</p>
 <h5>{t('terms')}</h5>{receipt.original_rounds.map(r=><section key={r.order_ref}><p>{r.order_ref} · {workText(locale,r.state)} · {r.amount} {r.currency}</p><p>{t('charge')}: {r.immutable_terms.food_subtotal} + {r.immutable_terms.delivery_fee??'0'} = {r.immutable_terms.order_total}</p>{r.immutable_terms.food.standalone.map((line,i)=><p key={i}>{lineText(line)}</p>)}{r.immutable_terms.food.plates.map((plate,i)=><div key={i}><p>{t('terms')} {i+1}</p>{plate.components.map((line,j)=><p key={j}>{lineText(line)}</p>)}</div>)}</section>)}
 <h5>{t('entries')}</h5>{receipt.entries.map(e=><section key={e.entry_ref}><p>{e.entry_ref} · {entryKind(e.kind)} · {e.target_ref??''} · {e.method.label} ({t(e.method.kind)}) · {e.amount} {e.currency} · {t('change')} {e.change_returned} · {t('allocated')} {e.net_amount}</p><p>{t('allocations')}: {e.allocations.map(a=>`${a.order_ref} ${a.amount}`).join('; ')}</p></section>)}{(['CDF','USD'] as const).map(c=><p key={c}>{c}: {t('due')} {receipt.currencies[c].balance_due} · {t('owed')} {receipt.currencies[c].refund_owed}</p>)}<button className="rst-money-print" onClick={()=>window.print()}>{t('print')}</button></section>}
 {pending&&<section role="alert"><p>{t('uncertain')}</p><button disabled={busy} onClick={()=>void recover()}>{t('recover')}</button>{pending.absence&&<button disabled={busy} onClick={()=>void retry()}>{t('retry')}</button>}<button disabled={busy} onClick={()=>{setPending(null);setMessage('');}}>{t('discard')}</button></section>}
 {!canPay&&<p>{t('noPayment')}</p>}
 {canPay&&bill.state!=='open'&&<fieldset disabled={busy||!fresh||!!pending}><legend>{t('record')}</legend><p>{t('mobile')}</p><label>{t('method')}<select value={methodRef} onChange={e=>{setMethodRef(e.target.value);setCurrency('');}}><option value="">—</option>{methods.filter(m=>m.enabled||kind==='reversal'&&m.method_ref===original?.method.method_ref).map(m=><option key={m.method_ref} value={m.method_ref}>{m.label} · {t(m.kind)}</option>)}</select></label><label>{t('currency')}<select value={currency} onChange={e=>setCurrency(e.target.value as Currency|'')}><option value="">—</option>{selected?.currencies.map(c=><option key={c} value={c}>{c}</option>)}</select></label><label>{t('amount')}<input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value.replace(',','.'))}/></label>{selected?.kind==='cash'&&<label>{t('change')}<input inputMode="decimal" value={change} onChange={e=>setChange(e.target.value.replace(',','.'))}/></label>}
 {owner&&<><label>{t('method')}<select value={kind} onChange={e=>{setKind(e.target.value as Kind);setMethodRef('');setTarget('');setOrder('');setReason('');}}><option value="receipt">{t('record')}</option><option value="reversal">{t('reversal')}</option><option value="refund">{t('refund')}</option>{!recoveryOnly&&<option value="reconciliation">{t('excess')}</option>}</select></label>{['reversal','refund'].includes(kind)&&<label>{t('target')}<select value={target} onChange={e=>{const entry=bill.entries.find(x=>x.entry_ref===e.target.value);setTarget(e.target.value);setCurrency(entry?.currency??'');setMethodRef(kind==='reversal'?entry?.method.method_ref??'':'');}}><option value="">—</option>{bill.entries.filter(e=>['receipt','reconciliation'].includes(e.kind)).map(e=><option key={e.entry_ref} value={e.entry_ref}>{e.entry_ref} · {e.currency} {e.net_amount}</option>)}</select></label>}{kind==='reconciliation'&&<label>{t('order')}<select value={order} onChange={e=>setOrder(e.target.value)}><option value="">—</option>{bill.chargeable_rounds.map(r=><option key={r.order_ref} value={r.order_ref}>{r.order_ref}</option>)}</select></label>}{['reversal','refund'].includes(kind)&&<label>{t('reason')}<textarea maxLength={240} value={reason} onChange={e=>setReason(e.target.value)}/></label>}{kind==='reconciliation'&&<p>received_before_conflict</p>}</>}
 <button disabled={!valid} onClick={()=>void moneyWrite()}>{t(kind==='receipt'?'record':kind==='reversal'?'reversal':kind==='refund'?'refund':'excess')}</button></fieldset>}
 </>}</section>;
}

export function RestaurantMoneyRecovery({path,binding,locale}:{path:string;binding:string;locale:MoneyLocale}){
 const [input,setInput]=useState(''),[groupRef,setGroupRef]=useState('');const t=(key:string)=>moneyText(locale,key);
 return <section className="rst-money" lang={locale}><h2>{t('recoveryTitle')}</h2><p>{t('recoveryHelp')}</p><label>{t('groupRef')}<input value={input} maxLength={64} onChange={e=>setInput(e.target.value)}/></label><button disabled={!/^[A-Za-z0-9_-]{1,64}$/.test(input)} onClick={()=>setGroupRef(input)}>{t('refresh')}</button>{groupRef&&<RestaurantMoney key={`${binding}:${path}:${groupRef}`} path={path} groupRef={groupRef} binding={binding} locale={locale} recoveryOnly/>}</section>;
}

export function RestaurantPaymentMethods({path,binding,locale}:{path:string;binding:string;locale:MoneyLocale}){
 const t=(k:string)=>moneyText(locale,k),root=path+'/service/payment-methods';
 const [items,setItems]=useState<Method[]>([]),[selected,setSelected]=useState(''),[label,setLabel]=useState(''),[kind,setKind]=useState<Method['kind']>('cash'),[currencies,setCurrencies]=useState<Currency[]>([]),[enabled,setEnabled]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const load=useCallback(async()=>{try{const result=await request(root,{},binding) as {items:Method[]};setItems(result.items);}catch{setItems([]);setSelected('');setLabel('');setCurrencies([]);setMessage(moneyText(locale,'stale'));}},[root,binding,locale]);
 useEffect(()=>{const timer=setTimeout(()=>void load(),0);const clear=()=>{setItems([]);setSelected('');setLabel('');setCurrencies([]);};window.addEventListener('shida-signout',clear);return()=>{clearTimeout(timer);window.removeEventListener('shida-signout',clear);};},[load]);
 const choose=(ref:string)=>{setSelected(ref);const row=items.find(m=>m.method_ref===ref);setLabel(row?.label??'');setKind(row?.kind??'cash');setCurrencies(row?.currencies??[]);setEnabled(row?.enabled??true);};
 const save=async()=>{if(!label.trim()||!currencies.length||busy)return;const row=items.find(m=>m.method_ref===selected);setBusy(true);setMessage('');try{await request(root+(row?'/'+row.method_ref:''),{method:row?'PUT':'POST',body:JSON.stringify({expected_revision:row?.revision??0,label:label.trim(),kind,currencies,enabled})},binding);choose('');await load();}catch{setMessage(t('stale'));await load();}finally{setBusy(false);}};
 return <section className="rst-money" lang={locale}><h2>{t('configure')}</h2>{message&&<p role="alert">{message}</p>}<button disabled={busy} onClick={()=>void load()}>{t('refresh')}</button><label>{t('method')}<select value={selected} onChange={e=>choose(e.target.value)}><option value="">{t('newMethod')}</option>{items.map(m=><option key={m.method_ref} value={m.method_ref}>{m.label}</option>)}</select></label><label>{t('label')}<input maxLength={80} value={label} onChange={e=>setLabel(e.target.value)}/></label><label>{t('method')}<select value={kind} onChange={e=>setKind(e.target.value as Method['kind'])}><option value="cash">{t('cash')}</option><option value="external_mobile_money">{t('external_mobile_money')}</option></select></label>{(['CDF','USD'] as const).map(c=><label key={c}><input type="checkbox" checked={currencies.includes(c)} onChange={e=>setCurrencies(old=>e.target.checked?[...old,c]:old.filter(x=>x!==c))}/>{c}</label>)}<label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>{t('enabled')}</label><p>{t('mobile')}</p><button disabled={busy||!label.trim()||!currencies.length} onClick={()=>void save()}>{t('save')}</button></section>;
}
