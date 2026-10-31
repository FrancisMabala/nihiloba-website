"use client";
import {useEffect,useState} from 'react';
import {useWenzeApi} from '@/app/lib/wenze-seller-api';
import type {WenzeLocale} from '@/app/lib/wenze-copy';

// Presence is deliberately absent: a physical shop may accept pickup orders.
export function ordersVisible(ready:unknown,historyCount:unknown){
 return !(ready===false&&historyCount===0);
}
export function useWenzeOrderAccess(store:{public_ref:string;revision:number;order_ready?:boolean}|null,locale:WenzeLocale,view:string){
 const {request}=useWenzeApi();
 const ref=store?.public_ref,revision=store?.revision,ready=store?.order_ready;
 const key=JSON.stringify([ref,revision,ready,locale,view]);
 const [history,setHistory]=useState<{key:string;count:number}|null>(null);
 useEffect(()=>{
  if(!ref||ready!==false)return;
  let current=true;
  // No search/date/status filter: completed and cancelled history counts too.
  request(`wenze/contexts/personal/orders?store_ref=${encodeURIComponent(ref)}&language=${locale}&bucket=all&limit=1`).then(value=>{
   const count=(value as {counts?:{all?:unknown}})?.counts?.all;
   if(current&&typeof count==='number'&&Number.isInteger(count)&&count>=0)setHistory({key,count});
  }).catch(()=>{/* Unknown or inaccessible history must never hide navigation. */});
  return()=>{current=false;};
 },[ref,ready,locale,key,request]);
 const count=history?.key===key?history.count:undefined;
 return {visible:ordersVisible(ready,count),empty:count===0};
}
