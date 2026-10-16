import {test,expect,type Page} from '@playwright/test';
import {workspaceCopy} from '../../app/components/shida/services-workspace-ui';

async function fixture(page:Page){
 const state={row:{public_ref:'SVC_booking',provider_ref:'SVI_booking',name:'Atelier Kin',service_name:'Home repair',category:'repair_maintenance',description:'',service_duration_minutes:null as number|null,commune:'',service_location_type:'public_place',home_service_available:'unknown',booking_mode:null as string|null,availability:'',publication_origin:'unclassified',requests_enabled:false,is_active:'yes',revision:1,missing_fields:[] as string[],packages:[],rating:{average:null,count:0}},writes:[] as Record<string,unknown>[],rejectNext:false};
 const missing=()=>{
  const row=state.row;
  row.missing_fields=['description','service_duration_minutes','commune','availability'].filter(key=>!row[key as keyof typeof row]);
  if(!['public_place','private_home'].includes(row.service_location_type))row.missing_fields.push('service_location_type');
  if(!['yes','no'].includes(row.home_service_available))row.missing_fields.push('home_service_available');
  if(!['flexible','time_slots'].includes(row.booking_mode??''))row.missing_fields.push('booking_mode');
 };
 missing();
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Atelier Kin'}});
  if(path.endsWith('/services/capabilities'))return reply({access_policy:'pilot',bundle:'personal_free',capabilities:['profile','pilot_publication']});
  if(path.endsWith('/services')){missing();return reply({profiles:[state.row]});}
  if(path.endsWith('/reviews'))return reply({reviews:[]});
  if(req.method()==='PATCH'){
   const body=req.postDataJSON();state.writes.push(body);
   if(state.rejectNext){state.rejectNext=false;return reply({},422);}
   expect(body.expected_revision).toBe(state.row.revision);
   if(path.endsWith('/details')){
    // Match the Backend PilotReview enum contract, including its rejection of unknown.
    for(const [key,values] of Object.entries({home_service_available:['yes','no'],booking_mode:['flexible','time_slots'],service_location_type:['public_place','private_home']})){
     if(key in body&&!values.includes(body[key]))return reply({},422);
    }
    const {expected_revision:revision,...fields}=body;expect(revision).toBe(state.row.revision);
    Object.assign(state.row,fields);missing();
   }else if(path.endsWith('/pilot-review')){
    expect(state.row.missing_fields).toEqual([]);state.row.publication_origin='pilot';
   }else return reply({},404);
   state.row.revision++;return reply(state.row);
  }
  return reply({},404);
 });
 return state;
}

for(const [locale,width] of [['en',1440],['fr',390],['ln',820],['sw',320]] as const){
 test(`new draft selects booking and home service before publication ${locale}`,async({page},testInfo)=>{
  const state=await fixture(page),t=workspaceCopy[locale];
  await page.setViewportSize({width,height:1000});
  const url=`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=services`;
  await page.goto(url);
  const home=page.locator('#svc-field-home_service_available'),booking=page.locator('#svc-field-booking_mode');
  const panel=page.getByRole('region',{name:t.publication}),publish=panel.locator('.svc-primary');
  await expect(home).toHaveValue('');await expect(booking).toHaveValue('');
  await expect(booking.locator('option[value="time_slots"]')).toHaveCount(0);
  await expect(page.locator('#svc-booking-help')).toHaveText(t.bookingHelp);
  await panel.locator('li button').last().click();await expect(booking).toBeFocused();
  await page.locator('#svc-field-description').fill('Repairs and maintenance');
  await page.locator('#svc-field-service_duration_minutes').fill('40');
  await page.locator('#svc-field-commune').fill('Limete');
  await page.locator('#svc-field-availability').fill('Lundi à Vendredi');
  await page.locator('#svc-details-save').click();
  await expect(panel.locator('li')).toHaveCount(2);await expect(publish).toBeDisabled();
  expect(state.writes[0]).not.toHaveProperty('home_service_available');expect(state.writes[0]).not.toHaveProperty('booking_mode');
  expect(state.row.publication_origin).toBe('unclassified');
  await booking.selectOption('flexible');await home.selectOption('yes');
  await expect(publish).toBeDisabled();await page.locator('#svc-details-save').click();
  await expect(publish).toBeEnabled();
  expect(state.writes[1]).toMatchObject({expected_revision:2,booking_mode:'flexible',home_service_available:'yes',service_duration_minutes:40});
  // A reload confirms the choices came back from the saved record, not UI defaults.
  await page.reload();await expect(booking).toHaveValue('flexible');await expect(home).toHaveValue('yes');await expect(publish).toBeEnabled();
  await booking.scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath(`booking-${locale}.png`)});
  await publish.click();await expect(panel.getByRole('heading',{name:t.liveHelp})).toBeVisible();
  expect(state.writes[2]).toEqual({expected_revision:3});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}

test('existing time-slot selection is preserved when saving other details',async({page})=>{
 const state=await fixture(page);state.row.booking_mode='time_slots';state.row.home_service_available='no';
 await page.goto('/shida/seller/services?view=services');
 const booking=page.locator('#svc-field-booking_mode');await expect(booking).toHaveValue('time_slots');
 await page.locator('#svc-field-description').fill('Updated description');await page.locator('#svc-details-save').click();
 await expect(page.locator('.svc-notice')).toHaveText('Saved.');
 expect(state.writes[0]).toMatchObject({booking_mode:'time_slots',home_service_available:'no'});
});

test('empty and unsupported saved choices stay visibly unset and are omitted from a draft save',async({page})=>{
 const state=await fixture(page);state.row.booking_mode='unknown';state.row.home_service_available='';state.row.service_location_type='unknown';
 await page.goto('/shida/seller/services?view=services');
 for(const key of ['booking_mode','home_service_available','service_location_type'])await expect(page.locator(`#svc-field-${key}`)).toHaveValue('');
 await page.locator('#svc-field-description').fill('Private draft');await page.locator('#svc-details-save').click();
 await expect(page.locator('.svc-notice')).toHaveText('Saved.');
 for(const key of ['booking_mode','home_service_available','service_location_type'])expect(state.writes[0]).not.toHaveProperty(key);
});

test('a rejected details save keeps the editable draft and gives validation guidance',async({page})=>{
 const state=await fixture(page);state.rejectNext=true;
 await page.goto('/shida/seller/services?view=services');
 await page.locator('#svc-field-home_service_available').selectOption('no');
 await page.locator('#svc-field-booking_mode').selectOption('flexible');
 await page.locator('#svc-field-description').fill('Keep this draft');await page.locator('#svc-details-save').click();
 await expect(page.locator('.svc-notice')).toHaveText(workspaceCopy.en.invalidDetails);
 await expect(page.locator('#svc-field-description')).toHaveValue('Keep this draft');await expect(page.locator('#svc-field-booking_mode')).toBeEnabled();
 await page.locator('#svc-details-save').click();await expect(page.locator('.svc-notice')).toHaveText('Saved.');
 expect(state.writes).toHaveLength(2);expect(state.writes[1]).toEqual(state.writes[0]);
});
