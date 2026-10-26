"use client";
import "./services-financial.css";
import {serviceAmount,serviceLocalInput,serviceTimestamp} from "../../lib/service-time";
import {useCallback,useEffect,useRef,useState} from "react";
import {useWorkDraft} from "../../lib/restaurant-work";
import {financialRequest,useFinancialCommand,type FinancialCommand} from "../../lib/services-financial-state";
import {financeReviewCopy,financeCategory,financeReason,financeReasonKeys} from "../../lib/services-finance-copy";
type Locale="fr"|"en"|"ln"|"sw";
type Entry={entry_ref:string;measure:"recorded_income"|"recorded_expense";direction:number;amount:string;currency:string;effective_date:string;category:string;private_note:string|null;evidence:string;effect:string;correction_state:string;reservation_ref:string|null;association_kind:"job"|"overhead";recorded_at:string;original_entry_ref:string|null;revision:number};
type Reservation={reservation_ref?:string;service_name?:string;offering?:string;requester_name?:string;requested_datetime?:string};
const copy={
 en:{moreBookings:"More bookings",title:"Money received or spent",intro:"Your record of receipts and expenses. A recorded receipt does not confirm payment or notify your customer.",income:"Money received",expense:"Expenses",job:"Service reservation",overhead:"Expense for my activity",amount:"Exact amount",currency:"Currency",date:"Date",category:"Category",note:"Private note",save:"Record entry",history:"Entry and correction history",empty:"No Services entries yet.",correction:"Correct",reason:"Reason",replace:"Correct this record",reverse:"Cancel this record without a replacement",submitCorrection:"Record correction",cancel:"Cancel",refresh:"Refresh",more:"More history",denied:"Private finance access is unavailable.",failed:"Could not load or save the journal.",saved:"Journal updated.",selectJob:"Choose a booking",requiredJob:"Choose the booking for this entry.",effect:"Money received or spent",original:"Original",replacement:"Replacement",reversal:"Cancelled record"},
 fr:{moreBookings:"Autres réservations",title:"Argent reçu ou dépensé",intro:"Vos encaissements et dépenses enregistrés. Un encaissement enregistré ne confirme pas le paiement et ne prévient pas le client.",income:"Argent reçu",expense:"Dépenses",job:"Réservation de service",overhead:"Dépense de mon activité",amount:"Montant exact",currency:"Devise",date:"Date",category:"Catégorie",note:"Note privée",save:"Enregistrer",history:"Historique des écritures et corrections",empty:"Aucune écriture Services.",correction:"Corriger",reason:"Motif",replace:"Corriger cette écriture",reverse:"Annuler cette écriture sans remplacement",submitCorrection:"Enregistrer la correction",cancel:"Annuler",refresh:"Actualiser",more:"Historique suivant",denied:"Accès aux finances privées indisponible.",failed:"Impossible de charger ou d'enregistrer le journal.",saved:"Journal mis à jour.",selectJob:"Choisir une réservation",requiredJob:"Choisissez la réservation pour cette écriture.",effect:"Argent reçu ou dépensé",original:"Original",replacement:"Remplacement",reversal:"Écriture annulée"},
 ln:{moreBookings:"Ba rendez-vous mosusu",title:"Mbongo ozwi to obimisi",intro:"Mbongo ozwi mpe depanse oyo okomi. Lokoma ya mbongo ozwi endimisi lifuti te mpe etindeli kiliya nsango te.",income:"Mbongo ozwi",expense:"Depanse",job:"Réservation ya mosala",overhead:"Depanse ya mosala na ngai",amount:"Motango ya sikisiki",currency:"Mbongo",date:"Mokolo",category:"Catégorie",note:"Note ya sekele",save:"Bomba",history:"Lisolo ya ba entrées mpe corrections",empty:"Entrée ya Services ezali te.",correction:"Bongisa",reason:"Ntina",replace:"Bongisa lokoma oyo",reverse:"Longola lokoma oyo kozanga kozongisa mosusu",submitCorrection:"Bomba correction",cancel:"Longola",refresh:"Zongisa",more:"Lisolo mosusu",denied:"Ndingisa ya mbongo ya sekele ezali te.",failed:"Journal ekoki te kofungwama to kobombama.",saved:"Journal ebongwani.",selectJob:"Pona rendez-vous",requiredJob:"Pona rendez-vous mpo na lokoma oyo.",effect:"Mbongo ozwi to obimisi",original:"Ya liboso",replacement:"Remplacement",reversal:"Lokoma elongolami"},
 sw:{moreBookings:"Nafasi zaidi",title:"Fedha zilizopokelewa au kutumika",intro:"Rekodi yako ya mapokezi na gharama. Rekodi ya mapokezi haithibitishi malipo wala kumjulisha mteja.",income:"Fedha zilizopokelewa",expense:"Gharama",job:"Nafasi ya huduma",overhead:"Gharama ya shughuli yangu",amount:"Kiasi halisi",currency:"Sarafu",date:"Tarehe",category:"Aina",note:"Maelezo binafsi",save:"Hifadhi rekodi",history:"Historia ya rekodi na masahihisho",empty:"Hakuna rekodi za Huduma.",correction:"Sahihisha",reason:"Sababu",replace:"Sahihisha rekodi hii",reverse:"Futa rekodi hii bila mbadala",submitCorrection:"Hifadhi sahihisho",cancel:"Ghairi",refresh:"Sasisha",more:"Historia zaidi",denied:"Ruhusa ya fedha binafsi haipatikani.",failed:"Imeshindikana kupakia au kuhifadhi daftari.",saved:"Daftari limesasishwa.",selectJob:"Chagua nafasi",requiredJob:"Chagua nafasi kwa rekodi hii.",effect:"Fedha zilizopokelewa au kutumika",original:"Asili",replacement:"Mbadala",reversal:"Rekodi iliyofutwa"}
} as const;
const expenseCategories=["general","inventory_purchase","transport","rent","utilities","salary_wages","supplies","maintenance","other_expense"];
const incomeCategories=["general","sales","service_income","other_income"];


