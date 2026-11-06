'use client';
import './account-deletion.css';
import {useRef,useState} from 'react';
import {deletionText} from '../../lib/account-deletion-copy';
import {securityActionErrorText} from '../../lib/account-security-errors';
import {AccountDeletionReview} from './account-deletion-review';
export type DeletionObligation={reference:string;kind:string;action_path:string};
export type DeletionReceipt={reference:string;status:string;scheduled_at:string;can_cancel:boolean};
type Preview={eligible:boolean;obligations:DeletionObligation[];retained_records:boolean};
type Locale='en'|'fr'|'ln'|'sw';
export function localDeletionDate(value:string,locale:Locale){return new Intl.DateTimeFormat(locale,{dateStyle:'full',timeStyle:'long'}).format(new Date(value));}
export function obligationLabel(locale:Locale,kind:string){
 const known=['organization_responsibilities','service','wenze','order','seller_order','restaurant_order','restaurant_reservation','hotel','wewa','refund'];
 return deletionText(locale,known.includes(kind)?kind as 'service':'blocked');
}
type Props={locale:Locale;api:(path:string,body?:object)=>Promise<unknown>;authorize:(action:string)=>Promise<string>};
export function AccountDeletion({locale,api,authorize}:Props){
 const t=(key:Parameters<typeof deletionText>[1])=>deletionText(locale,key);
 const [preview,setPreview]=useState<Preview|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[review,setReview]=useState(false),[estimate,setEstimate]=useState('');
 const lock=useRef(false),panel=useRef<HTMLDivElement>(null);
 async function run(action:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await action();}catch(e){setError(securityActionErrorText(locale,e)??t(e instanceof Error&&['security_deletion_review_required','security_deletion_obligations_changed'].includes(e.message)?'changed':'error'));}finally{setBusy(false);lock.current=false;}}
 async function check(){setPreview(null);setReview(false);await run(async()=>{const result=await api('delete/') as Preview;if(typeof result.eligible!=='boolean'||!Array.isArray(result.obligations)||result.eligible!==!result.obligations.length)throw Error();setPreview(result);setEstimate(new Date(Date.now()+30*86400000).toISOString());requestAnimationFrame(()=>panel.current?.focus());});}
 async function confirm(){await run(async()=>{const authorization=await authorize('delete');let result:DeletionReceipt;
  try{result=await api('delete/',{authorization,confirmed:true}) as DeletionReceipt;}catch(error){
   // Retry an uncertain response with the same proof; keep it only in memory.
   if(error instanceof Error&&error.message==='security_unavailable'){
    try{result=await api('delete/',{authorization,confirmed:true}) as DeletionReceipt;}catch{setError(t('statusError'));return;}
   }else throw error;
  }
  if(!result.reference||!Number.isFinite(Date.parse(result.scheduled_at)))throw Error();
  sessionStorage.setItem('shida-deletion-receipt',JSON.stringify(result));
  window.location.assign(`${locale==='en'?'':'/'+locale}/shida/deletion/`);
 });}
 return <section id="account-deletion" className="account-deletion"><h3>{t('title')}</h3><p>{t('consequences')}</p><button type="button" disabled={busy} onClick={()=>void check()}>{busy?t('checking'):t('check')}</button>
 {error&&<div role="alert"><p>{error}</p><button type="button" disabled={busy} onClick={()=>void check()}>{t('retry')}</button></div>}
 <div ref={panel} tabIndex={-1}>{preview&&<><p>{t(preview.eligible?'eligible':'blocked')}</p>
 {!preview.eligible&&<ol>{preview.obligations.map(item=><li key={item.kind+item.reference}><p>{obligationLabel(locale,item.kind)}</p><p>{item.reference}</p><a href={`${locale==='en'?'':'/'+locale}${['/shida/service-requests/','/shida/wenze/orders/','/shida/restaurant-orders/','/shida/restaurant-reservations/'].includes(item.action_path)?item.action_path:'/shida/space/?view=support'}`}>{t('resolve')}</a></li>)}</ol>}
 <p>{t('retention')}</p><details><summary>{t('inventoryRetention').split('.')[0]}</summary><p>{t('inventoryRetention')}</p></details>
 {preview.eligible?<><p>{t('estimate')} <strong>{localDeletionDate(estimate,locale)}</strong></p><p>{t('verified')}</p><div className="deletion-actions"><button type="button" disabled={busy} onClick={()=>void confirm()}>{t('confirm')}</button><button type="button" disabled={busy} onClick={()=>{setPreview(null);setError('');}}>{t('keep')}</button></div></>:<><button type="button" disabled={busy} onClick={()=>setReview(true)}>{t('review')}</button>{review&&<AccountDeletionReview locale={locale} api={api} authorize={authorize} run={run} obligations={preview.obligations}/>}</>}
 </>}</div></section>;
}
