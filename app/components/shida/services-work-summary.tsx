"use client";
import {useEffect,useRef,useState} from 'react';
import {financialRequest} from '../../lib/services-financial-state';
import {uniqueWork,workMatches,type WorkRow,type WorkFilter} from '../../lib/services-work-model';
import {workText} from '../../lib/services-work-copy';
import type {ServicesLocale} from './services-transaction-copy';
import {SellerWorkspaceIcon} from './seller-workspace';
export function ServicesWorkSummary({base,binding,locale,revision,onSelect,onDenied,disabled,quotesAvailable=true,bookingAvailable=true}:{base:string;binding:string;locale:ServicesLocale;revision:number;onSelect:(kind:'requests'|'reservations',filter:WorkFilter)=>void;onDenied:()=>void;disabled:boolean;quotesAvailable?:boolean;bookingAvailable?:boolean}){
 const [sources,setSources]=useState<Record<string,{rows:WorkRow[];more:boolean;failed:boolean}>>({});
 const denied=useRef(onDenied);useEffect(()=>{denied.current=onDenied;},[onDenied]);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active)setSources({});});
  for(const kind of ['requests','reservations'])void financialRequest<WorkRow>(binding,`${base}/transactions/${kind}?offset=0`).then(value=>{if(!Array.isArray(value[kind]))throw Error('invalid');const rows=uniqueWork(value[kind] as WorkRow[]);if(active)setSources(old=>({...old,[kind]:{rows,more:kind==='requests'?value.has_more===true:rows.length===100,failed:false}}));}).catch(error=>{if(active){if(['401','403','404'].includes(error.message))denied.current();setSources(old=>({...old,[kind]:{rows:[],more:false,failed:true}}));}});
  return()=>{active=false;};
 },[base,binding,revision]);
 const t=(key:string)=>workText(locale,key);
 return <div className="svc-work-summary"><div className="svc-work-kpis">{(['new','quotes','bookings','jobs'] as const).filter(key=>(key!=='quotes'||quotesAvailable||sources.requests?.rows.some(row=>row.draft_quote_ref||row.current_quote))&&(key!=='bookings'||bookingAvailable||!sources.reservations||sources.reservations.failed||sources.reservations.rows.some(row=>row.status==='pending'))).map((filter,index)=>{const kind=filter==='new'||filter==='quotes'?'requests':'reservations',source=sources[kind],count=source?.rows.filter(row=>workMatches(row,filter,kind)).length;return <button key={filter} disabled={disabled} onClick={()=>onSelect(kind,filter)} className={`svc-work-kpi ${['blue','amber','green','purple'][index]}`}><SellerWorkspaceIcon name={filter==='bookings'?'calendar':filter==='quotes'?'document':'work'}/><span>{t(filter)}<strong>{!source?'…':source.failed?t('unavailable'):count}</strong><small>{t('open')} →</small></span></button>;})}</div><p className="svc-work-scope">{t('preview')}</p></div>;
}
