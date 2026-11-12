"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {readWorkList} from "../../lib/services-work-list";
import {workMatches,type WorkFilter} from "../../lib/services-work-model";
import {serviceTimestamp,SERVICE_TIME_ZONE,shiftDay} from "../../lib/service-time";
import {localDate} from "../../lib/shida-calendar";
import {todayCopy} from "../../lib/services-today-copy";
import {providerCopy,type ProviderLocale,type ProviderView} from "../../lib/services-provider-copy";
import {scheduleCopy} from "../../lib/services-calendar-copy";
import {appointmentsForDay,previewCount,uniqueTasks,type TodayData,type TodayItem,type TodayOffering,type TodayAppointment} from "../../lib/services-today-model";
import {SellerWorkspaceIcon} from "./services-workspace-icon";
import "./services-today.css";
export type ServiceTaskLink={kind:"requests"|"reservations"|"messages";ref:string};
type Result<T>={value:T|null;failed:boolean};
type Props={base:string;binding:string;locale:ProviderLocale;onOpen:(task:ServiceTaskLink)=>void;onAll:(kind:ServiceTaskLink["kind"],filter?:WorkFilter)=>void;onDenied:()=>void;actions?:ReactNode;offerings?:TodayOffering[];capabilities?:string[];onNavigate?:(view:ProviderView)=>void;onRefresh?:()=>void;loadAppointments?:(day:string,signal:AbortSignal)=>Promise<{items:TodayAppointment[];more:boolean}>};
export function ServicesToday(props:Props){return <Today key={`${props.base}:${props.binding}:${props.locale}`} {...props}/>;}
function Today({base,binding,locale,onOpen,onAll,onDenied,actions,offerings=[],capabilities=[],onNavigate,onRefresh,loadAppointments}:Props){
 const t=todayCopy[locale],ui=providerCopy[locale],denied=useRef(onDenied);
 useEffect(()=>{denied.current=onDenied;},[onDenied]);
 const [data,setData]=useState<Result<TodayData>>({value:null,failed:false});
 const [jobs,setJobs]=useState<Result<{items:TodayItem[];more:boolean}>>({value:null,failed:false});
 const [calendar,setCalendar]=useState<Result<{items:TodayAppointment[];more:boolean}>>({value:null,failed:false});
 const [newCount,setNewCount]=useState<number|null>(null);
 const [refresh,setRefresh]=useState(0);
 const canCalendar=!!loadAppointments||capabilities.includes("structured_availability"),canWork=capabilities.includes("reservations")&&capabilities.includes("messages");
 const active=offerings.filter(row=>row.is_active==="yes");
 const day=data.value?.date??localDate(new Date().toISOString(),SERVICE_TIME_ZONE);
 const retry=()=>{setRefresh(value=>value+1);onRefresh?.();};
 useEffect(()=>{
  const controller=new AbortController();let alive=true;
  async function get(path:string){const response=await fetch(`${base}${path}`,{credentials:"include",cache:"no-store",signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]),headers:{Accept:"application/json","X-Shida-Session":binding}});if(!response.ok){if(alive&&[401,403].includes(response.status))denied.current();throw Error();}return response.json();}
  queueMicrotask(()=>{if(alive){setData({value:null,failed:false});setJobs({value:null,failed:false});setNewCount(null);}});
  if(canWork){
   void get(`/today?language=${locale}`).then(value=>{if(!["requests","pending","upcoming","messages"].every(key=>Array.isArray(value[key]?.items)))throw Error();if(alive)setData({value,failed:false});}).catch(()=>{if(alive)setData({value:null,failed:true});});
   void Promise.all((["requests","reservations"] as const).map(source=>readWorkList(base,binding,source,()=>alive))).then(([requests,reservations])=>{
    if(alive){setNewCount(requests.filter(row=>workMatches(row,"new","requests")).length);setJobs({value:{items:reservations.filter(row=>workMatches(row,"jobs","reservations")),more:false},failed:false});}
   }).catch(error=>{if(alive){if(["401","403"].includes(error.message))denied.current();setJobs({value:null,failed:true});}});

  }
  const focus=()=>setRefresh(value=>value+1);window.addEventListener("focus",focus);
  return()=>{alive=false;controller.abort();window.removeEventListener("focus",focus);};
 },[base,binding,locale,refresh,canWork]);
 useEffect(()=>{
  if(!canCalendar)return;
  let alive=true;const controller=new AbortController();
  queueMicrotask(()=>{if(alive)setCalendar({value:null,failed:false});});
  const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]);
  const request=loadAppointments?loadAppointments(day,signal):(async()=>{
   const items:TodayAppointment[]=[];
   for(let page=1;;page++){
    const params=new URLSearchParams({date_from:day,date_to:shiftDay(day,1),page:String(page)});
    const response=await fetch(`${base}/calendar?${params}`,{credentials:"include",cache:"no-store",signal,headers:{Accept:"application/json","X-Shida-Session":binding}});
    if(!response.ok)throw Error(String(response.status));
    const value=await response.json();
    if(!Array.isArray(value.items))throw Error();
    items.push(...value.items);
    if(!value.has_more)return {items,more:false};
    if(page>=10000)throw Error();
   }
  })();
  void request.then(value=>{if(!Array.isArray(value.items))throw Error();if(alive)setCalendar({value:{items:appointmentsForDay(value.items,day),more:value.more},failed:false});}).catch(error=>{if(alive){if(["401","403"].includes(error.message))denied.current();setCalendar({value:null,failed:true});}});
  return()=>{alive=false;controller.abort();};
 },[base,binding,day,refresh,canCalendar,loadAppointments]);
 const showCalendar=canCalendar;
 const navigate=(view:ProviderView)=>onNavigate?.(view);
 const state=(result:Result<unknown>)=>result.failed?<div className="svc-daily-error" role="alert"><p>{t.failed}</p><button onClick={retry}>{t.retry}</button></div>:!result.value?<div className="svc-daily-skeleton" role="status"><span className="sr-only">{t.loading}</span></div>:null;
 const count=(result:Result<{items:unknown[];more:boolean}>)=>result.failed?t.unavailable:result.value?(result.value.more&&result.value.items.length===0?"—":previewCount(result.value.items.length,result.value.more)):"…";
 const status=(value:string|undefined)=>(scheduleCopy[locale].statuses as Record<string,string>)[value??""]??scheduleCopy[locale].statusOther;
 const card=(label:string,value:string|number,icon:"work"|"catalog"|"calendar"|"reports",tone:string,action:()=>void,_hint:string)=><button className={`svc-daily-kpi ${tone}`} onClick={action}><span className="svc-daily-icon"><SellerWorkspaceIcon name={icon}/></span><span><span>{label}</span><strong>{value}</strong></span></button>;
 const task=(item:TodayItem,kind:ServiceTaskLink["kind"],label:string,action:string)=>{const ref=item.request_ref||item.reservation_ref||item.thread_ref;return ref?<li key={`${kind}:${ref}`}><span className="svc-daily-icon blue"><SellerWorkspaceIcon name={kind==="reservations"?"calendar":"work"}/></span><div><small>{label}</small><h4>{item.offering||item.title||item.selected_offering_name||item.service_name||label}</h4>{item.requester&&<p>{item.requester}</p>}{item.starts_at&&<p>{serviceTimestamp(item.starts_at,locale)}</p>}{item.expires_at&&<p>{t.expires}: {serviceTimestamp(item.expires_at,locale)}</p>}<button className="svc-primary" onClick={()=>onOpen({kind,ref})}>{action}<span className="sr-only"> {item.offering||item.title||item.service_name}</span></button></div></li>:null;};
 const queues=data.value?[data.value.requests,data.value.pending,data.value.messages]:[];
 return <section aria-label={ui.overview} className="svc-today svc-daily">
  <header className="svc-daily-date"><p>{new Intl.DateTimeFormat(locale,{dateStyle:"full",timeZone:data.value?.timezone||SERVICE_TIME_ZONE}).format(new Date(`${day}T12:00:00Z`))} · {(data.value?.timezone||SERVICE_TIME_ZONE).split("/").pop()?.replaceAll("_"," ")}</p><button onClick={retry}>{ui.refresh}</button></header>
  <div className="svc-daily-kpis">
   {capabilities.includes("profile")&&card(ui.published,active.filter(row=>row.visible_to_customers===true).length,"catalog","green",()=>navigate("services"),ui.manage)}
   {canWork&&card(t.requests,jobs.failed?t.unavailable:newCount??"…","work","blue",()=>onAll("requests","new"),ui.requests)}
   {showCalendar&&card(t.appointments,count(calendar),"calendar","amber",()=>navigate("calendar"),ui.calendar)}
   {canWork&&card(t.jobs,count(jobs),"reports","purple",()=>onAll("reservations","jobs"),ui.work)}
  </div>
  <div className="svc-daily-columns">
   {canWork&&<section className="svc-daily-panel svc-daily-attention"><header><h3>{t.attention}</h3><button onClick={()=>onAll("requests")}>{t.all} →</button></header>{state(data)}{data.value&&<>{queues.every(queue=>!queue.items.length&&!queue.has_more)?<div className="svc-daily-clear"><span aria-hidden="true">✓</span><div><strong>{t.clear}</strong><p>{t.clearHelp}</p></div></div>:<ul>{uniqueTasks(data.value.requests.items).map(item=>task(item,"requests",t.requests,t.reply))}{uniqueTasks(data.value.pending.items).map(item=>task(item,"reservations",t.pending,t.booking))}{uniqueTasks(data.value.messages.items).map(item=>task(item,"messages",t.messages,t.open))}</ul>}{queues.some(queue=>queue.has_more)&&<p className="svc-daily-note">{t.limited}</p>}</>}
   </section>}
   {showCalendar&&<section className="svc-daily-panel svc-daily-schedule"><header><h3>{t.schedule}</h3><button onClick={()=>navigate("calendar")}>{ui.calendar} →</button></header>{state(calendar)}{calendar.value&&<>{calendar.value.items.length===0?<p className="svc-daily-empty">{t.noSchedule}</p>:<ol>{calendar.value.items.map(item=><li key={item.reference}><time dateTime={item.startsAt}>{new Intl.DateTimeFormat(locale,{hour:"numeric",minute:"2-digit",timeZone:SERVICE_TIME_ZONE}).format(new Date(item.startsAt))}</time><button onClick={()=>onOpen({kind:"reservations",ref:item.reference})}><strong>{item.title}</strong><small>{status(item.status)}</small></button></li>)}</ol>}{calendar.value.more&&<p className="svc-daily-note">{t.limited}</p>}</>}</section>}
  </div>
  {actions}
 </section>;
}
