import QRCode from 'qrcode';
import {test,expect,type Page} from '@playwright/test';
import {scheduleCopy} from '../../app/lib/services-calendar-copy';
import {calendarCopy,localDate} from '../../app/lib/shida-calendar';
import {servicesProviderOffering} from './fixtures/services-provider';
const today=()=>localDate(new Date().toISOString(),'Africa/Kinshasa');
async function capture(page:Page,path:string){
 // Capture fixed navigation at the top after Playwright scrolls to a form action.
 await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();window.scrollTo({top:0,behavior:'instant'});});
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve())));
 await page.screenshot({path,fullPage:true});
}
async function fixture(page:Page,uncertain=false,duration:number|null=30){
 const qr=await QRCode.toDataURL('https://nihiloba.com/shida/services/SVC_one#booking');
 const state={schedule:{offering_ref:'SVC_one',revision:1,mode:'appointments',confirmation:'provider_approval',timezone:'Africa/Kinshasa',duration_minutes:duration,hours:[{day:'monday',start:'09:00',end:'17:00'}]},writes:[] as object[],deny:false,uncertain,opened:[] as string[]};
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Studio Kin'}});
  if(state.deny)return reply({},403);
  if(path.endsWith('/capabilities'))return reply({capabilities:['profile','packages','pilot_publication','structured_availability','reservations','messages','requests_quotes']});
  if(path.endsWith('/services'))return reply({profiles:[{...servicesProviderOffering,service_name:'Studio Kin · Haircut'}]});
  if(path.endsWith('/calendar'))return reply({timezone:'Africa/Kinshasa',page:1,has_more:false,items:[{reference:'RSV_today',startsAt:`${today()}T10:00:00+01:00`,endsAt:`${today()}T10:30:00+01:00`,timeZone:'Africa/Kinshasa',title:'Haircut',status:'confirmed',tone:'confirmed'}]});
  if(path.endsWith('/schedule')){
   if(req.method()==='PATCH'){const body=req.postDataJSON();state.writes.push(body);if(state.uncertain){state.uncertain=false;return reply({},503);}state.schedule={...state.schedule,...body,revision:2};}
   return reply(state.schedule);
  }
  if(path.endsWith('/share'))return reply({name:'Studio Kin · Haircut',url:'https://nihiloba.com/shida/services/SVC_one#booking',qr_image:qr});
  if(path.endsWith('/transactions/reservations'))return reply({reservations:[{reservation_ref:'RSV_today',offering:'Haircut',status:'confirmed',revision:1}],has_more:false});
  if(path.endsWith('/reservations/RSV_today')){state.opened.push('RSV_today');return reply({reservation_ref:'RSV_today',offering:'Haircut',status:'confirmed',revision:1,allowed_actions:[],history:[]});}
  if(path.endsWith('/reviews'))return reply({reviews:[]});
  return reply({requests:[],messages:[],reservations:[],allowed_actions:[]});
 });return state;
}
for(const [locale,width] of [['en',1440],['fr',390],['ln',820],['sw',320]] as const){
 test(`calendar, hours, confirmation and sharing ${locale} ${width}`,async({page})=>{
  const state=await fixture(page),t=scheduleCopy[locale];
  await page.setViewportSize({width,height:1000});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=calendar&offering=SVC_one`);
  const planner=page.locator('.svc-planner'),tabs=page.locator('.svc-planner-tabs');
  await expect(planner.getByText('Haircut',{exact:true})).toBeVisible();
  await expect(planner.getByText(t.statuses.confirmed,{exact:true})).toBeVisible();
  await capture(page,`docs/evidence/services-calendar/agenda-${locale}-${width}.png`);
  await tabs.getByRole('button',{name:t.hours,exact:true}).click();
  await expect(planner.getByLabel(t.confirmation)).toBeVisible();
  await expect(planner.getByRole('region',{name:t.bookingPreview})).toContainText(t.approval);
  await planner.getByLabel(t.confirmation).selectOption('automatic');
  await expect(planner.getByRole('region',{name:t.bookingPreview})).toContainText(t.instant);
  await expect(planner.getByRole('region',{name:t.bookingPreview})).toContainText(t.previewDraft);
  await planner.getByRole('button',{name:t.add,exact:true}).click();
  await expect(planner.locator('input[type=time]')).toHaveCount(4);
  await planner.getByRole('button',{name:t.save,exact:true}).click();
  await expect(planner.getByRole('status')).toHaveText(t.saved);
  expect(state.writes).toHaveLength(1);expect(state.schedule.confirmation).toBe('automatic');expect(state.schedule.hours).toHaveLength(2);
  await capture(page,`docs/evidence/services-calendar/hours-${locale}-${width}.png`);
  await tabs.getByRole('button',{name:t.share,exact:true}).click();await expect(planner.getByLabel(t.copy)).toHaveValue('https://nihiloba.com/shida/services/SVC_one#booking');
  await expect(planner.getByRole('link',{name:t.preview+' ↗'})).toHaveAttribute('href',/SVC_one#booking$/);
  const download=page.waitForEvent('download');await planner.getByRole('link',{name:t.download}).click();expect((await download).suggestedFilename()).toBe('shida-service-qr.png');
  await capture(page,`docs/evidence/services-calendar/sharing-${locale}-${width}.png`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await tabs.getByRole('button',{name:t.calendar,exact:true}).click();await planner.getByRole('button',{name:calendarCopy[locale].open,exact:true}).click();
  await expect.poll(()=>state.opened.length).toBeGreaterThan(0);
 });
}
test('uncertain hours save retries exactly and access revocation removes private content',async({page})=>{
 const state=await fixture(page,true),t=scheduleCopy.en;await page.goto('/shida/seller/services?view=calendar');
 await page.locator('.svc-planner-tabs').getByRole('button',{name:t.hours,exact:true}).click();
 await page.getByLabel(t.confirmation).selectOption('automatic');await page.getByRole('button',{name:t.save,exact:true}).click();
 await expect(page.getByRole('status')).toHaveText(t.uncertain);await expect(page.getByLabel(t.confirmation)).toBeDisabled();
 await page.getByRole('button',{name:t.retry,exact:true}).click();await expect(page.getByRole('status')).toHaveText(t.saved);expect(state.writes[0]).toEqual(state.writes[1]);
 state.deny=true;await page.locator('.svc-planner-tabs').getByRole('button',{name:t.share,exact:true}).click();await expect(page.locator('.svc-planner')).toHaveCount(0);
});

test('missing duration opens the selected service editor and protects unsaved hours',async({page})=>{
 const state=await fixture(page,false,null),t=scheduleCopy.en;
 await page.goto('/shida/seller/services?view=calendar&offering=SVC_one');
 await page.locator('.svc-planner-tabs').getByRole('button',{name:t.hours,exact:true}).click();
 await expect(page.getByRole('button',{name:t.save,exact:true})).toBeDisabled();
 await page.getByLabel(t.confirmation).selectOption('automatic');
 page.once('dialog',dialog=>dialog.dismiss());
 await page.getByRole('button',{name:t.editDuration,exact:true}).click();
 await expect(page.locator('.svc-planner')).toBeVisible();
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:t.editDuration,exact:true}).click();
 await expect(page.locator('#svc-field-service_duration_minutes')).toBeFocused();
 expect(state.writes).toHaveLength(0);
});
test('public appointment selection creates one WhatsApp handoff and handles a stale time',async({page})=>{
 const calls:string[]=[];
 await page.route('**/api/shida/services/booking-link?**',route=>{calls.push(route.request().url());return calls.length===1?route.fulfill({status:409,json:{detail:'time_unavailable'}}):route.fulfill({json:{booking_url:'https://wa.me/243812345678?text=START%20opaque'}});});
 await page.goto('/shida/services/appointments');
 // A cold streamed response may retain a hidden server panel during hydration.
 const panel=page.locator('.service-availability:visible');await expect(panel).toHaveCount(1);await expect(panel.getByText('Kinshasa time')).toBeVisible();expect(calls).toHaveLength(0);
 await panel.locator('.service-date-grid button:not([disabled])').first().click();await panel.getByRole('button',{name:'09:00–09:30',exact:true}).click();
 await expect(panel.getByRole('status')).toContainText('no longer available');await expect(panel.getByRole('link',{name:'Continue on WhatsApp'})).toHaveCount(0);
 await panel.getByRole('button',{name:'09:30–10:00',exact:true}).click();await expect(panel.getByRole('link',{name:'Continue on WhatsApp'})).toHaveAttribute('href',/START%20opaque/);expect(calls).toHaveLength(2);
 await expect(panel).toContainText('confirmed when you finish booking');
});
