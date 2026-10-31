import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined})}));
import {POST} from '../app/api/shida/personal/support/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const token='isolated_support_session_fixture_12345',fetcher=vi.fn<typeof fetch>();
const context={params:Promise.resolve({path:['shop-report']})};
function req(headers:Record<string,string>={},body:object={shop_ref:'WNZ_test',reason:'fraud',message:'Test'}){return new Request('https://nihiloba.com/api/shida/personal/support/shop-report',{method:'POST',headers:{Origin:'https://nihiloba.com','X-Shida-Session':personalSessionBinding(token),'Content-Type':'application/json',...headers},body:JSON.stringify(body)});}
beforeEach(()=>{jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubGlobal('fetch',fetcher);fetcher.mockReset();fetcher.mockResolvedValue(Response.json({reference:'SCT_test',status:'persisted'}));});
afterEach(()=>{vi.unstubAllGlobals();jar.clear();});
it('uses the existing support route and private cookie authority',async()=>{const response=await POST(req(),context);expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('private, no-store');expect(String(fetcher.mock.calls[0][0])).toContain('/api/dashboard/personal/support/shop-report');expect((fetcher.mock.calls[0][1]?.headers as Record<string,string>).Cookie).toBe('shida_dashboard_session='+token);});
it('rejects guests, switched sessions and cross-site writes',async()=>{expect((await POST(req({'X-Shida-Session':'old'}),context)).status).toBe(401);expect((await POST(req({Origin:'https://attacker.test'}),context)).status).toBe(403);jar.clear();expect((await POST(req(),context)).status).toBe(401);expect(fetcher).not.toHaveBeenCalled();});
it('bounds payloads and suppresses private upstream diagnostics',async()=>{expect((await POST(req({}, {message:'x'.repeat(21000)}),context)).status).toBe(413);fetcher.mockResolvedValue(Response.json({detail:'private database detail'},{status:500}));expect(await (await POST(req(),context)).text()).not.toContain('database');});
