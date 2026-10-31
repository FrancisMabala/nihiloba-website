import {test,expect,type Page} from '@playwright/test';
import {registrationCopy,registrationEligibility,registrationFlowCopy,existingAccountContinue} from '../../app/lib/registration/copy';
import {personalLoginCopy} from '../../app/lib/personal-login-copy';
import {PERSONAL_SESSION_EVENT} from '../../app/lib/personal-session-browser';
import {refinementCopy} from '../../app/lib/registration/refinement-copy';
import {FORM_DRAFT_KEY} from '../../app/lib/registration/local-draft';
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
async function fillCountry(page:Page,code:string){
 await page.locator("#registration-country_code").fill(code);await expect(page.locator("#registration-country_code")).toHaveValue(code==="CD"?"Congo-Kinshasa":code==="SE"?"Sweden":code);if(await page.locator("#registration-commune").count())await page.locator("#registration-commune").selectOption("Gombe");
}

test('Kinshasa commune controls manual quartier and clears dependent location on country change',async({page})=>{
 await fixture(page);await page.goto('/shida/register/');await page.getByRole('button',{name:'Next',exact:true}).click();await page.locator('#registration-city').fill('Kinshasa');await fillCountry(page,'CD');
 await page.locator('#registration-quartier').fill('Manual quartier');await page.locator('#registration-avenue').fill('Private street');
 await page.locator('#registration-commune').selectOption('Lemba');await expect(page.locator('#registration-quartier')).toHaveValue('');
 await fillCountry(page,'SE');await expect(page.locator('#registration-commune')).toHaveCount(0);await expect(page.locator('#registration-avenue')).toHaveValue('');
});

test('country search selects canonical residence and keeps unknown suggestions provisional',async({page})=>{
 await fixture(page);await page.goto('/shida/register/');await page.getByRole('button',{name:'Next',exact:true}).click();
 const country=page.locator('.registration-country');await country.locator('input').fill('Swedn');await country.getByRole('button',{name:'Sweden',exact:true}).click();
 await expect(country.locator('input')).toHaveValue('Sweden');
 await country.locator('input').fill('Unknown land');await country.locator('summary').click();await country.getByRole('button',{name:'Submit country for review'}).click();
 await expect(country.getByText('Submitted for review. Choose a listed country to continue.')).toBeVisible();
 const draft=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)!),FORM_DRAFT_KEY);expect(draft.values.country_code).toBe('');
});
async function fillName(page:Page,name:string){
 if(await page.locator('#registration-personal_name').count())return page.locator('#registration-personal_name').fill(name);
 const [first,...rest]=name.split(' ');await page.locator('#registration-first_name').fill(first);await page.locator('#registration-family_name').fill(rest.join(' ')||first);
}

for(const locale of ['fr','ln','en','sw'] as const)test(`preferred ${locale} language survives refresh and reaches verification`,async({page})=>{
 await fixture(page);await page.goto('/shida/register/');await page.locator('#registration-language').selectOption(locale);
 await expect(page.getByRole('heading',{name:registrationCopy[locale].title,exact:true})).toBeVisible();
 await page.getByRole('button',{name:registrationCopy[locale].next,exact:true}).click();
 await fillName(page,'Language Person');await page.locator('#registration-city').fill('Stockholm');await fillCountry(page,'SE');await page.locator('#registration-phone').fill('+46910004001');
 await page.reload();await expect(page.locator('.registration-shell')).toHaveAttribute('lang',locale);await expect(page.locator('#registration-first_name')).toHaveValue('Language');
 await page.getByRole('button',{name:registrationCopy[locale].next,exact:true}).click();await page.getByLabel(registrationEligibility[locale]).check();
 const sent=page.waitForRequest(request=>request.method()==='POST'&&request.url().endsWith('/auth/whatsapp/registration/'));
 await page.getByRole('button',{name:personalLoginCopy[locale].open,exact:true}).click();expect((await sent).headers()['x-shida-language']).toBe(locale);
});

