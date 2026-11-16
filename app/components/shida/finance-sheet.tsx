"use client";
import {useEffect,useRef,type ReactNode} from 'react';
import {posText} from '@/app/lib/wenze-pos-copy';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
import './finance-sheet.css';

/** A native modal keeps focus and pointer input above the management navigation. */
export function FinanceSheet({title,locale,onClose,children}:{title:string;locale:WenzeLocale;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current,opener=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';dialog?.showModal();
  return()=>{dialog?.close();document.body.style.overflow=overflow;if(opener instanceof HTMLElement&&opener.isConnected)opener.focus({preventScroll:true});};
 },[]);
 return <dialog ref={ref} className="finance-sheet" aria-label={title} onCancel={event=>{event.preventDefault();onClose();}}><header><h2>{title}</h2><button type="button" autoFocus aria-label={posText(locale,'close')} onClick={onClose}>×</button></header>{children}</dialog>;
}
