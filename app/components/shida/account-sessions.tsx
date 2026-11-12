'use client';
import {accountDesignText} from '../../lib/account-design-copy';
import {securityText} from '../../lib/account-security-copy';
import {readAccount} from '../../lib/account-load';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
import {useEffect,useState} from 'react';
const copy={
 en:{load:'View active sessions',current:'This session',other:'Other session',seen:'Last active',end:'Sign out this session',help:'Session dates are shown below. Device names are not recorded.',confirm:'Confirm sign out',cancel:'Cancel',empty:'No active sessions.'},
 fr:{load:'Voir les sessions actives',current:'Cette session',other:'Autre session',seen:'Dernière activité',end:'Déconnecter cette session',help:'Les dates des sessions sont indiquées ci-dessous. Les noms des appareils ne sont pas enregistrés.',confirm:'Confirmer la déconnexion',cancel:'Annuler',empty:'Aucune session active.'},
 ln:{load:'Tala ba sessions oyo ezali kosala',current:'Session oyo',other:'Session mosusu',seen:'Mosala ya suka',end:'Bima na session oyo',help:'Badati ya ba sessions ezali awa. Bankombo ya ba appareils ebombami te.',confirm:'Ndima kobima',cancel:'Kolongola',empty:'Session moko te ezali kosala.'},
 sw:{load:'Angalia vipindi vinavyotumika',current:'Kipindi hiki',other:'Kipindi kingine',seen:'Shughuli ya mwisho',end:'Ondoka kwenye kipindi hiki',help:'Tarehe za vipindi zinaonyeshwa hapa. Majina ya vifaa hayajahifadhiwa.',confirm:'Thibitisha kuondoka',cancel:'Ghairi',empty:'Hakuna kipindi kinachotumika.'},
};
type Session={reference:string;current:boolean;last_seen_at:string};
export function AccountSessions({locale,api,authorize,run,onLogout,binding,disabled}:{binding:string;disabled:boolean;locale:keyof typeof copy;api:(path:string,body?:object)=>Promise<{sessions?:Session[];current?:boolean}>;authorize:(action:string)=>Promise<string>;run:(work:()=>Promise<void>)=>Promise<void>;onLogout:()=>void}){
 const [sessions,setSessions]=useState<Session[]|null>(null),[selected,setSelected]=useState<string|null>(null);const t=copy[locale];
 const [attempt,setAttempt]=useState(0),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  void readAccount('sessions/',binding,controller.signal).then(data=>{
   if(!Array.isArray(data.sessions))throw Error();
   if(!controller.signal.aborted)setSessions(data.sessions);
  }).catch(()=>{if(!controller.signal.aborted)setFailed(true);});
  return ()=>controller.abort();
 },[binding,attempt]);
 function reload(){setFailed(false);setSessions(null);setAttempt(value=>value+1);}
 if(failed)return <div role="alert">{mySpaceCopy[locale].loadError} <button onClick={reload}>{mySpaceCopy[locale].retry}</button></div>;
 if(!sessions)return <p role="status">{securityText(locale,'loading')}</p>;
 return <fieldset disabled={disabled}>{sessions.length===1&&sessions[0].current&&<p>{accountDesignText(locale,'onlySession')}</p>}<details><summary>{t.load}</summary>{sessions&&<ul>{sessions.map(session=><li key={session.reference}>
  <strong>{session.current?t.current:t.other}</strong><p>{t.seen}: {new Date(session.last_seen_at).toLocaleString(locale)}</p>
  <button type="button" onClick={()=>setSelected(session.reference)}>{t.end}</button>
  {selected===session.reference&&<div><button type="button" onClick={()=>void run(async()=>{const authorization=await authorize('sessions');const result=await api('sessions/revoke-one/',{reference:session.reference,authorization});setSelected(null);if(result.current)onLogout();else reload();})}>{t.confirm}</button><button type="button" onClick={()=>setSelected(null)}>{t.cancel}</button></div>}
 </li>)}</ul>}{sessions?.length===0&&<p>{t.empty}</p>}{sessions.some(session=>!session.current)&&<button onClick={()=>void run(async()=>{const authorization=await authorize('sessions');await api('sessions/revoke/',{authorization});reload();})}>{securityText(locale,'revoke')}</button>}</details></fieldset>;
}
