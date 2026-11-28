import {afterEach,expect,it,vi} from 'vitest';
import type {ReactElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {RestaurantInterest} from '../app/components/shida/restaurant-interest';
import {JobPublicActions} from '../app/components/shida/job-public-actions';
import {POST} from '../app/api/shida/personal/restaurant-orders/[[...path]]/route';
import {personalSessionBinding} from '../app/api/shida/employment/route-utils';
import {STATISTICS_CHOICE_KEY} from '../app/lib/website-statistics-consent';

const fixtures=vi.hoisted(()=>({effects:[] as (()=>void)[],restore:vi.fn(),request:vi.fn(),token:'isolated-restaurant-session-token'}));
vi.mock('react',async importOriginal=>({
 ...await importOriginal<typeof import('react')>(),
 useEffect:(callback:()=>void)=>{fixtures.effects.push(callback);},
 useState:(seed:unknown)=>[seed,vi.fn()],
 useSyncExternalStore:(_subscribe:unknown,get:()=>string)=>get(),
}));
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>({value:fixtures.token})})}));
vi.mock('../app/lib/personal-session-browser',()=>({restorePersonalSession:fixtures.restore}));
vi.mock('../app/lib/restaurant-seller-browser',()=>({request:fixtures.request}));
afterEach(()=>{fixtures.effects=[];vi.clearAllMocks();vi.unstubAllGlobals();});

it('never attaches Restaurant interest handlers or restores an account with an old acceptance',()=>{
 const saved=JSON.stringify({choice:'accepted',expires:Date.now()+86400000});
 vi.stubGlobal('window',{localStorage:{getItem:(key:string)=>key===STATISTICS_CHOICE_KEY?saved:null}});
 vi.stubGlobal('document',{addEventListener:vi.fn(),visibilityState:'visible'});
 const html=renderToStaticMarkup(<RestaurantInterest establishmentRef="RST_fixture" locale="en" menuOnly={false} menuAvailable/>);
 fixtures.effects.forEach(effect=>effect());
 expect(document.addEventListener).not.toHaveBeenCalled();
 expect(fixtures.restore).not.toHaveBeenCalled();
 expect(fixtures.request).not.toHaveBeenCalled();
 expect(html).toContain('You can still place an order.');
});

it('discards authenticated Restaurant interest but forwards the authorized basket request',async()=>{
 const upstream=vi.fn().mockResolvedValue(new Response(JSON.stringify({basket_ref:'RSTB_fixture'})));
 vi.stubGlobal('fetch',upstream);
 const headers={origin:'https://nihiloba.com','Content-Type':'application/json','X-Shida-Session':personalSessionBinding(fixtures.token)};
 const post=(path:string[])=>POST(new Request('https://nihiloba.com/api/shida/personal/restaurant-orders/'+path.join('/'),{method:'POST',headers,body:'{}'}),{params:Promise.resolve({path})});
 const result=await post(['establishments','RST_fixture','interest']);
 expect(await result.json()).toEqual({recorded:false});
 expect(upstream).not.toHaveBeenCalled();
 expect((await post(['baskets'])).status).toBe(200);
 expect(new URL(upstream.mock.calls[0][0]).pathname).toBe('/api/dashboard/personal/restaurant-orders/baskets');
});

it.each(['native','clipboard'] as const)('keeps %s job sharing without a measurement or marker',async method=>{
 const share=vi.fn().mockResolvedValue(undefined),fetcher=vi.fn(),write=vi.fn();
 vi.stubGlobal('navigator',method==='native'?{share}:{clipboard:{writeText:share}});
 vi.stubGlobal('window',{location:{origin:'https://example.test'},sessionStorage:{setItem:write}});
 vi.stubGlobal('sessionStorage',{setItem:write});
 vi.stubGlobal('fetch',fetcher);
 const actions=JobPublicActions({locale:'en',jobReference:'JOB_fixture',title:'Synthetic job',path:'/shida/emplois/JOB_fixture',origin:'external'});
 const children=actions.props.children as ReactElement<{onClick:()=>void}>[];
 children[1].props.onClick();
 await Promise.resolve();
 const url='https://example.test/shida/emplois/JOB_fixture';
 expect(share).toHaveBeenCalledExactlyOnceWith(method==='native'?{title:'Synthetic job',url}:url);
 expect(fetcher).not.toHaveBeenCalled();
 expect(write).not.toHaveBeenCalled();
});
