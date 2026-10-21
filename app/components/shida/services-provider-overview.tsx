"use client";
import {providerCopy, type ProviderLocale, type ProviderView} from "@/app/lib/services-provider-copy";
import {visibilityCopy} from "../../lib/services-visibility-copy";

type Offering = {public_ref:string;service_name:string;publication_origin:string;visible_to_customers?:boolean;requests_enabled:boolean};
export function ServicesProviderOverview({locale,rows,capabilities,onNavigate,onCreate}:{locale:ProviderLocale;rows:Offering[];capabilities:string[];onNavigate:(view:ProviderView,kind?:"requests"|"reservations"|"messages")=>void;onCreate:()=>void}) {
 const t=providerCopy[locale],can=(key:string)=>capabilities.includes(key);

 return <div className="svc-overview">
  {can("profile")&&(rows.length===0?<section className="svc-welcome"><span className="svc-welcome-mark" aria-hidden="true">✦</span><div><h3>{t.empty}</h3><p>{t.emptyIntro}</p><button className="svc-primary" onClick={onCreate}>{t.start} <span aria-hidden="true">→</span></button></div></section>:<section aria-label={t.setup} className="svc-summary">
   <div className="svc-summary-title"><h3>{t.setup}</h3><button onClick={()=>onNavigate("services")}>{t.manage} <span aria-hidden="true">→</span></button></div>
   <dl>{[[t.published,rows.filter(row=>row.visible_to_customers===true).length],[t.drafts,rows.filter(row=>row.publication_origin==="unclassified").length],[visibilityCopy[locale].hidden,rows.filter(row=>row.visible_to_customers!==true&&row.publication_origin!=="unclassified").length],[t.receiving,rows.filter(row=>row.visible_to_customers===true&&row.requests_enabled).length]].map(([label,count])=><div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>
  </section>)}

 </div>;
}
