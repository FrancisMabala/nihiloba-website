import {test,expect,type Page} from '@playwright/test';
import {candidateCopy} from '../../app/lib/candidate-profile-copy';
import {candidateUX} from '../../app/lib/candidate-ux';
import {formText} from '../../app/lib/professional-form-copy';

async function fixture(page:Page,locale:'fr'|'en'|'ln'|'sw',options:{existing?:boolean;conflict?:boolean}={}){
 const values:Record<string,unknown>={primary_category:'administration_office',desired_titles:['Custom role'],city:'Goma',work_types:['CDI'],availability:candidateUX[locale].availability[0],cv_choice:'2',...(options.existing?{job_alerts_enabled:true}:{})};
 let draft={public_ref:'COP_fixture',profile_type:'professional',state:'active',revision:1,values,return_job_ref:null,photo:null as null|{asset_ref:string;url:string}};
 let profile={reference:'CND_fixture',type:'professional',version:'2026-11-20T10:00:00Z',archived:false,visibility:'private',has_cv:false,values,photo:null as null|{asset_ref:string;url:string}};
 const writes:{path:string;body:Record<string,unknown>}[]=[];let uploads=0;
 await page.route('**/api/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test candidate'}});
  if(path.endsWith('/candidate/title-suggestions'))return reply({category:url.searchParams.get('category'),suggestions:[{title:url.searchParams.get('category')==='administration_office'?'Published assistant':'Published builder',source:'published_offer'}],maximum_titles:3});
  if(path.endsWith('/candidate/photo')){
   if(request.method()==='GET')return route.fulfill({status:404,json:{}}); // Explicit preview failure exercises retry without provider calls.
   const body=request.method()==='POST'?Object.fromEntries(url.searchParams):request.postDataJSON();writes.push({path,body});
   if(request.method()==='POST'&&++uploads===1)return reply({},503);
   if(options.conflict&&request.method()==='DELETE')return reply({},409);
   const photo=request.method()==='DELETE'?null:{asset_ref:'AST_fixture',url:'https://provider.invalid/must-not-fetch'};
   if(body.target==='profile'){profile={...profile,photo,version:'2026-11-20T10:00:0'+(uploads+1)+'Z'};return reply(profile);}
   draft={...draft,photo,revision:draft.revision+1};return reply(draft);
  }
  if(path.endsWith('/candidate/profile')){const body=request.postDataJSON();writes.push({path,body});profile={...profile,values:body.values,version:'2026-11-20T10:00:01Z'};return reply(profile);}
  if(path.endsWith('/personal/candidate')){
   if(request.method()==='GET')return reply({profiles:options.existing?[profile]:[],progress:options.existing?[]:[draft],metadata:{required:{professional:['primary_category','desired_titles','city','work_types','availability','skills','experience_level','description'],occasional_work:[]},categories:[{id:'administration_office',label:'Administration'},{id:'construction',label:'Construction'}]}});
   const body=request.postDataJSON();writes.push({path,body});if(body.action==='save'){draft={...draft,values:body.values,revision:draft.revision+1};return reply(draft);}return reply({},400);
  }
  return reply({},404);
 });
 return {writes};
}

