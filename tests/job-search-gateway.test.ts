import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const token='synthetic_job_search_token_123456789',jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(k:string)=>jar.has(k)?{value:jar.get(k)}:undefined,set:(k:string,v:string)=>jar.set(k,v)})}));
import {GET,PUT,DELETE} from '../app/api/shida/personal/job-search/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const upstream=vi.fn<typeof fetch>();
const context=(path:string[])=>({params:Promise.resolve({path})});
const request=(method='GET',body?:string,headers:Record<string,string>={},query='')=>new Request('https://nihiloba.com/api/shida/personal/job-search'+query,{method,body,headers:{Origin:'https://nihiloba.com','Content-Type':'application/json','X-Shida-Session':personalSessionBinding(token),...headers}});
beforeEach(()=>{jar.clear();jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubGlobal('fetch',upstream);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');upstream.mockReset().mockImplementation(async()=>Response.json({saved:true}));});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('binds reads and writes to the current account and exact origin',async()=>{
 expect((await GET(request('GET',undefined,{'X-Shida-Session':'old-account'}),context(['saved']))).status).toBe(401);
 expect((await PUT(request('PUT','{"action":"save","enabled":true}',{Origin:'https://evil.invalid'}),context(['jobs','JOB_test']))).status).toBe(403);
 expect(upstream).not.toHaveBeenCalled();
 const response=await PUT(request('PUT','{"action":"save","enabled":true}'),context(['jobs','JOB_test']));
 expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toContain('private, no-store');
 expect(String(upstream.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/employment/job-search/jobs/JOB_test');
 expect(upstream.mock.calls[0][1]).toMatchObject({redirect:'manual',cache:'no-store',method:'PUT'});
});
it('does not forward owner, employer, credential or unknown command injection',async()=>{
 for(const body of ['{"action":"follow","enabled":true,"account_id":4}','{"action":"follow","enabled":true,"employer":"BUS_other"}','{"action":"apply","enabled":true}','{"action":"save","enabled":"yes"}'])expect((await PUT(request('PUT',body),context(['jobs','JOB_test']))).status).toBe(422);
 expect((await GET(request('GET',undefined,{},'?owner=other'),context(['following']))).status).toBe(404);
 expect((await GET(request('GET',undefined,{},'?language=fr&language=en'),context(['following']))).status).toBe(404);
 expect((await PUT(request('PUT','{}'),context(['jobs','..','admin']))).status).toBe(404);
 expect(upstream).not.toHaveBeenCalled();
});
it('allows only bounded paging, the exact opaque removal, and explicit opt-in',async()=>{
 expect((await GET(request('GET',undefined,{},'?language=sw&page=2'),context(['following']))).status).toBe(200);
 expect(String(upstream.mock.calls[0][0])).toContain('following?language=sw&page=2');
 const ref='REL_'+'a'.repeat(64);
 expect((await DELETE(request('DELETE'),context(['relations',ref]))).status).toBe(200);
 expect((await PUT(request('PUT','{"enabled":true}'),context(['relations',ref,'notifications']))).status).toBe(200);
 expect((await DELETE(request('DELETE'),context(['relations','123']))).status).toBe(404);
 expect((await GET(request('GET',undefined,{},'?page=10001'),context(['saved']))).status).toBe(404);
});
it('bounds request bodies and keeps backend errors private',async()=>{
 expect((await PUT(request('PUT','x'.repeat(2049)),context(['alerts']))).status).toBe(413);
 upstream.mockResolvedValueOnce(Response.json({detail:'private history'},{status:409}));
 const response=await PUT(request('PUT','{"action":"save","enabled":true}'),context(['jobs','JOB_test']));
 expect(response.status).toBe(409);expect(await response.text()).not.toContain('private history');
});
