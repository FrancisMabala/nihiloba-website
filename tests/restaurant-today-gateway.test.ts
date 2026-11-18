import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key:string,value:string)=>{if(value)jar.set(key,value);else jar.delete(key);}})}));
import {GET,POST} from '../app/api/shida/personal/restaurants/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const token='synthetic_today_session_123456',fetcher=vi.fn<typeof fetch>();
const context={params:Promise.resolve({path:['RST_test','today-orders']})};
const page={items:[],total:0,as_of:'2026-11-18T12:00:00Z'};
const result={version:1,sections:{pending:page,ready:page,preparing:page}};
function req(headers:Record<string,string>={},query=''){return new Request('https://nihiloba.com/api/shida/personal/restaurants/RST_test/today-orders'+query,{headers:{Origin:'https://nihiloba.com','x-shida-session':personalSessionBinding(token),...headers}});}
beforeEach(()=>{jar.clear();jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');vi.stubGlobal('fetch',fetcher);fetcher.mockReset();fetcher.mockResolvedValue(Response.json(result));});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('forwards only the bound private summary, preserving no-store and cookie authority',async()=>{
 const response=await GET(req(),context);expect(response.status).toBe(200);expect(await response.json()).toEqual(result);
 expect(response.headers.get('cache-control')).toContain('no-store');
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/personal/restaurants/RST_test/today-orders');
 expect((fetcher.mock.calls[0][1]?.headers as Record<string,string>).Cookie).toBe('shida_dashboard_session='+token);
});
it('rejects stale sessions, cross-site calls, caller scope and writes before forwarding',async()=>{
 expect((await GET(req({'x-shida-session':'stale'}),context)).status).toBe(401);
 expect((await GET(req({'sec-fetch-site':'cross-site'}),context)).status).toBe(403);
 expect((await GET(req({},'?account_id=9'),context)).status).toBe(422);
 const write=new Request(req(),{method:'POST'});expect((await POST(write,context)).status).toBe(404);
 expect(fetcher).not.toHaveBeenCalled();
});
it('rejects malformed projections and keeps fallback statuses without private diagnostics',async()=>{
 fetcher.mockResolvedValueOnce(Response.json({version:1,sections:{pending:page}}));expect((await GET(req(),context)).status).toBe(502);
 for(const status of [404,409,503]){
  fetcher.mockResolvedValueOnce(Response.json({detail:'private diagnostic'},{status}));const response=await GET(req(),context);
  expect(response.status).toBe(status);expect(await response.json()).toEqual({detail:'restaurant_unavailable'});
 }
});
it('expires the browser cookie on upstream authentication failure',async()=>{
 fetcher.mockResolvedValueOnce(Response.json({detail:'expired'},{status:401}));expect((await GET(req(),context)).status).toBe(401);
 expect(jar.has(PERSONAL_SESSION_COOKIE)).toBe(false);
});
it('distinguishes unsupported endpoints from protected 404s and preserves bounded recovery metadata',async()=>{
 for(const [status,detail] of [[404,'Not Found'],[405,'Method Not Allowed']] as const){
  fetcher.mockResolvedValueOnce(Response.json({detail},{status}));const response=await GET(req(),context);
  expect(response.status).toBe(status);expect(await response.json()).toEqual({detail:'restaurant_today_unsupported'});
 }
 fetcher.mockResolvedValueOnce(Response.json({detail:'restaurant_unavailable'},{status:404}));
 expect(await (await GET(req(),context)).json()).toEqual({detail:'restaurant_unavailable'});
 fetcher.mockResolvedValueOnce(Response.json({detail:'restaurant_today_limit'},{status:409,headers:{'Retry-After':'30'}}));
 const limit=await GET(req(),context);expect(await limit.json()).toEqual({detail:'restaurant_today_limit'});expect(limit.headers.get('retry-after')).toBe('30');
 fetcher.mockResolvedValueOnce(Response.json({detail:'busy'},{status:429,headers:{'Retry-After':'15'}}));
 const busy=await GET(req(),context);expect(busy.status).toBe(429);expect(busy.headers.get('retry-after')).toBe('15');expect(busy.headers.get('cache-control')).toContain('no-store');
});
