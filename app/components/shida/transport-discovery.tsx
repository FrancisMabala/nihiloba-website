import type { Metadata } from "next";
import Link from "next/link";
import type { ServiceLocale } from "../../lib/services-i18n";
import { OFFICIAL_CHANNELS } from "../../lib/brand";
import { MarketplaceDiscoveryHeader } from "./public-marketplace";

const copy={
 en:{title:"Wewa / Transport",intro:"Start a Wewa ride request with SHIDA on WhatsApp.",action:"Find a Wewa on WhatsApp",send:"Send the prepared message to start. Opening WhatsApp alone does not create a request.",steps:["Tell SHIDA where to meet you","Describe your destination","Wait for a driver to accept"],heading:"Arrange your journey",note:"Requests depend on driver availability and acceptance. This website does not show live vehicles, fares or confirmed bookings.",history:"My Wewa trips",back:"Explore SHIDA"},
 fr:{title:"Wewa / Transport",intro:"Commencez une demande de trajet Wewa avec SHIDA sur WhatsApp.",action:"Chercher un Wewa sur WhatsApp",send:"Envoyez le message préparé pour commencer. Ouvrir WhatsApp ne crée pas de demande.",steps:["Indiquez à SHIDA votre lieu de rendez-vous","Précisez votre destination","Attendez l’acceptation d’un chauffeur"],heading:"Organisez votre trajet",note:"Les demandes dépendent des chauffeurs disponibles et de leur acceptation. Ce site n’affiche ni véhicules en direct, ni tarifs, ni réservations confirmées.",history:"Mes trajets Wewa",back:"Explorer SHIDA"},
 ln:{title:"Wewa / Transport",intro:"Senga mobembo ya Wewa na SHIDA na WhatsApp.",action:"Luka Wewa na WhatsApp",send:"Tinda nsango oyo ebongisami mpo na kobanda. Kofungola WhatsApp kaka esalaka bosengi te.",steps:["Yebisa SHIDA esika ya kokutana","Yebisa esika ozali kokende","Zela mokumbi andima"],heading:"Bongisa mobembo na yo",note:"Bosengi etaleli bakumbi oyo bazali mpe kondima na bango. Lokasa oyo elakisaka te mituka na ntango ya solo, ntalo to mobembo endimami.",history:"Mibembo na ngai ya Wewa",back:"Tala SHIDA"},
 sw:{title:"Wewa / Usafiri",intro:"Anza ombi la safari ya Wewa na SHIDA kwenye WhatsApp.",action:"Tafuta Wewa kwenye WhatsApp",send:"Tuma ujumbe ulioandaliwa ili kuanza. Kufungua WhatsApp pekee hakutengenezi ombi.",steps:["Eleza mahali pa kukutana kwa SHIDA","Eleza unakokwenda","Subiri dereva akubali"],heading:"Panga safari yako",note:"Maombi hutegemea upatikanaji na kukubali kwa dereva. Tovuti hii haionyeshi magari moja kwa moja, bei au nafasi zilizothibitishwa.",history:"Safari zangu za Wewa",back:"Gundua SHIDA"},
} as const;
function command(text:string){const url=new URL(OFFICIAL_CHANNELS.whatsapp);url.searchParams.set("text",text);return url.toString();}
export function transportMetadata(locale:ServiceLocale):Metadata {const t=copy[locale],path="/shida/transport";return {title:t.title,description:t.intro,alternates:{canonical:`${locale==="en"?"":`/${locale}`}${path}`,languages:Object.fromEntries(["en","fr","ln","sw"].map(l=>[l,`${l==="en"?"":`/${l}`}${path}`]))}};}
export function TransportDiscovery({locale}:{locale:ServiceLocale}){const t=copy[locale];return <section className="marketplace-public transport-discovery" lang={locale}><div className="container">
 <nav className="mp-topline"><Link href={`${locale==="en"?"":`/${locale}`}/shida`}>SHIDA</Link></nav>
 <MarketplaceDiscoveryHeader title={t.title} intro={t.intro}/>
 <div className="transport-request"><h2>{t.heading}</h2><a className="button button-primary" href={command("wewa")} target="_blank" rel="noopener noreferrer">{t.action} ↗</a><p>{t.send}</p><ol>{t.steps.map(step=><li key={step}>{step}</li>)}</ol><p className="mp-help">{t.note}</p></div>
 <Link className="button button-secondary" href={`${locale==="en"?"":`/${locale}`}/shida`}>{t.back}</Link>
 </div></section>;}
