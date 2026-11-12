import {occText} from '../../app/lib/occasional-copy';
import {candidateWorkspaceCopy as workspaceCopy} from '../../app/lib/candidate-workspace-copy';
import {test,expect,type Page} from '@playwright/test';
import {formText} from '../../app/lib/professional-form-copy';
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
   if(body.action==='start'&&body.edit_ref&&options.existing)return reply({},409);
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
 const panel=page.locator('.candidate-profile-panel').filter({has:page.getByRole('heading',{name:workspaceCopy[locale].company,exact:true})});
 await panel.getByRole('button',{name:workspaceCopy[locale].start,exact:true}).click();
 const wizard=page.locator('.candidate-form');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await page.screenshot({path:`test-results/candidate-profile/step1-${locale}-${width}.png`,fullPage:true});
 const select=async(name:string,option:string)=>{await wizard.getByRole('combobox',{name}).click();await wizard.getByRole('option',{name:option,exact:true}).click();};
 await select(t.fields.primary_category,'Administration');
 await wizard.getByLabel(t.fields.desired_titles,{exact:true}).fill('Assistant, Clerk');await page.keyboard.press('Enter');
 await wizard.getByLabel(t.fields.city).fill('Kinshasa');
 await wizard.getByLabel(candidateUX[locale].contracts[0],{exact:true}).check();await select(t.fields.availability,candidateUX[locale].availability[0]);
 await wizard.getByRole('button',{name:t.next,exact:true}).click();
 await select(t.fields.experience_level,candidateUX[locale].experience[0]);
 await wizard.getByLabel(t.fields.skills,{exact:true}).fill('Excel');await page.keyboard.press('Enter');
 await wizard.getByLabel(t.fields.description,{exact:false}).fill('Test candidate information');
 await page.screenshot({path:`test-results/candidate-profile/step2-${locale}-${width}.png`,fullPage:true});
 await wizard.getByRole('button',{name:formText(locale,'check'),exact:true}).click();
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
 await wizard.getByRole('button',{name:occText('fr','flexible'),exact:true}).click();
 await wizard.getByRole('button',{name:t.next,exact:true}).click();
 await wizard.locator('#occ-tasks-0 input').fill('Arroser les plantes');
 await wizard.locator('#occ-tasks-0 button').last().click();
 await wizard.getByRole('button',{name:occText('fr','paid'),exact:true}).click();
 await wizard.getByRole('button',{name:t.next,exact:true}).click();
 await expect(wizard.getByRole('switch')).not.toBeChecked();
 await wizard.getByRole('checkbox',{name:occText('fr','confirm')}).check();
 await wizard.getByRole('button',{name:occText('fr','submit'),exact:true}).click();
 await expect(page.getByText(occText('fr','saved'),{exact:true})).toBeVisible();
 const panel=page.locator('.candidate-profile-panel').filter({has:page.getByRole('heading',{name:workspaceCopy.fr.individual,exact:true})});
 await expect(panel.getByRole('button',{name:t.edit,exact:true})).toBeVisible();
 await expect(panel.getByText(t.private,{exact:true})).toBeVisible();
 expect(writes.map(w=>w.action)).toEqual(['recover','save','finalize']);
 await page.screenshot({path:'test-results/candidate-profile/created-occasional-mobile.png',fullPage:true});
});

test('existing profile editing retains input on a concurrent conflict',async({page})=>{
 const writes=await fixture(page,{existing:true}),t=candidateCopy.en;
 await page.goto('/shida/space?view=candidate');
 const panel=page.locator('.candidate-profile-panel').filter({has:page.getByRole('heading',{name:workspaceCopy.en.individual,exact:true})});
 await expect(panel.getByRole('button',{name:workspaceCopy.en.start,exact:true})).toHaveCount(0);
 await panel.getByRole('button',{name:t.edit,exact:true}).click();
 const wizard=page.locator('.candidate-form');
 await wizard.locator('input[list=occ-cities]').fill('Bukavu');
 await wizard.getByRole('button',{name:t.save,exact:true}).click();
 await expect(page.locator('.candidate-notice[role="alert"]')).toContainText(t.conflict);
 await expect(wizard.locator('input[list=occ-cities]')).toHaveValue('Bukavu');
 await expect(wizard.getByRole('button',{name:t.save,exact:true})).toBeDisabled();
 expect(writes).toHaveLength(1);expect(writes[0]).toMatchObject({action:'start',profile_type:'occasional_work',edit_ref:'CND_test',edit_version:'2026-11-04T00:00:00Z'});
});

