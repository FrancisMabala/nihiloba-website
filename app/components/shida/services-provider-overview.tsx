"use client";
import {providerCopy, type ProviderLocale, type ProviderView} from "@/app/lib/services-provider-copy";

type Offering = {public_ref:string;service_name:string;publication_origin:string;requests_enabled:boolean};
export function ServicesProviderOverview({locale,rows,capabilities,onNavigate,onCreate}:{locale:ProviderLocale;rows:Offering[];capabilities:string[];onNavigate:(view:ProviderView,kind?:"requests"|"reservations"|"messages")=>void;onCreate:()=>void}) {
 const t=providerCopy[locale],can=(key:string)=>capabilities.includes(key);
 const work=can("reservations")&&can("messages");
 const tools:{view:ProviderView;label:string;hint:string;show:boolean}[]=[
  {view:"services",label:t.services,hint:t.serviceHint,show:can("profile")},
  {view:"finance",label:t.finance,hint:t.financeHint,show:can("manual_journal")||can("basic_totals")},
  {view:"reports",label:t.reports,hint:t.reportHint,show:can("operational_reports")},
  {view:"templates",label:t.templates,hint:t.templateHint,show:can("quote_templates")||can("bill_templates")},
  {view:"settings",label:t.settings,hint:t.settingsHint,show:can("bills")}
 ];
 return <div className="svc-overview">
  {can("profile")&&(rows.length===0?<section className="svc-welcome"><span className="svc-welcome-mark" aria-hidden="true">✦</span><div><h3>{t.empty}</h3><p>{t.emptyIntro}</p><button className="svc-primary" onClick={onCreate}>{t.start} <span aria-hidden="true">→</span></button></div></section>:<section aria-label={t.setup} className="svc-summary">
   <div className="svc-summary-title"><h3>{t.setup}</h3><button onClick={()=>onNavigate("services")}>{t.manage} <span aria-hidden="true">→</span></button></div>
   <dl>{[[t.published,rows.filter(row=>row.publication_origin==="pilot").length],[t.drafts,rows.filter(row=>row.publication_origin==="unclassified").length],[t.receiving,rows.filter(row=>row.publication_origin==="pilot"&&row.requests_enabled).length]].map(([label,count])=><div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>
  </section>)}
  {work&&<div className="svc-quick-actions">{([
   ["requests",t.requests,t.requestsHint,"01"],
   ["reservations",t.bookings,t.bookingsHint,"02"],
   ["messages",t.messages,t.messagesHint,"03"]
  ] as const).map(([kind,label,hint,number])=><button key={kind} onClick={()=>onNavigate("work",kind)}><span className="svc-step" aria-hidden="true">{number}</span><strong>{label}</strong><span>{hint}</span><span className="svc-arrow" aria-hidden="true">↗</span></button>)}</div>}
  {tools.some(tool=>tool.show)&&<section className="svc-tools"><h3>{t.tools}</h3><div>{tools.filter(tool=>tool.show).map(tool=><button key={tool.view} onClick={()=>onNavigate(tool.view)}><span><strong>{tool.label}</strong><small>{tool.hint}</small></span><span aria-hidden="true">→</span></button>)}</div></section>}
 </div>;
}
