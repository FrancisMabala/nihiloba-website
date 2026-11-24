import {useSyncExternalStore} from 'react';

let current:{binding:string;count:number|null}|null=null;
const listeners=new Set<()=>void>();
const pendingCounts=new Map<string,Promise<number|null|undefined>>();
/** Share only concurrent reads for the exact session and API context. A fresh
 * post-mutation read supersedes older responses; no settled result is cached. */
export function readNotificationCount(apiBase:string,binding:string,load:()=>Promise<{unread_count?:unknown}>,fresh=false):Promise<number|null|undefined>{
 const key=JSON.stringify([apiBase,binding]);
 if(!fresh&&pendingCounts.has(key))return pendingCounts.get(key)!;
 const pending:Promise<number|null|undefined>=Promise.resolve().then(load).then(data=>{
  if(pendingCounts.get(key)!==pending)return undefined;
  return typeof data?.unread_count==='number'&&Number.isSafeInteger(data.unread_count)&&data.unread_count>=0?data.unread_count:null;
 },()=>pendingCounts.get(key)===pending?null:undefined).finally(()=>{if(pendingCounts.get(key)===pending)pendingCounts.delete(key);});
 pendingCounts.set(key,pending);return pending;
}
function subscribe(listener:()=>void){
 listeners.add(listener);
 return ()=>{listeners.delete(listener);};
}
export function publishPersonalNotificationCount(binding:string,count:number|null){
 if(current?.binding===binding&&current.count===count)return;
 current={binding,count};
 listeners.forEach(listener=>listener());
}
export function usePersonalNotificationCount(binding?:string){
 return useSyncExternalStore(subscribe,()=>current&&current.binding===binding?current.count:null,()=>null);
}
