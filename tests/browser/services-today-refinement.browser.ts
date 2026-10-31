import {test,expect,type Page} from '@playwright/test';
import {servicesProviderOffering} from './fixtures/services-provider';
import {todayCopy} from '../../app/lib/services-today-copy';
import fs from 'node:fs';
async function fixture(page:Page,{empty=false,appointments=true,fail=false,calendarFail=false,locale='en',slow=false,fullFail=false}:{empty?:boolean;appointments?:boolean;fail?:boolean;calendarFail?:boolean;locale?:string;slow?:boolean;fullFail?:boolean}={}){
 let failed=fail;const requests:string[]=[];
 await page.addInitScript(lang=>localStorage.setItem('shida-language',lang),locale);
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');requests.push(path);
  if(route.request().method()!=='GET')throw Error('Unexpected write');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Fixture Provider'}});
  if(path.endsWith('/capabilities'))return reply({capabilities:['profile','reservations','messages','structured_availability','requests_quotes']});
  if(path.endsWith('/services'))return reply({profiles:[{...servicesProviderOffering,booking_mode:appointments?'time_slots':'flexible'},{...servicesProviderOffering,public_ref:'SVC_two',service_name:'Photography',category:'photo_video',booking_mode:'flexible'}]});
  if(path.endsWith('/reviews'))return reply({reviews:[]});
  if(fullFail)return reply({},503);
  const queue={items:[],has_more:false};
  if(path.endsWith('/today')){if(slow)await new Promise(resolve=>setTimeout(resolve,1800));if(failed)return reply({},503);return reply({date:'2026-10-31',timezone:'Africa/Kinshasa',requests:empty?queue:{items:[{request_ref:'SWR_one',offering:'Repair request',requester:'Test customer',status:'SUBMITTED',expires_at:'2026-11-01T10:00:00Z'}],has_more:false},pending:queue,upcoming:queue,messages:queue});}
  if(path.endsWith('/calendar')){if(calendarFail)return reply({},503);return reply({items:empty||!appointments?[]:[{reference:'RSV_one',title:'Scheduled repair',startsAt:'2026-10-31T10:00:00+01:00',status:'confirmed'},{reference:'RSV_boundary',title:'Midnight appointment',startsAt:'2026-10-30T23:30:00Z',status:'accepted'},{reference:'RSV_closed',title:'PRIVATE completed',startsAt:'2026-10-31T11:00:00Z',status:'completed'}],has_more:false});}
  if(path.endsWith('/transactions/reservations'))return reply({reservations:empty?[]:[{reservation_ref:'RSV_one',service_name:'Scheduled repair',status:'confirmed'},{reservation_ref:'RSV_two',service_name:'Active cleaning',status:'in_progress'},{reservation_ref:'RSV_done',service_name:'PRIVATE completed',status:'completed'}]});
  if(path.endsWith('/postings/available'))return reply({requests:empty?[]:[{posted_ref:'SPR_one',status:'OPEN',created_at:'2026-10-31T09:00:00Z',summary:{category:'repair_maintenance',city:'Kinshasa',commune:'Gombe'}}]});
  if(path.endsWith('/requests/SWR_one'))return reply({request_ref:'SWR_one',offering:'Repair request',requester:'Test customer',status:'SUBMITTED',actions:['review'],revision:1});
  if(path.endsWith('/transactions/requests'))return reply({requests:[],has_more:false});
  if(path.endsWith('/quotes'))return reply({quotes:[],has_more:false});
  return reply({},404);
 });return {recover:()=>{failed=false;},requests};
}
for(const width of [360,390,768,1024,1440])test(`Today populated ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await fixture(page);await page.goto('/shida/seller/services');
 await expect(page.getByRole('heading',{name:'Needs your attention'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Scheduled repair',exact:true})).toHaveCount(0);
 await expect(page.locator('.svc-daily-schedule').getByText('Scheduled repair')).toBeVisible();
 await expect(page.locator('.svc-daily-kpis').getByText('Published services')).toBeVisible();
 await expect(page.locator('.svc-daily-kpis').getByText('Work in progress')).toBeVisible();
 await expect(page.locator('.svc-daily-opportunities').getByText('Kinshasa · Gombe')).toBeVisible();
 await expect(page.getByText('PRIVATE completed')).toHaveCount(0);
 const attention=await page.locator('.svc-daily-attention').boundingBox(),schedule=await page.locator('.svc-daily-schedule').boundingBox();expect(attention!.y).toBeLessThanOrEqual(schedule!.y);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 fs.mkdirSync('docs/evidence/services-today',{recursive:true});await page.screenshot({path:`docs/evidence/services-today/populated-${width}.png`,fullPage:true});
 await page.locator('.svc-daily-attention').getByRole('button',{name:'Open request Repair request'}).click();await expect(page.locator('.services-transactions').getByRole('heading',{name:'Repair request',exact:true})).toBeVisible();
});
for(const locale of ['en','fr','ln','sw'] as const)test(`Today empty honest ${locale}`,async({page})=>{
 await page.setViewportSize({width:390,height:950});await fixture(page,{empty:true,appointments:false,locale});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services`);
 await expect(page.getByText(todayCopy[locale].clear,{exact:true})).toBeVisible();await expect(page.getByText(todayCopy[locale].noOpportunities,{exact:true})).toBeVisible();await expect(page.locator('.svc-daily-schedule')).toHaveCount(0);await expect(page.getByText(todayCopy[locale].loading,{exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`docs/evidence/services-today/empty-${locale}-390.png`,fullPage:true});
});
test('Today partial failure and recovery',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});const state=await fixture(page,{fail:true});await page.goto('/shida/seller/services');await expect(page.locator('.svc-daily-attention').getByRole('alert')).toBeVisible();await expect(page.locator('.svc-daily-schedule').getByText('Scheduled repair')).toBeVisible();await expect(page.getByText('Everything is up to date',{exact:true})).toHaveCount(0);await page.screenshot({path:'docs/evidence/services-today/partial-error.png',fullPage:true});state.recover();await page.locator('.svc-daily-banner').getByRole('button',{name:'Refresh'}).click();await expect(page.locator('.svc-daily-attention').getByRole('heading',{name:'Repair request',exact:true})).toBeVisible();
});
test('Today retains unavailable appointment capability and loading skeleton',async({page})=>{
 await fixture(page,{calendarFail:true,slow:true});await page.goto('/shida/seller/services');await expect(page.locator('.svc-daily-attention [role=status]')).toBeVisible();await page.screenshot({path:'docs/evidence/services-today/loading.png',fullPage:true});await expect(page.locator('.svc-daily-schedule').getByRole('alert')).toBeVisible();await expect(page.locator('.svc-daily-attention').getByRole('heading',{name:'Repair request',exact:true})).toBeVisible();await expect(page.locator('.svc-daily-kpis').getByText('Unavailable',{exact:true})).toBeVisible();
});
test('Today appointment empty state and active work details',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await fixture(page,{empty:true});await page.goto('/shida/seller/services');await expect(page.getByText('No appointments scheduled for today',{exact:true})).toBeVisible();await expect(page.getByText('Everything is up to date',{exact:true})).toBeVisible();await page.screenshot({path:'docs/evidence/services-today/empty-appointments-1440.png',fullPage:true});
});
test('Today active work and opportunity category selection',async({page})=>{
 await page.setViewportSize({width:390,height:950});const state=await fixture(page);await page.goto('/shida/seller/services');await page.locator('.svc-daily-active summary').click();await expect(page.getByRole('heading',{name:'Active cleaning'})).toBeVisible();await page.screenshot({path:'docs/evidence/services-today/active-work-390.png',fullPage:true});await page.locator('.svc-daily-opportunities select').selectOption('SVC_two');await expect.poll(()=>state.requests.filter(path=>path.endsWith('/postings/available')).length).toBeGreaterThan(1);
});

test('Today full daily-data failure preserves navigation and never shows all clear',async({page})=>{
 await page.setViewportSize({width:390,height:950});await fixture(page,{fullFail:true});await page.goto('/shida/seller/services');await expect(page.locator('.svc-daily-attention').getByRole('alert')).toBeVisible();await expect(page.locator('.svc-daily-schedule').getByRole('alert')).toBeVisible();await expect(page.getByText('Everything is up to date',{exact:true})).toHaveCount(0);await expect(page.locator('.svc-daily-kpis').getByText('Unavailable',{exact:true})).toHaveCount(3);await expect(page.getByRole('navigation',{name:'Provider navigation'})).toBeVisible();await page.screenshot({path:'docs/evidence/services-today/full-error-390.png',fullPage:true});
});
