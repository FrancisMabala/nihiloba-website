'use client';
import {useRef} from 'react';
import {counterCopy} from '../../lib/restaurant-counter-copy';
export function RestaurantBottomNavigation({locale,tab,sell,disabled,items,onOpen}:{locale:'fr'|'en'|'ln'|'sw';tab:string;sell:string;disabled:boolean;items:{key:string;label:string}[];onOpen:(key:string)=>void}){
 const c=counterCopy(locale),dialog=useRef<HTMLDialogElement>(null);
 return <><nav className="rst-bottom-nav" aria-label={c.menu}>{[['today',c.home],['orders',c.orders],[sell,c.sell],['items',c.menu]].filter(([key])=>items.some(i=>i.key===key)).map(([key,label])=><button type="button" disabled={disabled} aria-current={tab===key?'page':undefined} key={key} onClick={()=>onOpen(key)}>{label}</button>)}<button type="button" disabled={disabled} onClick={()=>dialog.current?.showModal()}>{c.more}</button></nav><dialog ref={dialog} className="rst-choice rst-more"><header><h2>{c.more}</h2><button type="button" aria-label={c.close} onClick={()=>dialog.current?.close()}>×</button></header>{items.map(item=><button type="button" key={item.key} aria-current={tab===item.key?'page':undefined} onClick={()=>{dialog.current?.close();onOpen(item.key);}}>{item.label}</button>)}</dialog></>;
}
