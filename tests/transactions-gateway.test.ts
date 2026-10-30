import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined})}));
import {GET} from '../app/api/shida/personal/transactions/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const token='synthetic_transactions_session_only',fetcher=vi.fn<typeof fetch>();
function request(query='',headers:Record<string,string>={}){return new Request('https://nihiloba.com/api/shida/personal/transactions/'+query,{headers:{Origin:'https://nihiloba.com','sec-fetch-site':'same-origin','x-shida-session':personalSessionBinding(token),...headers}});}
beforeEach(()=>{jar.clear();jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');vi.stubGlobal('fetch',fetcher);fetcher.mockReset();fetcher.mockResolvedValue(Response.json({counts:{all:0,orders:0,requests:0,documents:0},items:[]}));});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('forwards only the bound Personal session and keeps responses private',async()=>{
 const response=await GET(request('?category=orders&page=2'));
 expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('no-store');
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/personal/transactions?category=orders&page=2');
 expect(fetcher.mock.calls[0][1]).toMatchObject({redirect:'manual',cache:'no-store',headers:{Cookie:`shida_dashboard_session=${token}`}});
});
it.each(['?actor_account_id=1','?business_id=1','?page=0','?page_size=100','?sort=price','?category=orders&category=requests'])('rejects unsupported scope/query %s',async query=>{expect((await GET(request(query))).status).toBe(422);expect(fetcher).not.toHaveBeenCalled();});
it('rejects signed out, stale-tab and cross-site calls',async()=>{
 expect((await GET(request('',{'x-shida-session':'old'}))).status).toBe(401);
 expect((await GET(request('',{'sec-fetch-site':'cross-site'}))).status).toBe(403);
 jar.clear();expect((await GET(request())).status).toBe(401);expect(fetcher).not.toHaveBeenCalled();
});
it('does not expose backend diagnostics or follow redirects',async()=>{
 fetcher.mockResolvedValueOnce(Response.json({detail:'private diagnostic'},{status:500}));
 expect(await (await GET(request())).json()).toEqual({detail:'transactions_unavailable'});
 fetcher.mockResolvedValueOnce(new Response(null,{status:307,headers:{Location:'https://other.test'}}));expect((await GET(request())).status).toBe(502);
});
