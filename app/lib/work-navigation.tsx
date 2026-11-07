"use client";
import {useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {ConfirmationDialog,type ConfirmationLocale} from '../components/shida/confirmation-dialog';

const copy={
 en:{title:'Leave this form?',action:'Leave form',stay:'Stay here',help:'Unsaved changes may be lost. Leaving does not cancel a request already sent. Check its result before repeating it.'},
 fr:{title:'Quitter ce formulaire ?',action:'Quitter le formulaire',stay:'Rester ici',help:'Les modifications non enregistrées peuvent être perdues. Quitter n’annule pas une demande déjà envoyée. Vérifiez son résultat avant de la répéter.'},
 ln:{title:'Kobima na formulaire oyo?',action:'Bima na formulaire',stay:'Tikala awa',help:'Mbongwana oyo ebombami te ekoki kobunga. Kobima elongolaka te demande oyo etindami. Tala mbano na yango liboso ya kotinda lisusu.'},
 sw:{title:'Ondoka kwenye fomu hii?',action:'Ondoka kwenye fomu',stay:'Baki hapa',help:'Mabadiliko ambayo hujahifadhi yanaweza kupotea. Kuondoka hakughairi ombi lililotumwa. Kagua matokeo yake kabla ya kulirudia.'}
};
const drafts=new Map<symbol,{message:string;locale:ConfirmationLocale}>();
let cancelActive:(()=>void)|null=null;
export function useWorkDraft(dirty:boolean,message:string,locale:ConfirmationLocale){
 const id=useRef(Symbol('work-draft'));
 useEffect(()=>{if(!dirty)return;const key=id.current;drafts.set(key,{message,locale});const unload=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',unload);return()=>{drafts.delete(key);cancelActive?.();window.removeEventListener('beforeunload',unload);};},[dirty,message,locale]);
}
/** A second navigation is rejected while the first decision is open. No saved data is removed. */
export function leaveWork():Promise<boolean>{
 if(cancelActive)return Promise.resolve(false);
 if(!drafts.size)return Promise.resolve(true);
 const entries=[...drafts.values()],locale=entries[entries.length-1].locale,c=copy[locale];
 return new Promise(resolve=>{
  const host=document.createElement('div');document.body.appendChild(host);const root=createRoot(host);let settled=false;
  const finish=(value:boolean)=>{if(settled)return;settled=true;cancelActive=null;resolve(value);queueMicrotask(()=>{root.unmount();host.remove();});};
  cancelActive=()=>finish(false);
  root.render(<ConfirmationDialog locale={locale} options={{title:c.title,description:[...new Set(entries.map(entry=>entry.message)),c.help].join(' '),confirmLabel:c.action,cancelLabel:c.stay,severity:'warning',onConfirm:()=>finish(true)}} onClose={()=>finish(false)}/>);
 });
}
