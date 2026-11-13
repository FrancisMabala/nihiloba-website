"use client";
import {cashKey,cashSuggestions} from '@/app/lib/wenze-cash';
import {checkoutText} from '@/app/lib/wenze-checkout-copy';
import type {WenzeLocale} from '@/app/lib/wenze-copy';

export function CashKeypad({value,total,currency,locale,onChange,layout="wenze"}:{value:string;total:number;currency:string;locale:WenzeLocale;layout?:"wenze"|"service";onChange:(value:string)=>void}){
 const c=(key:string)=>checkoutText(locale,key);
 const keys=layout==="service"?["7","8","9","⌫","4","5","6","C","1","2","3","0","00","."]:["1","2","3","4","5","6","7","8","9","C","0","⌫","."];
 return <div className="wz-cash-keypad">
  <div className="wz-cash-digits">{keys.map(key=><button type="button" key={key} data-key={key} aria-label={key==='C'?c('clear'):key} onClick={()=>onChange(cashKey(value,key))}>{key==="."&&layout==="service"&&locale==="fr"?",":key}</button>)}</div>
  {layout==="wenze"&&<div className="wz-cash-suggestions">{cashSuggestions(total).map(amount=><button type="button" key={amount} onClick={()=>onChange((amount/100).toFixed(2))}>{new Intl.NumberFormat(locale).format(amount/100)} <small>{currency}</small></button>)}</div>}
 </div>;
}
