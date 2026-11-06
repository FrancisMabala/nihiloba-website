'use client';
import {useEffect,useState} from 'react';
import {deletionText} from '../../lib/account-deletion-copy';
import {localDeletionDate,type DeletionReceipt} from './account-deletion';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';
import {announcePersonalSessionChange} from '../../lib/personal-session-browser';
import {endEmploymentSession} from '../../services/shida/employment-browser-client';
import './account-deletion.css';
type Locale='en'|'fr'|'ln'|'sw';
export function AccountDeletionStatus({locale}:{locale:Locale}){
 const [data,setData]=useState<DeletionReceipt|null>(null),[binding,setBinding]=useState(''),[state,setState]=useState<'loading'|'login'|'ready'|'error'|'cancelled'>('loading'),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0);
 const t=(key:Parameters<typeof deletionText>[1])=>deletionText(locale,key),prefix=locale==='en'?'':'/'+locale;
 useEffect(()=>{let live=true;void fetch('/api/shida/personal/deletion/',{cache:'no-store'}).then(async response=>{
  if(response.status===401){if(live){try{const receipt=JSON.parse(sessionStorage.getItem('shida-deletion-receipt')||'null');if(receipt?.reference&&Number.isFinite(Date.parse(receipt.scheduled_at)))setData(receipt);}catch{}setState('login');}return;}
  if(!response.ok)throw Error();const result=await response.json();if(live){setData(result.deletion);setBinding(result.binding);setState('ready');sessionStorage.removeItem('shida-deletion-receipt');}
 }).catch(()=>{if(live)setState('error');});return()=>{live=false;};},[revision]);
 async function cancel(){if(busy||!data)return;setBusy(true);try{const response=await fetch('/api/shida/personal/security/delete/cancel/',{method:'POST',headers:{'Content-Type':'application/json','x-shida-session':binding},body:JSON.stringify({reference:data.reference,confirmed:true})});if(!response.ok)throw Error();sessionStorage.removeItem('shida-deletion-receipt');setState('cancelled');setData(null);announcePersonalSessionChange();}catch{setState('error');}finally{setBusy(false);}}
 async function signout(){if(busy)return;setBusy(true);try{await endEmploymentSession();sessionStorage.removeItem('shida-deletion-receipt');window.location.assign(prefix+'/shida/');}catch{setState('error');setBusy(false);}}
 return <main className="deletion-status" lang={locale}><p>SHIDA</p><h1>{t('title')}</h1>
 {state==='loading'?<p role="status">{t('checking')}</p>:state==='error'?<div role="alert"><p>{t('statusError')}</p><button onClick={()=>setRevision(n=>n+1)}>{t('retry')}</button></div>:state==='cancelled'?<><p role="status">{t('cancelled')}</p><a href={prefix+'/shida/space/'}>{t('account')}</a></>:<>
 {data&&<><p>{t('pending')}</p><p>{t('date')}: <strong>{localDeletionDate(data.scheduled_at,locale)}</strong></p><p>{t('retention')}</p><details><summary>{t('inventoryRetention').split('.')[0]}</summary><p>{t('inventoryRetention')}</p></details></>}
 {state==='login'?<><p>{t('signin')}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>setRevision(n=>n+1)}/></>:data?<><p>{!data.can_cancel?t('closed'):t('restoreHelp')}</p><div className="deletion-actions">{data.can_cancel&&<button disabled={busy} onClick={()=>void cancel()}>{t('cancel')}</button>}<button disabled={busy} onClick={()=>void signout()}>{t('signout')}</button></div></>:<><p>{t('none')}</p><a href={prefix+'/shida/space/'}>{t('account')}</a></>}
 </>}</main>;
}
