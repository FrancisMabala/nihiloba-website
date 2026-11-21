import type {MedaListing} from '../components/shida/meda-listing-form';
const valueFields=['title','side','category','origin_country','origin_city','destination_country','destination_city','departure_at','deadline_at','capacity','unit','description','price','currency','price_basis','details'] as const;
function canonical(value:unknown):string{
 if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
 if(value!==null&&typeof value==='object')return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>`${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
 return JSON.stringify(value)??'undefined';
}
function sameValues(saved:MedaListing,current:MedaListing){return valueFields.every(field=>canonical(saved[field])===canonical(current[field]));}
/** Memory belongs to one identity-keyed workspace; no private draft browser storage. */
export class MedaPublication {
 private saved:{row:MedaListing;values:string}|null=null;
 reset(){this.saved=null;}
 async save(call:(path:string,body?:object)=>Promise<MedaListing>,initial:MedaListing|null,values:object,operation:string,publish:boolean,onDraft:(row:MedaListing)=>void){
  const signature=JSON.stringify(values),prior=this.saved,existing=prior?.row??initial;
  const row=prior?.values===signature?prior.row:await call(existing?`listings/${existing.reference}/`:'listings/',existing?{action:'save',revision:existing.revision,values}:{operation_key:operation,values});
  this.saved={row,values:signature};onDraft(row);
  let result=row;
  if(publish&&row.status==='draft'){
   try{result=await call(`listings/${row.reference}/`,{action:'publish',revision:row.revision});}
   catch(error){
    const status=error&&typeof error==='object'&&'status' in error?error.status:null;
    if(status===401||status===403||status===404||status===429)throw error;
    // A response can be lost after commit. Re-read the exact owner-only resource;
    // neither a different revision nor modified terms prove this publication.
    const current=await call(`listings/${row.reference}/`);
    if(current.reference!==row.reference||!sameValues(row,current)||typeof row.revision!=='number')throw Error('meda_stale');
    if(current.status==='published'&&current.revision===row.revision+1)result=current;
    else if(current.status==='draft'&&current.revision===row.revision)throw error;
    else throw Error('meda_stale');
   }
  }
  this.saved=null;return result;
 }
}
