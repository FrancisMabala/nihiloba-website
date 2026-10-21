"use client";
import {useEffect,useRef,useState,useId} from "react";
import {wenzeUX} from "./wenze-ux-copy";
import type {WenzeLocale} from "./wenze-copy";
const drafts=new Set<symbol>();
export function useWorkDraft(dirty:boolean,_message:string){
 void _message;
 const id=useRef(Symbol("wenze-draft"));
 useEffect(()=>{const key=id.current;if(dirty)drafts.add(key);else drafts.delete(key);return()=>{drafts.delete(key);};},[dirty]);
 useEffect(()=>{if(!dirty)return;const unload=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener("beforeunload",unload);return()=>window.removeEventListener("beforeunload",unload);},[dirty]);
}
export function leaveWork():Promise<boolean>{
 if(!drafts.size)return Promise.resolve(true);
 return new Promise(resolve=>{const event=new CustomEvent("wenze-leave",{cancelable:true,detail:resolve});if(window.dispatchEvent(event))resolve(false);});
}
export function WenzeLeaveDialog({locale}:{locale:WenzeLocale}){
 const dialog=useRef<HTMLDialogElement>(null),pending=useRef<((value:boolean)=>void)|null>(null),[open,setOpen]=useState(false),id=useId();
 const finish=(value:boolean)=>{pending.current?.(value);pending.current=null;dialog.current?.close();setOpen(false);};
 useEffect(()=>{const listener=(event:Event)=>{event.preventDefault();pending.current?.(false);pending.current=(event as CustomEvent<(value:boolean)=>void>).detail;setOpen(true);};window.addEventListener("wenze-leave",listener);return()=>{window.removeEventListener("wenze-leave",listener);pending.current?.(false);};},[]);
 useEffect(()=>{if(open)dialog.current?.showModal();},[open]);
 return <dialog ref={dialog} className="wz-confirm" aria-labelledby={id} onCancel={e=>{e.preventDefault();finish(false);}}><h2 id={id}>{wenzeUX(locale,"unsaved")}</h2><p>{wenzeUX(locale,"leaveHelp")}</p><div className="wz-actions"><button autoFocus onClick={()=>finish(false)}>{wenzeUX(locale,"keep")}</button><button onClick={()=>finish(true)}>{wenzeUX(locale,"discard")}</button></div></dialog>;
}
