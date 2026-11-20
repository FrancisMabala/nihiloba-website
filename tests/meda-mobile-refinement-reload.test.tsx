import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach,expect,it,vi} from 'vitest';
import {MedaMarketplace} from '../app/components/shida/meda-marketplace';

// Exercise the component's actual effect callbacks with setup/cleanup/setup.
// This isolated lifecycle harness supplements, not replaces, browser hydration QA.
const lifecycle=vi.hoisted(()=>({effects:[] as Array<()=>void|(()=>void)>,states:[] as Array<{initial:unknown;set:ReturnType<typeof vi.fn>}>,binding:'unit-synthetic-binding' as string|null}));
vi.mock('react',async importOriginal=>({
 ...await importOriginal<typeof import('react')>(),
 useEffect:(effect:()=>void|(()=>void))=>{lifecycle.effects.push(effect);},
 useState:(initial:unknown)=>{const value=typeof initial==='function'?initial():initial,set=vi.fn();lifecycle.states.push({initial:value,set});return [value,set];},
}));
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),replace:vi.fn()})}));
vi.mock('../app/components/shida/wenze-buyer',()=>({
 WenzeBuyerProvider:({children}:{children:import('react').ReactNode})=>children,
 useWenzeBuyer:()=>({binding:lifecycle.binding,checking:false,login:vi.fn()}),
}));
const row={reference:'MED_unit',revision:2,status:'published'};
beforeEach(()=>{
 vi.unstubAllGlobals();lifecycle.effects=[];lifecycle.states=[];lifecycle.binding='unit-synthetic-binding';
 vi.stubGlobal('location',new URL('http://127.0.0.1/shida/space/?view=listings&tab=meda&meda_view=review&ref=MED_unit'));
});
function mount(){renderToStaticMarkup(<MedaMarketplace locale="en" embedded/>);return {setup:lifecycle.effects[0],view:lifecycle.states.find(state=>state.initial==='browse')!.set};}
function cleanup(value:void|(()=>void)){if(value)value();}

it('restores owner detail when initial effects replay while the read is pending',async()=>{
 let finish!:(response:Response)=>void;
 const fetch=vi.fn<typeof globalThis.fetch>(()=>new Promise<Response>(resolve=>{finish=resolve;}));vi.stubGlobal('fetch',fetch);
 const {setup,view}=mount();cleanup(setup());const stop=setup();
 await vi.waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
 finish(Response.json(row));
 await vi.waitFor(()=>expect(view).toHaveBeenCalledWith('review'));
 expect(fetch.mock.calls[0][0]).toBe('/api/shida/personal/meda/listings/MED_unit/');
 cleanup(stop);
});

it('does not commit a detail response after its workspace unmounts',async()=>{
 let finish!:(response:Response)=>void;
 const fetch=vi.fn<typeof globalThis.fetch>(()=>new Promise<Response>(resolve=>{finish=resolve;}));vi.stubGlobal('fetch',fetch);
 const {setup,view}=mount(),stop=setup();
 await vi.waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));cleanup(stop);finish(Response.json(row));
 await new Promise(resolve=>setTimeout(resolve,20));
 expect(view).not.toHaveBeenCalledWith('review');
});

it('does not read member detail for an anonymous workspace during replay',async()=>{
 lifecycle.binding=null;const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
 const {setup}=mount();cleanup(setup());const stop=setup();
 await new Promise(resolve=>setTimeout(resolve,20));expect(fetch).not.toHaveBeenCalled();cleanup(stop);
});

it('does not start a read when the workspace is removed before initialization',async()=>{
 const fetch=vi.fn();vi.stubGlobal('fetch',fetch);const {setup}=mount();cleanup(setup());
 await new Promise(resolve=>setTimeout(resolve,20));expect(fetch).not.toHaveBeenCalled();
});
