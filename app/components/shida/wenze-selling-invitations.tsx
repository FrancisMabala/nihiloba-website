"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {refinementCopy} from "../../lib/registration/refinement-copy";
import {PersonalSessionError,restorePersonalSession} from "../../lib/personal-session-browser";
import type {RegistrationLocale} from "../../lib/registration/copy";
import {ArrowRightIcon} from "../icons";
import {SpaceIcon} from "./account-space-icon";

export function WenzeSellingInvitations({locale,compact=false}:{locale:RegistrationLocale;compact?:boolean}){
 const r=refinementCopy[locale],router=useRouter(),[failed,setFailed]=useState(false),[busy,setBusy]=useState(false);
 const base=locale==="en"?"/shida":`/${locale}/shida`;
 async function enter(event:React.MouseEvent<HTMLAnchorElement>,destination:string){
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();if(busy)return;setBusy(true);setFailed(false);
  try{await restorePersonalSession();router.push(destination);}
  catch(error){if(error instanceof PersonalSessionError&&error.status===401&&process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED==="true")router.push(`${base}/register/?returnTo=${encodeURIComponent(destination)}`);else if(error instanceof PersonalSessionError&&error.status===401)router.push(destination);else setFailed(true);}
  finally{setBusy(false);}
 }
 const errorText=({en:"Could not check your account. Please try again.",fr:"Impossible de vérifier votre compte. Réessayez.",ln:"Tokoki kotala konti te. Meka lisusu.",sw:"Imeshindikana kukagua akaunti. Jaribu tena."})[locale];
 if(compact)return <><a className="button button-primary" href={base+"/wenze/sell/"} onClick={e=>void enter(e,base+"/wenze/sell/")}>{r.itemAction}</a><a className="button button-secondary" href={base+"/seller/wenze/"} onClick={e=>void enter(e,base+"/seller/wenze/")}>{r.shopAction}</a>{failed&&<p role="alert">{errorText}</p>}</>;
 return <section className="wzp-selling" aria-labelledby="wzp-selling-title" aria-busy={busy}><h2 id="wzp-selling-title">{r.sellTitle}</h2><div className="wzp-selling-grid">{[
  {title:r.itemTitle,help:r.itemHelp,action:r.itemAction,path:`${base}/wenze/sell/`,kind:"item" as const},
  {title:r.shopTitle,help:r.shopHelp,action:r.shopAction,path:`${base}/seller/wenze/`,kind:"shop" as const},
 ].map(card=><article key={card.path} data-selling={card.kind}><span className="compact-invitation-icon" aria-hidden="true"><SpaceIcon name={card.kind==="shop"?"shop":"orders"}/></span><h3>{card.title}</h3><p>{card.help}</p><a className="button button-primary" href={card.path} onClick={event=>void enter(event,card.path)}>{card.action}<ArrowRightIcon/></a></article>)}</div>{failed&&<p role="alert">{errorText}</p>}</section>;
}