const today=()=>serviceLocalInput(new Date().toISOString()).slice(0,10);
const initial=()=>({measure:"recorded_income",association_kind:"job",reservation_ref:"",amount:"",currency:"CDF",effective_date:today(),category:"service_income",private_note:""});
type Props={base:string;binding:string;locale:Locale};
export function ServicesFinancePanel(props:Props){return <BoundFinance key={`${props.base}:${props.binding}`} {...props}/>;}
function BoundFinance({base,binding,locale}:Props){
 const t=copy[locale],c=financeReviewCopy[locale],command=useFinancialCommand(binding);
 const [section,setSection]=useState<"recorded_income"|"recorded_expense">("recorded_income");
 const [rows,setRows]=useState<Entry[]>([]),[nextOffset,setNextOffset]=useState<number|null>(null),[reservations,setReservations]=useState<Reservation[]>([]);
 const [moreBookings,setMoreBookings]=useState(false),[bookingError,setBookingError]=useState(false),[bookingsBusy,setBookingsBusy]=useState(false);
 const [loading,setLoading]=useState(true),[readError,setReadError]=useState<""|"failed"|"denied">(""),[loaded,setLoaded]=useState(false);
 const [draft,setDraft]=useState(initial),[correcting,setCorrecting]=useState<Entry|null>(null),[replacement,setReplacement]=useState(true),[reason,setReason]=useState("error_correction");
 const [review,setReview]=useState<FinancialCommand|null>(null),[notice,setNotice]=useState("");
 const alive=useRef(true),readTicket=useRef(0),bookingTicket=useRef(0),pageLock=useRef(false);
 const dirty=!!correcting||!!draft.amount||!!draft.private_note||!!draft.reservation_ref||!!command.pending;
 useWorkDraft(dirty,c.leave);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;readTicket.current++;bookingTicket.current++;};},[]);
 const load=useCallback(async(offset=0)=>{
  const ticket=++readTicket.current;setLoading(true);
  try{
   const value=await financialRequest<{entries:Entry[];next_offset?:number|null}>(binding,`${base}/transactions/finance/entries${offset?`?offset=${offset}`:""}`);
   if(!alive.current||ticket!==readTicket.current)return;
   setRows(old=>offset?[...old,...value.entries]:value.entries);setNextOffset(value.next_offset??null);setLoaded(true);setReadError("");
  }catch(error){if(alive.current&&ticket===readTicket.current){const denied=error instanceof Error&&["401","403","404"].includes(error.message);setReadError(denied?"denied":"failed");if(denied){setRows([]);setReservations([]);}}}
  finally{if(alive.current&&ticket===readTicket.current)setLoading(false);}
 },[base,binding]);
 const loadBookings=useCallback(async(offset=0)=>{
  if(pageLock.current)return;pageLock.current=true;setBookingsBusy(true);const ticket=++bookingTicket.current;
  try{
   const value=await financialRequest<{reservations:Reservation[]}>(binding,`${base}/transactions/reservations?offset=${offset}`);
   if(!alive.current||ticket!==bookingTicket.current)return;
   setReservations(old=>offset?[...old,...value.reservations]:value.reservations);setMoreBookings(value.reservations.length===100);setBookingError(false);
  }catch(error){if(alive.current&&ticket===bookingTicket.current){setBookingError(true);if(error instanceof Error&&["401","403","404"].includes(error.message)){setReadError("denied");setRows([]);setReservations([]);}}}
  finally{pageLock.current=false;if(alive.current&&ticket===bookingTicket.current)setBookingsBusy(false);}
 },[base,binding]);
 useEffect(()=>{
  let active=true;queueMicrotask(()=>{if(active){void load();void loadBookings();}});
  const focus=()=>void load();window.addEventListener("focus",focus);
  return()=>{active=false;window.removeEventListener("focus",focus);};
 },[load,loadBookings]);
 const stale=!!correcting&&loaded&&rows.some(row=>row.entry_ref===correcting.entry_ref&&(row.revision!==correcting.revision||row.correction_state==="corrected_original"));
 const locked=command.busy||!!command.pending;
 function set(key:string,value:string){setDraft(old=>({...old,[key]:value}));setReview(null);command.clear();}
 function reset(){setCorrecting(null);setDraft({...initial(),measure:section,category:section==="recorded_income"?"service_income":"general"});setReview(null);setNotice("");command.clear();}
 function begin(row:Entry){
  if(locked||dirty&&!window.confirm(c.leave))return;
  setCorrecting(row);setReplacement(true);setReason("error_correction");setReview(null);setNotice("");command.clear();
  setDraft({measure:row.measure,association_kind:row.association_kind,reservation_ref:row.reservation_ref??"",amount:row.amount,currency:row.currency,effective_date:row.effective_date,category:row.category,private_note:row.private_note??""});
 }
 function prepare(event:React.FormEvent){
  event.preventDefault();if(locked||stale)return;
  if((!correcting||replacement)&&draft.association_kind==="job"&&!/^RSV_[A-Za-z0-9_-]+$/.test(draft.reservation_ref)){setNotice(t.requiredJob);return;}
  let amount=draft.amount;try{if(!correcting||replacement)amount=serviceAmount(draft.amount);}catch{setNotice(c.invalid);return;}
  const association={association_kind:draft.association_kind,reservation_ref:draft.association_kind==="job"?draft.reservation_ref:null};
  const values={amount,currency:draft.currency,effective_date:draft.effective_date,category:draft.category,private_note:draft.private_note||null};
  const body=correcting?{expected_revision:correcting.revision,reason_code:reason,replacement:replacement?values:null,...(replacement?association:{})}:{measure:draft.measure,...association,...values};
  setReview({path:`${base}/transactions/finance/entries${correcting?`/${correcting.entry_ref}/corrections`:""}`,method:"POST",body:JSON.stringify(body),key:crypto.randomUUID()});setNotice("");command.clear();
 }
 async function confirm(){
  if(!command.pending&&(!review||stale||readError))return;
  const result=await command.run(command.pending??review??undefined);
  if(result!==undefined){setCorrecting(null);setDraft({...initial(),measure:section,category:section==="recorded_income"?"service_income":"general"});setReview(null);await load();}
 }
 const jobLabel=(ref:string|null)=>{const job=reservations.find(row=>row.reservation_ref===ref);return [job?.requester_name,job?.offering||job?.service_name||t.job].filter(Boolean).join(" · ");};
 const summary=(value:{measure:string;amount:string;currency:string;effective_date:string;category:string;association_kind:string;reservation_ref:string|null;private_note?:string|null})=><dl style={{margin:0,overflowWrap:"anywhere"}}>
  <dt>{t.effect}</dt><dd>{value.measure==="recorded_income"?t.income:t.expense}</dd>
  <dt>{t.amount}</dt><dd><strong>{value.amount.replace(",",".")} {value.currency}</strong></dd>
  <dt>{t.date}</dt><dd>{value.effective_date}</dd><dt>{t.category}</dt><dd>{financeCategory(value.category,locale)}</dd>
  <dt>{t.job}</dt><dd>{value.association_kind==="overhead"?t.overhead:jobLabel(value.reservation_ref)}</dd>
  {value.private_note&&<><dt>{t.note}</dt><dd>{value.private_note}</dd></>}
 </dl>;
 if(readError==="denied"||command.status==="denied")return <section className="svc-financial-panel" aria-label={t.title}><h2>{t.title}</h2><p role="alert">{c.denied}</p></section>;
 return <section className="svc-financial-panel" aria-label={t.title} style={{margin:"1.5rem 0",padding:"clamp(1rem,3vw,2rem)",border:"1px solid #deded1",background:"#fffefa",borderRadius:18}}>
  <div className="svc-planner-tabs" role="group" aria-label={t.title}>{(["recorded_income","recorded_expense"] as const).map(value=><button type="button" key={value} aria-pressed={section===value} disabled={locked} onClick={()=>{if(dirty&&!window.confirm(c.leave))return;setSection(value);setCorrecting(null);setDraft({...initial(),measure:value,category:value==="recorded_income"?"service_income":"general"});setReview(null);command.clear();}}>{value==="recorded_income"?t.income:t.expense}</button>)}</div><h2>{section==="recorded_income"?t.income:t.expense}</h2><p>{t.intro}</p>
  {loading&&<p role="status">{c.loading}</p>}
  {readError&&<p role="alert">{c.failed} <button type="button" disabled={loading} onClick={()=>void load()}>{c.retry}</button></p>}
  {(notice||command.status)&&<p role="status">{notice||(command.status?c[command.status]:"")}</p>}
  {stale&&<p role="alert">{c.stale}</p>}
  {loaded&&<>
   <form onSubmit={prepare}>
    <fieldset disabled={locked||!!review||stale} style={{border:0,padding:0,margin:0,display:"grid",gap:16,maxWidth:680}}>

     {correcting&&<><label>{t.reason}<select value={reason} onChange={e=>setReason(e.target.value)}>{financeReasonKeys.map(value=><option key={value} value={value}>{financeReason(value,locale)}</option>)}</select></label><label><input type="checkbox" checked={replacement} onChange={e=>setReplacement(e.target.checked)}/>{t.replace}</label>{!replacement&&<p>{t.reverse}</p>}</>}
     {(!correcting||replacement)&&<>
      <label>{t.job}<select value={draft.association_kind} onChange={e=>set("association_kind",e.target.value)}><option value="job">{t.job}</option>{draft.measure==="recorded_expense"&&<option value="overhead">{t.overhead}</option>}</select></label>
      {draft.association_kind==="job"&&<label>{t.selectJob}<select required value={draft.reservation_ref} onChange={e=>set("reservation_ref",e.target.value)}><option value="">{t.selectJob}</option>{draft.reservation_ref&&!reservations.some(row=>row.reservation_ref===draft.reservation_ref)&&<option value={draft.reservation_ref}>{t.job}</option>}{reservations.map(row=>row.reservation_ref&&<option key={row.reservation_ref} value={row.reservation_ref}>{jobLabel(row.reservation_ref)}{row.requested_datetime?` · ${row.requested_datetime}`:""}</option>)}</select></label>}
      {bookingError&&<p role="alert">{c.bookingsFailed} <button type="button" disabled={bookingsBusy} onClick={()=>void loadBookings()}>{c.retryBookings}</button></p>}
      {moreBookings&&<button type="button" disabled={bookingsBusy} onClick={()=>void loadBookings(reservations.length)}>{t.moreBookings}</button>}
      <label>{t.amount}<input required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" value={draft.amount} onChange={e=>set("amount",e.target.value)}/></label>
      <label>{t.currency}<select value={draft.currency} onChange={e=>set("currency",e.target.value)}><option>CDF</option><option>USD</option></select></label>
      <label>{t.date}<input required type="date" value={draft.effective_date} onChange={e=>set("effective_date",e.target.value)}/></label>
      <label>{t.category}<select value={draft.category} onChange={e=>set("category",e.target.value)}>{(draft.measure==="recorded_income"?incomeCategories:expenseCategories).map(value=><option key={value} value={value}>{financeCategory(value,locale)}</option>)}</select></label>
      <label>{t.note}<textarea maxLength={500} value={draft.private_note} onChange={e=>set("private_note",e.target.value)}/></label>
     </>}
     {!review&&<button disabled={!!readError} type="submit">{correcting?c.check:c.review}</button>}
    </fieldset>
   </form>
   {review&&<section aria-label={correcting?c.check:c.review} style={{padding:"1rem",margin:"1rem 0",background:"#f1f4e9",borderRadius:12}}>
    <h3>{correcting?c.check:c.review}</h3>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,240px),1fr))",gap:24}}>
     {correcting&&<div><h4>{c.before}</h4>{summary(correcting)}</div>}
     <div><h4>{c.after}</h4>{correcting&&!replacement?<p>{c.removed}</p>:summary(draft)}</div>
    </div>
    {correcting&&<p>{t.reason}: {financeReason(reason,locale)}</p>}
    {!command.pending&&<div style={{display:"flex",flexWrap:"wrap",gap:12,marginTop:20}}>
     <button className="svc-financial-primary" type="button" disabled={command.busy||stale||!!readError||command.status==="stale"} onClick={()=>void confirm()}>{correcting?c.confirmCorrection:c.confirm}</button>
     <button type="button" disabled={locked} onClick={()=>{setReview(null);command.clear();}}>{c.edit}</button>
    </div>}
   </section>}
   {command.pending&&<button type="button" disabled={command.busy} onClick={()=>void confirm()}>{c.retry}</button>}
   {dirty&&<button type="button" disabled={locked} onClick={()=>{if(window.confirm(c.leave))reset();}}>{t.cancel}</button>}
   <h3>{t.history}</h3><p>{c.historyNote}</p><button type="button" disabled={loading||locked} onClick={()=>void load()}>{t.refresh}</button>
   {rows.filter(row=>row.measure===section).length===0&&!readError?<p>{t.empty}</p>:<ul style={{listStyle:"none",padding:0}}>{rows.filter(row=>row.measure===section).map(row=><li key={row.entry_ref} style={{padding:"1rem 0",borderBottom:"1px solid #deded1",overflowWrap:"anywhere"}}>
    <strong>{row.measure==="recorded_income"?t.income:t.expense} · {row.direction<0?"−":"+"}{row.amount} {row.currency}</strong>
    <p>{row.effective_date} · {row.association_kind==="overhead"?t.overhead:jobLabel(row.reservation_ref)} · {financeCategory(row.category,locale)}</p>
    <p>{row.effect==="reversal"?t.reversal:row.effect==="replacement"?t.replacement:t.original}{row.correction_state==="corrected_original"?` · ${c.corrected}`:""}</p>
    <time dateTime={row.recorded_at}>{serviceTimestamp(row.recorded_at,locale)}</time>
    {row.private_note&&<p>{row.private_note}</p>}
    {row.effect==="initial"&&row.correction_state!=="corrected_original"&&<button type="button" disabled={locked||!!readError} onClick={()=>begin(row)}>{t.correction}</button>}
   </li>)}</ul>}
   {nextOffset!==null&&<button type="button" disabled={loading||locked} onClick={()=>void load(nextOffset)}>{t.more}</button>}
  </>}
 </section>;
}
