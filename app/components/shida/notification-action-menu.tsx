'use client';
import {useEffect,useId,useRef,useState} from 'react';

/** Small action menu: independent of the notification's destination link. */
export function NotificationActionMenu({label,disabled,actions,onAction}:{label:string;disabled:boolean;actions:string[];onAction:(action:string)=>void}){
 const [open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),id=useId();
 useEffect(()=>{if(!open)return;
  const menu=root.current?.querySelector<HTMLElement>('[role=menu]');
  if(menu){const viewport=window.visualViewport,bottom=viewport?viewport.offsetTop+viewport.height:window.innerHeight;
   const boundary=Array.from(document.querySelectorAll('nav')).filter(n=>getComputedStyle(n).position==='fixed').map(n=>n.getBoundingClientRect()).filter(r=>r.height>0&&r.top>bottom/2).reduce((end,r)=>Math.min(end,r.top),bottom);
   if(menu.getBoundingClientRect().bottom>boundary){menu.style.top='auto';menu.style.bottom='100%';}
  }
  root.current?.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus({preventScroll:true});
  const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);
 },[open]);
 function close(){setOpen(false);trigger.current?.focus();}
 return <div ref={root} className="notice-menu" onKeyDown={e=>{
  if(e.key==='Escape'){e.stopPropagation();e.preventDefault();close();}
  if(e.key==='Tab'){close();return;}
  if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();
  if(!open){setOpen(true);return;}
  const buttons=Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]')??[]),index=buttons.indexOf(document.activeElement as HTMLButtonElement);
  buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
 }}><button ref={trigger} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open?id:undefined} disabled={disabled} onClick={()=>setOpen(v=>!v)}>⋯</button>
 {open&&<div id={id} role="menu" aria-label={label} className="notice-menu-items">{actions.map(action=><button type="button" role="menuitem" key={action} onClick={()=>{close();onAction(action);}}>{action}</button>)}</div>}</div>;
}
