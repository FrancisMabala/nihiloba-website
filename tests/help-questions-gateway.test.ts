import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined})}));
import {GET,POST} from '../app/api/shida/personal/support/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const token='isolated_question_session_123456789',fetcher=vi.fn<typeof fetch>();
beforeEach(()=>{jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubGlobal('fetch',fetcher);fetcher.mockReset();fetcher.mockImplementation(async()=>Response.json({questions:[]}));});
afterEach(()=>{vi.unstubAllGlobals();jar.clear();});
function request(path:string,method='GET',extra:Record<string,string>={}){return new Request('https://nihiloba.com/api/shida/personal/support/'+path,{method,headers:{Origin:'https://nihiloba.com','x-shida-session':personalSessionBinding(token),'Content-Type':'application/json',...extra},...(method==='POST'?{body:JSON.stringify({message:'Question',topic:'using_shida',request_id:'test_request_12345',language:'fr'})}:{})});}
it('allows only the bounded question routes and pagination',async()=>{
 const context={params:Promise.resolve({path:['questions']})};
 expect((await GET(request('questions?page=2'),context)).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toContain('/api/dashboard/personal/support/questions?page=2');
 expect((await GET(request('questions?owner=another'),context)).status).toBe(404);
 expect((await POST(request('questions','POST'),context)).status).toBe(200);
 expect((await POST(request('questions/SCT_test/reply','POST'),{params:Promise.resolve({path:['questions','SCT_test','reply']})})).status).toBe(200);
 expect((await GET(request('questions/SCT_test/notes'),{params:Promise.resolve({path:['questions','SCT_test','notes']})})).status).toBe(404);
});
it('keeps session binding, CSRF and private responses on question mutations',async()=>{
 const context={params:Promise.resolve({path:['questions']})};
 expect((await POST(request('questions','POST',{Origin:'https://attacker.invalid'}),context)).status).toBe(403);
 expect((await GET(request('questions','GET',{'x-shida-session':'stale'}),context)).status).toBe(401);
 const result=await GET(request('questions'),context);expect(result.headers.get('cache-control')).toContain('private, no-store');
 jar.clear();expect((await GET(request('questions'),context)).status).toBe(401);
});
it('allows bounded assistance filters and read/reopen actions without extra authority',async()=>{
 const context={params:Promise.resolve({path:[]})};
 expect((await GET(request('?page=2&status=active'),context)).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toContain('status=active');
 for(const query of ['?status=all&status=closed','?page=-1','?status=secret','?account=another'])expect((await GET(request(query),context)).status).toBe(404);
 for(const action of ['read','reopen'])expect((await POST(request('SCT_test/'+action,'POST'),{params:Promise.resolve({path:['SCT_test',action]})})).status).toBe(200);
 expect((await POST(request('SCT_test/assign','POST'),{params:Promise.resolve({path:['SCT_test','assign']})})).status).toBe(404);
});
