"use client";
import {createContext, useContext, useEffect, useRef, useState, type ReactNode, type MouseEvent} from "react";
import type {ServiceLocale} from "../../lib/services-i18n";
import {restorePersonalSession, PersonalSessionError} from "../../lib/personal-session-browser";
import {PersonalWhatsAppLogin} from "./personal-whatsapp-login";

const words = {
  fr:["Connectez-vous pour lire l’offre complète","Retrouvez les missions, le profil recherché et les informations pour postuler.","Se connecter","Créer un compte","Fermer","Impossible de vérifier votre connexion. Réessayez."],
  en:["Sign in to read the full offer","See the responsibilities, the profile sought and how to apply.","Sign in","Create an account","Close","We couldn’t check your session. Please try again."],
  ln:["Kota mpo na kotánga offre mobimba","Tala misala, profil oyo bazali koluka mpe ndenge ya kosenga mosala.","Kota","Fungola konti","Kanga","Tokoki kotala connexion na yo te. Meka lisusu."],
  sw:["Ingia kusoma tangazo lote","Angalia majukumu, sifa zinazohitajika na jinsi ya kutuma ombi.","Ingia","Fungua akaunti","Funga","Imeshindikana kukagua kipindi chako. Jaribu tena."],
} as const;
const SelectOffer = createContext<((event:MouseEvent<HTMLAnchorElement>)=>void)|null>(null);
export function JobAccessLink({href,children,primary=false}:{href:string;children:ReactNode;primary?:boolean}) {
  const select = useContext(SelectOffer);
  return <a href={href} onClick={select || undefined} className={primary ? "button button-primary" : undefined}>{children}{primary && <span aria-hidden="true"> →</span>}</a>;
}
export function JobAccess({locale,initialOffer,children}:{locale:ServiceLocale;initialOffer?:string;children:ReactNode}) {
  const base = (locale==="en"?"":"/"+locale)+"/shida";
  const shared = initialOffer && /^[\w-]{1,150}$/.test(initialOffer) ? base+"/emplois/"+initialOffer+"/" : "";
  const [offer,setOffer]=useState(shared), [login,setLogin]=useState(false), [error,setError]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null), opener=useRef<HTMLElement|null>(null), sequence=useRef(0);
  const [heading,message,signIn,register,close,unavailable]=words[locale];
  useEffect(()=>{const pending=sequence;return ()=>{pending.current++;};},[]);
  useEffect(()=>{if(offer && !dialog.current?.open) dialog.current?.showModal();},[offer]);
  function dismiss() {
    sequence.current++; dialog.current?.close();setOffer("");setLogin(false);setError(false);
    if(shared){const url=new URL(location.href);url.searchParams.delete("offer");url.searchParams.delete("intent");history.replaceState(history.state,"",url);}
    opener.current?.focus({preventScroll:true});
  }
  async function select(event:MouseEvent<HTMLAnchorElement>) {
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
    event.preventDefault();
    const target=event.currentTarget;opener.current=target;
    const path=target.pathname+target.search, current=++sequence.current;
    try {
      await restorePersonalSession(AbortSignal.timeout(10000));
      if(sequence.current===current)location.assign(path);
    } catch(e) {
      if(sequence.current!==current)return;
      setError(!(e instanceof PersonalSessionError && [401,403].includes(e.status)));setOffer(path);
    }
  }
  return <SelectOffer.Provider value={select}>{children}
    <dialog ref={dialog} className="job-access-dialog" aria-labelledby="job-access-title" onCancel={e=>{e.preventDefault();dismiss();}}>
      {offer && <><button className="job-access-close" type="button" aria-label={close} onClick={dismiss}>×</button>
        <h2 id="job-access-title">{heading}</h2>
        {login ? <PersonalWhatsAppLogin locale={locale} returnTo={offer} onAuthenticated={()=>location.assign(offer)}/> :
        <><p>{message}</p>{error && <p role="alert">{unavailable}</p>}<div className="job-access-actions">
          <button type="button" className="button button-primary" onClick={()=>setLogin(true)}>{signIn}</button>
          <a className="button button-secondary" href={base+"/register/?returnTo="+encodeURIComponent(offer)}>{register}</a>
        </div></>}
      </>}
    </dialog>
  </SelectOffer.Provider>;
}
