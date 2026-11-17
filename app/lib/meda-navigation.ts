import type {MedaLocale} from './meda-copy';
export function medaDestination(locale:MedaLocale,view:string,reference?:string,listing?:string|null){
 const prefix=locale==='en'?'':'/'+locale;
 const messages=view==='enquiries'||view==='conversation';
 const params=new URLSearchParams(messages?'view=messages&market=meda':'view=listings&tab=meda');
 if(view!=='mine')params.set('meda_view',view);
 if(reference)params.set('ref',reference);
 if(listing)params.set('listing',listing);
 return `${prefix}/shida/space/?${params}`;
}
