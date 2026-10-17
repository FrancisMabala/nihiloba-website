import type { HotelListing } from "../types/shida-public";

export type HotelSearch = { query?: string; city?: string };
export function parseHotelSearch(raw: Record<string,string|string[]|undefined>): HotelSearch {
  const result: HotelSearch = {};
  for (const key of ["query","city"] as const) {
    const rawValue=raw[key], value=(Array.isArray(rawValue)?rawValue[0]:rawValue)?.trim().slice(0,120);
    if(value) result[key]=value;
  }
  return result;
}
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().trim();

/** The hotel API returns a collection, so filter only those public records locally. */
export function filterPublicHotels(items:HotelListing[],search:HotelSearch):HotelListing[] {
  const query=normalize(search.query??""),city=normalize(search.city??"");
  return items.filter(item=>normalize(item.city??"").includes(city)&&normalize([item.name,item.description,item.city,item.area,item.commune,item.quartier].filter(Boolean).join(" ")).includes(query));
}
