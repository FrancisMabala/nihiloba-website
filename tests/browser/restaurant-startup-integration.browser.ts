import {test,expect} from '@playwright/test';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

// No Playwright routing: real Next gateway -> isolated HTTPS FastAPI -> PostgreSQL.
// Cookie values exist only in the disposable fixture manifest and browser context.
const workspace=process.env.SHIDA_STARTUP_FIXTURE_WORKSPACE??JSON.parse(readFileSync('C:/NIHILOBA/meda-backend/logs/restaurant-startup-integration-workspace.json','utf8')).workspace;
const fixtures=JSON.parse(readFileSync(join(workspace,'fixture-private.json'),'utf8'));
const output=process.env.PERF_OUTPUT;
if(!output)throw new Error('PERF_OUTPUT is required');
type Read={url:string;type:string;start:number;end?:number;status?:number;bytes?:number;cache?:boolean};

test('real populated Restaurant startup: cold and HTTP-cached repeat',async({browser})=>{
 const samples=[];
 for(let sample=0;sample<3;sample++){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',hasTouch:true});
  await context.addCookies([{name:'nihiloba_personal_session',value:fixtures.personal.token,domain:'127.0.0.1',path:'/api/shida',httpOnly:true,secure:false,sameSite:'Lax'}]);
  const page=await context.newPage(),cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const reads:Read[]=[],index=new Map<string,Read>();
  cdp.on('Network.requestWillBeSent',event=>{
   const url=new URL(event.request.url);if(!['http:','https:'].includes(url.protocol))return;
   const row={url:url.pathname,type:event.type??'Other',start:Date.now()};index.set(event.requestId,row);reads.push(row);
  });
  cdp.on('Network.responseReceived',event=>{const row=index.get(event.requestId);if(row){row.status=event.response.status;row.cache=row.cache||!!event.response.fromDiskCache||!!event.response.fromPrefetchCache;}});
  cdp.on('Network.requestServedFromCache',event=>{const row=index.get(event.requestId);if(row)row.cache=true;});
  cdp.on('Network.loadingFinished',event=>{const row=index.get(event.requestId);if(row){row.bytes=event.encodedDataLength;row.end=Date.now();}});
  const route=`/fr/shida/seller/restaurants/?establishment=${fixtures.personal.establishment}&tab=today`;
  for(const visit of ['cold','http-cached-repeat'] as const){
   const start=Date.now(),offset=reads.length;
   if(visit==='cold')await page.goto(route);else await page.reload();
   await expect(page.locator('.rst-metric-incoming strong')).toHaveText('1',{timeout:45000});const usefulMs=Date.now()-start;
   await expect(page.locator('.rst-ops-work').first()).toBeVisible();
   await expect(page.locator('.rst-ops-incomplete')).toHaveCount(0,{timeout:45000});const actionMs=Date.now()-start;
   await expect(page.locator('.rst-ops-work').first().getByRole('button')).toBeEnabled();
   await expect(page.locator('.rst-today-refresh')).toBeEnabled({timeout:45000});const settlementMs=Date.now()-start;
   const failedSections=await page.locator('.rst-ops-error').count();
   await page.waitForTimeout(250);
   const captured=reads.slice(offset).map(row=>({...row,start:row.start-start,end:row.end===undefined?undefined:row.end-start}));
   expect(captured.filter(row=>row.url.startsWith('/api/')).every(row=>row.status===200)).toBe(true);
   const session=captured.find(row=>row.url==='/api/shida/employment/session/');
   const js=captured.filter(row=>row.type==='Script'),css=captured.filter(row=>row.type==='Stylesheet');
   const sum=(rows:Read[])=>rows.reduce((n,row)=>n+(row.bytes??0),0);
   samples.push({sample,visit,sessionStartMs:session?.start,usefulMs,actionMs,settlementMs,failedSections,
    requestCount:captured.length,networkBytes:sum(captured),javascript:{requests:js.length,networkBytes:sum(js),cached:js.filter(row=>row.cache).length},css:{requests:css.length,networkBytes:sum(css),cached:css.filter(row=>row.cache).length},reads:captured});
   writeFileSync(join(output!,'real-mobile-restaurant.json'),JSON.stringify({conditions:{viewport:[390,844],latencyMs:150,downloadBytesPerSecond:200000,uploadBytesPerSecond:93750,cpuRate:4,apiMock:false,httpCaching:true},samples},null,2));
   if(visit==='http-cached-repeat')expect(js.filter(row=>row.cache).length).toBeGreaterThan(0);
   if(sample===0&&visit==='cold')await page.screenshot({path:join(output!,'real-startup-mobile.png'),fullPage:true});
  }
  const started=Date.now(),offset=reads.length;
  await page.locator('.management-mobile-nav').getByRole('button',{name:'Commandes',exact:true}).click();
  await expect(page.locator('.rst-orders-screen')).toBeVisible();
  await expect(page.getByRole('button',{name:'Actualiser les commandes',exact:true})).toBeEnabled();
  await expect(page.locator('.rst-orders-screen')).toContainText('Commande n° 003');
  samples.push({sample,visit:'first-orders-open',settlementMs:Date.now()-started,reads:reads.slice(offset).map(row=>({...row,start:row.start-started,end:row.end===undefined?undefined:row.end-started}))});
  await context.close();
 }
 mkdirSync(output!,{recursive:true});writeFileSync(join(output!,'real-mobile-restaurant.json'),JSON.stringify({conditions:{viewport:[390,844],latencyMs:150,downloadBytesPerSecond:200000,uploadBytesPerSecond:93750,cpuRate:4,apiMock:false,httpCaching:true},samples},null,2));
});
