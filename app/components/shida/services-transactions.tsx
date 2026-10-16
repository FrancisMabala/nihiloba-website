"use client";
import {useWorkDraft,leaveWork} from "@/app/lib/restaurant-work";
import {providerCopy} from "@/app/lib/services-provider-copy";
import {useCallback,useEffect,useRef,useState} from 'react';
import {servicesText,type ServicesLocale} from './services-transaction-copy';
import {ServicesBillPanel} from './services-bill-panel';
import {ServicesTemplatePicker} from './services-template-library';
import {ServicesCustomerHistory} from './services-customer-history';

type Row=Record<string,unknown>;
type Kind='requests'|'reservations'|'messages';
const str=(row:Row,key:string)=>typeof row[key]==='string'?row[key] as string:'';
const list=(row:Row,key:string)=>Array.isArray(row[key])?row[key] as Row[]:[];
const actions=(row:Row)=>Array.isArray(row.actions)?row.actions as string[]:[];
const branchLabel=(row:Row)=>{const branch=row.selected_branch as Row|undefined;return branch?String(branch.name??'')+' · '+String(branch.broad_area??''):'';};
const transactionRef=(row:Row)=>str(row,'thread_ref')||str(row,'request_ref')||str(row,'reservation_ref');
const inputDate=(value:string)=>value?value.replace(/Z$/,'').slice(0,16):'';

