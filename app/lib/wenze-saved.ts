import copy from './wenze-saved-copy.json';
import type {WenzeLocale} from './wenze-copy';
export const savedText=(locale:WenzeLocale,key:keyof typeof copy.fr,n?:string|number)=>copy[locale][key].replace('{n}',String(n??''));
export type SavedOption={public_ref:string;label:string;option_attributes?:Record<string,string>|null;available_stock:number|null;committed_quantity:number;is_available:string};
export type SavedProduct={public_ref:string;revision:number;name:string;price?:string;currency?:string;category:string;condition?:string;description?:string;price_negotiable?:string;status:string;visible:string;variant_type?:string;photos?:{photo_ref:string;url:string}[];variants?:SavedOption[];available_stock?:number|null;committed_quantity?:number};
export const activeOptions=(p:SavedProduct)=>(p.variants??[]).filter(v=>v.is_available==='yes');
export function stockRows(p:SavedProduct):SavedOption[]{return p.variant_type?activeOptions(p):[{public_ref:p.public_ref,label:p.name,available_stock:p.available_stock??null,committed_quantity:p.committed_quantity??0,is_available:'yes'}];}
export function axesFor(rows:SavedOption[]){return Array.from(new Set(rows.flatMap(r=>Object.keys(r.option_attributes??{}))));}
