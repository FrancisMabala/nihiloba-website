"use client";
import {useEffect,useRef,useState,useId} from "react";
import {wenzeUX} from "./wenze-ux-copy";
import type {WenzeLocale} from "./wenze-copy";
import {draftUX} from './draft-ux-copy';
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
export function WenzeLeaveDialog({locale,onSave,title}:{locale:WenzeLocale;onSave?:()=>Promise<void>;title?:string}){
 const c=draftUX[locale], [choice,setChoice]=useState('keep'),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),pending=useRef<((value:boolean)=>void)|null>(null),[open,setOpen]=useState(false),id=useId();
 const finish=(value:boolean)=>{pending.current?.(value);pending.current=null;dialog.current?.close();setOpen(false);};
 useEffect(()=>{const listener=(event:Event)=>{event.preventDefault();pending.current?.(false);pending.current=(event as CustomEvent<(value:boolean)=>void>).detail;setChoice("keep");setError("");setOpen(true);};window.addEventListener("wenze-leave",listener);return()=>{window.removeEventListener("wenze-leave",listener);pending.current?.(false);};},[]);
 useEffect(()=>{if(open)dialog.current?.showModal();},[open]);
 async function proceed(){if(saving)return;if(choice==='keep')return finish(false);if(choice==='save'){setSaving(true);setError('');try{await onSave?.();finish(true);}catch{setError(c.failed);}finally{setSaving(false);}}else finish(true);}
 if(onSave)return <dialog ref={dialog} className="wz-confirm qs-leave-dialog" aria-labelledby={id} onCancel={e=>{e.preventDefault();if(!saving)finish(false);}}><h2 id={id}>{title??c.leave}</h2><p>{c.help}</p><fieldset disabled={saving}>{(['keep','save','discard'] as const).map(key=><label key={key} className={`qs-leave-choice qs-leave-${key}`}><input autoFocus={key==='keep'} type="radio" name={id} checked={choice===key} onChange={()=>setChoice(key)}/><span>{c[key]}{key==='discard'&&<small>{c.discardHelp}</small>}</span></label>)}</fieldset>{error&&<p role="alert">{error}</p>}<div className="wz-actions"><button disabled={saving} onClick={()=>finish(false)}>{c.cancel}</button><button className="seller-primary" disabled={saving} onClick={()=>void proceed()}>{saving?wenzeUX(locale,'saving'):c.continue}</button></div></dialog>;
 return <dialog ref={dialog} className="wz-confirm" aria-labelledby={id} onCancel={e=>{e.preventDefault();finish(false);}}><h2 id={id}>{wenzeUX(locale,"unsaved")}</h2><p>{wenzeUX(locale,"leaveHelp")}</p><div className="wz-actions"><button autoFocus onClick={()=>finish(false)}>{wenzeUX(locale,"keep")}</button><button onClick={()=>finish(true)}>{wenzeUX(locale,"discard")}</button></div></dialog>;
}
