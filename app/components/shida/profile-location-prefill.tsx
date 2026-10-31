'use client';
import {useEffect,useRef,useState} from 'react';
import {readAccount} from '../../lib/account-load';
import {PERSONAL_SESSION_EVENT} from '../../lib/personal-session-browser';
import type {ProfileLocation} from '../../lib/profile-delivery';
const copy={
 en:{use:'Use my profile location',review:'Review and complete this delivery address before saving.',unavailable:'Your profile location cannot prefill this delivery. Enter the address below.',error:'Your profile could not be loaded. Try again or enter the address below.'},
 fr:{use:'Utiliser la localisation de mon profil',review:'Vérifiez et complétez cette adresse de livraison avant de l’enregistrer.',unavailable:'La localisation du profil ne convient pas à cette livraison. Saisissez l’adresse ci-dessous.',error:'Le profil est indisponible. Réessayez ou saisissez l’adresse ci-dessous.'},
 ln:{use:'Salela esika ya profil na ngai',review:'Tala mpe tondisa adresse ya livraison liboso ya kobomba.',unavailable:'Esika ya profil ekoki te mpo na livraison oyo. Koma adresse awa na nse.',error:'Profil efungwami te. Meka lisusu to koma adresse awa na nse.'},
 sw:{use:'Tumia eneo la wasifu wangu',review:'Kagua na ukamilishe anwani hii ya kupeleka kabla ya kuhifadhi.',unavailable:'Eneo la wasifu haliwezi kutumika hapa. Andika anwani hapa chini.',error:'Wasifu haujapatikana. Jaribu tena au andika anwani hapa chini.'},
};
export function ProfileLocationPrefill({binding,locale,onApply,disabled=false}:{binding:string;locale:keyof typeof copy;onApply:(values:ProfileLocation)=>boolean;disabled?:boolean}){
 const t=copy[locale],controller=useRef<AbortController|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{const clear=()=>controller.current?.abort();window.addEventListener(PERSONAL_SESSION_EVENT,clear);return()=>{clear();window.removeEventListener(PERSONAL_SESSION_EVENT,clear);};},[binding]);
 async function apply(){if(busy||disabled)return;const current=new AbortController();controller.current=current;setBusy(true);setMessage('');try{const profile=await readAccount('profile/',binding,current.signal);if(!current.signal.aborted)setMessage(onApply(profile.values)?t.review:t.unavailable);}catch{if(!current.signal.aborted)setMessage(t.error);}finally{if(!current.signal.aborted)setBusy(false);}}
 return <div><button type="button" disabled={disabled||busy} onClick={()=>void apply()}>{t.use}</button>{message&&<p role="status">{message}</p>}</div>;
}
