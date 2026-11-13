"use client";
import {useState} from "react";
import {counterCopy} from "../../lib/services-counter-copy";
import type {ProviderLocale} from "../../lib/services-provider-copy";
import type {Line,Offering} from "./services-counter";

export function CounterPicker({offerings,locale,currency,hasLines,onAdd,editLine,onCancel}:{
 offerings:Offering[];locale:ProviderLocale;currency:string;hasLines:boolean;
 onAdd:(service:Offering,pack:Offering["packages"][number]|undefined,price:string,currency:string,quantity:number)=>boolean;
 editLine?:Line;onCancel:()=>void;
}){
 const t=counterCopy[locale],active=offerings.filter(s=>s.is_active==="yes");
 const [expanded,setExpanded]=useState(editLine?.offering_ref??"");
 const [choice,setChoice]=useState(editLine?.package_ref??(editLine?editLine.offering_ref:""));
 const [agreed,setAgreed]=useState(editLine?.unit_price??"");
 const [unit,setUnit]=useState(currency),[quantity,setQuantity]=useState(editLine?.quantity??1);
 const settingsPath=(locale==="en"?"":"/"+locale)+"/shida/seller/services/?view=services";
 function reset(){setChoice("");setAgreed("");setQuantity(1);}
 return <section className="svc-counter-picker"><h2>{t.choose}</h2>
  {!active.length&&<><p>{t.noServices}</p><a href={settingsPath}>{t.addService}</a></>}
  {active.map(service=>{
   const open=expanded===service.public_ref;
   const options: (Offering["packages"][number]|undefined)[]=[...service.packages,undefined];
   return <div key={service.public_ref} className="svc-counter-offering">
    <button type="button" aria-expanded={open} onClick={()=>{setExpanded(open?"":service.public_ref);reset();if(!open&&!service.packages.length)setChoice(service.public_ref);}}>
     <span className="svc-counter-initial" aria-hidden="true">{service.service_name.slice(0,1)}</span>{service.service_name}<span aria-hidden="true">{open?"⌃":"⌄"}</span>
    </button>
    {open&&options.map(pack=>{
     const ref=pack?.public_ref??service.public_ref,selected=choice===ref;
     const listed=(pack?.price??"").replace(/[ \u00a0\u202f]/g,"").replace(",",".");
     const fixed=/^\d{1,16}(?:\.\d{1,2})?$/.test(listed),code=pack?.currency??(hasLines?currency:unit);
     const mismatch=hasLines&&code!==currency;
     const starting=!pack&&service.packages.find(p=>p.price!=null);
     const label=pack?.name??(service.packages.length?t.custom:service.service_name);
     function add(){if(onAdd(service,pack,fixed?listed:agreed,code,quantity))reset();}
     return <div key={ref} className="svc-counter-option" data-selected={selected}>
      <button type="button" disabled={mismatch} aria-pressed={selected} onClick={()=>{setChoice(ref);setAgreed("");if(fixed&&!editLine){if(onAdd(service,pack,listed,code,1))setQuantity(1);}}}>
       <span>{label}</span><span>{fixed?pack!.price+" "+code:pack?.price|| (starting?t.from+" "+starting.price+" "+starting.currency:t.quote)}</span>
      </button>
      {mismatch&&<small>{t.mismatch} {currency}.</small>}
      {selected&&!mismatch&&(!fixed||editLine)&&<div className="svc-counter-agreed">
       {!fixed&&<><label>{t.agreed}<input autoFocus inputMode="decimal" value={agreed} onChange={e=>setAgreed(e.target.value)}/></label>
        {!pack?.currency&&<label>{t.currency}<select value={hasLines?currency:unit} disabled={hasLines} onChange={e=>setUnit(e.target.value)}><option>CDF</option><option>USD</option></select></label>}</>}
       {editLine&&<label>{t.quantity}<input type="number" min="1" max="100" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label>}
       <button type="button" onClick={add}>{editLine?t.confirm:t.add}</button>
      </div>}
     </div>;
    })}
   </div>;
  })}
  {editLine&&<button type="button" onClick={onCancel}>{t.back}</button>}
 </section>;
}
