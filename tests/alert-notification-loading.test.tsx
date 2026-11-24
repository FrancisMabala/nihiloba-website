import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({initialData:null as unknown,effects:[] as Array<()=>void|(()=>void)>,callbacks:[] as Array<(...args:never[])=>unknown>,setters:[] as Array<ReturnType<typeof vi.fn>>}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useEffect:(effect:()=>void|(()=>void))=>h.effects.push(effect),useCallback:(fn:(...args:never[])=>unknown)=>{h.callbacks.push(fn);return fn;},useId:()=>':loading:',useRef:(value:unknown)=>({current:value}),useState:(value:unknown)=>{const setter=vi.fn();const state=h.setters.length===2&&h.initialData!==null?h.initialData:value;h.setters.push(setter);return [state,setter];},useSyncExternalStore:()=>null}));
import NotificationCenter from '../app/components/shida/notification-center';
import {EmployerAlerts} from '../app/components/shida/employer-alerts';
beforeEach(()=>{h.initialData=null;h.effects=[];h.callbacks=[];h.setters=[];});afterEach(()=>vi.unstubAllGlobals());
function deferred(){let resolve!:(value:Response)=>void;const promise=new Promise<Response>(r=>resolve=r);return {promise,resolve};}
it('clears notification loading when the list is ready while count is still pending',async()=>{
 const count=deferred();const fetcher=vi.fn((url:unknown)=>String(url).includes('/count')?count.promise:Promise.resolve(Response.json({items:[],next_cursor:null})));
 vi.stubGlobal('fetch',fetcher);NotificationCenter({inline:true,locale:'en',binding:'loading-session',apiBase:'/api/shida/personal/notifications'});
 await h.callbacks[2]();expect(h.setters[7]).toHaveBeenLastCalledWith(false);
 expect(fetcher).toHaveBeenCalledTimes(2);count.resolve(Response.json({unread_count:0}));await Promise.resolve();
});
it('shows base alert controls before enrichment and retains logos when decoration arrives',async()=>{
 const cards=deferred();const list={items:[{relation_ref:'REL_test',reference:'ORG_test',kind:'company',name:'School',available:true,notifications:true}],page:1,total:1,has_more:false};
 vi.stubGlobal('fetch',vi.fn((url:unknown)=>String(url).includes('cards=1')?cards.promise:Promise.resolve(Response.json(String(url).includes('/following')?list:String(url).includes('/alerts')?{profile_count:1,enabled_count:1}:{channel:'whatsapp',email_state:'add_email',masked_email:null}))));
 EmployerAlerts({locale:'en',binding:'alert-session',unauthorized:vi.fn(),revision:0});const cleanup=h.effects[2]();
 await vi.waitFor(()=>expect(h.setters[2]).toHaveBeenCalledWith(expect.objectContaining({list})));
 cards.resolve(Response.json({...list,items:[{...list.items[0],logo:'https://example.invalid/logo.png'}]}));
 await vi.waitFor(()=>expect(h.setters[2]).toHaveBeenCalledTimes(2));
 const update=h.setters[2].mock.calls[1][0];expect(update({list,pref:{},profiles:{}}).list.items[0].logo).toBe('https://example.invalid/logo.png');if(cleanup)cleanup();
});
it('ignores late decoration after leaving the account without replacing useful base data',async()=>{
 const cards=deferred(),list={items:[{relation_ref:'REL_old',reference:'ORG_old',kind:'company',name:'Old school',available:true}],page:1,total:1,has_more:false};
 vi.stubGlobal('fetch',vi.fn((url:unknown)=>String(url).includes('cards=1')?cards.promise:Promise.resolve(Response.json(String(url).includes('/following')?list:{}))));
 EmployerAlerts({locale:'en',binding:'old-alert-session',unauthorized:vi.fn(),revision:0});const cleanup=h.effects[2]();
 await vi.waitFor(()=>expect(h.setters[2]).toHaveBeenCalledTimes(1));if(cleanup)cleanup();
 cards.resolve(Response.json({...list,items:[]}));await new Promise(resolve=>setTimeout(resolve,0));
 expect(h.setters[2]).toHaveBeenCalledTimes(1);
});
it.each([503,401])('retains base controls on enrichment %s and delegates only 401 to authentication',async status=>{
 const cards=deferred(),unauthorized=vi.fn(),list={items:[{relation_ref:'REL_fail',reference:'ORG_fail',kind:'company',name:'School',available:true}],page:1,total:1,has_more:false};
 vi.stubGlobal('fetch',vi.fn((url:unknown)=>String(url).includes('cards=1')?cards.promise:Promise.resolve(Response.json(String(url).includes('/following')?list:{}))));
 EmployerAlerts({locale:'en',binding:'failure-session',unauthorized,revision:0});const cleanup=h.effects[2]();
 await vi.waitFor(()=>expect(h.setters[2]).toHaveBeenCalledWith(expect.objectContaining({list})));
 cards.resolve(Response.json({detail:'unavailable'},{status}));await new Promise(resolve=>setTimeout(resolve,0));
 expect(h.setters[2]).toHaveBeenCalledTimes(1);expect(h.setters[3]).not.toHaveBeenCalledWith(true);
 expect(unauthorized).toHaveBeenCalledTimes(status===401?1:0);if(cleanup)cleanup();
});
it('does not overwrite an alert toggle with enrichment started before the mutation',async()=>{
 const cards=deferred(),write=deferred(),list={items:[{relation_ref:'REL_toggle',reference:'ORG_toggle',kind:'company',name:'School',available:true,notifications:true}],page:1,total:1,has_more:false};
 const base={list,pref:{channel:'whatsapp',email_state:'add_email',masked_email:null},profiles:{profile_count:0,enabled_count:0}};h.initialData=base;
 const fetcher=vi.fn((url:unknown,init?:RequestInit)=>init?.method==='PUT'?write.promise:String(url).includes('cards=1')?cards.promise:Promise.resolve(Response.json(String(url).includes('/following')?list:String(url).includes('/alerts')?base.profiles:base.pref)));
 vi.stubGlobal('fetch',fetcher);
 const tree=EmployerAlerts({locale:'en',binding:'toggle-session',unauthorized:vi.fn(),revision:0});const cleanup=h.effects[2]();
 await vi.waitFor(()=>expect(h.setters[2]).toHaveBeenCalledTimes(1));
 function switchAction(node:unknown):(()=>void)|undefined{if(Array.isArray(node)){for(const child of node){const found=switchAction(child);if(found)return found;}}else if(node&&typeof node==='object'){const props=(node as {props?:{role?:string;onClick?:()=>void;children?:unknown}}).props;if(props?.role==='switch')return props.onClick;return switchAction(props?.children);}return undefined;}
 const toggle=switchAction(tree);expect(toggle).toBeTypeOf('function');toggle!();
 cards.resolve(Response.json({...list,items:[{...list.items[0],logo:'https://example.invalid/late.png'}]}));await new Promise(resolve=>setTimeout(resolve,0));
 expect(h.setters[2]).toHaveBeenCalledTimes(1);
 write.resolve(Response.json({enabled:false}));await vi.waitFor(()=>expect(h.setters[2]).toHaveBeenCalledTimes(2));
 expect(h.setters[2].mock.calls[1][0](base).list.items[0].notifications).toBe(false);
 const mutation=fetcher.mock.calls.find(([,init])=>init?.method==='PUT');expect(JSON.parse(String(mutation?.[1]?.body))).toEqual({enabled:false});if(cleanup)cleanup();
});
