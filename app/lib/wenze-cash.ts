// The POS API accepts decimal strings with at most two fractional digits.
// Keep all intermediate arithmetic in integer minor units.
export function cashCents(value:string){
 if(!/^\d{1,10}(\.\d{1,2})?$/.test(value))return NaN;
 const [whole,fraction='']=value.split('.');
 return Number(whole)*100+Number(fraction.padEnd(2,'0'));
}
export function cashSuggestions(total:number){
 if(!Number.isSafeInteger(total)||total<=0)return [];
 const step=Math.max(100,10**Math.floor(Math.log10(total)));
 const rounded=Math.ceil(total/step)*step;
 return [...new Set([total,rounded,rounded+step,rounded+2*step])]
  .filter(value=>value<=999999999999).slice(0,4);
}
export function cashKey(current:string,key:string){
 if(key==='C')return '';
 if(key==='⌫')return current.slice(0,-1);
 const value=(current==='0'&&key!=='.'?'':current)+(key==='.'&&!current?'0.':key);
 return /^\d{0,10}(\.\d{0,2})?$/.test(value)?value:current;
}
