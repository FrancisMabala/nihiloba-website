import {test,expect,type Page} from '@playwright/test';
import {registrationCopy,registrationEligibility} from '../../app/lib/registration/copy';
import {personalLoginCopy} from '../../app/lib/personal-login-copy';
import {PERSONAL_SESSION_EVENT} from '../../app/lib/personal-session-browser';
test.beforeEach(async({page,browserName})=>{
 if(browserName!=='webkit')return;
 // Only this HTTP fixture response differs; production retains HTTPS upgrades.
 await page.route('http://127.0.0.1:3044/**',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const response=await route.fetch(),headers=response.headers();
  headers['content-security-policy']=headers['content-security-policy']?.replace(/;?\s*upgrade-insecure-requests/g,'')||'';
  await route.fulfill({response,headers});
 });
});
async function fixture(page:Page,existing=false,business=false){
 const state={verified:existing,revision:1,status:'active',values:{} as Record<string,string>,accepted:false,completed:false,stale:false};
 await page.addInitScript(()=>{window.open=()=>null;});
 await page.route('**/api/shida/**',async route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,''),method=route.request().method();
  const reply=(value:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
  const projection=()=>({onboarding_ref:business?'ONB_fixture':'POD_fixture',revision:state.revision,status:state.status,values:state.values,existing_account:false,organization_types:['company','school'],sectors:['commerce_distribution'],remaining_fields:(business?['name','organization_type','sector','personal_name','city','country_code','commune_or_municipality','street_or_avenue','building_or_parcel']:['personal_name','city','country_code']).filter(key=>!state.values[key]),legal:[{document_type:'SHIDA_TERMS_OF_USE',version:'1',url:'https://nihiloba.com/shida/terms/1.0/',accepted:state.accepted},{document_type:'SHIDA_PRIVACY_POLICY',version:'1',url:'https://nihiloba.com/shida/privacy/1.0/',accepted:state.accepted},...(business?[{document_type:'SHIDA_BUSINESS_TERMS',version:'1',url:'https://nihiloba.com/shida/business/terms/1.0/',accepted:state.accepted}]:[])]});
  if(path.endsWith('/auth/whatsapp/registration')){expect(route.request().headers()['x-shida-eligibility']).toBe('adult-drc-v1');return reply({challenge_ref:'DWC_fixture_test',expires_at:new Date(Date.now()+300000).toISOString(),whatsapp_url:'https://wa.me/243000000000?text=synthetic-not-sent'},201);}
  if(path.includes('/auth/whatsapp/registration/DWC_')){if(path.endsWith('/session')){state.verified=true;return reply({verified:true});}return reply({status:'verified'});}
  if(path.includes('/registration/')){
   if(!state.verified)return reply({error:{code:'unauthorized'}},401);
   if(path.endsWith('/finish/session'))return reply({authenticated:true});
   if(path.endsWith('/business-handoff'))return reply({token:'x'.repeat(43)});
   if(path.endsWith('/complete')){state.completed=true;state.status='completed';return reply(projection());}
   if(path.endsWith('/cancel')){state.status='cancelled';return reply(projection());}
   if(method==='PATCH'){
    if(state.stale)return reply({error:{code:'stale_onboarding'}},409);
    const data=route.request().postDataJSON();expect(data.revision).toBe(state.revision);state.values={...state.values,...data.values};if(state.values.city==='Kinshasa')state.values.country_code='CD';state.revision++;if(Object.keys(data.accept_documents??{}).length===(business?3:2))state.accepted=true;
   }
   return reply(projection());
  }
  return reply({},401);
 });
 return state;
}
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,768,1366])test(`${locale} ${width}: guided Personal registration`,async({page},testInfo)=>{
 const state=await fixture(page),t=registrationCopy[locale],login=personalLoginCopy[locale];await page.setViewportSize({width,height:900});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/register/`);
 await expect(page.getByRole('heading',{name:t.title})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='en')await page.screenshot({path:`test-results/registration/${testInfo.project.name}-choice-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:t.next,exact:true}).click();
 await expect(page.getByRole('button',{name:login.start,exact:true})).toBeDisabled();
 await page.getByLabel(registrationEligibility[locale]).check();
 await page.getByRole('button',{name:login.start,exact:true}).click();
 await page.getByLabel(login.codeLabel).fill('610294');await page.getByRole('button',{name:t.verifyButton,exact:true}).click();
 await page.locator('#registration-personal_name').fill('Synthetic Personal');await page.getByRole('button',{name:t.next,exact:true}).click();
 await page.locator('#registration-city').fill('Kinshasa');await page.locator('#registration-city').press('Tab');
 await expect.poll(()=>state.values.city).toBe('Kinshasa');
 await page.locator('#registration-area').fill('Gombe');
 if(locale==='en')await page.screenshot({path:`test-results/registration/${testInfo.project.name}-details-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:t.next,exact:true}).click();
  await expect(page.locator('.registration-consent input')).toHaveCount(2);
 for(const checkbox of await page.locator('.registration-consent input').all())await checkbox.check();
 await page.getByRole('button',{name:t.next,exact:true}).click();
 await expect(page.getByRole('heading',{name:t.review,exact:true})).toBeVisible();
 await page.getByRole('button',{name:t.finish,exact:true}).click();await expect(page).toHaveURL(/\/shida\/space\//);expect(state.completed).toBe(true);
});
for(const locale of ['en','fr','ln','sw'] as const)test(`${locale}: Organization fields and private Business POST handoff`,async({page})=>{
 const state=await fixture(page,true,true),t=registrationCopy[locale];let handedOff=false;
 await page.route('https://business.nihiloba.com/handoff',async route=>{expect(route.request().method()).toBe('POST');expect(route.request().headers().origin).toBe('http://127.0.0.1:3044');expect(new URLSearchParams(route.request().postData()!).get('token')).toBe('x'.repeat(43));handedOff=true;await route.fulfill({contentType:'text/html',body:'<title>Business fixture</title><p>Business fixture</p>'});});
 await page.setViewportSize({width:390,height:900});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/register/`);
 await page.locator('input[value="business"]').check();await page.getByRole('button',{name:t.next,exact:true}).click();
 await page.locator('#registration-name').fill('Synthetic School');await page.locator('#registration-organization_type').selectOption('school');await page.locator('#registration-sector').selectOption('commerce_distribution');await page.getByRole('button',{name:t.next,exact:true}).click();
 for(const [key,value] of Object.entries({personal_name:'Synthetic Creator',country_code:'CD',city:'Kinshasa'}))await page.locator(`#registration-${key}`).fill(value);
 await page.getByRole('button',{name:t.next,exact:true}).click();
 for(const [key,value] of Object.entries({commune_or_municipality:'Gombe',street_or_avenue:'Private street',building_or_parcel:'42'}))await page.locator(`#registration-${key}`).fill(value);
 await page.getByRole('button',{name:t.next,exact:true}).click();await expect(page.locator('.registration-consent input')).toHaveCount(3);
 for(const checkbox of await page.locator('.registration-consent input').all())await checkbox.check();
 await page.getByRole('button',{name:t.next,exact:true}).click();await page.getByRole('button',{name:t.finish,exact:true}).click();
 await expect(page).toHaveURL('https://business.nihiloba.com/handoff');expect(handedOff&&state.completed).toBe(true);expect(page.url()).not.toContain('token');
});
test('stale drafts require explicit reload, cancellation is deliberate',async({page})=>{
 const state=await fixture(page,true);await page.goto('/shida/register/');await page.getByRole('button',{name:'Next',exact:true}).click();
 state.stale=true;await page.locator('#registration-personal_name').fill('Draft Name');await page.getByRole('button',{name:'Next',exact:true}).click();
 await expect(page.getByText(registrationCopy.en.changed,{exact:true})).toBeVisible();expect(state.values.personal_name).toBeUndefined();
 state.stale=false;await page.getByRole('button',{name:registrationCopy.en.reload}).click();
 await page.getByRole('button',{name:registrationCopy.en.cancel,exact:true}).click();await expect(page.getByText(registrationCopy.en.cancelQuestion)).toBeVisible();expect(state.status).toBe('active');
 await page.getByRole('button',{name:registrationCopy.en.cancel,exact:true}).click();await expect(page.getByText(registrationCopy.en.cancelled)).toBeVisible();expect(state.status).toBe('cancelled');
});

