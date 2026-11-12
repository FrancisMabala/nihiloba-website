import {financialRequest} from "./services-financial-state";
import {type WorkRow} from "./services-work-model";

export type WorkSource = "requests" | "reservations" | "messages";

export async function readWorkList(base:string,binding:string,source:WorkSource,current:()=>boolean) {
 const records:WorkRow[]=[];
 const seen=new Set<string>();
 let offset=0;
 while(current()){
  const page=await financialRequest<Record<string,unknown>>(binding,`${base}/transactions/${source}?offset=${offset}`);
  const rows=page[source==="messages"?"threads":source];
  if(!Array.isArray(rows))throw Error("invalid_work_list");
  const key = {requests:'request_ref',reservations:'reservation_ref',messages:'thread_ref'}[source];
  const before = records.length;
  for (const row of rows) {
   const ref = row[key];
   if (typeof ref !== 'string' || seen.has(ref)) continue;
   seen.add(ref);
   records.push(row);
  }
  const more=page.has_more===true||(source==="reservations"&&rows.length===100);
  if(!more)return records;
  if(records.length === before)throw Error("invalid_work_page");
  offset+=rows.length;
 }
 return records;
}
