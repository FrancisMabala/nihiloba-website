"use client";
import {useEffect,useRef,useState} from "react";
import Image from "next/image";
import {MarketplaceImage} from "./marketplace-image";
import {workplaceCopy} from "../../lib/services-workplace-copy";
import type {ProviderLocale} from "../../lib/services-provider-copy";
import "./services-workplace.css";
type ShareOffering={public_ref:string;provider_ref:string;service_name:string;name:string;commune:string|null;is_active:string;visible_to_customers?:boolean;professional_profile?:{name:string;photo:string|null}};
export function ServicesSharing({base,binding,locale,offerings,refreshToken,onDenied,initialRef,onClose}:{base:string;binding:string;locale:ProviderLocale;offerings:ShareOffering[];refreshToken:number;onDenied:()=>void;initialRef:string;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();},[]);
 const t=workplaceCopy[locale];const [target,setTarget]=useState(initialRef?"service":"profile"),[selected,setSelected]=useState(initialRef),[data,setData]=useState<{url:string;qr_image:string;name:string}|null>(null),[error,setError]=useState(""),[copied,setCopied]=useState(false),[attempt,setAttempt]=useState(0);
 const active=offerings.filter(row=>row.is_active==="yes"&&(target==="profile"||row.visible_to_customers===true));const row=active.find(row=>row.public_ref===selected)??(!selected||target==="profile"?active[0]:undefined);
 useEffect(()=>{const controller=new AbortController();queueMicrotask(()=>{if(!controller.signal.aborted){setData(null);setError("");setCopied(false);}});if(!row)return()=>controller.abort();void fetch(`${base}/${row.public_ref}/share?language=${locale}&target=${target}`,{credentials:"include",cache:"no-store",signal:controller.signal,headers:{"X-Shida-Session":binding}}).then(async response=>{if(!response.ok){if([401,403].includes(response.status))onDenied();throw Error(response.status===409?"unpublished":"failed");}const value=await response.json();const url=new URL(value.url);if(url.protocol!=="https:"||url.hostname!=="nihiloba.com"||url.username||url.password||!url.pathname.includes("/shida/services/")||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value.qr_image))throw Error();if(!controller.signal.aborted)setData(value);}).catch(e=>{if(!controller.signal.aborted)setError(e.message==="unpublished"?t.unavailable:t.failed);});return()=>controller.abort();},[base,binding,locale,row?.public_ref,target,refreshToken,attempt]); // eslint-disable-line react-hooks/exhaustive-deps
 const ready=data&&data.url===expectedUrl()?data:null;
 function expectedUrl(){if(!row)return "";const u=new URL(data?.url||"https://nihiloba.com");const prefix=locale==="en"?"":"/"+locale;
  const expected=target==="profile"?"/shida/services/providers/"+row.provider_ref:"/shida/services/"+row.public_ref;
  return (u.pathname.replace(/\/$/,"")===prefix+expected||u.pathname.replace(/\/$/,"")===expected)?u.href:"";
 }
 async function copy(){try{if(data){await navigator.clipboard.writeText(data.url);setCopied(true);}}catch{setError(t.failed);}}
 return <dialog ref={dialog} onClose={onClose} aria-labelledby="svc-share-title" className="svc-share-dialog"><section className="svc-profile-sharing"><header><h2 id="svc-share-title">{t.sharing}</h2><button type="button" aria-label={{fr:"Fermer",en:"Close",ln:"Kanga",sw:"Funga"}[locale]} onClick={()=>dialog.current?.close()}>×</button></header><div className="svc-sharing-tabs" role="group" aria-label={t.sharing}><button type="button" aria-pressed={target==="profile"} onClick={()=>setTarget("profile")}>{t.profile}</button><button type="button" aria-pressed={target==="service"} onClick={()=>setTarget("service")}>{t.service}</button></div>
 {row&&<article className="svc-sharing-profile"><MarketplaceImage src={row.professional_profile?.photo??null} alt={row.name} fallback="S" sizes="80px"/><div><h2>{row.professional_profile?.name??row.name}</h2><p>{row.commune}</p></div></article>}
 {target==="service"&&<label>{t.service}<select value={row?.public_ref??""} onChange={e=>setSelected(e.target.value)}>{active.map(item=><option key={item.public_ref} value={item.public_ref}>{item.service_name}</option>)}</select></label>}
 {!row&&<p role="status">{t.unavailable}</p>}{error&&<p role="status">{error} <button type="button" onClick={()=>setAttempt(n=>n+1)}>{t.retry}</button></p>}
 {ready&&data&&<article className="svc-sharing-card"><div className="svc-sharing-qr"><Image src={data.qr_image} width={300} height={300} unoptimized alt={t.qr}/><h3>{data.name}</h3><p>{t.qr}</p></div><div className="svc-sharing-actions"><a href={data.url} target="_blank" rel="noopener noreferrer">{t.open} ↗</a><input aria-label={t.copy} readOnly value={data.url}/><button type="button" className="svc-primary" onClick={async()=>{try{if(navigator.share)await navigator.share({title:data.name,url:data.url});else await copy();}catch(e){if(!(e instanceof DOMException&&e.name==="AbortError"))setError(t.failed);}}}>{t.share}</button><button type="button" onClick={()=>void copy()}>{t.copy}</button><a href={`https://wa.me/?text=${encodeURIComponent(data.name+" "+data.url)}`} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a><a href={data.qr_image} download={`shida-${target}-qr.png`}>{t.download}</a>{copied&&<p role="status">{t.copied}</p>}</div></article>}
 </section></dialog>;
}
