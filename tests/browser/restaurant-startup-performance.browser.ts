import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {restaurantFixture} from './responsive-rollout-fixtures';

const at='2026-11-18T12:00:00Z';
export async function populatedTodayFixture(page:Page){
 await restaurantFixture(page);
 const rows=['pending','accepted','ready'].map((state,index)=>({order_ref:`ROD_STARTUP_${index}`,state,revision:1,submitted_at:at,fulfillment_method:'pickup',currency:'CDF',order_total:'3000',food_subtotal:'3000',delivery_fee:'0',entry_source:'web',channel:'online'}));
 const section=(key:string)=>({items:rows.filter(row=>key==='preparing'?row.state==='accepted':row.state===key),total:1,as_of:at,page:1,page_size:key==='preparing'?1:5});
 await page.route('**/today-orders/**',route=>route.fulfill({json:{version:1,intake_released:true,sections:Object.fromEntries(['pending','ready','preparing'].map(key=>[key,section(key)]))}}));
 await page.route('**/RST_0/orders/**',route=>{
  const states=new URL(route.request().url()).searchParams.getAll('states');
  const items=rows.filter(row=>!states.length||states.includes(row.state));
  return route.fulfill({json:{items,total:items.length,as_of:at,page:1,page_size:20}});
 });
 await page.route('**/service/daily/summary/**',route=>route.fulfill({json:{as_of:at,time_zone:'Africa/Kinshasa',currencies:{CDF:{recorded_net:'3000',balance_due:'1500'},USD:{recorded_net:'5',balance_due:'2'}}}}));
}

for(const profile of ['normal','mobile'] as const)test(`populated startup ${profile}`,async({browser})=>{
 const results:Record<string,unknown>[]=[];
 for(let sample=0;sample<3;sample++){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();await populatedTodayFixture(page);
  const delay=profile==='mobile'?600:80;
  await page.route('**/api/**',async route=>{await new Promise(resolve=>setTimeout(resolve,delay));await route.fallback();});
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
  if(profile==='mobile'){
   await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  }
  type Read={path:string;start:number;end?:number;status?:number;bytes?:number;type:string};
  const reads:Read[]=[],byRequest=new Map();
  page.on('request',request=>{const row={path:new URL(request.url()).pathname,start:Date.now(),type:request.resourceType()};reads.push(row);byRequest.set(request,row);});
  page.on('response',response=>{const row=byRequest.get(response.request());if(row)row.status=response.status();});
  page.on('requestfinished',async request=>{const row=byRequest.get(request);if(row){row.end=Date.now();try{row.bytes=(await request.sizes()).responseBodySize;}catch{}}});
  for(const visit of ['cold','routed-reload-cache-disabled','first-orders-opening']){
   const first=reads.length,start=Date.now();
   if(visit==='cold')await page.goto('/fr/shida/seller/restaurants/?establishment=RST_0&tab=today');
   else if(visit==='routed-reload-cache-disabled')await page.reload();
   else await page.locator('.management-mobile-nav').getByRole('button',{name:'Commandes',exact:true}).click();
   let usefulMs:number,actionMs:number;
   if(visit==='first-orders-opening'){
    await expect(page.locator('.rst-orders-screen')).toBeVisible();usefulMs=Date.now()-start;
    await expect(page.getByRole('button',{name:'Actualiser les commandes',exact:true})).toBeEnabled();actionMs=Date.now()-start;
   }else{
    await expect(page.locator('.rst-metric-incoming strong')).toHaveText('1');usefulMs=Date.now()-start;
    await expect(page.locator('.rst-ops-incomplete')).toHaveCount(0);
    await expect(page.locator('.rst-ops-work').getByRole('button',{name:'Voir la commande'}).first()).toBeEnabled();actionMs=Date.now()-start;
    await expect(page.locator('.rst-today-refresh')).toBeEnabled();
   }
   const settledMs=Date.now()-start;
   const failedSections=await page.locator('.rst-ops-error').allTextContents();
   await page.waitForTimeout(delay+100);
   const slice=reads.slice(first).map(row=>({...row,start:row.start-start,end:row.end?row.end-start:undefined}));
   results.push({sample,visit,usefulMs,actionMs,settledMs,failedSections,firstSessionRequestMs:slice.find(row=>row.path.endsWith('/employment/session/'))?.start,
    summaryRequestMs:slice.find(row=>row.path.endsWith('/today-orders/'))?.start,requests:slice.length,bytes:slice.reduce((sum,row)=>sum+(row.bytes??0),0),
    javascriptBytes:slice.filter(row=>row.type==='script').reduce((sum,row)=>sum+(row.bytes??0),0),cssBytes:slice.filter(row=>row.type==='stylesheet').reduce((sum,row)=>sum+(row.bytes??0),0),reads:slice});
  }
  await context.close();
 }
 const output=process.env.PERF_OUTPUT!;mkdirSync(output,{recursive:true});
 writeFileSync(`${output}/routed-populated-${profile}.json`,JSON.stringify({profile,samples:3,httpCache:'disabled by Playwright routing; reload is not a cached visit',apiFixtureDelay:profile==='mobile'?600:80,results},null,2));
});
