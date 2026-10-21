"use client";
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {calculate,checkoutText} from '@/app/lib/wenze-checkout-copy';
import {posText} from '@/app/lib/wenze-pos-copy';
import type {WenzeLocale} from '@/app/lib/wenze-copy';

export function CheckoutDialog({title,onClose,children,locale}:{title:string;onClose:()=>void;children:ReactNode;locale:WenzeLocale}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current,previous=document.body.style.overflow;document.body.style.overflow='hidden';dialog?.showModal();return()=>{dialog?.close();document.body.style.overflow=previous;};},[]);
 return <dialog ref={ref} className="wz-checkout-dialog" aria-label={title} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current){const bounds=ref.current.getBoundingClientRect();if(e.clientX<bounds.left||e.clientX>bounds.right||e.clientY<bounds.top||e.clientY>bounds.bottom)onClose();}}}><header><h2>{title}</h2><button type="button" autoFocus onClick={onClose}>{posText(locale,'close')}</button></header>{children}</dialog>;
}
export function WenzeCalculator({locale,onClose}:{locale:WenzeLocale;onClose:()=>void}){
 const [display,setDisplay]=useState('0'),[left,setLeft]=useState<number|null>(null),[op,setOp]=useState(''),[fresh,setFresh]=useState(false);
 const t=(key:string)=>checkoutText(locale,key);
 function key(value:string){
  if(value==='C'){setDisplay('0');setLeft(null);setOp('');setFresh(false);return;}
  if(value==='⌫'){setDisplay(display.length>1?display.slice(0,-1):'0');return;}
  if(/^[0-9.]$/.test(value)){const base=fresh?'0':display;if(base.includes('.')&&value==='.')return;setDisplay(value==='.'?base+'.':base==='0'?value:(base+value).slice(0,16));setFresh(false);return;}
  if(!Number.isFinite(Number(display)))return;
  const result=left!==null&&op&&!fresh?calculate(left,Number(display),op):Number(display);
  if(result===null){setDisplay(t('calcError'));setLeft(null);setOp('');setFresh(true);return;}
  setDisplay(String(result));setLeft(value==='='?null:result);setOp(value==='='?'':value);setFresh(true);
 }
 return <CheckoutDialog title={t('calculator')} locale={locale} onClose={onClose}><p>{t('calcHelp')}</p><output aria-label={t('result')} className="wz-calculator-result">{display}</output><div className="wz-calculator-keys">{['C','⌫','÷','×','7','8','9','−','4','5','6','+','1','2','3','=','0','.'].map(value=><button type="button" key={value} aria-label={value==='C'?t('clear'):value} onClick={()=>key(value)}>{value}</button>)}</div></CheckoutDialog>;
}
