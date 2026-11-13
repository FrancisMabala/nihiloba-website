"use client";
import {useConfirmation} from "./confirmation-dialog";
import {leaveFormConfirmation} from "../../lib/confirmation-actions";
import {useCallback,useEffect,useRef,useState} from "react";
import {requestWords} from "../../lib/services-request-copy";
import {serviceAmount} from "../../lib/service-time";
import {templateDesign as design} from "../../lib/services-template-design";
import {docWords,itemTotal,lineAmount,type DocumentFields} from "../../lib/service-document";
import {DocumentEditor} from "./service-document-editor";
import type {OfferTerms} from "../../lib/service-catalog";
import "./services-template-library.css";
import {useWorkDraft} from "../../lib/restaurant-work";

type Locale="fr"|"en"|"ln"|"sw";
type Kind="quote"|"bill";
type Template={template_ref:string;kind:Kind;name:string;content:Record<string,unknown>;revision:number;archived:boolean;updated_at?:string};
type Line={label:string;amount:string;private_detail:string};
const copy={
 en:{title:"Saved quotes and bills",quote:"Saved quotes",bill:"Saved bill layouts",new:"New template",name:"Template name",amount:"Amount",currency:"Currency",description:"What the price includes",duration:"Duration (minutes)",lines:"Bill items",label:"Line description",detail:"Private detail",add:"Add line",remove:"Remove line",save:"Save template",edit:"Edit",archive:"Archive",cancel:"Cancel",empty:"No saved templates yet.",apply:"Use this template",choose:"Choose a template",review:"Check the prices, dates and details before finalizing or sending.",saved:"Template saved.",applied:"Draft filled. Review it before continuing.",stale:"The template or draft changed. Reload and try again.",failed:"Could not complete this action.",archived:"Archived"},
 fr:{title:"Devis et factures enregistrés",quote:"Devis enregistrés",bill:"Modèles de facture",new:"Nouveau modèle",name:"Nom du modèle",amount:"Montant",currency:"Devise",description:"Ce que le prix comprend",duration:"Durée (minutes)",lines:"Articles de la facture",label:"Description de ligne",detail:"Détail privé",add:"Ajouter une ligne",remove:"Supprimer la ligne",save:"Enregistrer le modèle",edit:"Modifier",archive:"Archiver",cancel:"Annuler",empty:"Aucun modèle enregistré.",apply:"Utiliser ce modèle",choose:"Choisir un modèle",review:"Vérifiez les prix, les dates et les détails avant de finaliser ou d’envoyer.",saved:"Modèle enregistré.",applied:"Brouillon prérempli. Vérifiez-le avant de continuer.",stale:"Le modèle ou le brouillon a changé. Actualisez et réessayez.",failed:"Action impossible.",archived:"Archivé"},
 ln:{title:"Ba devis mpe facture ebombami",quote:"Ba devis ebombami",bill:"Ba modèle ya facture",new:"Modèle ya sika",name:"Nkombo ya modèle",amount:"Motango",currency:"Mbongo",description:"Ndimbola ya ntalo",duration:"Ntango (miniti)",lines:"Biloko ya facture",label:"Ndimbola ya molongo",detail:"Ndimbola ya sekele",add:"Bakisa molongo",remove:"Longola molongo",save:"Bomba modèle",edit:"Bongisa",archive:"Bomba na archive",cancel:"Tika",empty:"Modèle ebombami naino te.",apply:"Salela modèle oyo",choose:"Pona modèle",review:"Tala ntalo, mikolo mpe makambo liboso ya kosilisa to kotinda.",saved:"Modèle ebombami.",applied:"Brouillon etondisami. Tala yango liboso ya kokoba.",stale:"Modèle to brouillon ebongwani. Zongisa mpe meka lisusu.",failed:"Likambo yango elongi te.",archived:"Ezali na archive"},
 sw:{title:"Makadirio na bili zilizohifadhiwa",quote:"Makadirio yaliyohifadhiwa",bill:"Miundo ya bili",new:"Kiolezo kipya",name:"Jina la kiolezo",amount:"Kiasi",currency:"Sarafu",description:"Maelezo ya bei",duration:"Muda (dakika)",lines:"Vipengee vya bili",label:"Maelezo ya mstari",detail:"Maelezo ya faragha",add:"Ongeza mstari",remove:"Ondoa mstari",save:"Hifadhi kiolezo",edit:"Hariri",archive:"Hifadhi kwenye kumbukumbu",cancel:"Ghairi",empty:"Hakuna violezo vilivyohifadhiwa.",apply:"Tumia kiolezo hiki",choose:"Chagua kiolezo",review:"Kagua bei, tarehe na maelezo kabla ya kukamilisha au kutuma.",saved:"Kiolezo kimehifadhiwa.",applied:"Rasimu imejazwa. Ikague kabla ya kuendelea.",stale:"Kiolezo au rasimu imebadilika. Sasisha na ujaribu tena.",failed:"Hatua haikukamilika.",archived:"Kimehifadhiwa"}
} as const;
const emptyLine=():Line=>({label:"",amount:"",private_detail:""});
const asLines=(value:unknown):Line[]=>Array.isArray(value)?value.map(item=>({label:String(item.label??""),amount:String(item.amount??""),private_detail:String(item.private_detail??"")})):[emptyLine()];
const recovery={
 en:{invalid:"Check the name, amounts, currency and duration, then try again.",denied:"Saved quotes and bills are unavailable for your current access."},
 fr:{invalid:"Vérifiez le nom, les montants, la devise et la durée, puis réessayez.",denied:"Les devis et factures enregistrés ne sont pas accessibles avec vos droits actuels."},
 ln:{invalid:"Tala nkombo, mituya, mbongo mpe ntango, mpe meka lisusu.",denied:"Okoki kofungola ba devis mpe ba facture ebombami te na ndingisa na yo sikoyo."},
 sw:{invalid:"Kagua jina, kiasi, sarafu na muda, kisha ujaribu tena.",denied:"Makadirio na bili zilizohifadhiwa hazipatikani kwa ruhusa zako za sasa."},
};

