import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const harness=vi.hoisted(()=>({effects:[] as Array<()=>void|(()=>void)>,states:[] as Array<ReturnType<typeof vi.fn>>,restore:vi.fn(),unconfirmed:false}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useEffect:(effect:()=>void|(()=>void))=>harness.effects.push(effect),useRef:(initial:unknown)=>({current:initial}),useState:(initial:unknown)=>{const set=vi.fn();harness.states.push(set);return [initial,set];}}));
vi.mock('../app/lib/personal-session-browser',()=>({PERSONAL_SESSION_EVENT:'shida-personal-session-changed',restorePersonalSession:harness.restore,PersonalSessionError:class extends Error{constructor(public status:number){super('session_unavailable');}}}));
vi.mock('../app/lib/personal-login-browser',()=>({LOGIN_EVENT:'shida-personal-login-attempt',loginUnconfirmed:()=>harness.unconfirmed}));
vi.mock('../app/lib/use-personal-activity-data',()=>({usePersonalActivityData:()=>undefined}));
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn()})}));
import {PersonalSessionError,PERSONAL_SESSION_EVENT} from '../app/lib/personal-session-browser';
import {WenzeBuyerProvider} from '../app/components/shida/wenze-buyer';
import {AccountSpace} from '../app/components/shida/account-space';
let stop:void|(()=>void),target:EventTarget;
const session={binding:'a'.repeat(64),user:{display_name:'Synthetic'}};
beforeEach(()=>{harness.effects=[];harness.states=[];harness.restore.mockReset().mockResolvedValue(session);harness.unconfirmed=false;target=new EventTarget();vi.stubGlobal('window',target);vi.stubGlobal('document',Object.assign(new EventTarget(),{hidden:false}));});
afterEach(()=>{if(stop)stop();stop=undefined;vi.unstubAllGlobals();});
for(const component of ['buyer','account'] as const)describe(`${component} Personal session refresh`,()=>{
 async function mount(){if(component==='buyer')WenzeBuyerProvider({locale:'fr',children:null});else AccountSpace({locale:'fr',initialView:'listings'});stop=harness.effects[component==='buyer'?1:0]();await vi.waitFor(()=>expect(harness.states[0]).toHaveBeenCalledWith(session));harness.states[0].mockClear();return harness.states[0];}
 it.each([new TypeError('offline'),new PersonalSessionError(503)])('retains the mounted identity after a transient focus failure %s',async error=>{
  const set=await mount();harness.restore.mockRejectedValueOnce(error);target.dispatchEvent(new Event('focus'));await vi.waitFor(()=>expect(harness.restore).toHaveBeenCalledTimes(2));await Promise.resolve();expect(set).not.toHaveBeenCalledWith(null);
 });
 it.each([401,403,409])('clears private state after authoritative denial %s',async status=>{
  const set=await mount();harness.restore.mockRejectedValueOnce(new PersonalSessionError(status));target.dispatchEvent(new Event('focus'));await vi.waitFor(()=>expect(set).toHaveBeenCalledWith(null));
 });
 it('clears immediately for an explicit identity event, even if recheck is unavailable',async()=>{
  const set=await mount();harness.restore.mockRejectedValueOnce(new PersonalSessionError(503));target.dispatchEvent(new Event(PERSONAL_SESSION_EVENT));expect(set).toHaveBeenCalledWith(null);
 });
 it('clears immediately for a login transition and never retains the previous account',async()=>{
  const set=await mount();harness.restore.mockRejectedValueOnce(new PersonalSessionError(503));target.dispatchEvent(new Event('shida-personal-login-attempt'));expect(set).toHaveBeenCalledWith(null);
 });
 it('clears when an uncertain identity mutation masks itself as a busy503',async()=>{
  const set=await mount();harness.unconfirmed=true;harness.restore.mockRejectedValueOnce(new PersonalSessionError(503));target.dispatchEvent(new Event('focus'));await vi.waitFor(()=>expect(set).toHaveBeenCalledWith(null));
 });
 it('replaces the binding when another authenticated account is observed',async()=>{
  const set=await mount(),next={...session,binding:'b'.repeat(64)};harness.restore.mockResolvedValueOnce(next);target.dispatchEvent(new Event('focus'));await vi.waitFor(()=>expect(set).toHaveBeenCalledWith(next));
 });
});
