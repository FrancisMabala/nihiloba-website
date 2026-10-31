export type WorkRow=Record<string,unknown>;
export type WorkFilter='all'|'new'|'quotes'|'sent'|'bookings'|'jobs'|'closed';
export const workRef=(row:WorkRow)=>String(row.request_ref||row.reservation_ref||row.thread_ref||'');
export function uniqueWork(rows:WorkRow[]){return [...new Map(rows.filter(row=>workRef(row)).map(row=>[workRef(row),row])).values()];}
export function requestStage(row:WorkRow):WorkFilter{
 if(row.reservation_ref||!['SUBMITTED','IN_REVIEW','QUOTED'].includes(String(row.status)))return 'closed';
 if(row.draft_quote_ref)return 'quotes';
 if((row.current_quote as WorkRow|undefined)?.status==='SENT')return 'sent';
 if(row.status==='SUBMITTED')return 'new';
 return row.can_create_quote?'quotes':'all';
}
export function workMatches(row:WorkRow,filter:WorkFilter,kind:string){
 if(filter==='all')return true;
 if(kind==='requests')return requestStage(row)===filter;
 if(kind==='reservations'){
  if(filter==='jobs')return ['accepted','confirmed','in_progress'].includes(String(row.status));
  if(filter==='bookings')return row.status==='pending';
  if(filter==='closed')return ['completed','cancelled','declined','expired'].includes(String(row.status));
 }
 return false;
}
export function workTone(row:WorkRow){const status=String(row.status).toLowerCase();return status==='submitted'?'blue':['pending','in_review','quoted'].includes(status)?'amber':['accepted','confirmed','completed'].includes(status)?'green':status==='in_progress'?'purple':'neutral';}
