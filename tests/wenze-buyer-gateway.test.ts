import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key:string,value:string)=>{if(value)jar.set(key,value);else jar.delete(key);}})}));
import {GET,PUT,POST} from '../app/api/shida/personal/wenze-buyer/[[...path]]/route';
import {GET as publicReviews} from '../app/api/shida/wenze-reviews/[store]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const token='isolated_buyer_session_fixture_12345',fetcher=vi.fn<typeof fetch>();
const context=(path:string)=>({params:Promise.resolve({path:path.split('/')})});
function req(path:string,method='GET',body?:object,headers:Record<string,string>={}){return new Request('https://nihiloba.com/api/shida/personal/wenze-buyer/'+path,{method,headers:{Origin:'https://nihiloba.com','X-Shida-Session':personalSessionBinding(token),'Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})});}
beforeEach(()=>{jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');vi.stubGlobal('fetch',fetcher);fetcher.mockReset();fetcher.mockResolvedValue(Response.json({saved:true}));});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();jar.clear();});
it('forwards bounded order pagination without buyer identity parameters',async()=>{
 const response=await GET(req('orders?offset=20&limit=20'),context('orders'));
 expect(response.status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/personal/wenze-buyer/orders?offset=20&limit=20');
});
it('allows only read-only order updates and explicit read markers',async()=>{
 fetcher.mockImplementation(async()=>Response.json({updates:[],unread_count:0}));
 expect((await GET(req('orders/SO_fixture/updates'),context('orders/SO_fixture/updates'))).status).toBe(200);
 expect((await POST(req('orders/SO_fixture/updates/read','POST',{}),context('orders/SO_fixture/updates/read'))).status).toBe(200);
 expect((await POST(req('orders/SO_fixture/updates/send','POST',{body:'unsupported'}),context('orders/SO_fixture/updates/send'))).status).toBe(404);
 expect((await GET(req('orders/SO_fixture/updates?buyer_id=1'),context('orders/SO_fixture/updates'))).status).toBe(404);
});
it.each(['orders?user_id=1','orders?limit=51','orders?offset=-1','orders?limit=1&limit=2'])('rejects invalid order query %s',async path=>{
 expect((await GET(req(path),context('orders'))).status).toBe(404);
 expect(fetcher).not.toHaveBeenCalled();
});
it('forwards only cookie authority to the exact buyer target',async()=>{const path='relations/wenze_product/WNP_fixture';const result=await PUT(req(path,'PUT',{relation:'saved',enabled:true}),context(path));expect(result.status).toBe(200);expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/personal/wenze-buyer/'+path);expect(result.headers.get('cache-control')).toContain('private, no-store');expect((fetcher.mock.calls[0][1]?.headers as Record<string,string>).Cookie).toBe('shida_dashboard_session='+token);});
it.each(['saved?user_id=123','relations/restaurant/RST_fixture','stores/WNZ_fixture/reviews/RVW_fixture/moderate','stores/../admin'])('rejects authority injection and unsupported paths: %s',async path=>{expect((await GET(req(path),context(path.split('?')[0]))).status).toBe(404);expect(fetcher).not.toHaveBeenCalled();});
it('rejects cross-site requests and stale session bindings',async()=>{expect((await GET(req('saved','GET',undefined,{'X-Shida-Session':'old'}),context('saved'))).status).toBe(401);const path='stores/WNZ_fixture/review';expect((await PUT(req(path,'PUT',{}, {Origin:'https://attacker.test'}),context(path))).status).toBe(403);expect((await GET(req('saved','GET',undefined,{'sec-fetch-site':'cross-site'}),context('saved'))).status).toBe(403);expect(fetcher).not.toHaveBeenCalled();});
it('bounds bodies and hides upstream diagnostic errors',async()=>{const path='stores/WNZ_fixture/review';expect((await PUT(req(path,'PUT',{comment:'x'.repeat(17000)}),context(path))).status).toBe(413);fetcher.mockResolvedValue(Response.json({detail:'private database path'},{status:500}));const response=await POST(req(path+'/withdraw','POST',{expected_revision:2}),context(path+'/withdraw'));expect(response.status).toBe(500);expect(await response.text()).not.toContain('database');});
it('clears expired cookies',async()=>{fetcher.mockResolvedValue(Response.json({},{status:401}));expect((await GET(req('saved'),context('saved'))).status).toBe(401);expect(jar.size).toBe(0);});
it('public reviews never forward buyer credentials and validate pagination',async()=>{const ctx={params:Promise.resolve({store:'WNZ_fixture'})};await publicReviews(new Request('https://nihiloba.com/api/shida/wenze-reviews/WNZ_fixture?page=2',{headers:{Cookie:'private=secret'}}),ctx);expect(fetcher.mock.calls[0][1]?.headers).toBeUndefined();expect(String(fetcher.mock.calls[0][0])).toContain('/api/public/shida/wenze/stores/WNZ_fixture/reviews?page=2');expect((await publicReviews(new Request('https://nihiloba.com/api/shida/wenze-reviews/WNZ_fixture?page=1&page=2'),ctx)).status).toBe(400);});
