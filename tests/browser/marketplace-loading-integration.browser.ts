import {test,expect,type BrowserContext,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
const origin='https://localhost:3046';
const exchanges=new WeakMap<Page,{path:string;status:number}[]>();
test.beforeEach(async({page})=>{const rows:{path:string;status:number}[]=[];exchanges.set(page,rows);page.on('response',response=>{const path=new URL(response.url()).pathname;if(path.startsWith('/api/'))rows.push({path,status:response.status()});});});
test.afterEach(async({page},info)=>{await info.attach('safe-api-statuses',{body:JSON.stringify(exchanges.get(page)??[],null,2),contentType:'application/json'});});
function fixture(){
 const path=process.env.SHIDA_LOADING_PRIVATE_FIXTURE;
 if(path!=='C:/NIHILOBA/local-dev/acceptance-runtime/fixture-private.json')throw Error('Explicit owned fixture required');
 const value=JSON.parse(readFileSync(path,'utf8'));
 if(value.owner_uuid!=='2f654732-a44d-4755-99df-55a111aa50cf'||value.generation!=='51987dc09ff14327bfc222f9ddff9b14'||!value.personal?.token)throw Error('Fixture identity mismatch');
 return value;
}
async function signIn(context:BrowserContext){await context.addCookies([{name:'nihiloba_personal_session',value:fixture().personal.token,domain:'localhost',path:'/api/shida',httpOnly:true,secure:true,sameSite:'Lax'}]);}
async function get(page:Page,path:string){return page.evaluate(async path=>{const r=await fetch(path,{cache:'no-store'});return {status:r.status,cache:r.headers.get('cache-control'),body:await r.json()};},path);}

test('real Mon espace renders owned activity through the gateway and keeps client history',async({page,context},info)=>{
 await signIn(context);await page.setViewportSize({width:390,height:844});
 const requests:{path:string;status:number}[]=[],errors:string[]=[],documents:string[]=[];
 page.on('response',r=>{const url=new URL(r.url());if(url.pathname.startsWith('/api/'))requests.push({path:url.pathname,status:r.status()});});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.isNavigationRequest()&&r.resourceType()==='document')documents.push(r.url());});
 await page.goto(origin+'/fr/shida/space/?view=overview');await expect(page.locator('.activity-overview')).toBeVisible();
 await expect(page.locator('.activity-overview [role="status"]')).toHaveCount(0,{timeout:20000});await expect(page.locator('.activity-overview [role="alert"]')).toHaveCount(0);
 const restaurant=page.locator('.activity-overview a[href*="'+fixture().personal.establishment+'"]');await expect(restaurant).toBeVisible();
 const before=documents.length;await page.locator('.space-section-selector summary').click();await page.locator('.space-section-selector a[href$="view=profiles"]').click();await expect(page.locator('.my-profiles')).toBeVisible();
 await page.goBack();await expect(restaurant).toBeVisible();expect(documents.length).toBe(before);
 expect(requests.filter(r=>r.status>=500)).toEqual([]);expect(errors).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('real-space-mobile.png'),fullPage:true});await info.attach('gateway-results',{body:JSON.stringify({requests,documentCount:documents.length,errors},null,2),contentType:'application/json'});
});

test('real anonymous marketplace pages and private denial remain available',async({page},info)=>{
 const rows:{route:string;status:number|undefined;elapsedMs:number;title:string}[]=[];
 const errors:string[]=[],serverErrors:{path:string;status:number}[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=500)serverErrors.push({path:new URL(r.url()).pathname,status:r.status()});});
 for(const route of ['/fr/shida/emplois/','/fr/shida/services/?min_rating=4','/fr/shida/appartements/','/fr/shida/hotels/','/fr/shida/restaurants/','/fr/shida/wenze/','/fr/shida/meda/','/fr/shida/transport/']){
  const start=Date.now(),response=await page.goto(origin+route);
  await expect(page.locator('main')).toBeVisible();expect(response?.status()).toBe(200);
  await expect(page.locator('main [role="alert"]')).toHaveCount(0);
  rows.push({route,status:response?.status(),elapsedMs:Date.now()-start,title:await page.title()});
 }
 const denied=await get(page,'/api/shida/personal/security/navigation/');expect(denied.status).toBe(401);
 expect(errors).toEqual([]);expect(serverErrors).toEqual([]);
 await info.attach('public-local-smoke',{body:JSON.stringify({rows,privateDenied:denied.status,conditions:'Local dev compilation included; not production latency benchmark'},null,2),contentType:'application/json'});
});

test('real Personal Restaurant management preserves existing startup',async({page,context},info)=>{
 await signIn(context);await page.setViewportSize({width:390,height:844});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/fr/shida/seller/restaurants/?establishment='+fixture().personal.establishment+'&tab=today');
 await expect(page.locator('.rst-today-refresh')).toBeEnabled({timeout:30000});
 await expect(page.locator('.rst-ops-incomplete')).toHaveCount(0);await expect(page.locator('.rst-ops-error')).toHaveCount(0);
 expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('real-restaurant-mobile.png'),fullPage:true});
});

test('real other Personal management entries remain readable without creating records',async({page,context},info)=>{
 await signIn(context);await page.setViewportSize({width:390,height:844});
 const errors:string[]=[],responses:{path:string;status:number}[]=[],states:{route:string;headings:string[];records:number}[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{const path=new URL(r.url()).pathname;if(path.startsWith('/api/'))responses.push({path,status:r.status()});});
 for(const [route,ready,records] of [
  ['/fr/shida/seller/services/','.svc-provider-setup','.svc-service-row'],
  ['/fr/shida/appartements/mes-logements/','.apt-publish button','.apt-owner-card'],
  ['/fr/shida/space/?view=listings&tab=meda','.my-listings','.meda-listing-row'],
 ] as const){
  const medaRead=route.includes('tab=meda')?page.waitForResponse(r=>new URL(r.url()).pathname==='/api/shida/personal/meda/listings/'):null;
  await page.goto(origin+route);await expect(page.locator(ready)).toBeVisible({timeout:30000});
  if(medaRead)expect((await medaRead).status()).toBe(200);
  if(route.includes('mes-logements'))await expect(page.locator(ready)).toBeEnabled();
  await expect(page.locator('main [role="alert"]')).toHaveCount(0);
  states.push({route,headings:await page.locator('main h1, main h2').allTextContents(),records:await page.locator(records).count()});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(errors).toEqual([]);expect(responses.filter(r=>r.status>=500)).toEqual([]);
 await info.attach('management-entry-states',{body:JSON.stringify({states,responses,limits:'Existing fixture only; Services setup and empty entries do not prove managed transactions.'},null,2),contentType:'application/json'});
});
