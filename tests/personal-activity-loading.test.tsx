import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {usePersonalActivityData,type ActivityData} from '../app/lib/use-personal-activity-data';
import {ActivityOverview} from '../app/components/shida/activity-overview';
import {accountSpaceCopy} from '../app/lib/account-space-copy';
const lifecycle=vi.hoisted(()=>({effects:[] as Array<()=>void|(()=>void)>,set:vi.fn(),data:null as ActivityData|null,current:null as ActivityData|null}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useEffect:(effect:()=>void|(()=>void))=>lifecycle.effects.push(effect),useState:(initial:unknown)=>[initial===null?lifecycle.data:initial,lifecycle.set]}));
const binding='a'.repeat(64);
let stops:Array<()=>void>=[];
beforeEach(()=>{lifecycle.effects=[];lifecycle.data=null;lifecycle.current=null;lifecycle.set.mockReset().mockImplementation(value=>{lifecycle.data=value;});stops=[];});
afterEach(()=>{for(const stop of stops)stop();vi.unstubAllGlobals();});
function mockReads(){
 const reads=new Map<string,Array<(response:Response)=>void>>();
 const fetcher=vi.fn((url:unknown)=>new Promise<Response>(resolve=>{const path=String(url).replace('/api/shida/personal/','');reads.set(path,[...(reads.get(path)??[]),resolve]);}));vi.stubGlobal('fetch',fetcher);
 const release=(path:string,data:unknown,status=200,index=0)=>reads.get(path)![index](Response.json(data,{status}));
 return {reads,fetcher,release};
}
function Harness({progressive,token,revision}:{progressive:boolean;token:string;revision:number}){const data=usePersonalActivityData(token,1,revision,true,false,progressive);return <span>{data?'READY':'PENDING'}</span>;}
function mount(progressive=true,token=binding){const html=renderToStaticMarkup(<Harness progressive={progressive} token={token} revision={lifecycle.effects.length}/>);lifecycle.current=html.includes('READY')?lifecycle.data:null;const stop=lifecycle.effects.at(-1)!();if(stop)stops.push(stop);return stop;}
function finish(p:ReturnType<typeof mockReads>,index=0){
 p.release('wenze/stores/?archived=false',{stores:[]},200,index);p.release('wenze/stores/?archived=true',{stores:[]},200,index);
 p.release('restaurants/?page=1&page_size=20',{items:[],total:0,actions:[]},200,index);p.release('services/',{profiles:[]},200,index);p.release('services/capabilities/',{capabilities:['profile']},200,index);
 p.release('security/navigation/',{can_manage:false,markets:[],organization_management:false,travel_profiles:[]},200,index);
 p.release('job-offer/?kind=catalogue',{rows:[]},200,index);p.release('apartments/manage/?page=1',{items:[],has_more:false},200,index);
}
it('publishes a complete fast section while unrelated sections remain held',async()=>{
 const p=mockReads();mount();await vi.waitFor(()=>expect(p.reads.size).toBe(8));
 p.release('wenze/stores/?archived=false',{stores:[{public_ref:'WZ_shop',name:'Synthetic shop'}]});await Promise.resolve();expect(lifecycle.data).toBeNull();
 p.release('wenze/stores/?archived=true',{stores:[]});await vi.waitFor(()=>expect(lifecycle.data?.items[0]?.name).toBe('Synthetic shop'));
 expect(lifecycle.data).toMatchObject({pending:true,failed:false,loaded:['wenze']});
 const html=renderToStaticMarkup(<ActivityOverview locale="en" current={lifecycle.data} creation="CREATE" onRetry={()=>{}}/>);expect(html).toContain('Synthetic shop');expect(html).toContain('role="status"');expect(html).not.toContain('overview-welcome');
 finish(p);await vi.waitFor(()=>expect(lifecycle.data?.pending).toBe(false));
});
it('retains complete-context behavior for management consumers',async()=>{
 const p=mockReads();mount(false);await vi.waitFor(()=>expect(p.reads.size).toBe(8));p.release('restaurants/?page=1&page_size=20',{items:[],total:0,actions:[]});await new Promise(resolve=>setTimeout(resolve,0));expect(lifecycle.data).toBeNull();
 finish(p);await vi.waitFor(()=>expect(lifecycle.data).toMatchObject({pending:false,failed:false}));
});
it('keeps failures partial and permits a fresh retry',async()=>{
 const p=mockReads();const stop=mount();await vi.waitFor(()=>expect(p.reads.size).toBe(8));p.release('services/',{},503);finish(p);await vi.waitFor(()=>expect(lifecycle.data).toMatchObject({pending:false,failed:true}));expect(lifecycle.data?.loaded).not.toContain('services');
 stop?.();mount();expect(lifecycle.current).toBeNull();await vi.waitFor(()=>expect(p.reads.get('security/navigation/')?.length).toBe(2));finish(p,1);await vi.waitFor(()=>expect(lifecycle.data).toMatchObject({pending:false,failed:false}));
});
it('does not publish aborted old-account data after a new account mounts',async()=>{
 const p=mockReads(),stop=mount();await vi.waitFor(()=>expect(p.reads.size).toBe(8));stop?.();mount(true,'b'.repeat(64));await vi.waitFor(()=>expect(p.reads.get('security/navigation/')?.length).toBe(2));finish(p);await new Promise(resolve=>setTimeout(resolve,0));expect(lifecycle.data).toBeNull();finish(p,1);await vi.waitFor(()=>expect(lifecycle.data?.binding).toBe('b'.repeat(64)));
});
it.each(['en','fr','ln','sw'] as const)('does not show a false empty welcome while %s sections are pending',locale=>{
 const current:ActivityData={binding,items:[],options:[],failed:false,loaded:[],more:false,markets:[],business:false,pending:true,overview:{listings:[],properties:[],travel:[],seeker:undefined}};
 const pending=renderToStaticMarkup(<ActivityOverview locale={locale} current={current} creation="CREATE" onRetry={()=>{}}/>);expect(pending).toContain(accountSpaceCopy[locale].loading);expect(pending).not.toContain('overview-welcome');
 const complete=renderToStaticMarkup(<ActivityOverview locale={locale} current={{...current,pending:false}} creation="CREATE" onRetry={()=>{}}/>);expect(complete).toContain('overview-welcome');
});
