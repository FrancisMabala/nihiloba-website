'use client';
import {restaurantClarityCopy} from '../../lib/restaurant-clarity-copy';
import { useEffect, useState } from 'react';
import { useWorkRequest, dateText } from '@/app/lib/restaurant-work';
import { workText } from '@/app/lib/restaurant-work-copy';
import { basicText } from '@/app/lib/restaurant-basic-copy';
import { periodDates } from '@/app/lib/restaurant-statistics';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';
import { insightsCopy } from '../../lib/restaurant-insights-copy';
import { workflowText } from '@/app/lib/restaurant-workflow-copy';
type Timing={samples:number;average_seconds:number|null};
type Item={item_ref:string;name:string;pricing_model:string;sale_unit_label:string|null;currency:string;units:number;occurrences:number};
type Summary={from_utc?:string;to_utc?:string;as_of:string;coverage_from:string|null;coverage_to:string;measurement_status:string;metrics:null|{submitted_orders:number;completed_in_period:number;completed_food_value:Record<string,string>;completed_delivery_fees:Record<string,string>;average_completed_food_value?:Record<string,string>;status_breakdown:Record<string,number>;by_method:Record<string,{submitted:number;completed:number}>;by_source?:Record<string,{submitted:number;completed:number}>;by_channel?:Record<string,{submitted:number;completed:number}>;response_time?:Timing;preparation_time?:Timing;popular_foods?:{items:Item[];total:number}}};
export function RestaurantActivity({path,binding,locale,timezone,onFailure}:{path:string;binding:string;locale:RestaurantLocale;timezone:string|null;onFailure:(e:unknown)=>void}){
 const c=insightsCopy[locale],t=(k:string)=>workText(locale,k),b=(k:string)=>basicText(locale,k),api=useWorkRequest(binding,onFailure);
 const [fresh,setFresh]=useState(false);
 const [loaded,setLoaded]=useState(false),[measured,setMeasured]=useState(false),[showDates,setShowDates]=useState(false);
 const [from,setFrom]=useState(''),[to,setTo]=useState(''),[page,setPage]=useState(1),[summary,setSummary]=useState<Summary|null>(null),[confirm,setConfirm]=useState(false);
 async function read(p=1,start=from,end=to){setFresh(false);const result=await api.run<Summary>(`${path}/order-summary?from_date=${start}&to_date=${end}&page=${p}&page_size=20`);if(result){setFresh(true);setLoaded(true);setMeasured(Boolean(result.coverage_from));setSummary(result);setPage(p);}}
 useEffect(()=>{if(!timezone)return;const dates=periodDates(1,timezone);queueMicrotask(()=>{setFrom(dates.from);setTo(dates.to);void read(1,dates.from,dates.to);});},[path,timezone]); // eslint-disable-line react-hooks/exhaustive-deps
 const m=summary?.metrics;
 return <article className="rst-card rst-work"><h2>{c.orders}</h2><details><summary>{restaurantClarityCopy[locale].details}</summary><p>{c.orderCoverage}</p><p>{workflowText(locale,'statsIntro')}</p><p>{t('timezone')}: {timezone}</p></details>
 {loaded&&!measured&&<div><p>{workflowText(locale,'statsSince')}</p><button type="button" disabled={api.busy || !api.online} onClick={async()=>{if(!confirm){setConfirm(true);return;}const result=await api.run(`${path}/order-measurement`,'POST');if(result){setConfirm(false);if(timezone){const dates=periodDates(1,timezone);await read(1,dates.from,dates.to);}}}}>{confirm?t('confirm'):workflowText(locale,'statsStart')}</button></div>}
 {measured&&<><div className="rst-actions">{([['today',1],['week',7],['month',30]] as const).map(([label,days])=><button type="button" key={label} disabled={!timezone || api.busy || !api.online} onClick={()=>{if(!timezone)return;const dates=periodDates(days,timezone);setFrom(dates.from);setTo(dates.to);void read(1,dates.from,dates.to);}}>{b(label)}</button>)}<button type="button" onClick={()=>setShowDates(v=>!v)}>{workflowText(locale,'statsDates')}</button></div>
 {showDates&&<form onSubmit={e=>{e.preventDefault();void read();}}><div className="rst-fields"><label>{t('from')}<input type="date" required value={from} onChange={e=>{setFrom(e.target.value);setSummary(null);}}/></label><label>{t('to')}<input type="date" required min={from} value={to} onChange={e=>{setTo(e.target.value);setSummary(null);}}/></label></div><button disabled={api.busy || !api.online}>{t('review')}</button></form>}</>}
 <p role="status">{!api.online || summary && !fresh?t('stale'):api.message && t(api.message)}</p>
 {summary && measured && <>{summary.from_utc && summary.to_utc && <p>{t('from')}: {dateText(summary.from_utc,locale,timezone)} / {t('to')}: {dateText(summary.to_utc,locale,timezone)}</p>}<p>{t('updated')}: {dateText(summary.as_of,locale,timezone)}</p><p>{t('coverage')}: {dateText(summary.coverage_from,locale,timezone)} – {dateText(summary.coverage_to,locale,timezone)} · {t(summary.measurement_status)}</p></>}
 {!m&&<p>{measured?c.unavailable:c.notMeasured}</p>}
 {m && <><dl className="rst-details">{(['submitted_orders','completed_in_period','completed_food_value','completed_delivery_fees','average_completed_food_value'] as const).map(k=><div key={k}><dt>{k==='average_completed_food_value' || k==='submitted_orders'?b(k):t(k)}</dt><dd>{typeof m[k]==='number'?String(m[k]):Object.entries(m[k] as Record<string,string> ?? {}).map(([c,v])=><p key={c}>{v} {c}</p>)}</dd></div>)}</dl>
 <details><summary>{restaurantClarityCopy[locale].details}</summary><div>{Object.entries(m.status_breakdown).map(([s,n])=><p key={s}>{t(s)}: {n}</p>)}</div>
 <h3>{c.orderSources}</h3><dl className="rst-details">{(['web','whatsapp','inPerson','unknown'] as const).map(channel=>{const keys=channel==='inPerson'?['counter','service']:channel==='unknown'?Object.keys(m.by_channel??{}).filter(k=>!['web','whatsapp','counter','service'].includes(k)):[channel];const counts=keys.map(k=>m.by_channel?.[k]);return <div key={channel}><dt>{c[channel]}</dt><dd>{m.by_channel?`${c.submitted}: ${counts.reduce((n,v)=>n+(v?.submitted??0),0)} · ${c.handed}: ${counts.reduce((n,v)=>n+(v?.completed??0),0)}`:c.unavailable}</dd></div>;})}</dl><h3>{b('fulfilment')}</h3>{Object.entries(m.by_method ?? {}).map(([method,n])=><p key={method}>{t(method)}: {n.submitted} / {n.completed}</p>)}
 {m.by_source?.counter && <p>{t('counter')}: {m.by_source.counter.submitted} / {m.by_source.counter.completed}</p>}
 <p>{b('timingHelp')}</p>{(['response_time','preparation_time'] as const).map(k=><p key={k}>{b(k)}: {m[k]?.average_seconds==null?b('notAvailable'):`${m[k]!.average_seconds} ${b('seconds')} · ${m[k]!.samples} ${b('samples')}`}</p>)}
 <h3>{b('popular')}</h3>{m.popular_foods?.items.map((i,index)=><p key={index}>{i.name}: {i.pricing_model==='UNIT_PRICED'?`${i.units} ${i.sale_unit_label}`:`${i.occurrences} ${b('portions')}`} · {i.currency}</p>)}
 {(m.popular_foods?.total ?? 0)>20&&<div className="rst-actions"><button type="button" disabled={page===1 || api.busy || !api.online} onClick={()=>void read(page-1)}>{t('previous')}</button><button type="button" disabled={page*20>=(m.popular_foods?.total ?? 0) || api.busy || !api.online} onClick={()=>void read(page+1)}>{t('next')}</button></div>}</details></>}
 </article>;
}
