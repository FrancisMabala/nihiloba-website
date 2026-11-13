"use client";
import {useState} from "react";
import {financeLabel,type FinanceLocale} from "@/app/lib/service-finance-workspace-copy";
import {type Draft,type Offering,type Report,localToday} from "@/app/lib/service-finance-workspace";
import {financeReviewCopy} from "@/app/lib/services-finance-copy";
import {useFinancialCommand} from "@/app/lib/services-financial-state";
import {useWorkDraft} from "@/app/lib/restaurant-work";

type Props={synchronizing?:boolean;draft:Draft;report:Report;offerings:Offering[];locale:FinanceLocale;binding:string;base:string;onPeriod?:(value:"today"|"week")=>void;onSaved:()=>void;onCancel:()=>void};
export function ServiceFinanceForm({draft,report,offerings,locale,binding,base,onCancel,onSaved,onPeriod,synchronizing=false}:Props){
  const t=(key:string)=>financeLabel(locale,key), c=financeReviewCopy[locale], cmd=useFinancialCommand(binding);
  const plan=draft.due, today=localToday(), locked=!!cmd.pending||cmd.busy;
  const [dirty,setDirty]=useState(false),[frequency,setFrequency]=useState(plan?"monthly":"once");
  const [kind,setKind]=useState(draft.kind),[scope,setScope]=useState(plan?.job?"job":plan?.service?"oneService":"all");
  const [mode,setMode]=useState(/legal|law|jurid/i.test(offerings[0]?.category??"")?"fees":/repair|construction|electric/i.test(offerings[0]?.category??"")?"jobs":"drawer");
  const [opening,setOpening]=useState("0"),[counted,setCounted]=useState("0"),[movement,setMovement]=useState("0");
  useWorkDraft(dirty||locked,c.leave,locale);
  const isPay=!!plan && kind==="expense", isSpend=["expense","schedule_edit"].includes(kind), isReceive=["receipt","advance"].includes(kind);
  const isAllocation=kind==="material"||kind==="apply", isClose=kind==="close", stop=kind==="schedule_stop";
  const title=isClose?t(mode):isPay?t("pay"):kind==="schedule_edit"?t("edit"):stop?t("stop"):isSpend?t("newExpense"):isReceive?t("newReceipt"):t(kind==="material"?"inventory":"apply");
  const cashSpent=report.entries.filter(e=>e.kind==="spent"&&e.method==="cash").reduce((n,e)=>n+Number(e.amount),0);
  const expected=Number(opening)+Number(report.methods.cash??0)-cashSpent+Number(movement);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const values=Object.fromEntries(new FormData(event.currentTarget)) as Record<string,string>;
    const data:Record<string,string>={kind,currency:report.currency,day:values.day||today};
    if(stop){data.source=plan!.ref;}
    else if(isClose){Object.assign(data,{day:report.end,start:report.start,mode,opening,counted,movement,note:values.note||""});}
    else{
      data.amount=values.amount.replace(",",".");
      if(!isAllocation){data.label=values.label||plan?.label||"";data.method=values.method||"unspecified";}
      if(isSpend){
        data.category=values.category||plan?.category||"general";
        if(isPay){data.source=plan!.ref;data.due=plan!.due;}
        else if(kind==="schedule_edit")data.source=plan!.ref;
        else if(frequency==="monthly")data.kind="schedule";
      }
      if(values.service)data.service=values.service;
      if(values.job)data.job=values.job;
      if(isAllocation)data.source=draft.source!;
    }
    const result=await cmd.run({path:base+"/transactions/finance/workspace",method:"POST",body:JSON.stringify(data),key:crypto.randomUUID()});
    if(result){setDirty(false);onSaved();}
  }
  const options=(keys:string[])=>keys.map(k=><option key={k} value={k}>{t(k)}</option>);
  return <form className="sf-card sf-form" onSubmit={submit} onChange={()=>setDirty(true)}><h2>{title}</h2>
    <fieldset disabled={locked||synchronizing}>
    {stop?<p>{plan?.label} · {plan?.due}</p>:isClose?<><label>{t("close")}<select value={mode} onChange={e=>{setMode(e.target.value);if(e.target.value!=="fees")onPeriod?.("today");}}>{options(["drawer","jobs","fees"])}</select></label>
      {mode==="fees"&&onPeriod&&<div className="sf-actions">{(["today","week"] as const).map(k=><button type="button" key={k} onClick={()=>onPeriod(k)}>{t(k)}</button>)}</div>}
      <p>{report.start} – {report.end} · {report.currency}</p>
      {mode==="drawer"?<>{([["opening",opening,setOpening],["movement",movement,setMovement],["counted",counted,setCounted]] as const).map(([k,v,set])=><label key={k}>{t(k)}<input required type="number" step=".01" min={k==="movement"?undefined:"0"} value={v} onChange={e=>set(e.target.value)}/></label>)}
      <dl>{[["cash",report.methods.cash||0],["cashSpent",cashSpent],["mobile_money",report.methods.mobile_money||0],["expected",expected],["difference",Number(counted)-expected]].map(([k,v])=><div key={k}><dt>{t(String(k))}</dt><dd>{Number(v).toLocaleString(locale)} {report.currency}</dd></div>)}</dl></>:<>
      <dl>{["billed","received","outstanding","spent"].map(k=><div key={k}><dt>{t(k)}</dt><dd>{report.totals[k]} {report.currency}</dd></div>)}<div><dt>{t("advance")}</dt><dd>{report.advances.reduce((n,a)=>n+Number(a.remaining),0)} {report.currency}</dd></div></dl>
      {report.jobs.filter(j=>j.in_period).map(j=><details key={j.ref}><summary>{j.name} · {t(j.status)}</summary>{t("billed")} {j.billed} · {t("outstanding")} {j.outstanding}<ul>{Object.entries(j.costs).map(([k,v])=><li key={k}>{t(k)} {v}</li>)}</ul></details>)}</>}
      <label>{t("note")}<textarea name="note" maxLength={500}/></label></>:<>
      {isReceive&&<label>{t("source")}<select value={kind} onChange={e=>setKind(e.target.value as "receipt"|"advance")}><option value="receipt">{t("mission")}</option><option value="advance">{t("advance")}</option></select></label>}
      {!isAllocation&&<label>{t("label")}<input name="label" required maxLength={200} readOnly={isPay} defaultValue={plan?.label}/></label>}
      {isAllocation&&<p>{draft.label}</p>}
      <label>{t(isPay?"actual":isSpend&&frequency==="monthly"?"expectedAmount":"amount")} ({report.currency})<input name="amount" required inputMode="decimal" type="number" step=".01" min=".01" defaultValue={plan?.amount}/></label>
      {isSpend&&!isPay&&<><label>{t("category")}<select name="category" defaultValue={plan?.category||"rent"}>{options(["rent","utilities","supplies","inventory_purchase","transport","maintenance","professional_fees","salary_wages","general","other_expense"])}</select></label>
      <label>{t("frequency")}<select disabled={kind==="schedule_edit"} value={frequency} onChange={e=>setFrequency(e.target.value)}>{options(["once","monthly"])}</select></label>
      <label>{t("assignment")}<select value={scope} onChange={e=>setScope(e.target.value)}>{options(["all","oneService","job"])}</select></label></>}
      {isSpend&&!isPay&&scope==="oneService"&&<label>{t("service")}<select name="service" defaultValue={plan?.service||""} required><option value="">{t("select")}</option>{offerings.map(o=><option key={o.public_ref} value={o.public_ref}>{o.service_name}</option>)}</select></label>}
      {(isAllocation||kind==="receipt"||isSpend&&!isPay&&scope==="job")&&<label>{t("job")}<select name="job" required defaultValue={plan?.job||""}><option value="">{t("select")}</option>{report.jobs.filter(j=>kind!=="apply"||Number(j.outstanding)>0).map(j=><option key={j.ref} value={j.ref}>{j.name} · {j.ref}</option>)}</select></label>}
      {!isAllocation&&(isPay||isReceive||frequency==="once")&&<label>{t("method")}<select name="method" defaultValue={plan?.method||"cash"}>{options(["cash","mobile_money","bank","other","unspecified"])}</select></label>}
      <label>{t(isPay?"paymentDate":isSpend&&frequency==="monthly"?"due":"date")}<input required type="date" name="day" max={isSpend&&!isPay&&frequency==="monthly"?undefined:today} defaultValue={kind==="schedule_edit"?plan?.due:today}/></label>
      </>}
    <button className="sf-primary" type="submit">{t(!isPay&&isSpend&&frequency==="monthly"?"saveSchedule":stop?"stop":"save")}</button>
    <button type="button" onClick={onCancel}>{t("cancel")}</button></fieldset>
    {cmd.status&&cmd.status!=="saved"&&<p role="alert">{c[cmd.status]}</p>}
    {!!cmd.pending&&!cmd.busy&&<button type="button" onClick={async()=>{if(await cmd.run())onSaved();}}>{t("retry")}</button>}
  </form>;
}
