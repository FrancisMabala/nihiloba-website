import {safeServicesReturn} from "./services-return";
import {safeBusinessModuleReturn} from './business-return';
import {safeResourceModuleReturn} from './business-module-destinations';
// Historical export names retained for Restaurant callers and saved links.
// Only allowlisted Organization Restaurant/Services tasks resume after sign-in.
export function safeRestaurantReturn(value: string | null): string {
 if(value&&/^\/invitations\/BMR_[A-Za-z0-9_-]{1,100}$/.test(value))return value;
 if (value && /^\/employer-management\/ORGDIR_[A-Za-z0-9_-]{1,64}(?:\?lang=(?:fr|ln|sw|en))?$/.test(value)) return value;
 if (value === "/create-organization" || value === "/?create=organization" || value === "/guardian-links" || value && /^\/businesses\/BUS_[A-Za-z0-9_-]+$/.test(value)) return value;
  return safeBusinessModuleReturn(value) ?? safeServicesReturn(value) ?? safeResourceModuleReturn(value) ?? (value && value.length <= 400 && /^\/businesses\/BUS_[A-Za-z0-9_-]+\/restaurants(?:\/RST_[A-Za-z0-9_-]+\/receipts\/[A-Za-z0-9_-]+)?$/.test(value) ? value : '/');
}
export function restaurantReturnFromLocation(): string {
 return typeof window === 'undefined' ? '/' : safeRestaurantReturn(new URL(window.location.href).searchParams.get('returnTo'));
}
export function restaurantLoginURL(path:string):string {
 const safe=safeRestaurantReturn(path);return safe==='/'?'/login':`/login?returnTo=${encodeURIComponent(safe)}`;
}
