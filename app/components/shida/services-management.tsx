"use client";
import {useConfirmation} from "./confirmation-dialog";
import {ServicesProfessionalWork,type WorkSettings} from "./services-professional-work";
import {ServicesSharing} from "./services-sharing";
import {ServicesOnboardingWizard} from "./services-onboarding-wizard";
import {professionalCopy} from "../../lib/services-professional-copy";
import {MarketplaceImage} from "./marketplace-image";
import {ServicesProfessionalProfile,type ProfessionalProfile} from "./services-professional-profile";
import "./services-professional.css";
import {workText} from '../../lib/services-work-copy';
import {serviceAmount} from "../../lib/service-time";
import {personalCalendarCopy} from "../../lib/services-personal-calendar-copy";
import {visibilityCopy} from "../../lib/services-visibility-copy";
import {ServicesOpportunities} from "./services-opportunities";
import {ServicesTodayOpportunities} from "./services-today-opportunities";
import {ServicesToday,type ServiceTaskLink} from "./services-today";
import {serviceCategoryExperience} from "../../lib/services-category-experience";
import Link from "next/link";
import {catalogCopy,offerPrice,communes,type OfferTerms} from "../../lib/service-catalog";
import type {CalendarSchedule} from "./services-personal-availability";
import {workingDays} from "../../lib/services-hours-model";
import "./services-catalog-editor.css";
const ServicesCounter = lazy(() => import("./services-counter").then(module => ({default: module.ServicesCounter})));
import {ServicesCalendar} from "./services-calendar";
import {marketplaceEntryCopy} from "@/app/lib/marketplace-entry-copy";
import {ServicesTransactions} from "./services-transactions";
const ServiceFinanceWorkspace = lazy(() => import("./service-finance-workspace").then(module => ({default: module.ServiceFinanceWorkspace})));
import {type FinanceTab} from "@/app/lib/service-finance-workspace";
import {financeLabel} from "@/app/lib/service-finance-workspace-copy";
const ServicesFinancePanel = lazy(() => import("./services-finance-panel").then(module => ({default: module.ServicesFinancePanel})));
const ServicesTotalsPanel = lazy(() => import("./services-totals-panel").then(module => ({default: module.ServicesTotalsPanel})));
const ServicesReportsPanel = lazy(() => import("./services-reports-panel").then(module => ({default: module.ServicesReportsPanel})));
import {docWords} from "../../lib/service-document";
const ServicesTemplateLibrary = lazy(() => import("./services-template-library").then(module => ({default: module.ServicesTemplateLibrary})));
const ServicesBillBranding = lazy(() => import("./services-bill-branding").then(module => ({default: module.ServicesBillBranding})));
import {lazy, Suspense, useEffect, useRef, useState} from "react";
import {leaveWork, useWorkDraft} from "@/app/lib/restaurant-work";
import {providerCopy, type ProviderView} from "@/app/lib/services-provider-copy";
import {BusinessSidebar,BusinessIdentity,BusinessFullscreen} from "./connected-business-workspace";
import {connectedBusinessCopy} from "../../lib/connected-business-copy";
import {ServicesProviderNavigation} from "./services-provider-navigation";
import "./services-workday.css";
import "./services-mobile-pages.css";
import "./shida-presentation.css";
import "./services-work-pilot.css";
import {servicesMobileCopy} from "../../lib/services-mobile-copy";
import {ShareIcon} from "./services-mobile-controls";
import {ServicesPublication, workspaceCopy} from "./services-workspace-ui";
import type {WorkFilter} from "../../lib/services-work-model";

type Locale = "fr" | "en" | "ln" | "sw";
type Package = {public_ref:string;name:string;description:string|null;duration_minutes:number;price:string|null;currency:string|null};
type Review = {score:number;comment:string;created_at:string};
type Offering = {offer_terms?:OfferTerms;professional_settings?:WorkSettings;images?:{url:string;alt:string}[];professional_profile?:ProfessionalProfile;active_service_limit?:number|null;social_link?:string|null;public_ref:string;provider_ref:string;name:string;service_name:string;category:string;description:string|null;service_duration_minutes:number|null;commune:string|null;service_location_type:string|null;home_service_available:string|null;booking_mode:string|null;availability:string|null;publication_origin:string;visible_to_customers?:boolean;requests_enabled:boolean;is_active:string;revision:number;missing_fields:string[];packages:Package[];rating:{average:number|null;count:number}};
const lifecycleCopy={
 en:{archive:"Archive service",restore:"Restore service",archived:"Archived",confirm:"Archive this service? It will stop accepting new work. Existing customer history stays available.",link:"Website or social profile",saveLink:"Save link",category:"Category",active:"Active services",archivedServices:"Archived services"},
 fr:{archive:"Archiver le service",restore:"Restaurer le service",archived:"Archivé",confirm:"Archiver ce service ? Il n’acceptera plus de nouvelles prestations. L’historique client reste disponible.",link:"Site ou profil social",saveLink:"Enregistrer le lien",category:"Catégorie",active:"Services actifs",archivedServices:"Services archivés"},
 ln:{archive:"Bomba mosala na archive",restore:"Zongisa mosala",archived:"Na archive",confirm:"Kotia mosala na archive? Ekoyamba lisusu mosala ya sika te. Lisolo ya bakiliya ekotikala.",link:"Site to profil social",saveLink:"Bomba lien",category:"Lolenge",active:"Misala oyo ezali kosala",archivedServices:"Misala ya archive"},
 sw:{archive:"Weka huduma kwenye kumbukumbu",restore:"Rejesha huduma",archived:"Imehifadhiwa",confirm:"Hifadhi huduma hii? Haitapokea kazi mpya. Historia ya wateja itabaki.",link:"Tovuti au wasifu wa kijamii",saveLink:"Hifadhi kiungo",category:"Aina",active:"Huduma zinazotumika",archivedServices:"Huduma zilizohifadhiwa"}
} as const;
const words = {
en:{title:"Services management",create:"Add service",name:"Provider name",service:"Service",category:"Category",description:"Description",duration:"Duration (minutes)",area:"Service area (commune)",location:"Service location",home:"Home service",booking:"Booking mode",availability:"Availability",save:"Save",publish:"Review and publish",private:"Private draft",published:"Published",package:"Package and price",addPackage:"Save package",price:"Price",currency:"Currency",reviews:"Reviews",empty:"No services yet.",reload:"Refresh",denied:"Personal Services access is unavailable.",stale:"This service changed. Your unsaved work is kept here. Refresh to review the latest details.",failed:"Could not save. Please retry.",missing:"Complete the required fields before publishing.",yes:"Yes",no:"No",publicPlace:"Public place",privateHome:"Private location",flexible:"Provider approval",timeSlots:"Time slots",requests:"Accept new requests",archive:"Archive package",edit:"Edit package",count:"reviews"},
fr:{title:"Gestion des services",create:"Ajouter un service",name:"Nom du prestataire",service:"Service",category:"Catégorie",description:"Description",duration:"Durée (minutes)",area:"Zone de service (commune)",location:"Lieu du service",home:"Service à domicile",booking:"Mode de réservation",availability:"Disponibilités",save:"Enregistrer",publish:"Vérifier et publier",private:"Brouillon privé",published:"Publié",package:"Forfait et prix",addPackage:"Enregistrer le forfait",price:"Prix",currency:"Devise",reviews:"Avis",empty:"Aucun service pour le moment.",reload:"Actualiser",denied:"L’accès aux Services est indisponible pour votre compte personnel.",stale:"Ce service a changé. Vos modifications sont conservées ici. Actualisez pour vérifier les informations récentes.",failed:"Enregistrement impossible. Réessayez.",missing:"Complétez les champs requis avant publication.",yes:"Oui",no:"Non",publicPlace:"Lieu public",privateHome:"Lieu privé",flexible:"Accord du prestataire",timeSlots:"Créneaux",requests:"Accepter de nouvelles demandes",archive:"Archiver le forfait",edit:"Modifier le forfait",count:"avis"},
ln:{title:"Kotambwisa misala",create:"Bakisa mosala",name:"Nkombo ya mosali",service:"Mosala",category:"Lolenge",description:"Ndimbola",duration:"Ntango (miniti)",area:"Esika ya mosala (commune)",location:"Esika ya mosala",home:"Mosala na ndako",booking:"Lolenge ya kozwa rendez-vous",availability:"Ntango ya mosala",save:"Bomba",publish:"Tala mpe bimisa",private:"Ebombami",published:"Ebinisami",package:"Forfait mpe ntalo",addPackage:"Bomba forfait",price:"Ntalo",currency:"Mbongo",reviews:"Makanisi",empty:"Mosala ezali naino te.",reload:"Zongisa",denied:"Ndingisa ya Services ezali te mpo na yo moko.",stale:"Mosala oyo ebongwani. Makambo oyo obombi te ezali kaka awa. Zongisa mpo na kotala makambo ya sika.",failed:"Kobomba elongi te. Meka lisusu.",missing:"Tondisa makambo esengami liboso ya kobimisa.",yes:"Iyo",no:"Te",publicPlace:"Esika ya bato nyonso",privateHome:"Esika ya sekele",flexible:"Ndima ya mosali",timeSlots:"Bangonga",requests:"Yamba masengi ya sika",archive:"Bomba forfait",edit:"Bongisa forfait",count:"makanisi"},
sw:{title:"Usimamizi wa huduma",create:"Ongeza huduma",name:"Jina la mtoa huduma",service:"Huduma",category:"Aina",description:"Maelezo",duration:"Muda (dakika)",area:"Eneo la huduma (commune)",location:"Mahali pa huduma",home:"Huduma nyumbani",booking:"Aina ya nafasi",availability:"Upatikanaji",save:"Hifadhi",publish:"Kagua na chapisha",private:"Rasimu ya binafsi",published:"Imechapishwa",package:"Kifurushi na bei",addPackage:"Hifadhi kifurushi",price:"Bei",currency:"Sarafu",reviews:"Maoni",empty:"Hakuna huduma bado.",reload:"Sasisha",denied:"Ufikiaji wa Huduma haupatikani kwa akaunti yako binafsi.",stale:"Huduma hii imebadilika. Mabadiliko yako bado yapo hapa. Sasisha ili ukague taarifa mpya.",failed:"Imeshindikana kuhifadhi. Jaribu tena.",missing:"Jaza sehemu zinazohitajika kabla ya kuchapisha.",yes:"Ndiyo",no:"Hapana",publicPlace:"Mahali pa umma",privateHome:"Mahali pa siri",flexible:"Idhini ya mtoa huduma",timeSlots:"Vipindi vya muda",requests:"Pokea maombi mapya",archive:"Hifadhi kifurushi",edit:"Hariri kifurushi",count:"maoni"}
} as const;
const categories = ["beauty_wellness","home_housing","repair_maintenance","education_training","photo_video","professional_services","cleaning"];
const categoryLabels:Record<Locale,Record<string,string>>={
 en:{beauty_wellness:"Beauty and wellness",home_housing:"Home services",repair_maintenance:"Repairs and maintenance",education_training:"Independent tutoring",photo_video:"Photo and video",professional_services:"Advice and expertise",cleaning:"Cleaning"},
 fr:{beauty_wellness:"Beauté et bien-être",home_housing:"Services à domicile",repair_maintenance:"Réparation et entretien",education_training:"Cours particuliers",photo_video:"Photo et vidéo",professional_services:"Conseil et expertise",cleaning:"Nettoyage"},
 ln:{beauty_wellness:"Kitoko mpe bolamu",home_housing:"Misala ya ndako",repair_maintenance:"Kobongisa mpe kobatela",education_training:"Mateya ya moto moko",photo_video:"Bilili mpe video",professional_services:"Toli mpe mayele",cleaning:"Kopetola"},
 sw:{beauty_wellness:"Urembo na afya",home_housing:"Huduma za nyumbani",repair_maintenance:"Matengenezo",education_training:"Mafunzo ya kujitegemea",photo_video:"Picha na video",professional_services:"Ushauri na utaalamu",cleaning:"Usafi"}
};
function savedChoice(value:string|null,choices:readonly string[]){return value&&choices.includes(value)?value:"";}
function draftFor(current:Offering|undefined):Record<string,string>{return current?{priceMode:current.offer_terms?.pricing?.mode??"",baseAmount:current.offer_terms?.pricing?.amount??"",baseCurrency:current.offer_terms?.pricing?.currency??"CDF",
 deliveryModes:(current.offer_terms?.delivery?.modes??[...(current.service_location_type==="public_place"?["workplace"]:[]),...(current.home_service_available==="yes"?["customer"]:[])]).join(","),
 coverage:(current.offer_terms?.delivery?.communes??(communes.includes(current.commune??"")?[current.commune!]:[])).join(","),venue:current.offer_terms?.delivery?.workplace??"",name:current.name,service_name:current.service_name,category:current.category,description:current.description??"",service_duration_minutes:String(current.service_duration_minutes??""),commune:current.commune??"",service_location_type:savedChoice(current.service_location_type,["public_place","private_home"]),home_service_available:savedChoice(current.home_service_available,["yes","no"]),booking_mode:savedChoice(current.booking_mode,["flexible","time_slots"]),availability:current.availability??""}:{};}
