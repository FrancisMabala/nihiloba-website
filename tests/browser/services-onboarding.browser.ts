import {test,expect,type Page} from '@playwright/test';
import {servicesOnboardingCopy} from '../../app/lib/services-onboarding-copy';
type Row={public_ref:string;revision:number;status:string;provider_revision:number|null;fields:Record<string,string|null>;service_ref:string|null};
async function fixture(page:Page,existing=false){
 const writes:Record<string,unknown>[]=[];let progress:Row|null=null;
 const identity=existing?{public_ref:'SVI_fixture',revision:1,name:'Horizon',bio:'Independent professional',primary_category:null}:null;
 await page.route('**/api/**',async route=>{
 const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');
 const reply=(json:unknown,status=200)=>route.fulfill({json,status});
 if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test owner'}});
 if(path.endsWith('/capabilities'))return reply({capabilities:['profile','packages','pilot_publication','reviews_read']});
 if(path.endsWith('/personal/services'))return reply({profiles:[]});
 if(path.endsWith('/onboarding')){
 if(request.method()==='GET')return reply({progress:progress?[progress]:[],professional_profile:identity,remaining_capacity:5});
 const body=request.postDataJSON();writes.push(body);
 if(body.action==='start'){progress??={public_ref:'SON_fixture',revision:1,status:'active',fields:{},provider_revision:identity?.revision??null,service_ref:null};return reply(progress);}
 if(!progress||body.revision!==progress.revision)return reply({},409);
 if(body.action==='save'){progress={...progress,revision:progress.revision+1,fields:body.fields};return reply(progress);}
 if(body.action==='cancel'){progress={...progress,status:'cancelled',revision:progress.revision+1};return reply(progress);}
 if(body.action==='resume'){progress={...progress,status:'active',revision:progress.revision+1};return reply(progress);}
 if(body.action==='finalize')return reply({},503); // exercise retry without creating production records
 }
 return reply({},404);
 });return{writes,getProgress:()=>progress,seed:(row:Row)=>{progress=row;}};
}
for(const [locale,width] of [['en',1440],['fr',390],['ln',768],['sw',360]] as const)test(`private wizard ${locale} ${width}`,async({page})=>{
 const f=await fixture(page),t=servicesOnboardingCopy[locale];await page.setViewportSize({width,height:1000});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=services`);
 await page.locator('.svc-setup-start').click();
 const wizard=page.locator('.svc-onboarding');await expect(wizard).toBeVisible();
 await wizard.getByRole('button',{name:t.title,exact:true}).click();
 await wizard.getByRole('button',{name:t.personal,exact:true}).click();
 await expect(wizard.getByLabel(t.name,{exact:false})).toHaveValue('Test owner');
 await wizard.getByLabel(t.name,{exact:false}).fill('Horizon');
 await wizard.locator('input[name="primary_category"][value="professional_services"]').check();
 await page.screenshot({path:`test-results/services-onboarding/identity-${locale}-${width}.png`,fullPage:true});
 await wizard.getByRole('button',{name:new RegExp(t.next)}).click();
 await wizard.getByLabel(t.service,{exact:false}).fill('Business tutoring');
 await wizard.locator('input[name="category"][value="education_training"]').check();
 await wizard.getByRole('button',{name:new RegExp(t.next)}).click();
 await expect(wizard.getByRole('button',{name:new RegExp(t.create)})).toBeDisabled();
 await wizard.getByRole('checkbox').check();
 await page.screenshot({path:`test-results/services-onboarding/review-${locale}-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await wizard.getByRole('button',{name:new RegExp(t.create)}).click();
 await expect(wizard.getByRole('status').first()).toHaveText(t.error);
 await expect(wizard).toContainText('Business tutoring');
 await wizard.getByRole('button',{name:new RegExp(t.create)}).click();
 await expect.poll(()=>f.writes.filter(row=>row.action==='finalize').length).toBe(2);
 const final=f.writes.filter(row=>row.action==='finalize');expect(final[1]).toEqual(final[0]);expect(final.every(row=>row.public_ref==='SON_fixture'&&row.confirmed===true)).toBe(true);
 expect(f.getProgress()?.fields).toMatchObject({name:'Horizon',primary_category:'professional_services',category:'education_training'});
});

test('existing nullable identity skips identity editing and keeps shared name untouched',async({page})=>{
 const f=await fixture(page,true);await page.goto('/shida/seller/services?view=services');
 await page.locator('.svc-setup-start').click();
 const wizard=page.locator('.svc-onboarding');await wizard.getByRole('button',{name:'Add a service',exact:true}).click();
 await expect(wizard.locator('input[name="primary_category"]')).toHaveCount(0);
 await expect(wizard).toContainText('Horizon');
 await wizard.getByLabel('Service name',{exact:false}).fill('Mixed category offering');
 await wizard.locator('input[name="category"][value="education_training"]').check();
 await wizard.getByRole('button',{name:/Continue/}).click();
 expect(f.getProgress()?.fields.name).toBeUndefined();
 expect(f.getProgress()?.fields.primary_category).toBeUndefined();
});

test('resumed answers cannot overwrite an identity created after the form began',async({page})=>{
 const f=await fixture(page,true);
 f.seed({public_ref:'SON_fixture',revision:3,status:'active',provider_revision:1,service_ref:null,
  fields:{name:'Old unfinished name',bio:'Old biography',primary_category:'professional_services',service_name:'Tutoring',category:'education_training'}});
 await page.goto('/shida/seller/services?view=services');await page.locator('.svc-setup-start').click();
 const wizard=page.locator('.svc-onboarding');await expect(wizard).toContainText('Horizon');
 await wizard.getByRole('button',{name:/Continue/}).click();
 await expect(wizard.getByRole('heading',{name:'Review and create'})).toBeVisible();
 expect(f.getProgress()?.fields.name).toBeUndefined();
 expect(f.getProgress()?.fields.bio).toBeUndefined();
 expect(f.getProgress()?.fields.primary_category).toBeUndefined();
 expect(f.getProgress()?.fields.service_name).toBe('Tutoring');
});
