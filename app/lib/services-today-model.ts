import {localDate} from "./shida-calendar";
import {SERVICE_TIME_ZONE} from "./service-time";

export type TodayItem={request_ref?:string;reservation_ref?:string;thread_ref?:string;offering?:string;requester?:string;title?:string;starts_at?:string;expires_at?:string;status?:string;service_name?:string;selected_offering_name?:string};
export type TodayQueue={items:TodayItem[];has_more:boolean};
export type TodayData={date:string;timezone:string;requests:TodayQueue;pending:TodayQueue;upcoming:TodayQueue;messages:TodayQueue};
export type TodayOffering={public_ref:string;service_name:string;category:string;is_active:string;visible_to_customers?:boolean;requests_enabled:boolean;booking_mode:string|null};
export type TodayAppointment={reference:string;title:string;startsAt:string;status:string};
export const activeWorkStatuses=new Set(["accepted","confirmed","in_progress"]);
export function uniqueTasks(items:TodayItem[]){return [...new Map(items.filter(item=>item.request_ref||item.reservation_ref||item.thread_ref).map(item=>[item.request_ref||item.reservation_ref||item.thread_ref,item])).values()];}
export function appointmentsForDay(items:TodayAppointment[],day:string){
 return [...new Map(items.filter(item=>item.reference&&activeWorkStatuses.has(item.status)&&Number.isFinite(Date.parse(item.startsAt))&&localDate(item.startsAt,SERVICE_TIME_ZONE)===day).map(item=>[item.reference,item])).values()].sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
}
export function activeWork(items:TodayItem[]){return uniqueTasks(items).filter(item=>activeWorkStatuses.has(item.status??""));}
// Existing queues are bounded navigation previews, never analytics totals.
export function previewCount(count:number,more:boolean){return `${count}${more?"+":""}`;}
