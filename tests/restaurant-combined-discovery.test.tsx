import {afterEach,expect,it,vi} from 'vitest';
import {renderToReadableStream,renderToStaticMarkup} from 'react-dom/server';
import {RestaurantDiscovery} from '../app/components/shida/restaurant-discovery';
import {RestaurantDetailPage} from '../app/components/shida/restaurants';
import {getRestaurantMenuItem,getRestaurantDishMatches} from '../app/services/shida/restaurants-client';
import {discoverRestaurantDishes} from '../app/lib/restaurant-dish-discovery';
import {RESTAURANTS_SLOGAN} from '../app/lib/brand';
import {restaurantDiscoveryFinalCopy as copy} from '../app/lib/restaurant-discovery-final-copy';
import {restaurant,unit,monetary,menu,collection,actions} from './fixtures/restaurants.mjs';
vi.mock('next/navigation',async original=>({...await original<typeof import('next/navigation')>(),useRouter:()=>({refresh:vi.fn()})}));
afterEach(()=>vi.unstubAllGlobals());
async function renderDiscovery(locale: 'en'|'fr'|'ln'|'sw') {
 const stream=await renderToReadableStream(await RestaurantDiscovery({locale}));
 await stream.allReady;
 return (await new Response(stream).text()).replace(/<!-- -->/g, '');
}
function api(failMenu=false){
 const fetcher=vi.fn(async(input:string)=>{const url=new URL(input),p=url.pathname;
  if(p.endsWith('/restaurant-dishes'))return failMenu?new Response('{}',{status:503}):Response.json(collection(menu.items.map((item: typeof unit)=>({item,establishment:{public_ref:restaurant.public_ref,name:restaurant.name,general_location:'Kinshasa'}}))));
  if(p.endsWith('/restaurants'))return Response.json({...collection([restaurant]),service_mode_options:[]});
  if(p.endsWith('/menu'))return failMenu?new Response('{}',{status:503}):Response.json(menu);
  if(p.endsWith('/menu/ITM-LATER'))return Response.json({...monetary,public_ref:'ITM-LATER',availability:'available'});
  if(p.includes('entity-actions'))return Response.json(actions);
  return Response.json(restaurant);
 });vi.stubGlobal('fetch',fetcher);return fetcher;
}
it.each(['en','fr','ln','sw'] as const)('uses permanent branding and authentic discovery in %s',async locale=>{
 api();const html=await renderDiscovery(locale);
 expect(html).toContain(RESTAURANTS_SLOGAN);expect(html).toContain('lang="ln"');expect(html).toContain(copy[locale].intro);
 expect(html).toContain('rd-meal-art');expect(html).toContain(copy[locale].dishes);expect(html).toContain('ITM-UNIT');expect(html).toContain('5 USD');
 expect(html).toContain('menu?item=ITM-UNIT');expect(html).toContain('create=malewa');expect(html).toContain('create=restaurant');
 expect(html).not.toContain('PRIVATE_');expect(html).not.toContain('Espace vendeur');expect(html).not.toContain('rd-top');
});
it('keeps establishments when menu previews fail',async()=>{
 api(true);const html=await renderDiscovery('en');
 expect(html).toContain(copy.en.dishError);expect(html).toContain('Test Malewa');expect(html).not.toContain(copy.en.noDishes);
});
it('fetches one bounded independent dish page',async()=>{
 const fetcher=api();await discoverRestaurantDishes('en',{});
 const urls=fetcher.mock.calls.map(call=>new URL(call[0]));
 expect(urls[0].pathname).toContain('/restaurant-dishes');expect(urls[0].searchParams.get('page_size')).toBe('6');expect(urls).toHaveLength(1);
});
it('rejects cross-restaurant items from both selection and search',async()=>{
 vi.stubGlobal('fetch',async()=>Response.json({...unit,establishment_ref:'RST-OTHER'}));
 await expect(getRestaurantMenuItem('en','RST-TEST1','ITM-UNIT')).rejects.toThrow();
 vi.stubGlobal('fetch',async()=>Response.json({...collection([{...restaurant,dish_matches:{items:[{...unit,establishment_ref:'RST-OTHER'}]}}])}));
 await expect(getRestaurantDishMatches('en',{dish:'Poulet'})).rejects.toThrow();
});
it('searches dishes on the server, keeping location and type filters',async()=>{
 const fetcher=vi.fn(async(_input:string)=>Response.json(collection([{establishment:{public_ref:restaurant.public_ref,name:restaurant.name,general_location:'Kinshasa'},item:unit}])));vi.stubGlobal('fetch',fetcher);
 const result=await discoverRestaurantDishes('en',{query:'Poulet',city:'Kinshasa',food_type:'malewa',dish_page:'2'});
 const url=new URL(String(fetcher.mock.calls[0][0]));expect(url.searchParams.get('query')).toBe('Poulet');expect(url.searchParams.get('city')).toBe('Kinshasa');expect(url.searchParams.get('page')).toBe('2');expect(result.items[0].establishment.public_ref).toBe(result.items[0].item.establishment_ref);
});
it('resolves selected dishes outside the first menu page without trusting URL price or parent',async()=>{
 api();const html=renderToStaticMarkup(await RestaurantDetailPage({locale:'en',id:'RST-TEST1',menuOnly:true,search:{item:'ITM-LATER',price:'0'}}));
 expect(html).toContain('data-restaurant-item-view="ITM-LATER"');expect(html).toContain('1,000 CDF');expect(html).toContain('item-ITM-UNIT');
});

it('streams establishments before delayed dishes, fetching establishments once',async()=>{
 const normal=api();
 let release!: (value: Response)=>void;
 const delayed=new Promise<Response>(resolve=>{release=resolve;});
 const fetcher=vi.fn((input:string)=>new URL(input).pathname.endsWith('/restaurant-dishes')?delayed:normal(input));
 vi.stubGlobal('fetch',fetcher);
 const element=await RestaurantDiscovery({locale:'en'});
 const stream=await renderToReadableStream(element);
 const reader=stream.getReader();
 let initial='';
 const decoder=new TextDecoder();
 while(!initial.includes('class="rd-card"')) {
  const chunk=await reader.read();
  if(chunk.done)break;
  initial+=decoder.decode(chunk.value);
 }
 expect(initial).toContain('class="rd-card"');
 expect(initial).not.toContain('class="rd-dish-card"');
 expect(fetcher.mock.calls.filter(call=>new URL(call[0]).pathname.endsWith('/restaurants'))).toHaveLength(1);
 release(Response.json(collection([{establishment:{public_ref:restaurant.public_ref,name:restaurant.name,general_location:'Kinshasa'},item:unit}])));
 let rest='';
 while(true){const chunk=await reader.read();if(chunk.done)break;rest+=decoder.decode(chunk.value);}
 expect(rest).toContain('class="rd-dish-card"');
});
