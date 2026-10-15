'use client';
import {useEffect,useState} from 'react';
import {RestaurantActivity} from './restaurant-activity';
import {insightsCopy} from '../../lib/restaurant-insights-copy';
import {useWorkRequest,dateText} from '../../lib/restaurant-work';
import type {RestaurantLocale} from '../../services/shida/restaurants-client';
type Cell={state:string;value:number|null};
const metrics=['profile_opens','menu_opens','item_views','item_selections','menu_requests','orders_started'] as const;
type Metric=typeof metrics[number];
type Insights={state:string;coverage:string;current_followers:Cell;as_of:string;period:{from:string;to:string};measurement_started_at:string;first_block_start:string;release_at:string;metrics:Record<Metric,Cell>;by_channel:Record<Metric,Record<string,Cell>>;popular_items:{item_ref:string;name:string|null;interest:Cell}[]};
export function RestaurantInsights(props:{path:string;binding:string;locale:RestaurantLocale;timezone:string|null;onFailure:(e:unknown)=>void}){
 const {path,binding,locale,onFailure}=props,c=insightsCopy[locale],api=useWorkRequest(binding,onFailure);
 const [report,setReport]=useState<Insights|null>(null),[fresh,setFresh]=useState(false);
 async function read(){setFresh(false);const value=await api.run<Insights>(`${path}/insights?language=${locale}`);if(value?.metrics&&value?.by_channel&&value?.period&&Array.isArray(value?.popular_items)){setReport(value);setFresh(true);}}
 useEffect(()=>{queueMicrotask(()=>void read());},[path,locale]); // eslint-disable-line react-hooks/exhaustive-deps
 const value=(cell?:Cell)=>fresh&&api.online&&cell?.state==='available'&&cell.value!==null?String(cell.value):c.unavailable;
 return <div className="rst-insights"><article className="rst-card rst-work"><header><h2>{c.title}</h2><p>{c.intro}</p><button type="button" disabled={api.busy||!api.online} onClick={()=>void read()}>{c.refresh}</button></header>
 <section><h3>{c.followers}</h3><strong className="rst-insights-total">{value(report?.current_followers)}</strong><p>{c.followersHelp}</p>{report&&<p>{c.updated}: {dateText(report.as_of,locale,props.timezone)}</p>}</section>
 <section><h3>{c.interest}</h3>{report&&<><p>{c.period}: {dateText(report.period.from,locale,'UTC')} – {dateText(report.period.to,locale,'UTC')}</p><p>{c.started}: {dateText(report.measurement_started_at,locale,'UTC')}</p>{report.state!=='available'&&<p>{c.release}: {dateText(report.release_at,locale,'UTC')}</p>}</>}
 <p>{report?.coverage==='not_measured'?c.notMeasured:c.coverage}</p><p>{c.privacy}</p><p role="status">{c.low}</p>
 <dl className="rst-details">{metrics.map(key=><div key={key}><dt>{c[key]}</dt><dd>{value(report?.metrics[key])}</dd></div>)}</dl>
 <details><summary>{c.sources}</summary><div className="rst-insights-sources">{metrics.map(key=><section key={key}><h4>{c[key]}</h4><dl>{(['web','whatsapp','unknown'] as const).map(channel=><div key={channel}><dt>{c[channel]}</dt><dd>{(channel==='whatsapp'&&['profile_opens','menu_opens','item_views'].includes(key)||channel==='web'&&key==='menu_requests')?c.notMeasured:value(report?.by_channel[key]?.[channel])}</dd></div>)}<div><dt>{c.inPerson}</dt><dd>{c.notMeasured}</dd></div></dl></section>)}</div></details>
 <h3>{c.popular}</h3><p>{c.popularHelp}</p>{fresh&&api.online&&report?.popular_items.length?<ol>{report.popular_items.map(item=><li key={item.item_ref}>{item.name??c.unknownItem}: {value(item.interest)}</li>)}</ol>:<p>{c.unavailable}</p>}
 </section></article><RestaurantActivity {...props}/></div>;
}
