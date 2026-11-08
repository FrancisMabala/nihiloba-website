'use client';
import {useEffect, useId, useState} from 'react';

/** Editable suggestions preserve the canonical backend's location validation. */
export function ApartmentCommune({label,value,options,onChange}:{label:string;value:string;options:readonly string[];onChange:(value:string)=>void}) {
 const id=useId(), [open,setOpen]=useState(false), [active,setActive]=useState(-1);
 const matches=options.filter(option=>option.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
 useEffect(()=>{if(open&&active>=0)document.getElementById(`${id}-${active}`)?.scrollIntoView({block:'nearest'});},[id,open,active]);
 return <label className="apt-commune"><span>{label}<b className="apt-required" aria-hidden="true"> *</b></span>
  <input role="combobox" aria-label={label} required maxLength={100} autoComplete="off" value={value}
   aria-expanded={open} aria-controls={id} aria-autocomplete="list" aria-activedescendant={open&&active>=0?`${id}-${active}`:undefined}
   onFocus={()=>setOpen(true)} onBlur={()=>{setOpen(false);setActive(-1);}}
   onChange={event=>{onChange(event.target.value);setOpen(true);setActive(-1);}}
   onKeyDown={event=>{
    if(event.key==='Escape'){event.preventDefault();setOpen(false);setActive(-1);}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setOpen(true);setActive(index=>matches.length?(index<0?(event.key==='ArrowDown'?0:matches.length-1):(index+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length):-1);}
    if(event.key==='Enter'&&open&&active>=0&&matches[active]){event.preventDefault();onChange(matches[active]);setOpen(false);setActive(-1);}
   }}/>
  {open&&matches.length>0&&<span id={id} role="listbox" aria-label={label} className="apt-commune-options">{matches.map((option,index)=><span id={`${id}-${index}`} key={option} role="option" aria-selected={option===value} className={index===active?'is-active':undefined} onMouseDown={event=>event.preventDefault()} onClick={()=>{onChange(option);setOpen(false);setActive(-1);}}>{option}</span>)}</span>}
 </label>;
}
