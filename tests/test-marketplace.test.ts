import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const {jar,saved}=vi.hoisted(()=>({jar:new Map<string,string>(),saved:vi.fn()}));
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key:string,value:string,options:object)=>{saved(key,value,options);if(value)jar.set(key,value);else jar.delete(key);}}),headers:async()=>new Headers({Origin:'https://nihiloba.com'})}));
vi.mock('../app/services/shida/employment-client',async(importOriginal)=>({...await importOriginal<object>(),getEmploymentSession:vi.fn()}));
import {getEmploymentSession} from '../app/services/shida/employment-client';
import {POST} from '../app/api/shida/test-marketplace/route';
import {TEST_MARKETPLACE_COOKIE as PREVIEW,TEST_MARKETPLACE_MODE as MODE,privateTestPath} from '../app/lib/test-marketplace';
import {testMarketplaceRequest} from '../app/services/shida/test-marketplace-server';
import {PERSONAL_SESSION_COOKIE as SESSION,personalSessionBinding,clearEmploymentToken,setEmploymentToken} from '../app/api/shida/employment/route-utils';
import {cartToken,setCartToken} from '../app/api/shida/cart/route-utils';
import {request as discovery} from '../app/services/shida/public-client';
const token='synthetic-private-test-session-1234';
function req(enabled:unknown,extra:Record<string,string>={}){return new Request('https://nihiloba.com/api/shida/test-marketplace/',{method:'POST',headers:{Origin:'https://nihiloba.com','Content-Type':'application/json','x-shida-session':personalSessionBinding(token),...extra},body:JSON.stringify({enabled})});}
beforeEach(()=>{jar.clear();saved.mockClear();vi.mocked(getEmploymentSession).mockReset();});
afterEach(()=>{vi.unstubAllGlobals();});
describe('explicit private marketplace',()=>{
 it('requires same-origin current Personal binding and Owner-managed test eligibility',async()=>{
  expect((await POST(req(true))).status).toBe(401);
  jar.set(SESSION,token);
  expect((await POST(req(true,{Origin:'https://attacker.test'}))).status).toBe(403);
  expect((await POST(req(true,{'x-shida-session':'old'}))).status).toBe(401);
  vi.mocked(getEmploymentSession).mockResolvedValue({test_data:false} as Awaited<ReturnType<typeof getEmploymentSession>>);
  expect((await POST(req(true))).status).toBe(403);expect(jar.has(PREVIEW)).toBe(false);
  vi.mocked(getEmploymentSession).mockResolvedValue({test_data:true} as Awaited<ReturnType<typeof getEmploymentSession>>);
  const response=await POST(req(true));expect(response.status).toBe(200);
  expect(await response.text()).not.toContain(token);
  expect(saved).toHaveBeenCalledWith(PREVIEW,token,expect.objectContaining({httpOnly:true,sameSite:'strict',path:'/',maxAge:3600}));
  expect(response.headers.get('Cache-Control')).toContain('private');
 });
 it('can leave private mode after session expiry and clears it on logout and account change',async()=>{
  jar.set(PREVIEW,token);jar.set(MODE,'1');expect((await POST(req(false))).status).toBe(200);expect(jar.has(PREVIEW)).toBe(false);
  jar.set(PREVIEW,token);jar.set(MODE,'1');await clearEmploymentToken();expect(jar.has(PREVIEW)).toBe(false);expect(jar.has(MODE)).toBe(false);
  jar.set(PREVIEW,token);await setEmploymentToken('another-canonical-session');expect(jar.has(PREVIEW)).toBe(false);
 });
 it('bounds and validates mode input without changing cookies',async()=>{
  for(const value of ['1',1,null,'x'.repeat(300)])expect((await POST(req(value))).status).toBe(422);
  expect(saved).not.toHaveBeenCalled();
 });
 it('keeps public browsing anonymous; sends private credentials only to reviewed destinations',async()=>{
  const path='/api/public/shida/wenze/products?q=book';
  expect(await testMarketplaceRequest(path)).toEqual({path,headers:{}});
  jar.set(PREVIEW,token);
  expect(await testMarketplaceRequest(path)).toEqual({path:'/api/dashboard/test-marketplace/wenze/products?q=book',headers:{Cookie:`shida_dashboard_session=${token}`}});
  expect(await testMarketplaceRequest('/api/public/shida/jobs')).toEqual({path:'/api/public/shida/jobs',headers:{}});
  expect(privateTestPath('/api/public/shida/hotels-evil')).toBeNull();
  expect((await testMarketplaceRequest('/api/v1/carts',true)).headers).toMatchObject({'X-Shida-Test-Marketplace':'1',Origin:'https://nihiloba.com'});
 });
 it('forwards a signed-in restaurant tester for backend separation even outside private browsing',async()=>{
  jar.set(SESSION,token);
  expect((await testMarketplaceRequest('/api/restaurant-guests/establishments/RST_one/visits',true)).headers).toEqual({Cookie:`shida_dashboard_session=${token}`,Origin:'https://nihiloba.com'});
  expect((await testMarketplaceRequest('/api/public/shida/restaurants')).headers).toEqual({});
 });
 it('never retries a failed private discovery as public and keeps sitemap discovery public',async()=>{
  jar.set(PREVIEW,token);const fetcher=vi.fn<typeof fetch>(async()=>Response.json({detail:'forbidden'},{status:403}));vi.stubGlobal('fetch',fetcher);
  await expect(discovery('/api/public/shida/hotels',false)).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][1]).toMatchObject({cache:'no-store',redirect:'error'});
  fetcher.mockResolvedValue(Response.json({items:[]}));await discovery('/api/public/shida/hotels',false,undefined,'public');
  expect(String(fetcher.mock.calls[1][0])).toContain('/api/public/shida/hotels');expect(fetcher.mock.calls[1][1]?.headers).toEqual({});
 });
 it('keeps the normal cart separate when entering and leaving private mode',async()=>{
  jar.set('nihiloba_shida_cart','public-cart');expect(await cartToken()).toBe('public-cart');
  jar.set(PREVIEW,token);expect(await cartToken()).toBeNull();await setCartToken('private-cart');expect(await cartToken()).toBe('private-cart');
  jar.delete(PREVIEW);expect(await cartToken()).toBe('public-cart');
 });
});
