import {test,expect,type Page} from '@playwright/test';
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
 if(path.endsWith('/details'))Object.assign(row,body);
 if(path.endsWith('/pilot-review')){row.publication_origin='pilot';row.visible_to_customers=true;}
 row.revision++;return reply(row);}
 return reply({},404);
 });return {rows,writes};
}
for(const [locale,width] of [['en',1440],['fr',390],['ln',768],['sw',360]] as const)test(`shared profile and focused editor ${locale} ${width}`,async({page})=>{
 const state=await fixture(page),t=professionalCopy[locale];await page.setViewportSize({width,height:1000});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=services`);
 await expect(page.locator('.svc-professional-summary h2')).toHaveText('Cabinet Horizon');await expect(page.locator('.svc-professional-service')).toHaveCount(2);await expect(page.locator('.svc-service-editor')).toHaveCount(0);await expect(page.getByText(t.notice)).toBeVisible();
 await page.screenshot({path:`test-results/services-professional/overview-${locale}-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:t.edit,exact:true}).click();await page.screenshot({path:`test-results/services-professional/profile-editor-${locale}-${width}.png`,fullPage:true});await page.getByLabel(t.name,{exact:true}).fill('Horizon Advisory');await page.locator('.svc-profile-form select').selectOption('education_training');await page.getByRole('button',{name:t.save,exact:true}).click();
 await expect(page.locator('.svc-professional-summary h2')).toHaveText('Horizon Advisory');expect(state.rows.every(row=>row.name==='Horizon Advisory')).toBe(true);
 await page.locator('.svc-professional-service button').first().click();await expect(page.locator('#svc-field-name')).toHaveCount(0);
 for(const category of ['beauty_wellness','professional_services','home_housing','education_training']){await page.locator('#svc-field-category').selectOption(category);await expect(page.locator('#svc-category-help')).toHaveText(serviceCategoryExperience(category,locale)!.description);}
 await page.locator('#svc-field-category').selectOption('professional_services');
 await page.screenshot({path:`test-results/services-professional/information-${locale}-${width}.png`,fullPage:true});
 await page.locator('.svc-editor-steps button').nth(1).click();await expect(page.locator('#svc-field-service_duration_minutes')).toHaveValue('60');await expect(page.getByText(t.duration)).toBeVisible();
 await page.screenshot({path:`test-results/services-professional/location-${locale}-${width}.png`,fullPage:true});
 await page.locator('.svc-editor-steps button').nth(2).click();await expect(page.locator('.svc-packages')).toBeVisible();await expect(page.locator('.svc-packages form')).toHaveCount(0);
 await page.screenshot({path:`test-results/services-professional/pricing-${locale}-${width}.png`,fullPage:true});
 await page.locator('.svc-editor-steps button').nth(3).click();await expect(page.getByText(t.savedPreview)).toBeVisible();await expect(page.getByRole('button',{name:locale==='en'?'Review and publish':t.review,exact:true})).toBeEnabled();
 await page.screenshot({path:`test-results/services-professional/review-${locale}-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(state.writes).toHaveLength(1);expect(state.writes[0].body.primary_category).toBe('education_training');expect(state.rows.every(row=>row.category==='professional_services')).toBe(true);
});
test('five active services keep management available and explain capacity',async({page})=>{await fixture(page,5);await page.goto('/shida/seller/services?view=services');await expect(page.getByText(professionalCopy.en.limit)).toBeVisible();await expect(page.locator('.svc-professional-service')).toHaveCount(5);await expect(page.locator('.svc-add-disclosure')).toHaveCount(1);});

for(const width of [360,390,768,1440])for(const kind of ['beauty','legal'])test(`public ${kind} professional identity ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto(`/shida/services/providers/professional-${kind}`);
 await expect(page.getByRole('heading',{level:1})).toHaveText(kind==='beauty'?'Studio Grace (test)':'Cabinet Horizon (test)');
 await expect(page.locator('.service-card')).toHaveCount(3);await expect(page.getByText('Private owner')).toHaveCount(0);
 await expect(page.locator('.service-provider-header')).not.toContainText('Verified');
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
