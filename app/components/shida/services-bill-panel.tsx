"use client";
import "./services-financial.css";
import {useCallback,useEffect,useRef,useState} from "react";
import {ServicesBillDelivery} from "./services-bill-delivery";
import {ServicesTemplatePicker} from "./services-template-library";
import {ServiceBillStatement} from "./service-bill-statement";
import {serviceAmount} from "../../lib/service-time";
import {useWorkDraft} from "../../lib/restaurant-work";
import {financialRequest,useFinancialCommand,type FinancialCommand} from "../../lib/services-financial-state";
import {billReviewCopy,billTotal} from "../../lib/services-bill-review-copy";
type Locale="fr"|"en"|"ln"|"sw";
type Line={label:string;amount:string;private_detail?:string};
type Version={current_reservation_revision?:number;bill_ref:string;version_ref:string;revision:number;status:string;source_kind:string;currency:string|null;total:string|null;issue_date:string|null;due_date:string|null;reason:string|null;presentation?:{display_name:string;accent:string};lines:(Line&{ordinal:number})[]};
const agreed={en:"Agreed service",fr:"Service convenu",ln:"Mosala oyo bondimaki",sw:"Huduma iliyokubaliwa"} as const;
const back={en:"Back",fr:"Retour",ln:"Zonga",sw:"Rudi"} as const;
const words={
 en:{title:"Service bills",draft:"Private draft",issued:"Issued bill",void:"Voided",prepare:"Prepare bill",save:"Save draft",issue:"Issue bill",replace:"Replace bill",cancel:"Void bill",history:"Bill history",due:"Due date",reason:"Reason",label:"Line description",amount:"Amount",add:"Add line",remove:"Remove",currency:"Currency",empty:"No bill prepared.",unquoted:"To issue this bill, first agree a quote with your customer.",notice:"Issue your bill, then send it to your customer.",failed:"Bill action could not be completed. Refresh and try again.",stale:"Bill or reservation changed. Current history was reloaded.",current:"Current bill",revision:"Version"},
 fr:{title:"Factures de service",draft:"Brouillon privé",issued:"Facture émise",void:"Annulée",prepare:"Préparer la facture",save:"Enregistrer le brouillon",issue:"Émettre la facture",replace:"Remplacer la facture",cancel:"Annuler la facture",history:"Historique des factures",due:"Date d’échéance",reason:"Motif",label:"Description de ligne",amount:"Montant",add:"Ajouter une ligne",remove:"Supprimer",currency:"Devise",empty:"Aucune facture préparée.",unquoted:"Pour émettre cette facture, faites d’abord accepter un devis par votre client.",notice:"Émettez la facture, puis envoyez-la à votre client.",failed:"Action impossible. Actualisez et réessayez.",stale:"La facture ou la réservation a changé. L’historique a été rechargé.",current:"Facture actuelle",revision:"Version"},
 ln:{title:"Ba facture ya mosala",draft:"Brouillon ya sekele",issued:"Facture ebimi",void:"Elongolami",prepare:"Bongisa facture",save:"Bomba brouillon",issue:"Bimisa facture",replace:"Bongola facture",cancel:"Longola facture",history:"Lisolo ya ba facture",due:"Mokolo ya kofuta",reason:"Ntina",label:"Ndimbola ya molongo",amount:"Motango",add:"Bakisa molongo",remove:"Longola",currency:"Mbongo",empty:"Facture ebongisami naino te.",unquoted:"Mpo na kobimisa facture oyo, client andima devis liboso.",notice:"Bimisa facture, na nsima tinda yango na client.",failed:"Likambo ya facture elongi te. Zongisa mpe meka lisusu.",stale:"Facture to réservation ebongwani. Lisolo ya sika ezongi.",current:"Facture ya sikawa",revision:"Version"},
 sw:{title:"Bili za huduma",draft:"Rasimu ya faragha",issued:"Bili iliyotolewa",void:"Imebatilishwa",prepare:"Andaa bili",save:"Hifadhi rasimu",issue:"Toa bili",replace:"Sahihisha bili",cancel:"Batilisha bili",history:"Historia ya bili",due:"Tarehe ya malipo",reason:"Sababu",label:"Maelezo ya mstari",amount:"Kiasi",add:"Ongeza mstari",remove:"Ondoa",currency:"Sarafu",empty:"Hakuna bili iliyoandaliwa.",unquoted:"Ili kutoa bili hii, kubaliana nukuu na mteja kwanza.",notice:"Toa bili, kisha uitume kwa mteja.",failed:"Hatua ya bili haikukamilika. Sasisha na ujaribu tena.",stale:"Bili au nafasi imebadilika. Historia mpya imepakiwa.",current:"Bili ya sasa",revision:"Toleo"}
} as const;


