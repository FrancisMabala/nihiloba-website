// Display-only arithmetic: keep currencies separate and preserve exact decimal amounts.
export function moneyCents(value:string):bigint {
 const match=/^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value);
 if(!match) throw new Error('Invalid money amount');
 return (match[1]?-BigInt(1):BigInt(1))*(BigInt(match[2])*BigInt(100)+BigInt((match[3]??'').padEnd(2,'0')));
}
export function moneyDecimal(value:bigint):string {
 const absolute=value<BigInt(0)?-value:value;
 return `${value<BigInt(0)?'-':''}${absolute/BigInt(100)}.${String(absolute%BigInt(100)).padStart(2,'0')}`;
}
export function formatMoney(value:string,locale:string):string {
 const amount=moneyCents(value),absolute=amount<BigInt(0)?-amount:amount;
 const language=locale==='ln'?'fr':locale;
 const separator=new Intl.NumberFormat(language).formatToParts(1.1).find(part=>part.type==='decimal')?.value??'.';
 return `${amount<BigInt(0)?'-':''}${new Intl.NumberFormat(language).format(absolute/BigInt(100))}${separator}${String(absolute%BigInt(100)).padStart(2,'0')}`;
}