export function ServicesTransactions({base,binding,locale,initialKind='requests',offeringRef,billAvailable,financeAvailable,onDenied}:{base:string;binding:string;locale:ServicesLocale;initialKind?:Kind;offeringRef?:string|null;billAvailable:boolean;financeAvailable:boolean;onDenied:()=>void}) {
 const t=useCallback((key:string)=>servicesText(locale,key),[locale]);
 const [kind,setKind]=useState<Kind>(initialKind),[rows,setRows]=useState<Row[]>([]),[offset,setOffset]=useState(0),[more,setMore]=useState(false);
 const [detail,setDetail]=useState<Row|null>(null),[lifecycle,setLifecycle]=useState<Row|null>(null),[quotes,setQuotes]=useState<Row[]>([]),[quote,setQuote]=useState<Row|null>(null),[quoteOffset,setQuoteOffset]=useState(0),[quoteMore,setQuoteMore]=useState(false);
 const [messageOffset,setMessageOffset]=useState(0);
 const replay=useRef<{fingerprint:string;key:string}|null>(null);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[form,setForm]=useState<string|null>(null),[fields,setFields]=useState<Record<string,string>>({});
 useWorkDraft(form!==null,providerCopy[locale].leave);
 const pendingBooking=useRef<string|null>(null);
 const pendingLink=useRef<{kind:Kind;ref:string;quoteRef?:string}|null>(null);
 const generation=useRef(0),alive=useRef(false),denied=useRef(onDenied);
 useEffect(()=>{denied.current=onDenied;},[onDenied]);
 const controller=useRef<AbortController|null>(null);
 const clear=useCallback(()=>{setRows([]);setDetail(null);setLifecycle(null);setQuotes([]);setQuote(null);setForm(null);setFields({});},[]);
 const call=useCallback(async(path:string,method='GET',body?:Row)=>{
  const response=await fetch(`${base}/transactions/${path}`,{method,credentials:'include',cache:'no-store',signal:controller.current?.signal,headers:{Accept:'application/json','X-Shida-Session':binding,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  if(!response.ok)throw new Error(String(response.status));
  return await response.json() as Row;
 },[base,binding]);
 const error=useCallback((value:unknown)=>{
  if(value instanceof Error&&value.name==='AbortError')return;
  const status=value instanceof Error?value.message:'';
  if(['401','403','404'].includes(status)){clear();denied.current();}
  else setNotice(t(status==='409'?'stale':'failed'));
 },[clear,t]);
 const load=useCallback(async()=>{
  const ticket=++generation.current;clear();setBusy(true);
  try{const value=await call(`${kind}${kind==='messages'?'':`?offset=${offset}`}`);if(alive.current&&ticket===generation.current){setRows(list(value,kind==='messages'?'threads':kind));setMore(kind==='reservations'?list(value,kind).length===100:!!value.has_more);}
   if(kind==='reservations'&&pendingBooking.current){const target=pendingBooking.current;pendingBooking.current=null;const booking=await call(`reservations/${target}`);const life=await call(`reservations/${target}/lifecycle`);if(alive.current&&ticket===generation.current){setDetail(booking);setLifecycle(life);}}
   if(pendingLink.current?.kind===kind&&alive.current){const target=pendingLink.current;pendingLink.current=null;
    const detail=await call(`${kind}/${target.ref}`);const lifecycle=kind==='reservations'?await call(`reservations/${target.ref}/lifecycle`):null;
    const history=kind==='requests'?await call(`requests/${target.ref}/quotes`):null;
    const selectedQuote=target.quoteRef?await call(`quotes/${target.quoteRef}`):null;
    if(alive.current&&ticket===generation.current){setDetail(detail);setLifecycle(lifecycle);setQuotes(history?list(history,'quotes'):[]);setQuoteOffset(0);setQuoteMore(!!history?.has_more);setQuote(selectedQuote);setMessageOffset(0);}}}
  catch(e){if(alive.current&&ticket===generation.current)error(e);}finally{if(alive.current&&ticket===generation.current)setBusy(false);}
 },[call,clear,error,kind,offset]);
 useEffect(()=>{let mounted=true;alive.current=true;const abort=new AbortController();controller.current=abort;queueMicrotask(()=>{if(mounted)void load();});const focus=()=>void load();window.addEventListener('focus',focus);return()=>{mounted=false;alive.current=false;abort.abort();window.removeEventListener('focus',focus);};},[load]);
 async function open(row:Row){
  const ticket=++generation.current;setBusy(true);setDetail(null);setLifecycle(null);setQuote(null);setQuotes([]);setForm(null);setNotice('');setFields({});setMessageOffset(0);
  try{const value=await call(`${kind}/${transactionRef(row)}`);let extra:Row|null=null;
   if(kind==='reservations')extra=await call(`reservations/${transactionRef(row)}/lifecycle`);
   if(alive.current&&ticket===generation.current){setDetail(value);setLifecycle(extra);}
   if(kind==='requests'){const history=await call(`requests/${transactionRef(row)}/quotes`);if(alive.current&&ticket===generation.current){setQuotes(list(history,'quotes'));setQuoteOffset(0);setQuoteMore(!!history.has_more);}}
  }catch(e){if(alive.current&&ticket===generation.current)error(e);}finally{if(alive.current&&ticket===generation.current)setBusy(false);}
 }
 async function historyPage(next:number){if(!detail)return;setBusy(true);try{const value=await call(`requests/${transactionRef(detail)}/quotes?offset=${next}`);if(alive.current){setQuotes(list(value,'quotes'));setQuoteOffset(next);setQuoteMore(!!value.has_more);}}catch(e){if(alive.current)error(e);}finally{if(alive.current)setBusy(false);}}
 async function messagePage(next:number){if(!detail)return;setBusy(true);try{const value=await call(`messages/${str(detail,'thread_ref')}?offset=${next}`);if(alive.current){setDetail(value);setMessageOffset(next);}}catch(e){if(alive.current)error(e);}finally{if(alive.current)setBusy(false);}}
 async function openQuote(row:Row){setBusy(true);setForm(null);try{const value=await call(`quotes/${str(row,'quote_ref')}`);if(alive.current)setQuote(value);}catch(e){if(alive.current)error(e);}finally{if(alive.current)setBusy(false);}}
 function begin(action:string){replay.current=null;setForm(action);setFields(action==='edit'&&quote?{amount:str(quote,'amount'),currency:str(quote,'currency'),pricing_description:str(quote,'pricing_description'),duration_minutes:String(quote.duration_minutes??''),proposed_start:inputDate(str(quote,'proposed_start')),proposed_end:inputDate(str(quote,'proposed_end')),terms:str(quote,'terms'),expires_at:inputDate(str(quote,'expires_at'))}:{});}
 async function submit(event:React.FormEvent){
  event.preventDefault();if(!detail||!form||busy)return;setBusy(true);setNotice('');
  const current=detail,action=form,epoch=generation.current;const fingerprint=JSON.stringify([kind,transactionRef(current),current.revision,quote?.revision,action,fields]);if(replay.current?.fingerprint!==fingerprint)replay.current={fingerprint,key:crypto.randomUUID()};const key=replay.current.key;let path=`${kind}/${transactionRef(current)}`,method='POST';let body:Row={revision:current.revision,idempotency_key:key};
  if(action==='create_quote'||action==='edit'){
   path=action==='edit'?`quotes/${str(quote!,'quote_ref')}`:`requests/${transactionRef(current)}/quotes`;method=action==='edit'?'PATCH':'POST';body.revision=action==='edit'?quote!.revision:current.revision;
   body={...body,amount:fields.amount,currency:fields.currency||'USD',duration_minutes:Number(fields.duration_minutes),pricing_description:fields.pricing_description||null,terms:fields.terms||null,proposed_start:fields.proposed_start+':00Z',proposed_end:fields.proposed_end?fields.proposed_end+':00Z':null,expires_at:fields.expires_at?fields.expires_at+':00Z':null};
  }else if(['send','withdraw'].includes(action)&&kind==='requests'){path=`quotes/${str(quote!,'quote_ref')}/${action}`;body.revision=quote!.revision;}
  else if(kind==='requests'){path+=`/${action}`;if(action==='decline')body.reason_code=fields.reason;}
  else if(kind==='messages'){path+='/actions';body={...body,action:action==='reply'?'send':action,body:fields.body||''};}
  else if(action==='accept'||action==='decline'){path+='/decision';body={...body,decision:action,...(action==='decline'?{reason_code:fields.reason,reason_text:fields.description||t(fields.reason)}:{})};}
  else if(action==='propose'){path+='/reschedule-proposals';body={...body,revision:lifecycle!.revision,proposed_date:fields.date,proposed_start_time:fields.start_time,proposed_end_time:fields.end_time||null,description:fields.description||''};}
  else if(action==='reschedule_accept'||action==='reschedule_reject'){const scheduling=lifecycle?.rescheduling as Row;const proposal=scheduling.proposal as Row;path+=`/reschedule-proposals/${str(proposal,'proposal_ref')}/decision`;body={...body,revision:lifecycle!.revision,proposal_revision:proposal.revision,decision:action.replace('reschedule_','')};}
  else{path+=`/lifecycle/${action}`;body={...body,revision:lifecycle!.revision,reason_code:fields.reason||'',description:fields.description||''};}
  try{await call(path,method,body);if(alive.current&&epoch===generation.current){replay.current=null;await open(current);setNotice(t('saved'));}}
  catch(e){if(alive.current&&epoch===generation.current){if(e instanceof Error&&e.message==='409'){await open(current);setNotice(t('stale'));}else error(e);}}
  finally{if(alive.current)setBusy(false);}
 }
 const pageSize=kind==='reservations'?100:20;
 const visibleRows=offeringRef? [...rows].sort((a,b)=>Number(b.offering_ref===offeringRef)-Number(a.offering_ref===offeringRef)):rows;
 const scheduling=(lifecycle?.rescheduling??{}) as Row,proposal=scheduling.proposal as Row|undefined;
 const title=(row:Row)=>str(row,'offering')||str(row,'service_name')||str(row,'title');
 const stamp=(value:unknown)=>typeof value==='string'&&Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(value)):'';
 function field(name:string,label:string,type='text',required=false){return <label key={name}>{t(label)}<input type={type} required={required} min={type==='number'?1:undefined} maxLength={2000} value={fields[name]??''} onChange={e=>setFields(old=>({...old,[name]:e.target.value}))}/></label>;}
 const quoteForm=form==='edit'||form==='create_quote';
 const reasonChoices=form==='decline'?kind==='requests'?['NOT_AVAILABLE','OUTSIDE_SCOPE','CANNOT_SERVE_LOCATION','INSUFFICIENT_INFORMATION','OTHER']:['provider_unavailable','slot_unavailable','request_mismatch','area_too_far','insufficient_information','other']:form==='cancel'?['UNAVAILABLE','EMERGENCY','SCHEDULING_ISSUE','CANNOT_PERFORM_SERVICE','OTHER']:form==='dispute'?(lifecycle?.dispute_reasons as string[]??[]):[];
 return <section className="services-transactions" aria-label={t('workspace')}>
  <ServicesCustomerHistory base={base} binding={binding} locale={locale} financeAvailable={financeAvailable} onOpen={(target,ref,quoteRef)=>{pendingLink.current={kind:target,ref,quoteRef};if(kind===target&&offset===0)void load();else{setKind(target);setOffset(0);}}}/>
  <h2>{t('workspace')}</h2><fieldset disabled={busy}><div className="transaction-actions">{(['requests','reservations','messages'] as Kind[]).map(value=><button type="button" key={value} aria-pressed={kind===value} onClick={()=>{if(!leaveWork())return;clear();setOffset(0);setKind(value);setNotice('');}}>{t(value)}</button>)}<button type="button" onClick={()=>void load()}>{t('refresh')}</button></div></fieldset>
  {busy&&<p role="status" aria-live="polite">…</p>}{notice&&<p role="status">{notice}</p>}
  {!detail?<fieldset disabled={busy}>{visibleRows.length===0&&!busy&&<p>{t('empty')}</p>}{visibleRows.map(row=><button className="transaction-row" type="button" key={transactionRef(row)} onClick={()=>void open(row)}><strong>{title(row)}</strong><span>{t(str(row,'status'))} · {str(row,'requester')||str(row,'requester_name')||str(row,'preview')}</span><span>{str(row,'requested_datetime')||stamp(row.created_at||row.last_message_at)}</span></button>)}<div className="transaction-actions">{offset>0&&<button onClick={()=>setOffset(Math.max(0,offset-pageSize))}>{t('previous')}</button>}{more&&<button onClick={()=>setOffset(offset+pageSize)}>{t('more')}</button>}</div></fieldset>:
   <fieldset disabled={busy}><button type="button" onClick={()=>void load()}>{t('back')}</button><h3>{title(detail)}</h3><p>{t(str(detail,'status'))}</p><p>{str(detail,'description')}</p>{branchLabel(detail)&&<p>📍 {branchLabel(detail)}</p>}
    {kind==='requests'&&<><p>{str(detail,'requester')} · {str(detail,'preferred_date')} {str(detail,'preferred_start_time')}</p><div className="transaction-actions">{actions(detail).filter(a=>['review','decline'].includes(a)).map(a=><button key={a} onClick={()=>begin(a)}>{t(a)}</button>)}{!!detail.can_create_quote&&!detail.draft_quote_ref&&<button onClick={()=>begin('create_quote')}>{t('create_quote')}</button>}{!!detail.reservation_ref&&<button onClick={()=>{pendingBooking.current=str(detail,'reservation_ref');setKind('reservations');setOffset(0);}}>{t('view_reservation')}</button>}</div>
     {(!!detail.can_create_quote&&!detail.draft_quote_ref||quote?.status==='DRAFT')&&<ServicesTemplatePicker key={`${transactionRef(detail)}:${quote?.quote_ref??'new'}`} base={base} binding={binding} locale={locale} kind="quote" targetRef={transactionRef(detail)} targetRevision={Number(quote?.status==='DRAFT'?quote.revision:detail.revision)} draftRef={quote?.status==='DRAFT'?str(quote,'quote_ref'):undefined} onApplied={value=>{void (async()=>{await open(detail);await openQuote({quote_ref:String(value.quote_ref)});})();}}/>}
     <h4>{t('history')}</h4>{quotes.length===0&&<p>{t('empty')}</p>}{quotes.map(row=><button className="transaction-row" key={str(row,'quote_ref')} onClick={()=>void openQuote(row)}>{t('quote')} · {t(str(row,'status'))} · {str(row,'amount')} {str(row,'currency')}<span>{stamp(row.sent_at||row.created_at)}</span></button>)}<div className="transaction-actions">{quoteOffset>0&&<button onClick={()=>void historyPage(quoteOffset-10)}>{t('previous')}</button>}{quoteMore&&<button onClick={()=>void historyPage(quoteOffset+10)}>{t('more')}</button>}</div>
     {quote&&<article>{branchLabel(quote)&&<p>📍 {branchLabel(quote)}</p>}<h4>{t('quote')} · {t(str(quote,'status'))}</h4>{quote.status==='DRAFT'&&<p>{t('private')}</p>}<p>{str(quote,'amount')} {str(quote,'currency')} · {String(quote.duration_minutes??'')} {t('duration')}</p><p>{str(quote,'pricing_description')}</p><p>{str(quote,'terms')}</p><p>{t('scheduled')}: {stamp(quote.proposed_start)} — {stamp(quote.proposed_end)}</p><p>{t('expires')}: {stamp(quote.expires_at)}</p><p>{t('schedule_note')}</p><div className="transaction-actions">{actions(quote).filter(a=>['edit','send','withdraw'].includes(a)).map(a=><button key={a} onClick={()=>begin(a)}>{t(a)}</button>)}</div></article>}
    </>}
    {kind==='reservations'&&<><p>{str(detail,'requested_datetime')} · {str(detail,'selected_offering_name')}</p>{detail.status==='pending'&&<p>{t('pending_note')}</p>}<div className="transaction-actions">{!!detail.can_respond&&<><button onClick={()=>begin('accept')}>{t('accept')}</button><button onClick={()=>begin('decline')}>{t('decline')}</button></>}{lifecycle&&actions(lifecycle).map(a=><button key={a} onClick={()=>begin(a)}>{t(a)}</button>)}{actions(scheduling).includes('propose')&&<button onClick={()=>begin('propose')}>{t('propose')}</button>}</div>
     <h4>{t('history')}</h4>{['confirmed_at','started_at','completed_at','cancelled_at','no_show_at'].filter(key=>lifecycle?.[key]).map(key=><p key={key}>{t(({confirmed_at:'confirmed',started_at:'in_progress',completed_at:'completed',cancelled_at:'cancelled',no_show_at:'no_show_reported'} as Record<string,string>)[key])} · {stamp(lifecycle![key])}</p>)}
     {!!lifecycle?.accepted_quote&&<p>{t('quote')} · {str(lifecycle.accepted_quote as Row,'amount')} {str(lifecycle.accepted_quote as Row,'currency')} · {str(lifecycle.accepted_quote as Row,'terms')}</p>}
     {billAvailable&&<ServicesBillPanel key={transactionRef(detail)} base={base} binding={binding} locale={locale}
      reservationRef={transactionRef(detail)} reservationRevision={Number(lifecycle?.revision??detail.revision)}
      status={str(lifecycle??detail,'status')} blocked={!!lifecycle?.no_show_at||['OPEN','UNDER_REVIEW'].includes(str((lifecycle?.dispute??{}) as Row,'status'))}/>}
     {proposal&&<article><p>{t('propose')} · {t(str(proposal,'status'))}</p><p>{stamp(proposal.proposed_start)} {stamp(proposal.proposed_start_at)} — {stamp(proposal.proposed_end)} {stamp(proposal.proposed_end_at)}</p><p>{str(proposal,'description')}</p>{!!proposal.actionable&&actions(proposal).map(a=><button key={a} onClick={()=>begin(`reschedule_${a}`)}>{t(a==='accept'?'confirm':'reject')}</button>)}</article>}
    </>}
    {kind==='messages'&&<><h4>{t('history')}</h4>{list(detail,'messages').map((row,index)=><p key={index}><strong>{str(row,'sender_name')||t(str(row,'sender'))}</strong> · {stamp(row.created_at)}<br/><span>{str(row,'body')}</span></p>)}<div className="transaction-actions">{messageOffset>0&&<button onClick={()=>void messagePage(Math.max(0,messageOffset-20))}>{t('previous')}</button>}{!!detail.has_more&&<button onClick={()=>void messagePage(messageOffset+20)}>{t('more')}</button>}{actions(detail).filter(a=>a!=='read').map(a=><button key={a} onClick={()=>begin(a==='send'?'reply':a)}>{t(a==='send'?'reply':a)}</button>)}</div></>}
    {form&&<form onSubmit={submit}><h4>{t(quoteForm?form==='edit'?'edit':'create_quote':form.startsWith('reschedule_')?'confirm':form)}</h4>
     {quoteForm&&<><p>{t('private')}</p>{field('amount','amount','text',true)}<label>{t('currency')}<select value={fields.currency||'USD'} onChange={e=>setFields(old=>({...old,currency:e.target.value}))}><option>USD</option><option>CDF</option></select></label>{field('duration_minutes','duration','number',true)}{field('proposed_start','scheduled','datetime-local',true)}{field('proposed_end','end_time','datetime-local')}{field('expires_at','expires','datetime-local')}{field('pricing_description','description')}{field('terms','terms')}</>}
     {reasonChoices.length>0&&<label>{t('reason')}<select required value={fields.reason||''} onChange={e=>setFields(old=>({...old,reason:e.target.value}))}><option value=""></option>{reasonChoices.map(value=><option key={value} value={value}>{t(value==='OTHER'||value==='other'?'other_reason':value==='UNAVAILABLE'?'not_available':value)}</option>)}</select></label>}
     {kind==='reservations'&&['decline','cancel','dispute','requester_no_show','propose'].includes(form)&&field('description','description','text',form==='dispute'||fields.reason?.toLowerCase()==='other')}
     {form==='propose'&&<>{field('date','date','date',true)}{field('start_time','start_time','time',true)}{field('end_time','end_time','time')}</>}
     {['reply','reopen'].includes(form)&&<label>{t('body')}<textarea required maxLength={form==='reopen'?500:1000} value={fields.body||''} onChange={e=>setFields(old=>({...old,body:e.target.value}))}/></label>}
     <div className="transaction-actions"><button type="submit">{t(quoteForm?'save':'confirm')}</button><button type="button" onClick={()=>setForm(null)}>{t('back')}</button></div>
    </form>}
   </fieldset>}
  <style>{`.services-transactions{margin:1.5rem 0;padding:1rem;border:1px solid #cbd5e1;border-radius:12px;overflow-wrap:anywhere}.services-transactions fieldset{border:0;padding:0;min-width:0}.services-transactions button{padding:.65rem .9rem;cursor:pointer;border:1px solid #94a3b8;border-radius:6px;background:#fff;color:#172554}.services-transactions button[aria-pressed=true]{background:#172554;color:white}.services-transactions button:disabled{opacity:.55;cursor:wait}.transaction-actions{display:flex;flex-wrap:wrap;gap:.5rem;margin:.8rem 0}.services-transactions .transaction-row{display:block;width:100%;text-align:left;margin:.5rem 0}.transaction-row span{display:block;font-size:.9em;margin-top:.3rem}.services-transactions form{display:grid;gap:.8rem;padding:1rem;background:#f1f5f9;color:#172554;border-radius:8px}.services-transactions label{display:grid;gap:.3rem}.services-transactions input,.services-transactions select,.services-transactions textarea{width:100%;min-width:0;box-sizing:border-box;padding:.65rem;border:1px solid #94a3b8;border-radius:4px}.services-transactions article{border-left:3px solid #94a3b8;padding-left:1rem}`}</style>
 </section>;
}