test('legacy account can confirm structured names without guessing the stored name',async({page})=>{
 await fixture(page,true);
 await page.route('**/api/shida/employment/session/',route=>route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Unsplit Legacy Name'}}}));
 const values:Record<string,string|null>={personal_name:'Unsplit Legacy Name',first_name:null,family_name:null,additional_name:null,city:'Stockholm',country_code:'SE',area:null};let saved=false;
 await page.route('**/api/shida/personal/security/profile/',async route=>{
  if(route.request().method()==='POST'){
   expect(route.request().postDataJSON().values).toEqual({first_name:'Éva',family_name:'O’Neill'});
   Object.assign(values,{first_name:'Éva',family_name:'O’Neill',personal_name:'Éva O’Neill'});saved=true;
  }
  await route.fulfill({json:{revision:'initial',values,primary_phone:{masked:'•••• 0001',verified:true},neighborhood:null}});
 });
 await page.goto('/shida/space/?view=settings');await page.locator('.space-profile').getByRole('button',{name:'Edit',exact:true}).click();
 await expect(page.locator('#profile-personal_name')).toHaveValue('Unsplit Legacy Name');await expect(page.locator('#profile-first_name')).toHaveValue('');
 await page.locator('#profile-first_name').fill('Éva');await page.locator('#profile-family_name').fill('O’Neill');await page.locator('.space-profile').getByRole('button',{name:'Save changes',exact:true}).click();
 await expect.poll(()=>saved).toBe(true);await expect(page.locator('.space-profile').getByText('Éva O’Neill',{exact:true})).toBeVisible();
});
async function fixture(page:Page,existing=false,business=false){
 const state={verified:existing,revision:1,status:existing?'active':'not_started',values:{} as Record<string,string>,accepted:false,completed:false,stale:false,existingAccount:false,race:false};
 await page.addInitScript(()=>{window.open=()=>null;});
 await page.route('**/api/shida/**',async route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,''),method=route.request().method();
  const reply=(value:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
  if(path.endsWith('/registration-reference')){
   if(url.searchParams.get('resource')==='locations')return reply({kinshasa_communes:['Gombe','Lemba',"N'djili"],quartiers:{}});
   const rows=[{code:'CD',name:'Congo-Kinshasa'},{code:'CG',name:'Congo-Brazzaville'},{code:'SE',name:'Sweden'},{code:'DE',name:'Germany'}];
   const q=url.searchParams.get('q')||'';
   return reply({items:rows,matched_code:rows.find(row=>row.code===q.toUpperCase()||row.name.toLowerCase()===q.toLowerCase())?.code||null,...(method==='POST'?{status:'pending_review'}:{})});
  }
  const projection=()=>({onboarding_ref:business?'ONB_fixture':'POD_fixture',revision:state.revision,status:state.status,values:state.values,existing_account:state.existingAccount,organization_types:['company','school'],sectors:['commerce_distribution'],remaining_fields:(business?['name','organization_type','sector','personal_name','city','country_code','commune_or_municipality','street_or_avenue','building_or_parcel']:['first_name','family_name','city','country_code']).filter(key=>!state.values[key]),legal:[{document_type:'SHIDA_TERMS_OF_USE',version:'1',url:'https://nihiloba.com/shida/terms/1.0/',accepted:state.accepted},{document_type:'SHIDA_PRIVACY_POLICY',version:'1',url:'https://nihiloba.com/shida/privacy/1.0/',accepted:state.accepted},...(business?[{document_type:'SHIDA_BUSINESS_TERMS',version:'1',url:'https://nihiloba.com/shida/business/terms/1.0/',accepted:state.accepted}]:[])]});
  if(path.endsWith('/auth/whatsapp/registration')){expect(route.request().headers()['x-shida-eligibility']).toBe('adult-drc-v1');return reply({challenge_ref:'DWC_fixture_test',expires_at:new Date(Date.now()+300000).toISOString(),whatsapp_url:'https://wa.me/243000000000?text=synthetic-not-sent'},201);}
  if(path.includes('/auth/whatsapp/registration/DWC_')){if(path.endsWith('/session')){state.verified=true;return reply({verified:true});}return reply({status:'verified'});}
  if(path.includes('/registration/')){
   if(!state.verified)return reply({error:{code:'unauthorized'}},401);
   if(method==='POST'&&/\/registration\/(personal|business)$/.test(path)){state.status='active';if(state.race){state.revision=2;state.values={personal_name:'Concurrent Person',city:'Kinshasa',country_code:'CD'};}}
   if(path.endsWith('/finish/session'))return reply({authenticated:true});
   if(path.endsWith('/personal/consent'))state.accepted=true;
   if(path.endsWith('/business-handoff'))return reply({token:'x'.repeat(43)});
   if(path.endsWith('/complete')){state.completed=true;state.status='completed';return reply(projection());}
   if(path.endsWith('/cancel')){state.status='cancelled';return reply(projection());}
   if(method==='PATCH'){
    if(state.stale)return reply({error:{code:'stale_onboarding'}},409);
    const data=route.request().postDataJSON();expect(data.revision).toBe(state.revision);state.values={...state.values,...data.values};if(state.values.first_name&&state.values.family_name)state.values.personal_name=[state.values.first_name,state.values.family_name,state.values.additional_name].filter(Boolean).join(' ');if(state.values.city==='Kinshasa')state.values.country_code='CD';state.revision++;if(Object.keys(data.accept_documents??{}).length===(business?3:2))state.accepted=true;
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
 await fillName(page,'Synthetic Personal');await page.locator('#registration-phone').fill('+243910004001');
 await page.locator('#registration-city').fill('Kinshasa');await fillCountry(page,'CD');await page.locator('#registration-commune').selectOption('Gombe');
 expect(state.values).toEqual({});expect(state.verified).toBe(false);
 if(locale==='en')await page.screenshot({path:`test-results/registration/${testInfo.project.name}-details-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:t.next,exact:true}).click();
 await expect(page.getByText(t.unauthorized,{exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:login.open,exact:true})).toBeDisabled();
 await page.getByLabel(registrationEligibility[locale]).check();
 await page.getByRole('button',{name:login.open,exact:true}).click();
 await page.getByLabel(login.codeLabel).fill('610294');await page.getByRole('button',{name:t.verifyButton,exact:true}).click();
  await expect(page.locator('.registration-consent input')).toHaveCount(2);
 for(const checkbox of await page.locator('.registration-consent input').all())await checkbox.check();
 await page.getByRole('button',{name:t.next,exact:true}).click();
 await expect(page.getByRole('heading',{name:t.review,exact:true})).toBeVisible();
 await page.getByRole('button',{name:t.finish,exact:true}).click();await expect(page).toHaveURL(/\/shida\/space\//);expect(state.completed).toBe(true);
});
for(const locale of ['en','fr','ln','sw'] as const)test(`${locale}: Organization fields and private Business POST handoff`,async({page})=>{
 const state=await fixture(page,false,true),t=registrationCopy[locale];let handedOff=false;
 await page.route('https://business.nihiloba.com/handoff',async route=>{expect(route.request().method()).toBe('POST');expect(route.request().headers().origin).toBe('http://127.0.0.1:3044');expect(new URLSearchParams(route.request().postData()!).get('token')).toBe('x'.repeat(43));handedOff=true;await route.fulfill({contentType:'text/html',body:'<title>Business fixture</title><p>Business fixture</p>'});});
 await page.setViewportSize({width:390,height:900});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/register/`);
 await page.locator('input[value="business"]').check();await page.getByRole('button',{name:t.next,exact:true}).click();
 await page.locator('#registration-name').fill('Synthetic School');await page.locator('#registration-organization_type').selectOption('school');await page.locator('#registration-sector').selectOption('commerce_distribution');await page.locator('#registration-phone').fill('+243910004001');
 for(const [key,value] of Object.entries({personal_name:'Synthetic Creator',country_code:'CD',city:'Kinshasa'}))await page.locator(`#registration-${key}`).fill(value);
 for(const [key,value] of Object.entries({commune_or_municipality:'Gombe',street_or_avenue:'Private street',building_or_parcel:'42'}))await page.locator(`#registration-${key}`).fill(value);
 await page.getByRole('button',{name:t.next,exact:true}).click();expect(state.values).toEqual({});
 await page.getByLabel(registrationEligibility[locale]).check();await page.getByRole('button',{name:personalLoginCopy[locale].open,exact:true}).click();
 await page.getByLabel(personalLoginCopy[locale].codeLabel).fill('610294');await page.getByRole('button',{name:t.verifyButton,exact:true}).click();
 await expect(page.locator('.registration-consent input')).toHaveCount(3);
 for(const checkbox of await page.locator('.registration-consent input').all())await checkbox.check();
 await page.getByRole('button',{name:t.next,exact:true}).click();await page.getByRole('button',{name:t.finish,exact:true}).click();
 await expect(page).toHaveURL('https://business.nihiloba.com/handoff');expect(handedOff&&state.completed).toBe(true);expect(page.url()).not.toContain('token');
});
test('stale drafts require explicit reload, cancellation is deliberate',async({page})=>{
 const state=await fixture(page,true);await page.goto('/shida/register/');await page.getByRole('button',{name:registrationCopy.en.resume,exact:true}).click();
 state.stale=true;await fillName(page,'Draft Name');await page.getByRole('button',{name:'Next',exact:true}).click();
 await expect(page.getByText(registrationCopy.en.changed,{exact:true})).toBeVisible();expect(state.values.personal_name).toBeUndefined();
 state.stale=false;await page.getByRole('button',{name:registrationCopy.en.reload}).click();
 await page.getByRole('button',{name:registrationCopy.en.cancel,exact:true}).click();await expect(page.getByText(registrationCopy.en.cancelQuestion)).toBeVisible();expect(state.status).toBe('active');
 await page.getByRole('button',{name:registrationCopy.en.cancel,exact:true}).click();await expect(page.getByText(registrationCopy.en.cancelled)).toBeVisible();expect(state.status).toBe('cancelled');
});

test('mobile navigation follows keyboard viewport without covering form actions',async({page})=>{
 await fixture(page,true);await page.setViewportSize({width:390,height:900});await page.goto('/shida/register/');
 await page.getByRole('button',{name:registrationCopy.en.resume,exact:true}).click();await page.locator('#registration-personal_name').focus();
 const nav=page.locator('.shida-navigation');await expect(nav).toBeVisible();
 // Emulate only the keyboard's visual viewport contraction; focus alone is insufficient.
 await page.evaluate(()=>{Object.defineProperty(window.visualViewport!,'height',{configurable:true,value:450});window.visualViewport!.dispatchEvent(new Event('resize'));});
 await expect(nav).toBeHidden();await page.locator('#registration-personal_name').blur();await expect(nav).toBeHidden();
 await page.evaluate(()=>{delete (window.visualViewport as unknown as {height?:number}).height;window.visualViewport!.dispatchEvent(new Event('resize'));});
 await expect(nav).toBeVisible();await fillName(page,'Keyboard User');
 await page.locator('#registration-personal_name').press('Enter');await expect(page.locator('#registration-city')).toBeVisible();
});

test('another tab changing account clears private draft values',async({page})=>{
 await fixture(page,true);await page.goto('/shida/register/');await page.getByRole('button',{name:registrationCopy.en.resume,exact:true}).click();
 await fillName(page,'Private Draft');
 await page.evaluate(key=>window.dispatchEvent(new StorageEvent('storage',{key,newValue:'other-tab'})),PERSONAL_SESSION_EVENT);
 await expect(page.locator('#registration-personal_name')).toHaveCount(0);await expect(page.getByText('Private Draft',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:registrationCopy.en.title,exact:true}).first()).toBeVisible();
});

test('account changes during a slow resume cannot reveal the old draft',async({page})=>{
 await fixture(page,true);let release!:()=>void,started=false;
 const pending=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/shida/registration/personal/',async route=>{
  started=true;await pending;await route.fulfill({json:{onboarding_ref:'POD_old',revision:1,status:'active',values:{personal_name:'Previous Account'},remaining_fields:[],legal:[]}});
 });
 await page.goto('/shida/register/');await page.getByRole('button',{name:registrationCopy.en.resume,exact:true}).click();
 await expect.poll(()=>started).toBe(true);await expect(page.getByRole('button',{name:'Back',exact:true})).toBeDisabled();
 await page.evaluate(key=>window.dispatchEvent(new StorageEvent('storage',{key,newValue:'other-tab'})),PERSONAL_SESSION_EVENT);release();
 await expect(page.getByRole('heading',{name:registrationCopy.en.title,exact:true})).toBeVisible();
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


test('local input never overwrites a saved cross-channel draft',async({page})=>{
 const state=await fixture(page,true);state.values={personal_name:'Saved Person',city:'Kinshasa',country_code:'CD'};
 await page.goto('/shida/register/');await page.getByRole('button',{name:'Next',exact:true}).click();
 await fillName(page,'Unverified Person');await page.locator('#registration-phone').fill('+243910004001');
 await page.locator('#registration-city').fill('Goma');await fillCountry(page,'CD');await page.getByRole('button',{name:'Next',exact:true}).click();
 await page.getByLabel(registrationEligibility.en).check();await page.getByRole('button',{name:personalLoginCopy.en.open,exact:true}).click();await page.getByLabel(personalLoginCopy.en.codeLabel).fill('610294');await page.getByRole('button',{name:registrationCopy.en.verifyButton,exact:true}).click();
 await expect(page.getByText(registrationFlowCopy.en.savedWins,{exact:true})).toBeVisible();
 await expect(page.locator('#registration-personal_name')).toHaveValue('Saved Person');expect(state.values.city).toBe('Kinshasa');
});
test('existing Personal identity does not repeat profile onboarding and returns to selling',async({page})=>{
 const state=await fixture(page,true);state.existingAccount=true;state.accepted=true;state.values={personal_name:'Existing Person'};
 await page.goto('/shida/register/?returnTo=%2Fshida%2Fwenze%2Fsell');await page.getByRole('button',{name:registrationCopy.en.resume,exact:true}).click();
 await expect(page.getByText(registrationCopy.en.existing,{exact:true})).toBeVisible();await expect(page.locator('#registration-personal_name')).toHaveCount(0);
 await expect(page.locator('.registration-consent input')).toHaveCount(0);await page.getByRole('button',{name:existingAccountContinue.en,exact:true}).click();
 await expect(page).toHaveURL(/\/shida\/wenze\/sell\/?$/);expect(state.completed).toBe(false);
});

test('verified existing account accepts updated terms without a second challenge or profile overwrite',async({page})=>{
 const state=await fixture(page);state.existingAccount=true;state.status='completed';state.values={personal_name:'Canonical Person',city:'Stockholm',country_code:'SE'};
 let challenges=0;
 page.on('request',request=>{if(request.method()==='POST'&&request.url().endsWith('/auth/whatsapp/registration/'))challenges++;});
 await page.goto('/shida/register/');await page.getByRole('button',{name:'Next',exact:true}).click();
 await fillName(page,'Unconfirmed Name');await page.locator('#registration-city').fill('Kinshasa');await fillCountry(page,'CD');await page.locator('#registration-phone').fill('+243910004001');
 await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByLabel(registrationEligibility.en).check();await page.getByRole('button',{name:personalLoginCopy.en.open,exact:true}).click();
 await page.getByLabel(personalLoginCopy.en.codeLabel).fill('610294');await page.getByRole('button',{name:registrationCopy.en.verifyButton,exact:true}).click();
 await expect(page.getByText(registrationCopy.en.existing,{exact:true})).toBeVisible();
 for(const checkbox of await page.locator('.registration-consent input').all())await checkbox.check();
 await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:existingAccountContinue.en,exact:true}).click();
 await expect(page).toHaveURL(/\/shida\/space\//);
 expect(challenges).toBe(1);expect(state.completed).toBe(false);expect(state.values).toEqual({personal_name:'Canonical Person',city:'Stockholm',country_code:'SE'});
});

test('draft created in another channel between state and start is preserved',async({page})=>{
 const state=await fixture(page,true);state.status='not_started';state.race=true;
 await page.goto('/shida/register/');await page.getByRole('button',{name:'Next',exact:true}).click();
 await fillName(page,'Local Person');await page.locator('#registration-phone').fill('+243910004001');
 await page.locator('#registration-city').fill('Goma');await fillCountry(page,'CD');await page.getByRole('button',{name:'Next',exact:true}).click();
 await page.getByLabel(registrationEligibility.en).check();await page.getByRole('button',{name:personalLoginCopy.en.open,exact:true}).click();await page.getByLabel(personalLoginCopy.en.codeLabel).fill('610294');await page.getByRole('button',{name:registrationCopy.en.verifyButton,exact:true}).click();
 await expect(page.getByText(registrationFlowCopy.en.savedWins,{exact:true})).toBeVisible();await expect(page.locator('#registration-personal_name')).toHaveValue('Concurrent Person');expect(state.revision).toBe(2);
});

test('unverified form survives refresh, backward navigation and interrupted verification',async({page})=>{
 const state=await fixture(page);
 await page.goto('/shida/register/');await page.getByRole('button',{name:'Next',exact:true}).click();
 await fillName(page,'Recoverable Person');await page.locator('#registration-city').fill('Kinshasa');await fillCountry(page,'CD');await page.locator('#registration-phone').fill('+243910004001');
 await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.locator('#registration-personal_name')).toHaveValue('Recoverable Person');
 await page.reload();await expect(page.locator('#registration-phone')).toHaveValue('+243910004001');await expect(page.locator('#registration-personal_name')).toHaveValue('Recoverable Person');
 expect(state.values).toEqual({});expect(state.verified).toBe(false);
 await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByLabel(registrationEligibility.en).check();await page.getByRole('button',{name:personalLoginCopy.en.open,exact:true}).click();
 await page.getByLabel(personalLoginCopy.en.codeLabel).fill('610294');
 const stored=await page.evaluate(key=>sessionStorage.getItem(key),FORM_DRAFT_KEY);expect(stored).not.toContain('610294');expect(stored).not.toContain('DWC_');
 await page.reload();await expect(page.locator('#registration-personal_name')).toHaveValue('Recoverable Person');
 await page.getByRole('button',{name:refinementCopy.en.discard}).click();await expect.poll(()=>page.evaluate(key=>sessionStorage.getItem(key),FORM_DRAFT_KEY)).toBeNull();
});

test('mismatched verified contact never imports the form',async({page})=>{
 const state=await fixture(page);
 await page.route('**/auth/whatsapp/registration/DWC_fixture_test/session/',route=>{expect(route.request().postDataJSON().expected_phone).toBe('+243910004001');return route.fulfill({status:409,json:{error:{code:'phone_mismatch'}}});});
 await page.goto('/shida/register/');await page.getByRole('button',{name:'Next',exact:true}).click();
 for(const [key,value] of Object.entries({personal_name:'Mismatch Person',city:'Kinshasa',country_code:'CD',phone:'+243910004001'}))await page.locator(`#registration-${key}`).fill(value);
 await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByLabel(registrationEligibility.en).check();await page.getByRole('button',{name:personalLoginCopy.en.open,exact:true}).click();await page.getByLabel(personalLoginCopy.en.codeLabel).fill('610294');await page.getByRole('button',{name:registrationCopy.en.verifyButton}).click();
 await expect(page.getByText(refinementCopy.en.mismatch,{exact:true})).toBeVisible();expect(state.values).toEqual({});expect(state.completed).toBe(false);
});

test('expired local drafts are discarded without revealing their values',async({page})=>{
 await fixture(page);await page.addInitScript(key=>sessionStorage.setItem(key,JSON.stringify({version:1,expires:Date.now()-1,kind:'personal',values:{personal_name:'Expired Secret'},phone:'+243910004001'})),FORM_DRAFT_KEY);
 await page.goto('/shida/register/');await expect(page.getByRole('heading',{name:registrationCopy.en.title})).toBeVisible();await expect(page.getByText('Expired Secret')).toHaveCount(0);await expect.poll(()=>page.evaluate(key=>sessionStorage.getItem(key),FORM_DRAFT_KEY)).toBeNull();
});

test('unavailable browser storage offers canonical verified resumption',async({page})=>{
 await fixture(page);await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('storage blocked');};});
 await page.goto('/shida/register/');await page.getByRole('button',{name:'Next',exact:true}).click();
 await expect(page.getByText(refinementCopy.en.storageFailed,{exact:true})).toBeVisible();await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:registrationCopy.en.resume,exact:true}).click();await expect(page.getByRole('button',{name:personalLoginCopy.en.open,exact:true})).toBeVisible();
});

