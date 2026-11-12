import {safePublicImageUrl} from './safe-public-url';
import {servicesProviderAccess} from './services-account-navigation';
export type ActivityCountKey='wenze'|'restaurants'|'services'|'listings'|'listing_drafts'|'jobs'|'apartments'|'hotels'|'wewa';
export function activityCounts(value:unknown):Partial<Record<ActivityCountKey,number>>{
 const result:Partial<Record<ActivityCountKey,number>>={};
 if(!value||typeof value!=='object')return result;
 for(const key of ['wenze','restaurants','services','listings','listing_drafts','jobs','apartments','hotels','wewa'] as const){
  const count=(value as Record<string,unknown>)[key];
  if(typeof count==='number'&&Number.isSafeInteger(count)&&count>=0)result[key]=count;
 }
 return result;
}
export type ManagedActivity={ref:string;name:string;market:'wenze'|'restaurants'|'services';published:boolean|null;query:string;status:string;location:string;missing:string[];individual:boolean;image:string|null;providerRef?:string;professionalName?:string;professionalImage?:string|null;foodType?:string;offeringCount?:number};
export function managedActivities(market:ManagedActivity['market'],value:unknown,policy?:unknown):{items:ManagedActivity[];setup:boolean;more:boolean}{
 const data=value as Record<string,unknown>;
 if(!data||typeof data!=='object')throw Error('Unavailable activities');
 const rows=data[market==='wenze'?'stores':market==='restaurants'?'items':'profiles'];
 if(!Array.isArray(rows))throw Error('Unavailable activities');
 if(market==='services'&&servicesProviderAccess(rows,(policy as {capabilities?:unknown})?.capabilities)==='unavailable')throw Error('Unavailable activities');
 const items=rows.map(row=>{
  if(!row||typeof row.public_ref!=='string'||!row.public_ref)throw Error('Unavailable activity');
  const rawName=market==='restaurants'?row.profile?.name:market==='services'?row.service_name:row.name;
  const name=typeof rawName==='string'?rawName.trim():'';
  const location=market==='restaurants'?row.profile?.city:row.city||row.commune;
  const image=safePublicImageUrl(market==='restaurants'?row.profile?.establishment_photo_url||row.profile?.logo_secure_url||row.profile?.logo_url:row.profile_image_url);
  const missing:string[]=[];
  if(market==='restaurants'&&Array.isArray(row.missing_publication_fields))missing.push(...row.missing_publication_fields.filter((key:unknown)=>typeof key==='string').map((key:string)=>'restaurant:'+key));
  if(market==='services'&&Array.isArray(row.missing_fields)&&row.missing_fields.length)missing.push('setup');
  if(!name)missing.push('name');
  if(market==='wenze'&&row.catalog_ready===false){if(!row.city)missing.push('location');if(!row.category)missing.push('category');if(!missing.length)missing.push('setup');}
  const published=market==='services'?row.visible_to_customers===true:market==='restaurants'?row.status==='active':typeof row.catalog_ready==='boolean'&&typeof row.status==='string'&&typeof row.visible==='string'?row.catalog_ready&&row.status==='active'&&row.visible==='true':null;
  return {ref:row.public_ref,name,market,foodType:row.profile?.food_business_type,published:missing.length?false:published,
   ...(market==='services'&&typeof row.provider_ref==='string'&&row.provider_ref?{providerRef:row.provider_ref,professionalName:typeof row.professional_profile?.name==='string'?row.professional_profile.name:undefined,professionalImage:safePublicImageUrl(row.professional_profile?.photo)}:{}),
   image,status:missing.length?'needsUpdate':row.status==='inactive'||market==='services'&&row.is_active==='no'?'inactive':row.status==='draft'?'draft':['pending','pending_approval'].includes(row.status)?'pending':published?'active':'hidden',
   location:typeof location==='string'?location:'',missing,individual:row.selling_mode==='individual',
   query:`${market==='wenze'?'store':market==='services'?'offering':'establishment'}=${encodeURIComponent(row.public_ref)}${market==='services'?'&view=services':market==='wenze'&&(missing.length>0||row.status==='inactive')?'&view=shop':''}`
  } satisfies ManagedActivity;
 });
 return {items,setup:market==='services'?true:market==='restaurants'?Array.isArray(data.actions)&&data.actions.includes('create'):false,more:typeof data.total==='number'&&data.total>items.length};
}
/** Group only identities explicitly linked by the server; legacy rows remain individually reachable. */
export function dashboardActivities(items:ManagedActivity[]):ManagedActivity[]{
 const result:ManagedActivity[]=[],seen=new Set<string>();
 for(const item of items){
  const key=`${item.market}:${item.market==='services'&&item.providerRef?item.providerRef:item.ref}`;
  if(seen.has(key))continue;seen.add(key);
  if(item.market!=='services'||!item.providerRef){result.push(item);continue;}
  const siblings=items.filter(other=>other.market==='services'&&other.providerRef===item.providerRef);
  result.push({...item,name:item.professionalName||item.name,image:item.professionalImage||item.image,
   query:'view=services',offeringCount:siblings.length,published:siblings.some(row=>row.published===true),
   status:new Set(siblings.map(row=>row.status)).size===1?item.status:'mixed',
   missing:[...new Set(siblings.flatMap(row=>row.missing))],location:[...new Set(siblings.map(row=>row.location).filter(Boolean))].join(' · ')});
 }
 return result;
}

/** Unknown or partial activity data must never hide legitimate management access. */
export function individualOnlyActivities(data:{items:ManagedActivity[];failed:boolean;more:boolean;markets:string[];business:boolean}|null):boolean{
 return !!data&&!data.failed&&!data.more&&!data.business&&data.items.length>0
  &&data.items.every(item=>item.market==='wenze'&&item.individual)
  &&data.markets.every(market=>market==='wenze');
}
