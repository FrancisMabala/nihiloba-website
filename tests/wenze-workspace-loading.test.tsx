import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {WenzeWorkspace} from '../app/components/shida/wenze-workspace';
// Exercise actual initialization effects with synthetic transport. Browser QA
// separately covers destination bodies, history, drafts and Today counters.
const lifecycle=vi.hoisted(()=>({effects:[] as Array<()=>void|(()=>void)>,states:[] as Array<{initial:unknown;set:ReturnType<typeof vi.fn>}>,request:vi.fn(),replace:vi.fn()}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useEffect:(effect:()=>void|(()=>void))=>lifecycle.effects.push(effect),useState:(initial:unknown)=>{const set=vi.fn();lifecycle.states.push({initial,set});return [initial,set];}}));
vi.mock('../app/lib/wenze-seller-api',async original=>({...await original<typeof import('../app/lib/wenze-seller-api')>(),useWenzeApi:()=>({request:lifecycle.request})}));
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),replace:lifecycle.replace})}));
const shop={public_ref:'WNZ_fixture',name:'Synthetic shop',status:'active',revision:1};
let stops:Array<()=>void>=[];
beforeEach(()=>{lifecycle.effects=[];lifecycle.states=[];lifecycle.request.mockReset();lifecycle.replace.mockReset();stops=[];});
afterEach(()=>{for(const stop of stops)stop();vi.unstubAllGlobals();});
function mount(query:string){
 const location=new URL('http://127.0.0.1/shida/seller/wenze/'+query);
 vi.stubGlobal('window',Object.assign(new EventTarget(),{location}));vi.stubGlobal('location',location);vi.stubGlobal('history',{state:null,replaceState:vi.fn()});
 renderToStaticMarkup(<WenzeWorkspace locale="en" binding={'a'.repeat(64)}/>);
 for(const effect of lifecycle.effects){const stop=effect();if(stop)stops.push(stop);}
 return {checking:lifecycle.states.find(row=>row.initial===true)!.set,view:lifecycle.states.find(row=>row.initial==='today')!.set};
}
function fixture(){
 lifecycle.request.mockImplementation(async(path:string)=>{
  if(path.includes('?archived='))return {stores:[shop],categories:[]};
  if(path.endsWith('/WNZ_fixture'))return shop;
  if(path.includes('/products?'))return {products:[],total:0};
  if(path.endsWith('/WNP_fixture'))return {public_ref:'WNP_fixture',name:'Synthetic product'};
  throw Error('Unexpected request '+path);
 });
}
it.each(['today','orders','money','reports','shop','inventory','sales'])('does not wait for an unrelated catalogue entering %s',async view=>{
 fixture();const state=mount('?store=WNZ_fixture&view='+view);await vi.waitFor(()=>expect(state.checking).toHaveBeenCalledWith(false));
 expect(state.view).toHaveBeenCalledWith(view);expect(lifecycle.request.mock.calls.map(call=>call[0])).toEqual(['wenze/contexts/personal/stores?archived=false','wenze/contexts/personal/stores/WNZ_fixture']);
});
it('automatically selects the only store for Today without a redundant catalogue',async()=>{
 fixture();const state=mount('');await vi.waitFor(()=>expect(state.checking).toHaveBeenCalledWith(false));expect(lifecycle.request).toHaveBeenCalledTimes(1);expect(state.view).toHaveBeenCalledWith('today');
});
it('awaits catalogue data and retains deep-link filters and page',async()=>{
 fixture();let release!:(value:unknown)=>void;
 const normal=lifecycle.request.getMockImplementation()!;
 lifecycle.request.mockImplementation((path:string)=>path.includes('/products?')?new Promise(resolve=>{release=resolve;}):normal(path));
 const state=mount('?store=WNZ_fixture&view=catalog&search=table&status=hidden&offset=20');await vi.waitFor(()=>expect(release).toBeTypeOf('function'));
 expect(state.checking).not.toHaveBeenCalledWith(false);expect(lifecycle.request).toHaveBeenCalledWith('wenze/contexts/personal/stores/WNZ_fixture/products?status=hidden&search=table&offset=20&limit=20');
 release({products:[],total:0});await vi.waitFor(()=>expect(state.checking).toHaveBeenCalledWith(false));
});
it('product deep links retain their product detail and catalogue destination',async()=>{
 fixture();const state=mount('?store=WNZ_fixture&product=WNP_fixture');await vi.waitFor(()=>expect(state.checking).toHaveBeenCalledWith(false));expect(state.view).toHaveBeenCalledWith('catalog');expect(lifecycle.request).toHaveBeenCalledWith('wenze/contexts/personal/stores/WNZ_fixture/products/WNP_fixture');expect(lifecycle.request.mock.calls.some(call=>call[0].includes('/products?'))).toBe(true);
});
it('retains failed store access as a failed setup check',async()=>{
 lifecycle.request.mockRejectedValue(Error('Unavailable'));const state=mount('?store=WNZ_fixture&view=orders');await vi.waitFor(()=>expect(state.checking).toHaveBeenCalledWith(false));expect(lifecycle.states.filter(row=>row.initial===false).some(row=>row.set.mock.calls.some(call=>call[0]===true))).toBe(true);expect(lifecycle.request).toHaveBeenCalledTimes(1);
});
