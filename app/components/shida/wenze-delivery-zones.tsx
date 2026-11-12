import {useId,useState} from "react";

export const deliveryZones=(value:string)=>[...new Set(value.split(/[,\n]/).map(s=>s.trim()).filter(Boolean))];

export function DeliveryZones({value,options,label,add,remove,change}:{value:string;options:string[];label:string;add:string;remove:string;change:(value:string)=>void}){
 const [query,setQuery]=useState("");
 const id=useId(), zones=deliveryZones(value);
 function append(){
  const text=query.trim();
  if(!text)return;
  change([...new Set([...zones,...deliveryZones(text)])].join("\n"));
  setQuery("");
 }
 return <div className="ws-zone-picker"><label>{label}<input list={id} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();append();}}}/></label>
 <datalist id={id}>{options.filter(z=>!zones.includes(z)).map(z=><option key={z} value={z}/>)}</datalist>
 <button type="button" disabled={!query.trim()} onClick={append}>{add}</button>
 <div>{zones.map(z=><button type="button" aria-label={remove+" "+z} key={z} onClick={()=>change(zones.filter(v=>v!==z).join("\n"))}>{z} ×</button>)}</div></div>;
}
