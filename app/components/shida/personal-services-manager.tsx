"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {PersonalWhatsAppLogin} from "./personal-whatsapp-login";
import {ServicesManagement} from "./services-management";
import {restorePersonalSession,PERSONAL_SESSION_EVENT,type PersonalSession} from "@/app/lib/personal-session-browser";

type Locale="fr"|"en"|"ln"|"sw";
const names={fr:"Mes services",en:"My Services",ln:"Misala na ngai",sw:"Huduma zangu"};
const signIn={fr:"Connectez-vous avec votre compte personnel pour gérer vos services.",en:"Sign in with your Personal account to manage your services.",ln:"Kota na compte na yo mpo na kotambwisa misala na yo.",sw:"Ingia kwa akaunti yako binafsi ili kusimamia huduma zako."};
export function PersonalServicesManager({locale}:{locale:Locale}){
 const [session,setSession]=useState<PersonalSession|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;const check=async()=>{try{const value=await restorePersonalSession();if(active)setSession(value);}catch{if(active)setSession(null);}finally{if(active)setLoading(false);}};
  void check();const focus=()=>void check();window.addEventListener(PERSONAL_SESSION_EVENT,focus);window.addEventListener("focus",focus);return()=>{active=false;window.removeEventListener(PERSONAL_SESSION_EVENT,focus);window.removeEventListener("focus",focus);};},[]);
 const path=(lang:Locale)=>`${lang==="en"?"":`/${lang}`}/shida/seller/services`;
 return <main lang={locale} style={{maxWidth:1100,margin:"auto",padding:"1rem"}}><nav aria-label="Services"><Link href={`${locale==="en"?"":`/${locale}`}/shida/services`}>Services</Link> · {(["fr","en","ln","sw"] as Locale[]).map(lang=><span key={lang}> <Link href={path(lang)} hrefLang={lang} aria-current={lang===locale?"page":undefined}>{lang.toUpperCase()}</Link> </span>)}</nav>
  <h1>{names[locale]}</h1>{loading?<p role="status">…</p>:session?<ServicesManagement key={session.binding+locale} binding={session.binding} locale={locale}/>:<section><p>{signIn[locale]}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>void restorePersonalSession().then(setSession).catch(()=>setSession(null))}/></section>}
 </main>;
}
