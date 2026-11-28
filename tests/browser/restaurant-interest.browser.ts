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
 await page.addInitScript(human=>{if(human)Object.defineProperty(navigator,'webdriver',{get:()=>false});localStorage.setItem('shida_statistics_consent_v1',JSON.stringify({choice:'accepted',expires:Date.now()+86400000}));},human);
 await page.route('**/api/**',route=>{
  const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');
  if(path==='/api/shida/employment/session')return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Synthetic customer'}}});
  if(path==='/api/shida/statistics')return route.fulfill({status:204});
  if(path===`/api/shida/personal/restaurant-orders/establishments/${reference}/interest`){expect(request.method()).toBe('POST');events.push(request.postDataJSON());return route.fulfill({json:{recorded:human}});}
  if(path===`/api/shida/restaurant-guests/establishments/${reference}/entry`&&request.method()==='GET')return route.fulfill({json:{entry_context:'synthetic-read-only-entry',expires_at:'2099-01-01T00:00:00Z',methods:{pickup:{windows:[]}},copy:{}}});
  if(request.method()!=='GET')unexpectedWrites.push(path);return route.fulfill({status:404,json:{}});
 });
 const open=async(menu=false)=>{const response=await page.goto(`/shida/restaurants/${reference}/${menu?'menu/':''}`);expect(response?.ok()).toBe(true);await expect(page.locator('.restaurant-detail-header')).toBeVisible();await expect(page.locator('.website-statistics-control [role=status]')).toHaveText(t.blocked);await expect(page.locator('button[data-restaurant-item-open]').first()).toBeEnabled();};
 return {events,unexpectedWrites,open};
}
async function quiet(events:Interest[],count:number){
 // A negative observation window must exceed RestaurantInterest's 1000ms dwell.
 // This polls the assertion, rather than sleeping to guess hydration readiness.
 const until=Date.now()+1200;await expect.poll(()=>({elapsed:Date.now()>=until,count:events.length}),{intervals:[100],timeout:3000}).toEqual({elapsed:true,count});
}

test('paused optional interest keeps menu and mobile sticky basket actions available',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const {events,unexpectedWrites,open}=await fixture(page);await open(true);
 const opener=page.locator('button[data-restaurant-item-open]').first();await expect(opener).toBeEnabled();await opener.click();
 const add=page.locator('dialog[open] button[data-restaurant-item-selection]');await expect(add).toBeEnabled();await add.click();await expect(page.locator('.rst-sticky-basket')).toBeVisible();
 await expect(page.locator('.rst-basket-lines li')).toHaveCount(1);await quiet(events,0);
 const after=events.length;
 await expect(opener).toBeEnabled();await opener.click();await expect(add).toBeEnabled();await add.click();await expect(page.locator('.rst-sticky-basket')).toBeVisible();
 await quiet(events,after);expect(unexpectedWrites).toEqual([]);
});
