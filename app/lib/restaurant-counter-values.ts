export type CounterOption={key:string;label:string;amount:string};
export type CounterOptions={portions:CounterOption[];extras:CounterOption[]};
// Decimal money never passes through floating point, including estimates/change.
export function cents(value:string):bigint|null {
 const s=value.trim().replace(',','.');
 if(!/^\d{1,16}(\.\d{1,2})?$/.test(s))return null;
 const [whole,fraction='']=s.split('.');return BigInt(whole)*BigInt(100)+BigInt(fraction.padEnd(2,'0'));
}
export function decimal(value:bigint){return `${value/BigInt(100)}.${(value%BigInt(100)).toString().padStart(2,'0')}`;}
export function displayMoney(value:string,locale:string){const n=cents(value);if(n===null)return '—';const separator=locale==='en'?',':' ';return (n/BigInt(100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g,separator)+(n%BigInt(100)?(locale==='en'?'.':',')+(n%BigInt(100)).toString().padStart(2,'0'):'');}
export function cashChange(received:string,due:string){const a=cents(received),b=cents(due);return a!==null&&b!==null&&a>b?decimal(a-b):'0.00';}
