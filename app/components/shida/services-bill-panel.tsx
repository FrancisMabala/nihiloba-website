"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {ServicesTemplatePicker} from "./services-template-library";
import {ServiceBillStatement} from "./service-bill-statement";

type Locale="fr"|"en"|"ln"|"sw";
type Line={label:string;amount:string;private_detail?:string};
type Version={bill_ref:string;version_ref:string;revision:number;status:string;source_kind:string;currency:string|null;total:string|null;issue_date:string|null;due_date:string|null;reason:string|null;presentation?:{display_name:string;accent:string};lines:(Line&{ordinal:number})[]};
const agreed={en:"Agreed service",fr:"Service convenu",ln:"Mosala oyo bondimaki",sw:"Huduma iliyokubaliwa"} as const;
const back={en:"Back",fr:"Retour",ln:"Zonga",sw:"Rudi"} as const;
const words={
 en:{title:"Service bills",draft:"Private draft",issued:"Provider-issued Service bill",void:"Voided",prepare:"Prepare bill",save:"Save draft",issue:"Issue bill",replace:"Replace bill",cancel:"Void bill",history:"Bill history",due:"Due date",reason:"Reason",label:"Line description",amount:"Amount",add:"Add line",remove:"Remove",currency:"Currency",empty:"No bill prepared.",unquoted:"Unquoted charges remain private drafts until customer acknowledgement rules are approved.",notice:"Issuing a bill does not confirm payment or customer receipt.",failed:"Bill action could not be completed. Refresh and try again.",stale:"Bill or reservation changed. Current history was reloaded.",current:"Current bill",revision:"Version"},
 fr:{title:"Factures de service",draft:"Brouillon privé",issued:"Facture de service émise par le prestataire",void:"Annulée",prepare:"Préparer la facture",save:"Enregistrer le brouillon",issue:"Émettre la facture",replace:"Remplacer la facture",cancel:"Annuler la facture",history:"Historique des factures",due:"Date d’échéance",reason:"Motif",label:"Description de ligne",amount:"Montant",add:"Ajouter une ligne",remove:"Supprimer",currency:"Devise",empty:"Aucune facture préparée.",unquoted:"Les montants sans devis restent en brouillon privé jusqu’à l’approbation de la règle d’acceptation du client.",notice:"Émettre une facture ne confirme ni paiement ni réception par le client.",failed:"Action impossible. Actualisez et réessayez.",stale:"La facture ou la réservation a changé. L’historique a été rechargé.",current:"Facture actuelle",revision:"Version"},
 ln:{title:"Ba facture ya mosala",draft:"Brouillon ya sekele",issued:"Facture ya mosala oyo mopesi mosala abimisi",void:"Elongolami",prepare:"Bongisa facture",save:"Bomba brouillon",issue:"Bimisa facture",replace:"Bongola facture",cancel:"Longola facture",history:"Lisolo ya ba facture",due:"Mokolo ya kofuta",reason:"Ntina",label:"Ndimbola ya molongo",amount:"Motango",add:"Bakisa molongo",remove:"Longola",currency:"Mbongo",empty:"Facture ebongisami naino te.",unquoted:"Mbongo oyo ezali na devis te etikali brouillon ya sekele kino mobeko ya kondima ya client ekondimama.",notice:"Kobimisa facture elakisi te ete client azwi yango to afuti.",failed:"Likambo ya facture elongi te. Zongisa mpe meka lisusu.",stale:"Facture to réservation ebongwani. Lisolo ya sika ezongi.",current:"Facture ya sikawa",revision:"Version"},
 sw:{title:"Bili za huduma",draft:"Rasimu ya faragha",issued:"Bili ya huduma iliyotolewa na mtoa huduma",void:"Imebatilishwa",prepare:"Andaa bili",save:"Hifadhi rasimu",issue:"Toa bili",replace:"Sahihisha bili",cancel:"Batilisha bili",history:"Historia ya bili",due:"Tarehe ya malipo",reason:"Sababu",label:"Maelezo ya mstari",amount:"Kiasi",add:"Ongeza mstari",remove:"Ondoa",currency:"Sarafu",empty:"Hakuna bili iliyoandaliwa.",unquoted:"Gharama bila nukuu hubaki rasimu ya faragha hadi kanuni ya idhini ya mteja iidhinishwe.",notice:"Kutoa bili hakuthibitishi malipo au kupokelewa na mteja.",failed:"Hatua ya bili haikukamilika. Sasisha na ujaribu tena.",stale:"Bili au nafasi imebadilika. Historia mpya imepakiwa.",current:"Bili ya sasa",revision:"Toleo"}
} as const;

