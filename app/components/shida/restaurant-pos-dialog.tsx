'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
export function RestaurantPosDialog({open,title,back,busy,onClose,children}:{open:boolean;title:string;back:string;busy:boolean;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null),previous=useRef<HTMLElement|null>(null);
 useEffect(()=>{const dialog=ref.current;if(open&&!dialog?.open){previous.current=document.activeElement as HTMLElement;dialog?.showModal();}else if(!open&&dialog?.open){dialog.close();previous.current?.focus({preventScroll:true});}},[open]);
 useEffect(()=>{const dialog=ref.current;return()=>{dialog?.close();previous.current?.focus({preventScroll:true});};},[]);
 return <dialog ref={ref} className="rst-pos-dialog" aria-label={title} onCancel={event=>{event.preventDefault();if(!busy)onClose();}}><button className="rst-pos-dialog-back" type="button" disabled={busy} onClick={onClose}>← {back}</button>{children}</dialog>;
}
export function RestaurantBasketPanel(props:Parameters<typeof RestaurantPosDialog>[0]){
 const [mobile,setMobile]=useState(false);
 useEffect(()=>{const query=matchMedia('(max-width:700px)');const update=()=>setMobile(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 return mobile?<RestaurantPosDialog {...props}/>:<>{props.children}</>;
}
