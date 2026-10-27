'use client';
import {restaurantClarityCopy} from '../../lib/restaurant-clarity-copy';
import { useEffect, useState } from 'react';
import { useWorkRequest, dateText } from '@/app/lib/restaurant-work';
import { workText } from '@/app/lib/restaurant-work-copy';
import { basicText } from '@/app/lib/restaurant-basic-copy';
import {formatMoney} from '../../lib/restaurant-finance-display';
import { periodDates, shiftCalendarDate } from '@/app/lib/restaurant-statistics';
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
 const m=summary?.metrics,u=restaurantClarityCopy[locale];
 const dateLabel=(value:string)=>new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
 const sourceCounts=(channel:string)=>{const keys=channel==='inPerson'?['counter','service']:channel==='unknown'?Object.keys(m?.by_channel??{}).filter(key=>!['web','whatsapp','counter','service'].includes(key)):[channel];return {submitted:keys.reduce((sum,key)=>sum+(m?.by_channel?.[key]?.submitted??0),0),completed:keys.reduce((sum,key)=>sum+(m?.by_channel?.[key]?.completed??0),0)};};
 return <article className="rst-card rst-work rst-order-statistics"><h2>{c.orders}</h2><p>{u.orderIntro}</p>
 {loaded&&!measured&&<div><p>{u.startHelp}</p><button type="button" disabled={api.busy||!api.online} onClick={async()=>{if(!confirm){setConfirm(true);return;}const result=await api.run(`${path}/order-measurement`,'POST');if(result){setConfirm(false);if(timezone){const dates=periodDates(1,timezone);await read(1,dates.from,dates.to);}}}}>{confirm?t('confirm'):u.start}</button></div>}
 {measured&&<><div className="rst-actions rst-stats-period">{([['today',1],['week',7],['month',30]] as const).map(([label,days])=><button type="button" key={label} disabled={!timezone||api.busy||!api.online} onClick={()=>{if(!timezone)return;const dates=periodDates(days,timezone);setFrom(dates.from);setTo(dates.to);void read(1,dates.from,dates.to);}}>{b(label)}</button>)}<button type="button" aria-expanded={showDates} onClick={()=>setShowDates(v=>!v)}>{workflowText(locale,'statsDates')}</button></div>
 {showDates&&<form onSubmit={e=>{e.preventDefault();void read();}}><div className="rst-fields"><label>{t('from')}<input type="date" required value={from} onChange={e=>{setFrom(e.target.value);setSummary(null);}}/></label><label>{t('to')}<input type="date" required min={from} value={shiftCalendarDate(to,-1)} onChange={e=>{setTo(shiftCalendarDate(e.target.value,1));setSummary(null);}}/></label></div><button disabled={api.busy||!api.online}>{t('review')}</button></form>}
 {from&&to&&<p>{u.period}: {dateLabel(from)}{from!==shiftCalendarDate(to,-1)&&` – ${dateLabel(shiftCalendarDate(to,-1))}`}</p>}</>}
 <p role="status">{!api.online||summary&&!fresh?t('stale'):api.message&&t(api.message)}</p>
 {!m&&<p>{measured?c.unavailable:c.notMeasured}</p>}
 {m&&<><dl className="rst-stat-cards">{(['submitted_orders','completed_in_period','completed_food_value'] as const).map(key=><div key={key}><dt>{key==='submitted_orders'?b(key):t(key)}</dt><dd>{typeof m[key]==='number'?String(m[key]):Object.entries(m[key]).length?Object.entries(m[key]).map(([currency,value])=><span key={currency}>{formatMoney(value,locale)} {currency}</span>):c.unavailable}</dd></div>)}</dl><p>{u.notPayment}</p>
 <div className="rst-stats-tables"><table className="rst-stats-table"><caption>{u.statuses}</caption><thead><tr><th scope="col">{u.status}</th><th scope="col">{u.count}</th></tr></thead><tbody>{Object.entries(m.status_breakdown).length?Object.entries(m.status_breakdown).map(([state,count])=><tr key={state}><th scope="row">{t(state)}</th><td>{count}</td></tr>):<tr><td colSpan={2}>{c.unavailable}</td></tr>}</tbody></table>
 <table className="rst-stats-table"><caption>{u.sources}</caption><thead><tr><th scope="col">{c.orderSources}</th><th scope="col">{c.submitted}</th><th scope="col">{c.handed}</th></tr></thead><tbody>{(['web','whatsapp','inPerson','unknown'] as const).map(channel=><tr key={channel}><th scope="row">{c[channel]}</th><td>{m.by_channel?sourceCounts(channel).submitted:c.unavailable}</td><td>{m.by_channel?sourceCounts(channel).completed:c.unavailable}</td></tr>)}</tbody></table></div></>}
 <details className="rst-stats-explanation"><summary>{u.understand}</summary><p>{c.orderCoverage}</p><p>{workflowText(locale,'statsIntro')}</p><p>{t('timezone')}: {timezone}</p>
 {summary&&measured&&<><p>{t('updated')}: {dateText(summary.as_of,locale,timezone)}</p><p>{t('coverage')}: {dateText(summary.coverage_from,locale,timezone)} – {dateText(summary.coverage_to,locale,timezone)} · {t(summary.measurement_status)}</p></>}
 {m&&<><dl className="rst-details">{(['completed_delivery_fees','average_completed_food_value'] as const).map(key=><div key={key}><dt>{key==='average_completed_food_value'?b(key):t(key)}</dt><dd>{Object.entries(m[key]??{}).map(([currency,value])=><p key={currency}>{formatMoney(value,locale)} {currency}</p>)}</dd></div>)}</dl>
 <h3>{b('fulfilment')}</h3>{Object.entries(m.by_method??{}).map(([method,count])=><p key={method}>{t(method)}: {count.submitted} / {count.completed}</p>)}
 <p>{b('timingHelp')}</p>{(['response_time','preparation_time'] as const).map(key=><p key={key}>{b(key)}: {m[key]?.average_seconds==null?b('notAvailable'):`${m[key]!.average_seconds} ${b('seconds')} · ${m[key]!.samples} ${b('samples')}`}</p>)}
 {!!m.popular_foods?.items.length&&<><h3>{b('popular')}</h3>{m.popular_foods.items.map((item,index)=><p key={index}>{item.name}: {item.pricing_model==='UNIT_PRICED'?`${item.units} ${item.sale_unit_label}`:`${item.occurrences} ${b('portions')}`} · {item.currency}</p>)}</>}
 {(m.popular_foods?.total??0)>20&&<div className="rst-actions"><button type="button" disabled={page===1||api.busy||!api.online} onClick={()=>void read(page-1)}>{t('previous')}</button><button type="button" disabled={page*20>=(m.popular_foods?.total??0)||api.busy||!api.online} onClick={()=>void read(page+1)}>{t('next')}</button></div>}</>}
 </details></article>;
}
