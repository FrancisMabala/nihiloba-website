"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {refinementCopy} from "../../lib/registration/refinement-copy";
import {PersonalSessionError,restorePersonalSession} from "../../lib/personal-session-browser";
import type {RegistrationLocale} from "../../lib/registration/copy";

export function WenzeSellingInvitations({locale}:{locale:RegistrationLocale}){
 const r=refinementCopy[locale],router=useRouter(),[failed,setFailed]=useState(false),[busy,setBusy]=useState(false);
 const base=locale==="en"?"/shida":`/${locale}/shida`;
 async function enter(event:React.MouseEvent<HTMLAnchorElement>,destination:string){
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();if(busy)return;setBusy(true);setFailed(false);
  try{await restorePersonalSession();router.push(destination);}
  catch(error){if(error instanceof PersonalSessionError&&error.status===401&&process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED==="true")router.push(`${base}/register/?returnTo=${encodeURIComponent(destination)}`);else if(error instanceof PersonalSessionError&&error.status===401)router.push(destination);else setFailed(true);}
  finally{setBusy(false);}
 }
 return <section className="wzp-selling" aria-labelledby="wzp-selling-title" aria-busy={busy}><h2 id="wzp-selling-title">{r.sellTitle}</h2><div className="wzp-selling-grid">{[
  {title:r.itemTitle,help:r.itemHelp,action:r.itemAction,path:`${base}/wenze/sell/`,icon:"↗"},
  {title:r.shopTitle,help:r.shopHelp,action:r.shopAction,path:`${base}/seller/wenze/`,icon:"▤"},
 ].map(card=><article key={card.path}><span className="wzp-selling-accent" aria-hidden="true">{card.icon}</span><h3>{card.title}</h3><p>{card.help}</p><a className="button button-secondary" href={card.path} onClick={event=>void enter(event,card.path)}>{card.action}</a></article>)}</div>{failed&&<p role="alert">{({en:"Could not check your account. Please try again.",fr:"Impossible de vérifier votre compte. Réessayez.",ln:"Tokoki kotala compte te. Meka lisusu.",sw:"Imeshindikana kukagua akaunti. Jaribu tena."})[locale]}</p>}</section>;
}
