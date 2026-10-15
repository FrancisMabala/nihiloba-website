export type InterestKind='profile_opens'|'menu_opens'|'item_views'|'item_selections';
export function eligibleInterest(event:Pick<Event,'isTrusted'>,visible:boolean,automated:boolean,optOut:boolean){
 return event.isTrusted&&visible&&!automated&&!optOut;
}
// Memory-only receipt per displayed page and exact action; retries retain the key.
export function interestReceipt(){const keys=new Map<string,string>();return(kind:InterestKind,item='')=>{const scope=`${kind}:${item}`;if(!keys.has(scope))keys.set(scope,crypto.randomUUID());return keys.get(scope)!;};}
