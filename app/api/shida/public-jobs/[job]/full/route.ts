import {employmentToken,PRIVATE_HEADERS} from "../../../employment/route-utils";
import {getJob,getJobs,ShidaApiError} from "../../../../../services/shida/public-client";
import {isServiceLocale} from "../../../../../lib/services-i18n";

export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{job:string}>}){
  const {job}=await params, lang=new URL(request.url).searchParams.get("language");
  const locale=lang && isServiceLocale(lang)?lang:"en";
  const fail=(status:number)=>Response.json({error:"offer_unavailable"},{status,headers:PRIVATE_HEADERS});
  if(!/^[\w-]{1,150}$/.test(job))return fail(404);
  const token=await employmentToken();
  if(!token)return fail(401);
  try {
    const item=await getJob(job,locale,token);
    const category=item.professional_category||item.category;
    const similar=category && item.offer_type!=="individual" ? await getJobs({category,page:1,page_size:4},locale)
      .then(list=>list.items.filter(row=>row.public_ref!==item.public_ref && row.status==="open").slice(0,3)).catch(()=>[]) : [];
    return Response.json({item,similar},{headers:PRIVATE_HEADERS});
  } catch(error){return fail(error instanceof ShidaApiError && [401,403,404].includes(error.status||0) ? error.status! : 503);}
}
