"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {PersonalWhatsAppLogin} from "./personal-whatsapp-login";
import {ServiceBillStatement,type BillStatementVersion} from "./service-bill-statement";
import {restorePersonalSession,type PersonalSession} from "@/app/lib/personal-session-browser";

type Locale="fr"|"en"|"ln"|"sw";
type Version=BillStatementVersion;
const copy={
 en:{title:"My Service bill statements",signIn:"Sign in with your Personal account to view your bill.",unavailable:"No issued bill is available for this reservation.",issued:"Provider-issued Service bill",void:"Voided",due:"Due date",issue:"Issue date",history:"Issued version history",note:"This provider-issued bill does not confirm payment, delivery of the service, or receipt of the bill.",back:"Services"},
 fr:{title:"Mes relevés de frais de service",signIn:"Connectez-vous avec votre compte personnel pour voir votre relevé.",unavailable:"Aucun relevé émis n’est disponible pour cette réservation.",issued:"Relevé émis par le prestataire",void:"Annulé",due:"Date d’échéance",issue:"Date d’émission",history:"Historique des versions émises",note:"Ce relevé ne confirme ni paiement, ni réalisation du service, ni acceptation par le client.",back:"Services"},
 ln:{title:"Mikanda ya mbongo ya mosala",signIn:"Kota na compte na yo mpo na kotala mokanda.",unavailable:"Mokanda oyo ebimi ezali te mpo na réservation oyo.",issued:"Mokanda oyo mopesi mosala abimisi",void:"Elongolami",due:"Mokolo ya kofuta",issue:"Mokolo ya kobimisa",history:"Lisolo ya mikanda",note:"Mokanda oyo elakisi te ete client afuti, mosala esalemi, to client andimi.",back:"Services"},
 sw:{title:"Taarifa zangu za gharama ya huduma",signIn:"Ingia kwa akaunti yako binafsi kuona bili.",unavailable:"Hakuna taarifa iliyotolewa kwa nafasi hii.",issued:"Taarifa iliyotolewa na mtoa huduma",void:"Imebatilishwa",due:"Tarehe ya malipo",issue:"Tarehe ya kutolewa",history:"Historia ya matoleo",note:"Taarifa hii haithibitishi malipo, huduma kufanyika, au mteja kuikubali.",back:"Huduma"}
} as const;

export function PersonalServiceBill({locale,reservationRef}:{locale:Locale;reservationRef:string}){
 const t=copy[locale],[session,setSession]=useState<PersonalSession|null>(null),[loading,setLoading]=useState(true),[versions,setVersions]=useState<Version[]>([]),[selected,setSelected]=useState("");
 useEffect(()=>{let active=true;void restorePersonalSession().then(value=>{if(active)setSession(value);}).catch(()=>{if(active)setSession(null);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 useEffect(()=>{if(!session)return;let active=true;const controller=new AbortController();void fetch(`/api/shida/personal/services/transactions/customer/reservations/${encodeURIComponent(reservationRef)}/bills/`,{credentials:"include",cache:"no-store",signal:controller.signal,headers:{Accept:"application/json","X-Shida-Session":session.binding}}).then(response=>response.ok?response.json():{versions:[]}).then(value=>{if(active){const rows=(Array.isArray(value.versions)?value.versions:[]).filter((row:Version)=>row.status==="issued"||row.status==="void");setVersions(rows);setSelected(rows.at(-1)?.version_ref??"");}}).catch(()=>{if(active){setVersions([]);setSelected("");}});return()=>{active=false;controller.abort();setVersions([]);setSelected("");};},[session,reservationRef]);
 const prefix=locale==="en"?"":`/${locale}`;
 const activeVersion=versions.find(row=>row.version_ref===selected);
 return <main lang={locale} style={{maxWidth:900,margin:"auto",padding:"1rem"}}><div className="service-bill-controls"><nav><Link href={`${prefix}/shida/services`}>{t.back}</Link></nav><h1>{t.title}</h1></div>
  {loading?<p role="status">…</p>:!session?<section><p>{t.signIn}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>void restorePersonalSession().then(setSession).catch(()=>setSession(null))}/></section>:versions.length===0?<p>{t.unavailable}</p>:<><section className="service-bill-controls" aria-label={t.history}><h2>{t.history}</h2><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:"1rem"}}>{versions.map(version=><button key={version.version_ref} type="button" aria-pressed={version.version_ref===selected} onClick={()=>setSelected(version.version_ref)} style={{padding:".7rem 1rem",border:"1px solid #64748b",borderRadius:6,background:version.version_ref===selected?"#e2e8f0":"white"}}>{version.revision} · {version.status==="void"?t.void:t.issued}</button>)}</div><button type="button" onClick={()=>window.print()} style={{padding:".7rem 1rem",marginBottom:"1rem"}}>{({en:"Print selected statement",fr:"Imprimer le relevé choisi",ln:"Imprimer mokanda oyo",sw:"Chapisha taarifa iliyochaguliwa"} as const)[locale]}</button></section>{activeVersion&&<ServiceBillStatement locale={locale} version={activeVersion} current={activeVersion.version_ref===versions.at(-1)?.version_ref}/>}</>}
  <style>{`@media print { body * { visibility:hidden !important; } .service-bill-sheet,.service-bill-sheet * { visibility:visible !important; } .service-bill-sheet { position:absolute;left:0;top:0;width:100%;box-sizing:border-box;border:0 !important;box-shadow:none !important; } @page { margin:16mm; } }`}</style>
 </main>;
}
