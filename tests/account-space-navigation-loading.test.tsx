import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {AccountSpace} from '../app/components/shida/account-space';
import type {MouseEvent} from 'react';
const state=vi.hoisted(()=>({push:vi.fn(),leave:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({push:state.push})}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useEffect:()=>{},useState:(value:unknown)=>[value,vi.fn()]}));
vi.mock('../app/lib/wenze-work',async original=>({...await original<typeof import('../app/lib/wenze-work')>(),leaveWork:state.leave}));
beforeEach(()=>{state.push.mockReset();state.leave.mockReset().mockResolvedValue(true);vi.stubGlobal('window',{location:new URL('http://127.0.0.1/fr/shida/space?view=overview')});});
afterEach(()=>vi.unstubAllGlobals());
function navigate(){return AccountSpace({locale:'fr',initialView:'overview'}).props.children[0].props.onNavigate as (event:MouseEvent<HTMLAnchorElement>)=>Promise<void>;}
function event(overrides:Record<string,unknown>={}){return {defaultPrevented:false,button:0,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,currentTarget:{href:'http://127.0.0.1/fr/shida/space?view=settings'},preventDefault:vi.fn(),...overrides} as unknown as MouseEvent<HTMLAnchorElement>;}
it('routes the query destination only after the draft guard approves',async()=>{
 let approve!:(ok:boolean)=>void;state.leave.mockImplementation(()=>new Promise<boolean>(resolve=>{approve=resolve;}));const click=event(),pending=navigate()(click);expect(click.preventDefault).toHaveBeenCalled();expect(state.push).not.toHaveBeenCalled();approve(true);await pending;expect(state.push).toHaveBeenCalledWith('/fr/shida/space?view=settings');
});
it('keeps the current page when a draft departure is cancelled',async()=>{
 state.leave.mockResolvedValue(false);await navigate()(event());expect(state.push).not.toHaveBeenCalled();
});
it.each([{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true},{currentTarget:{href:'https://example.invalid/'}}])('retains native browser navigation for %j',async overrides=>{
 const click=event(overrides);await navigate()(click);expect(click.preventDefault).not.toHaveBeenCalled();expect(state.leave).not.toHaveBeenCalled();expect(state.push).not.toHaveBeenCalled();
});
