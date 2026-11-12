import type {ManagedActivity} from './personal-activities';
import {OFFICIAL_CHANNELS} from './brand';
export type ActivityKind='shop'|'malewa'|'restaurant'|'profile'|'job'|'apartment'|'hotel'|'driver'|'item';
export type OverviewEntry={kind:ActivityKind;ref:string;name:string;location?:string;url:string};
type JobRow={type:string;reference:string;title?:string;status:string;posted_offer?:boolean};
type Property={reference:string;name?:string;city?:string;commune?:string;web_draft?:boolean};
export type Travel={kind:'hotel'|'driver';reference:string;name:string|null};
export type OverviewExtras={listings:JobRow[];properties:Property[];travel:Travel[];seeker:boolean|undefined};
export function overviewEntries(locale:string,activities:ManagedActivity[],extra:OverviewExtras){
 const prefix=locale==='en'?'':'/'+locale,base=prefix+'/shida',entries:OverviewEntry[]=[];
 for(const item of activities){
   if(item.individual)continue;
   const kind=item.market==='wenze'?'shop':item.market==='services'?'profile':item.foodType==='malewa'?'malewa':'restaurant';
   const query=item.providerRef?'view=services&provider='+encodeURIComponent(item.providerRef):item.query;
   entries.push({kind,ref:item.providerRef??item.ref,name:item.name,url:base+'/seller/'+item.market+'?'+query});
 }
 for(const row of extra.listings){
   if(!row.reference)continue;
   const ref=encodeURIComponent(row.reference);
   if(row.type==='job'&&row.status!=='draft'&&row.posted_offer!==false)entries.push({kind:'job',ref:row.reference,name:row.title??'',url:base+'/space?view=listings&kind=manage&offer='+ref});
   if(row.type==='article')entries.push({kind:'item',ref:row.reference,name:row.title??'',url:base+'/space?view=listings&tab=article&item='+ref});
 }
 for(const row of extra.properties){
   if(!row.reference)continue;
   const ref=encodeURIComponent(row.reference);
   entries.push({kind:'apartment',ref:row.reference,name:row.name||row.reference,location:[row.city,row.commune].filter(Boolean).join(' · '),
    url:base+'/appartements/'+(row.web_draft?'publier/?draft=':'mes-logements/?property=')+ref});
 }
 for(const row of extra.travel){
   if(!['hotel','driver'].includes(row.kind)||!/^[a-f0-9]{64}$/.test(row.reference))continue;
   const url=new URL(OFFICIAL_CHANNELS.whatsapp);url.searchParams.set('text',`shida ${row.kind} ${row.reference} ${locale}`);
   entries.push({kind:row.kind,ref:row.reference,name:row.name??'',url:url.href});
 }
 return [...new Map(entries.map(e=>[e.kind+':'+e.ref,e])).values()];
}
