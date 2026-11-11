import type {PublicJobSummary} from "../types/shida-public";
const jobPrivacyMarker=/\[(?:private information hidden|information privée masquée|taarifa binafsi zimefichwa|nsango ya sekele ebombami)\]/giu;
function cleanJobLocation(value:string|null){if(!value)return null;const seen=new Set<string>();const cleaned=value.replace(jobPrivacyMarker,"").split(",").map((part)=>part.trim()).filter(part=>{const key=part.toLocaleLowerCase();if(!part||seen.has(key))return false;seen.add(key);return true;}).join(", ");return cleaned||null;}
export function jobLocation(item:Pick<PublicJobSummary,"location">){return cleanJobLocation(item.location.display)||cleanJobLocation([item.location.quartier,item.location.commune,item.location.area,item.location.city].filter(Boolean).join(", "));}
