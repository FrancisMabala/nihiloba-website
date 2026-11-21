import {beforeEach,expect,it,vi} from 'vitest';
const jar=new Map<string,string>();
const set=vi.fn((key:string,value:string)=>jar.set(key,value));
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set})}));
import {GET,POST} from '../app/api/shida/personal/auth/whatsapp/[[...path]]/route';
const ref='DWC_resume_fixture',verifier='v'.repeat(43);
const context=(path=['registration','resume'])=>({params:Promise.resolve({path})});
const request=(method='GET',origin='https://nihiloba.com',query='')=>new Request(`https://nihiloba.com/api/shida/personal/auth/whatsapp/registration/resume/${query}`,{method,headers:{origin}});
let expires:string;
beforeEach(()=>{vi.unstubAllGlobals();jar.clear();set.mockClear();expires=new Date(Date.now()+240000).toISOString();jar.set('nihiloba_personal_challenge',`${ref}.${Date.parse(expires)}.${verifier}`);});
it.each(['pending','verified'])('restores only bound %s state without issuing credentials',async status=>{
 const fetcher=vi.fn(async()=>Response.json({status,challenge_ref:ref,expires_at:expires,language:'fr',phone:'private',code:'private',whatsapp_url:'private'},{headers:{'set-cookie':`shida_dashboard_session=${'s'.repeat(43)}`}}));vi.stubGlobal('fetch',fetcher);
 const response=await GET(request(),context());
 expect(response.status).toBe(200);expect(await response.json()).toEqual({status,challenge_ref:ref,expires_at:expires,language:'fr'});
 expect(response.headers.get('cache-control')).toContain('private, no-store');expect(set).not.toHaveBeenCalled();
 expect(fetcher).toHaveBeenCalledWith(`https://api.nihiloba.com/api/dashboard/registration/challenge/${ref}/resume`,expect.objectContaining({method:'GET',headers:expect.objectContaining({Cookie:`shida_dashboard_challenge=${verifier}`})}));
});
it('rejects non-registration, mutation, query identity and hostile origin',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 expect((await GET(request(),context(['resume']))).status).toBe(404);
 expect((await POST(request('POST'),context())).status).toBe(404);
 expect((await GET(request('GET','https://nihiloba.com','?challenge_ref=other'),context())).status).toBe(404);
 expect((await GET(request('GET','https://evil.example'),context())).status).toBe(403);
 expect(fetcher).not.toHaveBeenCalled();
});
it.each(['','bad.9999999999999.secret',`${ref}.1.${verifier}`])('does not send absent or invalid binding %s',async binding=>{
 jar.set('nihiloba_personal_challenge',binding);const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 expect((await GET(request(),context())).status).toBe(404);expect(fetcher).not.toHaveBeenCalled();expect(set).not.toHaveBeenCalled();
});
it.each([{status:'consumed'},{challenge_ref:'DWC_other_fixture'},{expires_at:'invalid'},{expires_at:new Date(1).toISOString()},{expires_at:'2099-01-01T00:00:00Z'},{language:'xx'}])('rejects inconsistent upstream state %j',async change=>{
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({status:'verified',challenge_ref:ref,expires_at:expires,language:'fr',...change})));
 expect((await GET(request(),context())).status).toBe(503);expect(set).not.toHaveBeenCalled();
});
it.each([404,429,503])('preserves failure %s without extending the binding',async status=>{
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({detail:'unavailable'},{status})));
 expect((await GET(request(),context())).status).toBe(status);expect(set).not.toHaveBeenCalled();
});