const detailInputLimits:Record<string,number>={name:200,service_name:200,commune:200,availability:1000};
const unavailable:Record<Locale,string>={en:"This saved service is no longer available in your Personal area.",fr:"Ce service enregistré n’est plus accessible dans votre espace personnel.",ln:"Mosala oyo ebombami ezali lisusu te na esika na yo moko.",sw:"Huduma hii iliyohifadhiwa haipatikani tena katika eneo lako binafsi."};
export function ServicesManagement({binding,locale,accountName="",offeringRef=null,onUnauthorized}:{binding:string;accountName?:string;locale:string;offeringRef?:string|null;onUnauthorized?:()=>void}) {
 const lang:Locale = locale in words ? locale as Locale : "fr", t=words[lang], ui=providerCopy[lang],lc=lifecycleCopy[lang],design=workspaceCopy[lang],pro=professionalCopy[lang];
 const {request:confirmAction,confirmation}=useConfirmation(lang);
 const [view,setView]=useState<ProviderView>(offeringRef?"services":"overview"),[visited,setVisited]=useState<Set<ProviderView>>(new Set(offeringRef?["services"]:["overview"]));
 const [calendarTab,setCalendarTab]=useState<"calendar"|"hours"|"share">("calendar");
 const [workVisit,setWorkVisit]=useState(0);
 const cat=catalogCopy(lang);
 const [calendarReturn,setCalendarReturn]=useState<string|null>(null),[schedule,setSchedule]=useState<CalendarSchedule|null>(null),[scheduleError,setScheduleError]=useState(false),[fieldError,setFieldError]=useState("");
 const [calendarRefresh,setCalendarRefresh]=useState(0),[calendarBusy,setCalendarBusy]=useState(false);
 const [workRefresh,setWorkRefresh]=useState(0),[workBusy,setWorkBusy]=useState(false);
 const [opportunityEntry,setOpportunityEntry]=useState<{request:string;offering:string}|null>(null);
 const [todayVisit,setTodayVisit]=useState(0);
 const [todayTask,setTodayTask]=useState<ServiceTaskLink|null>(null);
 const [calendarBooking,setCalendarBooking]=useState<string|null>(null);
 const [initialFilter,setInitialFilter]=useState<WorkFilter>("all");
 const [publishedOnly,setPublishedOnly]=useState(false),[draftsOnly,setDraftsOnly]=useState(false);
 const [initialKind,setInitialKind]=useState<"requests"|"reservations"|"messages">("requests");
 const [loading,setLoading]=useState(true),[loadFailed,setLoadFailed]=useState(false);
 const createForm=useRef<HTMLFormElement>(null);
 const setupTrigger=useRef<HTMLButtonElement>(null);
 const [documentTab,setDocumentTab]=useState<"quote"|"bill"|"appearance">("quote");
 const [paperStyle,setPaperStyle]=useState({display_name:"",accent:"green"});
 const [shareTarget,setShareTarget]=useState<string|null>(null);
 const shareLabels={fr:["Partager mon profil","Partager ce service"],en:["Share my profile","Share this service"],ln:["Kabola profil na ngai","Kabola mosala oyo"],sw:["Shiriki wasifu wangu","Shiriki huduma hii"]}[lang];
 const [editorOpen,setEditorOpen]=useState(!!offeringRef),[editorStep,setEditorStep]=useState(1),[packageOpen,setPackageOpen]=useState(false);
 const [settingUp,setSettingUp]=useState(()=>typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("intent")==="create");
 const entry=marketplaceEntryCopy[lang],setup=entry.services;
 useEffect(()=>{const url=new URL(window.location.href);let value=url.searchParams.get("view");if(value==="reports"){value="finance";setFinanceTab("reports");}else if(value==="finance"){const tab=url.searchParams.get("tab");if(tab&&["overview","receipts","expenses","reports"].includes(tab))setFinanceTab(tab as FinanceTab);setCloseOpen(url.searchParams.get("close")==="1");}if(value==="settings"){setDocumentTab("appearance");value="templates";url.searchParams.set("view",value);url.searchParams.set("tab","appearance");window.history.replaceState(null,"",url);}else if(value==="templates"){const tab=url.searchParams.get("tab");if(tab==="appearance"||tab==="bill")setDocumentTab(tab);}if(value==="share"){setShareTarget(url.searchParams.get("service")??url.searchParams.get("offering")??offeringRef??"");value="services";url.searchParams.set("view",value);window.history.replaceState(null,"",url);}if(value&&["activity","documents","overview","available","proposals","services","calendar","work","finance","reports","templates","settings","share","counter"].includes(value)){setView(value as ProviderView);setVisited(new Set([value as ProviderView]));}},[]);
 async function navigate(next:ProviderView,kind?:"requests"|"reservations"|"messages",filter:WorkFilter="all"){
  if(next==="finance"&&view!=="counter"){setCloseOpen(false);}
  if(next==="reports"){setFinanceTab("reports");next="finance";}
  if(next==="settings"){setDocumentTab("appearance");next="templates";}
  if(next==="share"){setShareTarget("");return;}
  if(kind&&!(await leaveWork()))return;
  if(kind){setInitialFilter(filter);setTodayTask(null);setInitialKind(kind);setWorkVisit(value=>value+1);}setView(next);setVisited(old=>new Set([...old,next]));
  const url=new URL(window.location.href);url.searchParams.set("view",next);window.history.replaceState(null,"",url);window.dispatchEvent(new Event("services:location"));
 }
 const didNavigate=useRef(false);
 useEffect(()=>{if(!didNavigate.current){didNavigate.current=true;return;}document.getElementById("services-view-title")?.focus({preventScroll:true});},[view]);
 const [businesses,setBusinesses]=useState<Offering[]>([]);
 const [capabilities,setCapabilities]=useState<string[]>([]),[rows,setRows]=useState<Offering[]>([]),[selected,setSelected]=useState<string|null>(null);
 const [draft,setDraft]=useState<Record<string,string>>({}),[newDraft,setNewDraft]=useState<Record<string,string>>({}),[packageDraft,setPackageDraft]=useState<Record<string,string>>({}),[packageRef,setPackageRef]=useState<string|null>(null);
 const [financeTab,setFinanceTab]=useState<FinanceTab>("overview"),[closeOpen,setCloseOpen]=useState(false);
 const [costRef,setCostRef]=useState<string|null>(null);
 useEffect(()=>{const choose=(event:Event)=>{const ref=(event as CustomEvent<string>).detail;if(typeof ref==="string"&&/^RSV_[A-Za-z0-9_-]+$/.test(ref)){setCostRef(ref);navigate("finance");}};window.addEventListener("services:job-cost",choose);return()=>window.removeEventListener("services:job-cost",choose);},[]);
 const [showArchived,setShowArchived]=useState(false),[socialLink,setSocialLink]=useState("");
 const [pending,setPending]=useState<{path:string;method:string;body:object;key?:string}|null>(null);
 const saving=useRef(false);
 const calendarSavedFor=useRef<string|null>(null);
 const originalFields=useRef<Record<string,string>>({});
 const draftScope=useRef<{ref:string;revision:number}|null>(null);
 const [catalogStale,setCatalogStale]=useState(false);
 const [reviews,setReviews]=useState<Review[]>([]),[reviewsFailed,setReviewsFailed]=useState(false),[reviewsLoading,setReviewsLoading]=useState(false);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[blocked,setBlocked]=useState(false);
 const base="/api/shida/personal/services";
 function providerOfferings(profiles:Offering[]){
   const options=[...new Map(profiles.map(row=>[row.provider_ref,row])).values()];setBusinesses(options);
   const ref=new URLSearchParams(window.location.search).get('provider')||profiles.find(row=>row.public_ref===offeringRef)?.provider_ref||options[0]?.provider_ref;
   return ref?profiles.filter(row=>row.provider_ref===ref):profiles;
 }
 async function call(path:string,method="GET",body?:object,key?:string,signal?:AbortSignal):Promise<Record<string,unknown>>{
  const url=new URL(base+path,window.location.origin);
  if(!url.pathname.endsWith("/"))url.pathname+="/";
  const response=await fetch(url,{method,credentials:"include",cache:"no-store",signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000),headers:{Accept:"application/json","X-Shida-Session":binding,...(body?{"Content-Type":"application/json"}:{}) ,...(key?{"Idempotency-Key":key}:{})},body:body?JSON.stringify(body):undefined});
  if(!response.ok){if(response.status===401)onUnauthorized?.();if([401,403,404].includes(response.status))setBlocked(true);throw new Error(String(response.status));}
  return await response.json() as Record<string,unknown>;
 }
 async function refresh(discardDraft=false,retainLoaded=false){setLoadFailed(false);try{const [result,policy]=await Promise.all([call(""),call("/capabilities")]);if(!Array.isArray(result.profiles)||!Array.isArray(policy.capabilities))throw new Error("Invalid provider access");const next=providerOfferings(result.profiles as Offering[]);if(discardDraft){draftScope.current=null;setNewDraft({});}setCapabilities(Array.isArray(policy.capabilities)?policy.capabilities as string[]:[]);setRows(next);setSelected(old=>old&&next.some(row=>row.public_ref===old)?old:next[0]?.public_ref??null);}catch{if(!retainLoaded){setCapabilities([]);setLoadFailed(true);}setMessage(ui.loadFailed);}finally{setLoading(false);}}
 useEffect(()=>{let active=true;setRows([]);setSelected(null);setCapabilities([]);setBlocked(false);Promise.all([call(""),call("/capabilities")]).then(([result,policy])=>{if(active){if(!Array.isArray(result.profiles)||!Array.isArray(policy.capabilities))throw new Error("Invalid provider access");const next=providerOfferings(result.profiles as Offering[]);setCapabilities(Array.isArray(policy.capabilities)?policy.capabilities as string[]:[]);setRows(next);const target=offeringRef?next.find(row=>row.public_ref===offeringRef):next[0];setSelected(target?.public_ref??null);if(target)setShowArchived(target.is_active!=="yes");if(offeringRef&&!target){setEditorOpen(false);setMessage(unavailable[lang]);}}}).catch(()=>{if(active){setCapabilities([]);setLoadFailed(true);setMessage(t.denied);}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[binding,offeringRef]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{if(!["templates","work"].includes(view)||!capabilities.includes("bills"))return;
  const controller=new AbortController();
  fetch(base+"/transactions/bill-presentation",{headers:{"X-Shida-Session":binding},signal:controller.signal}).then(r=>r.ok?r.json():null).then(v=>{if(v&&!controller.signal.aborted)setPaperStyle({display_name:v.display_name||v.fallback_display_name,accent:v.accent});}).catch(()=>{});
  return ()=>controller.abort();
 },[base,binding,view,documentTab,capabilities]);
 const can=(capability:string)=>capabilities.includes(capability);
 const visibleRows=rows.filter(row=>showArchived?row.is_active!=="yes":row.is_active==="yes"&&(!publishedOnly||row.visible_to_customers===true)&&(!draftsOnly||row.visible_to_customers!==true));
 const current=rows.find(row=>row.public_ref===selected);
 useEffect(()=>{
  let active=true;setSchedule(null);setScheduleError(false);
  if(editorOpen&&current?.is_active==="yes"&&capabilities.includes("structured_availability")){
   fetch(`${base}/${current.public_ref}/schedule/`,{headers:{"X-Shida-Session":binding},cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json();})
    .then(v=>{if(active&&v.offering_ref===current.public_ref)setSchedule(v);}).catch(()=>{if(active)setScheduleError(true);});
  }
  return()=>{active=false;};
 },[base,binding,current?.public_ref,current?.revision,current?.is_active,editorOpen,capabilities]);
 const hours=schedule?.personal_calendar?.inherit_week?schedule.personal_calendar.week:schedule?.hours;
 const hoursText=workingDays.flatMap((day,i)=>{
  const name=new Intl.DateTimeFormat(lang,{weekday:"short",timeZone:"UTC"}).format(new Date(Date.UTC(2026,0,5+i)));
  return (hours??[]).filter(h=>h.day===day).map(h=>name+" · "+h.start+"–"+h.end);
 }).join(" / ");
 const profileAnchor=rows.find(row=>row.is_active==="yes")??rows[0];
 const serviceLimit=profileAnchor?.active_service_limit??5;
 const atLimit=rows.filter(row=>row.is_active==="yes").length>=serviceLimit;
 // Reviews belong to the final catalogue preview, not the daily work/calendar.
 useEffect(()=>{
  const controller=new AbortController();
  setReviews([]);setReviewsFailed(false);setReviewsLoading(false);
  if(view!=="services"||!editorOpen||editorStep!==4||current?.is_active!=="yes"||!capabilities.includes("profile"))return;
  setReviewsLoading(true);
  void call(`/${current.public_ref}/reviews?language=${lang}`,"GET",undefined,undefined,controller.signal)
   .then(value=>{if(!controller.signal.aborted&&Array.isArray(value.reviews))setReviews(value.reviews as Review[]);})
   .catch(()=>{if(!controller.signal.aborted)setReviewsFailed(true);})
   .finally(()=>{if(!controller.signal.aborted)setReviewsLoading(false);});
  return()=>controller.abort();
 },[binding,view,editorOpen,editorStep,current?.public_ref,current?.is_active,current?.revision,lang,capabilities]); // eslint-disable-line react-hooks/exhaustive-deps
 const catalogDirty=Object.values(newDraft).some(Boolean)||Object.values(packageDraft).some(Boolean)||!!current&&(JSON.stringify(draft)!==JSON.stringify(draftFor(current))||socialLink!==(current.social_link??""));
 useEffect(()=>{
  const previous=draftScope.current;
  if(previous&&current&&previous.ref===current.public_ref&&previous.revision===current.revision)return;
  if(current&&previous?.ref===current.public_ref&&calendarSavedFor.current===current.public_ref){
   calendarSavedFor.current=null;
   const original=originalFields.current,latest=draftFor(current);
   const edited=Object.entries(draft).filter(([key,value])=>original[key]!==value);
   if(edited.every(([key,value])=>latest[key]===original[key]||latest[key]===value)){
    setDraft({...latest,...Object.fromEntries(edited)});
    draftScope.current={ref:current.public_ref,revision:current.revision};
    originalFields.current=latest;
    return;
   }
  }
  if(previous&&current&&previous.ref===current.public_ref&&catalogDirty){setCatalogStale(true);return;}
  draftScope.current=current?{ref:current.public_ref,revision:current.revision}:null;
  setCatalogStale(false);setSocialLink(current?.social_link??"");setDraft(old=>!current&&Object.keys(old).length===0?old:draftFor(current));setPackageRef(null);setPackageDraft({});
 },[current,catalogDirty,draft]);
 useWorkDraft(pending!==null||(catalogDirty&&!(view==="calendar"&&calendarReturn)),ui.leave,lang);
 async function runOperation(operation:NonNullable<typeof pending>){
  if(saving.current)return false;saving.current=true;setBusy(true);setMessage("");setPending(operation);
  try{const updated=await call(operation.path,operation.method,operation.body,operation.key) as unknown as Offering;
   if(!updated.public_ref)throw new Error("502");
   if(current?.public_ref===updated.public_ref){
    draftScope.current={ref:updated.public_ref,revision:updated.revision};setCatalogStale(false);
    if(operation.path.endsWith("/details")){
     const before=draftFor(current),after=draftFor(updated),body=operation.body as Record<string,unknown>;
     const owned="pricing" in body?["priceMode","baseAmount","baseCurrency"]:"delivery" in body?["deliveryModes","coverage","venue","service_duration_minutes","booking_mode","commune","service_location_type","home_service_available"]:Object.keys(body);
     setDraft(old=>Object.fromEntries(Object.keys(after).map(k=>[k,owned.includes(k)||old[k]===before[k]?after[k]:old[k]])));
    }
    if(operation.path===`/${updated.public_ref}`&&operation.method==="PATCH")setSocialLink(updated.social_link??"");
   }else draftScope.current=null;
   setRows(old=>old.some(row=>row.public_ref===updated.public_ref)?old.map(row=>row.public_ref===updated.public_ref?updated:row):[...old,updated]);
   setSelected(updated.public_ref);setShowArchived(updated.is_active!=="yes");setPending(null);setMessage(ui.saved);
   if(!operation.path){setNewDraft({});setSettingUp(false);setEditorOpen(true);setEditorStep(2);navigate("services");}
   if((operation.path.endsWith("/professional-profile")||operation.path.endsWith("/professional-work"))){draftScope.current=null;setDraft(draftFor(updated));setSocialLink(updated.social_link??"");await refresh(true);}
   if(operation.path.includes("/packages")){setPackageRef(null);setPackageDraft({});setPackageOpen(false);}
   return true;
  }catch(error){const status=error instanceof Error?Number(error.message):0;
   if(status===409){setPending(null);await refresh();setMessage(t.stale);}
   else if(status>=400&&status<500&&status!==408){setPending(null);setMessage(status===422&&operation.path.endsWith("/details")?design.invalidDetails:t.failed);}
   else setMessage(ui.uncertain);
   return false;
  }finally{saving.current=false;setBusy(false);}
 }
 async function act(path:string,method:string,body:object,key?:string){if(pending||catalogStale||!current&&path)return false;return await runOperation({path,method,body,key});}
 const actLatest=useRef(act);useEffect(()=>{actLatest.current=act;});

 function failField(key:string){setFieldError(key);requestAnimationFrame(()=>document.getElementById("svc-field-"+key)?.focus());return false;}
 async function saveDetails(step=editorStep){
  if(!current)return false;
  let fields:Record<string,unknown>={};
  if(step===1){
   for(const key of ["service_name","category","description"])if(!draft[key]?.trim())return failField(key);
   fields={service_name:draft.service_name.trim(),category:draft.category,description:draft.description.trim()};
  }else if(step===2){
   const modes=(draft.deliveryModes||"").split(",").filter(Boolean),areas=(draft.coverage||"").split(",").filter(Boolean);
   if(!modes.length)return failField("deliveryModes");
   if(modes.includes("customer")&&!areas.length)return failField("coverage");
   const minutes=Number(draft.service_duration_minutes);
   if(!Number.isInteger(minutes)||minutes<1||minutes>1440)return failField("service_duration_minutes");
   if(!draft.booking_mode)return failField("booking_mode");
   fields={service_duration_minutes:minutes,booking_mode:draft.booking_mode,delivery:{modes,communes:modes.includes("customer")?areas:[],workplace:modes.includes("workplace")?draft.venue:""}};
  }else if(step===3){
   const mode=draft.priceMode;
   if(!mode)return failField("priceMode");
   const amount=(draft.baseAmount||"").trim().replace(/[ \u202f\u00a0]/g,"").replace(",",".");
   if(mode!=="quote"&&!/^(0|[1-9]\d{0,13})(\.\d{1,2})?$/.test(amount))return failField("baseAmount");
   fields={pricing:mode==="quote"?{mode}:{mode,amount,currency:draft.baseCurrency}};
  }else return false;
  setFieldError("");return act(`/${current.public_ref}/details`,"PATCH",{expected_revision:current.revision,...fields});
 }
 async function openHours(){
  if(!current)return;
  originalFields.current=draftFor(current);calendarSavedFor.current=null;
  setCalendarReturn(current.public_ref);setCalendarTab("hours");void navigate("calendar");
 }
 function editService(row:Offering,step:number){setSelected(row.public_ref);setEditorStep(step);setEditorOpen(true);setFieldError("");setPackageOpen(false);}
 function summary(row:Offering){return offerPrice(row.offer_terms,lang)||(row.packages[0]?.price!=null?row.packages[0].price+" "+(row.packages[0].currency??""):row.packages.length?cat.quote:cat.missingPrice);}
 function fieldMessage(key:string){return fieldError===key?<small className="svc-field-error" role="alert">{cat.required}</small>:null;}
 function set(key:string,value:string){setFieldError("");setDraft(old=>({...old,[key]:value}));}
 function input(key:string,label:string,type="text"){return <label style={{display:"grid",gap:4}}>{label}<input id={`svc-field-${key}`} required={["name","service_name"].includes(key)} type={type} min={type==="number"?1:undefined} max={type==="number"?1440:undefined} maxLength={detailInputLimits[key]} value={draft[key]??""} onChange={event=>set(key,event.target.value)} style={{width:"100%",boxSizing:"border-box",padding:"0.65rem"}} /></label>;}
 if(blocked)return <p role="alert">{t.denied}</p>;
 if(loading)return <section className="svc-loading" role="status">{ui.loading}</section>;
 if(loadFailed)return <section className="svc-loading"><p role="alert">{ui.loadFailed}</p><button onClick={()=>void refresh()}>{ui.retry}</button></section>;
 const experience=serviceCategoryExperience(draft.category,lang);
 const isSetup=rows.length===0;
 const newServiceForm=<ServicesOnboardingWizard locale={lang} accountName={accountName??""} categories={categoryLabels[lang]} call={call} onCreated={async ref=>{setNewDraft({});setSettingUp(false);await refresh(true);setSelected(ref);setEditorOpen(true);setEditorStep(2);navigate("services");}}/>;
 if(isSetup&&settingUp&&can("profile"))return <section className="container svc-onboarding-page" lang={lang}><h1 className="sr-only">{setup.title}</h1>{newServiceForm}</section>;
 if(isSetup&&view!=="counter")return <section className="rst container svc-provider-setup" lang={lang} aria-labelledby="svc-setup-title">
  <header className="svc-setup-heading"><p className="svc-setup-eyebrow">SHIDA / {ui.area}</p><h1 id="svc-setup-title">{setup.title}</h1><p>{setup.note}</p></header>
  <div className="svc-setup-card">
   <header><h2 id="svc-setup-card-title">{setup.formTitle}</h2><p>{setup.formNote}</p></header>
   {catalogStale&&<p className="svc-notice" role="status">{t.stale}</p>}{message&&(!catalogStale||message!==t.stale)&&<p className="svc-notice" role="status">{message}</p>}
   {settingUp&&can("profile")?<><fieldset className="svc-setup-fields" disabled={busy||pending!==null}>{newServiceForm}</fieldset>{pending&&!busy&&<button type="button" className="svc-primary svc-setup-retry" onClick={()=>void runOperation(pending)}>{ui.retry}</button>}</>:can("profile")?<button ref={setupTrigger} type="button" className="svc-primary svc-setup-start" onClick={()=>{setSettingUp(true);requestAnimationFrame(()=>createForm.current?.querySelector("input")?.focus());}}>{setup.create}<span aria-hidden="true"> →</span></button>:<p role="alert">{t.denied}</p>}
   <p className="svc-setup-privacy"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/></svg>{setup.privateNote}</p>
  </div>
  {!settingUp&&<p className="svc-setup-back"><Link href={`${lang==="en"?"":`/${lang}`}/shida/services`} onClick={async event=>{event.preventDefault();const href=event.currentTarget.href;if(await leaveWork())window.location.assign(href);}}><span aria-hidden="true">← </span>{entry.browse}</Link></p>}
 </section>;
 const navigation:ProviderView[]=["overview",...(can("profile")?["activity" as const]:[]),...(can("bills")&&can("manual_journal")?["documents" as const]:[]),...(can("requests_quotes")?["available" as const,"proposals" as const]:[]),...(can("reservations")&&can("messages")?["work" as const]:[]),...(can("structured_availability")?["calendar" as const]:[]),...(can("profile")?["services" as const]:[]),...(can("manual_journal")&&can("bills")?["counter" as const]:[]),...(can("manual_journal")||can("basic_totals")||can("operational_reports")?["finance" as const]:[]),...(can("quote_templates")||can("bill_templates")||can("bills")?["templates" as const]:[])];
 const documentTabs=(["quote","bill","appearance"] as const).filter(k=>can(k==="quote"?"quote_templates":k==="bill"?"bill_templates":"bills"));
 const activeDocumentTab=documentTabs.includes(documentTab)?documentTab:documentTabs[0];
 const selectedView=navigation.includes(view)?view:"overview",bc=connectedBusinessCopy[lang];
 const fieldLabels:Record<string,string>={name:t.name,service_name:t.service,category:t.category,description:t.description,service_duration_minutes:t.duration,commune:t.area,service_location_type:t.location,home_service_available:t.home,booking_mode:t.booking,availability:t.availability};
 return <section data-services-view={selectedView} aria-label={t.title} className={`svc-workspace svc-workday container seller-layout connected-workspace shida-responsive`} lang={lang}>{confirmation}
  <BusinessSidebar locale={lang} current={selectedView} identity={<BusinessIdentity name={profileAnchor?.professional_profile?.name||profileAnchor?.name||accountName} photo={profileAnchor?.professional_profile?.photo}>{businesses.length>1&&<label className="svc-provider-selector"><span className="wz-visually-hidden">{t.name}</span><select value={profileAnchor?.provider_ref??''} onChange={async e=>{const ref=e.target.value;if(!await leaveWork())return;const url=new URL(window.location.href);url.searchParams.set('provider',ref);url.searchParams.delete('offering');window.location.assign(url);}}>{businesses.map(row=><option key={row.provider_ref} value={row.provider_ref}>{row.professional_profile?.name||row.name}</option>)}</select></label>}</BusinessIdentity>}>
   <ServicesProviderNavigation identity={<BusinessIdentity name={profileAnchor?.professional_profile?.name||profileAnchor?.name||accountName} photo={profileAnchor?.professional_profile?.photo}/>} locale={lang} items={navigation} counterShortcut={profileAnchor?.professional_settings?.counter_enabled!==false} current={selectedView} onNavigate={async key=>{if(!(await leaveWork()))return false;setCalendarTab("calendar");setCalendarReturn(null);navigate(key);}}/>


  </BusinessSidebar>
  <div className="svc-content">
   <header data-heading-visibility={["overview","work","calendar","available","proposals"].includes(selectedView)?"accessible":"visible"} className={selectedView==="services"&&editorOpen?"svc-view-heading svc-catalog-editor-header":"svc-view-heading"}><div><h1 id="services-view-title" tabIndex={-1}>{selectedView==="activity"?bc.activity:["templates","documents"].includes(selectedView)?ui.finance:["available","proposals"].includes(selectedView)?bc.find:ui[selectedView as keyof typeof ui]}</h1>{selectedView!=="overview"&&!["services","activity","templates","documents"].includes(selectedView)&&<p>{selectedView==='work'?workText(lang,'intro'):ui[`${selectedView}Intro` as keyof typeof ui]}</p>}</div><div className="svc-heading-actions">{["calendar","counter"].includes(selectedView)&&<BusinessFullscreen locale={lang}/>}{!["overview","work","calendar","available","proposals"].includes(selectedView)&&<button type="button" className="svc-refresh" disabled={busy||pending!==null||(selectedView==="work"&&workBusy)||((selectedView==="calendar"||selectedView==="share")&&calendarBusy)} onClick={async ()=>{if(selectedView==="finance"){if(await leaveWork())window.dispatchEvent(new Event("services:finance-refresh"));}else if(selectedView==="calendar"||selectedView==="share")setCalendarRefresh(value=>value+1);else if(selectedView==="work")setWorkRefresh(value=>value+1);else if((await leaveWork()))void refresh(true);}}><span aria-hidden="true">↻ </span>{ui.refresh}</button>}</div></header>

   <Suspense fallback={<p role="status">{ui.loading}</p>}>
   {['available','proposals'].includes(selectedView)&&<nav className="business-local-tabs" aria-label={bc.find}>{(['available','proposals'] as const).filter(k=>navigation.includes(k)).map(k=><button key={k} aria-current={selectedView===k?'page':undefined} onClick={async()=>{if(await leaveWork())navigate(k);}}>{ui[k]}</button>)}</nav>}
   {['finance','templates','documents'].includes(selectedView)&&<nav className="business-local-tabs" aria-label={ui.finance}>{(['finance','documents','templates'] as const).filter(k=>navigation.includes(k)).map(k=><button key={k} aria-current={selectedView===k?'page':undefined} onClick={async()=>{if(await leaveWork())navigate(k);}}>{k==='finance'?bc.summary:bc[k]}</button>)}</nav>}
   {selectedView==='documents'&&<ServicesCounter base={base} binding={binding} locale={lang} offerings={rows} historyOnly onDenied={()=>setBlocked(true)}/>}
   {catalogStale&&<p className="svc-notice" role="status">{t.stale}</p>}{message&&(!catalogStale||message!==t.stale)&&<p className="svc-notice" role="status">{message}</p>}{pending&&!busy&&<button type="button" onClick={()=>void runOperation(pending)}>{ui.retry}</button>}
   {(["available","proposals"] as const).filter(key=>visited.has(key)&&can("requests_quotes")).map(key=><div key={key} hidden={selectedView!==key}><ServicesOpportunities onNavigate={navigate} base={base} binding={binding} locale={lang} services={rows} key={key==="available"?`${opportunityEntry?.offering}:${opportunityEntry?.request}`:undefined} initialRequest={key==="available"?opportunityEntry?.request:undefined} initialOffering={key==="available"?opportunityEntry?.offering:undefined} mine={key==="proposals"} onDenied={()=>{setRows([]);setCapabilities([]);setBlocked(true);}}/></div>)}
   {selectedView==="calendar"&&calendarReturn&&<button type="button" className="svc-catalog-back" onClick={async()=>{if(!await leaveWork())return;setSelected(calendarReturn);setCalendarReturn(null);setEditorOpen(true);setEditorStep(2);void navigate("services");}}>← {cat.back}</button>}
   {selectedView==="calendar"&&<ServicesCalendar refreshToken={calendarRefresh} onBusy={setCalendarBusy} key={`${selectedView}:${calendarTab}`} initialTab={calendarTab} onEditDuration={ref=>{setEditorOpen(true);setEditorStep(2);setSelected(ref);setShowArchived(false);navigate("services");requestAnimationFrame(()=>document.getElementById("svc-field-service_duration_minutes")?.focus());}} initialService={calendarReturn??offeringRef} base={base} binding={binding} locale={lang} offerings={rows} onSaved={()=>{calendarSavedFor.current=calendarReturn;void refresh();}} onOpen={ref=>{setCalendarBooking(ref);navigate("work","reservations");}} onDenied={()=>{setRows([]);setCapabilities([]);setBlocked(true);}}/>}
   {shareTarget!==null&&can("profile")&&<ServicesSharing initialRef={shareTarget} onClose={()=>setShareTarget(null)} key={binding} base={base} binding={binding} locale={lang} offerings={rows} refreshToken={calendarRefresh} onDenied={()=>{setRows([]);setCapabilities([]);setBlocked(true);}}/>}
   {selectedView==="overview"&&<ServicesToday offerings={rows} capabilities={capabilities} onNavigate={next=>{if(next==="services"){setPublishedOnly(true);setDraftsOnly(false);setShowArchived(false);setEditorOpen(false);}if(next==="calendar")setCalendarTab("calendar");navigate(next);}} onRefresh={()=>{setTodayVisit(value=>value+1);void refresh(false,true);}} base={base} binding={binding} locale={lang} onDenied={()=>{setCapabilities([]);setRows([]);setBlocked(true);}} onAll={(kind,filter)=>navigate("work",kind,filter)} onOpen={async task=>{if(!(await leaveWork()))return;setInitialFilter("all");setTodayTask(task);setInitialKind(task.kind);setCalendarBooking(null);setWorkVisit(value=>value+1);navigate("work");}}/>}
   {selectedView==="overview"&&can("requests_quotes")&&<ServicesTodayOpportunities key={`${binding}:${todayVisit}`} base={base} binding={binding} locale={lang} offerings={rows} onDenied={()=>{setCapabilities([]);setRows([]);setBlocked(true);}} onAll={offering=>{setOpportunityEntry({request:"",offering});navigate("available");}} onOpen={(request,offering)=>{setOpportunityEntry({request,offering});navigate("available");}}/>}
   {selectedView==="overview"&&can("profile")&&<button type="button" className="svc-profile-share" onClick={()=>navigate("share")}><ShareIcon/>{servicesMobileCopy(lang).share}</button>}
   {selectedView==="counter"&&<ServicesCounter base={base} binding={binding} locale={lang} offerings={rows} onDenied={()=>{setRows([]);setCapabilities([]);setBlocked(true);}}/>}
   {selectedView==="finance"&&(can("basic_totals")||can("manual_journal"))&&<ServiceFinanceWorkspace openJob={ref=>{setCalendarBooking(ref);void navigate("work","reservations","jobs");}} key={`${binding}:${financeTab}:${closeOpen}:${costRef}`} initialTab={financeTab} initialClose={closeOpen} manual={can("manual_journal")} reports={can("operational_reports")} base={base} binding={binding} locale={lang} offerings={rows} mission={costRef&&can("basic_totals")?<ServicesTotalsPanel base={base} binding={binding} locale={lang} initialReservationRef={costRef}/>:null} journal={<ServicesFinancePanel base={base} binding={binding} locale={lang}/>} counter={doc=><ServicesCounter documentRef={doc} base={base} binding={binding} locale={lang} offerings={rows} historyOnly onDenied={()=>{setRows([]);setCapabilities([]);setBlocked(true);}}/>} activity={<ServicesReportsPanel base={base} binding={binding} locale={lang} financialAllowed={false}/>} />}
   {selectedView==="counter"&&can("manual_journal")&&<button className="svc-primary" onClick={async()=>{if(await leaveWork()){setCloseOpen(true);setFinanceTab("overview");navigate("finance");}}}>{financeLabel(lang,"close")}</button>}
   {selectedView==="finance"&&can("operational_reports")&&!can("basic_totals")&&!can("manual_journal")&&<div className="svc-panel-stack"><ServicesReportsPanel base={base} binding={binding} locale={lang} financialAllowed={can("financial_reports")}/></div>}
   {selectedView==="templates"&&<div className="svc-templates"><h2>{bc.templates}</h2><p>{bc.note}</p><nav className="svc-template-tabs" aria-label={docWords(lang).tools}>{documentTabs.map(k=><button type="button" key={k} aria-pressed={k===activeDocumentTab} onClick={async()=>{if(await leaveWork()){setDocumentTab(k);const u=new URL(window.location.href);u.searchParams.set("tab",k);window.history.replaceState(null,"",u);}}}>{docWords(lang)[k==="quote"?"quotes":k==="bill"?"bills":"appearance"]}</button>)}</nav>
    {activeDocumentTab==="appearance"?<ServicesBillBranding base={base} binding={binding} locale={lang} onProfile={()=>navigate("activity")} onDenied={()=>setBlocked(true)}/>:<ServicesTemplateLibrary base={base} kind={activeDocumentTab==="bill"?"bill":"quote"} binding={binding} locale={lang} offerings={rows} issuer={paperStyle.display_name||profileAnchor?.name} accent={paperStyle.accent} onUse={()=>void navigate("work")}/>}</div>}
   {visited.has("work")&&can("reservations")&&can("messages")&&<div className="svc-panel-stack" hidden={selectedView!=="work"}><ServicesTransactions activeView={selectedView==="work"} issuer={paperStyle.display_name||profileAnchor?.name} accent={paperStyle.accent} offerings={rows} initialFilter={initialFilter} onNavigate={navigate} calendarAvailable={can("structured_availability")} quotesAvailable={rows.some(row=>row.requests_enabled)} refreshToken={workRefresh} onBusy={setWorkBusy} key={workVisit} base={base} binding={binding} locale={lang} initialKind={initialKind} initialTask={todayTask} initialReservationRef={calendarBooking} offeringRef={offeringRef} billAvailable={can("bills")} financeAvailable={can("basic_totals")} onDenied={()=>{setRows([]);setSelected(null);setReviews([]);setCapabilities([]);setBlocked(true);}}/></div>}
   {selectedView==='activity'&&<>   <section className="svc-provider-options"><h2>{pro.profileFor}</h2>
   {profileAnchor?.is_active==="yes"&&<ServicesProfessionalProfile onServices={async()=>{if(!await leaveWork())return;setEditorOpen(false);setPublishedOnly(false);setDraftsOnly(false);setShowArchived(false);void navigate("services");}} categories={categoryLabels[lang]} key={profileAnchor.provider_ref} locale={lang} profile={profileAnchor.professional_profile??{name:profileAnchor.name,bio:"",photo:null,social_link:profileAnchor.social_link??null}} providerRef={profileAnchor.provider_ref} publicAvailable={rows.some(row=>row.visible_to_customers===true)} area={[...new Set(rows.filter(row=>row.is_active==="yes").map(row=>row.commune).filter(Boolean))].join(" · ")} busy={busy||pending!==null} linkLabel={lc.link} onSave={value=>act(`/${profileAnchor.public_ref}/professional-profile`,"PATCH",{expected_revision:profileAnchor.revision,...value})}/>}
   {profileAnchor?.is_active==="yes"&&<ServicesProfessionalWork key={profileAnchor.provider_ref+String(profileAnchor.revision)} locale={lang} value={profileAnchor.professional_settings} busy={busy||pending!==null} onSave={value=>act(`/${profileAnchor.public_ref}/professional-work`,"PATCH",{expected_revision:profileAnchor.revision,professional_settings:value})}/>}
   </section>
<button type="button" onClick={()=>setShareTarget("")}>{shareLabels[0]}</button></>}
   <div hidden={selectedView!=="services"}>
  {can("profile")&&<fieldset disabled={busy||pending!==null||catalogStale} className="svc-catalog">
   {!editorOpen&&<>
   {profileAnchor&&<header className="svc-provider-identity"><div><p>{[profileAnchor.professional_settings?.workplace_name,profileAnchor.professional_settings?.city||profileAnchor.commune].filter(Boolean).join(" · ")}</p></div><span className="svc-status">{rows.filter(row=>row.is_active==="yes").length} {{fr:"services",en:"services",ln:"misala",sw:"huduma"}[lang]} {cat.of} {serviceLimit}</span><button type="button" className="svc-primary" disabled={atLimit} onClick={()=>{setSettingUp(true);requestAnimationFrame(()=>document.querySelector(".svc-add-disclosure")?.scrollIntoView({block:"start"}));}}>{t.create}</button>{atLimit&&<small>{pro.limit}</small>}{can("profile")&&<button type="button" onClick={()=>setShareTarget("")}>{shareLabels[0]}</button>}</header>}
   <div className="svc-service-list svc-professional-list"><header><label>{ui.services}<select value={showArchived?"archived":publishedOnly?"published":draftsOnly?"draft":"active"} onChange={async event=>{const selectedValue=event.target.value;if(!(await leaveWork()))return;setShowArchived(selectedValue==="archived");setPublishedOnly(selectedValue==="published");setDraftsOnly(selectedValue==="draft");}}><option value="active">{ui.allServices}</option><option value="published">{t.published}</option><option value="draft">{cat.draft}</option><option value="archived">{lc.archivedServices}</option></select></label></header>
   {visibleRows.length===0&&<p>{t.empty}</p>}{visibleRows.map(row=><article className="svc-professional-service" key={row.public_ref}><div className="svc-service-symbol"><MarketplaceImage src={row.images?.[0]?.url??null} alt={row.service_name} fallback={categoryLabels[lang][row.category]?.slice(0,1)||"S"} sizes="64px"/></div><div><h3>{row.service_name}</h3><p className="svc-service-provider">{row.professional_profile?.name||row.name}</p><p>{summary(row)}{row.service_duration_minutes?` · ${row.service_duration_minutes} min`:""}</p><small>{row.booking_mode==="time_slots"?cat.slots:cat.request}</small></div>
    <div className="svc-service-pricing"><span className="svc-status">{row.is_active!=="yes"?lc.archived:row.visible_to_customers?cat.published:cat.draft}</span><small>{row.requests_enabled?cat.accepting:cat.paused}</small></div>
    <div className="svc-row-actions"><button type="button" onClick={()=>editService(row,1)}>{cat.edit}</button><details className="svc-service-actions"><summary aria-label={`${ui.tools} · ${row.service_name}`}>•••</summary><div><button type="button" onClick={()=>editService(row,4)}>{cat.preview}</button>{row.visible_to_customers&&<button type="button" onClick={()=>setShareTarget(row.public_ref)}>{shareLabels[1]}</button>}{row.visible_to_customers&&<a href={`${lang==="en"?"":"/"+lang}/shida/services/${row.public_ref}/`}>{cat.publicLink}</a>}</div></details></div></article>)}
   {!atLimit&&settingUp&&<section className="svc-add-disclosure">{newServiceForm}</section>}
   </div></>}
   {current&&editorOpen&&<div className="svc-service-editor" key={current.public_ref}>
    <button type="button" className="svc-editor-back" onClick={async ()=>{if((await leaveWork())){setEditorOpen(false);draftScope.current=null;setDraft(draftFor(current));setPackageDraft({});setSocialLink(current.social_link??"");}}}>← {cat.list}</button>
    <header className="svc-editor-heading"><div><h2>{current.service_name}</h2><p>{current.professional_profile?.name||current.name}</p></div><span className={`svc-status ${current.is_active==="yes"&&current.visible_to_customers===true?"is-live":""}`}>{current.is_active!=="yes"?lc.archived:current.visible_to_customers===true?t.published:current.publication_origin==="pilot"?visibilityCopy[lang].hidden:current.publication_origin==="historical"?ui.history:cat.draft}</span></header>
    <nav className="svc-editor-steps" aria-label={pro.info}>{[cat.intro,cat.place,cat.prices,cat.preview].map((label,index)=><button key={label} type="button" aria-current={editorStep===index+1?"step":undefined} onClick={()=>setEditorStep(index+1)}><span>{index+1}</span>{label}</button>)}</nav>
    {catalogDirty&&<p className="svc-editor-draft" role="status">{{fr:"Modifications non enregistrées",en:"Unsaved changes",ln:"Mbongwana ebombami naino te",sw:"Mabadiliko hayajahifadhiwa"}[lang]}</p>}
    {current.is_active==="yes"&&<>
    {current.visible_to_customers===true&&<p className="svc-public-link"><Link prefetch={false} href={`${lang==="en"?"":`/${lang}`}/shida/services/${encodeURIComponent(current.public_ref)}`} onClick={async event=>{event.preventDefault();const href=event.currentTarget.href;if(await leaveWork())window.location.assign(href);}}>{cat.publicLink} ↗</Link> {can("profile")&&<button type="button" onClick={()=>setShareTarget(current.public_ref)}>{shareLabels[1]}</button>}</p>}
    <div hidden={editorStep!==4}><div className="svc-catalog-preview"><div className="svc-preview-controls">
     <ServicesPublication onField={key=>{if(key==="availability"){void openHours();return;}setEditorStep(["name","service_name","category","description"].includes(key)?1:2);requestAnimationFrame(()=>document.getElementById("svc-field-"+({commune:"coverage",home_service_available:"deliveryModes",service_location_type:"deliveryModes"}[key]??key))?.focus());}} locale={lang} missing={current.missing_fields} labels={fieldLabels} dirty={catalogDirty} published={current.visible_to_customers===true} canPublish={current.publication_origin==="unclassified"} publishLabel={cat.publish} onPublish={()=>void act(`/${current.public_ref}/pilot-review`,"PATCH",{expected_revision:current.revision})}/>
     {current.visible_to_customers&&<section className="svc-editor-card"><h3>{cat.accept}</h3><p>{cat.published} · {current.requests_enabled?cat.accepting:cat.paused}</p><button type="button" disabled={busy||catalogDirty} onClick={()=>void act(`/${current.public_ref}/request-capability`,"PATCH",{expected_revision:current.revision,enabled:!current.requests_enabled})}>{current.requests_enabled?cat.pause:cat.resume}</button></section>}
     </div><article className="svc-customer-preview"><header>{cat.customerPreview}</header><h3>{current.service_name}</h3><strong>{current.professional_profile?.name||current.name}</strong><p>{summary(current)}{current.service_duration_minutes!=null&&<> · {current.booking_mode==="flexible"?cat.estimated+" · ":""}{current.service_duration_minutes} min</>}</p><p>{current.offer_terms?.delivery?.modes.map(m=>cat[m as "workplace"|"remote"|"agreed"|"customer"]).join(" · ")} {current.offer_terms?.delivery?.workplace} · {current.offer_terms?.delivery?.communes.join(", ")||current.commune}</p>{hoursText&&<details className="svc-preview-hours"><summary>{cat.hours}</summary><p>{hoursText}</p><small>{schedule?.timezone==="Africa/Kinshasa"?{fr:"Heure de Kinshasa",en:"Kinshasa time",ln:"Ngonga ya Kinshasa",sw:"Saa za Kinshasa"}[lang]:schedule?.timezone}</small></details>}<p>{current.description}</p>
     {current.images?.map(image=><MarketplaceImage key={image.url} src={image.url} alt={image.alt} fallback={current.service_name} sizes="160px"/>)}
     {current.packages.map(p=><p key={p.public_ref}>{p.name} · {p.price===null?cat.quote:p.price+" "+p.currency} · {p.duration_minutes} min</p>)}<span className="svc-preview-action">{current.requests_enabled?current.booking_mode==="time_slots"?cat.choose:cat.send:cat.paused}</span></article></div>
</div>
    <form hidden={editorStep!==1} className="svc-editor-card svc-catalog-fields" onSubmit={async e=>{e.preventDefault();await saveDetails(1);}}>
     <label>{cat.by}<output>{current.professional_profile?.name||current.name}</output></label>
     {input("service_name",cat.name)}{fieldMessage("service_name")}
     <label>{lc.category}<select id="svc-field-category" value={draft.category??""} onChange={e=>set("category",e.target.value)}>{categories.map(v=><option key={v} value={v}>{categoryLabels[lang][v]}</option>)}</select></label>
     {experience?.description&&<small id="svc-category-help">{experience.description}</small>}<label>{t.description}<textarea id="svc-field-description" maxLength={4000} required placeholder={experience?.description} value={draft.description??""} onChange={e=>set("description",e.target.value)}/></label>{fieldMessage("description")}
     <button className="svc-primary">{busy?ui.loading:cat.save}</button></form>
    <form hidden={editorStep!==2} className="svc-editor-card svc-catalog-fields" onSubmit={async e=>{e.preventDefault();await saveDetails(2);}}>
     <fieldset id="svc-field-deliveryModes" tabIndex={-1}><legend>{cat.where}</legend>{(["workplace","customer","remote","agreed"] as const).map(m=><label key={m}><input type="checkbox" checked={draft.deliveryModes?.split(",").includes(m)??false} onChange={e=>{const modes=(draft.deliveryModes||"").split(",").filter(Boolean);set("deliveryModes",(e.target.checked?[...modes,m]:modes.filter(x=>x!==m)).join(","));}}/>{cat[m]}</label>)}</fieldset>{fieldMessage("deliveryModes")}
     {draft.deliveryModes?.includes("workplace")&&input("venue",cat.venue)}
     {draft.deliveryModes?.includes("customer")&&<details className="svc-coverage"><summary id="svc-field-coverage">{cat.areas} · {draft.coverage?.replaceAll(",",", ")||"—"}</summary><fieldset>{communes.map(c=><label key={c}><input type="checkbox" checked={draft.coverage?.split(",").includes(c)??false} onChange={e=>{const v=(draft.coverage||"").split(",").filter(Boolean);set("coverage",(e.target.checked?[...v,c]:v.filter(x=>x!==c)).join(","));}}/>{c}</label>)}</fieldset></details>}{fieldMessage("coverage")}
     <small>{cat.publicNote}</small>
     <label>{t.booking}<select required id="svc-field-booking_mode" value={draft.booking_mode??""} onChange={e=>set("booking_mode",e.target.value)}><option value="" disabled>—</option><option value="time_slots">{cat.slots}</option><option value="flexible">{cat.request}</option></select></label>
     {input("service_duration_minutes",draft.booking_mode==="flexible"?cat.estimated:cat.duration,"number")}{fieldMessage("service_duration_minutes")}
     {can("structured_availability")&&<aside className="svc-service-hours"><h3>{cat.hours}</h3>{scheduleError?<p>{t.failed}</p>:hoursText&&<p>{hoursText} · {schedule?.timezone}</p>}{schedule?.personal_calendar&&(draft.deliveryModes||"").split(",").includes("customer")&&<p>{personalCalendarCopy(lang).travel} · {schedule.personal_calendar.travel_minutes} min</p>}{schedule?.mode==="appointments"&&<p>{schedule.confirmation==="automatic"?cat.auto:cat.manual}</p>}<button type="button" onClick={()=>void openHours()}>{hoursText?cat.editHours:cat.setHours} →</button></aside>}
     <button className="svc-primary" id="svc-details-save">{busy?ui.loading:cat.save}</button></form>
    <section hidden={editorStep!==3} className="svc-editor-card svc-catalog-base"><fieldset id="svc-field-priceMode" tabIndex={-1}><legend>{cat.priceQuestion}</legend>{(["fixed","from","quote"] as const).map(mode=><label key={mode}><input type="radio" name="base-price-mode" checked={draft.priceMode===mode} onChange={()=>set("priceMode",mode)}/>{cat[mode]}</label>)}</fieldset>{fieldMessage("priceMode")}
    {draft.priceMode&&draft.priceMode!=="quote"&&<div className="svc-price-fields"><label>{t.price}<input id="svc-field-baseAmount" inputMode="decimal" value={draft.baseAmount??""} onChange={e=>set("baseAmount",e.target.value)}/></label><label>{t.currency}<select value={draft.baseCurrency||"CDF"} onChange={e=>set("baseCurrency",e.target.value)}><option>CDF</option><option>USD</option></select></label></div>}{fieldMessage("baseAmount")}
    <button className="svc-primary" type="button" onClick={async()=>{await saveDetails(3);}}>{busy?ui.loading:cat.save}</button></section>
    {can("packages")&&<section hidden={editorStep!==3} className="svc-editor-card svc-packages"><header><h3>{cat.packages}</h3></header><button type="button" onClick={()=>{setPackageRef(null);setPackageDraft({});setPackageOpen(true);}}>{cat.addPackage}</button>{current.packages.map(item=><div className="svc-package-row" key={item.public_ref}><span>{item.name} · {item.price===null?cat.quote:item.price+" "+item.currency} · {item.duration_minutes} min</span> <button onClick={()=>{setPackageOpen(true);setPackageRef(item.public_ref);setPackageDraft({name:item.name,duration_minutes:String(item.duration_minutes),price:item.price??"",currency:item.currency??"USD",description:item.description??""});}}>{t.edit}</button> <button disabled={busy} onClick={()=>void act(`/${current.public_ref}/packages/${item.public_ref}/archive`,"POST",{expected_revision:current.revision,operation_key:crypto.randomUUID()})}>{t.archive}</button></div>)}
    <p className="svc-field-hint">{pro.quoteHelp}</p>{packageOpen&&<form onSubmit={event=>{event.preventDefault();try{if(packageDraft.price?.trim())serviceAmount(packageDraft.price);}catch{setMessage(design.invalidDetails);return;}void act(`/${current.public_ref}/packages${packageRef?`/${packageRef}`:""}`,packageRef?"PATCH":"POST",{expected_revision:current.revision,operation_key:crypto.randomUUID(),name:packageDraft.name,duration_minutes:Number(packageDraft.duration_minutes),description:packageDraft.description||null,price:packageDraft.price?.trim()?serviceAmount(packageDraft.price):null,currency:packageDraft.currency||"USD"});}} className="svc-form-grid svc-package-form"><h3>{packageRef?t.edit:ui.packageNew}</h3>
     <label>{cat.packageName}<input required value={packageDraft.name??""} onChange={event=>setPackageDraft(old=>({...old,name:event.target.value}))}/></label><label>{t.duration}<input required type="number" min="1" max="1440" value={packageDraft.duration_minutes??""} onChange={event=>setPackageDraft(old=>({...old,duration_minutes:event.target.value}))}/></label><label>{t.description}<textarea maxLength={2000} value={packageDraft.description??""} onChange={event=>setPackageDraft(old=>({...old,description:event.target.value}))}/></label><label>{t.price}<input inputMode="decimal" value={packageDraft.price??""} onChange={event=>setPackageDraft(old=>({...old,price:event.target.value}))}/></label><label>{t.currency}<select value={packageDraft.currency??"USD"} onChange={event=>setPackageDraft(old=>({...old,currency:event.target.value}))}><option>CDF</option><option>USD</option></select></label><button className="svc-primary" disabled={busy}>{cat.savePackage}</button>
    <button type="button" onClick={()=>{setPackageOpen(false);setPackageRef(null);setPackageDraft({});}}>{pro.cancel}</button></form>}</section>}
    <section hidden={editorStep!==4} className="svc-editor-card svc-reviews"><h3>{t.reviews} <span className="svc-review-count">{current.rating.count}{current.rating.average!==null?` · ${current.rating.average}/5`:""}</span></h3><p>{design.reviewHelp}</p>{reviewsLoading?<p role="status">{ui.loading}</p>:reviewsFailed?<p role="status">{t.failed}</p>:reviews.length===0&&<p className="svc-empty">{ui.reviewEmpty}</p>}{reviews.map((review,index)=><blockquote key={index}>★ {review.score}/5 · {review.comment}</blockquote>)}</section>
    </>}
    <section hidden={editorStep!==4} className="svc-archive-card"><p>{design.archiveHelp}</p><button type="button" onClick={async ()=>{if(!(await leaveWork()))return;if(current.is_active==="yes"){confirmAction({title:lc.archive,description:design.archiveHelp,confirmLabel:lc.archive,severity:"warning",onConfirm:async()=>{if(!await actLatest.current(`/${current.public_ref}?expected_revision=${current.revision}`,"DELETE",{}))throw new Error("archive_failed");}});}else void act(`/${current.public_ref}/reactivate?expected_revision=${current.revision}`,"POST",{});}}>{current.is_active==="yes"?lc.archive:lc.restore}</button></section>
   </div>}
  </fieldset>}
   </div>
   </Suspense>
  </div>
 </section>;
}
