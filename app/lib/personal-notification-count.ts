import {useSyncExternalStore} from 'react';

let current:{binding:string;count:number|null}|null=null;
const listeners=new Set<()=>void>();
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
