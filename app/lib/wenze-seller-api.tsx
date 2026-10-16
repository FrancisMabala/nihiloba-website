"use client";
import {createContext,useContext,useMemo,useRef,useEffect,type ReactNode} from 'react';
export class DashboardApiError extends Error {constructor(public kind:string,public status:number,public detail?:string){super(kind);}}
type Api={request:(path:string,init?:RequestInit)=>Promise<unknown>;download:(path:string)=>Promise<void>};
const Context=createContext<Api|null>(null);
export function personalWenzePath(path:string){
 const clean=path.replace(/^wenze\/contexts\/personal\//,'');
 if(clean===path&&path.startsWith('wenze/'))throw new Error('Personal context required');
 const [name,query]=clean.split('?');return `/api/shida/personal/wenze/${name.replace(/\/$/,'')}/${query?'?'+query:''}`;
}
export function WenzeApiProvider({binding,onUnauthorized,children}:{binding:string;onUnauthorized:()=>void;children:ReactNode}){
 const failed=useRef(onUnauthorized);useEffect(()=>{failed.current=onUnauthorized;},[onUnauthorized]);
 const api=useMemo<Api>(()=>{
  // An ambiguous keyed command is retried with its original key and payload.
  const pending=new Map<string,{key:string;body:string}>();
  async function fetchPrivate(path:string,init:RequestInit={}){
   const mutation=!!init.method&&init.method!=='GET';const slot=`${init.method}:${path}`;
   const body=typeof init.body==='string'?init.body:'{}';
   let operation=pending.get(slot);
   if(mutation){if(operation&&operation.body!==body)throw new DashboardApiError('conflict',409);operation??={key:crypto.randomUUID(),body};pending.set(slot,operation);}
   let response:Response;
   try{response=await fetch(personalWenzePath(path),{...init,cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(45000),headers:{Accept:'application/json','X-Shida-Session':binding,...(mutation?{'Content-Type':'application/json','Idempotency-Key':operation!.key}:{}),...init.headers},...(mutation?{body:operation!.body}:{})});}
   catch{throw new DashboardApiError('unavailable',503);}
   if(response.status<500)pending.delete(slot);
   if(response.status===401)failed.current();
   if(!response.ok){const data=await response.json().catch(()=>null);throw new DashboardApiError(response.status===409?'conflict':response.status===422?'validation':'unavailable',response.status,typeof data?.detail==='string'?data.detail:undefined);}
   return response;
  }
  return {request:async(path,init)=>{const response=await fetchPrivate(path,init);return response.json();},download:async(path)=>{const response=await fetchPrivate(path);const blob=await response.blob();const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=response.headers.get('content-disposition')?.match(/filename="?([^";]+)/)?.[1]??'wenze-report';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}};
 },[binding]);
 return <Context.Provider value={api}>{children}</Context.Provider>;
}
export function useWenzeApi(){const api=useContext(Context);if(!api)throw new Error('Wenze session required');return api;}
