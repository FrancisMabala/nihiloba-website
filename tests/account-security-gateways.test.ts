import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const jar=new Map<string,string>(), saved=vi.fn();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key:string,value:string,options:object)=>{saved(key,value,options);if(value)jar.set(key,value);else jar.delete(key);}})}));
import {GET,POST} from '../app/api/shida/personal/security/[[...path]]/route';
import {POST as recovery} from '../app/api/shida/recovery/[[...path]]/route';
import {GET as supportGet,POST as supportPost} from '../app/api/shida/personal/support/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const token='synthetic_security_session_12345',fetcher=vi.fn<typeof fetch>();
const context=(path:string)=>({params:Promise.resolve({path:path?path.split('/'):[]})});
function req(path:string,method='POST',body:object={},headers:Record<string,string>={}){return new Request('https://nihiloba.com/api/shida/'+path,{method,headers:{Origin:'https://nihiloba.com','x-shida-session':personalSessionBinding(token),'Content-Type':'application/json',...headers},...(method==='POST'?{body:JSON.stringify(body)}:{})});}
beforeEach(()=>{jar.clear();jar.set(PERSONAL_SESSION_COOKIE,token);saved.mockReset();vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');vi.stubGlobal('fetch',fetcher);fetcher.mockReset();fetcher.mockResolvedValue(Response.json({saved:true}));});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it.each(['','profile','phone','recovery','navigation'])('forwards canonical browser origin on production loopback account read: %s',async path=>{
 vi.stubEnv('NODE_ENV','production');
 const request=new Request(`http://localhost:10000/api/shida/personal/security/${path}`,{headers:{'sec-fetch-site':'same-origin','x-shida-session':personalSessionBinding(token)}});
 expect((await GET(request,context(path))).status).toBe(200);
 expect((fetcher.mock.calls[0][1]?.headers as Record<string,string>).Origin).toBe('https://nihiloba.com');
});
it.each(['passkeys/register/options','passkeys/register/verify','passkeys/verify/options','passkeys/verify/finish','email/start','email/verify','email/proof/start','email/proof/verify','phone/start','phone/verify','phone/cancel','phone/complete','delete','sessions/revoke','profile','recovery/set','recovery/remove','recovery/phone/start','recovery/phone/verify'])('proxies only allowed security actions with private server-side identity: %s',async path=>{
 const result=await POST(req('personal/security/'+path),context(path));expect(result.status).toBe(200);expect(result.headers.get('cache-control')).toContain('no-store');expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/personal/security/'+path);expect((fetcher.mock.calls[0][1]?.headers as Record<string,string>).Cookie).toBe('shida_dashboard_session='+token);
});
it('rejects cross-origin, missing-origin and stale browser requests before forwarding',async()=>{
 expect((await POST(req('personal/security/delete','POST',{}, {Origin:'https://other.test'}),context('delete'))).status).toBe(403);
 const missing=req('personal/security/delete');missing.headers.delete('Origin');expect((await POST(missing,context('delete'))).status).toBe(403);
 expect((await GET(req('personal/security','GET',{}, {'x-shida-session':'stale'}),context(''))).status).toBe(401);expect(fetcher).not.toHaveBeenCalled();
});
it('bounds bodies and blocks arbitrary backend routes and query injection',async()=>{
 expect((await POST(req('personal/security/delete','POST',{value:'x'.repeat(20001)}),context('delete'))).status).toBe(413);
 expect((await POST(req('personal/security/admin'),context('../admin'))).status).toBe(404);
 expect((await GET(req('personal/security?account_id=2','GET'),context(''))).status).toBe(404);expect(fetcher).not.toHaveBeenCalled();
});
it('preserves the setup proof requirement without exposing backend diagnostics',async()=>{
 fetcher.mockResolvedValueOnce(Response.json({detail:'security_verification_required'},{status:403}));expect(await (await POST(req('personal/security/email/start'),context('email/start'))).json()).toEqual({detail:'security_verification_required'});
 fetcher.mockResolvedValueOnce(Response.json({detail:'private database diagnostic'},{status:500}));expect(await (await GET(req('personal/security','GET'),context(''))).json()).toEqual({detail:'security_unavailable'});
});
it('stores recovery authority only in a secure HttpOnly cookie and ignores client-supplied authority',async()=>{
 jar.clear();const secret='synthetic_recovery_browser_secret_123456';fetcher.mockResolvedValueOnce(Response.json({reference:'REC_fixture',browser_token:secret}));
 const start=await recovery(req('recovery','POST',{phone:'243800000000',email:'synthetic@example.test',message:'Synthetic report'}),context(''));
 expect(await start.json()).toEqual({reference:'REC_fixture'});expect(saved).toHaveBeenCalledWith('__Host-shida-recovery','REC_fixture.'+secret,expect.objectContaining({httpOnly:true,secure:true,sameSite:'strict',path:'/'}));
 await recovery(req('recovery/verify','POST',{reference:'REC_attack',browser_token:'attacker',code:'12345678'}),context('verify'));
 expect(JSON.parse(fetcher.mock.calls[1][1]?.body as string)).toEqual({reference:'REC_fixture',browser_token:secret,code:'12345678'});
 jar.clear();expect((await recovery(req('recovery/status'),context('status'))).status).toBe(401);
});
it('support shares the authenticated account session and rejects arbitrary ticket routes',async()=>{
 expect((await supportPost(req('personal/support','POST',{category:'other',message:'Synthetic ticket'}),context(''))).status).toBe(200);
 expect((await supportGet(req('personal/support/admin','GET'),context('admin'))).status).toBe(404);
 jar.clear();expect((await supportGet(req('personal/support','GET'),context(''))).status).toBe(401);
});
