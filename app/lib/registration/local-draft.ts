// Untrusted form content only. Never store codes, challenges, cookies or identity.
// Tab-scoped storage survives refresh/app switching; verified drafts live server-side.
export const FORM_DRAFT_KEY = "shida-registration-form-v1";
export const FORM_DRAFT_TTL = 24 * 60 * 60 * 1000;
const allowed = new Set(["first_name","family_name","additional_name","personal_name","city","country_code","area","name","organization_type","custom_organization_type","sector","commune_or_municipality","street_or_avenue","building_or_parcel","quartier_or_area","landmark"]);
export type LocalDraft = {version:1;expires:number;kind:"personal"|"business";values:Record<string,string>;phone:string};
export function parseLocalDraft(raw:string|null,now=Date.now()):LocalDraft|null {
  try {
    if(!raw || raw.length>12000)return null;
    const d=JSON.parse(raw);
    if(d.version!==1 || !Number.isFinite(d.expires) || d.expires<=now || d.expires>now+FORM_DRAFT_TTL || !["personal","business"].includes(d.kind) || typeof d.phone!=="string" || d.phone.length>40 || !d.values || Array.isArray(d.values))return null;
    if(Object.entries(d.values).some(([k,v])=>!allowed.has(k)||typeof v!=="string"||v.length>500))return null;
    return {version:1,expires:d.expires,kind:d.kind,values:d.values,phone:d.phone};
  } catch {return null;}
}
export function internationalPhone(value:string):string|null {
  if(!/^(\+|00)[0-9 ()-]+$/.test(value.trim()))return null;
  const normalized=value.trim().replace(/^00/,"+").replace(/[ ()-]/g,"");
  return /^\+[1-9][0-9]{7,14}$/.test(normalized)?normalized:null;
}
