import {safePublicImageUrl} from './safe-public-url';
import {servicesProviderAccess} from './services-account-navigation';
export type ManagedActivity={ref:string;name:string;market:'wenze'|'restaurants'|'services';published:boolean|null;query:string;status:string;location:string;missing:string[];individual:boolean;image:string|null};
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
  return {ref:row.public_ref,name,market,published:missing.length?false:published,
   image,status:missing.length?'needsUpdate':row.status==='inactive'||market==='services'&&row.is_active==='no'?'inactive':row.status==='draft'?'draft':['pending','pending_approval'].includes(row.status)?'pending':published?'active':'hidden',
   location:typeof location==='string'?location:'',missing,individual:row.selling_mode==='individual',
   query:`${market==='wenze'?'store':market==='services'?'offering':'establishment'}=${encodeURIComponent(row.public_ref)}${market==='services'?'&view=services':market==='wenze'&&(missing.length>0||row.status==='inactive')?'&view=shop':''}`
  } satisfies ManagedActivity;
 });
 return {items,setup:market==='services'?true:market==='restaurants'?Array.isArray(data.actions)&&data.actions.includes('create'):false,more:typeof data.total==='number'&&data.total>items.length};
}