type Props={base:string;binding:string;locale:Locale;reservationRef:string;reservationRevision:number;status:string;blocked?:boolean};
type Action="create"|"edit"|"issue"|"replace"|"void";
function BoundBillPanel({base,binding,locale,reservationRef,reservationRevision,status,blocked=false}:Props){
 const t=words[locale],c=billReviewCopy[locale],command=useFinancialCommand(binding);
 const [current,setCurrent]=useState<Version|null>(null),[history,setHistory]=useState<Version[]>([]),[selectedVersion,setSelectedVersion]=useState("");
 const [loading,setLoading]=useState(true),[loaded,setLoaded]=useState(false),[error,setError]=useState<""|"failed"|"denied">(""),[notice,setNotice]=useState("");
 const [form,setForm]=useState<Action|null>(null),[currency,setCurrency]=useState("CDF"),[lines,setLines]=useState<Line[]>([{label:"",amount:""}]),[dueDate,setDueDate]=useState(""),[reason,setReason]=useState("");
 const [origin,setOrigin]=useState<{bill?:string;revision?:number;reservation:number}|null>(null);
 const [review,setReview]=useState<{command:FinancialCommand;lines:Line[];currency:string;total:string|null;automatic:boolean}|null>(null);
 const alive=useRef(true),generation=useRef(0);
 useWorkDraft(!!form||!!command.pending,c.leave);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;};},[]);
 const reload=useCallback(async()=>{
  const ticket=++generation.current;setLoading(true);
  try{
   const value=await financialRequest<{current:Version|null;bill_ref?:string}>(binding,`${base}/transactions/reservations/${reservationRef}/bills`);
   const versions=value.bill_ref?await financialRequest<{versions:Version[]}>(binding,`${base}/transactions/bills/${value.bill_ref}/history`):{versions:[]};
   if(!alive.current||ticket!==generation.current)return;
   setCurrent(value.current);setHistory(versions.versions);setSelectedVersion(old=>versions.versions.some(row=>row.version_ref===old)?old:value.current?.version_ref??"");
   setLoaded(true);setError("");
  }catch(failure){if(alive.current&&ticket===generation.current){const denied=failure instanceof Error&&["401","403","404"].includes(failure.message);setError(denied?"denied":"failed");if(denied){setCurrent(null);setHistory([]);}}}
  finally{if(alive.current&&ticket===generation.current)setLoading(false);}
 },[base,binding,reservationRef]);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active)void reload();});const focus=()=>void reload();window.addEventListener("focus",focus);return()=>{active=false;window.removeEventListener("focus",focus);};},[reload]);
 const workable=["confirmed","in_progress","completed"].includes(status)&&!blocked;
 const effectiveReservationRevision=current?.current_reservation_revision??reservationRevision;
 const stale=!!origin&&(origin.bill!==current?.bill_ref||origin.revision!==current?.revision||origin.reservation!==effectiveReservationRevision);
 const locked=command.busy||!!command.pending;
 function begin(action:Action){
  if(locked||form&&!window.confirm(c.leave))return;
  setForm(action);setReview(null);setNotice("");command.clear();setOrigin({bill:current?.bill_ref,revision:current?.revision,reservation:effectiveReservationRevision});
  setCurrency(current?.currency??"CDF");setLines(current?.lines?.length?current.lines.map(row=>({label:row.label==="Agreed service"?agreed[locale]:row.label,amount:row.amount,private_detail:row.private_detail})):[{label:"",amount:""}]);
  setDueDate(current?.due_date??"");setReason("");
 }
 function prepare(event:React.FormEvent){
  event.preventDefault();if(!form||locked||stale||error||!workable)return;
  const automatic=form==="create"&&(lines.length===0||lines.length===1&&!lines[0].label.trim()&&!lines[0].amount.trim());
  let entered:Line[]=[];
  if(["create","edit","replace"].includes(form)&&!automatic){
   if(!lines.length||lines.some(line=>!line.label.trim()||!line.amount.trim())){setNotice(c.incomplete);return;}
   try{entered=lines.map(row=>({...row,label:row.label.trim(),amount:serviceAmount(row.amount)}));}catch{setNotice(c.incomplete);return;}
  }
  const path=`${base}/transactions/reservations/${reservationRef}/bills`;let target=path,method="POST";
  let body:Record<string,unknown>={revision:form==="create"?reservationRevision:current?.revision,idempotency_key:crypto.randomUUID()};
  if(form==="create"||form==="edit"){
   if(form==="edit"){target+=`/${current?.bill_ref}`;method="PATCH";}
   if(!automatic)body={...body,currency,lines:entered};
  }else{
   target+=`/${current?.bill_ref}/${form}`;
   body={...body,reservation_revision:effectiveReservationRevision,...(form!=="void"?{due_date:dueDate}:{}),...(form!=="issue"?{reason}:{}),...(form==="replace"?{currency,lines:entered}:{})};
  }
  const previewLines=form==="issue"||form==="void"?current?.lines??[]:entered;
  setReview({command:{path:target,method,body:JSON.stringify(body)},lines:previewLines,currency:form==="issue"||form==="void"?current?.currency??"":currency,total:previewLines.length?billTotal(previewLines):null,automatic});
  setNotice("");command.clear();
 }
 async function confirm(){
  if(!command.pending&&(!review||stale||error||!workable))return;
  const value=await command.run(command.pending??review?.command);
  if(value!==undefined){setForm(null);setReview(null);setOrigin(null);await reload();}
 }
 if(error==="denied"||command.status==="denied")return <section className="svc-financial-panel" aria-label={t.title}><h4>{t.title}</h4><p role="alert">{c.denied}</p></section>;
 const actionLabel=form==="create"||form==="edit"?t.save:form==="issue"?t.issue:form==="replace"?t.replace:t.cancel;
 return <section className="svc-financial-panel" aria-label={t.title} style={{border:"1px solid #deded1",borderRadius:16,padding:"clamp(1rem,3vw,1.75rem)",margin:"1rem 0",background:"#fffefa"}}>
  <h4>{t.title}</h4><p>{t.notice} {c.unpaid}</p>
  {loading&&<p role="status">{c.loading}</p>}
  {error&&<p role="alert">{c.failed}</p>}
  {error&&<button type="button" disabled={loading} onClick={()=>void reload()}>{c.retry}</button>}
  {(notice||command.status)&&<p role="status">{notice||(command.status?c[command.status]:"")}</p>}
  {(stale||command.status==="stale")&&<p role="alert">{c.stale} <button type="button" disabled={loading} onClick={()=>void reload()}>{c.refresh}</button></p>}
  {loaded&&<>
   {!current?<><p>{t.empty}</p>{workable&&!form&&<button type="button" disabled={!!error} onClick={()=>begin("create")}>{t.prepare}</button>}</>:
    <><p><strong>{current.status==="private_draft"?t.draft:current.status==="void"?t.void:t.issued}</strong> · {current.total??"—"} {current.currency??""}</p>
     {current.source_kind==="provider_entered"&&current.status==="private_draft"&&<p>{t.unquoted}</p>}
     {!form&&current.status==="private_draft"&&workable&&<div style={{display:"flex",gap:12,flexWrap:"wrap"}}><button type="button" disabled={!!error} onClick={()=>begin("edit")}>{t.save}</button>{current.source_kind==="accepted_quote"&&<button type="button" disabled={!!error} onClick={()=>begin("issue")}>{t.issue}</button>}</div>}
     {!form&&current.status==="issued"&&workable&&<div style={{display:"flex",gap:12,flexWrap:"wrap"}}><button type="button" disabled={!!error} onClick={()=>begin("replace")}>{t.replace}</button><button type="button" disabled={!!error} onClick={()=>begin("void")}>{t.cancel}</button></div>}
    </>}
   {current&&current.status!=="private_draft"&&!form&&!error&&<ServicesBillDelivery base={base} binding={binding} locale={locale} reservationRef={reservationRef} reservationRevision={current.current_reservation_revision??reservationRevision} billRef={current.bill_ref} versionRef={current.version_ref} revision={current.revision} onStale={reload}/>}
   {form&&<form onSubmit={prepare}>
    <fieldset disabled={locked||!!review||stale||!workable} style={{border:0,padding:0,margin:"1rem 0",display:"grid",gap:16}}>
     <legend>{actionLabel}</legend>
     {["create","edit","replace"].includes(form)&&<>
      <label>{t.currency}<select value={currency} onChange={e=>setCurrency(e.target.value)}><option>CDF</option><option>USD</option></select></label>
      {lines.map((line,index)=><div key={index} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,180px),1fr))",gap:12,alignItems:"end"}}>
       <label>{t.label}<input value={line.label} maxLength={120} onChange={e=>setLines(old=>old.map((row,i)=>i===index?{...row,label:e.target.value}:row))}/></label>
       <label>{t.amount}<input inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" value={line.amount} onChange={e=>setLines(old=>old.map((row,i)=>i===index?{...row,amount:e.target.value}:row))}/></label>
       <button type="button" onClick={()=>setLines(old=>old.filter((_,i)=>i!==index))}>{t.remove}</button>
      </div>)}
      <button type="button" onClick={()=>setLines(old=>[...old,{label:"",amount:""}])}>{t.add}</button>
      {form==="create"&&<p>{c.fromQuote}</p>}
     </>}
     {["issue","replace"].includes(form)&&<label>{t.due}<input type="date" required value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label>}
     {["replace","void"].includes(form)&&<label>{t.reason}<textarea required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label>}
     {!review&&<button type="submit" disabled={!!error}>{c.review}</button>}
    </fieldset>
   </form>}
   {review&&<section aria-label={c.review} style={{background:"#f1f4e9",padding:"1rem",borderRadius:12,margin:"1rem 0",overflowWrap:"anywhere"}}>
    <h5>{c.review}</h5>
    {review.automatic?<p>{c.fromQuote}</p>:<><ul>{review.lines.map((line,i)=><li key={i}>{line.label} · {line.amount} {review.currency}</li>)}</ul><p><strong>{c.total}: {review.total??"—"} {review.currency}</strong></p></>}
    {form==="void"?<p>{c.void}</p>:dueDate&&<p>{t.due}: {dueDate}</p>}
    {reason&&<p>{t.reason}: {reason}</p>}<p>{c.history}</p>
    {!command.pending&&<div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     <button className="svc-financial-primary" type="button" disabled={stale||!!error||!workable||command.status==="stale"} onClick={()=>void confirm()}>{actionLabel}</button>
     <button type="button" onClick={()=>{setReview(null);command.clear();}}>{c.edit}</button>
    </div>}
   </section>}
   {command.pending&&<button type="button" disabled={command.busy} onClick={()=>void confirm()}>{c.retry}</button>}
   {form&&<button type="button" disabled={locked} onClick={()=>{if(window.confirm(c.leave)){setForm(null);setReview(null);setOrigin(null);setNotice("");command.clear();}}}>{back[locale]}</button>}
   {!form&&!error&&workable&&(!current||current.status==="private_draft")&&<ServicesTemplatePicker base={base} binding={binding} locale={locale} kind="bill" targetRef={reservationRef} targetRevision={current?.revision??reservationRevision} draftRef={current?.status==="private_draft"?current.bill_ref:undefined} onApplied={()=>void reload()}/>}
   {history.length>0&&<details style={{marginTop:20}}><summary>{t.history}</summary><p>{c.history}</p>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"1rem 0"}}>{history.map(version=><button type="button" key={version.version_ref} aria-pressed={selectedVersion===version.version_ref} onClick={()=>setSelectedVersion(version.version_ref)}>{t.revision} {version.revision} · {version.status==="private_draft"?t.draft:version.status==="void"?t.void:t.issued}</button>)}</div>
    {history.filter(version=>version.version_ref===selectedVersion).map(version=><div key={version.version_ref}><ServiceBillStatement version={version} locale={locale} draft={version.status==="private_draft"} current={version.version_ref===current?.version_ref}/>{version.reason&&<p>{t.reason}: {version.reason}</p>}</div>)}
   </details>}
  </>}
 </section>;
}
export function ServicesBillPanel(props:Props){return <BoundBillPanel key={[props.base,props.binding,props.reservationRef].join(":")} {...props}/>;}
