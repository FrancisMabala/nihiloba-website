"use client";
import {useEffect,useRef,useState} from 'react';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
import {ConfirmationDialog,type ConfirmationOptions} from './confirmation-dialog';
const recovery={en:'The result could not be confirmed. Close this dialog and check the current record or use its recovery action before trying again.',fr:'Le résultat n’a pas pu être confirmé. Fermez cette fenêtre et vérifiez les données actuelles ou utilisez leur action de récupération avant de réessayer.',ln:'Tokoki kondimisa mbano te. Kanga fenêtre oyo mpe tala makambo ya sikoyo to salela bozongisi liboso ya komeka lisusu.',sw:'Matokeo hayakuweza kuthibitishwa. Funga dirisha hili na ukague rekodi ya sasa au utumie hatua yake ya kurejesha kabla ya kujaribu tena.'};
export function useWenzeConfirm(locale:WenzeLocale){
 const [content,setContent]=useState<ConfirmationOptions|null>(null);
 const resolve=useRef<((value:boolean)=>void)|null>(null);
 const finish=(value:boolean)=>{resolve.current?.(value);resolve.current=null;setContent(null);};
 useEffect(()=>()=>{resolve.current?.(false);resolve.current=null;},[]);
 const confirm=(title:string,help:string,work:()=>Promise<void>)=>new Promise<boolean>(done=>{
  if(resolve.current){done(false);return;}
  resolve.current=done;let failed=false;
  setContent({title,description:help,confirmLabel:title,severity:'warning',errorMessage:()=>recovery[locale],onConfirm:async()=>{
   // An uncertain write must use the existing recovery/reload path, never an automatic second mutation.
   if(failed)throw new Error('409');
   try{await work();finish(true);}catch(error){failed=true;throw error;}
  }});
 });
 return {confirm,confirmation:content?<ConfirmationDialog locale={locale} options={content} onClose={()=>finish(false)}/>:null};
}
