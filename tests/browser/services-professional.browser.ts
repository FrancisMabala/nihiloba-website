import {test,expect,type Page} from '@playwright/test';
import {catalogCopy} from "../../app/lib/service-catalog";
import {professionalCopy} from '../../app/lib/services-professional-copy';
import {serviceCategoryExperience} from '../../app/lib/services-category-experience';
const baseRow={public_ref:'SVC_legal',provider_ref:'SVI_horizon',name:'Cabinet Horizon',service_name:'Legal consultation',category:'professional_services',description:'Advice on contracts and business decisions.',service_duration_minutes:60,commune:'Gombe',service_location_type:'public_place',home_service_available:'no',booking_mode:'flexible',availability:'Weekdays by agreement',publication_origin:'unclassified',visible_to_customers:false,requests_enabled:true,is_active:'yes',revision:1,missing_fields:[],packages:[{public_ref:'SPK_consult',name:'Consultation',description:null,duration_minutes:60,price:'25',currency:'USD'}],rating:{average:null,count:0},active_service_limit:5,professional_profile:{name:'Cabinet Horizon',bio:'Independent advice for individuals and small businesses.',photo:null,social_link:''}};
async function fixture(page:Page,count=2){
 const rows=Array.from({length:count},(_,i)=>({...baseRow,public_ref:`SVC_${i}`,service_name:i?'Business advice':'Legal consultation'}));const writes:{path:string;body:Record<string,unknown>}[]=[];
 await page.route('**/api/**',async route=>{const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
 if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Private owner'}});
 if(path.endsWith('/capabilities'))return reply({capabilities:['profile','packages','pilot_publication','reviews_read']});
 if(path.endsWith('/onboarding'))return reply({progress:[],remaining_capacity:5-count,professional_profile:{public_ref:'SVI_horizon',revision:1,name:rows[0]?.name,primary_category:null}});
 if(path.endsWith('/reviews'))return reply({reviews:[]});
 if(path.endsWith('/personal/services')&&req.method()==='GET')return reply({profiles:rows});
 if(req.method()==='PATCH'){const body=req.postDataJSON();writes.push({path,body});const row=rows.find(r=>path.includes('/'+r.public_ref+'/'))!;
 if(body.expected_revision!==row.revision)return reply({},409);
 if(path.endsWith('/professional-profile')){for(const item of rows){item.name=body.name;item.professional_profile={...item.professional_profile,...body};item.revision++;}return reply(row);}
 if(path.endsWith('/details')){Object.assign(row,body);Object.assign(row,{offer_terms:{...('offer_terms' in row?row.offer_terms as object:{}),...(body.pricing?{pricing:body.pricing}:{}),...(body.delivery?{delivery:body.delivery}:{})}});}
 if(path.endsWith('/pilot-review')){row.publication_origin='pilot';row.visible_to_customers=true;}
 row.revision++;return reply(row);}
 return reply({},404);
 });return {rows,writes};
}
for(const [locale,width] of [['en',1440],['fr',390],['ln',768],['sw',360]] as const)test(`shared profile and focused editor ${locale} ${width}`,async({page})=>{
 const state=await fixture(page),t=professionalCopy[locale];await page.setViewportSize({width,height:1000});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=services`);
 await expect(page.locator('.svc-professional-summary h2')).toHaveText('Cabinet Horizon');await expect(page.locator('.svc-professional-service')).toHaveCount(2);await expect(page.locator('.svc-service-editor')).toHaveCount(0);await page.locator(".svc-provider-options summary").click();await expect(page.getByText(t.notice)).toBeVisible();
 await page.screenshot({path:`test-results/services-professional/overview-${locale}-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:t.edit,exact:true}).click();await page.screenshot({path:`test-results/services-professional/profile-editor-${locale}-${width}.png`,fullPage:true});await page.getByLabel(t.name,{exact:true}).fill('Horizon Advisory');await page.locator('.svc-profile-form select').selectOption('education_training');await page.getByRole('button',{name:t.save,exact:true}).click();
 await expect(page.locator('.svc-professional-summary h2')).toHaveText('Horizon Advisory');expect(state.rows.every(row=>row.name==='Horizon Advisory')).toBe(true);
 await page.locator('.svc-professional-service button').first().click();await expect(page.locator('#svc-field-name')).toHaveCount(0);
 for(const category of ['beauty_wellness','professional_services','home_housing','education_training']){await page.locator('#svc-field-category').selectOption(category);await expect(page.locator('#svc-category-help')).toHaveText(serviceCategoryExperience(category,locale)!.description);}
 await page.locator('#svc-field-category').selectOption('professional_services');
 await page.screenshot({path:`test-results/services-professional/information-${locale}-${width}.png`,fullPage:true});
 await page.locator('.svc-editor-steps button').nth(1).click();await expect(page.locator('#svc-field-service_duration_minutes')).toHaveValue('60');await expect(page.getByLabel(catalogCopy(locale).estimated)).toBeVisible();
 await page.screenshot({path:`test-results/services-professional/location-${locale}-${width}.png`,fullPage:true});
 await page.locator('.svc-editor-steps button').nth(2).click();await expect(page.locator('.svc-packages')).toBeVisible();await expect(page.locator('.svc-packages form')).toHaveCount(0);
 await page.screenshot({path:`test-results/services-professional/pricing-${locale}-${width}.png`,fullPage:true});
 await page.locator('.svc-editor-steps button').nth(3).click();await expect(page.getByText(catalogCopy(locale).customerPreview)).toBeVisible();await expect(page.getByRole('button',{name:catalogCopy(locale).publish,exact:true})).toBeEnabled();
 await page.screenshot({path:`test-results/services-professional/review-${locale}-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(state.writes).toHaveLength(1);expect(state.writes[0].body.primary_category).toBe('education_training');expect(state.rows.every(row=>row.category==='professional_services')).toBe(true);
});
test('five active services keep management available and explain capacity',async({page})=>{await fixture(page,5);await page.goto('/shida/seller/services?view=services');await expect(page.getByText(professionalCopy.en.limit)).toBeVisible();await expect(page.locator('.svc-professional-service')).toHaveCount(5);await expect(page.locator('.svc-provider-identity button.svc-primary')).toBeDisabled();});

for(const width of [360,390,768,1440])for(const kind of ['beauty','legal'])test(`public ${kind} professional identity ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto(`/shida/services/providers/professional-${kind}`);
 await expect(page.getByRole('heading',{level:1})).toHaveText(kind==='beauty'?'Studio Grace (test)':'Cabinet Horizon (test)');
 await expect(page.locator('.professional-service-row')).toHaveCount(3);await expect(page.getByText('Private owner')).toHaveCount(0);
 await expect(page.locator('.professional-storefront header').first()).not.toContainText('Verified');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/services-professional/public-${kind}-${width}.png`,fullPage:true});
});
test('beauty overview and category-aware editor',async({page})=>{
 const state=await fixture(page,3);for(const row of state.rows){row.name='Studio Grace (test)';row.professional_profile.name=row.name;row.category='beauty_wellness';row.service_name='Hair care '+row.public_ref;row.description='Hair treatment and styling.';}
 await page.goto('/shida/seller/services?view=services');await expect(page.locator('.svc-professional-service')).toHaveCount(3);await page.screenshot({path:'test-results/services-professional/beauty-overview.png',fullPage:true});
 await page.locator('.svc-professional-service button').first().click();await expect(page.locator('#svc-category-help')).toHaveText(serviceCategoryExperience('beauty_wellness','en')!.description);await page.screenshot({path:'test-results/services-professional/beauty-form.png',fullPage:true});
});


test('legacy response keeps the existing public name and services accessible',async({page})=>{
 const state=await fixture(page,1);Reflect.deleteProperty(state.rows[0],'professional_profile');
 await page.goto('/shida/seller/services?view=services');await expect(page.locator('.svc-professional-summary h2')).toHaveText('Cabinet Horizon');await expect(page.locator('.svc-professional-service')).toHaveCount(1);
 await page.screenshot({path:'test-results/services-professional/legacy-overview.png',fullPage:true});await page.locator('.svc-professional-service button').click();await expect(page.locator('#svc-field-service_name')).toHaveValue('Legal consultation');
});

for(const width of [390,1440])test(`save service pricing and preserve identity at ${width}`,async({page})=>{
 const state=await fixture(page,1),t=catalogCopy("fr");
 await page.setViewportSize({width,height:900});
 await page.goto("/fr/shida/seller/services/?view=services&provider=SVI_horizon");
 await page.locator(".svc-professional-service button").first().click();
 await page.getByLabel(t.name,{exact:true}).fill("Consultation juridique");
 await page.locator("form:not([hidden])").getByRole("button",{name:t.next,exact:true}).click();
 await expect(page.locator(".svc-editor-steps [aria-current=step]")).toContainText(t.place);
 await page.locator("#svc-field-booking_mode").selectOption("time_slots");
 await page.locator("#svc-details-save").click();
 await page.getByLabel(t.fixed,{exact:true}).check();
 await page.locator("#svc-field-baseAmount").fill("0");
 await page.locator(".svc-packages>button").first().click();
 await page.locator(".svc-package-form input").first().fill("Offre temporaire");
 await page.locator(".svc-package-form").getByRole("button",{name:professionalCopy.fr.cancel}).click();
 await expect(page.locator("#svc-field-baseAmount")).toHaveValue("0");
 await page.locator(".svc-catalog-base").getByRole("button",{name:t.next}).click();
 await expect(page.locator(".svc-customer-preview")).toContainText("0 CDF");
 await page.getByRole("button",{name:t.publish,exact:true}).click();
 await page.locator(".svc-editor-back").click();
 await expect(page.locator(".svc-professional-service")).toContainText("Consultation juridique");
 await expect(page.locator(".svc-professional-service a")).toHaveAttribute("href",/SVC_0/);
 expect(state.rows[0].packages).toHaveLength(1);
});

test('calendar changes return to the same service with unfinished edits intact',async({page})=>{
 const state=await fixture(page),row=state.rows[1];
 const hours=[{day:'monday',start:'13:00',end:'18:00'}];
 let schedule={offering_ref:row.public_ref,revision:1,mode:'appointments',confirmation:'automatic',hours,duration_minutes:60,timezone:'Africa/Kinshasa',personal_calendar:{shared_revision:1,week:[],absences:[],inherit_week:false,travel_minutes:0}};
 await page.route('**/capabilities**',route=>route.fulfill({json:{capabilities:['profile','packages','structured_availability','reservations_manage']}}));
 await page.route('**/services/calendar**',route=>route.fulfill({json:{items:[],unscheduled:[],has_more:false}}));
 await page.route('**/SVC_1/schedule**',async route=>{
  if(route.request().method()!=='GET'){
   const saved=route.request().postDataJSON();
   schedule={...schedule,hours:saved.hours,personal_calendar:saved.personal_calendar,revision:++row.revision};
  }
  return route.fulfill({json:schedule});
 });
 await page.goto('/fr/shida/seller/services?view=services&offering=SVC_1');
 await expect(page.locator('#svc-field-service_name')).toHaveValue('Business advice');
 await page.locator('#svc-field-service_name').fill('Unfinished service name');
 await page.locator('.svc-editor-steps button').nth(1).click();
 await page.locator('.svc-service-hours button').click();
 await expect(page.locator('.svc-cal-panel').filter({hasText:'Business advice'}).first()).toBeVisible();
 await page.locator('.svc-cal-panel').filter({hasText:'Business advice'}).first().getByRole('button').first().click();
 const dialog=page.getByRole('dialog');
 await dialog.locator('input[type=time]').last().fill('17:00');
 await dialog.locator('footer .svc-primary').click();
 await expect(dialog).toHaveCount(0);
 await page.locator('.svc-catalog-back').click();
 await expect(page.locator('.svc-service-hours')).toContainText('13:00–17:00');
 await page.locator('.svc-editor-steps button').first().click();
 await expect(page.locator('#svc-field-service_name')).toHaveValue('Unfinished service name');
 expect(state.writes).toHaveLength(0);
});
