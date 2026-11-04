import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const token='candidate_test_token_not_real_12345',jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(k:string)=>jar.has(k)?{value:jar.get(k)}:undefined,set:(k:string,v:string)=>jar.set(k,v)})}));
import {GET,POST} from '../app/api/shida/personal/candidate/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const upstream=vi.fn<typeof fetch>();
const context=(path:string[]=[])=>({params:Promise.resolve({path})});
const request=(method='GET',body?:string,headers:Record<string,string>={},query='')=>new Request('https://nihiloba.com/api/shida/personal/candidate'+query,{method,body,headers:{Origin:'https://nihiloba.com','Content-Type':'application/json','X-Shida-Session':personalSessionBinding(token),...headers}});
beforeEach(()=>{jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubGlobal('fetch',upstream);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');upstream.mockReset().mockResolvedValue(Response.json({profiles:[]}));});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('requires the bound account and an allowed origin before forwarding',async()=>{
 expect((await GET(request('GET',undefined,{'X-Shida-Session':'wrong'}),context())).status).toBe(401);
 expect((await POST(request('POST','{}',{Origin:'https://evil.test'}),context())).status).toBe(403);
 expect(upstream).not.toHaveBeenCalled();
 const response=await GET(request('GET',undefined,{},'?language=ln'),context());expect(response.status).toBe(200);
 expect(response.headers.get('Cache-Control')).toContain('private, no-store');
 expect(String(upstream.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/employment/candidate-onboarding?language=ln');
 expect(upstream.mock.calls[0][1]?.redirect).toBe('manual');
});
it('rejects scope injection, unknown paths, oversized bodies and non-PDF uploads',async()=>{
 expect((await GET(request('GET',undefined,{},'?owner=someone'),context())).status).toBe(404);
 expect((await POST(request('POST','{}'),context(['publish']))).status).toBe(404);
 expect((await POST(request('POST','{}',{'Content-Length':'40001'}),context())).status).toBe(413);
 expect((await POST(request('POST','{}'),context(['document']))).status).toBe(415);
 expect(upstream).not.toHaveBeenCalled();
});
it('retains stale revision errors without reflecting private backend details',async()=>{
 upstream.mockResolvedValueOnce(Response.json({detail:'private candidate content'},{status:409}));
 const response=await POST(request('POST','{"action":"save","revision":1}'),context());
 expect(response.status).toBe(409);expect(await response.text()).not.toContain('private candidate content');
});
