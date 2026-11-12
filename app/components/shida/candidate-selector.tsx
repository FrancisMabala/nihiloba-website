'use client';
import {useEffect,useId,useRef,useState} from 'react';

export function CandidateSelector({label, value, options, prompt, onChange, invalid}:{
 label:string; value:string; options:{value:string;label:string}[]; prompt:string;
 onChange:(value:string)=>void; invalid:boolean;
}){
 const id=useId(), trigger=useRef<HTMLButtonElement>(null), panel=useRef<HTMLDivElement>(null);
 const [open,setOpen]=useState(false),[active,setActive]=useState(0),[above,setAbove]=useState(false);
 const selected=options.findIndex(option=>option.value===value);
 function show(){
  const rect=trigger.current?.getBoundingClientRect();
  setAbove(Boolean(rect&&window.innerHeight-rect.bottom<190&&rect.top>window.innerHeight-rect.bottom));
  setActive(Math.max(0,selected));setOpen(true);
 }
 useEffect(()=>{if(open)panel.current?.children[active]?.scrollIntoView({block:'nearest'});},[open,active]);
 function choose(index:number){if(options[index])onChange(options[index].value);setOpen(false);}
 return <div className="candidate-select" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
  <label id={id} htmlFor={id+'-button'}>{label} *</label>
  <button type="button" id={id+'-button'} ref={trigger} role="combobox" aria-labelledby={id} aria-required="true" aria-invalid={invalid} aria-expanded={open} aria-controls={id+'-choices'} aria-activedescendant={open?id+'-'+active:undefined}
   onClick={()=>open?setOpen(false):show()} onKeyDown={event=>{
    if(event.key==='Escape'){event.preventDefault();setOpen(false);return;}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(!open)show();else setActive(index=>Math.max(0,Math.min(options.length-1,index+(event.key==='ArrowDown'?1:-1))));}
    if(open&&['Enter',' '].includes(event.key)){event.preventDefault();choose(active);}
    if(open&&['Home','End'].includes(event.key)){event.preventDefault();setActive(event.key==='Home'?0:options.length-1);}
   }}>{options[selected]?.label||value||prompt}<span aria-hidden="true">{open?'⌃':'⌄'}</span></button>
  {open&&<div role="listbox" id={id+'-choices'} ref={panel} aria-labelledby={id} className={'candidate-options'+(above?' above':'')}>{options.map((option,index)=><div
   key={option.value} id={id+'-'+index} role="option" aria-selected={index===selected} data-active={index===active} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(index)}>{option.label}{index===selected&&<b aria-hidden="true">✓</b>}</div>)}</div>}
 </div>;
}
