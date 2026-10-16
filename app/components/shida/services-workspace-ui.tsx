import type {ProviderLocale, ProviderView} from "@/app/lib/services-provider-copy";

export const workspaceCopy = {
 en:{publication:"Marketplace publication",ready:"Ready to publish",readyHelp:"Your saved service has all the required details. Publish it to appear in the marketplace.",draftHelp:"Your service is private. Complete and save these details to publish it.",liveHelp:"Your service is published in the marketplace.",unsaved:"Save your changes before publishing or updating request availability.",details:"Service details",detailsHelp:"Tell customers what you offer and where you work.",schedule:"Location & availability",scheduleHelp:"Help customers understand how and when you work.",complete:"Complete these details",saved:"Saved details complete",newService:"Add another service",requestsHelp:"Choose whether customers can send new requests for this service.",archiveHelp:"Archiving removes this service from discovery. Existing customer history stays available.",linkHelp:"Give customers a place to learn more about your work.",packagesHelp:"Offer clear options with a duration and price.",reviewHelp:"Feedback from customers appears here.",genericField:"Review service details"},
 fr:{publication:"Publication sur la marketplace",ready:"Prêt à publier",readyHelp:"Votre service enregistré contient les informations requises. Publiez-le pour apparaître sur la marketplace.",draftHelp:"Votre service est privé. Complétez et enregistrez ces informations pour le publier.",liveHelp:"Votre service est publié sur la marketplace.",unsaved:"Enregistrez vos modifications avant de publier ou de modifier la réception des demandes.",details:"Détails du service",detailsHelp:"Présentez votre prestation et votre zone d’activité.",schedule:"Lieu et disponibilités",scheduleHelp:"Indiquez comment et quand vous travaillez.",complete:"Informations à compléter",saved:"Informations enregistrées complètes",newService:"Ajouter un autre service",requestsHelp:"Choisissez si les clients peuvent envoyer de nouvelles demandes pour ce service.",archiveHelp:"L’archivage retire ce service de la recherche. L’historique client reste disponible.",linkHelp:"Permettez aux clients d’en savoir plus sur votre travail.",packagesHelp:"Proposez des formules claires avec une durée et un prix.",reviewHelp:"Les avis de vos clients apparaissent ici.",genericField:"Vérifier les détails du service"},
 ln:{publication:"Kobimisa na marketplace",ready:"Ebongi mpo na kobimisa",readyHelp:"Makambo esengami ya mosala ebombami. Bimisa yango mpo emonana na marketplace.",draftHelp:"Mosala na yo ebombami. Tondisa mpe bomba makambo oyo mpo na kobimisa yango.",liveHelp:"Mosala na yo ebimi na marketplace.",unsaved:"Bomba mbongwana liboso ya kobimisa to kobongola boyambi ya masengi.",details:"Makambo ya mosala",detailsHelp:"Limbola mosala na yo mpe esika osalaka.",schedule:"Esika mpe ntango",scheduleHelp:"Lakisa ndenge mpe ntango osalaka.",complete:"Makambo ya kotondisa",saved:"Makambo esengami ebombami",newService:"Bakisa mosala mosusu",requestsHelp:"Pona soki bakiliya bakoki kotinda masengi ya sika mpo na mosala oyo.",archiveHelp:"Archive elongolaka mosala na boluki. Lisolo ya bakiliya ekotikala.",linkHelp:"Pesa bakiliya esika ya koyeba mosala na yo malamu.",packagesHelp:"Pesa ba forfait na ntango mpe ntalo ya polele.",reviewHelp:"Makanisi ya bakiliya ekomonana awa.",genericField:"Tala makambo ya mosala"},
 sw:{publication:"Uchapishaji sokoni",ready:"Tayari kuchapishwa",readyHelp:"Huduma iliyohifadhiwa ina taarifa zote zinazohitajika. Ichapishe ionekane sokoni.",draftHelp:"Huduma yako ni ya binafsi. Jaza na uhifadhi taarifa hizi ili kuichapisha.",liveHelp:"Huduma yako imechapishwa sokoni.",unsaved:"Hifadhi mabadiliko kabla ya kuchapisha au kubadili upokeaji wa maombi.",details:"Taarifa za huduma",detailsHelp:"Eleza huduma unayotoa na eneo unalofanyia kazi.",schedule:"Mahali na upatikanaji",scheduleHelp:"Eleza namna na wakati unaofanya kazi.",complete:"Taarifa za kujaza",saved:"Taarifa zinazohitajika zimehifadhiwa",newService:"Ongeza huduma nyingine",requestsHelp:"Chagua kama wateja wanaweza kutuma maombi mapya ya huduma hii.",archiveHelp:"Kuhifadhi kwenye kumbukumbu huondoa huduma kwenye utafutaji. Historia ya wateja inabaki.",linkHelp:"Wape wateja mahali pa kujifunza zaidi kuhusu kazi yako.",packagesHelp:"Toa vifurushi vyenye muda na bei iliyo wazi.",reviewHelp:"Maoni ya wateja yataonekana hapa.",genericField:"Kagua taarifa za huduma"}
} as const;

const paths:Record<ProviderView,string> = {
 overview:"M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
 services:"M4 7h16v14H4z M8 7V4h8v3 M4 12h16 M10 12v3h4v-3",
 work:"M5 5h14v16H5z M9 3h6v4H9z M8 12h8 M8 16h5",
 finance:"M3 6h18v14H3z M3 9h18 M15 13h6v4h-6z M6 6V3h12",
 reports:"M4 3v18h17 M9 17v-6 M14 17V7 M19 17V4",
 templates:"M6 3h9l4 4v14H6z M15 3v5h4 M9 12h7 M9 16h7",
 settings:"M4 4h16v16H4z M8 4v16 M8 9h12 M13 13h3 M13 16h3"
};
export function ServicesIcon({name}:{name:ProviderView}){
 return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;
}

export function ServicesPublication({locale,missing,labels,dirty,published,publishLabel,onPublish}:{locale:ProviderLocale;missing:string[];labels:Record<string,string>;dirty:boolean;published:boolean;publishLabel:string;onPublish:()=>void}){
 const t=workspaceCopy[locale];
 function focusField(key:string){
  const field=document.getElementById(`svc-field-${key}`)??document.getElementById("svc-details-save");
  field?.scrollIntoView({block:"center",behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?"instant":"smooth"});field?.focus({preventScroll:true});
 }
 return <section className={`svc-publication ${published?"is-published":""}`} aria-label={t.publication}>
  <div className="svc-publication-top"><div><p className="svc-kicker">{t.publication}</p><h3>{published?t.liveHelp:missing.length?t.complete:t.ready}</h3></div>{!published&&<button type="button" className="svc-primary" aria-describedby="svc-publication-intro svc-publication-help" disabled={missing.length>0||dirty} onClick={onPublish}>{publishLabel}<span aria-hidden="true"> ↗</span></button>}</div>
  {!published&&<p id="svc-publication-intro">{missing.length?t.draftHelp:t.readyHelp}</p>}
  {missing.length>0&&<ul className="svc-completion-list">{missing.map(key=><li key={key}><button type="button" onClick={()=>focusField(key)}><span aria-hidden="true">＋</span>{labels[key]??t.genericField}<span aria-hidden="true">→</span></button></li>)}</ul>}
  <p id="svc-publication-help" className="svc-publication-help">{dirty?t.unsaved:!missing.length&&!published?t.saved:null}</p>
 </section>;
}
