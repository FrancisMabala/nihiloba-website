import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ServicesToday} from '../app/components/shida/services-today';
import {ServicesTodayOpportunities} from '../app/components/shida/services-today-opportunities';
import {servicesOverviewRead} from '../app/lib/services-overview-loading';
import {ServicesTransactions} from '../app/components/shida/services-transactions';
const lifecycle=vi.hoisted(()=>({effects:[] as Array<()=>void|(()=>void)>}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useEffect:(effect:()=>void|(()=>void))=>lifecycle.effects.push(effect)}));
let stops:Array<()=>void>=[],rejects:Array<()=>void>=[];
beforeEach(()=>{lifecycle.effects=[];stops=[];rejects=[];vi.stubGlobal('window',new EventTarget());});
const tick=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
afterEach(async()=>{stops.forEach(stop=>stop());rejects.forEach(reject=>reject());await tick();vi.useRealTimers();vi.unstubAllGlobals();});
function mount(count:number,binding='synthetic-binding',base='/api/shida/personal/services'){
 const offerings=Array.from({length:count},(_,i)=>({public_ref:'SVC_fixture_'+i,service_name:'Synthetic service',category:'other',is_active:'yes',visible_to_customers:true,requests_enabled:true,booking_mode:null}));
 const shared={base,binding,locale:'fr' as const,offerings,onDenied:()=>{}};
 lifecycle.effects=[];
 renderToStaticMarkup(<><ServicesToday {...shared} capabilities={['reservations','messages','structured_availability']} onOpen={()=>{}} onAll={()=>{}}/><ServicesTodayOpportunities {...shared} onOpen={()=>{}} onAll={()=>{}}/></>);
 for(const effect of lifecycle.effects){const stop=effect();if(stop)stops.push(stop);}
}
it.each([1,5])('bounds Services overview reads with %i eligible offerings',async count=>{
 let active=0,peak=0,rejected=0;const paths:string[]=[];
 vi.stubGlobal('fetch',vi.fn((path:string)=>{
  paths.push(path);active++;peak=Math.max(peak,active);
  if(active>4){active--;rejected++;return Promise.reject(Error('Synthetic admission limit'));}
  return new Promise((_resolve,reject)=>rejects.push(()=>{active--;reject(Error('Synthetic cleanup'));}));
 }));
 mount(count);
 for(let i=0;i<20;i++)await Promise.resolve();
 console.info('Services controlled startup',{offerings:count,started:paths.length,peak,rejected});
 expect(rejected).toBe(0);expect(peak).toBe(2);
});
it('finishes all offerings and all work/calendar pages within the bound',async()=>{
 let active=0,peak=0;const paths:string[]=[];
 vi.stubGlobal('fetch',vi.fn(async(path:string)=>{
  paths.push(path);active++;peak=Math.max(peak,active);await tick();active--;
  let value:unknown={};
  if(path.includes('/today?'))value={date:'2026-11-21',requests:{items:[]},pending:{items:[]},upcoming:{items:[]},messages:{items:[]}};
  else if(path.includes('/transactions/requests?'))value=path.endsWith('offset=0')?{requests:[{request_ref:'REQ_one'}],has_more:true}:{requests:[{request_ref:'REQ_two'}],has_more:false};
  else if(path.includes('/transactions/reservations?'))value={reservations:[],has_more:false};
  else if(path.includes('/calendar?'))value={items:[],has_more:!path.includes('page=2')};
  else if(path.includes('/competition/'))value={requests:[]};
  return new Response(JSON.stringify(value));
 }));
 mount(5);for(let i=0;i<40;i++)await tick();
 expect(paths.filter(path=>path.includes('/competition/'))).toHaveLength(5);
 expect(paths.some(path=>path.includes('requests?offset=1'))).toBe(true);
 expect(paths.some(path=>path.includes('/calendar?')&&path.includes('page=2'))).toBe(true);
 expect(paths).toHaveLength(11);expect(peak).toBe(2);expect(active).toBe(0);
});
it('keeps slots across a same-binding provider remount and drops old queued work',async()=>{
 const paths:string[]=[];const finish:Array<()=>void>=[];
 vi.stubGlobal('fetch',vi.fn((path:string)=>{paths.push(path);return new Promise((_resolve,reject)=>finish.push(()=>reject(Error('Synthetic finish'))));}));
 mount(5,'same','/old-profile');await tick();stops.forEach(stop=>stop());stops=[];
 mount(5,'same','/new-profile');await tick();expect(paths).toHaveLength(2);
 finish.splice(0).forEach(done=>done());await tick();expect(paths.slice(2).every(path=>path.startsWith('/new-profile'))).toBe(true);expect(paths).toHaveLength(4);
 stops.forEach(stop=>stop());stops=[];finish.splice(0).forEach(done=>done());await tick();expect(paths).toHaveLength(4);
});
it('releases failed work and keeps different bindings isolated',async()=>{
 const a=new AbortController(),b=new AbortController();let release!:()=>void;
 const held=servicesOverviewRead('account-a',a.signal,()=>new Promise<void>(resolve=>{release=resolve;}));
 const failed=servicesOverviewRead('account-a',a.signal,async()=>{throw Error('Synthetic unavailable');}).catch(error=>error.message);
 expect(await servicesOverviewRead('account-b',b.signal,async()=>'other')).toBe('other');
 expect(await failed).toBe('Synthetic unavailable');
 expect(await servicesOverviewRead('account-a',a.signal,async()=>'retry')).toBe('retry');release();await held;
 a.abort();await expect(servicesOverviewRead('account-a',a.signal,async()=>'obsolete')).rejects.toHaveProperty('name','AbortError');
});
it('stops remaining work pagination when the sibling work list fails',async()=>{
 let fail!:()=>void,finish!:(value:Response)=>void;const paths:string[]=[];
 vi.stubGlobal('fetch',vi.fn((path:string)=>{
  paths.push(path);
  if(path.includes('/transactions/requests?'))return new Promise((_resolve,reject)=>{fail=()=>reject(Error('Synthetic failure'));});
  if(path.includes('/transactions/reservations?'))return new Promise<Response>(resolve=>{finish=resolve;});
  return Promise.resolve(new Response(JSON.stringify(path.includes('/today?')?{requests:{items:[]},pending:{items:[]},upcoming:{items:[]},messages:{items:[]}}:{items:[],has_more:false,requests:[]})));
 }));
 mount(1);for(let i=0;i<10;i++)await tick();expect(fail).toBeTypeOf('function');expect(finish).toBeTypeOf('function');
 fail();await tick();finish(new Response(JSON.stringify({reservations:[{reservation_ref:'RSV_one'}],has_more:true})));
 for(let i=0;i<10;i++)await tick();expect(paths.some(path=>path.includes('reservations?offset=1'))).toBe(false);
});
it('keeps the retained inactive Work panel from refreshing on window focus',async()=>{
 vi.stubGlobal('window',Object.assign(new EventTarget(),{location:new URL('http://127.0.0.1/shida/seller/services/')}));
 vi.stubGlobal('document',{hidden:false});
 const fetcher=vi.fn(async(path:string)=>new Response(JSON.stringify(path.includes('/requests?')?{requests:[]}:path.includes('/reservations?')?{reservations:[]}:{threads:[]})));
 vi.stubGlobal('fetch',fetcher);
 renderToStaticMarkup(<ServicesTransactions activeView={false} base="/api/shida/personal/services" binding="test" locale="fr" billAvailable={false} financeAvailable={false} onDenied={()=>{}}/>);
 for(const effect of lifecycle.effects){const stop=effect();if(stop)stops.push(stop);}
 for(let i=0;i<10;i++)await tick();const initial=fetcher.mock.calls.length;expect(initial).toBe(3);
 window.dispatchEvent(new Event('focus'));for(let i=0;i<10;i++)await tick();expect(fetcher).toHaveBeenCalledTimes(initial);
});
it('starts the calendar timeout only when its queued read is dispatched',async()=>{
 vi.useFakeTimers();const held:Array<()=>void>=[];let calendarAborted:boolean|undefined;
 vi.spyOn(AbortSignal,'timeout').mockImplementation(ms=>{const controller=new AbortController();setTimeout(()=>controller.abort(),ms);return controller.signal;});
 vi.stubGlobal('fetch',vi.fn((path:string,init:RequestInit)=>{
  if(path.includes('/today?')||path.includes('/transactions/requests?'))return new Promise((_resolve,reject)=>held.push(()=>reject(Error('Synthetic held completion'))));
  if(path.includes('/calendar?'))calendarAborted=init.signal?.aborted;
  return Promise.resolve(new Response(JSON.stringify({items:[],requests:[],reservations:[],has_more:false})));
 }));
 mount(0);await tick();expect(held).toHaveLength(2);
 await vi.advanceTimersByTimeAsync(21000);expect(calendarAborted).toBeUndefined();
 held.forEach(done=>done());for(let i=0;i<10;i++)await tick();expect(calendarAborted).toBe(false);
 vi.restoreAllMocks();
});
