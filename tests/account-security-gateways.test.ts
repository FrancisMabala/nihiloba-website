import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const jar=new Map<string,string>(), saved=vi.fn();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key:string,value:string,options:object)=>{saved(key,value,options);if(value)jar.set(key,value);else jar.delete(key);}})}));
import {GET,POST} from '../app/api/shida/personal/security/[[...path]]/route';
import {GET as deletionStatus} from '../app/api/shida/personal/deletion/route';
import {GET as reviewGet, POST as reviewPost} from '../app/api/shida/personal/deletion-review/[[...path]]/route';
import {POST as recovery} from '../app/api/shida/recovery/[[...path]]/route';
import {GET as supportGet,POST as supportPost} from '../app/api/shida/personal/support/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const token='synthetic_security_session_12345',fetcher=vi.fn<typeof fetch>();
const context=(path:string)=>({params:Promise.resolve({path:path?path.split('/'):[]})});
function req(path:string,method='POST',body:object={},headers:Record<string,string>={}){return new Request('https://nihiloba.com/api/shida/'+path,{method,headers:{Origin:'https://nihiloba.com','x-shida-session':personalSessionBinding(token),'Content-Type':'application/json',...headers},...(method==='POST'?{body:JSON.stringify(body)}:{})});}
beforeEach(()=>{jar.clear();jar.set(PERSONAL_SESSION_COOKIE,token);saved.mockReset();vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');vi.stubGlobal('fetch',fetcher);fetcher.mockReset();fetcher.mockResolvedValue(Response.json({saved:true}));});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it.each(['','profile','phone','recovery','navigation','sessions'])('forwards canonical browser origin on production loopback account read: %s',async path=>{
 vi.stubEnv('NODE_ENV','production');
 const request=new Request(`http://localhost:10000/api/shida/personal/security/${path}`,{headers:{'sec-fetch-site':'same-origin','x-shida-session':personalSessionBinding(token)}});
 expect((await GET(request,context(path))).status).toBe(200);
 expect((fetcher.mock.calls[0][1]?.headers as Record<string,string>).Origin).toBe('https://nihiloba.com');
});
it.each(['passkeys/revoke','passkeys/register/options','passkeys/register/verify','passkeys/verify/options','passkeys/verify/finish','email/start','email/verify','login-email/start','login-email/verify','email/proof/start','email/proof/verify','phone/start','phone/verify','phone/cancel','phone/complete','delete','sessions/revoke','sessions/revoke-one','profile','recovery/set','recovery/remove','recovery/phone/start','recovery/phone/verify'])('proxies only allowed security actions with private server-side identity: %s',async path=>{
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
it('keeps deletion requests and withdrawal within the bound personal security API',async()=>{
 for(const path of ['delete/reviews','delete/reviews/cancel']) {
  fetcher.mockResolvedValueOnce(Response.json({saved:true}));
  expect((await POST(req('personal/security/'+path),context(path))).status).toBe(200);
 }
 fetcher.mockResolvedValueOnce(Response.json({requests:[]}));
 expect((await GET(req('personal/security/delete/reviews','GET'),context('delete/reviews'))).status).toBe(200);
});
it('restricts administrator deletion review routes and hides backend diagnostics',async()=>{
 expect((await reviewGet(req('personal/deletion-review','GET'),context(''))).status).toBe(200);
 expect((await reviewGet(req('personal/deletion-review/SCT_fixture','GET'),context('SCT_fixture'))).status).toBe(404);
 expect((await reviewPost(req('personal/deletion-review/SCT_fixture','POST',{}, {Origin:'https://other.test'}),context('SCT_fixture'))).status).toBe(403);
 expect((await reviewPost(req('personal/deletion-review/admin'),context('../admin'))).status).toBe(404);
 fetcher.mockResolvedValueOnce(Response.json({detail:'private database diagnostic'},{status:403}));
 const response=await reviewPost(req('personal/deletion-review/SCT_fixture'),context('SCT_fixture'));
 expect(response.status).toBe(403);expect(response.headers.get('cache-control')).toContain('no-store');
 expect(await response.json()).toEqual({detail:'support_unavailable'});
 jar.clear();expect((await reviewGet(req('personal/deletion-review','GET'),context(''))).status).toBe(401);
});

it.each(['passkeys/verify/finish','login-email/start','login-email/verify'])('preserves safe retry timing for %s',async path=>{
 fetcher.mockResolvedValueOnce(Response.json({detail:'private rate diagnostic'},{status:429,headers:{'Retry-After':'61'}}));
 const response=await POST(req('personal/security/'+path),context(path));
 expect(response.status).toBe(429);expect(response.headers.get('Retry-After')).toBe('61');
 expect(response.headers.get('cache-control')).toContain('no-store');
 expect(await response.json()).toEqual({detail:'security_rate_limited',retry_after:61});
});
it.each(['0','-1','invalid','999999999'])('does not invent a deadline from invalid retry timing %s',async timing=>{
 fetcher.mockResolvedValueOnce(Response.json({detail:'private diagnostic'},{status:429,headers:{'Retry-After':timing}}));
 const response=await POST(req('personal/security/login-email/start'),context('login-email/start'));
 expect(response.headers.get('Retry-After')).toBeNull();
 expect(await response.json()).toEqual({detail:'security_rate_limited',retry_after:null});
});
it('distinguishes email delivery failure from retry limits',async()=>{
 fetcher.mockResolvedValueOnce(Response.json({detail:'security_email_delivery_unavailable'},{status:503}));
 const response=await POST(req('personal/security/login-email/start'),context('login-email/start'));
 expect(response.status).toBe(503);expect(response.headers.get('Retry-After')).toBeNull();
 expect(await response.json()).toEqual({detail:'security_email_delivery_unavailable'});
});

it('reads restricted deletion status without exposing its session credential',async()=>{
 const deletion={reference:'DEL_fixture',scheduled_at:'2026-12-06T15:00:00Z',can_cancel:true,status:'scheduled'};
 fetcher.mockResolvedValueOnce(Response.json({deletion}));
 const response=await deletionStatus(req('personal/deletion','GET'));
 expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('no-store');
 expect(await response.json()).toEqual({deletion,binding:personalSessionBinding(token)});
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/personal/security/delete/status');
 expect((fetcher.mock.calls[0][1]?.headers as Record<string,string>).Cookie).toBe('shida_dashboard_session='+token);
});
it('reconciles deletion status through the bound read-only security route and fails closed on timeout',async()=>{
 const response=await GET(req('personal/security/delete/status','GET'),context('delete/status'));
 expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('no-store');
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/personal/security/delete/status');
 expect((await POST(req('personal/security/delete/status'),context('delete/status'))).status).toBe(404);
 expect((await GET(req('personal/security/delete/status','GET',{}, {'x-shida-session':'stale'}),context('delete/status'))).status).toBe(401);
 expect(fetcher).toHaveBeenCalledTimes(1);
 fetcher.mockRejectedValueOnce(new DOMException('Synthetic timeout','TimeoutError'));
 const timedOut=await GET(req('personal/security/delete/status','GET'),context('delete/status'));
 expect(timedOut.status).toBe(503);expect(await timedOut.json()).toEqual({detail:'security_unavailable'});
});
it('rejects cross-site status reads and fails closed on unavailable or malformed state',async()=>{
 expect((await deletionStatus(req('personal/deletion','GET',{}, {Origin:'https://other.test'}))).status).toBe(403);
 expect(fetcher).not.toHaveBeenCalled();
 fetcher.mockResolvedValueOnce(Response.json({}));
 expect((await deletionStatus(req('personal/deletion','GET'))).status).toBe(503);
 jar.clear();expect((await deletionStatus(req('personal/deletion','GET'))).status).toBe(401);
});
it('installs a fresh HttpOnly cookie only after explicit bound cancellation',async()=>{
 vi.stubEnv('NODE_ENV','production');
 const fresh='synthetic_fresh_cancellation_session_123456';
 fetcher.mockResolvedValueOnce(Response.json({cancelled:true},{headers:{'Set-Cookie':`shida_dashboard_session=${fresh}; HttpOnly; Secure; SameSite=Strict`}}));
 const response=await POST(req('personal/security/delete/cancel','POST',{reference:'DEL_fixture',confirmed:true}),context('delete/cancel'));
 expect(response.status).toBe(200);expect(await response.json()).toEqual({cancelled:true});
 expect(saved).toHaveBeenCalledWith(PERSONAL_SESSION_COOKIE,fresh,expect.objectContaining({httpOnly:true,secure:true}));
 expect((await POST(req('personal/security/delete/cancel'),context('delete/cancel'))).status).toBe(401);
});
