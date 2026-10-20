"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {requestWords} from "../../lib/services-request-copy";
import {serviceAmount} from "../../lib/service-time";
import {useWorkDraft} from "../../lib/restaurant-work";

type Locale="fr"|"en"|"ln"|"sw";
type Kind="quote"|"bill";
type Template={template_ref:string;kind:Kind;name:string;content:Record<string,unknown>;revision:number;archived:boolean};
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

type LibraryProps={base:string;binding:string;locale:Locale;kind:Kind};
type Pending={path:string;method:string;body:Record<string,unknown>;archive:boolean};
export function ServicesTemplateLibrary(props:LibraryProps){
 return <TemplateLibrary key={`${props.base}:${props.binding}:${props.kind}`} {...props}/>;
}
function TemplateLibrary({base,binding,locale,kind}:LibraryProps){
 const t=copy[locale],common=requestWords(locale),{rows,error,loading,denied,call,reload}=useTemplates(base,binding,kind);
 const [selected,setSelected]=useState<Template|null>(null),[name,setName]=useState(""),[amount,setAmount]=useState(""),[currency,setCurrency]=useState("USD"),[description,setDescription]=useState(""),[duration,setDuration]=useState(""),[lines,setLines]=useState<Line[]>([emptyLine()]);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[pending,setPending]=useState<Pending|null>(null);
 const locked=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useWorkDraft(!denied&&(!!selected||!!pending),common.leave);
 function begin(row?:Template){if(busy||pending)return;setSelected(row??{template_ref:"",kind,name:"",content:{},revision:0,archived:false});setName(row?.name??"");setAmount(String(row?.content.amount??""));setCurrency(String(row?.content.currency??"USD"));setDescription(String(row?.content.pricing_description??""));setDuration(String(row?.content.duration_minutes??""));setLines(row?asLines(row.content.lines):[emptyLine()]);setNotice("");}
 function content(){return kind==="quote"?{...(amount?{amount:serviceAmount(amount)}:{}),currency,...(description?{pricing_description:description}:{}),...(duration?{duration_minutes:Number(duration)}:{})}:{currency,lines:lines.map(line=>({label:line.label,amount:serviceAmount(line.amount),private_detail:line.private_detail||null}))};}
 async function run(command:Pending){
  if(locked.current||denied)return;
  if(!navigator.onLine){setNotice(common.offline);return;}
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
  }finally{locked.current=false;if(alive.current)setBusy(false);}
 }
 function save(event:React.FormEvent){event.preventDefault();if(!selected||busy||pending)return;
  try{void run({path:selected.template_ref?`/${selected.template_ref}`:"",method:selected.template_ref?"PATCH":"POST",archive:false,
   body:{kind,name,content:content(),...(selected.template_ref?{revision:selected.revision}:{}),idempotency_key:crypto.randomUUID()}});}
  catch{setNotice(recovery[locale].invalid);}
 }
 function archive(row:Template){if(!pending)void run({path:`/${row.template_ref}/archive`,method:"POST",archive:true,body:{revision:row.revision,idempotency_key:crypto.randomUUID()}});}
 if(denied)return <p role="alert">{recovery[locale].denied}</p>;
 return <section aria-label={kind==="quote"?t.quote:t.bill} style={{border:"1px solid #94a3b8",borderRadius:10,padding:"1rem",margin:"1rem 0"}}>
  <h3>{kind==="quote"?t.quote:t.bill}</h3><p>{t.review}</p>
  {loading&&<p role="status">{common.loading}</p>}{error&&<p role="status">{t.failed}</p>}{notice&&<p role="status">{notice}</p>}
  {error&&<button disabled={busy||!!pending} onClick={()=>void reload()}>{common.retry}</button>}
  {pending&&!busy&&<button onClick={()=>void run(pending)}>{common.retry}</button>}
  {!selected&&<><button disabled={busy||!!pending||loading||!!error} type="button" onClick={()=>begin()}>{t.new}</button>{!loading&&!error&&rows.length===0&&<p>{t.empty}</p>}{rows.map(row=><div key={row.template_ref} style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,marginTop:8}}><strong>{row.name}</strong>{row.archived?<span>{t.archived}</span>:<><button disabled={busy||!!pending} type="button" onClick={()=>begin(row)}>{t.edit}</button><button type="button" disabled={busy||!!pending} onClick={()=>archive(row)}>{t.archive}</button></>}</div>)}</>}
  {selected&&<form onSubmit={save}><fieldset disabled={busy||!!pending} style={{display:"grid",gap:8,marginTop:12,border:0,padding:0,minWidth:0}}><label>{t.name}<input required maxLength={100} value={name} onChange={event=>setName(event.target.value)}/></label>
   <label>{t.currency}<select value={currency} onChange={event=>setCurrency(event.target.value)}><option>USD</option><option>CDF</option></select></label>
   {kind==="quote"?<><label>{t.amount}<input inputMode="decimal" value={amount} onChange={event=>setAmount(event.target.value)}/></label><label>{t.description}<textarea maxLength={2000} value={description} onChange={event=>setDescription(event.target.value)}/></label><label>{t.duration}<input type="number" min={1} value={duration} onChange={event=>setDuration(event.target.value)}/></label></>:<><h4>{t.lines}</h4>{lines.map((line,index)=><div key={index} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,180px),1fr))",gap:8}}><label>{t.label}<input required value={line.label} maxLength={120} onChange={event=>setLines(old=>old.map((item,i)=>i===index?{...item,label:event.target.value}:item))}/></label><label>{t.amount}<input required inputMode="decimal" value={line.amount} onChange={event=>setLines(old=>old.map((item,i)=>i===index?{...item,amount:event.target.value}:item))}/></label><label>{t.detail}<input value={line.private_detail} maxLength={500} onChange={event=>setLines(old=>old.map((item,i)=>i===index?{...item,private_detail:event.target.value}:item))}/></label><button type="button" onClick={()=>setLines(old=>old.filter((_,i)=>i!==index))}>{t.remove}</button></div>)}<button type="button" onClick={()=>setLines(old=>[...old,emptyLine()])}>{t.add}</button></>}
   <div style={{display:"flex",flexWrap:"wrap",gap:8}}><button disabled={busy} type="submit">{t.save}</button><button type="button" onClick={()=>{if(window.confirm(common.leave))setSelected(null);}}>{t.cancel}</button></div></fieldset></form>}
  <style>{`section[aria-label="${kind==="quote"?t.quote:t.bill}"] input,section[aria-label="${kind==="quote"?t.quote:t.bill}"] select,section[aria-label="${kind==="quote"?t.quote:t.bill}"] textarea{display:block;width:100%;box-sizing:border-box;padding:.65rem;min-width:0}section[aria-label="${kind==="quote"?t.quote:t.bill}"] button{padding:.6rem .8rem}`}</style>
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
 useWorkDraft(!denied&&!!pending,common.leave);
 const current=rows.find(row=>row.template_ref===selected&&!row.archived);
 async function apply(){
  if(lock.current||denied||!pending&&!current)return;
  if(!navigator.onLine){setNotice(common.offline);return;}
  const command=pending??{path:`/${current!.template_ref}/apply`,body:{template_revision:current!.revision,target_ref:targetRef,target_revision:targetRevision,...(draftRef?{draft_ref:draftRef}:{}),idempotency_key:crypto.randomUUID()}};
  lock.current=true;setBusy(true);setNotice("");setPending(command);
  try{const result=await call(command.path,"POST",command.body);if(!alive.current)return;setPending(null);onApplied(result);setNotice(t.applied);}
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
  <label>{t.choose}<select disabled={busy||!!pending||loading||!!error} value={selected} onChange={event=>setSelected(event.target.value)} style={{display:"block",width:"100%",padding:8}}><option value=""></option>{rows.filter(row=>!row.archived).map(row=><option key={row.template_ref} value={row.template_ref}>{row.name}</option>)}</select></label>
  <button type="button" disabled={busy||(!pending&&(!current||loading||!!error))} onClick={()=>void apply()}>{pending?common.retry:t.apply}</button>{notice&&<p role="status">{notice}</p>}</div>;
}
