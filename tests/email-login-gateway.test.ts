import {afterEach,beforeEach,it,expect,vi} from 'vitest';
const jar=new Map<string,string>();
const set=vi.fn((name:string,value:string)=>{if(value)jar.set(name,value);else jar.delete(name);});
vi.mock('next/headers',()=>({cookies:async()=>({get:(name:string)=>jar.has(name)?{value:jar.get(name)}:undefined,set})}));
import {GET,POST} from '../app/api/shida/personal/auth/email/[action]/route';
const ctx=(action:string)=>({params:Promise.resolve({action})});
const req=(action:string,body?:unknown,origin='https://nihiloba.com')=>new Request(`https://nihiloba.com/api/shida/personal/auth/email/${action}/`,{method:action==='capabilities'?'GET':'POST',headers:{origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
beforeEach(()=>{jar.clear();set.mockClear();vi.unstubAllGlobals();vi.stubEnv('SHIDA_EMAIL_LOGIN_ENABLED','true');});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('cancels only the email ceremony without ending an existing session',async()=>{
 jar.set('nihiloba_email_attempt','synthetic-attempt');jar.set('nihiloba_personal_session','existing-session');
 vi.stubGlobal('fetch',vi.fn());
 expect(await (await POST(req('cancel'),ctx('cancel'))).json()).toEqual({cancelled:true});
 expect(jar.has('nihiloba_email_attempt')).toBe(false);expect(jar.get('nihiloba_personal_session')).toBe('existing-session');expect(fetch).not.toHaveBeenCalled();
});
it('fails closed while disabled',async()=>{vi.stubEnv('SHIDA_EMAIL_LOGIN_ENABLED','false');vi.stubGlobal('fetch',vi.fn());expect(await (await GET(req('capabilities'),ctx('capabilities'))).json()).toEqual({enabled:false});expect((await POST(req('start'),ctx('start'))).status).toBe(404);expect(fetch).not.toHaveBeenCalled();});
it.each(['','https://evil.example'])('rejects invalid origin %s',async origin=>{vi.stubGlobal('fetch',vi.fn());expect((await POST(req('start',{},origin),ctx('start'))).status).toBe(403);expect(fetch).not.toHaveBeenCalled();});
it('binds verification to the browser ceremony and never exposes secrets',async()=>{
 const binding='b'.repeat(43),token='t'.repeat(43);
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({reference:'EML_fixture',expires_at:new Date(Date.now()+600000).toISOString()},{headers:{'set-cookie':`shida_email_browser=${binding}; HttpOnly`}})));
 const started=await POST(req('start',{email:'synthetic@example.test',language:'fr'}),ctx('start'));
 expect(started.status).toBe(200);expect(JSON.stringify(await started.json())).not.toContain(binding);
 expect(set.mock.calls[0][0]).toBe('nihiloba_email_attempt');
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({authenticated:true},{headers:{'set-cookie':`shida_dashboard_session=${token}; HttpOnly`}})));
 const result=await POST(req('verify',{reference:'EML_fixture',code:'12345678'}),ctx('verify'));
 expect(await result.json()).toEqual({authenticated:true});expect(jar.get('nihiloba_personal_session')).toBe(token);
 expect(jar.has('nihiloba_email_attempt')).toBe(false);expect(result.headers.get('cache-control')).toContain('no-store');
});
it.each(['EML_other','EML_fixture'])('rejects stale or expired attempts %s',async reference=>{
 jar.set('nihiloba_email_attempt',`EML_fixture.${reference==='EML_other'?Date.now()+600000:1}.${'b'.repeat(43)}`);
 vi.stubGlobal('fetch',vi.fn());expect((await POST(req('verify',{reference,code:'12345678'}),ctx('verify'))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
});
it('rejects client supplied session and extra fields',async()=>{
 vi.stubGlobal('fetch',vi.fn());expect((await POST(req('start',{email:'a@example.test',language:'en',token:'x'}),ctx('start'))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
});
it('requires a real upstream session cookie',async()=>{
 jar.set('nihiloba_email_attempt',`EML_fixture.${Date.now()+600000}.${'b'.repeat(43)}`);
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({authenticated:true})));
 expect((await POST(req('verify',{reference:'EML_fixture',code:'12345678'}),ctx('verify'))).status).toBe(503);expect(jar.has('nihiloba_personal_session')).toBe(false);
});
