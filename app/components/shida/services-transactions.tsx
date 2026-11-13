"use client";
import {readWorkList} from "../../lib/services-work-list";
import {ServicesWorkSummary} from './services-work-summary';
import {workText} from '../../lib/services-work-copy';
import {workMatches,requestStage,workTone,type WorkFilter} from '../../lib/services-work-model';
import type {ProviderView} from '../../lib/services-provider-copy';
import {SellerWorkspaceIcon} from './seller-workspace';
import './services-work.css';
import {financialRequest,useFinancialCommand} from "../../lib/services-financial-state";
import "./services-financial.css";
import {serviceTransactionLink} from "../../lib/service-transaction-link";
import {ServiceReviewedBrief} from "./service-reviewed-brief";
import type {ServiceTaskLink} from "./services-today";
import {serviceLocalInput,serviceUtcInput,serviceTimestamp,serviceAmount,serviceProposalInput} from "../../lib/service-time";
import {useWorkDraft,leaveWork} from "@/app/lib/restaurant-work";
import {PERSONAL_SESSION_EVENT} from "../../lib/personal-session-browser";
import {useCallback,useEffect,useRef,useState} from 'react';
import {servicesText,type ServicesLocale} from './services-transaction-copy';
import {DocumentEditor} from './service-document-editor';
import {DocumentPaper} from './service-document-paper';
import {docWords,type DocumentFields,type Paper} from '../../lib/service-document';
import {ServicesBillPanel} from './services-bill-panel';
import {ServicesTemplatePicker} from './services-template-library';
import {ServicesCustomerHistory} from './services-customer-history';

type Row=Record<string,unknown>;
type Kind='requests'|'reservations'|'messages';
const str=(row:Row,key:string)=>typeof row[key]==='string'?row[key] as string:'';
const list=(row:Row,key:string)=>Array.isArray(row[key])?row[key] as Row[]:[];
const actions=(row:Row)=>Array.isArray(row.actions)?row.actions as string[]:[];
const branchLabel=(row:Row)=>{const branch=row.selected_branch as Row|undefined;return branch?String(branch.name??'')+' · '+String(branch.broad_area??''):'';};
const inputDate=serviceLocalInput;

