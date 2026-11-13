"use client";
import {useEffect,useState,type ReactNode} from "react";
import {financialRequest} from "@/app/lib/services-financial-state";
import {leaveWork} from "@/app/lib/restaurant-work";
import {financeLabel,type FinanceLocale} from "@/app/lib/service-finance-workspace-copy";
import {type Report,type Offering,type Draft,type FinanceTab,period,localToday,exportDays} from "@/app/lib/service-finance-workspace";
import {ServiceFinanceForm} from "./service-finance-form";
import "./service-finance-workspace.css";

type Props={openJob:(ref:string)=>void;base:string;binding:string;locale:FinanceLocale;offerings:Offering[];initialTab:FinanceTab;manual:boolean;
  journal:ReactNode;counter:(doc?:{sale:string;receipt:string})=>ReactNode;mission:ReactNode;activity:ReactNode;reports:boolean;initialClose:boolean};
export function ServiceFinanceWorkspace({openJob,base,binding,locale,offerings,initialTab,manual,journal,counter,mission,activity,reports,initialClose}:Props){
  const t=(k:string)=>financeLabel(locale,k), money=(v:unknown)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(Number(v));
  const [tab,setTab]=useState(initialTab),[activityOpen,setActivityOpen]=useState(false);
  const [preset,setPreset]=useState("today"),[range,setRange]=useState(()=>period("today"));
  const [currency,setCurrency]=useState("CDF"),[service,setService]=useState(""),[version,setVersion]=useState(0);
  const [loaded,setLoaded]=useState<{key:string;report:Report}|null>(null),[failed,setFailed]=useState("");
  const [draft,setDraft]=useState<Draft|null>(initialClose?{kind:"close"}:null),[filter,setFilter]=useState(""),[showHistory,setShowHistory]=useState(false);
  const [documentRef,setDocumentRef]=useState<{sale:string;receipt:string}>();
  const params=new URLSearchParams({start_date:range.start,end_date:range.end,currency});
  if(range.previous)params.set("previous",range.previous);
  if(service)params.set("offering_ref",service);
  const url=base+"/transactions/finance/workspace?"+params, key=url+":"+version;
  useEffect(()=>{const refresh=()=>setVersion(n=>n+1);window.addEventListener("services:finance-refresh",refresh);return ()=>window.removeEventListener("services:finance-refresh",refresh);},[]);
  const report=loaded?.key===key?loaded.report:null;
  useEffect(()=>{let active=true;
    financialRequest<Report>(binding,url).then(value=>{if(active)setLoaded({key,report:value});}).catch(()=>{if(active)setFailed(key);});
    return ()=>{active=false;};
  },[url,binding,key]);
  async function change(next:FinanceTab,match=""){
    if(!(await leaveWork()))return;
    setTab(next);setDraft(null);setFilter(match);setShowHistory(false);setDocumentRef(undefined);
    const link=new URL(window.location.href);link.searchParams.set("view","finance");link.searchParams.set("tab",next);link.searchParams.delete("close");window.history.replaceState(null,"",link);
  }
  async function open(value:Draft){if(await leaveWork())setDraft(value);}
  const entries=report?.entries.filter(e=>e.kind===(tab==="receipts"?"received":"spent")&&(!filter||filter===(tab==="receipts"?e.method:e.category)))||[];
  const field=(k:string,v:unknown)=><div key={k}><dt>{t(k)}</dt><dd>{money(v)} {currency}</dd></div>;
  const breakdown=(title:string,values:Record<string,string>,next:FinanceTab)=><section className="sf-card"><h2>{t(title)}</h2>{Object.keys(values).length?<ul>{Object.entries(values).sort((a,b)=>Number(b[1])-Number(a[1])).map(([k,v])=><li key={k}><button className="sf-link" onClick={()=>void change(next,k)}>{t(k)}</button><strong>{money(v)} {currency}</strong></li>)}</ul>:<p>{t("empty")}</p>}</section>;
  const dailyHeaders=[t("day"),...["billedShort","receivedShort","spentShort"].map(k=>t(k)+" ("+currency+")")];
  const closeReport=draft?.kind==="close"&&(report||loaded?.report);
  const close=async()=>{if(!(await leaveWork()))return;setService("");setPreset("today");setRange(period("today"));setDraft({kind:"close"});};
  return <section className="sf-workspace">
    <nav className="sf-tabs" aria-label={t("financial")}>{(["overview",...(manual?["receipts","expenses"]:[]),...(reports?["reports"]:[])] as FinanceTab[]).map(k=><button type="button" key={k} aria-current={k===tab?"page":undefined} onClick={()=>void change(k)}>{t(k)}</button>)}</nav>
    {tab==="reports"&&<><h2>{t(activityOpen?"activity":"financial")}</h2><div className="sf-tabs"><button aria-pressed={activityOpen} onClick={()=>setActivityOpen(true)}>{t("activity")}</button><button aria-pressed={!activityOpen} onClick={()=>setActivityOpen(false)}>{t("financial")}</button></div></>}
    {tab==="reports"&&activityOpen?activity:<>
    <div className="sf-toolbar"><div className="sf-tabs">{["today","week","month","custom"].map(k=><button key={k} aria-pressed={preset===k} onClick={async()=>{if(!(await leaveWork()))return;setDraft(null);setPreset(k);if(k!=="custom")setRange(period(k));}}>{t(k)}</button>)}</div>
    <label>{t("service")}<select value={service} disabled={!!draft} onChange={e=>setService(e.target.value)}><option value="">{t("all")}</option>{offerings.map(o=><option key={o.public_ref} value={o.public_ref}>{o.service_name}</option>)}</select></label>
    <label>{t("currency")}<select value={currency} disabled={!!draft} onChange={e=>setCurrency(e.target.value)}><option>CDF</option><option>USD</option></select></label></div>
    {preset==="custom"?<div className="sf-toolbar">{(["start","end"] as const).map(k=><label key={k}>{t(k)}<input type="date" value={range[k]} max={k==="start"?range.end:localToday()} min={k==="end"?range.start:undefined} onChange={e=>setRange({...range,[k]:e.target.value,previous:""})}/></label>)}</div>:<p>{range.start===range.end?range.start:range.start+" – "+range.end}</p>}
    {!report?<p role="status">{failed===key?<>{t("error")} <button onClick={()=>setVersion(n=>n+1)}>{t("retry")}</button></>:t("loading")}</p>:<>
    {tab==="overview"&&<><div className="sf-metrics">{["billed","received","spent","outstanding","flow"].map(k=><section key={k}><span>{t(k)}</span><strong>{money(k==="flow"?Number(report.totals.received)-Number(report.totals.spent):report.totals[k])} {currency}</strong>{k==="flow"&&<small>{t("cashflow")}</small>}</section>)}</div>
      {manual&&<div className="sf-actions"><button onClick={async()=>{if(await leaveWork()){setTab("expenses");setDraft({kind:"expense"});}}}>{t("newExpense")}</button><button className="sf-primary" onClick={()=>void close()}>{t("close")}</button></div>}
      <div className="sf-grid">{breakdown("methods",report.methods,"receipts")}{breakdown("categories",report.categories,"expenses")}</div>
      {report.closes.length>0&&<section className="sf-card"><h2>{t("closes")}</h2>{report.closes.map(c=><details key={c.ref}><summary>{t(c.mode)} · {c.start} – {c.day}</summary><dl>{["billed","received","spent","outstanding",...(c.mode==="drawer"?["expected","difference"]:[])].map(k=>field(k,c.snapshot[k]))}</dl><p>{c.note}</p>{c.adjusted&&<strong>{t("adjusted")}</strong>}</details>)}</section>}
    </>}
    {tab==="reports"&&<section className="sf-card"><div className="sf-actions"><button className="sf-primary" onClick={()=>exportDays(report,dailyHeaders,t("total"))}>{t("csv")}</button></div><div className="sf-table-scroll"><table><thead><tr>{dailyHeaders.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{report.days.map(d=><tr key={d.day}><td>{d.day}</td>{(["billed","received","spent"] as const).map(k=><td key={k}>{money(d[k])}</td>)}</tr>)}</tbody><tfoot><tr><th>{t("total")}</th>{["billed","received","spent"].map(k=><td key={k}>{money(report.totals[k])}</td>)}</tr></tfoot></table></div>
    <div className="sf-grid"><section className="sf-card"><h3>{t("flow")}</h3><strong>{money(Number(report.totals.received)-Number(report.totals.spent))} {currency}</strong></section>
    <section className="sf-card"><h3>{t("comparison")}</h3><p>{report.previous} – {report.previous_end}</p><strong>{money(report.previous_received)} → {money(report.totals.received)} {currency}</strong><p>{Number(report.previous_received)!==0?money((Number(report.totals.received)-Number(report.previous_received))*100/Math.abs(Number(report.previous_received)))+" %":money(Number(report.totals.received)-Number(report.previous_received))+" "+currency}</p></section></div>
    {breakdown("categories",report.categories,"expenses")}<h3>{t("margin")}</h3>{report.jobs.map(j=><details key={j.ref}><summary>{j.name} · {money(j.margin)} {currency} · {t("partial")}</summary><dl>{field("billed",j.billed)}{field("outstanding",j.outstanding)}{Object.entries(j.costs).map(([k,v])=>field(k,v))}</dl></details>)}</section>}
    {(tab==="receipts"||tab==="expenses")&&<div className="sf-split"><section className="sf-card"><div className="sf-actions"><h2>{t(tab)}</h2><button onClick={()=>void open({kind:tab==="receipts"?"receipt":"expense"})}>{t(tab==="receipts"?"newReceipt":"newExpense")}</button>{filter&&<button onClick={()=>setFilter("")}>{t(filter)} ×</button>}</div>
    {tab==="expenses"&&<div className="sf-ledger-head" aria-hidden="true"><b>{t("expense")}</b><b>{t("frequency")}</b><b>{t("amount")}</b><b>{t("status")}</b></div>}
    {tab==="expenses"&&!filter&&report.dues.map(d=><article className="sf-row" key={d.ref+d.due}><header><strong>{d.label}</strong><span>{t("monthly")} · {d.due}</span><b>{money(d.amount)} {currency}</b><span className="sf-status">{t(d.category==="utilities"?"confirmAmount":"unpaid")}</span></header><div className="sf-actions">{d.due<=localToday()&&<button onClick={()=>void open({kind:"expense",due:d})}>{t("pay")}</button>}<button onClick={()=>void open({kind:"schedule_edit",due:d})}>{t("edit")}</button><button onClick={()=>void open({kind:"schedule_stop",due:d})}>{t("stop")}</button></div></article>)}
    {entries.map(e=><article className="sf-row" key={e.ref+e.kind}><header><strong>{e.label||t(e.source)}</strong><span>{tab==="expenses"?t(e.frequency==="monthly"?"monthly":"once")+" · ":""}{e.day}</span><b>{money(e.amount)} {currency}</b><span className={tab==="expenses"?"sf-status sf-paid":undefined}>{t(tab==="expenses"?"paid":e.method||"unspecified")}</span></header><small>{t(e.source)} · {e.ref} · {t("declared")}</small>
      {e.source==="counter"&&<button type="button" onClick={()=>{setDocumentRef({sale:e.original||e.ref,receipt:e.ref});setShowHistory(true);}}>{t("counter")}</button>}
      {e.job&&<button onClick={()=>{if(e.job)openJob(e.job);}}>{t("mission")}</button>}
      {e.kind==="spent"&&e.category==="inventory_purchase"&&!e.job&&Number(e.amount)>0&&<button onClick={()=>void open({kind:"material",source:e.ref,label:e.label})}>{t("inventory")}</button>}</article>)}
    {!entries.length&&!(tab==="expenses"&&report.dues.length)&&<p>{t("empty")}</p>}
    {tab==="receipts"&&report.advances.filter(a=>Number(a.remaining)>0).map(a=><p key={a.ref}>{t("advance")} · {a.label} · {money(a.remaining)} {currency} <button onClick={()=>void open({kind:"apply",source:a.ref,label:a.label})}>{t("apply")}</button></p>)}
    <button onClick={()=>setShowHistory(!showHistory)} aria-expanded={showHistory}>{t("history")}</button></section>
    {manual&&(draft||tab==="expenses")&&<ServiceFinanceForm key={JSON.stringify(draft)+version} draft={draft||{kind:"expense"}} base={base} binding={binding} report={report} locale={locale} offerings={offerings} onSaved={()=>{setDraft(null);setVersion(n=>n+1);}} onCancel={()=>setDraft(null)}/>}</div>}

    {showHistory&&<>{journal}{counter(documentRef)}</>}{mission}
    </>}</>}
    {draft&&tab==="overview"&&closeReport&&<ServiceFinanceForm synchronizing={!report} onPeriod={v=>{setPreset(v);setRange(period(v));}} draft={draft} base={base} binding={binding} report={closeReport} locale={locale} offerings={offerings} onSaved={()=>{setDraft(null);setVersion(n=>n+1);}} onCancel={()=>setDraft(null)}/>}
  </section>;
}
