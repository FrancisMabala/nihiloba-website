import copy from './wenze-creation-copy.json';
import type {WenzeLocale} from './wenze-copy';

export function creationText(locale:WenzeLocale,key:keyof typeof copy.fr,values:Record<string,string|number>={}){
 return copy[locale][key].replace(/\{(\w+)\}/g,(_,name:string)=>String(values[name]??''));
}
export const creationMoney=(locale:WenzeLocale,value:number|string,currency:string)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(Number(String(value).replace(',','.')))+' '+currency;
