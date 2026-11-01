import type {MarketplaceLocale} from '../components/shida/marketplace-account-copy';
import {transactionText,transactionStatusText} from './transactions-copy';
import {applicationStatus} from './personal-activity';
import {workText} from './restaurant-work-copy';
import {progressText} from '../components/shida/wenze-order-timeline';
import {reservationCopy} from './restaurant-reservation-copy';
export type TransactionCategory='all'|'orders'|'requests'|'documents';
export type TransactionKind='wenze'|'negotiated'|'food'|'food_receipt'|'reservation'|'application'|'posted'|'service'|'booking'|'bill'|'hotel'|'transport'|'housing'|'visit';
export type Transaction={id:string;details?:Record<string,string|number>;kind:TransactionKind;category:Exclude<TransactionCategory,'all'>;reference:string|null;related_reference:string|null;title:string;status:string;date:string|null;amount:string|null;currency:string|null};
export type TransactionOverview={counts:Record<TransactionCategory,number>;items:Transaction[];documents:Transaction[];page:number;page_size:number;has_more:boolean};
export function transactionLink(row:Transaction,locale:MarketplaceLocale){
 const prefix=locale==='en'?'':`/${locale}`,ref=encodeURIComponent(row.reference??'');
 if(row.kind==='wenze'||row.kind==='negotiated')return `${locale==='en'?'':'/fr'}/shida/wenze/orders${ref?'#'+ref:''}`;
 if(row.kind==='food'||row.kind==='food_receipt')return `${prefix}/shida/restaurant-orders/${ref}${row.kind==='food_receipt'?'/receipt':''}`;
 if(row.kind==='reservation')return `${prefix}/shida/restaurant-reservations?reservation=${ref}`;
 if(row.kind==='application')return `${locale==='fr'?'/fr/shida/mes-candidatures':prefix+'/shida/my-applications'}/${ref}`;
 if(row.kind==='bill')return `${prefix}/shida/service-bills/${encodeURIComponent(row.related_reference??'')}`;
 return `${prefix}/shida/service-requests?${row.kind==='booking'?'booking':'request'}=${ref}`;
}
export function transactionStatus(row:Transaction,locale:MarketplaceLocale){
 if(row.kind==='food')return workText(locale,row.status);
 if(row.kind==='wenze'||row.kind==='negotiated')return progressText(locale,row.status);
 if(row.kind==='application')return applicationStatus(locale,row.status);
 if(row.kind==='reservation')return reservationCopy[locale][row.status as keyof typeof reservationCopy.en]??transactionText(locale,'review');
 return transactionStatusText(locale,row.status);
}
export function transactionAmount(row:Transaction,locale:MarketplaceLocale){
 if(row.amount===null||!row.currency||!Number.isFinite(Number(row.amount)))return '—';
 try{return new Intl.NumberFormat(locale,{style:'currency',currency:row.currency}).format(Number(row.amount));}catch{return '—';}
}
export function transactionDetail(name:string,value:string|number,locale:MarketplaceLocale){
 if(['check_in','check_out','visit_date'].includes(name)){
  const text=String(value);if(!/^\d{4}-\d{2}-\d{2}$/.test(text)||!Number.isFinite(Date.parse(text)))return '—';
  return new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(text));
 }
 return String(value);
}
const categories:Record<TransactionKind,Transaction['category']>={wenze:'orders',negotiated:'orders',food:'orders',food_receipt:'documents',reservation:'requests',application:'requests',posted:'requests',service:'requests',booking:'requests',bill:'documents',hotel:'requests',transport:'requests',housing:'requests',visit:'requests'};
const reference=(value:unknown)=>value===null||(typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value));
function isTransaction(value:unknown):value is Transaction{
 if(!value||typeof value!=='object')return false;
 const r=value as Transaction;
 return typeof r.id==='string'&&r.id.length>0&&Object.hasOwn(categories,r.kind)&&categories[r.kind]===r.category&&typeof r.title==='string'&&typeof r.status==='string'&&reference(r.reference)&&reference(r.related_reference)&&(r.date===null||(typeof r.date==='string'&&Number.isFinite(Date.parse(r.date))))&&(r.amount===null||(typeof r.amount==='string'&&/^\d+(\.\d+)?$/.test(r.amount)))&&(r.currency===null||(typeof r.currency==='string'&&/^[A-Z]{3}$/.test(r.currency)))&&(r.details===undefined||!!r.details&&typeof r.details==='object'&&!Array.isArray(r.details)&&Object.entries(r.details).every(([key,value])=>['check_in','check_out','guests','rooms','visit_date','visit_time'].includes(key)&&(typeof value==='string'||typeof value==='number'&&Number.isFinite(value))));
}
export function isOverview(value:unknown):value is TransactionOverview{
 if(!value||typeof value!=='object')return false;
 const v=value as TransactionOverview;
 if(!v.counts||!(['all','orders','requests','documents'] as const).every(k=>Number.isSafeInteger(v.counts[k])&&v.counts[k]>=0)||v.counts.all!==v.counts.orders+v.counts.requests+v.counts.documents)return false;
 if(!Number.isInteger(v.page)||v.page<1||!Number.isInteger(v.page_size)||v.page_size<1||v.page_size>20||typeof v.has_more!=='boolean')return false;
 if(!Array.isArray(v.items)||!Array.isArray(v.documents)||v.items.length>v.page_size||!v.items.every(isTransaction)||!v.documents.every(row=>isTransaction(row)&&row.category==='documents'))return false;
 // A duplicate preview can be rendered once; duplicates within a page indicate a bad response.
 if(new Set(v.items.map(row=>row.id)).size!==v.items.length)return false;
 const rows=Array.from(new Map([...v.items,...v.documents].map(row=>[row.id,row])).values());
 return (['orders','requests','documents'] as const).every(category=>rows.filter(row=>row.category===category).length<=v.counts[category])&&!(v.counts.all===0&&v.has_more);
}