test('mobile navigation follows keyboard viewport without covering form actions',async({page})=>{
 await fixture(page,true);await page.setViewportSize({width:390,height:900});await page.goto('/shida/register/');
 await page.getByRole('button',{name:'Next',exact:true}).click();await page.locator('#registration-personal_name').focus();
 const nav=page.locator('.shida-navigation');await expect(nav).toBeVisible();
 // Emulate only the keyboard's visual viewport contraction; focus alone is insufficient.
 await page.evaluate(()=>{Object.defineProperty(window.visualViewport!,'height',{configurable:true,value:450});window.visualViewport!.dispatchEvent(new Event('resize'));});
 await expect(nav).toBeHidden();await page.locator('#registration-personal_name').blur();await expect(nav).toBeHidden();
 await page.evaluate(()=>{delete (window.visualViewport as unknown as {height?:number}).height;window.visualViewport!.dispatchEvent(new Event('resize'));});
 await expect(nav).toBeVisible();await page.locator('#registration-personal_name').fill('Keyboard User');
 await page.locator('#registration-personal_name').press('Enter');await expect(page.locator('#registration-city')).toBeVisible();
});

test('another tab changing account clears private draft values',async({page})=>{
 await fixture(page,true);await page.goto('/shida/register/');await page.getByRole('button',{name:'Next',exact:true}).click();
 await page.locator('#registration-personal_name').fill('Private Draft');
 await page.evaluate(key=>window.dispatchEvent(new StorageEvent('storage',{key,newValue:'other-tab'})),PERSONAL_SESSION_EVENT);
 await expect(page.locator('#registration-personal_name')).toHaveCount(0);await expect(page.getByText('Private Draft',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:registrationCopy.en.verify,exact:true}).first()).toBeVisible();
});

