'use client';
import {useId,useState} from 'react';
import areas from '../../lib/registration/kinshasa-quartiers.json';
import type {RegistrationLocale} from '../../lib/registration/copy';
import {addressCopy} from '../../lib/registration/address-copy';

export const searchName=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const communeKey=(name:string)=>searchName(name).replace(/[^a-z]/g,'');
const directory=new Map(Object.entries(areas).map(([commune,names])=>[communeKey(commune),names]));
export const quartiersFor=(commune:string)=>directory.get(communeKey(commune))??[];
// The source directory is indicative. Manual input preserves names absent from the reference.
export function RegistrationQuartier({commune,value,onChange,locale,required=false}:{commune:string;value:string;onChange:(v:string)=>void;locale:RegistrationLocale;required?:boolean}){
 const id=useId(),[open,setOpen]=useState(false);
 const matches=quartiersFor(commune).filter(name=>searchName(name).includes(searchName(value)));
 const prompt={fr:'Choisir ou saisir un quartier',en:'Choose or enter a quartier',ln:'Pona to koma quartier',sw:'Chagua au andika mtaa'}[locale];
 return <div className="ws-search-choice" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}>
  <label htmlFor={id}>{addressCopy[locale].quartier}</label><input id={id} value={value} required={required} disabled={!commune}
   autoComplete="off" maxLength={500} placeholder={prompt} onFocus={()=>setOpen(true)} onChange={e=>{onChange(e.target.value);setOpen(true);}}/>
  {open&&matches.length>0&&<div className="ws-choice-list">{matches.map(name=><button type="button" key={name} onClick={()=>{onChange(name);setOpen(false);}}>{name}</button>)}<small><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a></small></div>}
 </div>;
}
