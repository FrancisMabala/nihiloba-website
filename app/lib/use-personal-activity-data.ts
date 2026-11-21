"use client";
import {useEffect,useState} from "react";
import {managedActivities,dashboardActivities,activityCounts,type ActivityCountKey,type ManagedActivity} from "./personal-activities";
import type {OverviewExtras} from "./overview-records";
import {readPersonalNavigation,type PersonalNavigation} from './personal-navigation-browser';
export type ActivityData={pending?:boolean;overview?:OverviewExtras;travel?:OverviewExtras['travel'];employerProfiles?:{offer_ref:string;title:string|null}[];employerProfilesMore?:boolean;counts?:Partial<Record<ActivityCountKey,number>>;binding:string;items:ManagedActivity[];options:ManagedActivity['market'][];failed:boolean;loaded:ManagedActivity['market'][];more:boolean;markets:string[];business:boolean};
export function usePersonalActivityData(binding:string|null,restaurantPages=1,revision=0,fullOverview=false,managementOnly=false,progressive=false){
 const requestKey=[restaurantPages,revision,fullOverview,managementOnly,progressive].join(':');
 const [data,setData]=useState<(ActivityData&{requestKey:string})|null>(null);
 useEffect(()=>{
  if(!binding)return;
  let active=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  const read=async(path:string)=>{const response=await fetch(`/api/shida/personal/${path}`,{signal:controller.signal,cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding}});if(!response.ok)throw Error('Unavailable activities');return response.json();};
  async function restaurants(){
    const pages=await Promise.all(Array.from({length:restaurantPages},(_,i)=>read(`restaurants/?page=${i+1}&page_size=20`)));
    if(fullOverview||managementOnly){
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
  const markets=['wenze','restaurants','services'] as const;
  const values:Partial<Record<ManagedActivity['market'],ReturnType<typeof managedActivities>>>={};
  let hints:PersonalNavigation|null=null,failed=false,pending=fullOverview?6:4;
  let listings:OverviewExtras['listings']=[],homes:OverviewExtras['properties']=[];
  const publish=()=>{
   if(!active||(!progressive&&pending>0))return;
   const loaded=markets.filter(market=>values[market]);
   const travel=Array.isArray(hints?.travel_profiles)?hints.travel_profiles:[];
   setData({binding,requestKey,pending:pending>0,
    overview:fullOverview?{listings,properties:homes,travel,seeker:hints?.has_candidate_profile}:undefined,
    employerProfiles:Array.isArray(hints?.employer_profiles)?hints.employer_profiles.filter(row=>typeof row?.offer_ref==='string'&&/^JOB_[A-Za-z0-9_-]+$/.test(row.offer_ref)&&(row.title==null||typeof row.title==='string')):[],
    employerProfilesMore:hints?.employer_profiles_more===true,travel,counts:activityCounts(hints?.activity_counts),
    items:dashboardActivities(loaded.flatMap(market=>values[market]!.items)),loaded,
    options:loaded.filter(market=>values[market]!.setup||market==='wenze'),
    failed:failed||(!!hints&&fullOverview&&!Array.isArray(hints.travel_profiles)&&hints.markets.some(market=>market==='hotels'||market==='wewa')),
    more:loaded.some(market=>values[market]!.more),markets:hints?.markets??[],business:hints?.organization_management===true});
  };
  const settle=<T,>(work:Promise<T>,accept:(value:T)=>void)=>void work.then(value=>{
   if(active)accept(value);
  }).catch(()=>{failed=true;}).finally(()=>{
   pending--;publish();if(!pending){clearTimeout(timer);controller.abort();}
  });
  // Each complete group is useful independently, but never expose half a
  // current/archived shop list or service list without its capability result.
  settle(Promise.all([read('wenze/stores/?archived=false'),read('wenze/stores/?archived=true')]).then(([current,archived])=>managedActivities('wenze',{stores:[...current.stores,...archived.stores]})),value=>{values.wenze=value;});
  settle(restaurants(),value=>{values.restaurants=value;});
  settle(Promise.all([read('services/'),read('services/capabilities/')]).then(([value,policy])=>managedActivities('services',value,policy)),value=>{values.services=value;});
  settle(readPersonalNavigation(binding,controller.signal),value=>{hints=value;});
  if(fullOverview){
   settle(read('job-offer/?kind=catalogue').then(value=>{if(!Array.isArray(value.rows))throw Error('Unavailable listings');return value.rows;}),value=>{listings=value;});
   settle(properties(),value=>{homes=value;});
  }
  return()=>{active=false;controller.abort();clearTimeout(timer);};
 },[binding,revision,restaurantPages,fullOverview,managementOnly,progressive,requestKey]);
 return data?.binding===binding&&data.requestKey===requestKey?data:null;
}
