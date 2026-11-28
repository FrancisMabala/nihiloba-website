import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({consent:'unknown'}));
vi.mock('../app/lib/website-statistics-consent',()=>({STATISTICS_POLICY:'web-statistics-v1',websiteStatistics:()=>({consent:()=>state.consent})}));
import {request} from '../app/lib/restaurant-seller-browser';
const fetcher=vi.fn<typeof fetch>();
beforeEach(()=>{state.consent='unknown';fetcher.mockReset().mockImplementation(async()=>Response.json({basket_ref:'RBA_fixture'}));vi.stubGlobal('fetch',fetcher);});
afterEach(()=>vi.unstubAllGlobals());
it.each(['unknown','declined','blocked'])('creates the requested basket without optional interest permission when %s',async consent=>{
 state.consent=consent;
 expect(await request('personal/restaurant-orders/baskets',{method:'POST',body:'{}'},'binding')).toEqual({basket_ref:'RBA_fixture'});
 expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty('X-Shida-Statistics-Consent');
 expect(fetcher.mock.calls[0][1]).toMatchObject({credentials:'same-origin',cache:'no-store',headers:{'X-Shida-Session':'binding'}});
});
it('samples the current choice for each dispatch, including a retry after withdrawal',async()=>{
 const init={method:'POST',body:JSON.stringify({operation_key:'same-retry-key'})};
 state.consent='accepted';await request('personal/restaurant-orders/baskets/',init,'binding');
 expect(fetcher.mock.calls[0][1]?.headers).toHaveProperty('X-Shida-Statistics-Consent','web-statistics-v1');
 state.consent='declined';await request('personal/restaurant-orders/baskets/',init,'binding');
 expect(fetcher.mock.calls[1][1]?.headers).not.toHaveProperty('X-Shida-Statistics-Consent');
 expect(fetcher.mock.calls[1][1]?.body).toBe(fetcher.mock.calls[0][1]?.body);
});
it.each([['GET','personal/restaurant-orders/baskets'],['POST','personal/restaurant-orders/baskets/RBA_fixture/quote'],['POST','businesses/BUS_fixture/restaurants/RST_fixture/counter-baskets']])('never adds basket interest permission to %s %s',async(method,path)=>{
 state.consent='accepted';await request(path,{method},'binding');expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty('X-Shida-Statistics-Consent');
});
