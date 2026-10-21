"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {workdayCopy} from "../../lib/services-workday-copy";
import {serviceTimestamp} from "../../lib/service-time";

export type ServiceTaskLink={kind:"requests"|"reservations"|"messages";ref:string};
type Item={request_ref?:string;reservation_ref?:string;thread_ref?:string;offering?:string;requester?:string;title?:string;starts_at?:string;expires_at?:string;unread_count?:number};
type Queue={items:Item[];has_more:boolean};
type Today={date:string;timezone:string;requests:Queue;pending:Queue;upcoming:Queue;messages:Queue};
const copy={
 en:{title:"Today",intro:"All your services, one place to plan your work.",requests:"Requests needing a reply",pending:"Bookings to approve",upcoming:"Today and the next 6 days",messages:"Unread conversations",empty:"Nothing here for now.",open:"Open",all:"View all",refresh:"Refresh",loading:"Loading your work…",failed:"Your work could not be loaded. Check your connection and try again.",expires:"Reply by"},
 fr:{title:"Aujourd’hui",intro:"Tous vos services, un seul endroit pour organiser votre travail.",requests:"Demandes à traiter",pending:"Réservations à confirmer",upcoming:"Aujourd’hui et les 6 jours suivants",messages:"Conversations non lues",empty:"Rien pour le moment.",open:"Ouvrir",all:"Tout voir",refresh:"Actualiser",loading:"Chargement de vos missions…",failed:"Impossible de charger vos missions. Vérifiez votre connexion et réessayez.",expires:"Répondre avant le"},
 ln:{title:"Lelo",intro:"Misala na yo nyonso na esika moko mpo na kobongisa mokolo.",requests:"Masengi ya koyanola",pending:"Ba rendez-vous ya kondima",upcoming:"Lelo mpe mikolo 6 oyo ekoya",messages:"Masolo oyo otángi naino te",empty:"Eloko ezali te sikoyo.",open:"Fungola",all:"Tala nyonso",refresh:"Zongisa",loading:"Tozali koluka misala na yo…",failed:"Misala ekoki te komonana. Tala connexion mpe meka lisusu.",expires:"Yanola liboso ya"},
 sw:{title:"Leo",intro:"Huduma zako zote, mahali pamoja kupanga kazi.",requests:"Maombi ya kujibu",pending:"Nafasi za kuidhinisha",upcoming:"Leo na siku 6 zinazofuata",messages:"Mazungumzo ambayo hujasoma",empty:"Hakuna kwa sasa.",open:"Fungua",all:"Angalia zote",refresh:"Sasisha",loading:"Tunapakia kazi zako…",failed:"Kazi zako hazikupakiwa. Angalia muunganisho na ujaribu tena.",expires:"Jibu kabla ya"},
} as const;
export function ServicesToday({base,binding,locale,onOpen,onAll,onDenied,actions}:{base:string;binding:string;locale:keyof typeof copy;onOpen:(task:ServiceTaskLink)=>void;onAll:(kind:ServiceTaskLink["kind"])=>void;onDenied:()=>void;actions?:ReactNode}){
 const t=copy[locale],denied=useRef(onDenied);
 useEffect(()=>{denied.current=onDenied;},[onDenied]);
 const [data,setData]=useState<Today|null>(null),[failed,setFailed]=useState(false),[refresh,setRefresh]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  queueMicrotask(()=>{if(active){setData(null);setFailed(false);}});
  fetch(`${base}/today?language=${locale}`,{credentials:"include",cache:"no-store",signal:controller.signal,headers:{Accept:"application/json","X-Shida-Session":binding}})
   .then(async response=>{if(!response.ok){if(active&&[401,403].includes(response.status))denied.current();throw Error();}return response.json();})
   .then(value=>{if(!["requests","pending","upcoming","messages"].every(key=>Array.isArray(value[key]?.items)))throw Error();if(active)setData(value);})
   .catch(error=>{if(active&&error.name!=="AbortError")setFailed(true);});
  const focus=()=>setRefresh(value=>value+1);window.addEventListener("focus",focus);
  return()=>{active=false;controller.abort();window.removeEventListener("focus",focus);};
 },[base,binding,locale,refresh]);
 const w=workdayCopy[locale];
 const queue=(key:"requests"|"pending"|"upcoming"|"messages")=>{
  if(!data)return null;
  if(key!=="upcoming"&&!data[key].items.length&&!data[key].has_more)return null;
  const kind=key==="pending"||key==="upcoming"?"reservations":key;
  return <section key={key} className={`svc-today-card svc-today-${key}`} aria-label={t[key]}>
   <div className="svc-today-card-heading"><h3>{t[key]}</h3><span className="svc-workday-count">{data[key].items.length}{data[key].has_more?"+":""}</span></div>
   {data[key].items.length===0?<p className="svc-workday-empty">{t.empty}</p>:<ul>{data[key].items.map(item=>{
    const ref=item.request_ref||item.reservation_ref||item.thread_ref;
    return ref?<li key={ref}><div className="svc-workday-item"><strong>{item.offering||item.title}</strong>{item.requester&&<p>{item.requester}</p>}{item.starts_at&&<p className="svc-workday-time">{serviceTimestamp(item.starts_at,locale)}</p>}{item.expires_at&&<p>{t.expires}: {serviceTimestamp(item.expires_at,locale)}</p>}</div><button type="button" onClick={()=>onOpen({kind,ref})}>{t.open}<span className="sr-only"> {item.offering||item.title}</span></button></li>:null;
   })}</ul>}
   <button type="button" className="svc-workday-all" onClick={()=>onAll(kind)}>{t.all} →</button>
  </section>;
 };
 return <section aria-label={t.title} className="svc-today">
  <header className="svc-workday-heading"><div><p className="svc-workday-date">{data?`${data.date} · Kinshasa`:t.title}</p><h2>{w.headline}</h2><p>{t.intro}</p></div><button type="button" onClick={()=>setRefresh(value=>value+1)}>{t.refresh}</button></header>
  {!data&&!failed&&<p role="status">{t.loading}</p>}
  {failed&&<p role="alert">{t.failed}</p>}
  {data&&<>
   <div className="svc-workday-summary">{(["upcoming","requests","messages"] as const).map(key=><button type="button" key={key} onClick={()=>onAll(key==="upcoming"?"reservations":key)}><span>{t[key]}</span><strong>{data[key].items.length}{data[key].has_more?"+":""}</strong></button>)}</div>
   <div className="svc-today-grid"><div className="svc-workday-schedule"><h3 className="svc-workday-group-title">{w.schedule}</h3>{queue("upcoming")}</div><div className="svc-workday-replies"><h3 className="svc-workday-group-title">{w.reply}</h3>{queue("requests")}{queue("pending")}{queue("messages")}{![data.requests,data.pending,data.messages].some(queue=>queue.items.length||queue.has_more)&&<p className="svc-workday-empty">{t.empty}</p>}</div></div>
  </>}
  {actions}
 </section>;
}