export function ServicesBillPanel({base,binding,locale,reservationRef,reservationRevision,status,blocked=false}:{base:string;binding:string;locale:Locale;reservationRef:string;reservationRevision:number;status:string;blocked?:boolean}){
 const t=words[locale], [current,setCurrent]=useState<Version|null>(null),[history,setHistory]=useState<Version[]>([]),[selectedVersion,setSelectedVersion]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[allowed,setAllowed]=useState(false);
 const [form,setForm]=useState<"create"|"edit"|"issue"|"replace"|"void"|null>(null),[currency,setCurrency]=useState("CDF"),[lines,setLines]=useState<Line[]>([{label:"",amount:""}]),[dueDate,setDueDate]=useState(""),[reason,setReason]=useState("");
 const replay=useRef<{fingerprint:string;key:string}|null>(null);
 const call=useCallback(async(path:string,method="GET",body?:object)=>{
  const response=await fetch(`${base}/transactions/${path}`,{method,credentials:"include",cache:"no-store",headers:{Accept:"application/json","X-Shida-Session":binding,...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});
  if(!response.ok)throw new Error(String(response.status));
  return await response.json() as Record<string,unknown>;
 },[base,binding]);
 const reload=useCallback(async()=>{
  const value=await call(`reservations/${reservationRef}/bills`);
  const bill=value.current as Version|null;setAllowed(true);setCurrent(bill);setSelectedVersion(bill?.version_ref??"");
  if(value.bill_ref){const versions=await call(`bills/${value.bill_ref}/history`);setHistory(versions.versions as Version[]);}else setHistory([]);
 },[call,reservationRef]);
 useEffect(()=>{let active=true;queueMicrotask(()=>void reload().catch(()=>{if(active){setAllowed(false);setCurrent(null);setHistory([]);}}));return()=>{active=false;setCurrent(null);setHistory([]);};},[reload]);
 function begin(action:typeof form){replay.current=null;setForm(action);setNotice("");setCurrency(current?.currency??"CDF");setLines(current?.lines?.length?current.lines.map(row=>({label:row.label==="Agreed service"?agreed[locale]:row.label,amount:row.amount,private_detail:row.private_detail})): [{label:"",amount:""}]);setDueDate(current?.due_date??"");setReason("");}
 async function submit(event:React.FormEvent){event.preventDefault();if(!form||busy)return;
  const fingerprint=JSON.stringify([form,current?.revision,reservationRevision,currency,lines,dueDate,reason]);if(replay.current?.fingerprint!==fingerprint)replay.current={fingerprint,key:crypto.randomUUID()};
  const key=replay.current.key;const path=`reservations/${reservationRef}/bills`;let target=path,method="POST";let body:Record<string,unknown>={revision:form==="create"?reservationRevision:current?.revision,idempotency_key:key};
  if(form==="create"||form==="edit"){if(form==="edit"){target+=`/${current?.bill_ref}`;method="PATCH";}const entered=lines.filter(row=>row.label.trim()&&row.amount.trim());body={...body,...(entered.length?{currency,lines:entered}:form==="edit"?{lines:[]}:{} )};}
  else {target+=`/${current?.bill_ref}/${form}`;body={...body,reservation_revision:reservationRevision,...(form!=="void"?{due_date:dueDate}:{}),...(form!=="issue"?{reason}:{}),...(form==="replace"?{currency,lines}:{} )};}
  setBusy(true);try{await call(target,method,body);replay.current=null;setForm(null);await reload();}
  catch(error){const stale=error instanceof Error&&error.message==="409";setNotice(stale?t.stale:t.failed);if(stale){setForm(null);await reload().catch(()=>{});}}
  finally{setBusy(false);}
 }
 if(!allowed)return null;
 const workable=["confirmed","in_progress","completed"].includes(status)&&!blocked;
 return <section aria-label={t.title} style={{border:"1px solid #94a3b8",borderRadius:8,padding:"1rem",margin:"1rem 0"}}>
  <h4>{t.title}</h4><p>{t.notice}</p>{notice&&<p role="status">{notice}</p>}
  {!current?<><p>{t.empty}</p>{workable&&<button type="button" onClick={()=>begin("create")}>{t.prepare}</button>}</>:
   <><p><strong>{current.status==="private_draft"?t.draft:current.status==="void"?t.void:t.issued}</strong> · {current.total??"—"} {current.currency??""}</p>
    {current.source_kind==="provider_entered"&&<p>{t.unquoted}</p>}
    {current.status==="private_draft"&&workable&&<><button type="button" onClick={()=>begin("edit")}>{t.save}</button>{" "}{current.source_kind==="accepted_quote"&&<button type="button" onClick={()=>begin("issue")}>{t.issue}</button>}</>}
    {current.status==="issued"&&workable&&<><button type="button" onClick={()=>begin("replace")}>{t.replace}</button>{" "}<button type="button" onClick={()=>begin("void")}>{t.cancel}</button></>}
   </>}
  {form&&<form onSubmit={event=>void submit(event)} style={{display:"grid",gap:8,marginTop:12}}>
    {["create","edit","replace"].includes(form)&&<><label>{t.currency}<select value={currency} onChange={event=>setCurrency(event.target.value)}><option>CDF</option><option>USD</option></select></label>{lines.map((line,index)=><div key={index} style={{display:"flex",gap:8,flexWrap:"wrap"}}><label>{t.label}<input value={line.label} maxLength={120} onChange={event=>setLines(old=>old.map((row,i)=>i===index?{...row,label:event.target.value}:row))}/></label><label>{t.amount}<input inputMode="decimal" pattern="[0-9]+([.][0-9]{2})?" value={line.amount} onChange={event=>setLines(old=>old.map((row,i)=>i===index?{...row,amount:event.target.value}:row))}/></label><button type="button" onClick={()=>setLines(old=>old.filter((_,i)=>i!==index))}>{t.remove}</button></div>)}<button type="button" onClick={()=>setLines(old=>[...old,{label:"",amount:""}])}>{t.add}</button></>}
    {["issue","replace"].includes(form)&&<label>{t.due}<input type="date" required value={dueDate} onChange={event=>setDueDate(event.target.value)}/></label>}
    {["replace","void"].includes(form)&&<label>{t.reason}<textarea required maxLength={500} value={reason} onChange={event=>setReason(event.target.value)}/></label>}
    <div><button disabled={busy} type="submit">{form==="create"||form==="edit"?t.save:form==="issue"?t.issue:form==="replace"?t.replace:t.cancel}</button>{" "}<button type="button" onClick={()=>setForm(null)}>{back[locale]}</button></div>
   </form>}
  {workable&&(!current||current.status==="private_draft")&&<ServicesTemplatePicker base={base} binding={binding} locale={locale} kind="bill" targetRef={reservationRef} targetRevision={current?.revision??reservationRevision} draftRef={current?.status==="private_draft"?current.bill_ref:undefined} onApplied={()=>{setForm(null);void reload();}}/>}
  {history.length>0&&<><h5>{t.history}</h5><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>{history.map(version=><button type="button" key={version.version_ref} aria-pressed={selectedVersion===version.version_ref} onClick={()=>setSelectedVersion(version.version_ref)}>{t.revision} {version.revision} · {version.status==="private_draft"?t.draft:version.status==="void"?t.void:t.issued}</button>)}</div>{history.filter(version=>version.version_ref===selectedVersion).map(version=><div key={version.version_ref}><ServiceBillStatement version={version} locale={locale} draft={version.status==="private_draft"} current={version.version_ref===current?.version_ref}/>{version.reason&&<p>{t.reason}: {version.reason}</p>}</div>)}</>}
 </section>;
}
