import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key:string,value:string)=>{if(value)jar.set(key,value);else jar.delete(key);}})}));
import {GET,POST,PUT,DELETE} from '../app/api/shida/personal/wenze/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const token='isolated_wenze_session_fixture_12345',fetcher=vi.fn<typeof fetch>();
const context=(path:string)=>({params:Promise.resolve({path:path.split('/')})});
function req(path:string,method='GET',body?:object,headers:Record<string,string>={}){return new Request('https://nihiloba.com/api/shida/personal/wenze/'+path,{method,headers:{Origin:'https://nihiloba.com','X-Shida-Session':personalSessionBinding(token),'Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})});}
beforeEach(()=>{jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');vi.stubGlobal('fetch',fetcher);fetcher.mockReset();fetcher.mockImplementation(async input=>String(input).endsWith('/contexts')?Response.json({contexts:[{type:'organization',public_ref:'BUS_other'},{type:'personal',public_ref:'USR_self'}]}):Response.json({stores:[]}));});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();jar.clear();});
it('derives Personal authority from the authenticated session, never the first context',async()=>{const response=await GET(req('stores'),context('stores'));expect(response.status).toBe(200);expect(String(fetcher.mock.calls[1][0])).toBe('https://backend.test/api/dashboard/wenze/contexts/USR_self/stores');expect(response.headers.get('cache-control')).toContain('private, no-store');expect((fetcher.mock.calls[1][1]?.headers as Record<string,string>).Cookie).toBe('shida_dashboard_session='+token);});
it('allows a bounded catalog category filter and preserves the complete keyed payment snapshot',async()=>{
 const catalog='stores/WNZ_fixture/pos/catalog';
 expect((await GET(req(catalog+'?category=phones_electronics&offset=0&limit=24'),context(catalog))).status).toBe(200);
 expect(String(fetcher.mock.calls[1][0])).toContain('category=phones_electronics');
 expect((await GET(req(catalog+'?category=a&category=b'),context(catalog))).status).toBe(404);
 expect((await GET(req(catalog+'?category='+'a'.repeat(81)),context(catalog))).status).toBe(404);
 expect((await GET(req('stores?category=phones_electronics'),context('stores'))).status).toBe(404);
 const path='stores/WNZ_fixture/pos/checkout',body={lines:[{product_ref:'WNP_fixture',variant_ref:null,quantity:1,unit_sale_price:'15',currency:'USD'}],payment:'seller_recorded_card',payment_details:{provider:'External terminal',reference:'TEST-7'}};
 expect((await POST(req(path,'POST',body,{'Idempotency-Key':'checkout_fixture_123'}),context(path))).status).toBe(200);
 expect(fetcher.mock.calls.at(-1)?.[1]?.body).toBe(JSON.stringify(body));
 expect((fetcher.mock.calls.at(-1)?.[1]?.headers as Record<string,string>)['Idempotency-Key']).toBe('checkout_fixture_123');
});
it.each(['contexts/BUS_other/stores','stores?organization_ref=BUS_other','stores?context=USR_other','stores?limit=1&limit=2','stores/../admin','plans/personal/USR_self'])('rejects authority and unsupported path injection: %s',async path=>{expect((await GET(req(path),context(path.split('?')[0]))).status).toBe(404);expect(fetcher).not.toHaveBeenCalled();});
it('rejects stale bindings and cross-origin writes before any upstream request',async()=>{expect((await GET(req('stores','GET',undefined,{'X-Shida-Session':'stale'}),context('stores'))).status).toBe(401);expect((await POST(req('stores','POST',{}, {Origin:'https://attacker.test'}),context('stores'))).status).toBe(403);expect(fetcher).not.toHaveBeenCalled();});
it('bounds streamed JSON and preserves keyed writes and exact revision',async()=>{const path='stores/WNS_fixture/expenses';expect((await POST(req(path,'POST',{note:'x'.repeat(140000)}),context(path))).status).toBe(413);expect(fetcher).not.toHaveBeenCalled();await POST(req(path,'POST',{amount:'100',currency:'CDF'},{'Idempotency-Key':'stable_fixture_key'}),context(path));expect(fetcher.mock.calls[1][1]?.body).toBe('{"amount":"100","currency":"CDF"}');expect((fetcher.mock.calls[1][1]?.headers as Record<string,string>)['Idempotency-Key']).toBe('stable_fixture_key');});
it('supports private binary downloads without exposing the session',async()=>{fetcher.mockImplementation(async input=>String(input).endsWith('/contexts')?Response.json({contexts:[{type:'personal',public_ref:'USR_self'}]}):new Response('currency,total\nCDF,42',{headers:{'Content-Type':'text/csv','Content-Disposition':'attachment; filename="report.csv"'}}));const path='stores/WNS_fixture/reports/expenses.csv';const response=await GET(req(path),context(path));expect(response.headers.get('content-type')).toContain('text/csv');expect(await response.text()).toContain('CDF,42');expect(response.headers.get('set-cookie')).toBeNull();});
it('clears expired credentials and does not call management routes',async()=>{fetcher.mockResolvedValueOnce(Response.json({}, {status:401}));expect((await GET(req('stores'),context('stores'))).status).toBe(401);expect(jar.size).toBe(0);expect(fetcher).toHaveBeenCalledTimes(1);});
it('supports exact variant costs and report schedule deletion',async()=>{const cost='stores/WNS_fixture/products/WNP_fixture/private-cost';expect((await PUT(req(cost+'?variant_ref=WNV_fixture','PUT',{expected_revision:2,amount:'10',currency:'USD'}),context(cost))).status).toBe(200);const schedules='stores/WNS_fixture/report-schedules';expect((await DELETE(req(schedules+'?frequency=weekly','DELETE',{}),context(schedules))).status).toBe(200);});
it('does not return backend diagnostic text',async()=>{fetcher.mockImplementation(async input=>String(input).endsWith('/contexts')?Response.json({contexts:[{type:'personal',public_ref:'USR_self'}]}):Response.json({detail:'database failed at secret path'}, {status:500}));const response=await GET(req('stores'),context('stores'));expect(await response.json()).toEqual({detail:'service_unavailable'});});

it.each(['stores/WNZ_fixture/labels/pdf','stores/WNZ_fixture/pos/receipts/WRC_fixture/pdf?language=fr&width=58'])('forwards protected PDF bytes and print settings: %s',async path=>{
 fetcher.mockImplementation(async input=>String(input).endsWith('/contexts')?Response.json({contexts:[{type:'personal',public_ref:'USR_self'}]}):new Response('%PDF-1.4 fixture',{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="receipt.pdf"'}}));
 const isPost=path.includes('/labels/'),method=isPost?'POST':'GET';
 const response=await (isPost?POST:GET)(req(path,method,isPost?{items:[{code:'WNP_fixture',copies:2}]}:undefined),context(path.split('?')[0]));
 expect(response.status).toBe(200);expect(response.headers.get('content-type')).toBe('application/pdf');expect(await response.text()).toBe('%PDF-1.4 fixture');
 if(!isPost)expect(String(fetcher.mock.calls[1][0])).toContain('width=58');
});
