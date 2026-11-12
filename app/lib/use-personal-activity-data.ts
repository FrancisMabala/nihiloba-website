"use client";
import {useEffect,useState} from "react";
import {managedActivities,dashboardActivities,activityCounts,type ActivityCountKey,type ManagedActivity} from "./personal-activities";
import type {OverviewExtras} from "./overview-records";
export type ActivityData={overview?:OverviewExtras;counts?:Partial<Record<ActivityCountKey,number>>;binding:string;items:ManagedActivity[];options:ManagedActivity['market'][];failed:boolean;loaded:ManagedActivity['market'][];more:boolean;markets:string[];business:boolean};
export function usePersonalActivityData(binding:string|null,restaurantPages=1,revision=0,fullOverview=false){
 const [data,setData]=useState<ActivityData|null>(null);
 useEffect(()=>{
  if(!binding)return;
  let active=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  const read=async(path:string)=>{const response=await fetch(`/api/shida/personal/${path}`,{signal:controller.signal,cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding}});if(!response.ok)throw Error('Unavailable activities');return response.json();};
  async function restaurants(){
    const pages=await Promise.all(Array.from({length:restaurantPages},(_,i)=>read(`restaurants/?page=${i+1}&page_size=20`)));
    if(fullOverview){
      const total=Number(pages[0].total);
      for(let page=pages.length+1;page<=Math.ceil(total/20);page++){
        pages.push(await read(`restaurants/?page=${page}&page_size=20`));
      }
    }
    return managedActivities('restaurants',{...pages[0],items:pages.flatMap(page=>page.items)});
  }
  async function properties(){
    const rows=[];
    for(let page=1;;page++){
      const batch=await read('apartments/manage/?page='+page);
      if(!Array.isArray(batch.items))throw Error('Unavailable properties');
      rows.push(...batch.items);
      if(!batch.has_more)return rows;
      if(!batch.items.length)throw Error('Incomplete properties');
    }
  }
  const lists=Promise.allSettled([
   Promise.all([read('wenze/stores/?archived=false'),read('wenze/stores/?archived=true')]).then(([current,archived])=>managedActivities('wenze',{stores:[...current.stores,...archived.stores]})),
   restaurants(),
   Promise.all([read('services/'),read('services/capabilities/')]).then(([value,policy])=>managedActivities('services',value,policy))
  ]);
  const navigation=read('security/navigation/').then(value=>{if(!Array.isArray(value.markets)||typeof value.organization_management!=='boolean')throw Error('Unavailable permissions');return value;});
  const catalogue=fullOverview?read('job-offer/?kind=catalogue').then(value=>{
    if(!Array.isArray(value.rows))throw Error('Unavailable listings');return value.rows;
  }):Promise.resolve([]);
  void Promise.allSettled([lists,navigation,catalogue,fullOverview?properties():Promise.resolve([])] as const).then(([results,overview,jobs,homes])=>{
   if(!active||results.status!=='fulfilled')return;
   const values=results.value;
   const hints=overview.status==='fulfilled'?overview.value:null;
   const extras=fullOverview?{listings:jobs.status==='fulfilled'?jobs.value:[],properties:homes.status==='fulfilled'?homes.value:[],
     travel:hints?.travel_profiles??[],seeker:hints?.has_candidate_profile}:undefined;
   setData({binding,overview:extras,counts:overview.status==='fulfilled'?activityCounts(overview.value.activity_counts):{},items:dashboardActivities(values.flatMap(r=>r.status==='fulfilled'?r.value.items:[])),loaded:values.flatMap((r,i)=>r.status==='fulfilled'?[(['wenze','restaurants','services'] as const)[i]]:[]),options:values.flatMap((r,i)=>r.status==='fulfilled'&&(r.value.setup||i===0)?[(['wenze','restaurants','services'] as const)[i]]:[]),failed:values.some(r=>r.status==='rejected')||overview.status==='rejected'||jobs.status==='rejected'||homes.status==='rejected'||(fullOverview&&!Array.isArray(hints?.travel_profiles)&&hints?.markets?.some((m:string)=>m==='hotels'||m==='wewa')),more:values.some(r=>r.status==='fulfilled'&&r.value.more),markets:overview.status==='fulfilled'?overview.value.markets:[],business:overview.status==='fulfilled'&&overview.value.organization_management});
  }).finally(()=>clearTimeout(timer));
  return()=>{active=false;controller.abort();clearTimeout(timer);};
 },[binding,revision,restaurantPages,fullOverview]);
 return data?.binding===binding?data:null;
}
