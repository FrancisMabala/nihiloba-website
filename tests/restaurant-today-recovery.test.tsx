import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {DashboardApiError,request} from '../app/lib/restaurant-seller-browser';

// The project deliberately has no synthetic DOM dependency. These exercise the
// real browser transport; the paired Playwright suite exercises the rendered UI.
const fetcher=vi.fn<typeof fetch>();
const path='personal/restaurants/RST_test/today-orders';
const binding='synthetic-browser-binding';
beforeEach(()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-18T12:00:00Z'));
 fetcher.mockReset();vi.stubGlobal('fetch',fetcher);
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});

describe('Restaurant Today recovery transport',()=>{
 it.each([
  [409,'restaurant_today_limit','30',30_000],
  [429,'restaurant_unavailable','2',2_000],
  [503,'restaurant_unavailable','Wed, 18 Nov 2026 12:00:04 GMT',4_000],
  [503,'restaurant_unavailable','Wed, 18 Nov 2026 11:59:59 GMT',0],
  [503,'restaurant_unavailable','not-a-delay',undefined],
  [503,'restaurant_unavailable',null,undefined],
 ] as const)('preserves typed %s errors and Retry-After %s',async(status,detail,header,delay)=>{
  fetcher.mockResolvedValue(Response.json({detail},{status,headers:header?{'Retry-After':header}:{}}));
  const error=await request(path,{},binding).catch(value=>value);
  expect(error).toBeInstanceOf(DashboardApiError);
  expect(error).toMatchObject({status,detail,retryAfterMs:delay});
  await vi.advanceTimersByTimeAsync(60_000);
  expect(fetcher).toHaveBeenCalledTimes(1); // a retry hint is not a retry command
 });

 it.each([401,403,404])('does not reinterpret protected %s as unsupported',async status=>{
  fetcher.mockResolvedValue(Response.json({detail:'restaurant_unavailable'},{status}));
  await expect(request(path,{},binding)).rejects.toMatchObject({status,detail:'restaurant_unavailable'});
  expect(fetcher).toHaveBeenCalledTimes(1);
 });

 it('keeps a gateway-declared missing endpoint distinct from a protected resource',async()=>{
  fetcher.mockResolvedValue(Response.json({detail:'restaurant_today_unsupported'},{status:405}));
  await expect(request(path,{},binding)).rejects.toMatchObject({status:405,detail:'restaurant_today_unsupported'});
 });

 it('preserves private, bound, non-cached reads and caller cancellation',async()=>{
  const controller=new AbortController();
  fetcher.mockImplementation((_input,init)=>new Promise((_resolve,reject)=>{
   init?.signal?.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')),{once:true});
  }));
  const pending=request(path,{signal:controller.signal},binding).catch(error=>error);
  controller.abort();
  expect(await pending).toBeInstanceOf(DashboardApiError);
  expect(fetcher.mock.calls[0]).toEqual([
   '/api/shida/personal/restaurants/RST_test/today-orders/',
   expect.objectContaining({signal:controller.signal,cache:'no-store',credentials:'same-origin',headers:{Accept:'application/json','X-Shida-Session':binding}}),
  ]);
  await vi.advanceTimersByTimeAsync(60_000);expect(fetcher).toHaveBeenCalledTimes(1);
 });

 it.each(['not-json','null','[]'])('rejects malformed successful JSON %s without retrying',async body=>{
  fetcher.mockResolvedValue(new Response(body,{status:200,headers:{'Content-Type':'application/json'}}));
  await expect(request(path,{},binding)).rejects.toMatchObject({status:502,detail:undefined});
  await vi.advanceTimersByTimeAsync(60_000);expect(fetcher).toHaveBeenCalledTimes(1);
 });

 it('does not retry a failed network request or invent an availability result',async()=>{
  fetcher.mockRejectedValue(new TypeError('Synthetic disconnected network'));
  await expect(request(path,{},binding)).rejects.toMatchObject({status:503,detail:undefined,retryAfterMs:undefined});
  await vi.advanceTimersByTimeAsync(60_000);expect(fetcher).toHaveBeenCalledTimes(1);
 });
});
