import type {MarketplaceLocale} from "./marketplace-account-copy";
import {marketplaceAccountCopy} from "./marketplace-account-copy";
import "./account-space.css";
import {servicesAccountCopy} from "../../lib/services-account-navigation";
import {ServicesAccountProviderLink} from "./services-account-provider-link";
const words={
 fr:{intro:"Un seul espace pour vos achats, vos demandes et votre activité.",inbox:"Retrouvez vos échanges dans la demande ou la candidature concernée.",services:"Demandes et messages Services",jobs:"Candidatures et messages Emploi",orders:"Commandes Wenze",restaurant:"Commandes au restaurant",seller:"Vendre et proposer mes services",wenze:"Ma boutique Wenze",provider:"Mon espace prestataire",food:"Mon restaurant / Malewa",business:"Mon organisation",note:"Chaque espace vérifie votre accès. Vos conversations restent liées à leur demande."},
 en:{intro:"One space for your purchases, requests and work.",inbox:"Find your conversations in the relevant request or application.",services:"Services requests and messages",jobs:"Job applications and messages",orders:"Wenze orders",restaurant:"Restaurant orders",seller:"Sell and offer my services",wenze:"My Wenze shop",provider:"My provider workspace",food:"My restaurant / Malewa",business:"My organization",note:"Each workspace checks your access. Conversations stay linked to their request."},
 ln:{intro:"Esika moko mpo na biloko osombi, masengi mpe misala na yo.",inbox:"Tala bamesaje na lisengi to candidature oyo etali yango.",services:"Masengi mpe bamesaje ya Services",jobs:"Candidatures mpe bamesaje ya mosala",orders:"Bakomande ya Wenze",restaurant:"Bakomande ya restaurant",seller:"Teka mpe pesa misala",wenze:"Butiki na ngai ya Wenze",provider:"Esika na ngai ya misala",food:"Restaurant / Malewa na ngai",business:"Ebongiseli na ngai",note:"Esika nyonso etalaka ndingisa na yo. Bamesaje etikalaka na lisengi na yango."},
 sw:{intro:"Nafasi moja kwa ununuzi, maombi na kazi zako.",inbox:"Pata mazungumzo katika ombi husika.",services:"Maombi na ujumbe wa Huduma",jobs:"Maombi ya kazi na ujumbe",orders:"Oda za Wenze",restaurant:"Oda za mgahawa",seller:"Uza na toa huduma",wenze:"Duka langu la Wenze",provider:"Eneo langu la mtoa huduma",food:"Mgahawa / Malewa wangu",business:"Shirika langu",note:"Kila eneo linakagua ruhusa yako. Mazungumzo yanabaki kwenye ombi lake."}
};
export function AccountSpace({locale,inbox=false}:{locale:MarketplaceLocale;inbox?:boolean}){
 const s=servicesAccountCopy[locale],t=words[locale],a=marketplaceAccountCopy[locale],prefix=locale==="en"?"":`/${locale}`,bilingual=locale==="en"?"":"/fr";
 const rows=(items:[string,string][])=>items.map(([label,href])=><a key={href} href={href}><span>{label}</span><span aria-hidden="true">→</span></a>);
 return <div className="account-space" lang={locale}><p className="account-eyebrow">SHIDA / {a.space}</p><h1>{inbox?a.inbox:a.space}</h1><p>{inbox?t.inbox:t.intro}</p>
 <section id="inbox"><h2>{a.inbox}</h2><div className="account-space-links">{rows([[t.services,`${prefix}/shida/service-requests`],[t.jobs,`${bilingual}/shida/my-applications`]])}</div><p className="account-space-note">{t.note}</p></section>
 {!inbox&&<><section id="activity"><h2>{a.activity}</h2><div className="account-space-links">{rows([[s.requests,`${prefix}/shida/service-requests`],[s.bills,`${prefix}/shida/service-bills`],[t.orders,`${bilingual}/shida/wenze/orders`],[t.restaurant,`${prefix}/shida/restaurant-orders`]])}</div></section>
 <section><h2>{t.seller}</h2><div className="account-space-links">{rows([[t.wenze,`${prefix}/shida/seller/wenze`],[t.food,`${prefix}/shida/seller/restaurants`],[t.business,"https://business.nihiloba.com/"]])}<ServicesAccountProviderLink locale={locale}/></div></section></>}
 </div>;
}
