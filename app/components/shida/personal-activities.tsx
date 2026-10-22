"use client";
import {useEffect,useState} from 'react';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {workspaceText} from '../../lib/personal-workspace-copy';
import {managedActivities,type ManagedActivity} from '../../lib/personal-activities';
export function PersonalActivities({binding,locale}:{binding:string;locale:MarketplaceLocale}){
 const t=accountSpaceCopy[locale],w=(key:Parameters<typeof workspaceText>[1])=>workspaceText(locale,key),prefix=locale==='en'?'':`/${locale}`;
 const [data,setData]=useState<{binding:string;items:ManagedActivity[];options:ManagedActivity['market'][];failed:boolean}|null>(null),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 const read=async(path:string)=>{const response=await fetch(`/api/shida/personal/${path}`,{signal:controller.signal,cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding}});if(!response.ok)throw Error();return response.json();};
 Promise.allSettled([read('wenze/stores/?archived=false').then(value=>managedActivities('wenze',value)),read('restaurants/?page=1&page_size=20').then(value=>managedActivities('restaurants',value)),Promise.all([read('services'),read('services/capabilities')]).then(([value,policy])=>managedActivities('services',value,policy))]).then(results=>{if(active)setData({binding,items:results.flatMap(result=>result.status==='fulfilled'?result.value.items:[]),options:results.flatMap((result,index)=>result.status==='fulfilled'&&(result.value.setup||result.value.more||index===0)?[(['wenze','restaurants','services'] as const)[index]]:[]),failed:results.some(result=>result.status==='rejected')});}).finally(()=>clearTimeout(timer));
 return()=>{active=false;controller.abort();clearTimeout(timer);};},[binding,revision]);
 const current=data?.binding===binding?data:null,label=(market:ManagedActivity['market'])=>market==='wenze'?t.shop:market==='services'?t.services:t.restaurant;
 return <section className="space-managed"><div className="space-section-heading"><h2>{w('active')}</h2><button type="button" onClick={()=>{setData(null);setRevision(n=>n+1);}}>{t.retry}</button></div>{!current?<p role="status">{t.loading}</p>:<>{current.failed&&<p role="status">{w('partial')}</p>}{!current.items.length&&!current.failed&&<p>{w('manageEmpty')}</p>}<div className="space-managed-grid">{current.items.map(item=><article key={`${item.market}:${item.ref}`}><small>{label(item.market)}</small><h3>{item.name}</h3>{item.published!==null&&<p className="space-status">{w(item.published?'published':'hidden')}</p>}<a href={`${prefix}/shida/seller/${item.market}?${item.query}`}>{w('open')}<span className="sr-only"> · {item.name}</span> →</a></article>)}</div>{current.options.length>0&&<><h2>{w('available')}</h2><div className="space-destinations">{current.options.map(market=><a key={market} href={`${prefix}/shida/seller/${market}`}>{label(market)} · {w('options')} →</a>)}</div></>}</>}
 <section className="space-organization"><h2>{w('business')}</h2><p>{w('businessNote')}</p><a href="https://business.nihiloba.com/">SHIDA Business →</a></section></section>;
}
