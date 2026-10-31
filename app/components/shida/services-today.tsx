"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {workdayCopy} from "../../lib/services-workday-copy";
import {serviceTimestamp,SERVICE_TIME_ZONE,shiftDay} from "../../lib/service-time";
import {localDate} from "../../lib/shida-calendar";
import {todayCopy} from "../../lib/services-today-copy";
import {providerCopy,type ProviderLocale,type ProviderView} from "../../lib/services-provider-copy";
import {scheduleCopy} from "../../lib/services-calendar-copy";
import {activeWork,appointmentsForDay,previewCount,uniqueTasks,type TodayData,type TodayItem,type TodayOffering,type TodayAppointment} from "../../lib/services-today-model";
import {SellerWorkspaceIcon} from "./seller-workspace";
import "./services-today.css";
export type ServiceTaskLink={kind:"requests"|"reservations"|"messages";ref:string};
type Result<T>={value:T|null;failed:boolean};
type Props={base:string;binding:string;locale:ProviderLocale;onOpen:(task:ServiceTaskLink)=>void;onAll:(kind:ServiceTaskLink["kind"])=>void;onDenied:()=>void;actions?:ReactNode;offerings?:TodayOffering[];capabilities?:string[];onNavigate?:(view:ProviderView)=>void;onRefresh?:()=>void};
export function ServicesToday(props:Props){return <Today key={`${props.base}:${props.binding}:${props.locale}`} {...props}/>;}
function Today({base,binding,locale,onOpen,onAll,onDenied,actions,offerings=[],capabilities=[],onNavigate,onRefresh}:Props){
 const t=todayCopy[locale],ui=providerCopy[locale],w=workdayCopy[locale],denied=useRef(onDenied);
 useEffect(()=>{denied.current=onDenied;},[onDenied]);
 const [data,setData]=useState<Result<TodayData>>({value:null,failed:false});
 const [jobs,setJobs]=useState<Result<{items:TodayItem[];more:boolean}>>({value:null,failed:false});
 const [calendar,setCalendar]=useState<Result<{items:TodayAppointment[];more:boolean}>>({value:null,failed:false});
 const [refresh,setRefresh]=useState(0);
 const canCalendar=capabilities.includes("structured_availability"),canWork=capabilities.includes("reservations")&&capabilities.includes("messages");
 const active=offerings.filter(row=>row.is_active==="yes");
 const day=data.value?.date??localDate(new Date().toISOString(),SERVICE_TIME_ZONE);
 const retry=()=>{setRefresh(value=>value+1);onRefresh?.();};
 useEffect(()=>{
  const controller=new AbortController();let alive=true;
  async function get(path:string){const response=await fetch(`${base}${path}`,{credentials:"include",cache:"no-store",signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]),headers:{Accept:"application/json","X-Shida-Session":binding}});if(!response.ok){if(alive&&[401,403].includes(response.status))denied.current();throw Error();}return response.json();}
  queueMicrotask(()=>{if(alive){setData({value:null,failed:false});setJobs({value:null,failed:false});}});
  if(canWork){
   void get(`/today?language=${locale}`).then(value=>{if(!["requests","pending","upcoming","messages"].every(key=>Array.isArray(value[key]?.items)))throw Error();if(alive)setData({value,failed:false});}).catch(()=>{if(alive)setData({value:null,failed:true});});
   void get("/transactions/reservations?offset=0").then(value=>{if(!Array.isArray(value.reservations))throw Error();if(alive)setJobs({value:{items:activeWork(value.reservations),more:value.reservations.length===100},failed:false});}).catch(()=>{if(alive)setJobs({value:null,failed:true});});
  }
  const focus=()=>setRefresh(value=>value+1);window.addEventListener("focus",focus);
  return()=>{alive=false;controller.abort();window.removeEventListener("focus",focus);};
 },[base,binding,locale,refresh,canWork]);
 useEffect(()=>{
  if(!canCalendar)return;
  let alive=true;const controller=new AbortController();
  queueMicrotask(()=>{if(alive)setCalendar({value:null,failed:false});});
  fetch(`${base}/calendar?${new URLSearchParams({date_from:day,date_to:shiftDay(day,1),page:"1"})}`,{credentials:"include",cache:"no-store",signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]),headers:{Accept:"application/json","X-Shida-Session":binding}})
   .then(async response=>{if(!response.ok){if(alive&&[401,403].includes(response.status))denied.current();throw Error();}return response.json();})
   .then(value=>{if(!Array.isArray(value.items))throw Error();if(alive)setCalendar({value:{items:appointmentsForDay(value.items,day),more:value.has_more===true},failed:false});}).catch(()=>{if(alive)setCalendar({value:null,failed:true});});
  return()=>{alive=false;controller.abort();};
 },[base,binding,day,refresh,canCalendar]);
 const showCalendar=canCalendar&&(active.some(row=>row.booking_mode==="time_slots")||calendar.failed||!calendar.value||!!calendar.value.items.length||!!data.value?.upcoming.items.length);
 const navigate=(view:ProviderView)=>onNavigate?.(view);
 const state=(result:Result<unknown>)=>result.failed?<div className="svc-daily-error" role="alert"><p>{t.failed}</p><button onClick={retry}>{t.retry}</button></div>:!result.value?<div className="svc-daily-skeleton" role="status"><span className="sr-only">{t.loading}</span></div>:null;
 const count=(result:Result<{items:unknown[];more:boolean}>)=>result.failed?t.unavailable:result.value?(result.value.more&&result.value.items.length===0?"—":previewCount(result.value.items.length,result.value.more)):"…";
 const status=(value:string|undefined)=>(scheduleCopy[locale].statuses as Record<string,string>)[value??""]??scheduleCopy[locale].statusOther;
 const card=(label:string,value:string|number,icon:"work"|"catalog"|"calendar"|"reports",tone:string,action:()=>void,hint:string)=><button className={`svc-daily-kpi ${tone}`} onClick={action}><span className="svc-daily-icon"><SellerWorkspaceIcon name={icon}/></span><span><span>{label}</span><strong>{value}</strong><small>{hint} →</small></span></button>;
 const task=(item:TodayItem,kind:ServiceTaskLink["kind"],label:string,action:string)=>{const ref=item.request_ref||item.reservation_ref||item.thread_ref;return ref?<li key={`${kind}:${ref}`}><span className="svc-daily-icon blue"><SellerWorkspaceIcon name={kind==="reservations"?"calendar":"work"}/></span><div><small>{label}</small><h4>{item.offering||item.title||item.selected_offering_name||item.service_name||label}</h4>{item.requester&&<p>{item.requester}</p>}{item.starts_at&&<p>{serviceTimestamp(item.starts_at,locale)}</p>}{item.expires_at&&<p>{t.expires}: {serviceTimestamp(item.expires_at,locale)}</p>}<button className="svc-primary" onClick={()=>onOpen({kind,ref})}>{action}<span className="sr-only"> {item.offering||item.title||item.service_name}</span></button></div></li>:null;};
 const queues=data.value?[data.value.requests,data.value.pending,data.value.messages]:[];
 return <section aria-label={ui.overview} className="svc-today svc-daily">
  <header className="svc-daily-banner"><div><p>{new Intl.DateTimeFormat(locale,{dateStyle:"full",timeZone:SERVICE_TIME_ZONE}).format(new Date(`${day}T12:00:00Z`))} · Kinshasa</p><h2>{w.headline}</h2><p>{t.intro}</p></div><button onClick={retry}>{ui.refresh}</button><svg className="svc-daily-landscape" aria-hidden="true" viewBox="0 0 500 160"><circle cx="325" cy="45" r="32" fill="#f6dfab"/><path d="M0 160Q120 40 250 115Q370 50 500 150v10" fill="#b7cbb1"/><path d="M220 160Q350 85 500 125v35" fill="#8fa98a"/><path d="m340 92 45-39 45 39v68h-90z" fill="#eef2e7"/><path d="m332 92 53-47 53 47" fill="#536f5d"/><path d="M375 160v-35h20v35M354 105h12v16h-12M404 105h12v16h-12" fill="#80947c"/><path d="M285 160v-55m175 55v-50" stroke="#536f5d" strokeWidth="5"/><ellipse cx="285" cy="102" rx="14" ry="28" fill="#718e71"/><ellipse cx="460" cy="108" rx="16" ry="30" fill="#718e71"/></svg></header>
  <div className="svc-daily-kpis">
   {capabilities.includes("profile")&&card(ui.published,active.filter(row=>row.visible_to_customers===true).length,"catalog","green",()=>navigate("services"),ui.manage)}
   {canWork&&card(t.requests,data.failed?t.unavailable:data.value?previewCount(uniqueTasks(data.value.requests.items).length,data.value.requests.has_more):"…","work","blue",()=>onAll("requests"),ui.requests)}
   {showCalendar&&card(t.appointments,count(calendar),"calendar","amber",()=>navigate("calendar"),ui.calendar)}
   {canWork&&card(t.jobs,count(jobs),"reports","purple",()=>onAll("reservations"),ui.work)}
  </div>
  <div className="svc-daily-columns">
   {canWork&&<section className="svc-daily-panel svc-daily-attention"><header><h3>{t.attention}</h3><button onClick={()=>onAll("requests")}>{t.all} →</button></header>{state(data)}{data.value&&<>{queues.every(queue=>!queue.items.length&&!queue.has_more)?<div className="svc-daily-clear"><span aria-hidden="true">✓</span><div><strong>{t.clear}</strong><p>{t.clearHelp}</p></div></div>:<ul>{uniqueTasks(data.value.requests.items).map(item=>task(item,"requests",t.requests,t.reply))}{uniqueTasks(data.value.pending.items).map(item=>task(item,"reservations",t.pending,t.booking))}{uniqueTasks(data.value.messages.items).map(item=>task(item,"messages",t.messages,t.open))}</ul>}{queues.some(queue=>queue.has_more)&&<p className="svc-daily-note">{t.limited}</p>}</>}
    {jobs.value&&jobs.value.items.length>0&&<details className="svc-daily-active"><summary>{t.jobs} · {previewCount(jobs.value.items.length,jobs.value.more)}</summary><ul>{jobs.value.items.slice(0,3).map(item=>task(item,"reservations",status(item.status),t.job))}</ul><button onClick={()=>onAll("reservations")}>{t.all} →</button></details>}{jobs.value?.more&&<p className="svc-daily-note">{t.limited}</p>}
   </section>}
   {showCalendar&&<section className="svc-daily-panel svc-daily-schedule"><header><h3>{t.schedule}</h3><button onClick={()=>navigate("calendar")}>{ui.calendar} →</button></header>{state(calendar)}{calendar.value&&<>{calendar.value.items.length===0?<p className="svc-daily-empty">{t.noSchedule}</p>:<ol>{calendar.value.items.map(item=><li key={item.reference}><time dateTime={item.startsAt}>{new Intl.DateTimeFormat(locale,{hour:"numeric",minute:"2-digit",timeZone:SERVICE_TIME_ZONE}).format(new Date(item.startsAt))}</time><button onClick={()=>onOpen({kind:"reservations",ref:item.reference})}><strong>{item.title}</strong><small>{status(item.status)}</small></button></li>)}</ol>}{calendar.value.more&&<p className="svc-daily-note">{t.limited}</p>}</>}</section>}
  </div>
  <section className="svc-daily-panel"><header><h3>{t.quick}</h3></header><div className="svc-daily-actions">{([...(canWork?["work" as const]:[]),...(canCalendar?["calendar" as const]:[]),...(capabilities.includes("profile")?["services" as const]:[]),...(capabilities.includes("requests_quotes")?["available" as const]:[]),...(canCalendar?["share" as const]:[])]).map((view,index)=><button className={["green","blue","amber","purple"][index%4]} key={view} onClick={()=>navigate(view)}><SellerWorkspaceIcon name={view==="calendar"?"calendar":view==="services"?"catalog":view==="share"?"document":"work"}/><strong>{ui[view]}</strong><small>{view==="work"?ui.requestsHint:view==="calendar"?ui.calendarIntro:view==="services"?ui.serviceHint:view==="share"?ui.shareIntro:ui.availableIntro}</small><span aria-hidden="true">→</span></button>)}</div></section>
  {actions}
 </section>;
}
