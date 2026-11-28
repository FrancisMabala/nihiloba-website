'use client';
import {useState,type ReactNode} from 'react';
import {personalSpaceMobileCopy} from '../../lib/personal-space-mobile-copy';
import type {WenzeLocale} from '../../lib/wenze-copy';
import {FinanceSheet} from './finance-sheet';

export function QuickListingActions({locale,name,children}:{locale:WenzeLocale;name:string;children:(close:()=>void,returnFocus:()=>HTMLElement|null)=>ReactNode}){
 const [opener,setOpener]=useState<HTMLButtonElement|null>(null);
 const close=()=>setOpener(null);
 const label=personalSpaceMobileCopy[locale].actions;
 return <>
  <button type="button" className="qs-more" aria-haspopup="dialog" aria-expanded={opener!==null} aria-label={`${label} — ${name}`} onClick={event=>{event.currentTarget.focus();setOpener(event.currentTarget);}}><span aria-hidden="true">•••</span></button>
  {opener&&<FinanceSheet title={name} locale={locale} onClose={close}><div className="qs-context-actions">{children(close,()=>opener)}</div></FinanceSheet>}
 </>;
}
