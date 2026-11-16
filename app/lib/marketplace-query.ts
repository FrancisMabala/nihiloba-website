import type {JobSearch} from "../types/shida-public";
import type {RestaurantSearch} from "../services/shida/restaurants-client";
const jobSearchKeys=["query","city","area","commune","category","contract"] as const;
export function jobSearchQuery(search:JobSearch):string { const params=new URLSearchParams();for(const key of jobSearchKeys){const value=search[key]?.trim();if(value)params.set(key,value.slice(0,120));}if(search.view==="professional"||search.view==="individual")params.set("view",search.view);if(search.page&&Number.isInteger(search.page)&&search.page>0)params.set("page",String(search.page));if(search.page_size&&Number.isInteger(search.page_size)&&search.page_size>0&&search.page_size<=50)params.set("page_size",String(search.page_size));return params.size?`?${params}`:""; }
export function restaurantQuery(raw: RestaurantSearch): URLSearchParams {
  const result = new URLSearchParams();
  for (const key of ["query", "name", "city", "area", "food_type", "service_mode", "dish"]) {
    const value = raw[key], first = Array.isArray(value) ? value[0] : value;
    if (first?.trim()) result.set(key, first.trim().slice(0, 200));
  }
  if (raw.open_now === "true") result.set("open_now", "true");
  const page = Array.isArray(raw.page) ? raw.page[0] : raw.page;
  if (page && /^\d+$/.test(page) && Number.isSafeInteger(Number(page)) && Number(page) > 0) result.set("page", String(Number(page)));
  return result;
}
