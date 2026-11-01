"use client";
import {useEffect,useState} from "react";
import {managedActivities,dashboardActivities,type ManagedActivity} from "./personal-activities";
export type ActivityData={binding:string;items:ManagedActivity[];options:ManagedActivity['market'][];failed:boolean;loaded:ManagedActivity['market'][];more:boolean;markets:string[];business:boolean};
export function usePersonalActivityData(binding:string|null,restaurantPages=1,revision=0){
 const [data,setData]=useState<ActivityData|null>(null);
 useEffect(()=>{
  if(!binding)return;
  let active=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  const read=async(path:string)=>{const response=await fetch(`/api/shida/personal/${path}`,{signal:controller.signal,cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding}});if(!response.ok)throw Error('Unavailable activities');return response.json();};
  const lists=Promise.allSettled([
   Promise.all([read('wenze/stores/?archived=false'),read('wenze/stores/?archived=true')]).then(([current,archived])=>managedActivities('wenze',{stores:[...current.stores,...archived.stores]})),
   Promise.all(Array.from({length:restaurantPages},(_,i)=>read(`restaurants/?page=${i+1}&page_size=20`))).then(pages=>managedActivities('restaurants',{...pages[0],items:pages.flatMap(page=>page.items)})),
   Promise.all([read('services/'),read('services/capabilities/')]).then(([value,policy])=>managedActivities('services',value,policy))
  ]);
  const navigation=read('security/navigation/').then(value=>{if(!Array.isArray(value.markets)||typeof value.organization_management!=='boolean')throw Error('Unavailable permissions');return value;});
  void Promise.allSettled([lists,navigation]).then(([results,overview])=>{
   if(!active||results.status!=='fulfilled')return;
   const values=results.value;
   setData({binding,items:dashboardActivities(values.flatMap(r=>r.status==='fulfilled'?r.value.items:[])),loaded:values.flatMap((r,i)=>r.status==='fulfilled'?[(['wenze','restaurants','services'] as const)[i]]:[]),options:values.flatMap((r,i)=>r.status==='fulfilled'&&(r.value.setup||i===0)?[(['wenze','restaurants','services'] as const)[i]]:[]),failed:values.some(r=>r.status==='rejected')||overview.status==='rejected',more:values.some(r=>r.status==='fulfilled'&&r.value.more),markets:overview.status==='fulfilled'?overview.value.markets:[],business:overview.status==='fulfilled'&&overview.value.organization_management});
  }).finally(()=>clearTimeout(timer));
  return()=>{active=false;controller.abort();clearTimeout(timer);};
 },[binding,revision,restaurantPages]);
 return data?.binding===binding?data:null;
}
