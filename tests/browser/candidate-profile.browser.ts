import {test,expect,type Page} from '@playwright/test';
import {candidateUX} from '../../app/lib/candidate-ux';
import {candidateCopy} from '../../app/lib/candidate-profile-copy';
async function fixture(page:Page, options:{success?:boolean;expired?:boolean;existing?:boolean;failSave?:boolean;failDelete?:boolean}={}){
 let draft:Record<string,unknown>|null=options.expired?{public_ref:'COP_test',profile_type:'occasional_work',state:'expired',revision:2,updated_at:'2026-11-06T10:00:00Z',values:{city:'Goma',work_types:['Gardening'],preferred_areas:['Centre'],availability:'Weekdays',short_experience:'Two years',description:'Garden maintenance'},return_job_ref:null}:null;
 let profiles:Record<string,unknown>[]=options.existing?[{reference:'CND_test',type:'occasional_work',version:'2026-11-04T00:00:00Z',archived:false,visibility:'private',has_cv:false,values:{city:'Goma',work_types:['Gardening'],preferred_areas:['Centre'],availability:'Weekdays',short_experience:'Two years',description:'Garden maintenance'}}]:[];
 const writes:Record<string,unknown>[]=[];
 await page.route('**/api/**',async route=>{
  const r=route.request(),path=new URL(r.url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test candidate'}});
  if(path.endsWith('/personal/candidate')){
   if(r.method()==='GET')return reply({profiles,progress:draft?[draft]:[],metadata:{categories:[{id:'administration_office',label:'Administration'}],required:{professional:['primary_category','desired_titles','city','work_types','availability','skills','experience_level','description','cv_choice'],occasional_work:['work_types','city','preferred_areas','availability','short_experience','description']}}});
   const body=r.postDataJSON();writes.push(body);
   if(body.action==='start'){draft={public_ref:'COP_test',profile_type:body.profile_type,state:'active',revision:1,values:{},return_job_ref:null};return reply(draft);}
   if(body.action==='cancel'){if(options.failDelete)return reply({},503);draft=null;return reply({state:'cancelled'});}
   if(body.action==='save'){if(options.failSave)return reply({},503);draft={...draft,revision:Number(draft?.revision)+1,values:body.values};return reply(draft);}
   if(body.action==='recover'){draft={...draft,state:'active',revision:3};return reply(draft);}
   if(body.action==='finalize'){
    if(!options.success)return reply({},503);
    profiles=[{reference:'CND_test',type:draft?.profile_type,version:'2026-11-04T00:00:00Z',archived:false,visibility:'private',has_cv:false,values:draft?.values}];draft={...draft,state:'completed',values:{}};return reply(draft);
   }
  }
  if(path.endsWith('/personal/candidate/profile')){writes.push(r.postDataJSON());return reply({},409);}
  return reply({},404);
 });return writes;
}
for(const [locale,width] of (['en','fr','ln','sw'] as const).flatMap(locale=>([360,390,768,1024,1440] as const).map(width=>[locale,width] as const)))test(`candidate private creation ${locale} ${width}`,async({page})=>{
 const writes=await fixture(page),t=candidateCopy[locale];await page.setViewportSize({width,height:1000});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/space?view=candidate`);
 const panel=page.locator('.candidate-profile-panel').filter({has:page.getByRole('heading',{name:t.professional,exact:true})});
 await panel.getByRole('button',{name:t.start,exact:true}).click();
 const wizard=page.locator('.candidate-form');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await page.screenshot({path:`test-results/candidate-profile/step1-${locale}-${width}.png`,fullPage:true});
 await wizard.getByLabel(t.fields.primary_category,{exact:false}).selectOption('administration_office');
 for(const [key,value] of [['desired_titles','Assistant, Clerk'],['city','Kinshasa'],['work_types','Full time'],['availability','Now']] as const)await wizard.getByLabel(t.fields[key],{exact:false}).fill(value);
 await wizard.getByRole('button',{name:t.next,exact:true}).click();
 for(const key of ['skills','experience_level','description'] as const)await wizard.getByLabel(t.fields[key],{exact:false}).fill('Test candidate information');
 await page.screenshot({path:`test-results/candidate-profile/step2-${locale}-${width}.png`,fullPage:true});
 await wizard.getByLabel(t.noCV,{exact:true}).check();
 await wizard.getByRole('button',{name:t.next,exact:true}).click();
 await expect(wizard.getByRole('button',{name:t.create,exact:true})).toBeDisabled();
 await wizard.getByLabel(t.confirm,{exact:true}).check();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:`test-results/candidate-profile/review-${locale}-${width}.png`,fullPage:true});
 await wizard.getByRole('button',{name:t.create,exact:true}).click();await expect(page.locator('.candidate-notice[role="alert"]')).toContainText(t.error);
 await wizard.getByRole('button',{name:t.create,exact:true}).click();await expect.poll(()=>writes.filter(w=>w.action==='finalize').length).toBe(2);
 const final=writes.filter(w=>w.action==='finalize');expect(final[0]).toEqual(final[1]);
 expect(writes.filter(w=>w.action==='save')).toHaveLength(1);
 expect(writes.find(w=>w.action==='save')?.values).toMatchObject({desired_titles:['Assistant','Clerk'],cv_choice:'2'});
});

test('expired occasional progress resumes and creates one private profile',async({page})=>{
 const writes=await fixture(page,{success:true,expired:true}),t=candidateCopy.fr;
 await page.setViewportSize({width:390,height:844});
 await page.goto('/fr/shida/space?view=candidate');
 await page.getByRole('button',{name:t.recover,exact:true}).click();
 const wizard=page.locator('.candidate-form');
 await expect(wizard).toContainText('Goma');
 await expect(wizard.getByLabel(t.cv,{exact:true})).toHaveCount(0);
 await wizard.getByLabel(t.confirm,{exact:true}).check();
 await wizard.getByRole('button',{name:t.create,exact:true}).click();
 await expect(page.getByText(t.success,{exact:true})).toBeVisible();
 const panel=page.locator('.candidate-profile-panel').filter({has:page.getByRole('heading',{name:t.occasional_work,exact:true})});
 await expect(panel.getByRole('button',{name:t.edit,exact:true})).toBeVisible();
 await expect(panel.getByText(t.private,{exact:true})).toBeVisible();
 expect(writes.map(w=>w.action)).toEqual(['recover','save','finalize']);
 await page.screenshot({path:'test-results/candidate-profile/created-occasional-mobile.png',fullPage:true});
});

test('existing profile editing retains input on a concurrent conflict',async({page})=>{
 const writes=await fixture(page,{existing:true}),t=candidateCopy.en;
 await page.goto('/shida/space?view=candidate');
 const panel=page.locator('.candidate-profile-panel').filter({has:page.getByRole('heading',{name:t.occasional_work,exact:true})});
 await expect(panel.getByRole('button',{name:t.start,exact:true})).toHaveCount(0);
 await panel.getByRole('button',{name:t.edit,exact:true}).click();
 const wizard=page.locator('.candidate-form');
 await wizard.getByLabel(t.fields.city,{exact:false}).fill('Bukavu');
 await wizard.getByRole('button',{name:t.save,exact:true}).click();
 await expect(page.locator('.candidate-notice[role="alert"]')).toContainText(t.conflict);
 await expect(wizard.getByLabel(t.fields.city,{exact:false})).toHaveValue('Bukavu');
 await expect(wizard.getByRole('button',{name:t.save,exact:true})).toBeDisabled();
 expect(writes).toHaveLength(1);expect(writes[0]).toMatchObject({action:'update',reference:'CND_test',version:'2026-11-04T00:00:00Z'});
});

for(const width of [390,1440])test(`candidate draft delete confirmation ${width}`,async({page})=>{
 const writes=await fixture(page,{expired:true}),u=candidateUX.fr;await page.setViewportSize({width,height:900});await page.goto('/fr/shida/space?view=candidate');
 await page.getByRole('button',{name:u.delete,exact:true}).click();const modal=page.getByRole('dialog');await expect(modal).toBeVisible();await page.screenshot({path:`test-results/candidate-profile/delete-${width}.png`,fullPage:true});
 await modal.getByRole('button',{name:u.keep}).click();expect(writes).toHaveLength(0);await page.getByRole('button',{name:u.delete,exact:true}).click();await modal.getByRole('button',{name:u.delete,exact:true}).click();await expect(modal).not.toBeVisible();expect(writes).toEqual([{action:'cancel',public_ref:'COP_test',revision:2}]);
});

for(const width of [390,1440])test(`candidate failed save keeps edits and saved draft ${width}`,async({page})=>{
 const writes=await fixture(page,{failSave:true}),t=candidateCopy.fr,u=candidateUX.fr;await page.setViewportSize({width,height:900});await page.goto('/fr/shida/space?view=candidate');
 const panel=page.locator('.candidate-profile-panel').filter({has:page.getByRole('heading',{name:t.professional,exact:true})});await panel.getByRole('button',{name:t.start,exact:true}).click();await page.locator('.candidate-form').getByLabel(t.fields.city,{exact:false}).fill('Bukavu');await page.getByRole('link',{name:new RegExp(t.applications)}).click();
 const modal=page.getByRole('dialog');await expect(modal).toBeVisible();await expect(modal).toContainText(u.leave);await modal.getByLabel('Enregistrer et quitter',{exact:true}).check();await modal.getByRole('button',{name:'Continuer',exact:true}).click();await expect(modal.getByRole('alert')).toBeVisible();await page.screenshot({path:`test-results/candidate-profile/leave-${width}.png`,fullPage:true});await modal.getByRole('button',{name:'Annuler',exact:true}).click();await expect(page.locator('.candidate-form').getByLabel(t.fields.city,{exact:false})).toHaveValue('Bukavu');expect(writes.filter(w=>w.action==='save')).toHaveLength(1);expect(writes.some(w=>w.action==='cancel')).toBe(false);
});
test('candidate failed deletion retains the draft',async({page})=>{
 const writes=await fixture(page,{expired:true,failDelete:true}),u=candidateUX.fr;await page.goto('/fr/shida/space?view=candidate');await page.getByRole('button',{name:u.delete,exact:true}).click();const modal=page.getByRole('dialog');await modal.getByRole('button',{name:u.delete,exact:true}).click();await expect(modal.getByRole('alert')).toBeVisible();await modal.getByRole('button',{name:u.keep}).click();await expect(page.locator('.candidate-draft-card')).toBeVisible();expect(writes).toHaveLength(1);
});
