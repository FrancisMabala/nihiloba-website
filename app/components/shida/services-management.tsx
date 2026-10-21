"use client";
import {serviceAmount} from "../../lib/service-time";
import {visibilityCopy} from "../../lib/services-visibility-copy";
import {ServicesOpportunities} from "./services-opportunities";
import {ServicesToday,type ServiceTaskLink} from "./services-today";
import {serviceCategoryExperience} from "../../lib/services-category-experience";
import Link from "next/link";
import {ServicesCalendar} from "./services-calendar";
import {marketplaceEntryCopy} from "@/app/lib/marketplace-entry-copy";
import {ServicesTransactions} from "./services-transactions";
import {ServicesFinancePanel} from "./services-finance-panel";
import {ServicesTotalsPanel} from "./services-totals-panel";
import {ServicesReportsPanel} from "./services-reports-panel";
import {ServicesTemplateLibrary} from "./services-template-library";
import {ServicesBillBranding} from "./services-bill-branding";
import {useEffect, useRef, useState} from "react";
import {leaveWork, useWorkDraft} from "@/app/lib/restaurant-work";
import {providerCopy, type ProviderView} from "@/app/lib/services-provider-copy";
import {workdayCopy} from "../../lib/services-workday-copy";
import {ServicesProviderNavigation} from "./services-provider-navigation";
import "./services-workday.css";
import {SellerWorkspaceIdentity} from "./seller-workspace";
import {ServicesPublication, workspaceCopy} from "./services-workspace-ui";
import {ServicesProviderOverview} from "./services-provider-overview";

