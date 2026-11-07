import {test,expect,type Page} from '@playwright/test';
import {personalOfferCopy} from '../../app/lib/personal-offer-copy';
import {confirmationActions} from '../../app/lib/confirmation-actions';
import {offerFormCopy} from '../../app/lib/personal-offer-form';
async function fixture(page:Page,failDelete=false){
 let draft:Record<string,unknown>|null=null;
 const writes:Record<string,unknown>[]=[];
 await page.route('**/api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test employer'}});
  if(path.endsWith('/registration-reference'))return reply({kinshasa_communes:['Gombe','Lemba'],quartiers:{}});
  if(path.endsWith('/personal/job-offer')){
   if(request.method()==='GET')return reply({progress:draft?[draft]:[],capacity:{used:0,limit:3},identity:{name:'Test employer',city:'Goma',commune:'Centre'}});
   const body=request.postDataJSON();writes.push(body);
   if(body.action==='start'){draft={public_ref:'PJO_test',revision:1,state:'active',values:{},result_job_ref:null};return reply(draft);}
   if(body.action==='save'){draft={...draft,revision:Number(draft?.revision)+1,values:body.values};return reply(draft);}
   if(body.action==='cancel'){if(failDelete)return reply({},503);draft={...draft,state:'cancelled'};return reply(draft);}
   if(body.action==='finalize'){
    if(writes.filter(w=>w.action==='finalize').length===1)return reply({},503);
    draft={...draft,state:'completed',result_job_ref:'JOB_test',values:{}};return reply(draft);
   }
  }
  return reply({},404);
 });return writes;
}
for(const [locale,width] of [['en',1440],['fr',390],['ln',768],['sw',360],['fr',1024]] as const)test(`offer explicit publication and retry ${locale} ${width}`,async({page})=>{
 const writes=await fixture(page),t=personalOfferCopy[locale],f=offerFormCopy[locale];await page.setViewportSize({width,height:1000});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/space?view=job-offer`);
 await page.getByRole('button',{name:t.start,exact:true}).click();
 const form=page.locator('.candidate-form');await expect(form.getByLabel(t.fields.work_city,{exact:false})).toHaveValue('Goma');
 for(const [field,value] of [['job','Household assistant'],['work_city','Kinshasa'],['commune','Gombe'],['quartier','Centre'],['short_summary','Help with household tasks']] as const)await form.getByLabel(t.fields[field],{exact:false}).fill(value);
 await page.screenshot({path:`test-results/personal-offer/step1-${locale}-${width}.png`,fullPage:true});
 await form.getByRole('button',{name:t.next,exact:true}).click();
 await form.getByLabel(t.fields.duration_frequency,{exact:true}).selectOption(f.duration[1]);
 await form.getByLabel(f.week[0],{exact:true}).check();
 await form.getByLabel(f.week[4],{exact:true}).check();
 await form.getByLabel(f.from,{exact:true}).fill('09:00');
 await form.getByLabel(f.to,{exact:true}).fill('13:00');
 await form.getByLabel(f.skip,{exact:true}).uncheck();
 await form.getByLabel(f.amount,{exact:true}).fill('180');
 await form.getByRole('combobox',{name:f.currency,exact:true}).selectOption('USD');
 await form.getByRole('combobox',{name:f.period,exact:true}).selectOption(f.periods[0]);
 await page.screenshot({path:`test-results/personal-offer/step2-${locale}-${width}.png`,fullPage:true});
 await form.getByRole('button',{name:t.next,exact:true}).click();
 await expect(form.getByRole('button',{name:t.publish,exact:true})).toBeDisabled();
 await expect(form).toContainText(`180 USD / ${f.periods[0]}`);
 await form.getByLabel(t.confirm,{exact:true}).check();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:`test-results/personal-offer/review-${locale}-${width}.png`,fullPage:true});
 await form.getByRole('button',{name:t.publish,exact:true}).click();
 await expect(page.locator('.candidate-notice[role=alert]')).toContainText(t.error);
 await form.getByRole('button',{name:t.publish,exact:true}).click();
 await expect(page.getByRole('status')).toContainText(t.success);
 const attempts=writes.filter(w=>w.action==='finalize');expect(attempts).toHaveLength(2);expect(attempts[0]).toEqual(attempts[1]);
 expect(writes.filter(w=>w.action==='save')).toHaveLength(3);
});

test('location changes clear dependent fields; flexible schedule and omitted salary remain accurate',async({page})=>{
 const writes=await fixture(page),t=personalOfferCopy.en,f=offerFormCopy.en;
 await page.goto('/shida/space?view=job-offer');await page.getByRole('button',{name:t.start,exact:true}).click();
 const form=page.locator('.candidate-form');
 await form.getByLabel(t.fields.work_city,{exact:false}).fill('Kinshasa');
 await expect(form.getByLabel(t.fields.commune,{exact:false})).toHaveValue('');
 await form.getByLabel(t.fields.commune,{exact:false}).fill('Gombe');
 await form.getByLabel(t.fields.quartier,{exact:false}).fill('Old area');
 await form.getByLabel(t.fields.commune,{exact:false}).fill('Lemba');
 await expect(form.getByLabel(t.fields.quartier,{exact:false})).toHaveValue('');
 await form.getByLabel(t.fields.quartier,{exact:false}).fill('Manual area');
 await form.getByLabel(t.fields.job,{exact:false}).fill('Assistant');
 await form.getByLabel(t.fields.short_summary,{exact:false}).fill('General assistance');
 await form.getByRole('button',{name:t.next,exact:true}).click();
 await form.getByLabel(t.fields.duration_frequency,{exact:true}).selectOption(f.duration[2]);
 await form.getByLabel(f.week[1],{exact:true}).check();await form.getByLabel(f.flexible,{exact:true}).check();
 await expect(form.getByLabel(f.from,{exact:true})).toHaveCount(0);
 await form.getByRole('button',{name:t.next,exact:true}).click();
 await expect(form).toContainText(f.unspecified);await expect(form).toContainText(f.flexible);
 const values=writes.filter(w=>w.action==='save').at(-1)?.values as Record<string,unknown>;
 expect(values.budget??null).toBeNull();expect(values.work_schedule).toBe(`${f.week[1]} · ${f.flexible}`);
 await form.getByRole('button',{name:t.back,exact:true}).click();
 await expect(form.getByLabel(f.week[1],{exact:true})).toBeChecked();
 await expect(form.getByLabel(f.flexible,{exact:true})).toBeChecked();
 await expect(form.getByLabel(f.customSchedule,{exact:true})).not.toBeChecked();
});
test('cancelled progress uses a new operation key on next start',async({page})=>{
 const writes=await fixture(page),t=personalOfferCopy.en;await page.goto('/shida/space?view=job-offer');
 await page.getByRole('button',{name:t.start,exact:true}).click();
 await page.getByRole('button',{name:t.save,exact:true}).click();
 await page.getByRole('button',{name:confirmationActions.en.deleteDraft,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:confirmationActions.en.deleteDraft,exact:true}).click();
 await page.getByRole('button',{name:t.start,exact:true}).click();
 const starts=writes.filter(w=>w.action==='start');expect(starts).toHaveLength(2);expect(starts[0].operation_key).not.toBe(starts[1].operation_key);
});

 test('saved offer removal requires specific confirmation and preserves on failure',async({page})=>{
  const writes=await fixture(page,true);const t=personalOfferCopy.fr;
  await page.goto('/fr/shida/space?view=job-offer');await page.getByRole('button',{name:t.start,exact:true}).click();
  await page.locator('.candidate-form').getByRole('button',{name:t.save,exact:true}).click();
  page.on('dialog',()=>{throw Error('Native confirmation');});
  await page.getByRole('button',{name:'Supprimer le brouillon',exact:true}).click();
  const modal=page.getByRole('dialog');await expect(modal).toContainText(confirmationActions.fr.deleteOffer);
  await modal.getByRole('button',{name:'Conserver le brouillon',exact:true}).click();
  await expect(page.getByRole('button',{name:t.resume,exact:true})).toBeVisible();
  expect(writes.some(w=>w.action==='cancel')).toBe(false);
  await page.getByRole('button',{name:confirmationActions.fr.deleteDraft,exact:true}).click();
  await modal.getByRole('button',{name:confirmationActions.fr.deleteDraft,exact:true}).click();
  await expect(modal.getByRole('alert')).toBeVisible();
  await modal.getByRole('button',{name:confirmationActions.fr.keepDraft,exact:true}).click();
  await expect(page.getByRole('button',{name:t.resume,exact:true})).toBeVisible();
  expect(writes.filter(w=>w.action==='cancel')).toHaveLength(1);
 });