for(const locale of ['fr','en','ln','sw'] as const)for(const width of [390,1440])test(`professional alert choice and optional photo retry ${locale} ${width}`,async({page},info)=>{
 const {writes}=await fixture(page,locale),t=candidateCopy[locale];await page.setViewportSize({width,height:900});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/space/?view=job-search&section=profiles&profile=professional`);
 const wizard=page.locator('.professional-wizard');
 // Saved search answers resume at experience; return to the search to inspect consent.
 await wizard.getByRole('button',{name:t.back,exact:true}).click();
 const alerts=wizard.getByRole('checkbox',{name:formText(locale,'alerts'),exact:true});await expect(alerts).not.toBeChecked();await alerts.check();
 await expect(wizard.locator('datalist option')).toHaveAttribute('value','Published assistant');
 await expect(wizard.locator('.candidate-chips')).toContainText('Custom role');
 await wizard.getByRole('button',{name:t.next,exact:true}).click();
 await wizard.getByLabel(t.fields.description,{exact:true}).fill('Preserve my introduction');
 const upload=wizard.locator('input[accept="image/jpeg,image/png,image/webp"]'),file={name:'Professional.png',mimeType:'image/png',buffer:Buffer.from('isolated-upload-fixture')};
 await upload.setInputFiles(file);await expect(wizard.getByRole('alert')).toContainText(t.error);
 await expect(wizard.getByLabel(t.fields.description,{exact:true})).toHaveValue('Preserve my introduction');
 await upload.setInputFiles(file);await expect(wizard.getByRole('button',{name:formText(locale,'removePhoto'),exact:true})).toBeVisible();
 await expect(wizard.getByRole('alert')).toContainText(formText(locale,'photoUnavailable'));
 await wizard.getByRole('button',{name:formText(locale,'removePhoto'),exact:true}).click();await expect(wizard.getByRole('button',{name:formText(locale,'removePhoto'),exact:true})).toHaveCount(0);
 expect(writes.filter(w=>w.body.action==='save').every(w=>(w.body.values as Record<string,unknown>).job_alerts_enabled===true)).toBeTruthy();
 const photos=writes.filter(w=>w.path.endsWith('/photo'));expect(photos.map(w=>w.body.revision)).toEqual(['2','3',5]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:info.outputPath('optional-photo-'+locale+'-'+width+'.png'),fullPage:true});
});

test('existing professional alert preference survives photo retry and revision conflict',async({page})=>{
 const {writes}=await fixture(page,'en',{existing:true,conflict:true});await page.goto('/shida/space/?view=job-search&section=profiles&profile=professional');
 const wizard=page.locator('.professional-wizard'),t=candidateCopy.en;
 await expect(wizard.getByRole('checkbox',{name:formText('en','alerts'),exact:true})).toBeChecked();
 await wizard.getByRole('button',{name:t.next,exact:true}).click();await wizard.getByLabel(t.fields.description,{exact:true}).fill('Preserve edit');
 const upload=wizard.locator('input[accept="image/jpeg,image/png,image/webp"]'),file={name:'photo.png',mimeType:'image/png',buffer:Buffer.from('isolated-upload-fixture')};
 await upload.setInputFiles(file);await expect(wizard.getByRole('alert')).toContainText(t.error);await upload.setInputFiles(file);
 await wizard.getByRole('button',{name:formText('en','removePhoto'),exact:true}).click();await expect(page.locator('.candidate-notice[role="alert"]')).toContainText(t.conflict);
 await expect(wizard.getByLabel(t.fields.description,{exact:true})).toHaveValue('Preserve edit');await expect(wizard.getByRole('button',{name:t.save,exact:true})).toBeDisabled();
 const update=writes.find(w=>w.body.action==='update');expect(update?.body.values).toMatchObject({job_alerts_enabled:true,description:'Preserve edit'});
 const photos=writes.filter(w=>w.path.endsWith('/photo'));expect(photos[0].body.version).toBe('2026-11-20T10:00:01Z');expect(photos[2].body.version).toBe('2026-11-20T10:00:03Z');
});

test('changing sector updates suggestions without replacing manual desired titles',async({page})=>{
 await fixture(page,'en',{existing:true});await page.goto('/shida/space/?view=job-search&section=profiles&profile=professional');
 const wizard=page.locator('.professional-wizard');await expect(wizard.locator('datalist option')).toHaveAttribute('value','Published assistant');
 await wizard.getByRole('combobox',{name:candidateCopy.en.fields.primary_category}).click();await wizard.getByRole('option',{name:'Construction',exact:true}).click();
 await expect(wizard.locator('datalist option')).toHaveAttribute('value','Published builder');await expect(wizard.locator('.candidate-chips')).toContainText('Custom role');
 const roles=wizard.getByLabel(candidateCopy.en.fields.desired_titles,{exact:true});for(const value of ['Manual second','Manual third','Cannot add fourth']){await roles.fill(value);await roles.press('Enter');}
 await expect(wizard.locator('.candidate-chips button')).toHaveCount(3);
});