type Locale = "fr" | "en" | "ln" | "sw";
type Package = {public_ref:string;name:string;description:string|null;duration_minutes:number;price:string|null;currency:string|null};
type Review = {score:number;comment:string;created_at:string};
type Offering = {social_link?:string|null;public_ref:string;provider_ref:string;name:string;service_name:string;category:string;description:string|null;service_duration_minutes:number|null;commune:string|null;service_location_type:string|null;home_service_available:string|null;booking_mode:string|null;availability:string|null;publication_origin:string;visible_to_customers?:boolean;requests_enabled:boolean;is_active:string;revision:number;missing_fields:string[];packages:Package[];rating:{average:number|null;count:number}};
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
 en:{beauty_wellness:"Beauty and wellness",home_housing:"Home services",repair_maintenance:"Repairs and maintenance",education_training:"Independent tutoring",photo_video:"Photo and video",professional_services:"Professional services",cleaning:"Cleaning"},
 fr:{beauty_wellness:"Beauté et bien-être",home_housing:"Services à domicile",repair_maintenance:"Réparation et entretien",education_training:"Cours particuliers",photo_video:"Photo et vidéo",professional_services:"Services professionnels",cleaning:"Nettoyage"},
 ln:{beauty_wellness:"Kitoko mpe bolamu",home_housing:"Misala ya ndako",repair_maintenance:"Kobongisa mpe kobatela",education_training:"Mateya ya moto moko",photo_video:"Bilili mpe video",professional_services:"Misala ya ba professionnels",cleaning:"Kopetola"},
 sw:{beauty_wellness:"Urembo na afya",home_housing:"Huduma za nyumbani",repair_maintenance:"Matengenezo",education_training:"Mafunzo ya kujitegemea",photo_video:"Picha na video",professional_services:"Huduma za kitaalamu",cleaning:"Usafi"}
};
function savedChoice(value:string|null,choices:readonly string[]){return value&&choices.includes(value)?value:"";}
function draftFor(current:Offering|undefined):Record<string,string>{return current?{name:current.name,service_name:current.service_name,category:current.category,description:current.description??"",service_duration_minutes:String(current.service_duration_minutes??""),commune:current.commune??"",service_location_type:savedChoice(current.service_location_type,["public_place","private_home"]),home_service_available:savedChoice(current.home_service_available,["yes","no"]),booking_mode:savedChoice(current.booking_mode,["flexible","time_slots"]),availability:current.availability??""}:{};}
const detailInputLimits:Record<string,number>={name:200,service_name:200,commune:200,availability:1000};
const unavailable:Record<Locale,string>={en:"This saved service is no longer available in your Personal area.",fr:"Ce service enregistré n’est plus accessible dans votre espace personnel.",ln:"Mosala oyo ebombami ezali lisusu te na esika na yo moko.",sw:"Huduma hii iliyohifadhiwa haipatikani tena katika eneo lako binafsi."};
export function ServicesManagement({binding,locale,offeringRef=null,onUnauthorized}:{binding:string;locale:string;offeringRef?:string|null;onUnauthorized?:()=>void}) {
 const lang:Locale = locale in words ? locale as Locale : "fr", t=words[lang], ui=providerCopy[lang],lc=lifecycleCopy[lang],design=workspaceCopy[lang];
 const [view,setView]=useState<ProviderView>(offeringRef?"services":"overview"),[visited,setVisited]=useState<Set<ProviderView>>(new Set(offeringRef?["services"]:["overview"]));
 const [calendarTab,setCalendarTab]=useState<"calendar"|"hours"|"share">("calendar");
 const openPlanner=(tab:"calendar"|"hours"|"share")=>{if(!leaveWork())return;setCalendarTab(tab);navigate("calendar");};
 const [workVisit,setWorkVisit]=useState(0);
 const [todayTask,setTodayTask]=useState<ServiceTaskLink|null>(null);
 const [calendarBooking,setCalendarBooking]=useState<string|null>(null);
 const [initialKind,setInitialKind]=useState<"requests"|"reservations"|"messages">("requests");
 const [loading,setLoading]=useState(true),[loadFailed,setLoadFailed]=useState(false);
 const createForm=useRef<HTMLFormElement>(null);
 const setupTrigger=useRef<HTMLButtonElement>(null);
 const [settingUp,setSettingUp]=useState(false);
 const entry=marketplaceEntryCopy[lang],setup=entry.services;
 useEffect(()=>{const value=new URLSearchParams(window.location.search).get("view");if(value&&["overview","available","proposals","services","calendar","work","finance","reports","templates","settings"].includes(value)){setView(value as ProviderView);setVisited(new Set([value as ProviderView]));}},[]);
 function navigate(next:ProviderView,kind?:"requests"|"reservations"|"messages"){
  if(kind&&!leaveWork())return;
  if(kind){setTodayTask(null);setInitialKind(kind);setWorkVisit(value=>value+1);}setView(next);setVisited(old=>new Set([...old,next]));
  const url=new URL(window.location.href);url.searchParams.set("view",next);window.history.replaceState(null,"",url);window.dispatchEvent(new Event("services:location"));
 }
 function addService(){navigate("services");requestAnimationFrame(()=>{const disclosure=createForm.current?.closest("details");if(disclosure)disclosure.open=true;createForm.current?.scrollIntoView({block:"center",behavior:"smooth"});createForm.current?.querySelector("input")?.focus();});}
 const didNavigate=useRef(false);
 useEffect(()=>{if(!didNavigate.current){didNavigate.current=true;return;}document.getElementById("services-view-title")?.focus({preventScroll:true});},[view]);
 const [capabilities,setCapabilities]=useState<string[]>([]),[rows,setRows]=useState<Offering[]>([]),[selected,setSelected]=useState<string|null>(null);
 const [draft,setDraft]=useState<Record<string,string>>({}),[newDraft,setNewDraft]=useState<Record<string,string>>({}),[packageDraft,setPackageDraft]=useState<Record<string,string>>({}),[packageRef,setPackageRef]=useState<string|null>(null);
 const [costRef,setCostRef]=useState<string|null>(null);
 useEffect(()=>{const choose=(event:Event)=>{const ref=(event as CustomEvent<string>).detail;if(typeof ref==="string"&&/^RSV_[A-Za-z0-9_-]+$/.test(ref)){setCostRef(ref);navigate("finance");}};window.addEventListener("services:job-cost",choose);return()=>window.removeEventListener("services:job-cost",choose);},[]);
 const [showArchived,setShowArchived]=useState(false),[socialLink,setSocialLink]=useState("");
 const [pending,setPending]=useState<{path:string;method:string;body:object;key?:string}|null>(null);
 const saving=useRef(false);
 const draftScope=useRef<{ref:string;revision:number}|null>(null);
 const [catalogStale,setCatalogStale]=useState(false);
 const [reviews,setReviews]=useState<Review[]>([]),[reviewsFailed,setReviewsFailed]=useState(false),[reviewsLoading,setReviewsLoading]=useState(false);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[blocked,setBlocked]=useState(false);
 const base="/api/shida/personal/services";
 async function call(path:string,method="GET",body?:object,key?:string):Promise<Record<string,unknown>>{
  const response=await fetch(base+path,{method,credentials:"include",cache:"no-store",signal:AbortSignal.timeout(20000),headers:{Accept:"application/json","X-Shida-Session":binding,...(body?{"Content-Type":"application/json"}:{}) ,...(key?{"Idempotency-Key":key}:{})},body:body?JSON.stringify(body):undefined});
  if(!response.ok){if(response.status===401)onUnauthorized?.();if([401,403,404].includes(response.status))setBlocked(true);throw new Error(String(response.status));}
  return await response.json() as Record<string,unknown>;
 }
 async function refresh(discardDraft=false){setLoadFailed(false);try{const [result,policy]=await Promise.all([call(""),call("/capabilities")]);if(!Array.isArray(result.profiles)||!Array.isArray(policy.capabilities))throw new Error("Invalid provider access");const next=result.profiles as Offering[];if(discardDraft){draftScope.current=null;setNewDraft({});}setCapabilities(Array.isArray(policy.capabilities)?policy.capabilities as string[]:[]);setRows(next);setSelected(old=>old&&next.some(row=>row.public_ref===old)?old:next[0]?.public_ref??null);}catch{setCapabilities([]);setLoadFailed(true);setMessage(t.failed);}finally{setLoading(false);}}
 useEffect(()=>{let active=true;setRows([]);setSelected(null);setCapabilities([]);setBlocked(false);Promise.all([call(""),call("/capabilities")]).then(([result,policy])=>{if(active){if(!Array.isArray(result.profiles)||!Array.isArray(policy.capabilities))throw new Error("Invalid provider access");const next=result.profiles as Offering[];setCapabilities(Array.isArray(policy.capabilities)?policy.capabilities as string[]:[]);setRows(next);const target=offeringRef?next.find(row=>row.public_ref===offeringRef):next[0];setSelected(target?.public_ref??null);if(target)setShowArchived(target.is_active!=="yes");if(offeringRef&&!target)setMessage(unavailable[lang]);}}).catch(()=>{if(active){setCapabilities([]);setLoadFailed(true);setMessage(t.denied);}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[binding,offeringRef]); // eslint-disable-line react-hooks/exhaustive-deps
 const can=(capability:string)=>capabilities.includes(capability);
 const visibleRows=rows.filter(row=>showArchived?row.is_active!=="yes":row.is_active==="yes");
 const current=rows.find(row=>row.public_ref===selected);
 useEffect(()=>{let active=true;setReviews([]);setReviewsFailed(false);setReviewsLoading(true);if(current?.is_active==="yes")void call(`/${current.public_ref}/reviews?language=${lang}`).then(value=>{if(active&&Array.isArray(value.reviews))setReviews(value.reviews as Review[]);}).catch(()=>{if(active)setReviewsFailed(true);}).finally(()=>{if(active)setReviewsLoading(false);});return()=>{active=false;};},[current?.public_ref,current?.is_active,lang]); // eslint-disable-line react-hooks/exhaustive-deps
 const catalogDirty=Object.values(newDraft).some(Boolean)||Object.values(packageDraft).some(Boolean)||!!current&&(JSON.stringify(draft)!==JSON.stringify(draftFor(current))||socialLink!==(current.social_link??""));
 useEffect(()=>{
  const previous=draftScope.current;
  if(previous&&current&&previous.ref===current.public_ref&&previous.revision===current.revision)return;
  if(previous&&current&&previous.ref===current.public_ref&&catalogDirty){setCatalogStale(true);return;}
  draftScope.current=current?{ref:current.public_ref,revision:current.revision}:null;
  setCatalogStale(false);setSocialLink(current?.social_link??"");setDraft(draftFor(current));setPackageRef(null);setPackageDraft({});
 },[current,catalogDirty]);
 useWorkDraft(pending!==null||catalogDirty,ui.leave);
 async function runOperation(operation:NonNullable<typeof pending>){
  if(saving.current)return;saving.current=true;setBusy(true);setMessage("");setPending(operation);
  try{const updated=await call(operation.path,operation.method,operation.body,operation.key) as unknown as Offering;
   if(!updated.public_ref)throw new Error("502");
   if(current?.public_ref===updated.public_ref){
    draftScope.current={ref:updated.public_ref,revision:updated.revision};setCatalogStale(false);
    if(operation.path.endsWith("/details"))setDraft(draftFor(updated));
    if(operation.path===`/${updated.public_ref}`&&operation.method==="PATCH")setSocialLink(updated.social_link??"");
   }else draftScope.current=null;
   setRows(old=>old.some(row=>row.public_ref===updated.public_ref)?old.map(row=>row.public_ref===updated.public_ref?updated:row):[...old,updated]);
   setSelected(updated.public_ref);setShowArchived(updated.is_active!=="yes");setPending(null);setMessage(ui.saved);
   if(!operation.path){setNewDraft({});setSettingUp(false);navigate("services");}
   if(operation.path.includes("/packages")){setPackageRef(null);setPackageDraft({});}
  }catch(error){const status=error instanceof Error?Number(error.message):0;
   if(status===409){setPending(null);await refresh();setMessage(t.stale);}
   else if(status>=400&&status<500&&status!==408){setPending(null);setMessage(status===422&&operation.path.endsWith("/details")?design.invalidDetails:t.failed);}
   else setMessage(ui.uncertain);
  }finally{saving.current=false;setBusy(false);}
 }
 async function act(path:string,method:string,body:object,key?:string){if(pending||catalogStale||!current&&path)return;await runOperation({path,method,body,key});}
 async function create(event:React.FormEvent){event.preventDefault();if(pending)return;await runOperation({path:"",method:"POST",body:{name:newDraft.name,service_name:newDraft.service_name,category:newDraft.category,description:""},key:crypto.randomUUID()});}
 function set(key:string,value:string){setDraft(old=>({...old,[key]:value}));}
 function input(key:string,label:string,type="text"){return <label style={{display:"grid",gap:4}}>{label}<input id={`svc-field-${key}`} required={["name","service_name"].includes(key)} type={type} min={type==="number"?1:undefined} max={type==="number"?1440:undefined} maxLength={detailInputLimits[key]} value={draft[key]??""} onChange={event=>set(key,event.target.value)} style={{width:"100%",boxSizing:"border-box",padding:"0.65rem"}} /></label>;}
 if(blocked)return <p role="alert">{t.denied}</p>;
 if(loading)return <section className="svc-loading" role="status">{ui.loading}</section>;
 if(loadFailed)return <section className="svc-loading"><p role="alert">{ui.loadFailed}</p><button onClick={()=>void refresh()}>{ui.retry}</button></section>;
 const experience=serviceCategoryExperience(draft.category,lang),newExperience=serviceCategoryExperience(newDraft.category,lang);
 const isSetup=rows.length===0;
 const newServiceForm=<form ref={createForm} onSubmit={create} className={`svc-new-service${isSetup?" svc-setup-form":""}`} aria-labelledby={isSetup?"svc-setup-card-title":undefined} aria-busy={busy}>
  {!isSetup&&<h3>{t.create}</h3>}
  <div className="svc-create-field"><label htmlFor="svc-new-provider">{isSetup?setup.providerName:t.name}</label><input id="svc-new-provider" required autoComplete="name" aria-describedby={isSetup?"svc-provider-hint":undefined} value={newDraft.name??""} onChange={event=>setNewDraft(old=>({...old,name:event.target.value}))}/>{isSetup&&<p id="svc-provider-hint" className="svc-field-hint">{setup.providerHint}</p>}</div>
  <div className="svc-create-field"><label htmlFor="svc-new-name">{isSetup?setup.serviceName:t.service}</label><input id="svc-new-name" required placeholder={newExperience?.service??(isSetup?setup.servicePlaceholder:undefined)} aria-describedby={[isSetup?"svc-service-hint":null,newExperience?"svc-new-category-help":null].filter(Boolean).join(" ")||undefined} value={newDraft.service_name??""} onChange={event=>setNewDraft(old=>({...old,service_name:event.target.value}))}/>{isSetup&&<p id="svc-service-hint" className="svc-field-hint">{setup.serviceHint}</p>}</div>
  <div className="svc-create-field"><label htmlFor="svc-new-category">{t.category}</label><select id="svc-new-category" required value={newDraft.category??""} onChange={event=>setNewDraft(old=>({...old,category:event.target.value}))}><option value="">{isSetup?setup.categoryPlaceholder:""}</option>{categories.map(value=><option value={value} key={value}>{categoryLabels[lang][value]}</option>)}</select></div>
  {newExperience&&<p id="svc-new-category-help" className="svc-field-hint" role="status">{newExperience.description}</p>}
  {isSetup?<div className="svc-setup-actions"><button type="submit" className="svc-primary" disabled={busy}>{busy?setup.saving:setup.submit}<span aria-hidden="true"> →</span></button><button type="button" className="svc-setup-cancel" onClick={()=>{if(leaveWork()){setSettingUp(false);setNewDraft({});setMessage("");requestAnimationFrame(()=>setupTrigger.current?.focus());}}}>{entry.cancel}</button></div>:<button disabled={busy}>{t.create}</button>}
 </form>;
 if(isSetup)return <section className="rst container svc-provider-setup" lang={lang} aria-labelledby="svc-setup-title">
  <header className="svc-setup-heading"><p className="svc-setup-eyebrow">SHIDA / {ui.area}</p><h1 id="svc-setup-title">{setup.title}</h1><p>{setup.note}</p></header>
  <div className="svc-setup-card">
   <header><h2 id="svc-setup-card-title">{setup.formTitle}</h2><p>{setup.formNote}</p></header>
   {catalogStale&&<p className="svc-notice" role="status">{t.stale}</p>}{message&&(!catalogStale||message!==t.stale)&&<p className="svc-notice" role="status">{message}</p>}
   {settingUp&&can("profile")?<><fieldset className="svc-setup-fields" disabled={busy||pending!==null}>{newServiceForm}</fieldset>{pending&&!busy&&<button type="button" className="svc-primary svc-setup-retry" onClick={()=>void runOperation(pending)}>{ui.retry}</button>}</>:can("profile")?<button ref={setupTrigger} type="button" className="svc-primary svc-setup-start" onClick={()=>{setSettingUp(true);requestAnimationFrame(()=>createForm.current?.querySelector("input")?.focus());}}>{setup.create}<span aria-hidden="true"> →</span></button>:<p role="alert">{t.denied}</p>}
   <p className="svc-setup-privacy"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/></svg>{setup.privateNote}</p>
  </div>
  {!settingUp&&<p className="svc-setup-back"><Link href={`${lang==="en"?"":`/${lang}`}/shida/services`} onClick={event=>{if(!leaveWork())event.preventDefault();}}><span aria-hidden="true">← </span>{entry.browse}</Link></p>}
 </section>;
 const navigation:ProviderView[]=["overview",...(can("requests_quotes")?["available" as const,"proposals" as const]:[]),...(can("reservations")&&can("messages")?["work" as const]:[]),...(can("structured_availability")?["calendar" as const]:[]),...(can("profile")?["services" as const]:[]),...(can("manual_journal")||can("basic_totals")?["finance" as const]:[]),...(can("operational_reports")?["reports" as const]:[]),...(can("quote_templates")||can("bill_templates")?["templates" as const]:[]),...(can("bills")?["settings" as const]:[])];
 const selectedView=navigation.includes(view)?view:"overview";
 const fieldLabels:Record<string,string>={name:t.name,service_name:t.service,category:t.category,description:t.description,service_duration_minutes:t.duration,commune:t.area,service_location_type:t.location,home_service_available:t.home,booking_mode:t.booking,availability:t.availability};
 return <section aria-label={t.title} className="svc-workspace svc-workday container seller-layout" lang={lang}>
  <aside className="svc-sidebar seller-sidebar"><SellerWorkspaceIdentity mark="S" title={ui.title} subtitle={ui.personal}/>
   <ServicesProviderNavigation locale={lang} items={navigation} current={selectedView} onNavigate={key=>{if(selectedView==="calendar"&&!leaveWork())return;setCalendarTab("calendar");navigate(key);}}/>
   {can("structured_availability")&&<button type="button" className="svc-sidebar-share" onClick={()=>openPlanner("share")}>{workdayCopy[lang].share} ↗</button>}

  </aside>
  <div className="svc-content">
   <header className="svc-view-heading"><div><p className="eyebrow">{rows.find(row=>row.is_active==="yes")?.name||ui.area}</p><h1 id="services-view-title" tabIndex={-1}>{ui[selectedView]}</h1>{selectedView!=="overview"&&<p>{ui[`${selectedView}Intro`]}</p>}</div><div className="svc-heading-actions">{can("structured_availability")&&<button type="button" className="svc-primary" onClick={()=>openPlanner("share")}>{workdayCopy[lang].share} ↗</button>}{selectedView!=="overview"&&<button type="button" className="svc-refresh" disabled={busy||pending!==null} onClick={()=>{if(leaveWork())void refresh(true);}}>{ui.refresh}</button>}</div></header>

   {catalogStale&&<p className="svc-notice" role="status">{t.stale}</p>}{message&&(!catalogStale||message!==t.stale)&&<p className="svc-notice" role="status">{message}</p>}{pending&&!busy&&<button type="button" onClick={()=>void runOperation(pending)}>{ui.retry}</button>}
   {(["available","proposals"] as const).filter(key=>visited.has(key)&&can("requests_quotes")).map(key=><div key={key} hidden={selectedView!==key}><ServicesOpportunities base={base} binding={binding} locale={lang} services={rows} mine={key==="proposals"} onDenied={()=>{setRows([]);setCapabilities([]);setBlocked(true);}}/></div>)}
   {selectedView==="calendar"&&<ServicesCalendar key={calendarTab} initialTab={calendarTab} onEditDuration={ref=>{setSelected(ref);setShowArchived(false);navigate("services");requestAnimationFrame(()=>document.getElementById("svc-field-service_duration_minutes")?.focus());}} initialService={offeringRef} base={base} binding={binding} locale={lang} offerings={rows} onSaved={()=>void refresh()} onOpen={ref=>{setCalendarBooking(ref);navigate("work","reservations");}} onDenied={()=>{setRows([]);setCapabilities([]);setBlocked(true);}}/>}
   {selectedView==="overview"&&can("reservations")&&can("messages")&&<ServicesToday actions={can("structured_availability")&&<div className="svc-workday-share"><div><h3>{workdayCopy[lang].shareTitle}</h3><p>{workdayCopy[lang].shareHelp}</p></div><button type="button" className="svc-primary" onClick={()=>openPlanner("share")}>{workdayCopy[lang].share} ↗</button><button type="button" onClick={()=>openPlanner("hours")}>{workdayCopy[lang].hours}</button></div>} base={base} binding={binding} locale={lang} onDenied={()=>{setCapabilities([]);setRows([]);setBlocked(true);}} onAll={kind=>navigate("work",kind)} onOpen={task=>{if(!leaveWork())return;setTodayTask(task);setInitialKind(task.kind);setCalendarBooking(null);setWorkVisit(value=>value+1);navigate("work");}}/>}
   {selectedView==="overview"&&<ServicesProviderOverview locale={lang} rows={rows.filter(row=>row.is_active==="yes")} capabilities={capabilities} onNavigate={navigate} onCreate={addService}/>}
   {visited.has("finance")&&<div className="svc-panel-stack" hidden={selectedView!=="finance"}>
    {can("basic_totals")&&<ServicesTotalsPanel key={costRef??"all"} base={base} binding={binding} locale={lang} initialReservationRef={costRef}/>}
    {can("manual_journal")&&<ServicesFinancePanel base={base} binding={binding} locale={lang}/>}
   </div>}
   {visited.has("reports")&&can("operational_reports")&&<div className="svc-panel-stack" hidden={selectedView!=="reports"}><ServicesReportsPanel base={base} binding={binding} locale={lang} financialAllowed={can("financial_reports")}/></div>}
   {visited.has("templates")&&<div className="svc-panel-stack" hidden={selectedView!=="templates"}>
    {can("quote_templates")&&<ServicesTemplateLibrary base={base} binding={binding} locale={lang} kind="quote"/>}
    {can("bill_templates")&&<ServicesTemplateLibrary base={base} binding={binding} locale={lang} kind="bill"/>}
   </div>}
   {visited.has("settings")&&can("bills")&&<div hidden={selectedView!=="settings"}><ServicesBillBranding base={base} binding={binding} locale={lang} onDenied={()=>{setRows([]);setSelected(null);setCapabilities([]);setBlocked(true);}}/></div>}
   {visited.has("work")&&can("reservations")&&can("messages")&&<div className="svc-panel-stack" hidden={selectedView!=="work"}><ServicesTransactions key={workVisit} base={base} binding={binding} locale={lang} initialKind={initialKind} initialTask={todayTask} initialReservationRef={calendarBooking} offeringRef={offeringRef} billAvailable={can("bills")} financeAvailable={can("basic_totals")} onDenied={()=>{setRows([]);setSelected(null);setReviews([]);setCapabilities([]);setBlocked(true);}}/></div>}
   <div hidden={selectedView!=="services"}>
  {can("profile")&&<fieldset disabled={busy||pending!==null||catalogStale} className="svc-catalog">
   <div className="svc-service-list"><h2>{ui.allServices}</h2><label>{ui.services}<select value={showArchived?"archived":"active"} onChange={event=>{if(!leaveWork())return;const archived=event.target.value==="archived";setShowArchived(archived);setSelected(rows.find(row=>archived?row.is_active!=="yes":row.is_active==="yes")?.public_ref??null);}}><option value="active">{lc.active}</option><option value="archived">{lc.archivedServices}</option></select></label>{visibleRows.length===0&&<p>{t.empty}</p>}{visibleRows.map(row=><button type="button" key={row.public_ref} onClick={()=>{if(leaveWork())setSelected(row.public_ref);}} aria-pressed={row.public_ref===selected} style={{display:"block",width:"100%",textAlign:"left",padding:12,marginBottom:6}}>{row.service_name}<small style={{display:"block"}}>{row.is_active!=="yes"?lc.archived:row.visible_to_customers===true?t.published:row.publication_origin==="pilot"?visibilityCopy[lang].hidden:row.publication_origin==="historical"?ui.history:t.private}</small>{row.rating.count>0&&<small>{t.reviews}: {row.rating.average??"—"}/5 · {row.rating.count}</small>}</button>)}
    <details className="svc-add-disclosure"><summary>{design.newService}<span aria-hidden="true">＋</span></summary>{newServiceForm}</details>
   </div>
   {current&&<div className="svc-service-editor" key={current.public_ref}>
    <header className="svc-editor-heading"><div><p className="svc-kicker">{categoryLabels[lang][current.category]??t.service}</p><h2>{current.service_name}</h2></div><span className={`svc-status ${current.is_active==="yes"&&current.visible_to_customers===true?"is-live":""}`}>{current.is_active!=="yes"?lc.archived:current.visible_to_customers===true?t.published:current.publication_origin==="pilot"?visibilityCopy[lang].hidden:current.publication_origin==="historical"?ui.history:t.private}</span></header>
    {current.is_active==="yes"&&<>
    <ServicesPublication locale={lang} missing={current.missing_fields} labels={fieldLabels} dirty={catalogDirty} published={current.visible_to_customers===true} canPublish={current.publication_origin==="unclassified"} publishLabel={t.publish} onPublish={()=>void act(`/${current.public_ref}/pilot-review`,"PATCH",{expected_revision:current.revision})}/>
    {current.visible_to_customers===true&&<p className="svc-public-link"><Link prefetch={false} href={`${lang==="en"?"":`/${lang}`}/shida/services/${encodeURIComponent(current.public_ref)}`} onClick={event=>{if(!leaveWork())event.preventDefault();}}>{ui.preview} ↗</Link></p>}
    <form onSubmit={event=>{event.preventDefault();const fields:Record<string,string|number>=Object.fromEntries(Object.entries(draft).filter(([,value])=>value.trim()));if(fields.service_duration_minutes)fields.service_duration_minutes=Number(fields.service_duration_minutes);if(!fields.name||!fields.service_name||!fields.category){setMessage(t.missing);return;}void act(`/${current.public_ref}/details`,"PATCH",{expected_revision:current.revision,...fields});}} className="svc-details-form">
     <section className="svc-editor-card"><header><span className="svc-section-number">01</span><div><h3>{experience?.service??design.details}</h3><p id="svc-category-help">{experience?.description??design.detailsHelp}</p></div></header><div className="svc-form-grid">
     <div>{input("name",t.name)}<p className="svc-field-hint">{visibilityCopy[lang].nameHelp}</p></div>{input("service_name",t.service)}<label>{lc.category}<select id="svc-field-category" value={draft.category??""} onChange={event=>set("category",event.target.value)}>{categories.map(value=><option value={value} key={value}>{categoryLabels[lang][value]}</option>)}</select></label><label className="svc-wide-field">{t.description}<textarea aria-describedby="svc-category-help" id="svc-field-description" maxLength={4000} rows={4} value={draft.description??""} onChange={event=>set("description",event.target.value)}/></label></div></section><section className="svc-editor-card"><header><span className="svc-section-number">02</span><div><h3>{design.schedule}</h3><p>{design.scheduleHelp}</p></div></header><div className="svc-form-grid">{input("service_duration_minutes",t.duration,"number")}{input("commune",t.area)}{input("availability",t.availability)}
     <label>{t.location}<select id="svc-field-service_location_type" value={draft.service_location_type??""} onChange={event=>set("service_location_type",event.target.value)}><option value="" disabled>{design.selectOption}</option><option value="public_place">{t.publicPlace}</option><option value="private_home">{t.privateHome}</option></select></label>
     <label>{t.home}<select id="svc-field-home_service_available" value={draft.home_service_available??""} onChange={event=>set("home_service_available",event.target.value)}><option value="" disabled>{design.selectOption}</option><option value="yes">{t.yes}</option><option value="no">{t.no}</option></select></label>
     <div><label>{t.booking}<select id="svc-field-booking_mode" aria-describedby="svc-booking-help" value={draft.booking_mode??""} onChange={event=>set("booking_mode",event.target.value)}><option value="" disabled>{design.selectOption}</option><option value="flexible">{t.flexible}</option>{(current.booking_mode==="time_slots")&&<option value="time_slots">{t.timeSlots}</option>}</select></label><p id="svc-booking-help" className="svc-field-hint">{design.bookingHelp} {can("structured_availability")&&<button type="button" onClick={()=>{if(leaveWork())navigate("calendar");}}>{ui.calendar} →</button>}</p></div>
     </div><div className="svc-save-row"><button id="svc-details-save" className="svc-primary" disabled={busy}>{t.save}</button></div></section>
    </form>
    <section className="svc-editor-card svc-link-card"><h3>{lc.link}</h3><p>{design.linkHelp}</p><form onSubmit={event=>{event.preventDefault();void act(`/${current.public_ref}`,"PATCH",{expected_revision:current.revision,field:"social_link",value:socialLink});}}><label>{lc.link}<input type="url" maxLength={2000} value={socialLink} onChange={event=>setSocialLink(event.target.value)}/></label><button>{lc.saveLink}</button></form></section>
    <section className="svc-editor-card svc-request-card"><div><h3>{t.requests}</h3><p>{design.requestsHelp}</p>{catalogDirty&&<p className="svc-field-hint">{design.unsaved}</p>}</div><label className="svc-toggle"><input type="checkbox" aria-label={t.requests} checked={current.requests_enabled} disabled={busy||catalogDirty} onChange={event=>void act(`/${current.public_ref}/request-capability`,"PATCH",{expected_revision:current.revision,enabled:event.target.checked})}/><span aria-hidden="true">{current.requests_enabled?t.yes:t.no}</span></label></section>
    {can("packages")&&<section className="svc-editor-card svc-packages"><header><span className="svc-section-number">03</span><div><h3>{t.package}</h3><p>{visibilityCopy[lang].packageHelp}</p></div></header><button type="button" onClick={()=>{setPackageRef(null);setPackageDraft({});}}>{ui.packageNew}</button>{current.packages.map(item=><div className="svc-package-row" key={item.public_ref}><span>{item.name} · {item.price||"—"} {item.currency||""}</span> <button onClick={()=>{setPackageRef(item.public_ref);setPackageDraft({name:item.name,duration_minutes:String(item.duration_minutes),price:item.price??"",currency:item.currency??"USD",description:item.description??""});}}>{t.edit}</button> <button disabled={busy} onClick={()=>void act(`/${current.public_ref}/packages/${item.public_ref}/archive`,"POST",{expected_revision:current.revision,operation_key:crypto.randomUUID()})}>{t.archive}</button></div>)}
    <form onSubmit={event=>{event.preventDefault();try{if(packageDraft.price?.trim())serviceAmount(packageDraft.price);}catch{setMessage(design.invalidDetails);return;}void act(`/${current.public_ref}/packages${packageRef?`/${packageRef}`:""}`,packageRef?"PATCH":"POST",{expected_revision:current.revision,operation_key:crypto.randomUUID(),name:packageDraft.name,duration_minutes:Number(packageDraft.duration_minutes),description:packageDraft.description||null,price:packageDraft.price?.trim()?serviceAmount(packageDraft.price):null,currency:packageDraft.currency||"USD"});}} className="svc-form-grid">
     <label>{t.package}<input required value={packageDraft.name??""} onChange={event=>setPackageDraft(old=>({...old,name:event.target.value}))}/></label><label>{t.duration}<input required type="number" min="1" max="1440" value={packageDraft.duration_minutes??""} onChange={event=>setPackageDraft(old=>({...old,duration_minutes:event.target.value}))}/></label><label>{t.description}<textarea maxLength={2000} value={packageDraft.description??""} onChange={event=>setPackageDraft(old=>({...old,description:event.target.value}))}/></label><label>{t.price}<input inputMode="decimal" value={packageDraft.price??""} onChange={event=>setPackageDraft(old=>({...old,price:event.target.value}))}/></label><label>{t.currency}<select value={packageDraft.currency??"USD"} onChange={event=>setPackageDraft(old=>({...old,currency:event.target.value}))}><option>CDF</option><option>USD</option></select></label><button disabled={busy}>{t.addPackage}</button>
    </form></section>}
    <section className="svc-editor-card svc-reviews"><h3>{t.reviews} <span className="svc-review-count">{current.rating.count}{current.rating.average!==null?` · ${current.rating.average}/5`:""}</span></h3><p>{design.reviewHelp}</p>{reviewsLoading?<p role="status">{ui.loading}</p>:reviewsFailed?<p role="status">{t.failed}</p>:reviews.length===0&&<p className="svc-empty">{ui.reviewEmpty}</p>}{reviews.map((review,index)=><blockquote key={index}>★ {review.score}/5 · {review.comment}</blockquote>)}</section>
    </>}
    <section className="svc-archive-card"><p>{design.archiveHelp}</p><button type="button" onClick={()=>{if(!leaveWork())return;if(current.is_active==="yes"&&!window.confirm(lc.confirm))return;void act(`/${current.public_ref}${current.is_active==="yes"?"":"/reactivate"}?expected_revision=${current.revision}`,current.is_active==="yes"?"DELETE":"POST",{});}}>{current.is_active==="yes"?lc.archive:lc.restore}</button></section>
   </div>}
  </fieldset>}
   </div>
  </div>
 </section>;
}
