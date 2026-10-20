import {test,expect,type Page} from '@playwright/test';
import {workspaceCopy} from '../../app/components/shida/services-workspace-ui';
import {serviceCategoryExperience} from '../../app/lib/services-category-experience';

const caps=['profile','packages','pilot_publication','reviews_read','requests_quotes','reservations','messages','bills','manual_journal','basic_totals','operational_reports','financial_reports','quote_templates','bill_templates'];
async function fixture(page:Page,{loadFailure=false,saveFailure=false}={}){
 const state={row:{public_ref:'SVC_one',provider_ref:'SVI_one',name:'Atelier Kin',service_name:'Home repair',category:'repair_maintenance',description:'',service_duration_minutes:null as number|null,commune:'',service_location_type:'public_place',home_service_available:'yes',booking_mode:'flexible',availability:'',publication_origin:'unclassified',requests_enabled:false,is_active:'yes',revision:1,missing_fields:['description','service_duration_minutes','commune','availability'],packages:[],rating:{average:null,count:0}},settings:{display_name:null as string|null,accent:'green',revision:1,fallback_display_name:'Atelier Kin',preview:{display_name:'Atelier Kin',accent:'green'}},writes:[] as {path:string;body:Record<string,unknown>}[],settingsReads:0,failedSave:false,deny:false};
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Atelier Kin'}});
  if(path.endsWith('/services/capabilities'))return reply({access_policy:'pilot',bundle:'personal_free',capabilities:caps});
  if(path.endsWith('/services'))return reply({profiles:[state.row]});
  if(path.endsWith('/reviews'))return reply({reviews:[]});
  if(req.method()==='PATCH'){
   const body=req.postDataJSON();state.writes.push({path,body});
   if(state.deny)return reply({},403);
   if(path.endsWith('/bill-presentation')){
    if(saveFailure&&!state.failedSave){state.failedSave=true;return reply({},503);}
    expect(body.revision).toBe(state.settings.revision);
    state.settings={...state.settings,display_name:body.display_name,accent:body.accent,revision:state.settings.revision+1};return reply(state.settings);
   }
   expect(body.expected_revision).toBe(state.row.revision);
   if(path.endsWith('/details')){Object.assign(state.row,body);state.row.missing_fields=['description','service_duration_minutes','commune','availability'].filter(key=>!state.row[key as keyof typeof state.row]);}
   if(path.endsWith('/pilot-review')){expect(state.row.missing_fields).toEqual([]);state.row.publication_origin='pilot';}
   state.row.revision++;return reply(state.row);
  }
  if(path.endsWith('/bill-presentation')){state.settingsReads++;return loadFailure&&state.settingsReads===1?reply({},503):reply(state.settings);}
  return reply({},404);
 });return state;
}
const publish={en:'Review and publish',fr:'Vérifier et publier',ln:'Tala mpe bimisa',sw:'Kagua na chapisha'};
for(const [locale,width] of [['en',1440],['fr',390],['ln',820],['sw',320]] as const){
 test(`publication checklist completes saved service ${locale} ${width}`,async({page})=>{
  const state=await fixture(page),t=workspaceCopy[locale];
  await page.setViewportSize({width,height:1000});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=services`);
  const panel=page.getByRole('region',{name:t.publication}),button=panel.getByRole('button',{name:publish[locale]});
  await expect(panel).toBeVisible();await expect(button).toBeDisabled();await expect(panel.locator('li')).toHaveCount(4);
  for(const category of ["beauty_wellness","home_housing","repair_maintenance","education_training","photo_video","professional_services","cleaning"]){
   await page.locator('#svc-field-category').selectOption(category);
   await expect(page.locator('#svc-category-help')).toHaveText(serviceCategoryExperience(category,locale)!.description);
   await expect(page.locator('#svc-field-description')).toHaveValue('');
   expect(state.writes).toHaveLength(0);
  }
  await page.locator('#svc-field-category').selectOption('repair_maintenance');
  await page.screenshot({path:`docs/evidence/seller-workspace/services-publication-${locale}-${width}.png`,fullPage:true});
  await panel.locator('li button').first().click();await expect(page.locator('#svc-field-description')).toBeFocused();
  await page.locator('#svc-field-description').fill('Repairs and maintenance with a careful finish.');
  await page.locator('#svc-field-service_duration_minutes').fill('60');await page.locator('#svc-field-commune').fill('Gombe');await page.locator('#svc-field-availability').fill('Monday to Friday, 09:00–17:00');
  await expect(button).toBeDisabled();await expect(panel.getByText(t.unsaved)).toBeVisible();expect(state.writes).toHaveLength(0);
  await page.locator('#svc-details-save').click();await expect(button).toBeEnabled();expect(state.writes[0].path).toContain('/details');
  // A ready saved service must not silently publish a different, unsaved edit.
  await page.locator('#svc-field-commune').fill('Lingwala');await expect(button).toBeDisabled();await page.locator('#svc-field-commune').fill('Gombe');await expect(button).toBeEnabled();
  await button.click();await expect(panel.getByRole('heading',{name:t.liveHelp})).toBeVisible();
  expect(state.writes).toHaveLength(2);expect(state.writes[1].body).toEqual({expected_revision:2});
  await expect(page.locator('.svc-public-link a')).toHaveAttribute('href',`${locale==='en'?'':`/${locale}`}/shida/services/SVC_one/`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
 test(`bill presentation live preview ${locale} ${width}`,async({page})=>{
  const state=await fixture(page);await page.setViewportSize({width,height:1050});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=settings`);
  const form=page.locator('.svc-branding-controls'),sheet=page.locator('.service-bill-sheet');
  await expect(sheet.getByText('Atelier Kin',{exact:true})).toBeVisible();await expect(page.locator('.svc-preview-note')).toBeVisible();
  await form.getByRole('textbox').fill('Studio Kivu');await form.getByRole('radio').last().check();
  if(locale==='en'){await form.getByRole('radio').last().press('ArrowLeft');await expect(form.getByRole('radio').nth(2)).toBeChecked();await form.getByRole('radio').nth(2).press('ArrowRight');}
  await expect(sheet.getByText('Studio Kivu',{exact:true})).toBeVisible();await expect(sheet).toHaveCSS('--bill-accent','#7e22ce');
  await expect(sheet).toContainText('50.00');expect(state.writes).toHaveLength(0);
  await page.screenshot({path:`docs/evidence/seller-workspace/services-bill-settings-${locale}-${width}.png`,fullPage:true});
  await form.locator('button[type="submit"], button.svc-primary').click();await expect(form.locator('.svc-primary')).toBeDisabled();
  expect(state.writes).toHaveLength(1);expect(state.writes[0].body).toMatchObject({revision:1,display_name:'Studio Kivu',accent:'plum'});expect(Object.keys(state.writes[0].body).sort()).toEqual(['accent','display_name','idempotency_key','revision']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
test('bill presentation recovers loading and retries the exact uncertain save',async({page})=>{
 const state=await fixture(page,{loadFailure:true,saveFailure:true});await page.goto('/shida/seller/services?view=settings');
  await expect(page.locator('.svc-content').getByRole('alert')).toHaveText('Bill settings could not be loaded.');await page.getByRole('button',{name:'Try again',exact:true}).click();
 const form=page.locator('.svc-branding-controls');await form.getByRole('textbox').fill('Studio Kivu');await form.getByRole('button',{name:'Save presentation',exact:true}).click();
 await expect(form.getByRole('status')).toContainText('save could not be confirmed');await expect(form.getByRole('textbox')).toBeDisabled();await expect(form.getByRole('radio').first()).toBeDisabled();
 await form.getByRole('button',{name:'Try again',exact:true}).click();await expect(form.getByRole('status')).toHaveText('Presentation saved.');expect(state.writes).toHaveLength(2);expect(state.writes[0]).toEqual(state.writes[1]);
});
test('revoked bill settings access clears the protected workspace',async({page})=>{
 const state=await fixture(page);await page.goto('/shida/seller/services?view=settings');
 const form=page.locator('.svc-branding-controls');await form.getByRole('textbox').fill('Private edit');state.deny=true;await form.getByRole('button',{name:'Save presentation',exact:true}).click();
 await expect(page.locator('.svc-workspace')).toHaveCount(0);await expect(page.locator('.svc-provider').getByRole('alert')).toHaveText('Personal Services access is unavailable.');
});
