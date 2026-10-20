"use client";
import {useEffect,useRef,useState} from "react";
import {useWorkDraft} from "@/app/lib/restaurant-work";
import {providerCopy} from "@/app/lib/services-provider-copy";
import {ServiceBillStatement,type BillStatementVersion} from "./service-bill-statement";

type Locale="fr"|"en"|"ln"|"sw";
type Settings={display_name:string|null;accent:string;revision:number;fallback_display_name:string;preview:{display_name:string;accent:string}};
const words={
 en:{title:"Bill presentation",name:"Name shown on new bills",help:"Changes apply the next time you issue a bill. Bills already issued keep their appearance. Leave the name blank to use your public provider name.",accent:"Accent color",save:"Save presentation",preview:"Draft presentation preview",saved:"Presentation saved.",failed:"Could not save. Refresh and try again.",slate:"Slate",blue:"Blue",green:"Green",plum:"Plum"},
 fr:{title:"Présentation des factures",name:"Nom affiché sur les nouvelles factures",help:"Les modifications s’appliquent à la prochaine facture émise. Les factures déjà émises gardent leur présentation. Laissez le nom vide pour utiliser votre nom public.",accent:"Couleur d’accent",save:"Enregistrer",preview:"Aperçu du brouillon",saved:"Présentation enregistrée.",failed:"Enregistrement impossible. Actualisez et réessayez.",slate:"Ardoise",blue:"Bleu",green:"Vert",plum:"Prune"},
 ln:{title:"Lolenge ya mokanda",name:"Nkombo na mikanda ya sika",help:"Bobongoli ekosalelama na facture oyo okobimisa sima. Ba facture oyo esila kobima ekobongwana te. Tika nkombo polele mpo na kosalela nkombo na yo ya bato nyonso.",accent:"Langi",save:"Bomba",preview:"Elilingi ya brouillon",saved:"Ebombami.",failed:"Kobomba elongi te. Zongisa mpe meka lisusu.",slate:"Motane ya mabanga",blue:"Bule",green:"Vert",plum:"Violet"},
 sw:{title:"Mwonekano wa bili",name:"Jina kwenye bili mpya",help:"Mabadiliko yatatumika utakapotoa bili inayofuata. Bili zilizotolewa tayari hazibadiliki. Acha jina wazi kutumia jina lako la umma.",accent:"Rangi",save:"Hifadhi",preview:"Muhtasari wa rasimu",saved:"Mwonekano umehifadhiwa.",failed:"Imeshindikana kuhifadhi. Sasisha na ujaribu tena.",slate:"Kijivu",blue:"Bluu",green:"Kijani",plum:"Zambarau"}
} as const;

const previewCopy={
 en:{identity:"Your bill identity",look:"Make it yours",example:"Illustrative sample · not an issued bill",line:"Example service",sample:"SAMPLE",live:"Live preview",note:"Sample amounts show the layout only. No bill is created here.",loadFailed:"Bill settings could not be loaded.",reset:"Discard changes"},
 fr:{identity:"Votre identité sur les factures",look:"À votre image",example:"Exemple illustratif · aucune facture émise",line:"Exemple de prestation",sample:"EXEMPLE",live:"Aperçu en direct",note:"Les montants illustrent uniquement la présentation. Aucune facture n’est créée ici.",loadFailed:"Impossible de charger la présentation des factures.",reset:"Annuler les modifications"},
 ln:{identity:"Nkombo na yo na facture",look:"Lolenge na yo",example:"Ndakisa kaka · facture ebimi te",line:"Ndakisa ya mosala",sample:"NDAKISA",live:"Tala mbongwana",note:"Mitango ezali kaka mpo na kolakisa lolenge. Facture esalemi awa te.",loadFailed:"Lolenge ya facture efungwami te.",reset:"Longola mbongwana"},
 sw:{identity:"Utambulisho wako kwenye bili",look:"Mwonekano wako",example:"Mfano tu · si bili iliyotolewa",line:"Mfano wa huduma",sample:"MFANO",live:"Mwonekano wa moja kwa moja",note:"Kiasi kinaonyesha mpangilio tu. Hakuna bili inayoundwa hapa.",loadFailed:"Mipangilio ya bili haikuweza kupakiwa.",reset:"Ondoa mabadiliko"}
} as const;
const accents={slate:"#334155",blue:"#1d4ed8",green:"#166534",plum:"#7e22ce"} as const;
function validSettings(value:Settings):boolean{return !!value&&typeof value.fallback_display_name==="string"&&Number.isInteger(value.revision)&&value.revision>=0&&value.accent in accents&&(value.display_name===null||typeof value.display_name==="string");}

