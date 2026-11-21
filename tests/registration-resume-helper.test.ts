import {beforeEach,expect,it,vi} from 'vitest';
import {resumeRegistrationChallenge} from '../app/lib/registration/challenge-resume';
import {LOGIN_LOCK} from '../app/lib/personal-login-browser';

const expires=()=>new Date(Date.now()+120000).toISOString();
const data=()=>({status:'verified',challenge_ref:'DWC_resume_fixture',expires_at:expires(),language:'fr'});
beforeEach(()=>{
 vi.unstubAllGlobals();
 vi.stubGlobal('localStorage',{getItem:()=>null});
 vi.stubGlobal('navigator',{locks:{request:vi.fn(async(_name:string,options:unknown,work?:()=>Promise<unknown>)=>(work??options as ()=>Promise<unknown>)())}});
});
it('reads only safe lifecycle fields inside the shared authentication lock',async()=>{
 const fetcher=vi.fn(async()=>Response.json({...data(),phone:'private',code:'private'}));vi.stubGlobal('fetch',fetcher);
 const result=await resumeRegistrationChallenge();
 expect(Object.keys(result!)).toEqual(['status','challenge_ref','expires_at','language']);
 expect(navigator.locks.request).toHaveBeenCalledWith(LOGIN_LOCK,expect.any(Function));
 expect(fetcher).toHaveBeenCalledWith('/api/shida/personal/auth/whatsapp/registration/resume/',expect.objectContaining({method:'GET',credentials:'same-origin',cache:'no-store'}));
});
it('an absent challenge is not a successful authentication or a new attempt',async()=>{
 const fetcher=vi.fn(async()=>Response.json({error:{code:'expired'}},{status:404}));vi.stubGlobal('fetch',fetcher);
 expect(await resumeRegistrationChallenge()).toBeNull();expect(fetcher).toHaveBeenCalledTimes(1);
});
it('does not read or replay anything while a previous exchange is uncertain',async()=>{
 vi.stubGlobal('localStorage',{getItem:()=> '1'});const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 await expect(resumeRegistrationChallenge()).rejects.toThrow('uncertain');expect(fetcher).not.toHaveBeenCalled();
});
it('passes abort to the queued lock and request',async()=>{
 const controller=new AbortController();vi.stubGlobal('fetch',vi.fn(async()=>Response.json(data())));
 await resumeRegistrationChallenge(controller.signal);
 expect(navigator.locks.request).toHaveBeenCalledWith(LOGIN_LOCK,{signal:controller.signal},expect.any(Function));
 expect(fetch).toHaveBeenCalledWith(expect.any(String),expect.objectContaining({signal:controller.signal}));
});
it('does not fetch when its deadline passes before acquiring the lock',async()=>{
 const controller=new AbortController();const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 vi.stubGlobal('navigator',{locks:{request:async(_name:string,_options:unknown,work:()=>Promise<unknown>)=>{controller.abort();return work();}}});
 await expect(resumeRegistrationChallenge(controller.signal)).rejects.toThrow('cancelled');expect(fetcher).not.toHaveBeenCalled();
});
it('requires real browser lock support',async()=>{
 vi.stubGlobal('navigator',{});const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 await expect(resumeRegistrationChallenge()).rejects.toThrow('unavailable');expect(fetcher).not.toHaveBeenCalled();
});
it.each([{status:'consumed'},{challenge_ref:'bad'},{language:'xx'},{expires_at:'invalid'},{expires_at:'2000-01-01T00:00:00Z'}])('rejects invalid recovered state %j',async change=>{
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({...data(),...change})));
 await expect(resumeRegistrationChallenge()).rejects.toThrow('unavailable');
});
it.each([[429,'rate_limited'],[503,'unavailable']] as const)('preserves %s failure without automatic retry',async(status,error)=>{
 const fetcher=vi.fn(async()=>Response.json({},{status}));vi.stubGlobal('fetch',fetcher);
 await expect(resumeRegistrationChallenge()).rejects.toThrow(error);expect(fetcher).toHaveBeenCalledTimes(1);
});
