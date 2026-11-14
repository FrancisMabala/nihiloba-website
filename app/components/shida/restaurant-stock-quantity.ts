const wholeUnits = new Set(['piece','portion','boule','bottle','can','tray']);
export function stockQuantity(value:string, unit:string, zero=false):bigint|null {
  const match=/^(\d+)(?:[.,](\d{1,3}))?$/.exec(value.trim());
  if(!match)return null;
  const fraction=(match[2]??'').padEnd(3,'0');
  const scaled=BigInt(match[1])*BigInt("1000")+BigInt(fraction);
  if(scaled>BigInt("999999999999999999") || (!zero&&scaled===BigInt("0")) || (wholeUnits.has(unit)&&scaled%BigInt("1000")!==BigInt("0")))return null;
  return scaled;
}
export function stockDecimal(value:bigint):string {
  const sign=value<BigInt("0")?'-':'';const absolute=value<BigInt("0")?-value:value;
  return `${sign}${absolute/BigInt("1000")}.${String(absolute%BigInt("1000")).padStart(3,'0')}`;
}
export function stockNumber(value:string|null, locale:string):string {
  if(value===null)return '—';
  const negative=value.startsWith('-');const scaled=stockQuantity(negative?value.slice(1):value,'kg',true);
  if(scaled===null)return '—';
  const fraction=String(scaled%BigInt("1000")).padStart(3,'0').replace(/0+$/,'');
  const separator=new Intl.NumberFormat(locale).formatToParts(1.1).find(part=>part.type==='decimal')?.value??'.';
  return `${negative?'-':''}${new Intl.NumberFormat(locale).format(scaled/BigInt("1000"))}${fraction?separator+fraction:''}`;
}
