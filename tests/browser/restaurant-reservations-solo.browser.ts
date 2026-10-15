import {test,expect,type Page} from '@playwright/test';
import {managementNavigation} from './restaurant-management-navigation';

const zone='Africa/Kinshasa';
const local=(offset:number)=>{const at=new Date(Date.now()+offset*86400000);const p=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(at);const v=(key:string)=>p.find(x=>x.type===key)?.value;return `${v('year')}-${v('month')}-${v('day')}`;};
const iso=(date:string,hour=18)=>`${date}T${String(hour).padStart(2,'0')}:00:00+01:00`;
const base=(ref:string,date:string,state:string,revision=1)=>({reservation_ref:ref,establishment_ref:'RST_RES_TEST',establishment_name:'Solo seated venue',state,revision,starts_at:iso(date,ref==='RRS_TODAY'?8:18),timezone_name:zone,party_size:ref==='RRS_TODAY'?2:3,response_deadline:iso(date,7),overlapping_requests:0});
const labels={en:'Reservations',fr:'Réservations',ln:'Ba réservation',sw:'Nafasi zilizohifadhiwa'};
async function setup(page:Page,{eligible=true,closed=false,fail=false,failFirstPost=false}={}) {
 const today=local(0),tomorrow=local(1),yesterday=local(-1);
 let rows=[base('RRS_PENDING',tomorrow,'pending'),base('RRS_TODAY',today,'accepted'),base('RRS_PAST',yesterday,'completed')];
 let posts=0,refreshed=0,failRead=fail;const keys:string[]=[];
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),p=url.pathname.replace(/\/$/,''),method=route.request().method();
  const json=(value:unknown)=>route.fulfill({json:value});
  if(p.endsWith('/employment/session'))return json({user:{display_name:'Owner'},binding:'a'.repeat(64)});
  if(p.endsWith('/capabilities'))return json({capabilities:[{capability:'restaurant.reservations',available:eligible}]});
  if(p.endsWith('/restaurants'))return json({items:[{public_ref:'RST_RES_TEST',revision:'v1',status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','hours','preview'],profile:{name:'Solo seated venue',food_business_type:'malewa',service_modes:eligible?'eat_there':'takeaway',timezone_name:zone}}],total:1,page:1,page_size:20,actions:['create']});
  if(p.endsWith('/RST_RES_TEST'))return json({public_ref:'RST_RES_TEST',revision:'v1',status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','hours','preview'],profile:{name:'Solo seated venue',food_business_type:'malewa',service_modes:eligible?'eat_there':'takeaway',timezone_name:zone}});
  if(p.endsWith('/reservations/setting'))return json({enabled:!closed,available:!closed&&eligible,revision:1});
  if(p.includes('/reservations/')&&method==='POST'){posts++;keys.push(JSON.parse(route.request().postData()||'{}').operation_key);if(failFirstPost&&posts===1)return route.fulfill({status:503,json:{detail:'unavailable'}});const ref=p.split('/').at(-2),action=p.split('/').at(-1);const state={accept:'accepted',reject:'rejected',cancel:'cancelled',arrive:'arrived',complete:'completed'}[action||'']||'pending';rows=rows.map(row=>row.reservation_ref===ref?{...row,state,revision:row.revision+1}:row);return json(rows.find(row=>row.reservation_ref===ref));}
  if(p.endsWith('/reservations/pending'))return json({items:rows.filter(row=>row.state==='pending'),has_more:false,timezone_name:zone});
  if(p.endsWith('/reservations/calendar'))return json({items:rows.filter(row=>row.starts_at.slice(0,10)>=url.searchParams.get('date_from')!&&row.starts_at.slice(0,10)<url.searchParams.get('date_to')!),has_more:false,timezone_name:zone});
  if(p.endsWith('/reservations')){refreshed++;if(failRead){failRead=false;return route.fulfill({status:503,json:{detail:'unavailable'}});}return json({items:rows,has_more:false,page:1,page_size:50});}
  if(p.includes('/reservations/RRS_'))return json(rows.find(row=>p.endsWith('/'+row.reservation_ref)));
  return route.fulfill({status:404,json:{detail:'unseeded'}});
 });
 return {get posts(){return posts;},get refreshed(){return refreshed;},keys,rows:()=>rows,failNext:()=>{failRead=true;}};
}
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,820,1440])test(`reservation list and planning ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});const fixture=await setup(page);
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/seller/restaurants/`);
 await managementNavigation(page,labels[locale]);
 await expect(page.locator('.rst-reservations')).toBeVisible();
 await expect(page.locator('.rst-res-row').filter({hasText:'RRS_PENDING'})).toBeVisible();
 await expect(page.locator('.rst-res-row').filter({hasText:'RRS_TODAY'})).toBeVisible();
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 await page.screenshot({path:`docs/evidence/restaurant-reservations-2026-10-15/after-${locale}-${width}.png`,fullPage:true});
 await page.locator('.rst-res-row').filter({hasText:'RRS_PENDING'}).getByRole('button',{name:locale==='fr'?'Accepter':locale==='ln'?'Ndima':locale==='sw'?'Kubali':'Accept',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('dialog').getByRole('button').last().click();
 await expect(page.locator('.rst-res-row').filter({hasText:'RRS_PENDING'}).first()).toContainText(locale==='fr'?'Acceptée':locale==='ln'?'Endimami':locale==='sw'?'Imekubaliwa':'Accepted');
 expect(fixture.posts).toBe(1);
 await page.locator('.rst-res-header').getByRole('button').click();
 await page.locator('.rst-res-view').getByRole('button',{name:locale==='fr'?'Calendrier':locale==='ln'?'Manaka':locale==='sw'?'Kalenda':'Calendar'}).click();
 await expect(page.locator('.shida-calendar')).toBeVisible();
 await expect(page.locator('.shida-cal-agenda')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('reservation decline, filters, failure, closed intake and walk-in eligibility',async({page})=>{
 await page.setViewportSize({width:390,height:844});const fixture=await setup(page);
 await page.goto('/shida/seller/restaurants/');await managementNavigation(page,'Reservations');
 await expect(page.locator('.rst-res-row').filter({hasText:'RRS_PENDING'})).toBeVisible();
 fixture.failNext();await page.locator('.rst-res-header').getByRole('button').click();
 await expect(page.locator('.rst-reservations [role=alert]')).toContainText('Could not load reservations');
 await page.locator('.rst-res-header').getByRole('button').click();
 await expect(page.locator('.rst-res-row').filter({hasText:'RRS_PENDING'})).toBeVisible();
 await page.getByRole('searchbox',{name:'Search reference'}).fill('RRS_PAST');
 await expect(page.locator('.rst-res-row')).toHaveCount(1);
 await page.getByRole('button',{name:'Clear filters'}).click();
 await page.locator('.rst-res-row').filter({hasText:'RRS_PENDING'}).getByRole('button',{name:'Decline'}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Decline'}).click();
 await expect(page.locator('.rst-res-row').filter({hasText:'RRS_PENDING'}).first()).toContainText('Rejected');
 expect(fixture.posts).toBe(1);
});
test('closed intake keeps history and walk-in profile shows eligibility steps',async({page})=>{
 await page.setViewportSize({width:390,height:844});await setup(page,{eligible:false,closed:true});
 await page.goto('/shida/seller/restaurants/');await managementNavigation(page,'Reservations');
 await expect(page.locator('.rst-res-intake')).toContainText('Seated service');
 await expect(page.locator('.rst-res-row').filter({hasText:'RRS_PAST'})).toBeVisible();
 await expect(page.locator('.rst-res-intake').getByRole('button',{name:'Open establishment settings'})).toBeVisible();
 await expect(page.locator('.rst-res-intake').getByRole('button',{name:'Accept reservation requests'})).toHaveCount(0);
});
test('uncertain response retries the exact operation key',async({page})=>{
 await page.setViewportSize({width:390,height:844});const fixture=await setup(page,{failFirstPost:true});
 await page.goto('/shida/seller/restaurants/');await managementNavigation(page,'Reservations');
 await page.getByRole('region',{name:'Requests to answer'}).getByRole('button',{name:'Accept',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Accept'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.getByText('Response uncertain.')).toBeVisible();
 await page.getByRole('dialog').getByRole('button',{name:'Accept'}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 expect(fixture.posts).toBe(2);expect(fixture.keys[0]).toBe(fixture.keys[1]);
});
test('existing arrival and completion actions remain available',async({page})=>{
 await page.setViewportSize({width:390,height:844});const fixture=await setup(page);
 await page.goto('/shida/seller/restaurants/');await managementNavigation(page,'Reservations');
 const today=page.getByRole('region',{name:'Today’s confirmed visits'});
 await today.getByRole('button',{name:'Record arrival'}).click();await page.getByRole('dialog').getByRole('button',{name:'Record arrival'}).click();
 await expect(today).toContainText('Arrival recorded');
 await today.getByRole('button',{name:'Complete visit'}).click();await page.getByRole('dialog').getByRole('button',{name:'Complete visit'}).click();
 await expect(page.locator('.rst-res-row').filter({hasText:'RRS_TODAY'}).first()).toContainText('Completed');
 expect(fixture.posts).toBe(2);
});
