import type { Order, Terms } from "./restaurant-work";
import { GUEST_PROXY } from "./restaurant-guest-contract";
export type GuestLine = {key:string;item_ref:string;quantity?:number;selected_amount?:string};
export type GuestSelections = {standalone:GuestLine[];plates:{key:string;components:GuestLine[]}[]};
export const emptyGuestSelections = ():GuestSelections => ({standalone:[],plates:[]});
export type GuestBasket = {basket_ref:string;revision:number;selections:GuestSelections;quote:Terms|null;quote_ref:string|null;order_ref:string|null;food_preference:string|null;window_ref:string|null};
export type GuestVisit = {visit_ref:string;order_until:string;access_until:string;can_add_round:boolean;rounds:Order[];totals:Record<"completed"|"active"|"excluded",Record<"CDF"|"USD",string>>};
export type GuestEntry = {entry_context:string;expires_at:string;methods:{pickup?:{windows:{public_ref:string;starts_at:string;ends_at:string;timezone_name?:string}[]}};copy:Record<string,string>};
export type GuestAction = Readonly<{path:string;method:string;body?:string}>;
export class GuestError extends Error {
  constructor(public status:number,public detail:string,public retryAfter:number=0,public authorityRequest=false) {super("Guest request failed");}
}
export async function guestRequest<T>(establishment:string,path:string,init:RequestInit={}):Promise<T> {
  // Match the website's trailingSlash convention without redirecting a write.
  const [pathname,query] = path.split("?");
  const target=`${GUEST_PROXY}/establishments/${establishment}${pathname.replace(/\/$/,"")}/${query ? `?${query}` : ""}`;
  const response = await fetch(target,{...init,credentials:"same-origin",cache:"no-store",redirect:"error",headers:{Accept:"application/json",...(init.body ? {"Content-Type":"application/json"} : {})}});
  const value = await response.json().catch(()=>null);
  if (!response.ok) {
    const retry = response.headers.get("Retry-After");
    const seconds = retry && /^\d+$/.test(retry) ? Number(retry) : retry ? Math.max(0,(Date.parse(retry)-Date.now())/1000) : 0;
    throw new GuestError(response.status,typeof value?.detail === "string" ? value.detail : "restaurant_unavailable",Number.isFinite(seconds) ? seconds : 0,path.startsWith("/visits/"));
  }
  if (!value || typeof value !== "object") throw new GuestError(503,"restaurant_unavailable");
  return value as T;
}
export const guestAction = (path:string,method:string,body?:unknown):GuestAction => Object.freeze({path,method,...(body === undefined ? {} : {body:JSON.stringify(body)})});
// Reread current authority and canonical state before replaying an uncertain
// action. Never replace its key, revision or quote with freshly read values.
export async function replayGuestAction<T>(establishment:string,visit:string,action:GuestAction):Promise<T> {
  await guestRequest(establishment,`/visits/${visit}`);
  if(action.path.endsWith('/approve')){
    await guestRequest(establishment,'/visits/'+visit+'/service-proposals');
    await guestRequest(establishment,'/visits/'+visit+'/service-group');
  }
  const basket = action.path.match(/\/baskets\/([A-Za-z0-9_-]+)(?:\/|$)/)?.[1];
  const order = action.path.match(/\/orders\/([A-Za-z0-9_-]+)(?:\/|$)/)?.[1];
  if (basket) {
    const current=await guestRequest<GuestBasket>(establishment,`/visits/${visit}/baskets/${basket}`);
    if(action.path.endsWith("/submit") && current.order_ref) {
      const order=await guestRequest<Order>(establishment,`/visits/${visit}/orders/${current.order_ref}`);
      return {current_order:order} as T;
    }
  }
  if (order) await guestRequest(establishment,`/visits/${visit}/orders/${order}`);
  return guestRequest<T>(establishment,action.path,{method:action.method,body:action.body});
}
