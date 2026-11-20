import {test,expect,type Page,type Locator} from '@playwright/test';
import {personalOfferCopy} from '../../app/lib/personal-offer-copy';
import {confirmationActions} from '../../app/lib/confirmation-actions';
import {missionText} from '../../app/lib/mission-copy';
import {occText,type OccLocale} from '../../app/lib/occasional-copy';

async function fixture(page:Page,locale:OccLocale,failDelete=false){
 let draft:Record<string,unknown>|null=null;
 const writes:Record<string,unknown>[]=[];
 const locations={kinshasa_communes:['Gombe','Lemba'],quartiers:{Gombe:['Centre'],Lemba:['School area']}};
 await page.route('**/api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test employer'}});
  if(path.endsWith('/registration-reference'))return reply(locations);
  if(path.endsWith('/personal/job-offer')){
   if(request.method()==='GET')return reply({progress:draft?[draft]:[],capacity:{used:0,limit:3},identity:{name:'Test employer',city:'Goma',commune:'Centre'},locations});
   const body=request.postDataJSON();writes.push(body);
   if(body.action==='start'){draft={public_ref:'PJO_test',revision:1,state:'active',values:{},result_job_ref:null};return reply(draft);}
   if(body.action==='preview'){
    // Preview is non-mutating and returns server-formatted presentation.
    expect(body.public_ref).toBe('PJO_test');expect(body.revision).toBe(draft?.revision);
    const terms=JSON.parse(body.values.mission_terms);
    return reply({...body.values,duration_frequency:missionText(locale,'regular'),
     work_schedule:terms.hours==='flexible'?`${occText(locale,'tue')} · ${missionText(locale,'flexible')}`:`${occText(locale,'mon')}, ${occText(locale,'fri')} · 09:00–13:00`,
     budget:terms.rate==='amount'?`180 USD / ${occText(locale,'day')}`:null});
   }
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

async function choose(form:Locator,id:string,value:string){
 const picker=form.locator('#select-'+id);await picker.fill(value);
 await form.getByRole('option',{name:value,exact:true}).click();
}
async function mission(form:Locator,locale:OccLocale){
 await choose(form,'category',missionText(locale,'cleaning'));
 await form.getByRole('textbox',{name:missionText(locale,'job')+' *',exact:true}).fill('Household assistant');
 await form.getByRole('textbox',{name:missionText(locale,'short_summary'),exact:true}).fill('Help with household tasks');
}

for(const [locale,width] of [['en',1440],['fr',390],['ln',768],['sw',360],['fr',1024]] as const)test(`offer explicit publication and retry ${locale} ${width}`,async({page})=>{
 const writes=await fixture(page,locale),t=personalOfferCopy[locale],m=(key:string)=>missionText(locale,key),o=(key:string)=>occText(locale,key);
 await page.setViewportSize({width,height:1000});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/space?view=job-offer`);
 await page.getByRole('button',{name:m('title'),exact:true}).click();const form=page.locator('.mission-wizard .candidate-form');
 // Work location is explicit; the account's home city is not a mission location.
 await expect(form.locator('#select-work_city')).toHaveValue('');
 await form.getByRole('button',{name:t.next,exact:true}).click();await expect(form.locator('#mission-category')).toBeFocused();
 await expect(form.locator('#mission-category [role=alert]')).toBeVisible();expect(writes.map(w=>w.action)).toEqual(['start']);
 await mission(form,locale);await choose(form,'work_city','Kinshasa');await choose(form,'commune','Gombe');await choose(form,'quartier','Centre');
 await page.screenshot({path:test.info().outputPath(`step1-${locale}-${width}.png`),fullPage:true});
 await form.getByRole('button',{name:t.next,exact:true}).click();
 await form.getByRole('button',{name:m('regular'),exact:true}).click();await form.getByRole('button',{name:m('fixed'),exact:true}).click();
 await form.getByLabel(m('start'),{exact:true}).fill('09:00');await form.getByLabel(m('end'),{exact:true}).fill('13:00');
 await form.getByRole('button',{name:m('reviewAction'),exact:true}).click();await expect(form.locator('#mission-weekdays')).toBeFocused();
 await expect(form.locator('#mission-weekdays [role=alert]')).toBeVisible();expect(writes.map(w=>w.action)).toEqual(['start']);
 for(const day of ['mon','fri'])await form.getByRole('button',{name:o(day),exact:true}).click();
 await expect(form.locator('#mission-weekdays [role=alert]')).toHaveCount(0);
 await form.getByRole('button',{name:m('indicateAmount'),exact:true}).click();await form.getByLabel(o('amount'),{exact:true}).fill('180');
 await form.getByRole('combobox',{name:o('currency'),exact:true}).selectOption('USD');await form.getByRole('combobox',{name:o('unit'),exact:true}).selectOption('day');
 await page.screenshot({path:test.info().outputPath(`step2-${locale}-${width}.png`),fullPage:true});
 await form.getByRole('button',{name:m('reviewAction'),exact:true}).click();
 const publish=form.getByRole('button',{name:m('publishListing'),exact:true});await expect(publish).toBeDisabled();
 await expect(form).toContainText(`180 USD / ${o('day')}`);await expect(form).toContainText('09:00–13:00');
 expect(writes.map(w=>w.action)).toEqual(['start','preview']);
 const preview=writes.find(w=>w.action==='preview')!.values as Record<string,string>;
 expect(JSON.parse(preview.mission_terms)).toMatchObject({category:'cleaning',frequency:'regular',weekdays:['mon','fri'],hours:'fixed',start:'09:00',end:'13:00',rate:'amount',amount:'180',currency:'USD',unit:'day'});
 await form.getByLabel(m('checked'),{exact:true}).check();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:test.info().outputPath(`review-${locale}-${width}.png`),fullPage:true});
 await publish.click();await expect(page.locator('.candidate-notice[role=alert]')).toContainText(t.error);
 await publish.click();await expect(page.locator('.candidate-notice[role=status]')).toContainText(t.success);
 const attempts=writes.filter(w=>w.action==='finalize');expect(attempts).toHaveLength(2);expect(attempts[0]).toEqual(attempts[1]);
 expect(attempts[0]).toMatchObject({public_ref:'PJO_test',revision:2,confirmed:true});
 // Steps preview only; first publication saves once and retry reuses that revision.
 expect(writes.map(w=>w.action)).toEqual(['start','preview','save','finalize','finalize']);
 expect(writes.find(w=>w.action==='save')!.values).toEqual(preview);
});

test('location changes clear dependent fields; flexible schedule and omitted salary remain accurate',async({page})=>{
 const writes=await fixture(page,'en'),t=personalOfferCopy.en,m=(key:string)=>missionText('en',key);
 await page.goto('/shida/space?view=job-offer');await page.getByRole('button',{name:m('title'),exact:true}).click();const form=page.locator('.mission-wizard .candidate-form');
 await choose(form,'work_city','Goma');await form.getByLabel(t.fields.commune,{exact:true}).fill('Centre');await form.getByLabel(m('district'),{exact:true}).fill('Old area');
 await choose(form,'work_city','Kinshasa');await expect(form.locator('#select-commune')).toHaveValue('');
 await choose(form,'commune','Gombe');await expect(form.locator('#select-quartier')).toHaveValue('');await choose(form,'quartier','Centre');
 await choose(form,'commune','Lemba');await expect(form.locator('#select-quartier')).toHaveValue('');
 await form.getByRole('button',{name:m('manual'),exact:true}).click();await form.getByLabel(m('district'),{exact:true}).fill('Manual area');
 await mission(form,'en');await form.getByRole('button',{name:t.next,exact:true}).click();
 await form.getByRole('button',{name:m('regular'),exact:true}).click();await form.getByRole('button',{name:occText('en','tue'),exact:true}).click();
 await form.getByRole('button',{name:m('flexible'),exact:true}).click();await expect(form.getByLabel(m('start'),{exact:true})).toHaveCount(0);
 await expect(form.getByRole('button',{name:m('nonSpecified'),exact:true})).toHaveAttribute('aria-pressed','true');
 await form.getByRole('button',{name:m('reviewAction'),exact:true}).click();await expect(form).toContainText(m('flexible'));
 await expect(form.locator('.mission-terms dt').filter({hasText:m('payLabel')})).toHaveCount(0);
 const values=writes.find(w=>w.action==='preview')!.values as Record<string,string>;
 expect(values).toMatchObject({work_city:'Kinshasa',commune:'Lemba',quartier:'Manual area'});
 expect(JSON.parse(values.mission_terms)).toMatchObject({frequency:'regular',weekdays:['tue'],schedule_note:'',hours:'flexible',rate:'',amount:'',currency:'',unit:''});
 expect(writes.map(w=>w.action)).toEqual(['start','preview']);
 await form.getByRole('button',{name:t.back,exact:true}).click();
 await expect(form.getByRole('button',{name:occText('en','tue'),exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(form.getByRole('button',{name:m('flexible'),exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(form.getByLabel(m('schedule_note'),{exact:true})).toHaveCount(0);
 await expect(form.getByRole('button',{name:m('nonSpecified'),exact:true})).toHaveAttribute('aria-pressed','true');
});

test('cancelled progress uses a new operation key on next start',async({page})=>{
 const writes=await fixture(page,'en'),t=personalOfferCopy.en;await page.goto('/shida/space?view=job-offer');
 await page.getByRole('button',{name:missionText('en','title'),exact:true}).click();await page.getByRole('button',{name:t.save,exact:true}).click();
 await page.getByRole('button',{name:confirmationActions.en.deleteDraft,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:confirmationActions.en.deleteDraft,exact:true}).click();
 await expect(page.getByRole('button',{name:t.resume,exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:missionText('en','title'),exact:true}).click();
 const starts=writes.filter(w=>w.action==='start');expect(starts).toHaveLength(2);expect(starts[0].operation_key).not.toBe(starts[1].operation_key);
});

test('saved offer removal requires specific confirmation and preserves on failure',async({page})=>{
 const writes=await fixture(page,'fr',true),t=personalOfferCopy.fr,c=confirmationActions.fr;
 await page.goto('/fr/shida/space?view=job-offer');await page.getByRole('button',{name:missionText('fr','title'),exact:true}).click();
 await page.locator('.candidate-form').getByRole('button',{name:t.save,exact:true}).click();page.on('dialog',()=>{throw Error('Native confirmation');});
 await page.getByRole('button',{name:c.deleteDraft,exact:true}).click();const modal=page.getByRole('dialog');await expect(modal).toContainText(c.deleteOffer);
 await modal.getByRole('button',{name:c.keepDraft,exact:true}).click();await expect(page.getByRole('button',{name:t.resume,exact:true})).toBeVisible();expect(writes.some(w=>w.action==='cancel')).toBe(false);
 await page.getByRole('button',{name:c.deleteDraft,exact:true}).click();await modal.getByRole('button',{name:c.deleteDraft,exact:true}).click();await expect(modal.getByRole('alert')).toBeVisible();
 await modal.getByRole('button',{name:c.keepDraft,exact:true}).click();await expect(page.getByRole('button',{name:t.resume,exact:true})).toBeVisible();expect(writes.filter(w=>w.action==='cancel')).toHaveLength(1);
});
