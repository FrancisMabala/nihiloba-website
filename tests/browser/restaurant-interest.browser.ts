import {test,expect,type Page} from '@playwright/test';
import {statisticsCopy} from '../../app/lib/website-statistics-consent';
type Interest={kind:string;item_ref?:string;operation_key:string};
const t=statisticsCopy.en;

function restaurantFixture(){
 const base=test.info().project.use.baseURL,origin=process.env.SHIDA_ACCEPTANCE_WEBSITE_ORIGIN;
 const generation=process.env.SHIDA_ACCEPTANCE_GENERATION,source=process.env.SHIDA_ACCEPTANCE_WEBSITE_SHA,reference=process.env.SHIDA_ACCEPTANCE_RESTAURANT_REF;
 if(!base||!origin||new URL(base).origin!==origin||!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw Error('Require the approved isolated loopback Website origin');
 if(!generation||!/^[a-f0-9]{32}$/.test(generation)||!source||!/^[a-f0-9]{40}$/.test(source)||!reference||!/^RST_[A-Za-z0-9_-]+$/.test(reference))throw Error('Require the QA-pinned generation, full runtime Website SHA and published-menu SHIDA_ACCEPTANCE_RESTAURANT_REF');
 // QA verifies source/generation binding before execution. Real SSR reads the
 // existing isolated published menu; client interest/entry calls remain mocked.
 test.info().annotations.push({type:'acceptance-fixture',description:JSON.stringify({origin,generation,source,reference})});return reference;
}
async function fixture(page:Page,human=true){
 const reference=restaurantFixture(),events:Interest[]=[],unexpectedWrites:string[]=[];
 await page.addInitScript(human=>{if(human)Object.defineProperty(navigator,'webdriver',{get:()=>false});localStorage.setItem('shida_statistics_consent_v1',JSON.stringify({choice:'declined',expires:Date.now()+86400000}));},human);
 await page.route('**/api/**',route=>{
  const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');
  if(path==='/api/shida/employment/session')return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Synthetic customer'}}});
  if(path==='/api/shida/statistics')return route.fulfill({status:204});
  if(path===`/api/shida/personal/restaurant-orders/establishments/${reference}/interest`){expect(request.method()).toBe('POST');events.push(request.postDataJSON());return route.fulfill({json:{recorded:human}});}
  if(path===`/api/shida/restaurant-guests/establishments/${reference}/entry`&&request.method()==='GET')return route.fulfill({json:{entry_context:'synthetic-read-only-entry',expires_at:'2099-01-01T00:00:00Z',methods:{pickup:{windows:[]}},copy:{}}});
  if(request.method()!=='GET')unexpectedWrites.push(path);return route.fulfill({status:404,json:{}});
 });
 const open=async(menu=false)=>{const response=await page.goto(`/shida/restaurants/${reference}/${menu?'menu/':''}`);expect(response?.ok()).toBe(true);await expect(page.locator('.restaurant-detail-header')).toBeVisible();await expect(page.locator('.website-statistics-control [role=status]')).toHaveText(t.off);await expect(page.locator('button[data-restaurant-item-open]').first()).toBeEnabled();};
 return {events,unexpectedWrites,open};
}
async function consent(page:Page,accepted:boolean){
 const preferences=page.getByRole('button',{name:t.settings,exact:true});await preferences.click();await expect(preferences).toHaveAttribute('aria-expanded','true');
 await page.getByRole('button',{name:accepted?t.accept:t.decline,exact:true}).click();await expect(page.locator('.website-statistics-control [role=status]')).toHaveText(accepted?t.on:t.off);
}
async function quiet(events:Interest[],count:number){
 // A negative observation window must exceed RestaurantInterest's 1000ms dwell.
 // This polls the assertion, rather than sleeping to guess hydration readiness.
 const until=Date.now()+1200;await expect.poll(()=>({elapsed:Date.now()>=until,count:events.length}),{intervals:[100],timeout:3000}).toEqual({elapsed:true,count});
}

test('public viewing requires visible human interaction; item details are distinct from menu impressions',async({page})=>{
 const {events,unexpectedWrites,open}=await fixture(page);await open();await quiet(events,0);
 await consent(page,true);await page.locator('.restaurant-detail-header h1').click();await expect.poll(()=>events.some(e=>e.kind==='profile_opens')).toBe(true);
 expect(events.filter(e=>e.kind==='item_views')).toHaveLength(0);
 const opener=page.locator('button[data-restaurant-item-open]').first();await opener.click();const detail=page.locator('dialog[open][data-restaurant-item-view]');await expect(detail).toBeVisible();
 await expect.poll(()=>events.filter(e=>e.kind==='item_views').length).toBe(1);
 const ref=await detail.getAttribute('data-restaurant-item-view');expect(events.find(e=>e.kind==='item_views')?.item_ref).toBe(ref);
 await detail.getByRole('button',{name:'Close',exact:true}).click();await opener.click();await expect(detail).toBeVisible();
 const count=events.length;await quiet(events,count);expect(events.filter(e=>e.kind==='item_views')).toHaveLength(1);expect(unexpectedWrites).toEqual([]);
});
test('automated browser traffic is excluded even when it clicks',async({page})=>{
 const {events,unexpectedWrites,open}=await fixture(page,false);expect(await page.evaluate(()=>navigator.webdriver)).toBe(true);
 await open();await consent(page,true);await page.locator('.restaurant-detail-header h1').click();await quiet(events,0);expect(unexpectedWrites).toEqual([]);
});

test('declining and revoking optional interest keeps menu and basket actions available',async({page})=>{
 const {events,unexpectedWrites,open}=await fixture(page);await open(true);await consent(page,false);
 const opener=page.locator('button[data-restaurant-item-open]').first();await expect(opener).toBeEnabled();await opener.click();
 const add=page.locator('dialog[open] button[data-restaurant-item-selection]');await expect(add).toBeEnabled();await add.click();await expect(page.locator('.rst-sticky-basket')).toBeVisible();
 await expect(page.locator('.rst-basket-lines li')).toHaveCount(1);await quiet(events,0);
 await consent(page,true);await consent(page,false);const after=events.length;
 await expect(opener).toBeEnabled();await opener.click();await expect(add).toBeEnabled();await add.click();await expect(page.locator('.rst-sticky-basket')).toBeVisible();
 await quiet(events,after);expect(unexpectedWrites).toEqual([]);
});
