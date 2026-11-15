'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
function restoreFocus(previous:HTMLElement|null,owner:Element|null){const target=previous?.isConnected&&previous.matches('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]')&&previous.getClientRects().length?previous:owner?.querySelector<HTMLElement>('.rst-pos-success button')??owner?.querySelector<HTMLElement>('.rst-pos-queues button');target?.focus({preventScroll:true});}
export function RestaurantPosDialog({open,title,back,close,busy,onClose,children}:{open:boolean;title:string;back?:string;close?:string;busy:boolean;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null),previous=useRef<HTMLElement|null>(null),owner=useRef<Element|null>(null);
 useEffect(()=>{const dialog=ref.current;if(open&&!dialog?.open){previous.current=document.activeElement as HTMLElement;owner.current=dialog?.closest('.rst-selling')??null;dialog?.showModal();}else if(!open&&dialog?.open){dialog.close();restoreFocus(previous.current,owner.current);}},[open]);
 useEffect(()=>{const dialog=ref.current;return()=>{dialog?.close();restoreFocus(previous.current,owner.current);};},[]);
 return <dialog ref={ref} className="rst-pos-dialog" aria-label={title} onCancel={event=>{event.preventDefault();if(!busy)onClose();}}><header className="rst-pos-dialog-heading"><h2>{title}</h2><button type="button" aria-label={close??back??title} disabled={busy} onClick={onClose}>×</button></header>{back&&<button className="rst-pos-dialog-back" type="button" disabled={busy} onClick={onClose}>← {back}</button>}{children}</dialog>;
}
export function RestaurantBasketPanel(props:Parameters<typeof RestaurantPosDialog>[0]){
 const [mobile,setMobile]=useState(false);
 useEffect(()=>{const query=matchMedia('(max-width:700px)');const update=()=>setMobile(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 return mobile?<RestaurantPosDialog {...props}/>:<>{props.children}</>;
}
