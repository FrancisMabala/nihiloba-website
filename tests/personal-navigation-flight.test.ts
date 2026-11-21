import {afterEach,expect,it,vi} from 'vitest';
import {readPersonalNavigation} from '../app/lib/personal-navigation-browser';
import {PERSONAL_SESSION_EVENT} from '../app/lib/personal-session-browser';
import {LOGIN_EVENT,LOGIN_LOCK,markLoginUnconfirmed} from '../app/lib/personal-login-browser';
const binding='a'.repeat(64),other='b'.repeat(64);
const response=(markets=['wenze'])=>Response.json({can_manage:true,markets,organization_management:false});
function pending(){
 const releases:Array<(value:Response)=>void>=[];
 const fetcher=vi.fn((_url:unknown,_options?:RequestInit)=>{void _url;void _options;return new Promise<Response>(resolve=>releases.push(resolve));});
 vi.stubGlobal('fetch',fetcher);return {fetcher,releases};
}
afterEach(()=>{markLoginUnconfirmed(false);vi.unstubAllGlobals();});
it('shares overlapping same-session reads but never completed permissions',async()=>{
 const p=pending(),a=readPersonalNavigation(binding),b=readPersonalNavigation(binding);
 await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));p.releases[0](response());expect(await a).toEqual(await b);
 const c=readPersonalNavigation(binding);await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(2));p.releases[1](response([]));expect((await c).markets).toEqual([]);
});
it('never coalesces different session bindings',async()=>{
 const p=pending(),a=readPersonalNavigation(binding),b=readPersonalNavigation(other);
 await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(2));p.releases[0](response(['wenze']));p.releases[1](response(['services']));
 expect((await a).markets).toEqual(['wenze']);expect((await b).markets).toEqual(['services']);
 expect(p.fetcher.mock.calls.map(call=>(call[1]?.headers as Record<string,string>)['X-Shida-Session'])).toEqual([binding,other]);
});
it('cancels each consumer independently',async()=>{
 const p=pending(),controller=new AbortController(),a=readPersonalNavigation(binding,controller.signal),b=readPersonalNavigation(binding);
 const rejected=expect(a).rejects.toMatchObject({name:'AbortError'});
 await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));controller.abort();await rejected;
 expect(p.fetcher.mock.calls[0][1]?.signal?.aborted).toBe(false);p.releases[0](response());await b;
});
it('cancels transport when the final consumer leaves and rejects late data',async()=>{
 const p=pending(),controller=new AbortController(),a=readPersonalNavigation(binding,controller.signal),rejected=expect(a).rejects.toMatchObject({name:'AbortError'});
 await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));controller.abort();await rejected;expect(p.fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
 const b=readPersonalNavigation(binding);await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(2));p.releases[0](response(['old']));p.releases[1](response(['new']));expect((await b).markets).toEqual(['new']);
});
it.each([PERSONAL_SESSION_EVENT,LOGIN_EVENT,'storage'])('invalidates pending authority after %s',async event=>{
 const target=new EventTarget();vi.stubGlobal('window',target);const p=pending(),a=readPersonalNavigation(binding),rejected=expect(a).rejects.toMatchObject({name:'AbortError'});
 await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));const change=new Event(event);if(event==='storage')Object.defineProperty(change,'key',{value:LOGIN_EVENT});target.dispatchEvent(change);p.releases[0](response());await rejected;
 const b=readPersonalNavigation(other);await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(2));p.releases[1](response(['services']));expect((await b).markets).toEqual(['services']);
});
it.each([Response.json({}, {status:503}),Response.json({markets:'wenze',organization_management:false})])('retries after an unavailable or malformed response',async failure=>{
 const p=pending(),a=readPersonalNavigation(binding),rejected=expect(a).rejects.toThrow('Unavailable permissions');await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));p.releases[0](failure);await rejected;
 const b=readPersonalNavigation(binding);await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(2));p.releases[1](response());await b;
});
it('rejects unconfirmed authentication and invalid bindings without transport',async()=>{
 const p=pending();markLoginUnconfirmed(true);await expect(readPersonalNavigation(binding)).rejects.toThrow();markLoginUnconfirmed(false);await expect(readPersonalNavigation('invalid')).rejects.toThrow();expect(p.fetcher).not.toHaveBeenCalled();
});
it('rejects authority if authentication becomes unconfirmed during transport',async()=>{
 const p=pending(),a=readPersonalNavigation(binding),rejected=expect(a).rejects.toThrow('Unavailable permissions');await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));markLoginUnconfirmed(true);p.releases[0](response());await rejected;
});
it('does not read permissions during an active authentication mutation',async()=>{
 const p=pending();vi.stubGlobal('navigator',{locks:{query:async()=>({held:[{name:LOGIN_LOCK}]})}});await expect(readPersonalNavigation(binding)).rejects.toThrow('Unavailable permissions');expect(p.fetcher).not.toHaveBeenCalled();
});
