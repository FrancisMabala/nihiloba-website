'use client';
import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';

type Option={value:string;label:string};
type Props={
 label:string; value:string; options:Option[]; prompt:string; invalid:boolean;
 onChange:(value:string)=>void; searchLabel?:string; allowCustom?:boolean;
};

export function CandidateSelector({label,value,options,prompt,invalid,onChange,searchLabel,allowCustom}:Props){
 const id=useId(),trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null),search=useRef<HTMLInputElement>(null);
 const [open,setOpen]=useState(false),[active,setActive]=useState(0),[above,setAbove]=useState(false),[query,setQuery]=useState('');
 const term=query.trim().toLocaleLowerCase();
 const filtered=options.filter(option=>option.label.toLocaleLowerCase().includes(term));
 if(allowCustom&&term&&!options.some(option=>option.label.toLocaleLowerCase()===term))filtered.push({value:query.trim(),label:query.trim()});
 function show(){
  const rect=trigger.current?.getBoundingClientRect();
  setAbove(Boolean(rect&&window.innerHeight-rect.bottom<190&&rect.top>window.innerHeight-rect.bottom));
  setQuery('');setActive(Math.max(0,options.findIndex(option=>option.value===value)));setOpen(true);
 }
 useEffect(()=>{if(open)search.current?.focus({preventScroll:true});},[open]);
 useEffect(()=>{if(open)panel.current?.querySelector('[data-active="true"]')?.scrollIntoView({block:'nearest'});},[open,active,query]);
 function close(){setOpen(false);trigger.current?.focus({preventScroll:true});}
 function choose(index:number){if(filtered[index]){onChange(filtered[index].value);close();}}
 function keydown(event:KeyboardEvent){
  if(event.key==='Escape'&&open){event.preventDefault();close();return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();if(!open)show();else setActive(index=>Math.max(0,Math.min(filtered.length-1,index+(event.key==='ArrowDown'?1:-1))));
  }else if(open&&(event.key==='Enter'||(event.key===' '&&event.target!==search.current))){event.preventDefault();choose(active);}
  else if(open&&event.target!==search.current&&['Home','End'].includes(event.key)){event.preventDefault();setActive(event.key==='Home'?0:filtered.length-1);}
 }
 const activeId=open&&filtered[active]?id+'-'+active:undefined;
 return <div className="candidate-select" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
  <label id={id} htmlFor={id+'-button'}>{label} *</label>
  <button type="button" id={id+'-button'} ref={trigger} role="combobox" aria-labelledby={id} aria-required="true" aria-invalid={invalid} aria-expanded={open} aria-controls={id+'-choices'} aria-activedescendant={activeId}
   onClick={()=>open?close():show()} onKeyDown={keydown}>{options.find(option=>option.value===value)?.label||value||prompt}<span aria-hidden="true">{open?'⌃':'⌄'}</span></button>
  {open&&<div className={'candidate-options'+(above?' above':'')}>
   {searchLabel&&<input ref={search} role="combobox" aria-expanded="true" aria-controls={id+'-choices'} aria-activedescendant={activeId} aria-label={searchLabel} placeholder={searchLabel} value={query} onChange={e=>{setQuery(e.target.value);setActive(0);}} onKeyDown={keydown}/>}
   <div role="listbox" id={id+'-choices'} ref={panel} aria-labelledby={id}>{filtered.map((option,index)=><div
    key={option.value} id={id+'-'+index} role="option" aria-selected={option.value===value} data-active={index===active} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(index)}>{option.label}{option.value===value&&<b aria-hidden="true">✓</b>}</div>)}</div>
  </div>}
 </div>;
}
