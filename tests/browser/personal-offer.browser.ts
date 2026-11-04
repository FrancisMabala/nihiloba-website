import {test,expect,type Page} from '@playwright/test';
import {personalOfferCopy} from '../../app/lib/personal-offer-copy';
async function fixture(page:Page){
 let draft:Record<string,unknown>|null=null;
 const writes:Record<string,unknown>[]=[];
 await page.route('**/api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test employer'}});
  if(path.endsWith('/personal/job-offer')){
   if(request.method()==='GET')return reply({progress:draft?[draft]:[],capacity:{used:0,limit:3},identity:{name:'Test employer',city:'Goma',commune:'Centre'}});
   const body=request.postDataJSON();writes.push(body);
   if(body.action==='start'){draft={public_ref:'PJO_test',revision:1,state:'active',values:{},result_job_ref:null};return reply(draft);}
   if(body.action==='save'){draft={...draft,revision:Number(draft?.revision)+1,values:body.values};return reply(draft);}
   if(body.action==='cancel'){draft={...draft,state:'cancelled'};return reply(draft);}
   if(body.action==='finalize'){
    if(writes.filter(w=>w.action==='finalize').length===1)return reply({},503);
    draft={...draft,state:'completed',result_job_ref:'JOB_test',values:{}};return reply(draft);
   }
  }
  return reply({},404);
 });return writes;
}
for(const [locale,width] of [['en',1440],['fr',390],['ln',768],['sw',360],['fr',1024]] as const)test(`offer explicit publication and retry ${locale} ${width}`,async({page})=>{
 const writes=await fixture(page),t=personalOfferCopy[locale];await page.setViewportSize({width,height:1000});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/space?view=job-offer`);
 await page.getByRole('button',{name:t.start,exact:true}).click();
 const form=page.locator('.candidate-form');await expect(form.getByLabel(t.fields.work_city,{exact:false})).toHaveValue('Goma');
 for(const [field,value] of [['job','Household assistant'],['work_city','Kinshasa'],['commune','Gombe'],['quartier','Centre'],['short_summary','Help with household tasks']] as const)await form.getByLabel(t.fields[field],{exact:false}).fill(value);
 await form.getByRole('button',{name:t.next,exact:true}).click();
 for(const [field,value] of [['duration_frequency','Part time'],['work_schedule','Monday and Friday, 09:00–13:00'],['budget','180 USD / month']] as const)await form.getByLabel(t.fields[field],{exact:false}).fill(value);
 await form.getByRole('button',{name:t.next,exact:true}).click();
 await expect(form.getByRole('button',{name:t.publish,exact:true})).toBeDisabled();
 await expect(form).toContainText('180 USD / month');
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
test('cancelled progress uses a new operation key on next start',async({page})=>{
 const writes=await fixture(page),t=personalOfferCopy.en;await page.goto('/shida/space?view=job-offer');
 await page.getByRole('button',{name:t.start,exact:true}).click();
 await page.getByRole('button',{name:t.save,exact:true}).click();
 page.on('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:t.cancel,exact:true}).click();
 await page.getByRole('button',{name:t.start,exact:true}).click();
 const starts=writes.filter(w=>w.action==='start');expect(starts).toHaveLength(2);expect(starts[0].operation_key).not.toBe(starts[1].operation_key);
});
