export type PublicSchool = {
  school_ref: string;
  name: string;
  school_type_label: string;
  city: string;
  commune: string;
  description: string;
  verification_label: string;
};

export type SchoolListResult = {kind:'ready';items:PublicSchool[];nextPage:number|null}|{kind:'unavailable'};
export type SchoolResult = {kind:'found';school:PublicSchool}|{kind:'missing'|'unavailable'};
type Locale = 'en'|'fr'|'ln'|'sw';

function apiOrigin():string|null {
  try {
    const url=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');
    return url.protocol==='https:'&&!url.username&&!url.password?url.origin:null;
  } catch {return null;}
}

function parseSchool(value:unknown):PublicSchool|null {
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const item=value as Record<string,unknown>;
  const keys=['city','commune','description','name','school_ref','school_type_label','verification_label'];
  if(Object.keys(item).sort().join(',')!==keys.join(','))return null;
  if(!/^SCH_[A-Za-z0-9_-]{6,64}$/.test(String(item.school_ref)))return null;
  for(const key of keys)if(typeof item[key]!=='string'||!item[key]||item[key].length>2100)return null;
  return item as PublicSchool;
}

export async function listPublicSchools(locale:Locale,page=1):Promise<SchoolListResult> {
  const origin=apiOrigin();if(!origin||!Number.isInteger(page)||page<1||page>100)return {kind:'unavailable'};
  try {
    const response=await fetch(`${origin}/api/public/education/schools?locale=${locale}&page=${page}`,
      {cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(!response.ok)return {kind:'unavailable'};
    const value:unknown=await response.json();
    if(!value||typeof value!=='object'||Array.isArray(value))return {kind:'unavailable'};
    const result=value as Record<string,unknown>;
    if(Object.keys(result).sort().join(',')!=='items,next_page'||!Array.isArray(result.items)||
      result.items.length>20||!(result.next_page===null||(Number.isInteger(result.next_page)&&Number(result.next_page)>page)))return {kind:'unavailable'};
    const items=result.items.map(parseSchool);
    if(items.some(item=>item===null))return {kind:'unavailable'};
    return {kind:'ready',items:items as PublicSchool[],nextPage:result.next_page as number|null};
  } catch {return {kind:'unavailable'};}
}

export async function getPublicSchool(ref:string,locale:Locale):Promise<SchoolResult> {
  if(!/^SCH_[A-Za-z0-9_-]{6,64}$/.test(ref))return {kind:'missing'};
  const origin=apiOrigin();if(!origin)return {kind:'unavailable'};
  try {
    const response=await fetch(`${origin}/api/public/education/schools/${encodeURIComponent(ref)}?locale=${locale}`,
      {cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(response.status===404)return {kind:'missing'};
    if(!response.ok)return {kind:'unavailable'};
    const item=parseSchool(await response.json());
    return item?.school_ref===ref?{kind:'found',school:item}:{kind:'unavailable'};
  } catch {return {kind:'unavailable'};}
}
