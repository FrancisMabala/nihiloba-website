import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {WenzeToday} from '../app/components/shida/wenze-today';
import {createWenzeTodayReads} from '../app/lib/wenze-today-loading';
import {loadInventoryCatalogue} from '../app/lib/wenze-inventory-catalogue';
const lifecycle=vi.hoisted(()=>({effects:[] as Array<()=>void|(()=>void)>,request:vi.fn()}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useEffect:(effect:()=>void|(()=>void))=>lifecycle.effects.push(effect)}));
vi.mock('../app/lib/wenze-seller-api',()=>({useWenzeApi:()=>({request:lifecycle.request})}));
let stops:Array<()=>void>=[];
beforeEach(()=>{lifecycle.effects=[];lifecycle.request.mockReset();stops=[];vi.stubGlobal('document',{visibilityState:'visible'});});
afterEach(()=>{stops.forEach(stop=>stop());vi.useRealTimers();vi.unstubAllGlobals();});
const tick=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
function mount(storeRef='WNZ_test'){
 lifecycle.effects=[];
 renderToStaticMarkup(<WenzeToday key={storeRef} store={{public_ref:storeRef,name:'Synthetic shop'}} stores={[]} locale="fr" onChoose={()=>{}} onNavigate={()=>{}} onOpenOrder={()=>{}}/>);
 for(const effect of lifecycle.effects){const stop=effect();if(stop)stops.push(stop);}
}
it('bounds actual Today startup at two reads and drops queued work on unmount',async()=>{
 const sent:string[]=[];const finish:Array<(value:unknown)=>void>=[];
 lifecycle.request.mockImplementation((path:string)=>{sent.push(path);return new Promise(resolve=>finish.push(resolve));});
 mount();await tick();
 console.info('Today initial simultaneous reads:',sent.length);
 expect(sent).toHaveLength(2);expect(sent[0]).toContain('/today?');expect(sent[1]).toContain('/orders?');
 stops.forEach(stop=>stop());stops=[];finish.forEach(resolve=>resolve({}));await tick();expect(sent).toHaveLength(2);
});
it('retains the binding limit when the parent unmounts and remounts Today for another store',async()=>{
 const sent:string[]=[];const finish:Array<(value:unknown)=>void>=[];
 lifecycle.request.mockImplementation((path:string)=>{sent.push(path);return new Promise(resolve=>finish.push(resolve));});
 mount('WNZ_old');await tick();stops.forEach(stop=>stop());stops=[];
 mount('WNZ_new');await tick();expect(sent).toHaveLength(2);expect(sent.every(path=>path.includes('WNZ_old'))).toBe(true);
 finish.splice(0).forEach(resolve=>resolve({}));await tick();expect(sent).toHaveLength(4);expect(sent.slice(2).every(path=>path.includes('WNZ_new'))).toBe(true);
 stops.forEach(stop=>stop());stops=[];finish.splice(0).forEach(resolve=>resolve({}));await tick();expect(sent).toHaveLength(4);
});
it('gives a new account binding fresh slots without launching the old account queue',async()=>{
 const finish:Array<(value:unknown)=>void>=[];const oldRequest=lifecycle.request;
 oldRequest.mockImplementation(()=>new Promise(resolve=>finish.push(resolve)));
 mount('WNZ_old_account');await tick();stops.forEach(stop=>stop());stops=[];
 lifecycle.request=vi.fn(()=>new Promise(resolve=>finish.push(resolve)));
 mount('WNZ_new_account');await tick();
 expect(oldRequest).toHaveBeenCalledTimes(2);expect(lifecycle.request).toHaveBeenCalledTimes(2);
 expect(lifecycle.request.mock.calls.every(call=>String(call[0]).includes('WNZ_new_account'))).toBe(true);
 stops.forEach(stop=>stop());stops=[];finish.forEach(resolve=>resolve({}));await tick();
 expect(oldRequest).toHaveBeenCalledTimes(2);expect(lifecycle.request).toHaveBeenCalledTimes(2);
});
it('completes Today under a controlled four-active-read admission limit',async()=>{
 let active=0,peak=0,rejected=0,completed=0;
 lifecycle.request.mockImplementation(async(path:string)=>{
  active++;peak=Math.max(peak,active);
  if(active>4){active--;rejected++;throw Error('Synthetic capacity exceeded');}
  await tick();active--;completed++;
  if(path.includes('/products?'))return {products:[],total:0};
  if(path.includes('/inventory/stock?'))return {items:[]};
  return {};
 });
 mount();for(let i=0;i<15;i++)await tick();
 console.info('Controlled Today admission:',{peak,rejected,completed});
 expect(rejected).toBe(0);expect(completed).toBe(5);expect(peak).toBeLessThanOrEqual(2);
});
it('does not poll hidden or overlapping work and recovers on the next visible interval',async()=>{
 vi.useFakeTimers();let pending:Array<(value:unknown)=>void>=[];
 lifecycle.request.mockImplementation(()=>new Promise(resolve=>pending.push(resolve)));
 mount();await tick();await vi.advanceTimersByTimeAsync(60000);expect(lifecycle.request).toHaveBeenCalledTimes(2);
 lifecycle.request.mockRejectedValue(new Error('Synthetic unavailable'));
 pending.forEach(resolve=>resolve({}));pending=[];await tick();
 const failedCount=lifecycle.request.mock.calls.length;expect(failedCount).toBe(5);
 vi.stubGlobal('document',{visibilityState:'hidden'});await vi.advanceTimersByTimeAsync(120000);expect(lifecycle.request).toHaveBeenCalledTimes(failedCount);
 vi.stubGlobal('document',{visibilityState:'visible'});await vi.advanceTimersByTimeAsync(60000);expect(lifecycle.request).toHaveBeenCalledTimes(failedCount+5);
});
it.each(['summary','products'])('abandons residual pagination after %s fails before the next poll',async failure=>{
 vi.useFakeTimers();let first=true;
 const held:Array<{path:string;resolve:(value:unknown)=>void}>=[];const paths:string[]=[];
 lifecycle.request.mockImplementation((path:string)=>{
  paths.push(path);
  if(first&&path.includes(failure==='summary'?'/inventory/summary':'/products?'))return Promise.reject(Error('Synthetic partial failure'));
  if(first&&(path.includes('/products?')||path.includes('/inventory/stock?')))return new Promise(resolve=>held.push({path,resolve}));
  if(path.includes('/products?'))return Promise.resolve({products:[],total:0});
  if(path.includes('/inventory/stock?'))return Promise.resolve({items:[]});
  return Promise.resolve({});
 });
 mount();for(let i=0;i<10;i++)await tick();expect(held.length).toBeGreaterThan(0);
 first=false;await vi.advanceTimersByTimeAsync(180000);
 held.forEach(({path,resolve})=>resolve(path.includes('/products?')?{products:[{public_ref:'p1'}],total:2}:{items:[],next_cursor:'obsolete-next'}));
 for(let i=0;i<20;i++)await tick();
 expect(paths.some(path=>path.includes('offset=1')||path.includes('cursor=obsolete-next'))).toBe(false);
 // Two occupied slots defer polling; a single occupied slot still permits
 // completed fresh polls. Neither case may revive the failed old traversal.
 const polls=paths.filter(path=>path.includes('/today?')).length;
 expect(polls).toBeGreaterThanOrEqual(2);expect(polls).toBeLessThanOrEqual(4);
});
it('retains occupied slots across cancelled generations and does not launch stale queued reads',async()=>{
 const finish:Array<()=>void>=[];let active=0,max=0;const sent:string[]=[];
 const read=createWenzeTodayReads(path=>{sent.push(path);active++;max=Math.max(max,active);return new Promise(resolve=>finish.push(()=>{active--;resolve(path);}));});
 const old=new AbortController(),fresh=new AbortController();
 const first=Promise.allSettled(['old1','old2','old3'].map(path=>read(path,old.signal)));
 await tick();old.abort();const next=Promise.allSettled(['new1','new2'].map(path=>read(path,fresh.signal)));await tick();
 expect(sent).toEqual(['old1','old2']);finish.splice(0).forEach(done=>done());await tick();expect(sent).toEqual(['old1','old2','new1','new2']);finish.splice(0).forEach(done=>done());
 expect((await first).every(result=>result.status==='rejected')).toBe(true);expect((await next).every(result=>result.status==='fulfilled')).toBe(true);expect(max).toBe(2);
});
it('reads every catalogue and stock page through the bounded queue and releases failed slots',async()=>{
 const paths:string[]=[];const read=createWenzeTodayReads(async path=>{
  paths.push(path);
  if(path==='fail')throw Error('Synthetic failure');
  if(path.startsWith('products'))return path.includes('offset=0')?{products:[{public_ref:'p1'}],total:2}:{products:[{public_ref:'p2'}],total:2};
  return path.includes('cursor=next')?{items:[{item_ref:'s2'}]}:{items:[{item_ref:'s1'}],next_cursor:'next'};
 });
 const signal=new AbortController().signal;
 const failure=read('fail',signal).catch(error=>error.message);
 const data=await loadInventoryCatalogue(path=>read(path,signal));expect(await failure).toBe('Synthetic failure');
 expect(data.catalogue.map(row=>row.public_ref)).toEqual(['p1','p2']);expect(data.stock.map(row=>row.item_ref)).toEqual(['s1','s2']);
 expect(paths).toContain('products?status=active&offset=1&limit=100');expect(paths).toContain('inventory/stock?limit=100&cursor=next');
});
