// These are suggestions only. The checkout service still validates coverage and
// persists a separate, explicitly confirmed destination for the current order.
export type ProfileLocation = Record<string,string|null>;
type Area = {country:string;city:string;commune:string;quartier?:string|null};
const same=(a:string|null|undefined,b:string|null|undefined)=>!!a&&!!b&&a.trim().toLocaleLowerCase()===b.trim().toLocaleLowerCase();
export function restaurantProfileDestination(profile:ProfileLocation,areas:Area[]){
 const index=areas.findIndex(area=>same(area.country,profile.country_code)&&same(area.city,profile.city)&&same(area.commune,profile.commune)&&(!area.quartier||same(area.quartier,profile.quartier)));
 return index<0?null:{index,address:{street:profile.avenue||'',building:profile.parcel_number||'',landmark:profile.landmark||'',quartier:profile.quartier||''}};
}
export function wenzeProfileDestination(profile:ProfileLocation){
 // This checkout has no country field. Do not silently turn a foreign address
 // into a local delivery destination. Current service coverage remains decisive.
 if(profile.country_code!=='CD'||!profile.city)return null;
 return {city:profile.city,commune:profile.commune||'',quartier:profile.quartier||'',address:[profile.avenue,profile.parcel_number].filter(Boolean).join(', '),landmark:profile.landmark||''};
}
