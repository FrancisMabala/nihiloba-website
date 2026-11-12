'use client';
import './account-deletion.css';
import {useEffect,useRef,useState} from 'react';
import {accountDesignText} from '../../lib/account-design-copy';
import {deletionText} from '../../lib/account-deletion-copy';
import {deletionUx,obligationCount} from '../../lib/deletion-ux-copy';
import {obligationTitle,obligationDetail,obligationHref,type DeletionObligation,type DeletionLocale as Locale} from '../../lib/deletion-obligations';
import {SecurityActionError,securityActionErrorText} from '../../lib/account-security-errors';
import {AccountDeletionReview} from './account-deletion-review';
import {ConfirmationDialog,confirmationCopy} from './confirmation-dialog';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
export type {DeletionObligation} from '../../lib/deletion-obligations';
export type DeletionReceipt={reference:string;status:string;scheduled_at:string;can_cancel:boolean};
type Preview={eligible:boolean;obligations:DeletionObligation[];retained_records:boolean};
type Failure={kind:'eligibility'|'uncertain';noneConfirmed:boolean;note:string};
export function localDeletionDate(value:string,locale:Locale){return new Intl.DateTimeFormat(locale,{dateStyle:'full',timeStyle:'long'}).format(new Date(value));}
export function obligationLabel(locale:Locale,kind:string){return obligationTitle(locale,{kind,reference:''});}
function validReceipt(value:unknown):value is DeletionReceipt{const item=value as DeletionReceipt;return !!item&&typeof item.reference==='string'&&!!item.reference&&Number.isFinite(Date.parse(item.scheduled_at));}
type Props={verificationIssue?:string|null;locale:Locale;api:(path:string,body?:object)=>Promise<unknown>;authorize:(action:string)=>Promise<string>};
export function AccountDeletion({locale,api,authorize,verificationIssue}:Props){
 const t=(key:Parameters<typeof deletionText>[1])=>deletionText(locale,key),u=(key:Parameters<typeof deletionUx>[1])=>deletionUx(locale,key);
 const [preview,setPreview]=useState<Preview|null>(null),[verified,setVerified]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[review,setReview]=useState(false),[reviewOpened,setReviewOpened]=useState(false),[selectedItem,setSelectedItem]=useState<string|null>(null),[estimate,setEstimate]=useState(''),[failure,setFailure]=useState<Failure|null>(null),[uncertain,setUncertain]=useState(false);
 const focusOrigin=useRef<HTMLElement|null>(null);
 const lock=useRef(false),panel=useRef<HTMLDivElement>(null),pendingProof=useRef<string|null>(null),returned=useRef(false),checkLatest=useRef<()=>Promise<void>>(async()=>{}),alive=useRef(true);
 useEffect(()=>{alive.current=true;const refresh=()=>{if(returned.current&&!lock.current){returned.current=false;void checkLatest.current();}};window.addEventListener('focus',refresh);return()=>{alive.current=false;window.removeEventListener('focus',refresh);};},[]);
 useEffect(()=>{checkLatest.current=()=>check();});
 function receipt(result:unknown){if(!validReceipt(result))throw Error('security_unavailable');try{sessionStorage.setItem('shida-deletion-receipt',JSON.stringify(result));}catch{/* Optional convenience receipt; server state is authoritative. */}window.location.assign(`${locale==='en'?'':'/'+locale}/shida/deletion/`);}
 async function currentStatus(){const result=await api('delete/status/') as {deletion:unknown};if(result.deletion!==null&&!validReceipt(result.deletion))throw Error();return result;}
 async function check(rethrow=false){
  if(lock.current||pendingProof.current)return;if(!failure)focusOrigin.current=document.activeElement as HTMLElement;lock.current=true;setBusy(true);setError('');setVerified(false);
  try{const result=await api('delete/') as Preview;
   if(typeof result.eligible!=='boolean'||!Array.isArray(result.obligations)||result.eligible!==!result.obligations.length||result.obligations.some(item=>!item||typeof item.reference!=='string'||typeof item.kind!=='string'))throw Error();
   if(!alive.current)return;setPreview(result);setVerified(true);setFailure(null);setEstimate(new Date(Date.now()+30*86400000).toISOString());requestAnimationFrame(()=>panel.current?.focus());
  }catch(caught){
   let noneConfirmed=false;try{const status=await currentStatus();if(status.deletion){receipt(status.deletion);return;}noneConfirmed=true;}catch{/* Unknown remains unknown; no failure/no-request claim. */}
   const note=caught instanceof SecurityActionError&&caught.status===401?u('signIn'):securityActionErrorText(locale,caught)??'';
   if(alive.current)setFailure({kind:'eligibility',noneConfirmed,note});if(rethrow)throw new Error(note||u('failed'));
  }finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 async function run(action:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await action();}catch(caught){const changed=caught instanceof Error&&['security_deletion_review_required','security_deletion_obligations_changed'].includes(caught.message);if(changed)setVerified(false);setError(securityActionErrorText(locale,caught)??t(changed?'changed':'error'));}finally{setBusy(false);lock.current=false;}}
 async function reconcile(){
  if(!pendingProof.current)return;
  try{receipt(await api('delete/',{authorization:pendingProof.current,confirmed:true}));return;}catch{/* Same proof retries a receipt without creating another schedule. */}
  try{const result=await currentStatus();if(result.deletion){receipt(result.deletion);return;}}catch{/* A revoked original session requires a fresh sign-in to view status. */}
  setUncertain(true);setVerified(false);setFailure({kind:'uncertain',noneConfirmed:false,note:''});throw Error(t('statusError'));
 }
 async function confirm(){if(lock.current||!verified||!preview?.eligible||pendingProof.current)return;
  await run(async()=>{pendingProof.current=await authorize('delete');
   try{receipt(await api('delete/',{authorization:pendingProof.current,confirmed:true}));}
   catch(caught){if(caught instanceof Error&&['security_deletion_review_required','security_deletion_obligations_changed'].includes(caught.message)){pendingProof.current=null;throw caught;}await reconcile();}
  });
 }
 function openReview(reference:string|null=null){setSelectedItem(reference);setReviewOpened(true);setReview(true);}
 const icons:Record<string,SpaceIconName>={organization_responsibilities:'business',restaurant_order:'restaurant',restaurant_reservation:'restaurant',service:'tool',wenze:'shop',order:'orders',seller_order:'shop',hotel:'home',wewa:'people',refund:'receipts'};
 return <section id="account-deletion" className="account-deletion">
 <p>{u('intro')}</p>
 {!preview&&!uncertain&&<button className="deletion-primary" type="button" disabled={busy} onClick={()=>void check()}>{busy?t('checking'):t('check')}</button>}
 {busy&&<p role="status">{confirmationCopy[locale].working}</p>}
 {error&&!failure&&<p role="alert">{error}</p>}
 {uncertain&&<div role="status"><p>{t('statusError')}</p><a href={`${locale==='en'?'':'/'+locale}/shida/deletion/`}>{u('status')}</a></div>}
 <div ref={panel} tabIndex={-1}>{preview&&<>
 {!verified&&<p className="deletion-warning" role="status">{u('stale')}</p>}
 {verified&&<div className={preview.eligible?'deletion-ready':'deletion-warning'} role="status"><SpaceIcon name={preview.eligible?'check':'warning'}/><div><strong>{preview.eligible?t('eligible'):obligationCount(locale,preview.obligations.length)}</strong>{!preview.eligible&&<p>{t('blocked')}</p>}</div></div>}
 {!preview.eligible&&<ul className="deletion-obligations">{preview.obligations.map(item=>{const href=obligationHref(locale,item);return <li key={item.kind+item.reference}><span className="deletion-kind"><SpaceIcon name={icons[item.kind]??'requests'}/></span><div><strong>{obligationTitle(locale,item)}</strong><p>{obligationDetail(locale,item)}</p></div>{href?<a href={href} target="_blank" rel="noopener noreferrer" onClick={()=>{returned.current=true;setVerified(false);}}>{u(item.action==='organization'?'manage':item.kind==='restaurant_order'?'order':'open')} <span aria-hidden="true">↗</span></a>:<button type="button" disabled={busy||!verified} onClick={()=>openReview(item.reference)}>{u('review')}</button>}</li>;})}</ul>}
 {preview.eligible&&verified&&!uncertain&&<div className="deletion-confirmation"><p>{u('summary')}</p><p>{t('estimate')} <strong>{localDeletionDate(estimate,locale)}</strong></p><p>{t('verified')}</p>{verificationIssue&&<p>{securityActionErrorText(locale,new Error(verificationIssue))}</p>}<p className="deletion-settings"><a href="#account-verification">{accountDesignText(locale,'securityTitle')}</a> · <a href="#account-recovery-verification">{accountDesignText(locale,'recoveryTitle')}</a></p><div className="deletion-actions"><button className="deletion-destructive" type="button" disabled={busy} onClick={()=>void confirm()}>{t('confirm')}</button><button type="button" disabled={busy} onClick={()=>{setPreview(null);setVerified(false);setError('');setReview(false);}}>{t('keep')}</button></div></div>}
 <div className="deletion-actions">{!preview.eligible&&<button className="deletion-primary" type="button" disabled={busy||!verified} onClick={()=>openReview()}>{u('review')}</button>}{!uncertain&&<button type="button" disabled={busy} onClick={()=>void check()}>{u('refresh')}</button>}</div>
 </>}</div>
 {reviewOpened&&<div hidden={!review}><AccountDeletionReview locale={locale} api={api} authorize={authorize} run={run} obligations={preview?.obligations??[]} selectedItem={selectedItem} enabled={verified&&!busy} onClose={()=>setReview(false)}/></div>}
 <details className="deletion-consequences"><summary><SpaceIcon name="receipts"/>{u('consequences')}</summary><p>{u('summary')}</p></details>
 {failure&&<ConfirmationDialog locale={locale} onClose={()=>setFailure(null)} options={{returnFocus:()=>focusOrigin.current?.isConnected?focusOrigin.current:panel.current,severity:'warning',title:u('unavailable'),description:failure.kind==='uncertain'?t('statusError'):u('failed'),supportingText:failure.note||u(failure.noneConfirmed?'noRequest':'unknown'),closeLabel:u('close'),cancelLabel:u('close'),confirmLabel:failure.kind==='uncertain'?u('status'):t('retry'),onConfirm:async()=>{if(failure.kind==='eligibility')await check(true);else{if(lock.current)throw Error(t('checking'));lock.current=true;setBusy(true);try{await reconcile();}finally{lock.current=false;setBusy(false);}}},errorMessage:caught=>caught instanceof Error?caught.message:u('failed')}}/>}
 </section>;
}
