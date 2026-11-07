'use client';

import {useCallback,useEffect,useId,useRef,useState} from 'react';
import './confirmation-dialog.css';

export type ConfirmationLocale='en'|'fr'|'ln'|'sw';
export const confirmationCopy={
 en:{back:'Go back',working:'Working…',error:'The action could not be completed. Check the current information before trying again.',conflict:'The saved information changed. Close this dialog and reload before trying again.'},
 fr:{back:'Revenir',working:'En cours…',error:'Cette action n’a pas abouti. Vérifiez les informations actuelles avant de réessayer.',conflict:'Les informations enregistrées ont changé. Fermez cette fenêtre et rechargez avant de réessayer.'},
 ln:{back:'Zonga',working:'Ezali kosalema…',error:'Likambo oyo esimbi te. Tala makambo ya sikoyo liboso ya komeka lisusu.',conflict:'Makambo ebombami ebongwani. Kanga fenêtre oyo mpe zongisa makambo liboso ya komeka lisusu.'},
 sw:{back:'Rudi',working:'Inaendelea…',error:'Hatua haikukamilika. Kagua taarifa za sasa kabla ya kujaribu tena.',conflict:'Taarifa zilizohifadhiwa zimebadilika. Funga dirisha hili na upakie upya kabla ya kujaribu tena.'}
};
export type ConfirmationOptions={title:string;description:string;supportingText?:string;closeLabel?:string;returnFocus?:()=>HTMLElement|null;confirmLabel:string;cancelLabel?:string;severity?:'normal'|'warning'|'danger';onConfirm:()=>void|Promise<void>;errorMessage?:(error:unknown)=>string};

/** Callbacks must reject on failure; never pass a helper that swallows errors. */
export function useConfirmation(locale:ConfirmationLocale){
 const [options,setOptions]=useState<ConfirmationOptions|null>(null);
 const current=useRef<ConfirmationOptions|null>(null);
 const request=useCallback((next:ConfirmationOptions)=>{if(current.current)return;current.current=next;setOptions(next);},[]);
 const close=useCallback(()=>{current.current=null;setOptions(null);},[]);
 return {request,confirmation:options?<ConfirmationDialog locale={locale} options={options} onClose={close}/>:null};
}

export function ConfirmationDialog({locale,options,onClose}:{locale:ConfirmationLocale;options:ConfirmationOptions;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),safe=useRef<HTMLButtonElement>(null),lock=useRef(false),alive=useRef(true);
 const returnFocus=useRef(options.returnFocus);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const title=useId(),description=useId(),copy=confirmationCopy[locale];
 useEffect(()=>{alive.current=true;const node=dialog.current;const previous=returnFocus.current?.()??document.activeElement;node?.showModal();safe.current?.focus();return()=>{alive.current=false;node?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};},[]);
 function cancel(){if(!lock.current)onClose();}
 async function submit(){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{await options.onConfirm();if(alive.current)onClose();}
  catch(caught){if(alive.current)setError(options.errorMessage?.(caught)??(caught instanceof Error&&caught.message==='409'?copy.conflict:copy.error));}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 return <dialog ref={dialog} className="shida-confirmation" data-severity={options.severity??'normal'} aria-labelledby={title} aria-describedby={description} aria-busy={busy} onCancel={event=>{event.preventDefault();cancel();}}>
  {options.closeLabel&&<button className="shida-confirmation-close" type="button" aria-label={options.closeLabel} disabled={busy} onClick={cancel}>×</button>}
  <span className="shida-confirmation-symbol" aria-hidden="true">{options.severity==='danger'?'!':options.severity==='warning'?'!':'✓'}</span>
  <h2 id={title}>{options.title}</h2><p id={description}>{options.description}</p>
  {options.supportingText&&<p>{options.supportingText}</p>}
  {error&&<p className="shida-confirmation-error" role="alert">{error}</p>}
  {busy&&<p role="status">{copy.working}</p>}
  <div className="shida-confirmation-actions"><button ref={safe} type="button" disabled={busy} onClick={cancel}>{options.cancelLabel??copy.back}</button><button type="button" className="shida-confirmation-submit" disabled={busy} onClick={()=>void submit()}>{options.confirmLabel}</button></div>
 </dialog>;
}
