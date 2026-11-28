import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
const state=vi.hoisted(()=>({consent:'unknown',effects:[] as (()=>void|(()=>void))[],listeners:new Set<()=>void>(),restore:vi.fn(),request:vi.fn()}));
vi.mock('react',async importOriginal=>({...await importOriginal<typeof import('react')>(),useEffect:(callback:()=>void|(()=>void))=>{state.effects.push(callback);},useSyncExternalStore:(_subscribe:unknown,get:()=>string)=>get()}));
vi.mock('../app/lib/website-statistics-consent',()=>({statisticsConsentSnapshot:()=>state.consent,statisticsServerSnapshot:()=> 'unknown',subscribeStatisticsConsent:(fn:()=>void)=>{state.listeners.add(fn);return()=>state.listeners.delete(fn);}}));
vi.mock('../app/lib/personal-session-browser',()=>({restorePersonalSession:state.restore}));
vi.mock('../app/lib/restaurant-seller-browser',()=>({request:state.request}));
import {RestaurantInterest} from '../app/components/shida/restaurant-interest';
let handlers:Map<string,EventListener>,cleanup:(()=>void)|undefined;
beforeEach(()=>{
 state.consent='unknown';state.effects=[];state.listeners.clear();state.restore.mockReset().mockResolvedValue({binding:'synthetic'});state.request.mockReset().mockResolvedValue({recorded:true});handlers=new Map();vi.useFakeTimers();
 vi.stubGlobal('document',{visibilityState:'visible',querySelector:()=>({getBoundingClientRect:()=>({width:10,height:10,bottom:10,top:0})}),addEventListener:(name:string,listener:EventListener)=>handlers.set(name,listener),removeEventListener:(name:string)=>handlers.delete(name)});
 vi.stubGlobal('navigator',{webdriver:false,doNotTrack:'0'});vi.stubGlobal('innerHeight',800);
});
afterEach(()=>{cleanup?.();cleanup=undefined;vi.useRealTimers();vi.unstubAllGlobals();});
function mount(){const html=renderToStaticMarkup(<RestaurantInterest establishmentRef="RST_fixture" locale="en" menuOnly={false} menuAvailable={false}/>);cleanup=state.effects[0]()||undefined;return html;}
function click(){handlers.get('scroll')?.({isTrusted:true,type:'scroll'} as Event);}
function revoke(){state.consent='declined';for(const listener of state.listeners)listener();}
it.each(['unknown','declined','blocked'])('does not attach interest handlers, restore identity or post with consent %s',consent=>{
 state.consent=consent;const html=mount();click();vi.runAllTimers();expect(handlers.size).toBe(0);expect(state.restore).not.toHaveBeenCalled();expect(state.request).not.toHaveBeenCalled();expect(html).toContain('You can still place an order.');expect(html).not.toContain('disabled');
});
it('clears delayed interest timers on revocation before session restoration',async()=>{
 state.consent='accepted';mount();click();expect(vi.getTimerCount()).toBe(1);revoke();await vi.advanceTimersByTimeAsync(1100);expect(state.restore).not.toHaveBeenCalled();expect(state.request).not.toHaveBeenCalled();
});
it('aborts a pending session read and prevents a late response from posting after revocation',async()=>{
 let resolve!:(value:{binding:string})=>void;state.restore.mockImplementation(()=>new Promise(done=>{resolve=done;}));state.consent='accepted';mount();click();await vi.advanceTimersByTimeAsync(1000);const signal=state.restore.mock.calls[0][0] as AbortSignal;revoke();expect(signal.aborted).toBe(true);resolve({binding:'late'});await Promise.resolve();expect(state.request).not.toHaveBeenCalled();
});
it('posts accepted interest and aborts the in-flight POST immediately on revocation',async()=>{
 state.consent='accepted';state.request.mockImplementation(()=>new Promise(()=>{}));mount();click();await vi.advanceTimersByTimeAsync(1000);expect(state.request).toHaveBeenCalledTimes(1);const init=state.request.mock.calls[0][1] as RequestInit;expect(JSON.parse(init.body as string).kind).toBe('profile_opens');revoke();expect(init.signal?.aborted).toBe(true);click();await vi.advanceTimersByTimeAsync(1100);expect(state.request).toHaveBeenCalledTimes(1);
});
