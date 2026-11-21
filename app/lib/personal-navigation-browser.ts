import {LOGIN_EVENT, loginUnconfirmed, personalAuthBusy} from './personal-login-browser';
import {PERSONAL_SESSION_EVENT} from './personal-session-browser';
import type {OverviewExtras} from './overview-records';

export type PersonalNavigation = {
 can_manage:boolean; markets:string[]; organization_management:boolean;
 travel_profiles?:OverviewExtras['travel']; has_candidate_profile?:boolean;
 employer_profiles?:{offer_ref:string;title:string|null}[]; employer_profiles_more?:boolean;
 activity_counts?:unknown;
};
type Flight={controller:AbortController;promise:Promise<PersonalNavigation>;readers:number};
const flights=new Map<string,Flight>();
let generation=0,observedWindow:Window|undefined;
function invalidate(){
 generation++;
 for(const flight of flights.values())flight.controller.abort();
 flights.clear();
}
function observeIdentityChanges(){
 if(typeof window==='undefined'||!window.addEventListener||observedWindow===window)return;
 observedWindow=window;
 window.addEventListener(PERSONAL_SESSION_EVENT,invalidate,true);
 window.addEventListener(LOGIN_EVENT,invalidate,true);
 window.addEventListener('storage',event=>{
  if(!event.key||[PERSONAL_SESSION_EVENT,LOGIN_EVENT,'shida-personal-login-unconfirmed'].includes(event.key))invalidate();
 });
}
/** Share overlapping reads only. Completed authority is never retained or persisted. */
export async function readPersonalNavigation(binding:string,signal?:AbortSignal):Promise<PersonalNavigation>{
 observeIdentityChanges();
 const epoch=generation;
 signal?.throwIfAborted();
 if(!/^[a-f0-9]{64}$/.test(binding)||loginUnconfirmed()||await personalAuthBusy())throw Error('Unavailable permissions');
 signal?.throwIfAborted();
 if(epoch!==generation)throw new DOMException('Session changed','AbortError');
 let current=flights.get(binding);
 if(!current){
  const controller=new AbortController();
  const flight:Flight={controller,readers:0,promise:(async()=>{
   const response=await fetch('/api/shida/personal/security/navigation/',{cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding},signal:controller.signal});
   if(!response.ok)throw Error('Unavailable permissions');
   const value=await response.json();
   controller.signal.throwIfAborted();
   if(epoch!==generation)throw new DOMException('Session changed','AbortError');
   if(loginUnconfirmed()||await personalAuthBusy())throw Error('Unavailable permissions');
   controller.signal.throwIfAborted();
   if(!Array.isArray(value.markets)||value.markets.some((market:unknown)=>typeof market!=='string')||typeof value.organization_management!=='boolean')throw Error('Unavailable permissions');
   return {...value,can_manage:value.can_manage===true};
  })().finally(()=>{if(flights.get(binding)===flight)flights.delete(binding);})};
  flights.set(binding,flight);current=flight;
 }
 const flight=current;
 flight.readers++;
 return new Promise((resolve,reject)=>{
  let finished=false;
  const finish=(complete:()=>void)=>{
   if(finished)return;finished=true;signal?.removeEventListener('abort',abort);
   if(--flight.readers===0&&flights.get(binding)===flight){flights.delete(binding);flight.controller.abort();}
   complete();
  };
  const abort=()=>finish(()=>reject(signal?.reason??new DOMException('Aborted','AbortError')));
  signal?.addEventListener('abort',abort,{once:true});
  flight.promise.then(value=>finish(()=>{
   if(epoch!==generation||flight.controller.signal.aborted)reject(new DOMException('Session changed','AbortError'));
   else resolve(value);
  }),error=>finish(()=>reject(error)));
  if(signal?.aborted)abort();
 });
}
