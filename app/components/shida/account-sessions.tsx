'use client';
import {useState} from 'react';
const copy={
 en:{load:'View active sessions',current:'This session',other:'Other session',seen:'Last active',end:'Sign out this session',help:'Session dates are shown below. Device names are not recorded.',confirm:'Confirm sign out',cancel:'Cancel',empty:'No active sessions.'},
 fr:{load:'Voir les sessions actives',current:'Cette session',other:'Autre session',seen:'Dernière activité',end:'Déconnecter cette session',help:'Les dates des sessions sont indiquées ci-dessous. Les noms des appareils ne sont pas enregistrés.',confirm:'Confirmer la déconnexion',cancel:'Annuler',empty:'Aucune session active.'},
 ln:{load:'Tala ba sessions oyo ezali kosala',current:'Session oyo',other:'Session mosusu',seen:'Mosala ya suka',end:'Bima na session oyo',help:'Badati ya ba sessions ezali awa. Bankombo ya ba appareils ebombami te.',confirm:'Ndima kobima',cancel:'Kolongola',empty:'Session moko te ezali kosala.'},
 sw:{load:'Angalia vipindi vinavyotumika',current:'Kipindi hiki',other:'Kipindi kingine',seen:'Shughuli ya mwisho',end:'Ondoka kwenye kipindi hiki',help:'Tarehe za vipindi zinaonyeshwa hapa. Majina ya vifaa hayajahifadhiwa.',confirm:'Thibitisha kuondoka',cancel:'Ghairi',empty:'Hakuna kipindi kinachotumika.'},
};
type Session={reference:string;current:boolean;last_seen_at:string};
export function AccountSessions({locale,api,authorize,run,onLogout}:{locale:keyof typeof copy;api:(path:string,body?:object)=>Promise<{sessions?:Session[];current?:boolean}>;authorize:(action:string)=>Promise<string>;run:(work:()=>Promise<void>)=>Promise<void>;onLogout:()=>void}){
 const [sessions,setSessions]=useState<Session[]|null>(null),[selected,setSelected]=useState<string|null>(null);const t=copy[locale];
 async function load(){const data=await api('sessions/');if(!Array.isArray(data.sessions))throw Error();setSessions(data.sessions);}
 return <div><p>{t.help}</p><button type="button" onClick={()=>void run(load)}>{t.load}</button>{sessions&&<ul>{sessions.map(session=><li key={session.reference}>
  <strong>{session.current?t.current:t.other}</strong><p>{t.seen}: {new Date(session.last_seen_at).toLocaleString(locale)}</p>
  <button type="button" onClick={()=>setSelected(session.reference)}>{t.end}</button>
  {selected===session.reference&&<div><button type="button" onClick={()=>void run(async()=>{const authorization=await authorize('sessions');const result=await api('sessions/revoke-one/',{reference:session.reference,authorization});setSelected(null);if(result.current)onLogout();else await load();})}>{t.confirm}</button><button type="button" onClick={()=>setSelected(null)}>{t.cancel}</button></div>}
 </li>)}</ul>}{sessions?.length===0&&<p>{t.empty}</p>}</div>;
}
