import type {ManagedActivity} from './personal-activities';
import {OFFICIAL_CHANNELS} from './brand';
export type ActivityKind='shop'|'malewa'|'restaurant'|'profile'|'job'|'apartment'|'hotel'|'driver'|'item';
export type OverviewEntry={kind:ActivityKind;ref:string;name:string;location?:string;url:string;image?:string|null;status?:string;publicUrl?:string;preview?:boolean;offeringCount?:number;standaloneService?:boolean};
type JobRow={type:string;reference:string;title?:string;status:string;posted_offer?:boolean;location?:string};
type Property={reference:string;name?:string;city?:string;commune?:string;web_draft?:boolean;visible?:boolean;status?:string};
export type Travel={kind:'hotel'|'driver';reference:string;name:string|null};
export type OverviewExtras={listings:JobRow[];properties:Property[];travel:Travel[];seeker:boolean|undefined};
export function overviewEntries(locale:string,activities:ManagedActivity[],extra:OverviewExtras){
 const prefix=locale==='en'?'':'/'+locale,base=prefix+'/shida',entries:OverviewEntry[]=[];
 for(const item of activities){
   if(item.individual)continue;
   const kind=item.market==='wenze'?'shop':item.market==='services'?'profile':item.foodType==='malewa'?'malewa':'restaurant';
   const publicRef=encodeURIComponent(item.providerRef??item.ref);
   const query=item.providerRef?'view=overview&provider='+encodeURIComponent(item.providerRef):item.query;
   entries.push({kind,ref:item.providerRef??item.ref,name:item.name,image:item.image,location:item.location,status:item.status,
     offeringCount:item.offeringCount,standaloneService:kind==='profile'&&!item.providerRef,
     publicUrl:item.published?base+'/'+item.market+'/'+(item.providerRef?'providers/':'')+publicRef:undefined,
     preview:!item.published&&(kind==='shop'||item.canPreview),url:base+'/seller/'+item.market+'?'+query});
 }
 for(const row of extra.listings){
   if(!row.reference)continue;
   const ref=encodeURIComponent(row.reference);
   if(row.type==='job'&&row.status!=='draft'&&row.posted_offer!==false)entries.push({kind:'job',ref:row.reference,name:row.title??'',location:row.location,status:row.status,publicUrl:row.status==='open'?base+'/emplois/'+ref:undefined,url:base+'/space?view=listings&kind=manage&offer='+ref});
   if(row.type==='article')entries.push({kind:'item',ref:row.reference,name:row.title??'',status:row.status,publicUrl:row.status==='online'?base+'/wenze/products/'+ref:undefined,url:base+'/space?view=listings&tab=article&item='+ref});
 }
 for(const row of extra.properties){
   if(!row.reference)continue;
   const ref=encodeURIComponent(row.reference);
   entries.push({kind:'apartment',ref:row.reference,name:row.name||row.reference,location:[row.city,row.commune].filter(Boolean).join(' · '),
    status:row.status,publicUrl:row.visible&&row.status==='AVAILABLE'?base+'/appartements/'+ref:undefined,
    url:base+'/appartements/'+(row.web_draft?'publier/?draft=':'mes-logements/?property=')+ref});
 }
 for(const row of extra.travel){
   if(!['hotel','driver'].includes(row.kind)||!/^[a-f0-9]{64}$/.test(row.reference))continue;
   const url=new URL(OFFICIAL_CHANNELS.whatsapp);url.searchParams.set('text',`shida ${row.kind} ${row.reference} ${locale}`);
   entries.push({kind:row.kind,ref:row.reference,name:row.name??'',url:url.href});
 }
 return [...new Map(entries.map(e=>[e.kind+':'+e.ref,e])).values()];
}
