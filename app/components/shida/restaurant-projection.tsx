'use client';
import { useEffect, useState } from 'react';
import { DashboardApiError, request } from '@/app/lib/restaurant-seller-browser';
import { validFoodPreview, validMenuPreview, type FoodPreview, type MenuPreview } from '@/app/lib/restaurant-projections';
import { workText } from '@/app/lib/restaurant-work-copy';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';

export function FoodSummary({preview,locale}:{preview?:FoodPreview;locale:RestaurantLocale}) {
 const t=(key:string)=>workText(locale,key);
 if(!validFoodPreview(preview) || !preview.available)return <p>{t('foodUnavailable')}</p>;
 return <div className="rst-food-summary">{preview.groups.map((g,i)=><section key={i}><h4>{t(g.kind==='plate'?'plate':'standalone')}{g.plate_number!==null && ` ${g.plate_number}`}</h4>{g.lines.map((line,j)=><p key={j}>{line.name} · {line.quantity!==undefined ? `${line.quantity} ${line.sale_unit_label}` : `${line.selected_amount} ${line.currency}`}</p>)}{g.remaining_lines>0 && <p>{t('groupOmitted')}: {g.remaining_lines}</p>}</section>)}{preview.truncated && <p className="rst-notice">{t('linesOmitted')}: {preview.remaining_lines} · {t('groupsOmitted')}: {preview.remaining_groups}. {t('fullReview')}</p>}</div>;
}

export function PrivateMenuPreview({path,binding,locale,onFailure}:{path:string;binding:string;locale:RestaurantLocale;onFailure:(e:unknown)=>void}) {
 const t=(key:string)=>workText(locale,key);
 const [page,setPage]=useState(1),[data,setData]=useState<MenuPreview|null>(null),[status,setStatus]=useState('loading'),[refresh,setRefresh]=useState(0);
 useEffect(()=>{
  let alive=true, ticket=0;
  const controller=new AbortController();
  async function load(){
   const current=++ticket;setData(null);
   if(document.hidden || !navigator.onLine){setStatus('stale');return;}
   setStatus('loading');
   try{
    const query=new URLSearchParams({language:locale,page:String(page),page_size:'5'});
    const value=await request(`${path}/menu-preview?${query}`,{signal:controller.signal},binding);
    if(!alive || current!==ticket)return;
    if(!validMenuPreview(value,query))throw new DashboardApiError('unavailable',502);
    setData(value);setStatus('');
   }catch(e){if(!alive || current!==ticket)return;setStatus('unavailable');if(e instanceof DashboardApiError && [401,403,404].includes(e.status))onFailure(e);}
  }
  const resume=()=>void load();void load();
  window.addEventListener('focus',resume);window.addEventListener('online',resume);window.addEventListener('offline',resume);document.addEventListener('visibilitychange',resume);
  return()=>{alive=false;controller.abort();window.removeEventListener('focus',resume);window.removeEventListener('online',resume);window.removeEventListener('offline',resume);document.removeEventListener('visibilitychange',resume);};
 },[path,binding,locale,page,refresh,onFailure]);
 return <section className="rst-menu-preview"><h3>{t('privateMenu')}</h3><p>{t('privateMenuNote')}</p>{status && <p role="status">{t(status)}</p>}{data && <><p>{data.total} · {t('menuFoods')}</p>{!data.items.length && <p>{t('empty')}</p>}{data.items.map((item,i)=><div key={i}><h4>{item.category_name}</h4><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{item.text}</p></div>)}</>}<div className="rst-actions"><button type="button" disabled={!data || page===1} onClick={()=>{setData(null);setPage(p=>p-1);}}>{t('previous')}</button><span>{page}</span><button type="button" disabled={!data || page*5>=data.total} onClick={()=>{setData(null);setPage(p=>p+1);}}>{t('next')}</button><button type="button" onClick={()=>{setData(null);setRefresh(n=>n+1);}}>{t('refresh')}</button></div></section>;
}
