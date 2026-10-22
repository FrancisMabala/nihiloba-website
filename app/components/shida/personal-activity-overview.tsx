"use client";
import {useEffect,useState} from 'react';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {workspaceText} from '../../lib/personal-workspace-copy';
import {activityRows,activitySources,type PersonalActivity} from '../../lib/personal-activity';
import {SpaceIcon} from './account-space-icon';
export function PersonalActivityOverview({binding,locale}:{binding:string;locale:MarketplaceLocale}){
 const t=accountSpaceCopy[locale],w=(key:Parameters<typeof workspaceText>[1])=>workspaceText(locale,key);
 const [data,setData]=useState<{binding:string;rows:PersonalActivity[];failed:boolean}|null>(null),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  Promise.allSettled(activitySources.map(async([source,path])=>{const response=await fetch(path,{signal:controller.signal,cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding}});if(!response.ok)throw Error();return activityRows(source,await response.json(),locale);})).then(results=>{if(active)setData({binding,rows:results.flatMap(result=>result.status==='fulfilled'?result.value:[]).sort((a,b)=>(b.date?Date.parse(b.date):0)-(a.date?Date.parse(a.date):0)),failed:results.some(result=>result.status==='rejected')});}).finally(()=>clearTimeout(timer));
  return()=>{active=false;controller.abort();clearTimeout(timer);};
 },[binding,locale,revision]);
 const current=data?.binding===binding?data:null;
 const row=(item:PersonalActivity)=><a className="space-activity-row" key={item.id} href={item.href}><span className="space-activity-icon"><SpaceIcon name={item.market}/></span><span className="space-activity-title"><strong>{item.title}</strong><small>{item.date?new Date(item.date).toLocaleDateString(locale==='ln'?'fr':locale):item.market==='shop'?'Wenze':null}</small></span><span className="space-status">{item.status}</span></a>;
 return <section className="space-recent"><div className="space-section-heading"><h2>{w('attention')}</h2><button type="button" onClick={()=>{setData(null);setRevision(n=>n+1);}}>{t.retry}</button></div>
 {!current?<p role="status">{t.loading}</p>:<>{current.failed&&<p role="status">{w('partial')}</p>}<div className="space-attention">{current.rows.some(item=>item.attention)?current.rows.filter(item=>item.attention).map(row):!current.failed?<p>{w('noAttention')}</p>:null}</div><h2>{w('recent')}</h2><p className="space-note">{w('coverage')}</p>{current.rows.map(row)}{!current.failed&&!current.rows.length&&<div className="space-empty"><p>{w('empty')}</p><a href={`${locale==='en'?'':`/${locale}`}/shida/`}>{w('explore')} →</a></div>}</>}
 </section>;
}
