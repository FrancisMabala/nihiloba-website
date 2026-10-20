"use client";
import {useEffect,useRef,useState} from "react";
import {PERSONAL_SESSION_EVENT} from "./personal-session-browser";

export type FinancialCommand={path:string;method:string;body:string;key?:string};
export type FinancialStatus=""|"saved"|"uncertain"|"stale"|"denied"|"invalid"|"offline";
export async function financialRequest<T>(binding:string,path:string,method="GET",body?:string,key?:string):Promise<T>{
 const response=await fetch(path,{method,credentials:"include",cache:"no-store",signal:AbortSignal.timeout(20000),
  headers:{Accept:"application/json","X-Shida-Session":binding,...(body?{"Content-Type":"application/json"}:{}),...(key?{"Idempotency-Key":key}:{})},body});
 if(!response.ok)throw new Error(String(response.status));
 return response.json() as Promise<T>;
}
/** Mount within an exact account / owner / booking key. Never persist private drafts. */
export function useFinancialCommand(binding:string){
 const [pending,setPending]=useState<FinancialCommand|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState<FinancialStatus>("");
 const alive=useRef(true),lock=useRef(false),envelope=useRef<FinancialCommand|null>(null);
 const revoked=useRef(false);
 useEffect(()=>{
  alive.current=true;
  const invalidate=()=>{revoked.current=true;envelope.current=null;setPending(null);setStatus("denied");};
  const storage=(event:StorageEvent)=>{if(event.key===PERSONAL_SESSION_EVENT)invalidate();};
  window.addEventListener(PERSONAL_SESSION_EVENT,invalidate);window.addEventListener("storage",storage);
  return()=>{alive.current=false;window.removeEventListener(PERSONAL_SESSION_EVENT,invalidate);window.removeEventListener("storage",storage);};
 },[]);
 async function run<T>(next?:FinancialCommand):Promise<T|undefined>{
  if(lock.current||status==="denied"||revoked.current)return;
  if(!navigator.onLine){setStatus("offline");return;}
  const command=envelope.current??next;if(!command)return;
  envelope.current=command;setPending(command);lock.current=true;setBusy(true);setStatus("");
  try{
   const result=await financialRequest<T>(binding,command.path,command.method,command.body,command.key);
   if(!alive.current||revoked.current)return;
   envelope.current=null;setPending(null);setStatus("saved");return result;
  }catch(error){
   if(!alive.current||revoked.current)return;
   const code=error instanceof Error?Number(error.message):0;
   if(code>=400&&code<500&&code!==408){
    envelope.current=null;setPending(null);setStatus([401,403,404].includes(code)?"denied":code===409?"stale":"invalid");
   }else setStatus("uncertain");
  }finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 return {run,pending,busy,status,clear:()=>setStatus("")};
}
