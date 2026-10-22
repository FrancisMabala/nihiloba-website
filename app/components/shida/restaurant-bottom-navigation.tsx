"use client";
import {useRef} from 'react';
import {counterCopy} from '../../lib/restaurant-counter-copy';
import {restaurantWorkspaceGroups} from '../../lib/restaurant-workspace-navigation';
export function RestaurantBottomNavigation({locale,tab,sell,disabled,items,onOpen}:{locale:'fr'|'en'|'ln'|'sw';tab:string;sell:string;disabled:boolean;items:{key:string;label:string}[];onOpen:(key:string)=>void}){
 const c=counterCopy(locale),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const primary=['today',sell,'orders'];
 return <><nav className="rst-bottom-nav" aria-label={c.menu}>{primary.filter(key=>items.some(i=>i.key===key)).map(key=><button type="button" disabled={disabled} aria-current={tab===key?'page':undefined} key={key} onClick={()=>onOpen(key)}>{key===sell?c.sell:items.find(item=>item.key===key)!.label}</button>)}<button ref={trigger} type="button" disabled={disabled} aria-haspopup="dialog" aria-current={!primary.includes(tab)?'page':undefined} onClick={()=>dialog.current?.showModal()}>{c.more}</button></nav><dialog ref={dialog} className="rst-choice rst-more" aria-labelledby="restaurant-tools-title" onClose={()=>trigger.current?.focus()}><header><h2 id="restaurant-tools-title">{c.more}</h2><button type="button" aria-label={c.close} onClick={()=>dialog.current?.close()}>×</button></header>{restaurantWorkspaceGroups(locale).map(group=>{const entries=items.filter(item=>group.keys.includes(item.key)&&!primary.includes(item.key));return entries.length?<section key={group.label}><h3>{group.label}</h3>{entries.map(item=><button type="button" key={item.key} aria-current={tab===item.key?'page':undefined} onClick={()=>{dialog.current?.close();onOpen(item.key);}}>{item.label}</button>)}</section>:null;})}</dialog></>;
}
