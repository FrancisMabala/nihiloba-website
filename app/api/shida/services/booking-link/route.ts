import {request as publicRequest} from '../../../../services/shida/public-client';
import {safePublicActionUrl} from '../../../../lib/safe-public-url';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 const query=new URL(request.url).searchParams;
 if(request.headers.get('sec-fetch-site')==='cross-site'||[...query.keys()].length!==new Set(query.keys()).size||[...query.keys()].some(key=>!['service','date','start','end','offering'].includes(key)))return Response.json({detail:'unavailable'},{status:400,headers});
 const service=query.get('service')??'',day=query.get('date')??'',start=query.get('start')??'',end=query.get('end')??'',offering=query.get('offering');
 if(!/^SVC_[A-Za-z0-9_-]+$/.test(service)||!/^\d{4}-\d{2}-\d{2}$/.test(day)||![start,end].every(value=>/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value))||offering&&!/^SPK_[A-Za-z0-9_-]+$/.test(offering))return Response.json({detail:'unavailable'},{status:400,headers});
 const params=new URLSearchParams({date:day,start,end});if(offering)params.set('offering',offering);
 try{const result=await publicRequest(`/api/public/shida/services/${service}/booking-link?${params}`,false) as {booking_url?:string};
  const url=safePublicActionUrl(result.booking_url??null);if(!url)throw new Error('unavailable');
  return Response.json({booking_url:url},{headers});
 }catch{return Response.json({detail:'time_unavailable'},{status:409,headers});}
}
