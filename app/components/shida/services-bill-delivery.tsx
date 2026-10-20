"use client";
import "./services-financial.css";
import {useCallback,useEffect,useRef,useState} from "react";
import {serviceTimestamp} from "../../lib/service-time";
import {useWorkDraft} from "../../lib/restaurant-work";
import {financialRequest,useFinancialCommand} from "../../lib/services-financial-state";
import {billReviewCopy} from "../../lib/services-bill-review-copy";
type Locale="fr"|"en"|"ln"|"sw";
type Reminder={version_ref:string;revision:number;scheduled_at:string|null;state:"off"|"scheduled"|"suppressed"|"recorded";can_enable:boolean;can_disable:boolean;status:string|null;account_notice:string|null};
const reminderCopy={"en": {"stopped": "Reminder stopped", "title": "Automatic bill reminder", "enable": "Enable one reminder", "disable": "Disable reminder", "off": "Off", "scheduled": "Scheduled", "suppressed": "No reminder needed", "recorded": "Reminder recorded in customer account", "timing": "Send the bill first. One reminder the day after it is due, at 10:00 Kinshasa time.", "basis": "Recording a receipt can stop this reminder.", "unavailable": "Send the bill before its reminder time."}, "fr": {"stopped": "Rappel arrêté", "title": "Rappel automatique de facture", "enable": "Activer un rappel", "disable": "Désactiver le rappel", "off": "Désactivé", "scheduled": "Programmé", "suppressed": "Aucun rappel nécessaire", "recorded": "Rappel enregistré dans le compte du client", "timing": "Envoyez la facture d’abord. Un rappel le lendemain de l’échéance à 10 h, heure de Kinshasa.", "basis": "Un encaissement enregistré peut arrêter ce rappel.", "unavailable": "Envoyez la facture avant l’heure du rappel."}, "ln": {"stopped": "Bokundoli etelemi", "title": "Bokundoli ya facture na ndenge ya automatique", "enable": "Fungola bokundoli moko", "disable": "Kanga bokundoli", "off": "Ekangami", "scheduled": "Etyami na manaka", "suppressed": "Bokundoli esengeli te", "recorded": "Bokundoli ebombami na compte ya client", "timing": "Tinda facture liboso. Bokundoli moko mokolo elandi échéance na 10:00, ngonga ya Kinshasa.", "basis": "Kokoma mbongo ozwi ekoki kotelemisa bokundoli.", "unavailable": "Tinda facture liboso ya ngonga ya bokundoli."}, "sw": {"stopped": "Kikumbusho kimesimamishwa", "title": "Kikumbusho cha bili kiotomatiki", "enable": "Washa kikumbusho kimoja", "disable": "Zima kikumbusho", "off": "Kimezimwa", "scheduled": "Kimepangwa", "suppressed": "Hakuna kikumbusho kinachohitajika", "recorded": "Kikumbusho kimehifadhiwa katika akaunti ya mteja", "timing": "Tuma bili kwanza. Kikumbusho kimoja siku baada ya tarehe ya malipo, saa 10:00 za Kinshasa.", "basis": "Kurekodi mapokezi kunaweza kusimamisha kikumbusho.", "unavailable": "Tuma bili kabla ya muda wa kikumbusho."}} as const;
type Delivery={version_ref:string;revision:number;status:string;attempts:number;created_at:string;can_retry:boolean};
const copy={
 en:{send:"Send bill",retry:"Retry WhatsApp notice",refresh:"Refresh delivery history",history:"Bill delivery history",recorded:"Notice recorded in customer account",pending:"WhatsApp pending",processing:"Sending to WhatsApp",sent:"Submitted to WhatsApp",delivered:"Delivered by WhatsApp",read:"Read on WhatsApp",deferred_outside_service_window:"Waiting for the customer to message SHIDA",deferred_context:"WhatsApp notification unavailable for now",retryable_failure:"WhatsApp failed; retry available",terminal_failure:"WhatsApp notification unavailable",ambiguous:"Delivery not confirmed",superseded:"This bill has changed",unresolved_recipient:"WhatsApp unavailable",failed:"Unable to complete this action. Refresh and try again.",stale:"Bill changed. Current bill reopened.",note:"Follow your bill’s delivery here.",version:"Version"},
 fr:{send:"Envoyer la facture",retry:"Réessayer la notification WhatsApp",refresh:"Actualiser les envois",history:"Historique des envois",recorded:"Avis enregistré dans le compte du client",pending:"WhatsApp en attente",processing:"Envoi vers WhatsApp",sent:"Transmis à WhatsApp",delivered:"Livré par WhatsApp",read:"Lu sur WhatsApp",deferred_outside_service_window:"En attente d’un message du client à SHIDA",deferred_context:"Notification WhatsApp indisponible pour le moment",retryable_failure:"Échec WhatsApp ; nouvel essai possible",terminal_failure:"Notification WhatsApp indisponible",ambiguous:"Livraison non confirmée",superseded:"Cette facture a changé",unresolved_recipient:"WhatsApp indisponible",failed:"Action impossible. Actualisez et réessayez.",stale:"La facture a changé. La facture actuelle est rouverte.",note:"Suivez l’envoi de votre facture ici.",version:"Version"},
 ln:{send:"Tinda facture",retry:"Meka lisusu koyebisa na WhatsApp",refresh:"Zongisa lisolo ya kotinda",history:"Lisolo ya kotinda facture",recorded:"Liyebisi ebombami na compte ya client",pending:"WhatsApp ezali kozela",processing:"Kotinda na WhatsApp",sent:"WhatsApp eyambi botindi",delivered:"WhatsApp ekomisi",read:"Etangami na WhatsApp",deferred_outside_service_window:"Kozela client atinda message na SHIDA",deferred_context:"Liyebisi ya WhatsApp ezali naino te",retryable_failure:"WhatsApp elongi te ; meka lisusu",terminal_failure:"Liyebisi ya WhatsApp ezali te",ambiguous:"Kokoma endimami naino te",superseded:"Facture oyo ebongwani",unresolved_recipient:"WhatsApp ezali te",failed:"Elongi te. Zongisa mpe meka lisusu.",stale:"Facture ebongwani. Facture ya sikawa efungwami.",note:"Landela botindi ya facture awa.",version:"Version"},
 sw:{send:"Tuma bili",retry:"Jaribu tena taarifa ya WhatsApp",refresh:"Sasisha historia ya kutuma",history:"Historia ya kutuma bili",recorded:"Taarifa imehifadhiwa katika akaunti ya mteja",pending:"WhatsApp inasubiri",processing:"Inatumwa kwa WhatsApp",sent:"Imewasilishwa kwa WhatsApp",delivered:"Imefikishwa na WhatsApp",read:"Imesomwa kwenye WhatsApp",deferred_outside_service_window:"Inasubiri mteja atume ujumbe kwa SHIDA",deferred_context:"Taarifa ya WhatsApp haipatikani kwa sasa",retryable_failure:"WhatsApp imeshindwa; jaribu tena",terminal_failure:"Taarifa ya WhatsApp haipatikani",ambiguous:"Ufikishaji haujathibitishwa",superseded:"Bili hii imebadilika",unresolved_recipient:"WhatsApp haipatikani",failed:"Hatua haikukamilika. Sasisha na ujaribu tena.",stale:"Bili imebadilika. Bili ya sasa imefunguliwa.",note:"Fuatilia utumaji wa bili yako hapa.",version:"Toleo"}
} as const;

