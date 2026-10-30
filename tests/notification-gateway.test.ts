import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const token='isolated_notification_session_123456';
const jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined})}));
import {GET,POST,PUT} from '../app/api/shida/personal/notifications/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const upstream=vi.fn<typeof fetch>();
const context=(path='')=>({params:Promise.resolve({path:path?path.split('/'):[]})});
const request=(path='',method='GET',headers:Record<string,string>={},body='{}')=>new Request('https://nihiloba.com/api/shida/personal/notifications/'+path,{method,headers:{Origin:'https://nihiloba.com','X-Shida-Session':personalSessionBinding(token),'Content-Type':'application/json',...headers},...(method==='GET'?{}:{body})});
beforeEach(()=>{jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');vi.stubGlobal('fetch',upstream);upstream.mockReset().mockImplementation(async()=>Response.json({items:[],next_cursor:null}));});
afterEach(()=>{jar.clear();vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('requires the current session binding, same-site requests and valid operations',async()=>{
 expect((await GET(request('count','GET',{'X-Shida-Session':'old'}),context('count'))).status).toBe(401);
 expect((await POST(request('actions','POST',{Origin:'https://foreign.test'}),context('actions'))).status).toBe(403);
 expect((await GET(request('?context_ref=BUS_other'),context())).status).toBe(404);
 expect((await GET(request('?limit=10&limit=20'),context())).status).toBe(404);
 expect((await POST(request('NTF_test/delete','POST'),context('NTF_test/delete'))).status).toBe(404);
 expect(upstream).not.toHaveBeenCalled();
});
it('forwards the fixed context, bounded query and private session cookie',async()=>{
 const response=await GET(request('?language=sw&mode=unread'),context());
 expect(response.headers.get('cache-control')).toContain('no-store');
 expect(String(upstream.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/notifications/personal?language=sw&mode=unread');
 expect(upstream.mock.calls[0][1]?.redirect).toBe('manual');
 expect((upstream.mock.calls[0][1]?.headers as Record<string,string>).Cookie).toBe('shida_dashboard_session='+token);
});
it('bounds writes and redacts upstream errors',async()=>{
 expect((await PUT(request('preferences','PUT',{},'x'.repeat(21000)),context('preferences'))).status).toBe(413);
 upstream.mockResolvedValue(Response.json({detail:'private backend data'},{status:403}));
 const response=await POST(request('NTF_test/handoff','POST'),context('NTF_test/handoff'));
 expect(response.status).toBe(403);expect(await response.text()).not.toContain('private backend data');
});

it('uses the canonical personal delivery-preference endpoints for reads and writes',async()=>{
 await GET(request('delivery-preferences'),context('delivery-preferences'));
 expect(String(upstream.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/notifications/personal/delivery-preferences');
 const body=JSON.stringify({mode:'daily',daily_time:'08:30',timezone_name:'Africa/Kinshasa'});
 expect((await PUT(request('delivery-preferences','PUT',{},body),context('delivery-preferences'))).status).toBe(200);
 expect(upstream.mock.calls[1][1]?.body).toBe(body);
 expect((await PUT(request('delivery-preferences','PUT',{'X-Shida-Session':'old'},body),context('delivery-preferences'))).status).toBe(401);
});
