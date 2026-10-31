import {getServiceAvailability} from '../../../../services/shida/public-client';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
/** Read the same public projection as the customer page. Never mint booking links. */
export async function GET(request:Request){
 const query=new URL(request.url).searchParams,service=query.get('service')??'',day=query.get('date')??'';
 if(request.headers.get('sec-fetch-site')==='cross-site'||[...query].length!==2||new Set(query.keys()).size!==2||!/^SVC_[A-Za-z0-9_-]+$/.test(service)||!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day)return Response.json({detail:'unavailable'},{status:400,headers});
 try{const value=await getServiceAvailability(service,day,day);
  return Response.json({service_ref:value.service_ref,appointment_booking:value.appointment_booking===true,timezone:value.timezone,availability_mode:value.availability_mode,requested_time_requires_provider_confirmation:value.requested_time_requires_provider_confirmation,slots:value.slots.filter(slot=>slot.is_available&&slot.date===day).map(({date,start_time,end_time})=>({date,start_time,end_time}))},{headers});
 }catch{return Response.json({detail:'unavailable'},{status:503,headers});}
}
