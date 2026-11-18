import {afterEach, expect, it, vi} from 'vitest';
import {restorePersonalSession, PERSONAL_SESSION_EVENT} from '../app/lib/personal-session-browser';
import {LOGIN_EVENT, markLoginUnconfirmed} from '../app/lib/personal-login-browser';

afterEach(()=>{markLoginUnconfirmed(false);vi.unstubAllGlobals();});
const response=(name='Synthetic')=>Response.json({binding:'a'.repeat(64),user:{display_name:name}});
function pending(){
 let release!:(value:Response)=>void;
 const fetcher=vi.fn((_url:unknown,_options?:RequestInit)=>{void _url;void _options;return new Promise<Response>(resolve=>{release=resolve;});});
 vi.stubGlobal('fetch',fetcher);
 return {fetcher,release:(value=response())=>release(value)};
}
it('coalesces overlapping readers, never caches completed private results',async()=>{
 const p=pending();const a=restorePersonalSession(),b=restorePersonalSession();
 await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));p.release();
 expect(await a).toEqual(await b);
 const c=restorePersonalSession();await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(2));p.release(response('Other'));
 expect((await c).user.display_name).toBe('Other');
});
it('aborting one consumer does not cancel another consumer',async()=>{
 const p=pending(),controller=new AbortController();
 const a=restorePersonalSession(controller.signal),rejected=expect(a).rejects.toMatchObject({name:'AbortError'}),b=restorePersonalSession();
 await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));controller.abort();await rejected;
 expect(p.fetcher.mock.calls[0][1]?.signal?.aborted).toBe(false);p.release();expect((await b).user.display_name).toBe('Synthetic');
});
it('aborts the transport when all consumers leave and starts a fresh read',async()=>{
 const p=pending(),controller=new AbortController();const a=restorePersonalSession(controller.signal),rejected=expect(a).rejects.toMatchObject({name:'AbortError'});
 await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));controller.abort();await rejected;
 expect(p.fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);p.release();
 const b=restorePersonalSession();await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(2));p.release();await b;
});
it.each([PERSONAL_SESSION_EVENT,LOGIN_EVENT,'storage'])('discards a late old-account response after %s',async event=>{
 const target=new EventTarget();vi.stubGlobal('window',target);
 const p=pending(),old=restorePersonalSession(),rejected=expect(old).rejects.toMatchObject({name:'AbortError'});
 await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));
 const change=new Event(event);if(event==='storage')Object.defineProperty(change,'key',{value:LOGIN_EVENT});target.dispatchEvent(change);
 p.release(response('Old account'));await rejected;
 const fresh=restorePersonalSession();await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(2));p.release(response('New account'));
 expect((await fresh).user.display_name).toBe('New account');
});
it('does not share failed reads with a later retry',async()=>{
 const p=pending(),a=restorePersonalSession(),b=restorePersonalSession();
 const checks=Promise.all([expect(a).rejects.toMatchObject({status:503}),expect(b).rejects.toMatchObject({status:503})]);
 await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));p.release(Response.json({}, {status:503}));await checks;
 const c=restorePersonalSession();await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(2));p.release();await c;
});
it('rejects unconfirmed authentication before and during a pending read',async()=>{
 const p=pending();markLoginUnconfirmed(true);await expect(restorePersonalSession()).rejects.toMatchObject({status:401});expect(p.fetcher).not.toHaveBeenCalled();
 markLoginUnconfirmed(false);const a=restorePersonalSession(),rejected=expect(a).rejects.toMatchObject({status:401});
 await vi.waitFor(()=>expect(p.fetcher).toHaveBeenCalledTimes(1));markLoginUnconfirmed(true);p.release();await rejected;
});
it('does not redirect from an obsolete deletion-status response',async()=>{
 const target=Object.assign(new EventTarget(),{location:{pathname:'/fr/shida',assign:vi.fn()}});vi.stubGlobal('window',target);
 let release!:(value:Response)=>void;
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(Response.json({}, {status:409})).mockImplementationOnce(()=>new Promise<Response>(resolve=>{release=resolve;})));
 const a=restorePersonalSession(),rejected=expect(a).rejects.toMatchObject({name:'AbortError'});
 await vi.waitFor(()=>expect(release).toBeTypeOf('function'));target.dispatchEvent(new Event(LOGIN_EVENT));release(Response.json({deletion:{reference:'DEL_fixture'}}));await rejected;
 expect(target.location.assign).not.toHaveBeenCalled();
});