type Props={base:string;binding:string;locale:Locale;reservationRef:string;reservationRevision:number;billRef:string;versionRef:string;revision:number;onStale:()=>Promise<void>};
export function ServicesBillDelivery(props:Props){return <DeliveryPanel key={[props.base,props.binding,props.reservationRef,props.versionRef].join(":")} {...props}/>;}
function DeliveryPanel({base,binding,locale,reservationRef,reservationRevision,billRef,versionRef,revision,onStale}:Props){
 const t=copy[locale],c=billReviewCopy[locale],rt=reminderCopy[locale],command=useFinancialCommand(binding);
 const [rows,setRows]=useState<Delivery[]>([]),[reminder,setReminder]=useState<Reminder|null>(null),[loading,setLoading]=useState(true),[loaded,setLoaded]=useState(false),[error,setError]=useState<""|"failed"|"denied">("");
 const alive=useRef(true),generation=useRef(0);
 useWorkDraft(!!command.pending,c.leave);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;};},[]);
 const load=useCallback(async()=>{
  const ticket=++generation.current;setLoading(true);
  try{
   const value=await financialRequest<{deliveries:Delivery[];reminder?:Reminder}>(binding,`${base}/transactions/bills/${billRef}/deliveries`);
   if(!alive.current||ticket!==generation.current)return;
   setRows(value.deliveries??[]);setReminder(value.reminder??null);setLoaded(true);setError("");
  }catch(failure){if(alive.current&&ticket===generation.current){const denied=failure instanceof Error&&["401","403","404"].includes(failure.message);setError(denied?"denied":"failed");if(denied){setRows([]);setReminder(null);}}}
  finally{if(alive.current&&ticket===generation.current)setLoading(false);}
 },[base,binding,billRef]);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active)void load();});const focus=()=>void load();window.addEventListener("focus",focus);return()=>{active=false;window.removeEventListener("focus",focus);};},[load]);
 useEffect(()=>{if(command.status==="stale")void onStale();},[command.status,onStale]);
 async function send(action?:"send"|"retry"|"enable"|"disable"){
  if(!command.pending&&(!action||!loaded||error))return;
  const body={version_ref:versionRef,revision,reservation_revision:reservationRevision,idempotency_key:crypto.randomUUID(),
   ...(action==="enable"||action==="disable"?{enabled:action==="enable",reminder_revision:reminder?.revision??0}:{})};
  const value=await command.run<{deliveries:Delivery[];reminder?:Reminder}>(command.pending??{
   path:`${base}/transactions/reservations/${reservationRef}/bills/${billRef}/${action==="enable"||action==="disable"?"reminder":action}`,method:"POST",body:JSON.stringify(body)});
  if(value){generation.current++;setRows(value.deliveries??[]);setReminder(value.reminder??null);setError("");setLoading(false);}
 }
 if(error==="denied"||command.status==="denied")return <section className="svc-financial-panel" aria-label={t.history}><p role="alert">{c.denied}</p></section>;
 const current=rows.find(row=>row.version_ref===versionRef),locked=command.busy||!!command.pending||!!error||!loaded||command.status==="stale";
 const deliveryText=(row:Delivery)=>t[row.status as keyof typeof t]??t.unresolved_recipient;
 return <section className="svc-financial-panel" aria-label={t.history} style={{padding:"1rem 0"}}>
  <h5>{t.history}</h5><p>{t.note}</p>
  {loading&&<p role="status">{c.loading}</p>}
  {error&&<p role="alert">{t.failed}</p>}
  {command.status&&<p role="status">{c[command.status]}</p>}
  {loaded&&<>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:16}}>
    <div><h6>{c.account}</h6><p>{current?t.recorded:c.notSent}</p></div>
    <div><h6>{c.whatsapp}</h6><p>{current?deliveryText(current):c.notSent}</p></div>
   </div>
   <div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"1rem 0"}}>
    {!current&&<button type="button" disabled={locked} onClick={()=>void send("send")}>{t.send}</button>}
    {current?.can_retry&&<button type="button" disabled={locked} onClick={()=>void send("retry")}>{t.retry}</button>}
   </div>
  </>}
  {command.pending&&<button type="button" disabled={command.busy} onClick={()=>void send()}>{c.retry}</button>}
  <button type="button" disabled={loading||command.busy} onClick={()=>{command.clear();void load();}}>{t.refresh}</button>
  {loaded&&reminder&&<section aria-label={rt.title} style={{margin:"1rem 0",padding:"1rem",background:"#f1f4e9",borderRadius:12}}>
   <h5>{rt.title}</h5><p>{rt.timing}</p><p>{rt.basis}</p>
   <p role="status">{rt[reminder.state]}{reminder.status&&` · ${reminder.status==="superseded"?rt.stopped:t[reminder.status as keyof typeof t]??t.unresolved_recipient}`}</p>
   {reminder.scheduled_at&&<p><time dateTime={reminder.scheduled_at}>{serviceTimestamp(reminder.scheduled_at,locale)}</time></p>}
   {reminder.can_enable&&<button type="button" disabled={locked} onClick={()=>void send("enable")}>{rt.enable}</button>}
   {reminder.can_disable&&<button type="button" disabled={locked} onClick={()=>void send("disable")}>{rt.disable}</button>}
   {!reminder.can_enable&&!reminder.can_disable&&reminder.state==="off"&&<p>{rt.unavailable}</p>}
  </section>}
  {rows.length>0&&<details><summary>{t.history}</summary><ul>{rows.map(row=><li key={row.version_ref}>{t.version} {row.revision} · {t.recorded} · {deliveryText(row)} · <time dateTime={row.created_at}>{serviceTimestamp(row.created_at,locale)}</time></li>)}</ul></details>}
 </section>;
}
