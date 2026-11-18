import {test,expect,type Page,type Locator} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {workPilotFixture} from './fixtures/services-work-pilot';
import {authDesignCopy} from '../../app/lib/auth-design-copy';
import {personalLoginCopy} from '../../app/lib/personal-login-copy';
import {restaurantFixture} from './responsive-rollout-fixtures';

const output=process.env.PERF_OUTPUT!;
const meda={reference:'MED_fixture',status:'published',title:'Stockholm → Paris · 10 kg',side:'offer',category:'luggage',origin_country:'SE',origin_city:'Stockholm',destination_country:'FR',destination_city:'Paris',departure_at:'2027-02-20T14:00:00Z',deadline_at:'2027-02-19T14:00:00Z',capacity:'10',unit:'kg',description:'Synthetic books.',price:'8',currency:'EUR',price_basis:'kg'};
async function fixture(page:Page,journey:string){
 const auth={loggedIn:true};
 await page.addInitScript(()=>{window.open=()=>null;});
 if(journey==='services')await workPilotFixture(page);
 else if(journey==='restaurant')await restaurantFixture(page);
 else await page.route('**/api/shida/**',route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session')&&!auth.loggedIn)return reply({},401);
  if(path==='/api/shida/personal/auth/whatsapp')return reply({challenge_ref:'DWC_fixture',expires_at:new Date(Date.now()+300000).toISOString(),whatsapp_url:'https://wa.me/243000000000?text=synthetic-not-sent'},201);
  if(path.endsWith('/auth/whatsapp/DWC_fixture/session')){if(route.request().postDataJSON()?.code!=='610294')return reply({error:{code:'invalid_code'}},400);auth.loggedIn=true;return reply({authenticated:true});}
  if(path.endsWith('/auth/whatsapp/DWC_fixture'))return reply({status:'verified'});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Synthetic Visitor'}});
  if(path.endsWith('/meda/discovery'))return reply({items:[meda],page:1,has_more:false});
  if(path.endsWith('/meda/discovery/MED_fixture'))return reply(meda);
  if(path.endsWith('/security/navigation'))return reply({can_manage:true,markets:[],organization_management:false,activity_counts:{},travel_profiles:[]});
  if(path.includes('/wenze/stores'))return reply({stores:[]});
  if(path.endsWith('/services'))return reply({profiles:[]});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:[]});
  if(path.endsWith('/restaurants'))return reply({items:[],total:0,actions:[]});
  if(path.endsWith('/job-offer'))return reply({rows:[]});
  if(path.endsWith('/apartments/manage'))return reply({items:[],has_more:false});
  if(path.endsWith('/restaurant-orders'))return reply({items:[]});
  if(path.endsWith('/wenze-buyer/orders'))return reply({orders:[],total:0});
  return reply({items:[],profiles:[],requests:[],reservations:[],threads:[],has_more:false,unread:0});
 });
 return auth;
}
for(const profile of ['normal','mobile'] as const)for(const journey of ['public','space','restaurant','services','meda'])test(`${profile} ${journey}`,async({browser})=>{
 const results:Record<string,unknown>[]=[];
 for(let sample=0;sample<3;sample++){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();
  const auth=await fixture(page,journey);
  const delay=profile==='mobile'?600:80;
  await page.route('**/api/**',async route=>{await new Promise(resolve=>setTimeout(resolve,delay));await route.fallback();});
  // Protect the fixture from third-party writes and real messaging.
  await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:3044'?route.fallback():route.abort());
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
  if(profile==='mobile'){
   await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  }
  const requests:{url:string;start:number;end?:number;status?:number;bytes?:number}[]=[];
  const map=new Map();
  page.on('request',req=>{const row={url:new URL(req.url()).pathname,start:Date.now()};map.set(req,row);requests.push(row);});
  page.on('response',response=>{const row=map.get(response.request());if(row)row.status=response.status();});
  page.on('requestfinished',async req=>{const row=map.get(req);if(row){row.end=Date.now();try{row.bytes=(await req.sizes()).responseBodySize;}catch{}}});
  const route=journey==='public'?'/fr/shida/restaurants/':journey==='space'?'/fr/shida/space/':journey==='restaurant'?'/fr/shida/seller/restaurants/?establishment=RST_0&tab=today':journey==='services'?'/fr/shida/seller/services?view=work':'/fr/shida/meda/';
  const ready=()=>journey==='public'?page.getByRole('link',{name:/Test Malewa/}).first():journey==='space'?page.getByRole('heading',{name:'Mes activités',exact:true}):journey==='restaurant'?page.locator('.rst-metric-incoming strong').getByText('0',{exact:true}):journey==='services'?page.locator('.svc-client-work'):page.locator('.meda-result h2');
  async function measure(visit:string,action:()=>Promise<unknown>,useful:()=>Locator){
   const first=requests.length,start=Date.now();await action();await expect(useful()).toBeVisible();const usefulMs=Date.now()-start;
   const controls=page.locator('main button:visible:not(:disabled),main a:visible').first();if(await controls.count())await expect(controls).toBeEnabled();
   if(journey==='restaurant'&&visit!=='navigation')await expect(page.locator('.rst-today-refresh')).toBeEnabled();
   if(journey==='services')await expect(page.locator(visit==='navigation'?'.svc-planner-toolbar button[aria-busy]':'.svc-work-filters button[aria-busy]')).toBeEnabled();
   if(journey==='restaurant'&&visit==='navigation')await expect(page.getByRole('button',{name:'Actualiser les commandes',exact:true})).toBeEnabled();
   const usableMs=Date.now()-start;await page.waitForTimeout(delay+100);
   const reads=requests.slice(first).map(row=>({...row,start:row.start-start,end:row.end?row.end-start:undefined}));
   results.push({sample,visit,usefulMs,usableMs,requests:reads.length,bytes:reads.reduce((sum,row)=>sum+(row.bytes??0),0),sessionReads:reads.filter(row=>row.url.endsWith('/employment/session/')).length,reads});
  }
  await measure('first',()=>page.goto(route),ready);
  await measure('repeat',()=>page.reload(),ready);
  if(journey==='public')await measure('navigation',()=>ready().click(),()=>page.getByRole('heading',{name:'Test Malewa',exact:true}).first());
  if(journey==='space')await measure('navigation',async()=>{await page.locator('.space-section-selector summary').click();await page.locator('.space-section-selector a[href$="view=settings"]').click();},()=>page.locator('.account-settings-page'));
  if(journey==='restaurant')await measure('navigation',()=>page.locator('.management-mobile-nav').getByRole('button',{name:'Commandes',exact:true}).click(),()=>page.locator('.rst-orders-screen'));
  if(journey==='services')await measure('navigation',()=>page.locator('.management-mobile-nav').getByRole('button',{name:'Calendrier',exact:true}).click(),()=>page.locator('.svc-planner'));
  if(journey==='meda')await measure('navigation',()=>page.locator('.meda-card button').first().click(),()=>page.locator('.meda-detail'));
  if(journey==='space'){
   auth.loggedIn=false;await page.goto('/fr/shida/space/');
   await page.getByRole('button',{name:authDesignCopy.fr.whatsapp,exact:true}).click();
   await page.getByLabel(personalLoginCopy.fr.codeLabel).fill('610294');
   await measure('sign-in',()=>page.getByRole('button',{name:authDesignCopy.fr.verify,exact:true}).click(),()=>page.getByRole('heading',{name:'Mes activités',exact:true}));
  }
  await context.close();
 }
 mkdirSync(output,{recursive:true});writeFileSync(`${output}/${profile}-${journey}.json`,JSON.stringify({profile,journey,apiFixtureDelay:profile==='mobile'?600:80,results},null,2));
});
