import {expect,it,vi} from 'vitest';
import {readNotificationCount} from '../app/lib/personal-notification-count';
function deferred(){let resolve!:(value:{unread_count:number})=>void;const promise=new Promise<{unread_count:number}>(r=>resolve=r);return {promise,resolve};}
it('coalesces concurrent bell and inline reads but never caches a settled count',async()=>{
 const first=deferred(),load=vi.fn(()=>first.promise);
 const bell=readNotificationCount('/personal','session-a',load),inline=readNotificationCount('/personal','session-a',load);
 await Promise.resolve();expect(load).toHaveBeenCalledTimes(1);first.resolve({unread_count:3});expect(await bell).toBe(3);expect(await inline).toBe(3);
 await readNotificationCount('/personal','session-a',load);expect(load).toHaveBeenCalledTimes(2);
});
it('separates session/API contexts and suppresses pre-mutation results',async()=>{
 const old=deferred(),fresh=deferred();
 const pending=readNotificationCount('/personal','session-a',()=>old.promise);
 const replacement=readNotificationCount('/personal','session-a',()=>fresh.promise,true);
 expect(await readNotificationCount('/personal','session-b',async()=>({unread_count:9}))).toBe(9);
 expect(await readNotificationCount('/business','session-a',async()=>({unread_count:7}))).toBe(7);
 old.resolve({unread_count:20});expect(await pending).toBeUndefined();fresh.resolve({unread_count:2});expect(await replacement).toBe(2);
});
it('releases failed flights for retry and rejects invalid counts',async()=>{
 expect(await readNotificationCount('/personal','failed',async()=>{throw Error();})).toBeNull();
 expect(await readNotificationCount('/personal','failed',async()=>({unread_count:4}))).toBe(4);
 expect(await readNotificationCount('/personal','failed',async()=>({unread_count:-1}))).toBeNull();
 expect(await readNotificationCount('/personal','failed',async()=>null as unknown as {unread_count:number})).toBeNull();
});