for(const width of [390,1440])test(`candidate draft delete confirmation ${width}`,async({page})=>{
 const writes=await fixture(page,{expired:true}),u=candidateUX.fr;await page.setViewportSize({width,height:900});await page.goto('/fr/shida/space?view=candidate');
 await page.getByRole('button',{name:workspaceCopy.fr.remove,exact:true}).click();const modal=page.getByRole('dialog');await expect(modal).toBeVisible();await page.screenshot({path:`test-results/candidate-profile/delete-${width}.png`,fullPage:true});
 await modal.getByRole('button',{name:u.keep}).click();expect(writes).toHaveLength(0);await page.getByRole('button',{name:workspaceCopy.fr.remove,exact:true}).click();await modal.getByRole('button',{name:u.delete,exact:true}).click();await expect(modal).not.toBeVisible();expect(writes).toEqual([{action:'cancel',public_ref:'COP_test',revision:2}]);
});

for(const width of [390,1440])test(`candidate failed save keeps edits and saved draft ${width}`,async({page})=>{
 const writes=await fixture(page,{failSave:true}),t=candidateCopy.fr,u=candidateUX.fr;await page.setViewportSize({width,height:900});await page.goto('/fr/shida/space?view=candidate');
 const panel=page.locator('.candidate-profile-panel').filter({has:page.getByRole('heading',{name:workspaceCopy.fr.company,exact:true})});await panel.getByRole('button',{name:workspaceCopy.fr.start,exact:true}).click();await page.locator('.candidate-form').getByLabel(t.fields.city,{exact:false}).fill('Bukavu');await page.getByRole('link',{name:new RegExp(t.applications)}).click();
 const modal=page.getByRole('dialog');await expect(modal).toBeVisible();await expect(modal).toContainText(u.leave);await modal.getByLabel('Enregistrer et quitter',{exact:true}).check();await modal.getByRole('button',{name:'Continuer',exact:true}).click();await expect(modal.getByRole('alert')).toBeVisible();await page.screenshot({path:`test-results/candidate-profile/leave-${width}.png`,fullPage:true});await modal.getByRole('button',{name:'Annuler',exact:true}).click();await expect(page.locator('.candidate-form').getByLabel(t.fields.city,{exact:false})).toHaveValue('Bukavu');expect(writes.filter(w=>w.action==='save')).toHaveLength(1);expect(writes.some(w=>w.action==='cancel')).toBe(false);
});
test('candidate failed deletion retains the draft',async({page})=>{
 const writes=await fixture(page,{expired:true,failDelete:true}),u=candidateUX.fr;await page.goto('/fr/shida/space?view=candidate');await page.getByRole('button',{name:workspaceCopy.fr.remove,exact:true}).click();const modal=page.getByRole('dialog');await modal.getByRole('button',{name:u.delete,exact:true}).click();await expect(modal.getByRole('alert')).toBeVisible();await modal.getByRole('button',{name:u.keep}).click();await expect(page.locator('.candidate-draft-card')).toBeVisible();expect(writes).toHaveLength(1);
});

