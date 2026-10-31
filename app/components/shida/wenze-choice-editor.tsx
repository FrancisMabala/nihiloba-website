"use client";
import {useState} from "react";
import copy from "@/app/lib/wenze-choice-copy.json";
export type ChoiceRow={label:string;quantity:string;attributes?:Record<string,string>};
type Locale=keyof typeof copy;
const presets:Record<string,string[]>={size:["XS","S","M","L","XL","XXL"],shoe_size:["36","37","38","39","40","41","42","43","44","45"],colour:["Blanc","Noir","Rouge","Bleu","Vert","Beige"],storage:["64 GB","128 GB","256 GB","512 GB","1 TB"],ram:["4 GB","8 GB","16 GB","32 GB"],volume:["30 ml","50 ml","100 ml","250 ml","500 ml","1 L"],weight:["100 g","250 g","500 g","1 kg"],pack:["1","2","6","12"],fragrance:[],flavour:[],custom:[]};
function suggestions(category:string){
 const [family,type]=category.split(":");
 if(family==="fashion_clothing")return ["size","colour"];
 if(family==="shoes_accessories")return ["shoe_size","colour"];
 if(family==="phones_electronics")return type?.includes("laptop")?["ram","storage","colour"]:["storage","colour"];
 if(family==="beauty_cosmetics")return ["volume","fragrance"];
 if(family==="food_drinks")return ["weight","flavour","pack"];
 return ["size","colour","custom"];
}
export function choiceError(rows:ChoiceRow[],available?:number|null){
 if(!rows.length||rows.some(r=>!r.label.trim()||(r.quantity!==""&&(!/^\d+$/.test(r.quantity)||!Number.isSafeInteger(Number(r.quantity))))))return "invalid";
 if(new Set(rows.map(r=>r.label.trim().normalize("NFKC").toLocaleLowerCase())).size!==rows.length)return "invalid";
 if(available!=null&&(rows.some(r=>r.quantity==="")||rows.reduce((sum,r)=>sum+Number(r.quantity),0)!==available))return "mismatch";
 return "";
}
export function WenzeChoiceEditor({locale,category,rows,available,onChange,optional=false}:{locale:Locale;category:string;rows:ChoiceRow[];available?:number|null;onChange:(rows:ChoiceRow[],kind?:string)=>void;optional?:boolean}){
 const c=copy[locale], recommended=suggestions(category);
 const colours={en:["White","Black","Red","Blue","Green","Beige"],fr:["Blanc","Noir","Rouge","Bleu","Vert","Beige"],ln:["Mpembe","Moindo","Motane","Bleu","Vert","Beige"],sw:["Nyeupe","Nyeusi","Nyekundu","Bluu","Kijani","Beige"]};
 const options:Record<string,string[]>={...presets,colour:colours[locale]};
 const [selected,setSelected]=useState<Record<string,string[]>>({}),[draft,setDraft]=useState<Record<string,string>>({});
 const names=(key:string)=>c[key as keyof typeof c]??key;
 const keys=[...recommended,...Object.keys(presets).filter(k=>!recommended.includes(k))];
 const dimensions=keys.filter(k=>selected[k]);
 const combinations=dimensions.reduce<Record<string,string>[]>((values,key)=>values.flatMap(value=>(selected[key]??[]).map(option=>({...value,[key]:option}))),[{}]);
 const ready=dimensions.length>0&&combinations.length>0&&combinations.length<=20;
 function toggle(key:string,value:string){const existing=selected[key]??[];setSelected({...selected,[key]:existing.includes(value)?existing.filter(x=>x!==value):[...existing,value]});}
 function generate(){
   if(!ready)return;
   const next=combinations.map(attributes=>{const label=Object.values(attributes).join(" / ");const previous=rows.find(r=>r.label===label);return {label,attributes,quantity:previous?.quantity??""};});
   // Preserve already-entered quantities and custom rows; never silently drop stock.
   const retained=rows.filter(r=>r.label.trim()&&!next.some(n=>n.label===r.label));
   if(next.length+retained.length>20)return;
   onChange([...retained,...next],dimensions.length===1&&["size","shoe_size","storage","volume"].includes(dimensions[0])?dimensions[0]:"option");
 }
 const option=(key:string)=><label key={key}><input type="checkbox" checked={!!selected[key]} disabled={!selected[key]&&dimensions.length>=3} onChange={event=>{const next={...selected};if(event.target.checked)next[key]=[];else delete next[key];setSelected(next);}}/>{names(key)}</label>;
 const problem=choiceError(rows,available),assigned=rows.reduce((sum,r)=>sum+(Number(r.quantity)||0),0);
 return <fieldset className="wz-choice-editor"><legend>{c.title}</legend><p>{c.suggested}</p>
   <div className="wz-choice-types">{recommended.map(option)}</div>
   <details className="wz-choice-more"><summary>{c.otherOptions}</summary><div className="wz-choice-types">{keys.filter(key=>!recommended.includes(key)).map(option)}</div></details>
   {dimensions.map(key=><div key={key} className="wz-choice-dimension"><strong>{names(key)}</strong><div className="wz-choice-chips">{[...new Set([...options[key],...selected[key]])].map(value=><button type="button" key={value} aria-pressed={selected[key].includes(value)} onClick={()=>toggle(key,value)}>{key==="shoe_size"?"EU ":""}{value}</button>)}</div><div className="wz-inline"><label>{c.value} · {names(key)}<input value={draft[key]??""} maxLength={40} onChange={e=>setDraft({...draft,[key]:e.target.value})} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();if(draft[key]?.trim()){toggle(key,draft[key].trim());setDraft({...draft,[key]:""});}}}}/></label><button type="button" disabled={!draft[key]?.trim()} onClick={()=>{toggle(key,draft[key].trim());setDraft({...draft,[key]:""});}}>{c.add}</button></div></div>)}
   <p>{c.limit}</p><button type="button" disabled={!ready||combinations.length+rows.filter(r=>r.label.trim()&&!combinations.some(a=>Object.values(a).join(" / ")===r.label)).length>20} onClick={generate}>{c.generate}{ready?` (${combinations.length})`:""}</button>
   {available!=null&&<p className="wz-choice-balance" role="status">{c.total}: <strong>{available}</strong> · {c.assigned}: {assigned} · {c.remaining}: {available-assigned}</p>}
   {rows.map((row,index)=><div className="wz-inline wz-choice-row" key={index}><label>{c.choice}<input required value={row.label} onChange={event=>onChange(rows.map((r,i)=>i===index?{...r,label:event.target.value,attributes:undefined}:r))}/></label><label>{c.quantity}<input type="number" min="0" step="1" required={available!=null} value={row.quantity} onChange={event=>onChange(rows.map((r,i)=>i===index?{...r,quantity:event.target.value}:r))}/></label><button type="button" onClick={()=>onChange(rows.filter((_,i)=>i!==index))}>{c.remove}</button></div>)}
   <button type="button" disabled={rows.length>=20} onClick={()=>onChange([...rows,{label:"",quantity:""}],"option")}>{c.manual}</button>
   {problem&&(!optional||rows.length>0)&&<p role="status">{c[problem]}</p>}<p>{c.saved}</p>
 </fieldset>;
}
