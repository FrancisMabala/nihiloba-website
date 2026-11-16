export const orderBuckets=['all','action_required','in_progress','completed','cancelled'] as const;
export function readOrderLocation(search:string){
 const p=new URLSearchParams(search),bucket=p.get('bucket')??'all',page=Number(p.get('orderOffset')??0);
 return {bucket:orderBuckets.includes(bucket as typeof orderBuckets[number])?bucket:'all',search:p.get('orderSearch')??'',offset:Number.isSafeInteger(page)&&page>=0?page:0,order:p.get('order')??undefined};
}
export function writeOrderLocation(url:URL,bucket:string,search:string,offset:number,order?:string){
 url.searchParams.set('bucket',bucket);for(const [key,value] of [['orderSearch',search],['orderOffset',offset?String(offset):''],['order',order??'']]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}return url;
}
