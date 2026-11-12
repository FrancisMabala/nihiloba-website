export const JOB_PREVIEW_LIMIT=3;
export class JobSearchError extends Error {constructor(public status:number){super('job_search_unavailable');}}
export type JobRelationshipState={saved:boolean;can_save:boolean;employer:null|{kind:'company'|'organization_directory';reference:string;name:string;following:boolean}};
export type JobSearchItem={relation_ref:string;reference:string|null;name:string|null;employer_ref?:string|null;kind:'job'|'company'|'organization_directory';available:boolean;status?:string;employer_name?:string|null;location?:string|null;logo?:string|null;origin?:string|null;external_redirect?:boolean;open_job_count?:number;management_status?:'managed'|'shida_created';metadata_error?:boolean;notifications?:boolean};
export type JobSearchList={items:JobSearchItem[];total:number;page:number;has_more:boolean};
export type JobAlerts={profile_count:number;enabled_count:number;external_application_tracking:false};
export async function jobSearchRequest<T>(binding:string,locale:string,path:string,method='GET',body?:unknown,signal?:AbortSignal):Promise<T>{
 const [route,query]=path.split('?');
 const response=await fetch(`/api/shida/personal/job-search/${route}/?${query ? query+'&' : ''}language=${locale}`,{method,signal,cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding,...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});
 if(!response.ok)throw new JobSearchError(response.status);
 return response.json();
}