function useTemplates(base:string,binding:string,kind:Kind){
 const [rows,setRows]=useState<Template[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(true),[denied,setDenied]=useState(false);
 const alive=useRef(true),generation=useRef(0);
 const call=useCallback(async(path:string,method="GET",body?:object)=>{
  const response=await fetch(`${base}/transactions/templates${path}`,{method,credentials:"include",cache:"no-store",signal:AbortSignal.timeout(20000),headers:{Accept:"application/json","X-Shida-Session":binding,...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});
  if(!response.ok){
   if([401,403,404].includes(response.status)&&alive.current){setRows([]);setDenied(true);}
   throw new Error(String(response.status));
  }return await response.json() as Record<string,unknown>;
 },[base,binding]);
 const reload=useCallback(async()=>{
  const ticket=++generation.current;setLoading(true);
  try{const result=await call(`?kind=${kind}`);if(alive.current&&ticket===generation.current){setRows(Array.isArray(result.templates)?result.templates as Template[]:[]);setError("");}}
  catch{if(alive.current&&ticket===generation.current){setRows([]);setError("failed");}}
  finally{if(alive.current&&ticket===generation.current)setLoading(false);}
 },[call,kind]);
 useEffect(()=>{alive.current=true;let active=true;const invalidate=()=>{generation.current++;};queueMicrotask(()=>{if(active)void reload();});return()=>{active=false;alive.current=false;invalidate();};},[reload]);
 return {rows,error,loading,denied,call,reload};
}

type Offering={name?:string;offer_terms?:OfferTerms;public_ref:string;service_name:string;category:string;description:string|null;service_duration_minutes:number|null;is_active:string;packages:{public_ref:string;name:string;description:string|null;price:string|null;currency:string|null;duration_minutes:number}[]};
type LibraryProps={base:string;binding:string;locale:Locale;kind:Kind;issuer?:string;accent?:string;offerings?:Offering[];onUse?:()=>void};
type Pending={path:string;method:string;body:Record<string,unknown>;archive:boolean};
export function ServicesTemplateLibrary(props:LibraryProps){
 return <TemplateLibrary key={`${props.base}:${props.binding}:${props.kind}`} {...props}/>;
}
function TemplateLibrary({base,binding,locale,kind,issuer,accent,offerings=[],onUse}:LibraryProps){
 const {request:ask,confirmation}=useConfirmation(locale);
 const leave=leaveFormConfirmation[locale];
 const d=design[locale],w=docWords(locale);
 const [document,setDocument]=useState<DocumentFields>({}),[source,setSource]=useState("");
 const sourceService=offerings.find(row=>row.public_ref===source);
 const t=copy[locale],common=requestWords(locale),{rows,error,loading,denied,call,reload}=useTemplates(base,binding,kind);
 const [selected,setSelected]=useState<Template|null>(null),[name,setName]=useState(""),[amount,setAmount]=useState(""),[currency,setCurrency]=useState("USD"),[duration,setDuration]=useState("");
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[pending,setPending]=useState<Pending|null>(null);
 const form=useRef<HTMLFormElement>(null);
 const locked=useRef(false),alive=useRef(true);
 useEffect(()=>{if(selected)form.current?.querySelector<HTMLElement>("h3")?.focus();},[selected]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useWorkDraft(!denied&&(!!selected||!!pending),common.leave,locale);
 function begin(row?:Template){if(busy||pending)return;setSelected(row??{template_ref:"",kind,name:"",content:{},revision:0,archived:false});setName(row?.name??"");setAmount(String(row?.content.amount??""));setCurrency(String(row?.content.currency??"USD"));setDuration(String(row?.content.duration_minutes??""));
  const saved=(row?.content.document??{}) as DocumentFields;
  const legacy=Array.isArray(row?.content.lines)?asLines(row.content.lines):[];
  const items=saved.items??legacy.map(i=>({label:i.label,quantity:1,unit_price:i.amount}));
  setDocument({...saved,items,description:saved.description??String(row?.content.pricing_description??""),conditions:saved.conditions??String(row?.content.terms??"")});
  if(items.length)setAmount(itemTotal(items));setNotice("");setSource("");}
 function content(){
  const items=document.items??[],normal={...document,items:items.map(i=>({...i,unit_price:serviceAmount(i.unit_price)}))};
  const price=serviceAmount(items.length?itemTotal(items):amount);
  if(kind==="quote")return {document:normal,amount:price,currency,...(document.description?{pricing_description:document.description.slice(0,2000)}:{}),...(document.conditions?{terms:document.conditions.slice(0,2000)}:{}),...(duration?{duration_minutes:Number(duration)}:{})};
  const previous=asLines(selected?.content.lines);
  const lines=items.length?items.map(i=>({label:i.label,amount:lineAmount(i),private_detail:previous.find(p=>p.label===i.label)?.private_detail||null})):[{label:document.subject||name,amount:price}];
  return {document:normal,currency,lines};
 }
 async function run(command:Pending,propagate=false){
  if(locked.current||denied){if(propagate)throw new Error("unavailable");return;}
  if(!navigator.onLine){setNotice(common.offline);if(propagate)throw new Error("offline");return;}
  locked.current=true;setBusy(true);setNotice("");setPending(command);
  try{
   await call(command.path,command.method,command.body);
   if(!alive.current)return;
   setPending(null);setSelected(null);setNotice(command.archive?t.archived:t.saved);await reload();
  }catch(error){
   if(!alive.current)return;
   const status=error instanceof Error?Number(error.message):0;
   if(status>=400&&status<500&&status!==408){setPending(null);setNotice(status===409?t.stale:recovery[locale].invalid);if(status===409){setSelected(null);await reload();}}
   else setNotice(common.uncertain);
   if(propagate)throw error;
  }finally{locked.current=false;if(alive.current)setBusy(false);}
 }
 function save(event:React.FormEvent){event.preventDefault();if(!selected||busy||pending)return;
  try{void run({path:selected.template_ref?`/${selected.template_ref}`:"",method:selected.template_ref?"PATCH":"POST",archive:false,
   body:{kind,name,content:content(),...(selected.template_ref?{revision:selected.revision}:{}),idempotency_key:crypto.randomUUID()}});}
  catch{setNotice(recovery[locale].invalid);}
 }
 function archive(row:Template){if(pending)return;const command:Pending={path:`/${row.template_ref}/archive`,method:"POST",archive:true,body:{revision:row.revision,idempotency_key:crypto.randomUUID()}};ask({title:`${t.archive}: ${row.name}`,description:d.archiveConfirm,confirmLabel:t.archive,severity:"warning",onConfirm:()=>run(command,true)});}
 if(denied)return <p role="alert">{recovery[locale].denied}</p>;
 function seed(ref:string){
  setSource(ref);const service=offerings.find(row=>row.public_ref===ref);if(!service)return;
  setName(service.service_name);setDocument({subject:service.service_name,description:service.description||""});setDuration(String(service.service_duration_minutes||""));
  const price=service.offer_terms?.pricing;setAmount(price?.amount??"");if(price?.currency)setCurrency(price.currency);
 }
 function seedPackage(ref:string){const p=sourceService?.packages.find(item=>item.public_ref===ref);if(!p)return;setDocument({subject:p.name,description:p.description||p.name,items:[{label:p.name,quantity:1,unit_price:p.price??""}]});setAmount(p.price??"");if(p.currency)setCurrency(p.currency);setDuration(String(p.duration_minutes));}
 return <section className="svc-template-library" aria-label={kind==="quote"?t.quote:t.bill}>{confirmation}
  <header className="svc-template-toolbar"><div><h2>{selected?(kind==="quote"?w.editQuote:w.editBill):(kind==="quote"?w.quotes:w.bills)}</h2><p>{d.reusable}</p></div>{!selected&&<button className="svc-primary" disabled={busy||!!pending||loading||!!error} type="button" onClick={()=>begin()}>＋ {locale==="fr"?(kind==="quote"?"Créer un modèle de devis":"Créer un modèle de facture"):t.new+" · "+w[kind]}</button>}</header>
  {loading&&<p role="status">{common.loading}</p>}{error&&<p role="alert">{t.failed}</p>}{notice&&<p className="svc-notice" role="status">{notice}</p>}
  {error&&<button disabled={busy||!!pending} onClick={()=>void reload()}>{common.retry}</button>}{pending&&!busy&&<button onClick={()=>void run(pending)}>{common.retry}</button>}
  {!selected&&<>{!loading&&!error&&rows.length===0&&<div className="svc-template-empty"><span aria-hidden="true">▤</span><h3>{t.empty}</h3><p>{d.empty}</p></div>}<div className="svc-template-list">{rows.map(row=><article key={row.template_ref}><span className="svc-template-icon" aria-hidden="true">▤</span><div><h3>{row.name}</h3><p>{String(row.content.pricing_description??(kind==="bill"?d.itemized:d.pricing))}</p><span className="svc-template-chip">{String(row.content.currency??"—")}</span>{row.updated_at&&!Number.isNaN(Date.parse(row.updated_at))&&<time dateTime={row.updated_at} className="svc-template-date">{new Intl.DateTimeFormat(locale,{dateStyle:"medium"}).format(new Date(row.updated_at))}</time>}{row.archived&&<span className="svc-template-chip">{t.archived}</span>}</div>{!row.archived&&<div className="svc-template-row-actions"><button disabled={busy||!!pending} type="button" onClick={()=>begin(row)}>{t.edit}</button><details><summary aria-label={`${d.actions}: ${row.name}`}>⋮</summary><div><button disabled={busy||!!pending} type="button" onClick={()=>begin({...row,template_ref:"",revision:0})}>{d.duplicate}</button><button disabled={busy||!!pending} type="button" onClick={()=>archive(row)}>{t.archive}</button></div></details></div>}</article>)}</div><aside className="svc-template-info"><strong>{d.about}</strong><p>{d.snapshot}</p>{onUse&&<button type="button" onClick={onUse}>{d.useHelp} →</button>}</aside></>}
  {selected&&<form ref={form} onSubmit={save}><fieldset disabled={busy||!!pending} className="svc-doc-container">
    <DocumentEditor locale={locale} change={setDocument} amount={setAmount} currency={setCurrency} paper={{kind,issuer:issuer||offerings[0]?.name||w[kind],accent,client:w.sample,state:w.sample,document,currency,amount}}>
     <label>{t.name}<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>
     <label>{d.source}<select value={source} onChange={e=>seed(e.target.value)}><option value="">{d.general}</option>{offerings.filter(r=>r.is_active==="yes").map(r=><option key={r.public_ref} value={r.public_ref}>{r.service_name}</option>)}</select></label>
     {!!sourceService?.packages.length&&<label>{d.package}<select defaultValue="" onChange={e=>seedPackage(e.target.value)}><option value="">{d.choosePackage}</option>{sourceService.packages.map(p=><option value={p.public_ref} key={p.public_ref}>{p.name}</option>)}</select></label>}
     {kind==="quote"&&<label>{t.duration}<input type="number" min={1} value={duration} onChange={e=>setDuration(e.target.value)}/></label>}
    </DocumentEditor><footer className="svc-doc-footer"><button type="button" onClick={()=>ask({title:leave.title,description:leave.description,confirmLabel:leave.action,severity:"warning",onConfirm:()=>setSelected(null)})}>{t.cancel}</button><button className="svc-primary" type="submit">{t.save}</button></footer>
   </fieldset></form>}
 </section>;
}

type PickerProps=LibraryProps&{targetRef:string;targetRevision:number;draftRef?:string;onApplied:(value:Record<string,unknown>)=>void};
export function ServicesTemplatePicker(props:PickerProps){
 return <TemplatePicker key={`${props.base}:${props.binding}:${props.kind}:${props.targetRef}`} {...props}/>;
}
function TemplatePicker({base,binding,locale,kind,targetRef,targetRevision,draftRef,onApplied}:PickerProps){
 const t=copy[locale],common=requestWords(locale),{rows,error,loading,denied,call,reload}=useTemplates(base,binding,kind),[selected,setSelected]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const [pending,setPending]=useState<{path:string;body:Record<string,unknown>}|null>(null);
 const lock=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useWorkDraft(!denied&&!!pending,common.leave,locale);
 const appliedResult=useRef<Record<string,unknown>|null>(null);
 // Refresh the saved draft only after the pending leave guard has been removed.
 useEffect(()=>{if(!pending&&appliedResult.current){const value=appliedResult.current;appliedResult.current=null;onApplied(value);}},[pending,onApplied]);
 const current=rows.find(row=>row.template_ref===selected&&!row.archived);
 async function apply(){
  if(lock.current||denied||!pending&&!current)return;
  if(!navigator.onLine){setNotice(common.offline);return;}
  const command=pending??{path:`/${current!.template_ref}/apply`,body:{template_revision:current!.revision,target_ref:targetRef,target_revision:targetRevision,...(draftRef?{draft_ref:draftRef}:{}),idempotency_key:crypto.randomUUID()}};
  lock.current=true;setBusy(true);setNotice("");setPending(command);
  try{const result=await call(command.path,"POST",command.body);if(!alive.current)return;appliedResult.current=result;setPending(null);setNotice(t.applied);}
  catch(error){
   if(!alive.current)return;
   const status=error instanceof Error?Number(error.message):0;
   if(status>=400&&status<500&&status!==408){setPending(null);setNotice(status===409?t.stale:t.failed);if(status===409){setSelected("");await reload();}}
   else setNotice(common.uncertain);
  }finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 if(denied)return <p role="alert">{recovery[locale].denied}</p>;
 return <div style={{border:"1px solid #cbd5e1",borderRadius:8,padding:".8rem",margin:".8rem 0"}}><p>{t.review}</p>
  {loading&&<p role="status">{common.loading}</p>}{error&&<><p role="status">{t.failed}</p><button disabled={busy||!!pending} onClick={()=>void reload()}>{common.retry}</button></>}
  <label>{locale==="fr"?"Partir d’un modèle":t.choose}<select disabled={busy||!!pending||loading||!!error} value={selected} onChange={event=>setSelected(event.target.value)} style={{display:"block",width:"100%",padding:8}}><option value=""></option>{rows.filter(row=>!row.archived).map(row=><option key={row.template_ref} value={row.template_ref}>{row.name}</option>)}</select></label>
  <button type="button" disabled={busy||(!pending&&(!current||loading||!!error))} onClick={()=>void apply()}>{pending?common.retry:t.apply}</button>{notice&&<p role="status">{notice}</p>}</div>;
}
