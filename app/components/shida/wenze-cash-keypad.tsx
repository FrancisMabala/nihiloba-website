"use client";
import {cashKey,cashSuggestions} from '@/app/lib/wenze-cash';
import {checkoutText} from '@/app/lib/wenze-checkout-copy';
import type {WenzeLocale} from '@/app/lib/wenze-copy';

export function CashKeypad({value,total,currency,locale,onChange}:{value:string;total:number;currency:string;locale:WenzeLocale;onChange:(value:string)=>void}){
 const c=(key:string)=>checkoutText(locale,key);
 return <div className="wz-cash-keypad">
  <div className="wz-cash-digits">{['1','2','3','4','5','6','7','8','9','C','0','⌫','.'].map(key=><button type="button" key={key} aria-label={key==='C'?c('clear'):key} onClick={()=>onChange(cashKey(value,key))}>{key}</button>)}</div>
  <div className="wz-cash-suggestions">{cashSuggestions(total).map(amount=><button type="button" key={amount} onClick={()=>onChange((amount/100).toFixed(2))}>{new Intl.NumberFormat(locale).format(amount/100)} <small>{currency}</small></button>)}</div>
 </div>;
}
