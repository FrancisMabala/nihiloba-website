import {test,expect,type Page} from '@playwright/test';
import {fixture} from './registration-fixture';
import {registrationCopy,registrationEligibility} from '../../app/lib/registration/copy';
import {personalLoginCopy} from '../../app/lib/personal-login-copy';
import {refinementCopy} from '../../app/lib/registration/refinement-copy';
import {registrationResumeCopy} from '../../app/lib/registration/resume-copy';
import {FORM_DRAFT_KEY} from '../../app/lib/registration/local-draft';
import {LOGIN_EVENT,LOGIN_LOCK} from '../../app/lib/personal-login-browser';
import {PERSONAL_SESSION_EVENT} from '../../app/lib/personal-session-browser';

type Locale='fr'|'en'|'ln'|'sw';
const reference='DWC_fixture_test';
const localValues={first_name:'Saved',family_name:'Fixture',city:'Stockholm',country_code:'SE'};
async function savedForm(page:Page,locale:Locale='en'){
 await page.addInitScript(({key,locale,values})=>{
  if(!sessionStorage.getItem(key))sessionStorage.setItem(key,JSON.stringify({version:1,expires:Date.now()+86400000,kind:'personal',values,phone:'+46910004001',language:locale}));
 },{key:FORM_DRAFT_KEY,locale,values:localValues});
}
async function recovered(page:Page,locale:Locale='en',initial:'pending'|'verified'|null='verified'){
 const state=await fixture(page);
 const recovery={status:initial,expiresAt:new Date(Date.now()+240000).toISOString(),reads:0,writes:0};
 page.on('request',request=>{if(request.method()!=='GET'&&request.url().includes('/api/shida/'))recovery.writes++;});
 await page.route('**/api/shida/personal/auth/whatsapp/registration/resume/',route=>{
  recovery.reads++;
  return recovery.status?route.fulfill({json:{status:recovery.status,challenge_ref:reference,expires_at:recovery.expiresAt,language:locale}}):route.fulfill({status:404,json:{error:{code:'expired'}}});
 });
 await page.route(`**/api/shida/personal/auth/whatsapp/registration/${reference}/`,route=>route.fulfill({json:{status:recovery.status??'cancelled'}}));
 return {state,recovery};
}
function path(locale:Locale){return `${locale==='en'?'':`/${locale}`}/shida/register/`;}
async function noPrivateStorage(page:Page){
 const values=await page.evaluate(()=>[...Object.values(localStorage),...Object.values(sessionStorage)].join('|'));
 expect(values).not.toContain(reference);expect(values).not.toContain('610294');expect(values).not.toContain('whatsapp_url');
}

for(const [locale,width] of [['en',360],['fr',390],['ln',360],['sw',390]] as const){
 for(const status of ['pending','verified'] as const)test(`resume ${status} after mobile refresh ${locale} ${width}`,async({page},info)=>{
  const {state,recovery}=await recovered(page,locale,status);await savedForm(page,locale);
  await page.setViewportSize({width,height:844});await page.goto(path(locale));
  await expect(page.locator('.registration-shell')).toHaveAttribute('lang',locale);
  await expect(page.getByText(registrationResumeCopy[locale].restored,{exact:true})).toBeVisible();
  if(status==='pending'){
   await expect(page.getByText(registrationResumeCopy[locale].pending,{exact:true})).toBeVisible();
   await expect(page.locator('.candidate-login a[href*="wa.me"]')).toHaveCount(0);
  }else{
   await expect(page.getByLabel(personalLoginCopy[locale].codeLabel)).toBeVisible();
   await page.getByLabel(personalLoginCopy[locale].codeLabel).fill('610294');
  }
  await noPrivateStorage(page);expect(recovery.writes).toBe(0);
  await page.reload();await expect.poll(()=>recovery.reads).toBe(2);
  if(status==='pending'){
   await expect(page.getByText(registrationResumeCopy[locale].pending,{exact:true})).toBeVisible();
   recovery.status='verified';await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  }
  await expect(page.getByLabel(personalLoginCopy[locale].codeLabel)).toBeVisible();
  await expect(page.getByLabel(personalLoginCopy[locale].codeLabel)).toHaveValue('');
  expect(state.verified).toBe(false);expect(recovery.writes).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath(`resumed-${status}-${locale}-${width}.png`),fullPage:true});
  await page.getByLabel(registrationEligibility[locale]).check();
  await page.getByLabel(personalLoginCopy[locale].codeLabel).fill('610294');
  await page.getByRole('button',{name:registrationCopy[locale].verifyButton,exact:true}).click();
  await expect.poll(()=>state.verified).toBe(true);
  await expect.poll(()=>state.values.first_name).toBe('Saved');
  expect(state.values.family_name).toBe('Fixture');
  await noPrivateStorage(page);
 });
}

