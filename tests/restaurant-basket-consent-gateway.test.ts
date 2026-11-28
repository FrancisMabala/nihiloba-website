import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const token='isolated_consent_session_not_real_12345',jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set:vi.fn()})}));
import {POST} from '../app/api/shida/personal/restaurant-orders/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const fetcher=vi.fn<typeof fetch>();
const context=(path='baskets')=>({params:Promise.resolve({path:path.split('/')})});
const request=(headers:Record<string,string>={})=>new Request('https://nihiloba.com/api/shida/personal/restaurant-orders/baskets/',{method:'POST',headers:{Origin:'https://nihiloba.com','Content-Type':'application/json','X-Shida-Session':personalSessionBinding(token),...headers},body:JSON.stringify({establishment_ref:'RST_fixture',operation_key:'same-retry-key'})});
beforeEach(()=>{jar.clear();jar.set(PERSONAL_SESSION_COOKIE,token);fetcher.mockReset().mockImplementation(async()=>Response.json({basket_ref:'RBA_fixture'}));vi.stubGlobal('fetch',fetcher);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it.each<Record<string,string>>([{}, {'X-Shida-Statistics-Consent':'true'}, {'X-Shida-Statistics-Consent':'web-statistics-v2'}, {'X-Shida-Statistics-Consent':'web-statistics-v1',DNT:'1'}, {'X-Shida-Statistics-Consent':'web-statistics-v1','Sec-GPC':'1'}])('creates baskets with optional statistics off for %j',async headers=>{
 const response=await POST(request(headers),context());expect(response.status).toBe(200);expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty('X-Shida-Statistics-Consent');expect(response.headers.get('cache-control')).toContain('private, no-store');
});
it('forwards only the versioned opt-in and preserves session, origin, body and caching controls',async()=>{
 const req=request({'X-Shida-Statistics-Consent':'web-statistics-v1'}),body=await req.clone().text();
 expect((await POST(req,context())).status).toBe(200);
 expect(fetcher.mock.calls[0][1]).toMatchObject({body,cache:'no-store',redirect:'manual',headers:{'X-Shida-Statistics-Consent':'web-statistics-v1',Origin:'https://nihiloba.com',Cookie:`shida_dashboard_session=${token}`}});
});
it.each(['DNT','Sec-GPC'])('retains a privacy veto in combined %s values',async header=>{
 await POST(request({'X-Shida-Statistics-Consent':'web-statistics-v1',[header]:'0, 1'}),context());
 expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty('X-Shida-Statistics-Consent');
 expect(fetcher.mock.calls[0][1]?.headers).toHaveProperty(header,'1');
});
it('does not forward the optional header to unrelated order operations',async()=>{
 await POST(request({'X-Shida-Statistics-Consent':'web-statistics-v1'}),context('baskets/RBA_fixture/quote'));
 expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty('X-Shida-Statistics-Consent');
});
it('does not let consent bypass authentication or exact-origin checks',async()=>{
 expect((await POST(request({'X-Shida-Statistics-Consent':'web-statistics-v1','X-Shida-Session':'wrong'}),context())).status).toBe(401);
 expect((await POST(request({'X-Shida-Statistics-Consent':'web-statistics-v1',Origin:'https://other.test'}),context())).status).toBe(403);
 jar.clear();expect((await POST(request({'X-Shida-Statistics-Consent':'web-statistics-v1'}),context())).status).toBe(401);expect(fetcher).not.toHaveBeenCalled();
});
