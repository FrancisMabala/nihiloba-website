'use client';
import { localInstant } from '../../lib/restaurant-seller';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';
// Find exact matching instants; nonexistent clocks have no candidate. Never shift
// a local clock or guess which occurrence of a repeated clock the operator meant.
export function localCandidates(local:string,timezone:string):string[] {
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(local))return [];
 const normalized=local.length===16?local+':00':local, center=Date.parse(normalized+'Z');if(!Number.isFinite(center))return [];
 const offsets=new Set<string>();for(let h=-36;h<=36;h+=6){const text=localInstant(new Date(center+h*3600000).toISOString(),timezone);offsets.add(text.slice(-6));}
 return [...offsets].map(offset=>normalized+offset).filter(candidate=>localInstant(candidate,timezone).slice(0,19)===normalized).sort((a,b)=>Date.parse(a)-Date.parse(b));
}
export function LocalTime({value,onChange,timezone,locale,required=true}:{value:string;onChange:(s:string)=>void;timezone:string|null;locale:RestaurantLocale;required?:boolean}) {
 const local=value.slice(0,19), candidates=timezone?localCandidates(local,timezone):[];
 const ambiguous=candidates.length>1 && !/[+-]\d{2}:\d{2}$/.test(value);
 const messages={en:['This local time does not exist. Choose another time.','This clock occurs twice. Choose its occurrence.','First occurrence','Second occurrence'],fr:['Cette heure locale n’existe pas. Choisissez une autre heure.','Cette heure se répète. Choisissez son occurrence.','Première occurrence','Deuxième occurrence'],ln:['Ngonga oyo ezali te. Pona ngonga mosusu.','Ngonga oyo ezongi mbala mibale. Pona moko.','Mbala ya liboso','Mbala ya mibale'],sw:['Saa hii ya eneo haipo. Chagua saa nyingine.','Saa hii inatokea mara mbili. Chagua tukio.','Mara ya kwanza','Mara ya pili']}[locale];
 return <><input type="datetime-local" required={required} step="1" value={local} onChange={e=>{const v=e.target.value;const choices=timezone?localCandidates(v,timezone):[];onChange(choices.length===1?choices[0]:v);}} ref={node=>{node?.setCustomValidity(value && (!candidates.length || ambiguous)?messages[ambiguous?1:0]:'');}}/>{value && (!candidates.length || ambiguous) && <span role="status">{messages[ambiguous?1:0]}</span>}{candidates.length>1 && <select aria-label={messages[1]} value={candidates.includes(value)?value:''} onChange={e=>onChange(e.target.value)} required><option value="">—</option>{candidates.map((v,i)=><option key={v} value={v}>{messages[i+2]}</option>)}</select>}</>;
}
