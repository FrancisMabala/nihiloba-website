import {servicesProviderAccess} from './services-account-navigation';
export type ManagedActivity={ref:string;name:string;market:'wenze'|'restaurants'|'services';published:boolean|null;query:string};
export function managedActivities(market:ManagedActivity['market'],value:unknown,policy?:unknown):{items:ManagedActivity[];setup:boolean;more:boolean}{
 const data=value as Record<string,unknown>;
 if(!data||typeof data!=='object')throw Error('Unavailable activities');
 const rows=data[market==='wenze'?'stores':market==='restaurants'?'items':'profiles'];
 if(!Array.isArray(rows))throw Error('Unavailable activities');
 if(market==='services'&&servicesProviderAccess(rows,(policy as {capabilities?:unknown})?.capabilities)==='unavailable')throw Error('Unavailable activities');
 const items=rows.filter(row=>market!=="wenze"||row.selling_mode!=="individual").map(row=>{
  if(!row||typeof row.public_ref!=='string'||!row.public_ref)throw Error('Unavailable activity');
  const name=market==='restaurants'?row.profile?.name:market==='services'?row.service_name:row.name;
  if(typeof name!=='string'||!name)throw Error('Unavailable activity');
  return {ref:row.public_ref,name,market,published:market==='services'?row.visible_to_customers===true:market==='restaurants'?row.status==='active':typeof row.catalog_ready==='boolean'&&typeof row.status==='string'&&typeof row.visible==='string'?row.catalog_ready&&row.status==='active'&&row.visible==='true':null,query:`${market==='wenze'?'store':market==='services'?'offering':'establishment'}=${encodeURIComponent(row.public_ref)}${market==='services'?'&view=services':''}`}  satisfies ManagedActivity;
 });
 return {items,setup:market==='services'?true:market==='restaurants'?Array.isArray(data.actions)&&data.actions.includes('create'):false,more:typeof data.total==='number'&&data.total>items.length};
}
