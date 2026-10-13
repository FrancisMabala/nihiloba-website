"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {PersonalWhatsAppLogin} from "./personal-whatsapp-login";
import {restorePersonalSession,type PersonalSession} from "@/app/lib/personal-session-browser";

type Locale="fr"|"en"|"ln"|"sw";
type Version={version_ref:string;bill_ref:string;revision:number;status:string;currency:string|null;total:string|null;issue_date:string|null;due_date:string|null;reason:string|null;lines:{ordinal:number;label:string;amount:string}[]};
const agreed={en:"Agreed service",fr:"Service convenu",ln:"Mosala oyo bondimaki",sw:"Huduma iliyokubaliwa"} as const;
const copy={
 en:{title:"My Service bill",signIn:"Sign in with your Personal account to view your bill.",unavailable:"No issued bill is available for this reservation.",issued:"Provider-issued Service bill",void:"Voided",due:"Due date",issue:"Issue date",history:"Issued history",note:"This provider-issued bill does not confirm payment, delivery of the service, or receipt of the bill.",back:"Services"},
 fr:{title:"Ma facture de service",signIn:"Connectez-vous avec votre compte personnel pour voir votre facture.",unavailable:"Aucune facture émise n’est disponible pour cette réservation.",issued:"Facture de service émise par le prestataire",void:"Annulée",due:"Date d’échéance",issue:"Date d’émission",history:"Historique des factures émises",note:"Cette facture émise par le prestataire ne confirme ni paiement, ni réalisation du service, ni réception de la facture.",back:"Services"},
 ln:{title:"Facture ya mosala na ngai",signIn:"Kota na compte na yo mpo na kotala facture.",unavailable:"Facture oyo ebimi ezali te mpo na réservation oyo.",issued:"Facture ya mosala oyo mopesi mosala abimisi",void:"Elongolami",due:"Mokolo ya kofuta",issue:"Mokolo ya kobimisa",history:"Lisolo ya ba facture",note:"Facture oyo elakisi te ete client afuti, mosala esalemi, to client azwi facture.",back:"Services"},
 sw:{title:"Bili yangu ya huduma",signIn:"Ingia kwa akaunti yako binafsi kuona bili.",unavailable:"Hakuna bili iliyotolewa kwa nafasi hii.",issued:"Bili ya huduma iliyotolewa na mtoa huduma",void:"Imebatilishwa",due:"Tarehe ya malipo",issue:"Tarehe ya kutolewa",history:"Historia ya bili",note:"Bili hii haithibitishi malipo, huduma kutolewa, au mteja kupokea bili.",back:"Huduma"}
} as const;

export function PersonalServiceBill({locale,reservationRef}:{locale:Locale;reservationRef:string}){
 const t=copy[locale],[session,setSession]=useState<PersonalSession|null>(null),[loading,setLoading]=useState(true),[versions,setVersions]=useState<Version[]>([]);
 useEffect(()=>{let active=true;void restorePersonalSession().then(value=>{if(active)setSession(value);}).catch(()=>{if(active)setSession(null);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 useEffect(()=>{if(!session)return;let active=true;const controller=new AbortController();void fetch(`/api/shida/personal/services/transactions/customer/reservations/${encodeURIComponent(reservationRef)}/bills`,{credentials:"include",cache:"no-store",signal:controller.signal,headers:{Accept:"application/json","X-Shida-Session":session.binding}}).then(response=>response.ok?response.json():{versions:[]}).then(value=>{if(active)setVersions(Array.isArray(value.versions)?value.versions:[]);}).catch(()=>{if(active)setVersions([]);});return()=>{active=false;controller.abort();setVersions([]);};},[session,reservationRef]);
 const prefix=locale==="en"?"":`/${locale}`;
 return <main lang={locale} style={{maxWidth:740,margin:"auto",padding:"1rem"}}><nav><Link href={`${prefix}/shida/services`}>{t.back}</Link></nav><h1>{t.title}</h1>
  {loading?<p role="status">…</p>:!session?<section><p>{t.signIn}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>void restorePersonalSession().then(setSession).catch(()=>setSession(null))}/></section>:<><p>{t.note}</p>{versions.length===0?<p>{t.unavailable}</p>:<section><h2>{t.history}</h2>{versions.map(version=><article key={version.version_ref} style={{border:"1px solid #94a3b8",borderRadius:8,padding:"1rem",margin:"1rem 0"}}><h3>{version.status==="void"?t.void:t.issued} · {version.revision}</h3><p>{version.bill_ref} · {version.total} {version.currency}</p>{version.issue_date&&<p>{t.issue}: {version.issue_date}</p>}{version.due_date&&<p>{t.due}: {version.due_date}</p>}<ul>{version.lines.map(line=><li key={line.ordinal}>{line.label==="Agreed service"?agreed[locale]:line.label} · {line.amount} {version.currency}</li>)}</ul></article>)}</section>}</>}
 </main>;
}
