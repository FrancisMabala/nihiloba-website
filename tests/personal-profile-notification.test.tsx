import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const harness=vi.hoisted(()=>({effects:[] as Array<()=>void|(()=>void)>,states:[] as Array<ReturnType<typeof vi.fn>>,restore:vi.fn(),unconfirmed:false}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useEffect:(effect:()=>void|(()=>void))=>harness.effects.push(effect),useCallback:(callback:unknown)=>callback,useId:()=>':synthetic-profile:',useRef:(initial:unknown)=>({current:initial}),useState:(initial:unknown)=>{const set=vi.fn();harness.states.push(set);return [initial,set];}}));
vi.mock('../app/lib/personal-session-browser',()=>({PERSONAL_SESSION_EVENT:'shida-personal-session-changed',restorePersonalSession:harness.restore,PersonalSessionError:class extends Error{constructor(public status:number){super('session_unavailable');}}}));
vi.mock('../app/lib/personal-login-browser',()=>({LOGIN_EVENT:'shida-personal-login-attempt',loginUnconfirmed:()=>harness.unconfirmed}));
vi.mock('../app/lib/use-personal-activity-data',()=>({usePersonalActivityData:()=>undefined}));
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn()}),usePathname:()=>'/fr/shida/space/'}));
import {PersonalSessionError,PERSONAL_SESSION_EVENT} from '../app/lib/personal-session-browser';
import {PERSONAL_PROFILE_EVENT,announcePersonalProfileChange} from '../app/lib/personal-profile-browser';
import {WenzeBuyerProvider} from '../app/components/shida/wenze-buyer';
import {AccountSpace} from '../app/components/shida/account-space';
import {PublicShidaAccount} from '../app/components/shida/public-account';
const session={binding:'a'.repeat(64),user:{display_name:'Synthetic'}};
let stop:void|(()=>void),target:EventTarget;
beforeEach(()=>{harness.effects=[];harness.states=[];harness.restore.mockReset().mockResolvedValue(session);harness.unconfirmed=false;target=new EventTarget();vi.stubGlobal('window',target);vi.stubGlobal('document',Object.assign(new EventTarget(),{hidden:false}));vi.stubGlobal('localStorage',{setItem:vi.fn()});});
afterEach(()=>{if(stop)stop();stop=undefined;vi.unstubAllGlobals();});
it('announces only a profile update and stores only a random notification nonce',()=>{
 const profile=vi.fn(),identity=vi.fn();target.addEventListener(PERSONAL_PROFILE_EVENT,profile);target.addEventListener(PERSONAL_SESSION_EVENT,identity);
 announcePersonalProfileChange();expect(profile).toHaveBeenCalledTimes(1);expect(identity).not.toHaveBeenCalled();
 expect(localStorage.setItem).toHaveBeenCalledExactlyOnceWith(PERSONAL_PROFILE_EVENT,expect.stringMatching(/^[a-f0-9-]{36}$/));
 expect((profile.mock.calls[0][0] as Event&{detail?:unknown}).detail).toBeUndefined();
});
it('still announces locally if notification storage is unavailable',()=>{
 vi.mocked(localStorage.setItem).mockImplementation(()=>{throw Error('blocked');});const profile=vi.fn();target.addEventListener(PERSONAL_PROFILE_EVENT,profile);expect(()=>announcePersonalProfileChange()).not.toThrow();expect(profile).toHaveBeenCalledTimes(1);
});
it('ordinary profile saves use the profile emitter, never the identity emitter',()=>{
 const source=readFileSync(new URL('../app/components/shida/personal-profile-settings.tsx',import.meta.url),'utf8');
 expect(source).toContain("import {announcePersonalProfileChange} from '../../lib/personal-profile-browser'");
 expect(source).not.toContain('announcePersonalSessionChange');expect(source.match(/announcePersonalProfileChange\(\)/g)).toHaveLength(1);
 expect(source.indexOf('announcePersonalProfileChange();')).toBeGreaterThan(source.indexOf('if(!response.ok)'));
});
for(const component of ['buyer','account','public'] as const)describe(`${component} profile-only refresh`,()=>{
 async function mount(){if(component==='buyer')WenzeBuyerProvider({locale:'fr',children:null});else if(component==='account')AccountSpace({locale:'fr',initialView:'listings'});else PublicShidaAccount({locale:'fr'});stop=harness.effects[component==='account'?0:1]();const set=harness.states[component==='public'?1:0];await vi.waitFor(()=>expect(set).toHaveBeenCalledWith(session));set.mockClear();return set;}
 function signal(kind:'same-tab'|'cross-tab'){target.dispatchEvent(kind==='same-tab'?new Event(PERSONAL_PROFILE_EVENT):Object.assign(new Event('storage'),{key:PERSONAL_PROFILE_EVENT,newValue:'random-notification'}));}
 it.each(['same-tab','cross-tab'] as const)('keeps the same identity mounted while refreshing canonical labels (%s)',async kind=>{
  const set=await mount(),updated={...session,user:{display_name:'Updated synthetic'}};harness.restore.mockResolvedValueOnce(updated);signal(kind);expect(set).not.toHaveBeenCalledWith(null);await vi.waitFor(()=>expect(set).toHaveBeenCalledWith(updated));expect(set).not.toHaveBeenCalledWith(null);
 });
 it.each([new TypeError('offline'),new PersonalSessionError(503)])('keeps same-actor UI on a temporary profile recheck failure %s',async error=>{
  const set=await mount();harness.restore.mockRejectedValueOnce(error);signal('cross-tab');await vi.waitFor(()=>expect(harness.restore).toHaveBeenCalledTimes(2));await Promise.resolve();expect(set).not.toHaveBeenCalledWith(null);
 });
 it.each([401,403,409])('clears private state on authoritative profile recheck denial %s',async status=>{
  const set=await mount();harness.restore.mockRejectedValueOnce(new PersonalSessionError(status));signal('same-tab');await vi.waitFor(()=>expect(set).toHaveBeenCalledWith(null));
 });
 it('uses a changed canonical binding rather than trusting the profile event actor',async()=>{
  const set=await mount(),other={...session,binding:'b'.repeat(64)};harness.restore.mockResolvedValueOnce(other);signal('cross-tab');await vi.waitFor(()=>expect(set).toHaveBeenCalledWith(other));
 });
 it('keeps a real identity event clear-first even when the server returns the same binding',async()=>{
  const set=await mount();target.dispatchEvent(new Event(PERSONAL_SESSION_EVENT));expect(set).toHaveBeenCalledWith(null);await vi.waitFor(()=>expect(set).toHaveBeenCalledWith(session));
 });
 it('does not let a stale profile response restore an earlier account after login mutation',async()=>{
  const set=await mount();let finish!:(value:typeof session)=>void;harness.restore.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));signal('same-tab');
  const other={...session,binding:'b'.repeat(64)};harness.restore.mockResolvedValueOnce(other);target.dispatchEvent(new Event('shida-personal-login-attempt'));expect(set).toHaveBeenCalledWith(null);await vi.waitFor(()=>expect(set).toHaveBeenCalledWith(other));set.mockClear();finish(session);await Promise.resolve();await Promise.resolve();expect(set).not.toHaveBeenCalledWith(session);
 });
 it('fails closed during an uncertain login even when the read reports busy503',async()=>{
  const set=await mount();harness.unconfirmed=true;harness.restore.mockRejectedValueOnce(new PersonalSessionError(503));signal('cross-tab');await vi.waitFor(()=>expect(set).toHaveBeenCalledWith(null));
 });
});