test('account changes during a slow resume cannot reveal the old draft',async({page})=>{
 await fixture(page,true);let release!:()=>void,started=false;
 const pending=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/shida/registration/personal/',async route=>{
  started=true;await pending;await route.fulfill({json:{onboarding_ref:'POD_old',revision:1,status:'active',values:{personal_name:'Previous Account'},remaining_fields:[],legal:[]}});
 });
 await page.goto('/shida/register/');await page.getByRole('button',{name:'Next',exact:true}).click();
 await expect.poll(()=>started).toBe(true);await expect(page.getByRole('button',{name:'Back',exact:true})).toBeDisabled();
 await page.evaluate(key=>window.dispatchEvent(new StorageEvent('storage',{key,newValue:'other-tab'})),PERSONAL_SESSION_EVENT);release();
 await expect(page.getByRole('button',{name:personalLoginCopy.en.start,exact:true})).toBeVisible();
 await expect(page.locator('#registration-personal_name')).toHaveCount(0);await expect(page.getByText('Previous Account',{exact:true})).toHaveCount(0);
});

test('Personal settings edits canonical profile without exposing credentials',async({page},testInfo)=>{
 await fixture(page,true);let revision='initial';const values={personal_name:'Profile User',city:'Kinshasa',country_code:'CD',area:'Gombe'};
 await page.route('**/api/shida/employment/session/',route=>route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Profile User'}}}));
 await page.route('**/api/shida/registration/profile/',async route=>{
  if(route.request().method()==='PATCH'){const body=route.request().postDataJSON();expect(body).toEqual({revision:'initial',values:{area:'Lingwala'}});revision='updated';Object.assign(values,body.values);}
  await route.fulfill({json:{revision,values}});
 });
 await page.setViewportSize({width:390,height:900});await page.goto('/shida/space/?view=settings');
 await expect(page.locator('#profile-personal_name')).toHaveValue('Profile User');await page.locator('#profile-area').fill('Lingwala');
 await page.locator('.registration-card button[type=submit]').click();await expect.poll(()=>revision).toBe('updated');
 await expect(page.locator('.registration-card button[type=submit]')).toBeEnabled();
 await expect(page.locator('#profile-area')).toHaveValue('Lingwala');await expect(page.locator('#profile-phone_number')).toHaveCount(0);
 await page.screenshot({path:`test-results/registration/${testInfo.project.name}-profile-390.png`,fullPage:true});
});