for(const shop of [false,true])test(`authenticated account menu and ${shop?'shop':'occasional'} entry preserve existing identity`,async({page})=>{
 await fixture(page,true);await page.route('**/employment/session/',route=>route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Existing Seller'}}}));
 await page.goto('/shida/wenze/');await expect(page.locator('.market-register')).toHaveCount(0);await expect(page.locator('.market-sign-in')).toHaveCount(0);
 await page.getByRole('button',{name:/Existing Seller/}).click();await expect(page.locator('.market-menu a')).toHaveCount(3);await page.keyboard.press('Escape');
 await page.getByRole('link',{name:shop?refinementCopy.en.shopAction:refinementCopy.en.itemAction,exact:true}).click();await expect(page).toHaveURL(shop?/\/seller\/wenze\//:/\/wenze\/sell\//);
});

for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,820,1440])test(`${locale} ${width}: direct account actions and selling invitations`,async({page},info)=>{
 await fixture(page);await page.setViewportSize({width,height:1000});const base=locale==='en'?'/shida':`/${locale}/shida`,r=refinementCopy[locale];
 await page.goto(`${base}/wenze/`);
 await expect(page.getByRole('heading',{name:r.sellTitle})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width===1440)await expect(page.locator('.market-register')).toBeVisible();else if(width===390)await expect(page.locator('.market-register')).toBeHidden();
 await page.locator('.market-sign-in').click();const dialog=page.locator('.shida-account-dialog');
 await expect(dialog.locator('.shida-account-actions')).toHaveCount(0);await expect(dialog.getByRole('link',{name:r.signup,exact:true})).toBeVisible();
 await page.screenshot({path:`test-results/registration/${info.project.name}-login-${locale}-${width}.png`,fullPage:true});
 await dialog.getByRole('button',{name:`${r.browse} →`,exact:true}).click();
 await page.locator('.wzp-selling').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/registration/${info.project.name}-selling-${locale}-${width}.png`,fullPage:true});
 await page.getByRole('link',{name:r.itemAction,exact:true}).click();await expect(page).toHaveURL(/\/register\/\?returnTo=/);await expect(page.getByRole('heading',{name:registrationCopy[locale].title})).toBeVisible();
});
