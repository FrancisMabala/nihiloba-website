import {useId,useState} from 'react';
import {shopText} from '../../lib/wenze-shop-copy';
import type {WenzeLocale} from '../../lib/wenze-copy';
import {searchName} from './registration-quartier';
import './wenze-address-selector.css';

export const deliveryZones=(value:string)=>[...new Set(value.split(/[,\n]/).map(s=>s.trim()).filter(Boolean))];
export function DeliveryZones({value,options,locale,remove,change}:{value:string;options:string[];locale:WenzeLocale;remove:string;change:(v:string)=>void}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');
 const id=useId(),zones=deliveryZones(value),t=(k:string)=>shopText(locale,k);
 const summary=zones.length?t(zones.length===1?'oneZone':'selectedZones').replace('{n}',String(zones.length)):t('chooseZones');
 function toggle(name:string){change((zones.includes(name)?zones.filter(v=>v!==name):[...zones,name]).join('\n'));}
 return <div className="ws-zone-picker" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);document.getElementById(id)?.focus();}}}>
  <label htmlFor={id}>{t('zones')}</label><button type="button" id={id} aria-expanded={open} onClick={()=>{setQuery('');setOpen(!open);}}>{summary} <span aria-hidden="true">▾</span></button>
  {open&&<div className="ws-zone-menu"><input type="search" aria-label={t('searchZones')} placeholder={t('searchZones')} value={query} onChange={e=>setQuery(e.target.value)}/>
  <div className="ws-choice-list">{options.filter(z=>searchName(z).includes(searchName(query))).map(z=><label key={z}><input type="checkbox" checked={zones.includes(z)} onChange={()=>toggle(z)}/>{z}</label>)}</div></div>}
  <div className="ws-zone-tags">{zones.map(z=><button type="button" key={z} aria-label={remove+' '+z} onClick={()=>toggle(z)}>{z} ×</button>)}</div>
 </div>;
}
