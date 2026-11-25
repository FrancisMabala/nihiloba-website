import {test,expect,type Page} from '@playwright/test';
const offering={public_ref:'SVC_0',provider_ref:'SVI_horizon',name:'Cabinet Horizon',service_name:'Consultation juridique',category:'professional_services',description:'Conseil indépendant.',service_duration_minutes:60,commune:'Gombe',service_location_type:'public_place',home_service_available:'no',booking_mode:'flexible',availability:'Weekdays',publication_origin:'pilot',visible_to_customers:true,requests_enabled:false,is_active:'yes',revision:1,missing_fields:[],packages:[],rating:{average:null,count:0},active_service_limit:5,professional_profile:{name:'Cabinet Horizon',bio:'Conseil indépendant.',photo:null,social_link:''}};
async function fixture(page:Page,{empty=false,draft=false,mixed=false,denied=false}={}){
 const row={...offering,visible_to_customers:!draft,publication_origin:draft?'unclassified':'pilot'};let fail=true;const writes:string[]=[];
 await page.route('**/api/**',async route=>{const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
 if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Private owner'}});
 if(path.endsWith('/capabilities'))return reply({capabilities:denied?[]:['profile','packages','pilot_publication','reviews_read']});
 if(path.endsWith('/onboarding'))return reply({progress:[],remaining_capacity:4,professional_profile:empty?null:{public_ref:'SVI_horizon',revision:1,name:row.name,primary_category:null}});
 if(path.endsWith('/personal/services')&&request.method()==='GET')return reply({profiles:empty?[]:mixed?[row,{...row,public_ref:'SVC_1',service_name:'Draft service',visible_to_customers:false,publication_origin:'unclassified'},{...row,public_ref:'SVC_2',service_name:'Archived service',is_active:'no'}]:[row]});
 if(path.endsWith('/reviews'))return reply({reviews:[]});
 if(path.endsWith('/details')&&request.method()==='PATCH'){writes.push(path);if(fail)return reply({},422);Object.assign(row,request.postDataJSON(),{revision:2});return reply(row);}
 return reply({},404);
 });return {writes,succeed:()=>{fail=false;}};
}
test('catalog filters preserve separate publication and requests; failed edits retain draft',async({page})=>{
 await page.setViewportSize({width:390,height:900});const state=await fixture(page);await page.goto('/fr/shida/seller/services?view=services&locale=fr');
 const item=page.locator('.svc-professional-service');await expect(item).toContainText('Publié');await expect(item).toContainText('Demandes en pause');
 const filters=page.locator('.svc-catalog-filters button');await filters.nth(2).click();await expect(item).toHaveCount(0);await filters.nth(3).click();await expect(item).toHaveCount(0);await filters.first().click();await expect(item).toHaveCount(1);
 await item.getByRole('button',{name:'Modifier',exact:true}).click();await page.locator('#svc-field-service_name').fill('Conseil mis à jour');const save=page.locator('form.svc-catalog-fields:not([hidden]) .svc-primary');await save.click();await expect(page.locator('.svc-editor-draft')).toBeVisible();await expect(page.locator('#svc-field-service_name')).toHaveValue('Conseil mis à jour');state.succeed();await save.click();await expect(page.locator('.svc-editor-heading h2')).toHaveText('Conseil mis à jour');await expect(page.locator('.svc-editor-steps button').first()).toHaveAttribute('aria-current','step');expect(state.writes).toHaveLength(2);expect(state.writes.every(path=>path.endsWith('/details'))).toBe(true);
 await page.locator('.svc-editor-steps button').last().click();await expect(page.locator('.svc-preview-controls')).toContainText('Demandes en pause');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('draft service has no share action or implicit publication',async({page})=>{
 const state=await fixture(page,{draft:true});await page.goto('/fr/shida/seller/services?view=services&locale=fr');await page.locator('.svc-service-actions summary').click();await expect(page.locator('.svc-service-actions button')).toHaveCount(1);await page.locator('.svc-service-actions button').click();await expect(page.locator('.svc-preview-controls')).toBeVisible();expect(state.writes).toHaveLength(0);
});
test('zero services retains guided creation entry',async({page})=>{
 await fixture(page,{empty:true});await page.goto('/fr/shida/seller/services?view=services&locale=fr');await page.locator('.svc-setup-start').click();await expect(page.locator('.svc-onboarding')).toBeVisible();
});

for(const width of [390,1440])test(`compact catalogue actual counts and actions ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});const state=await fixture(page,{mixed:true});await page.goto('/fr/shida/seller/services?view=services&locale=fr');
 const filters=page.locator('.svc-catalog-filters button');await expect(filters.locator('span')).toHaveText(['2','1','1','1']);await expect(page.locator('.svc-catalog-toolbar')).toContainText('2 services');await expect(page.locator('.svc-heading-actions .svc-refresh')).toHaveCount(0);await expect(page.locator('.svc-catalog-toolbar button')).toHaveCount(5);await expect(page.locator('.svc-catalog-toolbar>.svc-primary')).toHaveCount(1);
 const contrast=await filters.first().evaluate(el=>{const style=getComputedStyle(el),luminance=(color:string)=>{const c=(color.match(/[\d.]+/g)||[]).slice(0,3).map(Number).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*c[0]+.7152*c[1]+.0722*c[2];};const a=luminance(style.color),b=luminance(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});expect(contrast).toBeGreaterThanOrEqual(4.5);
 const header=page.locator('.svc-catalog-list-heading');await expect(header.getByRole('heading',{level:1})).toHaveCount(1);const geometry=await header.boundingBox();expect(geometry).not.toBeNull();if(width===1440)expect(geometry!.width).toBeLessThanOrEqual(1);else expect(geometry!.width).toBeGreaterThan(100);
 await filters.nth(1).click();await expect(page.locator('.svc-professional-service')).toHaveCount(1);await expect(page.locator('.svc-professional-service')).toContainText('Consultation juridique');await filters.nth(2).click();await expect(page.locator('.svc-professional-service')).toContainText('Draft service');await filters.nth(3).click();await expect(page.locator('.svc-professional-service')).toContainText('Archived service');await filters.first().click();await expect(page.locator('.svc-professional-service')).toHaveCount(2);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(state.writes).toHaveLength(0);
});
test('catalogue edit controls unavailable without profile capability',async({page})=>{await fixture(page,{denied:true});await page.goto('/fr/shida/seller/services?view=services&locale=fr');await expect(page.locator('.svc-catalog')).toHaveCount(0);await expect(page.locator('.svc-professional-service')).toHaveCount(0);});
