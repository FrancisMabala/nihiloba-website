import {test,expect} from '@playwright/test';

test('Personal provider records and corrects a partial receipt after offering withdrawal',async({page})=>{
 const offering={public_ref:'SVC_personal',provider_ref:'SVI_personal',name:'Solo',service_name:'Repair',category:'repair_maintenance',description:'Repair work',service_duration_minutes:60,commune:'Gombe',service_location_type:'public_place',home_service_available:'no',booking_mode:'flexible',availability:'Weekdays',publication_origin:'historical',requests_enabled:false,is_active:'yes',revision:2,missing_fields:[],packages:[],rating:{average:null,count:0}};
 const rows:Record<string,unknown>[]=[];
 const writes:Record<string,unknown>[]=[];
 await page.route('**/api/shida/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(path.endsWith('/employment/session/'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Solo'}}});
  if(path.endsWith('/services/capabilities'))return route.fulfill({json:{bundle:'personal_pro',access_policy:'pilot',purchase_required:false,capabilities:['profile','reservations','messages','manual_journal','basic_totals']}});
  if(path==='/api/shida/personal/services')return route.fulfill({json:{profiles:[offering]}});
  if(path.endsWith('/reviews'))return route.fulfill({json:{reviews:[]}});
  if(path.endsWith('/transactions/finance/entries')){
   if(request.method()==='GET')return route.fulfill({json:{entries:rows,next_offset:null}});
   const body=request.postDataJSON() as Record<string,unknown>;writes.push(body);
   rows.unshift({entry_ref:'PSE_one',measure:'recorded_income',direction:1,amount:'12.25',currency:'CDF',effective_date:'2026-10-13',category:'service_income',private_note:null,evidence:'provider-declared',effect:'initial',correction_state:'original',reservation_ref:'RSV_one',association_kind:'job',recorded_at:'2026-10-13T12:00:00Z',original_entry_ref:null,revision:0});
   return route.fulfill({status:201,json:{entries:[rows[0]],replayed:false}});
  }
  if(path.endsWith('/transactions/finance/entries/PSE_one/corrections')){
   const body=request.postDataJSON() as Record<string,unknown>;writes.push(body);rows[0].correction_state='corrected_original';
   rows.unshift({...rows[0],entry_ref:'PSE_reverse',effect:'reversal',direction:-1,original_entry_ref:'PSE_one',correction_state:'reversal'});
   rows.unshift({...rows[1],entry_ref:'PSE_replace',effect:'replacement',direction:1,amount:'10.25',original_entry_ref:'PSE_one',correction_state:'replacement'});
   return route.fulfill({status:201,json:{entries:rows.slice(0,2),replayed:false}});
  }
  if(path.endsWith('/transactions/reservations'))return route.fulfill({json:{reservations:[{reservation_ref:'RSV_one',service_name:'Repair'}]}});
  if(path.includes('/transactions/'))return route.fulfill({json:{requests:[],reservations:[],threads:[],has_more:false}});
  return route.fulfill({status:404,json:{detail:'unavailable'}});
 });
 await page.goto('/shida/seller/services');
 const journal=page.getByRole('region',{name:'Services journal'});
 await expect(journal.getByText(/does not verify payment/)).toBeVisible();
 await journal.getByLabel('Select or enter an authorized reservation').fill('RSV_one');
 await journal.getByLabel('Exact amount').fill('12.25');
 await journal.getByRole('button',{name:'Record entry'}).click();
 await expect(journal.getByRole('button',{name:'Correct'})).toBeVisible();
 await journal.getByRole('button',{name:'Correct'}).click();
 await journal.getByLabel('Exact amount').fill('10.25');
 await journal.getByRole('button',{name:'Record correction'}).click();
 await expect(journal.getByText(/Full reversal/)).toBeVisible();
 expect(writes).toHaveLength(2);
 expect(writes[0]).toMatchObject({reservation_ref:'RSV_one',amount:'12.25',currency:'CDF'});
 expect(writes[1]).toMatchObject({expected_revision:0,replacement:{amount:'10.25'}});
});