for(const locale of ['en','fr','ln','sw'] as const)test(`candidate confirmation keyboard and failure ${locale}`,async({page})=>{
 const writes=await fixture(page,{existing:true}),t=candidateCopy[locale];
 page.on('dialog',()=>{throw new Error('Native browser confirmation must not open');});
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/space?view=candidate`);
 const trigger=page.getByRole('button',{name:t.archive,exact:true});await trigger.click();
 const modal=page.getByRole('dialog');await expect(modal).toBeVisible();
 await expect(modal).toHaveAttribute('aria-describedby',/.+/);
 await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await expect(trigger).toBeFocused();expect(writes).toHaveLength(0);
 await trigger.click();await modal.getByRole('button',{name:t.archive,exact:true}).click();
 await expect(modal.getByRole('alert')).toBeVisible();await expect(modal).toBeVisible();expect(writes).toHaveLength(1);
 expect(writes[0]).toMatchObject({action:'archive',reference:'CND_test',version:'2026-11-04T00:00:00Z'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

for (const [width,withCV] of [[360,true],[1440,false]] as const) test(`professional draft, section edits and private creation at ${width}`,async({page})=>{
 const writes=await fixture(page,{success:true});
 const t=candidateCopy.fr;let uploads=0;
 await page.route('**/personal/candidate/document/**',route=>++uploads===1?route.fulfill({json:{asset_ref:'AST_fixture'}}):route.fulfill({status:503,json:{}}));
 await page.setViewportSize({width,height:800});
 await page.goto('/fr/shida/space?view=job-search&section=profiles&profile=professional');
 const wizard=page.locator('.professional-wizard');
 await wizard.getByRole('button',{name:t.next,exact:true}).click();
 await expect(wizard.locator('[role=alert]')).toHaveCount(5);
 await expect(wizard.getByRole('combobox').first()).toBeFocused();
 const sector=wizard.getByRole('combobox',{name:t.fields.primary_category});
 await sector.press('ArrowDown');await sector.press('Enter');
 const roles=wizard.getByLabel(t.fields.desired_titles,{exact:true});
 for(const name of ['Comptable','Assistant','Analyste','comptable']){await roles.fill(name);await roles.press('Enter');}
 await expect(wizard.locator('.candidate-chips button')).toHaveCount(3);
 await roles.fill('Quatrième');await roles.press('Enter');await expect(wizard.locator('.candidate-chips button')).toHaveCount(3);await roles.fill('');
 await wizard.getByLabel(t.fields.city).fill('Goma');
 await wizard.getByRole('button',{name:t.save}).click();
 await page.reload();
 await expect(wizard.getByLabel(t.fields.city)).toHaveValue('Goma');
 await expect(wizard.locator('.candidate-chips button')).toHaveCount(3);
 await wizard.getByRole('checkbox',{name:'CDI',exact:true}).check();
 const availability=wizard.getByRole('combobox',{name:t.fields.availability});await availability.press('ArrowDown');await availability.press('Enter');
 await wizard.getByRole('button',{name:t.next,exact:true}).click();
 await wizard.getByRole('button',{name:'Vérifier mon profil →'}).click();
 const level=wizard.getByRole('combobox',{name:t.fields.experience_level});
 await expect(level).toBeFocused();await level.press('ArrowDown');await level.press('ArrowDown');await level.press('Escape');
 await expect(level).toContainText('Sélectionner un niveau');await level.press('ArrowDown');await level.press('Enter');
 await level.click();await expect(wizard.getByRole('option',{selected:true})).toHaveText(/Aucune expérience/);
 await page.screenshot({path:`test-results/candidate-profile/selector-${width}.png`,fullPage:true});await level.press('Escape');
 await wizard.getByLabel(t.fields.skills,{exact:true}).fill('Excel');await page.keyboard.press('Enter');
 const introduction='Je prépare les factures.\nJe suis les paiements.';
 await wizard.getByLabel(t.fields.description).fill(introduction);
 await wizard.locator('.candidate-optional summary').click();await wizard.getByLabel(t.fields.education,{exact:true}).fill('Graduat');
 if(withCV){
  const pdf={name:'Parcours.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7 fixture')};
  await wizard.locator('input[type=file]').setInputFiles(pdf);await expect(wizard.getByText(pdf.name,{exact:true})).toBeVisible();
  await wizard.locator('input[type=file]').setInputFiles({...pdf,name:'Autre.pdf'});await expect(wizard.getByRole('alert')).toBeVisible();await expect(wizard.getByText(pdf.name,{exact:true})).toBeVisible();
 }
 await wizard.getByRole('button',{name:t.save}).click();await page.reload();
 await expect(wizard.getByRole('heading',{name:t.review})).toBeVisible();
 await expect(wizard).toContainText(withCV?'Parcours.pdf':'Aucun CV ajouté');await expect(wizard).toContainText('Graduat');
 await wizard.getByLabel(t.confirm).check();
 await wizard.getByRole('button',{name:'Modifier ma recherche'}).press('Enter');await wizard.getByLabel(t.fields.city).fill('Bukavu');await wizard.getByRole('button',{name:'Revenir à la vérification'}).click();
 await expect(wizard).toContainText('Bukavu');await expect(wizard.getByLabel(t.confirm)).not.toBeChecked();
 await wizard.getByRole('button',{name:'Modifier les détails'}).press('Enter');await expect(wizard.getByLabel(t.fields.education,{exact:true})).toBeVisible();
 await wizard.getByRole('button',{name:'Revenir à la vérification'}).click();await expect(wizard.locator('.review-introduction dd')).toHaveText(introduction);
 await wizard.getByLabel(t.confirm).press('Space');await wizard.getByRole('button',{name:t.create}).press('Enter');
 await expect(page.getByText(t.success,{exact:true})).toBeVisible();
 expect(writes.filter(item=>item.action==='finalize')).toHaveLength(1);
});
