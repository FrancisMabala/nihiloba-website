"use client";
import type {CSSProperties} from "react";
import "./service-bill-statement.css";

export type BillStatementVersion={version_ref:string;bill_ref:string;revision:number;status:string;currency:string|null;total:string|null;issue_date:string|null;due_date:string|null;presentation?:{identity_name?:string;display_name:string;accent:string;service_name?:string|null;package_name?:string|null};lines:{ordinal:number;label:string;amount:string}[]};
type Locale="fr"|"en"|"ln"|"sw";
const copy={
 en:{title:"Provider-issued Service bill",draft:"Draft presentation preview",void:"Voided",previous:"Replaced version — no current charge",current:"Issued version",ref:"Bill reference",version:"Version",date:"Issue date",due:"Due date",item:"Service",amount:"Amount",total:"Total",note:"Issued by the provider. This statement does not confirm payment, service delivery or customer acceptance."},
 fr:{title:"Relevé de frais de service émis par le prestataire",draft:"Aperçu du brouillon",void:"Annulé",previous:"Version remplacée — aucune somme actuellement due",current:"Version émise",ref:"Référence du relevé",version:"Version",date:"Date d’émission",due:"Date d’échéance",item:"Service",amount:"Montant",total:"Total",note:"Émis par le prestataire. Ce relevé ne confirme ni paiement, ni réalisation du service, ni acceptation par le client."},
 ln:{title:"Mokanda ya mbongo ya mosala oyo mopesi abimisi",draft:"Elilingi ya brouillon",void:"Elongolami",previous:"Mokanda ebongolami — mbongo ya kofuta sikawa te",current:"Mokanda oyo ebimi",ref:"Elembo ya mokanda",version:"Lolenge",date:"Mokolo ya kobimisa",due:"Mokolo ya kofuta",item:"Mosala",amount:"Motango",total:"Motango nyonso",note:"Mopesi mosala nde abimisi mokanda oyo. Elakisi te ete bafuti, mosala esalemi to client andimi."},
 sw:{title:"Taarifa ya gharama ya huduma iliyotolewa na mtoa huduma",draft:"Muhtasari wa rasimu",void:"Imebatilishwa",previous:"Toleo limebadilishwa — hakuna kiasi cha sasa",current:"Toleo lililotolewa",ref:"Rejea ya bili",version:"Toleo",date:"Tarehe ya kutolewa",due:"Tarehe ya mwisho",item:"Huduma",amount:"Kiasi",total:"Jumla",note:"Imetolewa na mtoa huduma. Taarifa hii haithibitishi malipo, huduma kufanyika au mteja kuikubali."}
} as const;
const colors:Record<string,string>={slate:"#334155",blue:"#1d4ed8",green:"#166534",plum:"#7e22ce"};
const provider={en:"Service provider",fr:"Prestataire de services",ln:"Mopesi mosala",sw:"Mtoa huduma"} as const;
const issuer={en:"Issued by",fr:"Émis par",ln:"Ebimisami na",sw:"Imetolewa na"} as const;
const voidNote={en:"This version is void. It creates no current charge.",fr:"Cette version est annulée. Elle ne crée aucune somme actuellement due.",ln:"Mokanda oyo elongolami. Ezali na mbongo ya kofuta sikawa te.",sw:"Toleo hili limebatilishwa. Hakuna kiasi kinachodaiwa kwa toleo hili."} as const;
const agreed={en:"Agreed service",fr:"Service convenu",ln:"Mosala oyo bondimaki",sw:"Huduma iliyokubaliwa"} as const;

export function ServiceBillStatement({version,locale,draft=false,current=true}:{version:BillStatementVersion;locale:Locale;draft?:boolean;current?:boolean}){
 const t=copy[locale],color=colors[version.presentation?.accent??""]??colors.slate;
 const displayName=version.presentation?.display_name&&version.presentation.display_name!=="Service provider"?version.presentation.display_name:provider[locale];
 return <article className="service-bill-sheet" lang={locale} style={{"--bill-accent":color,overflowWrap:"anywhere"} as CSSProperties}>
  <header className="service-bill-header"><div className="service-bill-identity"><span className="service-bill-monogram" aria-hidden="true">{displayName.slice(0,1).toLocaleUpperCase()}</span><div><strong>{displayName}</strong>{version.presentation?.identity_name&&version.presentation.identity_name!==version.presentation.display_name&&<p>{issuer[locale]}: {version.presentation.identity_name}</p>}</div></div><span className={`service-bill-state ${version.status==="void"?"is-void":""}`}>{draft?t.draft:version.status==="void"?t.void:current?t.current:t.previous}</span></header>
  <h2 className="service-bill-title">{t.title}</h2>
  {version.presentation?.service_name&&<p>{version.presentation.service_name}{version.presentation.package_name?` — ${version.presentation.package_name}`:""}</p>}
  <dl className="service-bill-meta"><div><dt>{t.ref}</dt><dd>{version.bill_ref}</dd></div><div><dt>{t.version}</dt><dd>{version.revision}</dd></div>{version.issue_date&&<div><dt>{t.date}</dt><dd>{version.issue_date}</dd></div>}{version.due_date&&<div><dt>{t.due}</dt><dd>{version.due_date}</dd></div>}</dl>
  <div className="service-bill-lines"><table><thead><tr><th scope="col">{t.item}</th><th scope="col">{t.amount}</th></tr></thead><tbody>{version.lines.map((line,index)=><tr key={line.ordinal??index}><td>{line.label==="Agreed service"?agreed[locale]:line.label}</td><td>{line.amount} {version.currency}</td></tr>)}</tbody><tfoot><tr><th scope="row">{t.total}</th><td>{version.total??"—"} <span>{version.currency}</span></td></tr></tfoot></table></div>
  {!draft&&<p className="service-bill-note">{version.status==="void"?voidNote[locale]:t.note}</p>}
 </article>;
}
