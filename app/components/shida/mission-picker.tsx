'use client';
import {useId,useState} from 'react';
export function MissionPicker({label,value,options,onChange,strict=false,id}:{label:string;value:string;options:string[];onChange:(v:string)=>void;strict?:boolean;id:string}){
 const [open,setOpen]=useState(false),[query,search]=useState(''),[active,select]=useState(-1);const list=useId();
 const shown=options.filter(v=>v.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const choose=(v:string)=>{onChange(v);search('');setOpen(false)};
 return <div className="mission-picker"><label htmlFor={id}>{label}</label><input id={id} maxLength={100} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={list} aria-activedescendant={open&&active>=0?list+'-'+active:undefined}
 value={open&&strict?query:value} onFocus={()=>{search('');setOpen(true);select(-1)}} onBlur={()=>{setOpen(false);search('')}} onChange={e=>{const v=e.target.value;search(v);if(!strict)onChange(v);else if(value)onChange('');setOpen(true);select(-1)}} onKeyDown={e=>{
 if(e.key==='Escape'){setOpen(false);return}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);const i=Math.max(0,Math.min(shown.length-1,active+(e.key==='ArrowDown'?1:-1)));select(i);document.getElementById(list+'-'+i)?.scrollIntoView({block:'nearest'})}else if(e.key==='Enter'&&open){e.preventDefault();if(shown[active])choose(shown[active]);else if(!strict)setOpen(false)}}}/>
 {open&&<div className="mission-list" role="listbox" id={list} aria-label={label}>{shown.map((v,i)=><button type="button" role="option" id={list+'-'+i} aria-selected={value===v} tabIndex={-1} key={v} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(v)}>{v}</button>)}</div>}</div>
}