export function ServicesBillBranding(props:{base:string;binding:string;locale:Locale;onDenied?:()=>void}){
 return <BillBranding key={`${props.base}:${props.binding}`} {...props}/>;
}
function BillBranding({base,binding,locale,onDenied}:{base:string;binding:string;locale:Locale;onDenied?:()=>void}){
 const t=words[locale],ui=providerCopy[locale],p=previewCopy[locale];
 const [settings,setSettings]=useState<Settings|null>(null),[name,setName]=useState(""),[accent,setAccent]=useState("slate"),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[reload,setReload]=useState(0),[pending,setPending]=useState<string|null>(null);
 const lock=useRef(false),alive=useRef(true),denied=useRef(onDenied);
 useEffect(()=>{denied.current=onDenied;},[onDenied]);
 useWorkDraft(pending!==null||!!settings&&(name!==(settings.display_name??"")||accent!==settings.accent),ui.leave);
 useEffect(()=>{
  alive.current=true;let active=true;const controller=new AbortController();
  void fetch(`${base}/transactions/bill-presentation`,{credentials:"include",cache:"no-store",signal:controller.signal,headers:{Accept:"application/json","X-Shida-Session":binding}}).then(async response=>{
   if(!response.ok){if(active&&[401,403,404].includes(response.status))denied.current?.();throw new Error();}
   const value=await response.json() as Settings;if(!validSettings(value))throw new Error();
   if(active){setSettings(value);setName(value.display_name??"");setAccent(value.accent);}
  }).catch(()=>{if(active)setSettings(null);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;alive.current=false;controller.abort();};
 },[base,binding,reload]);
 function refresh(){setLoading(true);setSettings(null);setReload(value=>value+1);}
 async function save(event:React.FormEvent){
  event.preventDefault();if(!settings||lock.current)return;
  const body=pending??JSON.stringify({revision:settings.revision,idempotency_key:crypto.randomUUID(),display_name:name.trim()||null,accent});
  lock.current=true;setBusy(true);setNotice("");setPending(body);
  try{
   const response=await fetch(`${base}/transactions/bill-presentation`,{method:"PATCH",credentials:"include",cache:"no-store",headers:{Accept:"application/json","Content-Type":"application/json","X-Shida-Session":binding},body});
   if(!alive.current)return;
   if(!response.ok){
    if([401,403,404].includes(response.status)){setSettings(null);setPending(null);denied.current?.();return;}
    if(response.status>=400&&response.status<500&&response.status!==408){setPending(null);setNotice(t.failed);if(response.status===409)refresh();return;}
    throw new Error();
   }
   const next=await response.json() as Settings;if(!validSettings(next))throw new Error();
   if(alive.current){setSettings(next);setName(next.display_name??"");setAccent(next.accent);setPending(null);setNotice(t.saved);}
  }catch{if(alive.current)setNotice(ui.uncertain);}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 if(loading)return <p className="svc-empty" role="status">{ui.loading}</p>;
 if(!settings)return <section className="svc-editor-card"><p role="alert">{p.loadFailed}</p><button type="button" onClick={refresh}>{ui.retry}</button></section>;
 const preview:BillStatementVersion={version_ref:"",bill_ref:p.sample,revision:1,status:"private_draft",currency:"USD",total:"50.00",issue_date:null,due_date:null,lines:[{ordinal:1,label:p.line,amount:"50.00"}],presentation:{identity_name:settings.fallback_display_name,display_name:name.trim()||settings.fallback_display_name,accent}};
 const dirty=name!==(settings.display_name??"")||accent!==settings.accent;
 return <section className="svc-branding" aria-label={p.identity}>
  <form className="svc-branding-controls svc-editor-card" onSubmit={event=>void save(event)}>
   <p className="svc-kicker">{p.look}</p><h3>{p.identity}</h3><p>{t.help}</p>
   <fieldset disabled={busy||pending!==null}><label>{t.name}<input maxLength={120} placeholder={settings.fallback_display_name} value={name} onChange={event=>setName(event.target.value)}/></label>
    <fieldset className="svc-accent-options"><legend>{t.accent}</legend>{(Object.keys(accents) as (keyof typeof accents)[]).map(color=><label key={color} className={accent===color?"is-selected":""}><input type="radio" name="bill-accent" value={color} checked={accent===color} onChange={()=>setAccent(color)}/><span aria-hidden="true" style={{background:accents[color]}}>{accent===color?"✓":""}</span><strong>{t[color]}</strong></label>)}</fieldset>
   </fieldset>
   {notice&&<p className="svc-notice" role="status">{notice}</p>}
   <div className="svc-branding-actions"><button className="svc-primary" disabled={busy||(!dirty&&!pending)}>{pending?ui.retry:t.save}</button>{dirty&&!pending&&<button type="button" disabled={busy} onClick={()=>{setName(settings.display_name??"");setAccent(settings.accent);setNotice("");}}>{p.reset}</button>}</div>
  </form>
  <div className="svc-bill-preview"><header><span className="svc-kicker">{p.live}</span><span className="svc-preview-tag">{p.example}</span></header><ServiceBillStatement locale={locale} version={preview} draft/><p className="svc-preview-note">{p.note}</p></div>
 </section>;
}