test('canonical saved draft wins automatically over local content without PATCH',async({page})=>{
 const state=await fixture(page,true);state.values={first_name:'Canonical',family_name:'Person',city:'Goma',country_code:'CD'};
 await savedForm(page);let writes=0;page.on('request',request=>{if(request.url().includes('/api/shida/registration/')&&request.method()!=='GET')writes++;});
 await page.goto(path('en'));await expect(page.locator('#registration-first_name')).toHaveValue('Canonical');
 await expect(page.locator('#registration-city')).toHaveValue('Goma');expect(writes).toBe(0);
 expect(await page.evaluate(key=>sessionStorage.getItem(key),FORM_DRAFT_KEY)).toBeNull();
});

test('slow initial restore freezes form edits and discard until it settles',async({page})=>{
 await recovered(page,'en',null);await savedForm(page);
 let release!:()=>void,started=false;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/shida/registration/personal/',async route=>{started=true;await gate;await route.fulfill({status:401,json:{error:{code:'unauthorized'}}});});
 await page.goto(path('en'));await expect.poll(()=>started).toBe(true);
 await expect(page.locator('#registration-first_name')).toBeDisabled();
 await expect(page.getByRole('button',{name:refinementCopy.en.discard,exact:true})).toBeDisabled();
 await expect(page.getByRole('button',{name:registrationCopy.en.back,exact:true})).toBeDisabled();
 release();await expect(page.locator('#registration-first_name')).toBeEnabled();
 await page.getByRole('button',{name:refinementCopy.en.discard,exact:true}).click();
 await expect(page.locator('#registration-first_name')).toHaveCount(0);
 expect(await page.evaluate(key=>sessionStorage.getItem(key),FORM_DRAFT_KEY)).toBeNull();
});

for(const eventKey of [LOGIN_EVENT,PERSONAL_SESSION_EVENT])test(`late canonical response is discarded after ${eventKey}`,async({page})=>{
 await fixture(page,true);let release!:()=>void,started=false;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/shida/registration/personal/',async route=>{started=true;await gate;await route.fulfill({json:{onboarding_ref:'POD_previous',revision:1,status:'active',values:{first_name:'Previous',family_name:'Account'},remaining_fields:[],legal:[]}});});
 await page.goto(path('en'));await expect.poll(()=>started).toBe(true);
 await page.evaluate(key=>window.dispatchEvent(new StorageEvent('storage',{key,newValue:'synthetic-other-tab'})),eventKey);
 release();await expect(page.getByRole('heading',{name:registrationCopy.en.title,exact:true})).toBeVisible();
 await expect(page.locator('#registration-first_name')).toHaveCount(0);await expect(page.getByText('Previous',{exact:true})).toHaveCount(0);
});

test('uncertain exchange marker requires explicit reset without recovery or exchange',async({page})=>{
 const {recovery}=await recovered(page);await savedForm(page);
 await page.addInitScript(()=>localStorage.setItem('shida-personal-login-unconfirmed','1'));
 await page.goto(path('en'));await expect(page.getByText(personalLoginCopy.en.uncertain,{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:personalLoginCopy.en.reset,exact:true})).toBeVisible();
 expect(recovery.reads).toBe(0);expect(recovery.writes).toBe(0);
 await expect(page.getByLabel(personalLoginCopy.en.codeLabel)).toHaveCount(0);
});

test('expired or wrong-browser recovery keeps the saved form and needs a fresh explicit attempt',async({page})=>{
 const {recovery}=await recovered(page,'en',null);await savedForm(page);await page.goto(path('en'));
 await expect(page.locator('#registration-first_name')).toBeEnabled();await expect(page.locator('#registration-first_name')).toHaveValue('Saved');
 expect(recovery.writes).toBe(0);await expect(page.getByLabel(personalLoginCopy.en.codeLabel)).toHaveCount(0);
});

test('failed recovery preserves form and releases the shared authentication lock',async({page})=>{
 await recovered(page);await savedForm(page);
 await page.route('**/api/shida/registration/personal/',route=>route.abort('internetdisconnected'));
 await page.goto(path('en'));await expect(page.locator('#registration-first_name')).toBeEnabled();
 await expect(page.getByText(registrationCopy.en.error,{exact:true})).toBeVisible();
 await expect(page.locator('#registration-first_name')).toHaveValue('Saved');
 expect(await page.evaluate(async key=>(await navigator.locks.query()).held?.some(lock=>lock.name===key)??false,LOGIN_LOCK)).toBe(false);
});

test('stalled recovery times out and unlocks the saved form',async({page})=>{
 await recovered(page);await savedForm(page);let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/shida/registration/personal/',async route=>{await gate;await route.fulfill({status:401,json:{error:{code:'unauthorized'}}}).catch(()=>{});});
 await page.goto(path('en'));await expect(page.locator('#registration-first_name')).toBeDisabled();
 await expect(page.locator('#registration-first_name')).toBeEnabled({timeout:20000});
 await expect(page.getByText(registrationCopy.en.error,{exact:true})).toBeVisible();
 expect(await page.evaluate(async key=>(await navigator.locks.query()).held?.some(lock=>lock.name===key)??false,LOGIN_LOCK)).toBe(false);
 release();
});