type Props={issuer?:string;accent?:string;base:string;binding:string;locale:ServicesLocale;initialKind?:Kind;initialReservationRef?:string|null;offeringRef?:string|null;offerings?:{public_ref:string;service_name:string}[];initialFilter?:WorkFilter;initialTask?:ServiceTaskLink|null;billAvailable:boolean;financeAvailable:boolean;onDenied:()=>void;onNavigate?:(view:ProviderView)=>void;calendarAvailable?:boolean;quotesAvailable?:boolean;refreshToken?:number;onBusy?:(busy:boolean)=>void};
export function ServicesTransactions(props:Props){return <BoundTransactions key={`${props.base}:${props.binding}`} {...props}/>;}
function BoundTransactions({issuer,accent,base,binding,locale,initialKind='requests',initialReservationRef=null,offerings=[],offeringRef,initialFilter="all",initialTask=null,billAvailable,financeAvailable,onDenied,onNavigate,refreshToken=0,onBusy}:Props) {
 const [filter,setFilter]=useState<WorkFilter>(initialFilter);
 const [missionTab,setMissionTab]=useState(initialFilter==='jobs'),[service,setService]=useState(offeringRef||''),[sources,setSources]=useState<Record<Kind,Row[]>|null>(null);
 const wt=(key:string)=>workText(locale,key);
 const t=useCallback((key:string)=>servicesText(locale,key),[locale]);
 const [kind,setKind]=useState<Kind>(initialKind),[offset,setOffset]=useState(0);
 const transactionRef=useCallback((row:Row)=>str(row,{requests:'request_ref',reservations:'reservation_ref',messages:'thread_ref'}[kind]),[kind]);
 const [detail,setDetail]=useState<Row|null>(null),[lifecycle,setLifecycle]=useState<Row|null>(null),[quotes,setQuotes]=useState<Row[]>([]),[quote,setQuote]=useState<Row|null>(null),[quoteOffset,setQuoteOffset]=useState(0),[quoteMore,setQuoteMore]=useState(false);
 const [messageOffset,setMessageOffset]=useState(0);
 const command=useFinancialCommand(binding);
 const pendingCommand=useRef(false);useEffect(()=>{pendingCommand.current=!!command.pending;},[command.pending]);
 const [stale,setStale]=useState(false),[readFailed,setReadFailed]=useState(false);
 const [busy,setBusy]=useState(true),[notice,setNotice]=useState(''),[form,setForm]=useState<string|null>(null),[fields,setFields]=useState<Record<string,string>>({});
 useWorkDraft(form!==null||!!command.pending,t('leave_draft'),locale);
 const activeDraft=useRef<{path:string;revision:unknown}|null>(null);
 useEffect(()=>{activeDraft.current=form&&detail?{path:quote?`quotes/${str(quote,'quote_ref')}`:`${kind}/${transactionRef(detail)}`,revision:quote?.revision??detail.revision}:null;},[form,detail,quote,kind,transactionRef]);
 useEffect(()=>{onBusy?.(busy||command.busy||!!command.pending);},[busy,command.busy,command.pending,onBusy]);
 const [quoteDoc,setQuoteDoc]=useState<DocumentFields>({}),[prepareBill,setPrepareBill]=useState("");
 const pendingBooking=useRef<string|null>(initialReservationRef);
 const pendingLink=useRef<{kind:Kind;ref:string;quoteRef?:string}|null>(null);
 const generation=useRef(0),alive=useRef(false),denied=useRef(onDenied);
 useEffect(()=>{denied.current=onDenied;},[onDenied]);
 const clear=useCallback(()=>{setDetail(null);setLifecycle(null);setQuotes([]);setQuote(null);setForm(null);setFields({});setStale(false);},[]);
 const call=useCallback((path:string)=>financialRequest<Row>(binding,`${base}/transactions/${path}`),[base,binding]);
 const error=useCallback((value:unknown)=>{
  if(value instanceof Error&&value.name==='AbortError')return;
  const status=value instanceof Error?value.message:'';
  if(['401','403','404'].includes(status)){clear();denied.current();}
  else{setReadFailed(true);setNotice(t('load_failed'));}
 },[clear,t]);
 useEffect(()=>{let active=true;if(command.status==='denied')queueMicrotask(()=>{if(active){generation.current++;clear();denied.current();}});return()=>{active=false;};},[command.status,clear]);
 useEffect(()=>{const invalidate=()=>{generation.current++;clear();denied.current();};const storage=(event:StorageEvent)=>{if(event.key===PERSONAL_SESSION_EVENT)invalidate();};window.addEventListener(PERSONAL_SESSION_EVENT,invalidate);window.addEventListener('storage',storage);return()=>{window.removeEventListener(PERSONAL_SESSION_EVENT,invalidate);window.removeEventListener('storage',storage);};},[clear]);
 const clearHistoryAccess=useCallback(()=>{clear();denied.current();},[clear]);
 const invalidateReads=useCallback(()=>{generation.current++;},[]);
 const load=useCallback(async()=>{
  const ticket=++generation.current;clear();setSources(null);setReadFailed(false);setNotice('');setBusy(true);
  try{
   const current=()=>alive.current&&ticket===generation.current;
   const [requests,reservations,messages]=await Promise.all(
    (['requests','reservations','messages'] as const).map(source=>readWorkList(base,binding,source,current))
   );
   if(current())setSources({requests,reservations,messages});
   if(kind==='reservations'&&pendingBooking.current&&ticket===generation.current){const target=pendingBooking.current;pendingBooking.current=null;const booking=await call(`reservations/${target}`);const life=await call(`reservations/${target}/lifecycle`);if(alive.current&&ticket===generation.current){setDetail(booking);setLifecycle(life);}}
   if(pendingLink.current?.kind===kind&&alive.current&&ticket===generation.current){const target=pendingLink.current;pendingLink.current=null;
    const detail=await call(`${kind}/${target.ref}`);const lifecycle=kind==='reservations'?await call(`reservations/${target.ref}/lifecycle`):null;
    const history=kind==='requests'?await call(`requests/${target.ref}/quotes`):null;
    const selectedQuote=target.quoteRef?await call(`quotes/${target.quoteRef}`):null;
    if(selectedQuote&&str(selectedQuote,"request_ref")!==target.ref)throw new Error("404");
    if(alive.current&&ticket===generation.current){setDetail(detail);setLifecycle(lifecycle);setQuotes(history?list(history,'quotes'):[]);setQuoteOffset(0);setQuoteMore(!!history?.has_more);setQuote(selectedQuote);setMessageOffset(0);}}}
  catch(e){if(alive.current&&ticket===generation.current)error(e);}finally{if(alive.current&&ticket===generation.current)setBusy(false);}
 },[base,binding,call,clear,error,kind]);
 useEffect(()=>{const target=serviceTransactionLink(window.location.search);if(!target||initialTask)return;let active=true;queueMicrotask(()=>{if(active){pendingLink.current=target;if(kind===target.kind)void load();else setKind(target.kind);}});return()=>{active=false;};},[]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{let mounted=true;alive.current=true;queueMicrotask(()=>{if(mounted)void load();});const focus=()=>{const draft=activeDraft.current;if(pendingCommand.current)return;if(!draft){void load();return;}const ticket=generation.current;void call(draft.path).then(value=>{if(alive.current&&ticket===generation.current&&value.revision!==draft.revision){setStale(true);setNotice(t('stale'));}}).catch(value=>{if(alive.current&&ticket===generation.current)error(value);});};window.addEventListener('focus',focus);return()=>{mounted=false;alive.current=false;invalidateReads();window.removeEventListener('focus',focus);};},[load,call,error,t,invalidateReads]);
 useEffect(()=>{let active=true;queueMicrotask(async ()=>{if(!active||!initialTask)return;if(pendingCommand.current||!(await leaveWork())||!active)return;pendingLink.current=initialTask.ref?initialTask:null;if(kind===initialTask.kind&&offset===0)void load();else{setKind(initialTask.kind);setOffset(0);}});return()=>{active=false;};},[initialTask]); // eslint-disable-line react-hooks/exhaustive-deps
 async function open(row:Row,afterSave=false){
  if(!afterSave&&(pendingCommand.current||!(await leaveWork())))return;
  const ticket=++generation.current;setStale(false);setReadFailed(false);command.clear();setBusy(true);setDetail(null);setLifecycle(null);setQuote(null);setQuotes([]);setForm(null);setNotice('');setFields({});setMessageOffset(0);
  try{const value=await call(`${kind}/${transactionRef(row)}`);let extra:Row|null=null;
   if(kind==='reservations')extra=await call(`reservations/${transactionRef(row)}/lifecycle`);
   if(alive.current&&ticket===generation.current){setDetail(value);setLifecycle(extra);}
   if(kind==='requests'){const history=await call(`requests/${transactionRef(row)}/quotes`);if(alive.current&&ticket===generation.current){setQuotes(list(history,'quotes'));setQuoteOffset(0);setQuoteMore(!!history.has_more);}}
  }catch(e){if(alive.current&&ticket===generation.current)error(e);}finally{if(alive.current&&ticket===generation.current)setBusy(false);}
 }
 async function historyPage(next:number){if(!detail||pendingCommand.current||!(await leaveWork()))return;const ticket=++generation.current;setBusy(true);try{const value=await call(`requests/${transactionRef(detail)}/quotes?offset=${next}`);if(alive.current&&ticket===generation.current){setQuotes(list(value,'quotes'));setQuoteOffset(next);setQuoteMore(!!value.has_more);}}catch(e){if(alive.current&&ticket===generation.current)error(e);}finally{if(alive.current&&ticket===generation.current)setBusy(false);}}
 async function messagePage(next:number){if(!detail||pendingCommand.current||!(await leaveWork()))return;const ticket=++generation.current;setBusy(true);try{const value=await call(`messages/${str(detail,'thread_ref')}?offset=${next}`);if(alive.current&&ticket===generation.current){setDetail(value);setMessageOffset(next);}}catch(e){if(alive.current&&ticket===generation.current)error(e);}finally{if(alive.current&&ticket===generation.current)setBusy(false);}}
 async function openQuote(row:Row){if(pendingCommand.current||!(await leaveWork()))return;const ticket=++generation.current;setBusy(true);setStale(false);command.clear();setForm(null);try{const value=await call(`quotes/${str(row,'quote_ref')}`);if(alive.current&&ticket===generation.current)setQuote(value);}catch(e){if(alive.current&&ticket===generation.current)error(e);}finally{if(alive.current&&ticket===generation.current)setBusy(false);}}
 async function begin(action:string){if(pendingCommand.current||!(await leaveWork()))return;command.clear();setStale(false);setNotice('');setForm(action);if(action==="edit"||action==="create_quote")setQuoteDoc(action==="edit"?{subject:title(detail||{}),description:str(quote||{},"pricing_description"),conditions:str(quote||{},"terms"),...(quote?.document as DocumentFields||{})}:{subject:title(detail||{}),description:str(detail||{},"description")});setFields(action==='edit'&&quote?{amount:str(quote,'amount'),currency:str(quote,'currency'),pricing_description:str(quote,'pricing_description'),duration_minutes:String(quote.duration_minutes??''),proposed_start:inputDate(str(quote,'proposed_start')),proposed_end:inputDate(str(quote,'proposed_end')),terms:str(quote,'terms'),expires_at:inputDate(str(quote,'expires_at'))}:{});}
 async function submit(event:React.FormEvent){
  event.preventDefault();if(!detail||!form||busy||command.busy||stale)return;
  try{if(form==='create_quote'||form==='edit'){serviceAmount(fields.amount??'');serviceUtcInput(fields.proposed_start??'');if(fields.proposed_end)serviceUtcInput(fields.proposed_end);if(fields.expires_at)serviceUtcInput(fields.expires_at);}if(form==='propose')serviceProposalInput(fields.date,fields.start_time,fields.end_time,str((scheduling.schedule??{}) as Row,'timezone'));}catch(error){setNotice(t(error instanceof Error&&error.message==='unsupported_overnight_interval'?'overnight_interval':'invalid_time_amount'));return;}
  setBusy(true);setNotice('');
  const current=detail,action=form,epoch=generation.current;const key=crypto.randomUUID();let path=`${kind}/${transactionRef(current)}`,method='POST';let body:Row={revision:current.revision,idempotency_key:key};
  if(action==='create_quote'||action==='edit'){
   path=action==='edit'?`quotes/${str(quote!,'quote_ref')}`:`requests/${transactionRef(current)}/quotes`;method=action==='edit'?'PATCH':'POST';body.revision=action==='edit'?quote!.revision:current.revision;
   body={...body,amount:serviceAmount(fields.amount),currency:fields.currency||'USD',duration_minutes:Number(fields.duration_minutes),document:Object.fromEntries(Object.entries(quoteDoc).filter(([k])=>["subject","description","included","excluded","timing","conditions","private_note","items","instructions"].includes(k))),pricing_description:quoteDoc.description?.slice(0,2000)||null,terms:quoteDoc.conditions?.slice(0,2000)||null,proposed_start:serviceUtcInput(fields.proposed_start),proposed_end:fields.proposed_end?serviceUtcInput(fields.proposed_end):null,expires_at:fields.expires_at?serviceUtcInput(fields.expires_at):null};
  }else if(['send','withdraw'].includes(action)&&kind==='requests'){path=`quotes/${str(quote!,'quote_ref')}/${action}`;body.revision=quote!.revision;}
  else if(kind==='requests'){path+=`/${action}`;if(action==='decline')body.reason_code=fields.reason;}
  else if(kind==='messages'){path+='/actions';body={...body,action:action==='reply'?'send':action,body:fields.body||''};}
  else if(action==='accept'||action==='decline'){path+='/decision';body={...body,decision:action,...(action==='decline'?{reason_code:fields.reason,reason_text:fields.description||t(fields.reason)}:{})};}
  else if(action==='propose'){path+='/reschedule-proposals';body={...body,revision:lifecycle!.revision,...serviceProposalInput(fields.date,fields.start_time,fields.end_time,str((scheduling.schedule??{}) as Row,'timezone')),description:fields.description||''};}
  else if(action==='reschedule_accept'||action==='reschedule_reject'){const scheduling=lifecycle?.rescheduling as Row;const proposal=scheduling.proposal as Row;path+=`/reschedule-proposals/${str(proposal,'proposal_ref')}/decision`;body={...body,revision:lifecycle!.revision,proposal_revision:proposal.revision,decision:action.replace('reschedule_','')};}
  else{path+=`/lifecycle/${action}`;body={...body,revision:lifecycle!.revision,reason_code:fields.reason||'',description:fields.description||''};}
  const result=await command.run<Row>({path:`${base}/transactions/${path}`,method,body:JSON.stringify(body)});
  if(alive.current&&epoch===generation.current){if(result){await open(current,true);setNotice(t(action==='reply'?'reply_saved':'saved'));}setBusy(false);}
 }
 async function retry(){
  if(!detail||!command.pending||busy||command.busy)return;
  const current=detail,action=form,ticket=generation.current;
  const result=await command.run<Row>();
  if(result&&alive.current&&ticket===generation.current){await open(current,true);setNotice(t(action==='reply'?'reply_saved':'saved'));}
 }
 async function refresh(){if(!pendingCommand.current&&(await leaveWork())){command.clear();void load();}}
 useEffect(()=>{if(refreshToken)refresh();},[refreshToken]); // eslint-disable-line react-hooks/exhaustive-deps
 async function choose(next:Kind,nextFilter:WorkFilter='all',missions=nextFilter==='jobs'){
  if(pendingCommand.current||!(await leaveWork()))return;
  clear();setFilter(nextFilter);setMissionTab(missions);setOffset(0);setKind(next);setNotice('');
 }
 const pageSize=20;
 const scoped=(source:Kind)=>sources?.[source].filter(row=>(!offerings.length||offerings.some(item=>item.public_ref===row.offering_ref))&&(!service||row.offering_ref===service))??null;
 const filtered=(scoped(kind)||[]).filter(row=>workMatches(row,filter,kind)&&(!missionTab||workMatches(row,'jobs','reservations')||workMatches(row,'closed','reservations')));
 const start=Math.min(offset,Math.floor(Math.max(0,filtered.length-1)/pageSize)*pageSize);
 const visibleRows=filtered.slice(start,start+pageSize);
 const filteredEmpty=!!service||filter!=='all';
 const scheduling=(lifecycle?.rescheduling??{}) as Row,proposal=scheduling.proposal as Row|undefined;
 const title=(row:Row)=>str(row,'offering')||str(row,'selected_offering_name')||str(row,'service_name')||str(row,'title');
 const stamp=(value:unknown)=>typeof value==='string'?serviceTimestamp(value,locale):'';
 function field(name:string,label:string,type='text',required=false){return <label key={name}>{t(label)}<input type={type} inputMode={name==='amount'?'decimal':undefined} required={required} min={type==='number'?1:undefined} maxLength={2000} value={fields[name]??''} onChange={e=>setFields(old=>({...old,[name]:e.target.value}))}/></label>;}
 function quotePaper(editing:boolean):Paper{
  const stored=quote?.document as (DocumentFields&{presentation?:{display_name:string;accent:string}})|undefined;
  return {kind:"quote",issuer:stored?.presentation?.display_name||issuer||str(quote||{},"provider")||str(detail||{},"provider")||offerings.find(o=>o.public_ref===detail?.offering_ref)?.service_name||t("provider"),accent:stored?.presentation?.accent||accent,client:str(quote||{},"client_name")||str(detail||{},"requester"),reference:str(quote||{},"quote_ref"),date:quote?.sent_at?stamp(quote.sent_at):"",state:editing||quote?.status==="DRAFT"?docWords(locale).draft:t(str(quote||{},"status")),currency:editing?fields.currency||"USD":str(quote||{},"currency"),amount:editing?fields.amount||"":str(quote||{},"amount"),document:editing?quoteDoc:{description:str(quote||{},"pricing_description"),conditions:str(quote||{},"terms"),...stored}};
 }
 const quoteForm=form==='edit'||form==='create_quote';
 const reasonChoices=form==='decline'?kind==='requests'?['NOT_AVAILABLE','OUTSIDE_SCOPE','CANNOT_SERVE_LOCATION','INSUFFICIENT_INFORMATION','OTHER']:['provider_unavailable','slot_unavailable','request_mismatch','area_too_far','insufficient_information','other']:form==='cancel'?['UNAVAILABLE','EMERGENCY','SCHEDULING_ISSUE','CANNOT_PERFORM_SERVICE','OTHER']:form==='dispute'?(lifecycle?.dispute_reasons as string[]??[]):[];
 if(command.status==='denied')return <p role="alert">{t('denied')}</p>;
 return <section className="services-transactions svc-financial-panel svc-work" aria-label={t('workspace')}>
  {!detail&&<><ServicesWorkSummary requests={scoped('requests')} reservations={scoped('reservations')} locale={locale} onSelect={choose} failed={readFailed} disabled={busy||command.busy||!!command.pending}/>
  <fieldset disabled={busy||command.busy||!!command.pending}><div className="svc-work-toolbar"><div className="svc-work-tabs" role="group" aria-label={t('workspace')}>{(['requests','reservations','missions','messages'] as const).map(tab=><button type="button" key={tab} aria-pressed={missionTab?tab==='missions':kind===tab} onClick={()=>choose(tab==='missions'?'reservations':tab,tab==='missions'?'jobs':'all',tab==='missions')}>{tab==='missions'?wt('missions'):tab==='requests'?wt('requestList'):t(tab)}</button>)}</div></div>
  <div className="svc-work-filters">{offerings.length>1&&<label>{wt('service')}<select value={service} onChange={e=>{setService(e.target.value);setOffset(0);}}><option value="">{wt('allServices')}</option>{offerings.map(row=><option key={row.public_ref} value={row.public_ref}>{row.service_name}</option>)}</select></label>}
  {kind!=='messages'&&<label>{wt('status')}<select value={filter} onChange={e=>{setFilter(e.target.value as WorkFilter);setOffset(0);}}>{(kind==='requests'?['all','new','quotes','sent','closed']:missionTab?['all','jobs','closed']:['all','bookings','closed']).map(value=><option key={value} value={value}>{wt(value)}</option>)}</select></label>}</div></fieldset></>}
  {(busy||command.busy)&&<p role="status" aria-live="polite">{t('loading')}</p>}{notice&&<p role="status">{notice}</p>}
  {command.status&&command.status!=='saved'&&<p role="status">{t(command.status)}</p>}
  {command.pending&&<button type="button" disabled={busy||command.busy} onClick={()=>void retry()}>{t('retry')}</button>}
  {!detail?<fieldset className="svc-work-list" disabled={busy||command.busy||!!command.pending}>
   {!busy&&!readFailed&&sources&&!visibleRows.length&&<div className="svc-work-empty"><SellerWorkspaceIcon name={kind==='reservations'?'calendar':'work'}/><h3>{wt(filteredEmpty?(filter==='bookings'&&!service?'noPending':'noMatch'):kind==='requests'?'empty':kind==='messages'?'noMessages':missionTab?'noJobs':'noBookings')}</h3>{filteredEmpty?<button onClick={()=>{setFilter('all');setService('');setOffset(0);}}>{wt('reset')}</button>:kind==='requests'&&<><p>{wt('emptyHelp')}</p>{onNavigate&&<button className="svc-primary" onClick={()=>onNavigate('share')}>{wt('share')}</button>}</>}</div>}
   {!!visibleRows.length&&<table className="svc-client-work"><thead><tr>{['client','service','status','date','action'].map(key=><th scope="col" key={key}>{wt(key)}</th>)}</tr></thead><tbody>{visibleRows.map(row=>{
    const stage=requestStage(row),action=kind==='messages'?'viewThread':kind==='requests'?stage==='quotes'?'prepare':'viewRequest':missionTab?'viewJob':'viewBooking';
    return <tr key={transactionRef(row)}><td>{str(row,'requester')||str(row,'requester_name')||'—'}</td><td>{title(row)}{kind==='messages'&&<small>{str(row,'activity_ref')}</small>}</td><td><span className={`svc-work-status ${workTone(row)}`}>{kind==='requests'&&['new','quotes','sent'].includes(stage)?wt(stage):t(str(row,'status'))}</span></td><td>{str(row,'requested_datetime')||stamp(row.created_at||row.last_message_at)||'—'}</td><td><button type="button" onClick={()=>void open(row)}>{wt(action)}</button></td></tr>;
   })}</tbody></table>}
   <div className="transaction-actions">{start>0&&<button onClick={()=>setOffset(start-pageSize)}>{t('previous')}</button>}{start+pageSize<filtered.length&&<button onClick={()=>setOffset(start+pageSize)}>{t('more')}</button>}</div></fieldset>:
   <fieldset className="svc-work-detail" disabled={busy||command.busy||!!command.pending}><button type="button" onClick={refresh}>{t('back')}</button><h3>{title(detail)}</h3><p>{t(str(detail,'status'))}</p><p>{str(detail,'description')}</p><ServiceReviewedBrief value={detail.reviewed_brief} locale={locale}/>{branchLabel(detail)&&<p>📍 {branchLabel(detail)}</p>}
    {kind==='requests'&&<><p>{str(detail,'requester')} · {str(detail,'preferred_date')} {str(detail,'preferred_start_time')}</p><div className="transaction-actions">{actions(detail).filter(a=>['review','decline'].includes(a)).map(a=><button key={a} onClick={()=>begin(a)}>{t(a)}</button>)}{!!detail.can_create_quote&&!detail.draft_quote_ref&&<button onClick={()=>begin('create_quote')}>{docWords(locale).start}</button>}{!!detail.reservation_ref&&<button onClick={async ()=>{if(!(await leaveWork()))return;pendingBooking.current=str(detail,'reservation_ref');setKind('reservations');setOffset(0);}}>{t('view_reservation')}</button>}</div>
     {!form&&(!!detail.can_create_quote&&!detail.draft_quote_ref||quote?.status==='DRAFT')&&<ServicesTemplatePicker key={`${transactionRef(detail)}:${quote?.quote_ref??'new'}`} base={base} binding={binding} locale={locale} kind="quote" targetRef={transactionRef(detail)} targetRevision={Number(quote?.status==='DRAFT'?quote.revision:detail.revision)} draftRef={quote?.status==='DRAFT'?str(quote,'quote_ref'):undefined} onApplied={value=>{void (async()=>{await open(detail);await openQuote({quote_ref:String(value.quote_ref)});})();}}/>}
     <h4>{t('history')}</h4>{quotes.length===0&&<p>{t('empty')}</p>}{quotes.map(row=><button className="transaction-row" key={str(row,'quote_ref')} onClick={()=>void openQuote(row)}>{t('quote')} · {t(str(row,'status'))} · {str(row,'amount')} {str(row,'currency')}<span>{stamp(row.sent_at||row.created_at)}</span></button>)}<div className="transaction-actions">{quoteOffset>0&&<button onClick={()=>void historyPage(quoteOffset-10)}>{t('previous')}</button>}{quoteMore&&<button onClick={()=>void historyPage(quoteOffset+10)}>{t('more')}</button>}</div>
     {quote&&<article>{!form&&<DocumentPaper locale={locale} paper={quotePaper(false)}/>} {quote.status==='ACCEPTED'&&!!quote.reservation_ref&&billAvailable&&<button type='button' onClick={async()=>{if(!await leaveWork())return;setPrepareBill(str(quote,'reservation_ref'));pendingBooking.current=str(quote,'reservation_ref');setKind('reservations');setOffset(0);}}>{locale==='fr'?'Préparer la facture':docWords(locale).bill}</button>}{branchLabel(quote)&&<p>📍 {branchLabel(quote)}</p>}<h4>{t('quote')} · {t(str(quote,'status'))}</h4>{quote.status==='DRAFT'&&<p>{t('private')}</p>}<p>{str(quote,'amount')} {str(quote,'currency')} · {String(quote.duration_minutes??'')} {t('duration')}</p><p>{str(quote,'pricing_description')}</p><p>{str(quote,'terms')}</p><p>{t('scheduled')}: {stamp(quote.proposed_start)} — {stamp(quote.proposed_end)}</p><p>{t('expires')}: {stamp(quote.expires_at)}</p><p>{t('schedule_note')}</p><div className="transaction-actions">{actions(quote).filter(a=>['edit','send','withdraw'].includes(a)).map(a=><button key={a} onClick={()=>begin(a)}>{t(a)}</button>)}</div></article>}
    </>}
    {kind==='reservations'&&<><p>{str(detail,'requested_datetime')} · {str(detail,'selected_offering_name')}</p>{detail.status==='pending'&&<p>{t('pending_note')}</p>}<div className="transaction-actions">{!!detail.can_respond&&<><button onClick={()=>begin('accept')}>{t('accept')}</button><button onClick={()=>begin('decline')}>{t('decline')}</button></>}{lifecycle&&actions(lifecycle).map(a=><button key={a} onClick={()=>begin(a)}>{t(a)}</button>)}{actions(scheduling).includes('propose')&&<button onClick={()=>begin('propose')}>{t('propose')}</button>}</div>
     <ServicesCustomerHistory key={transactionRef(detail)} reservationRef={transactionRef(detail)} onDenied={clearHistoryAccess} base={base} binding={binding} locale={locale} financeAvailable={financeAvailable} onOpen={async (target,ref,quoteRef)=>{if(!(await leaveWork()))return;pendingLink.current={kind:target,ref,quoteRef};if(kind===target&&offset===0)void load();else{setKind(target);setOffset(0);}}}/>
     <h4>{t('history')}</h4>{['confirmed_at','started_at','completed_at','cancelled_at','no_show_at'].filter(key=>lifecycle?.[key]).map(key=><p key={key}>{t(({confirmed_at:'confirmed',started_at:'in_progress',completed_at:'completed',cancelled_at:'cancelled',no_show_at:'no_show_reported'} as Record<string,string>)[key])} · {stamp(lifecycle![key])}</p>)}
     {!!lifecycle?.accepted_quote&&<p>{t('quote')} · {str(lifecycle.accepted_quote as Row,'amount')} {str(lifecycle.accepted_quote as Row,'currency')} · {str(lifecycle.accepted_quote as Row,'terms')}</p>}
     {!form&&billAvailable&&<ServicesBillPanel key={transactionRef(detail)} base={base} binding={binding} locale={locale}
      initialPrepare={prepareBill===transactionRef(detail)} mission={title(detail)} client={str(detail,"requester")||str(detail,"requester_name")} reservationRef={transactionRef(detail)} reservationRevision={Number(lifecycle?.revision??detail.revision)}
      status={str(lifecycle??detail,'status')} blocked={!!lifecycle?.no_show_at||['OPEN','UNDER_REVIEW'].includes(str((lifecycle?.dispute??{}) as Row,'status'))}/>}
     {proposal&&<article><p>{t('propose')} · {t(str(proposal,'status'))} · Kinshasa</p><p>{stamp(proposal.proposed_start)} {stamp(proposal.proposed_start_at)} — {stamp(proposal.proposed_end)} {stamp(proposal.proposed_end_at)}</p><p>{str(proposal,'description')}</p>{!!proposal.actionable&&actions(proposal).map(a=><button key={a} onClick={()=>begin(`reschedule_${a}`)}>{t(a==='accept'?'confirm':'reject')}</button>)}</article>}
    </>}
    {kind==='messages'&&<><h4>{t('history')}</h4>{list(detail,'messages').map((row,index)=><p key={index}><strong>{str(row,'sender_name')||t(str(row,'sender'))}</strong> · {stamp(row.created_at)}<br/><span>{str(row,'body')}</span></p>)}<div className="transaction-actions">{messageOffset>0&&<button onClick={()=>void messagePage(Math.max(0,messageOffset-20))}>{t('previous')}</button>}{!!detail.has_more&&<button onClick={()=>void messagePage(messageOffset+20)}>{t('more')}</button>}{actions(detail).filter(a=>a!=='read').map(a=><button key={a} onClick={()=>begin(a==='send'?'reply':a)}>{t(a==='send'?'reply':a)}</button>)}</div></>}
    {form&&<form onSubmit={submit}><h4>{quoteForm&&locale==='fr'?'Préparer un devis':t(quoteForm?form==='edit'?'edit':'create_quote':form.startsWith('reschedule_')?'confirm':form)}</h4>
     <fieldset disabled={stale||command.status==='stale'}>{quoteForm&&<><p>{t('private')}</p><DocumentEditor locale={locale} paper={quotePaper(true)} change={setQuoteDoc} currency={v=>setFields(old=>({...old,currency:v}))} amount={v=>setFields(old=>({...old,amount:v}))}/>{field('duration_minutes','duration','number',true)}{field('proposed_start','scheduled','datetime-local',true)}{field('proposed_end','end_time','datetime-local')}{field('expires_at','expires','datetime-local')}</>}
     {reasonChoices.length>0&&<label>{t('reason')}<select required value={fields.reason||''} onChange={e=>setFields(old=>({...old,reason:e.target.value}))}><option value=""></option>{reasonChoices.map(value=><option key={value} value={value}>{t(value==='OTHER'||value==='other'?'other_reason':value==='UNAVAILABLE'?'not_available':value)}</option>)}</select></label>}
     {kind==='reservations'&&['decline','cancel','dispute','requester_no_show','propose'].includes(form)&&field('description','description','text',form==='dispute'||fields.reason?.toLowerCase()==='other')}
     {form==='propose'&&<>{field('date','date','date',true)}{field('start_time','start_time','time',true)}{field('end_time','end_time','time')}</>}
     {['reply','reopen'].includes(form)&&<label>{t('body')}<textarea required maxLength={form==='reopen'?500:1000} value={fields.body||''} onChange={e=>setFields(old=>({...old,body:e.target.value}))}/></label>}
     </fieldset><div className="transaction-actions"><button type="submit" disabled={stale||command.status==="stale"}>{t(quoteForm?'save':'confirm')}</button><button type="button" onClick={async ()=>{if((await leaveWork())){setForm(null);command.clear();}}}>{t('back')}</button></div>
    </form>}
   </fieldset>}
  <style>{`.services-transactions{margin:1.5rem 0;padding:1rem;border:1px solid #dedfd3;border-radius:12px;overflow-wrap:anywhere}.services-transactions fieldset{border:0;padding:0;min-width:0}.services-transactions button{min-height:44px;padding:.65rem .9rem;cursor:pointer;border:1px solid #c8cdbf;border-radius:6px;background:#fff;color:#173f33}.services-transactions button[aria-pressed=true]{background:#173f33;color:white}.services-transactions button:disabled{opacity:.55;cursor:wait}.transaction-actions{display:flex;flex-wrap:wrap;gap:.5rem;margin:.8rem 0}.services-transactions .transaction-row{display:block;width:100%;text-align:left;margin:.5rem 0}.transaction-row span{display:block;font-size:.9em;margin-top:.3rem}.services-transactions form{display:grid;gap:.8rem;padding:1rem;background:#f4f5ef;color:#173f33;border-radius:8px}.services-transactions label{display:grid;gap:.3rem}.services-transactions input,.services-transactions select,.services-transactions textarea{width:100%;min-width:0;box-sizing:border-box;padding:.65rem;border:1px solid #c8cdbf;border-radius:4px}.services-transactions article{border-left:3px solid #c8cdbf;padding-left:1rem}`}</style>
 </section>;
}
