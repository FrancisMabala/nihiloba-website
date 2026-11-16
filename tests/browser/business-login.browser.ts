import {test,expect,type Page} from '@playwright/test';
async function fixture(page:Page, signedIn=false, setup=true){
 const state={signedIn,grants:0,posted:null as null|URLSearchParams,failed:false};
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url()),p=u.pathname;
  if(u.origin==='https://business.nihiloba.com'&&p==='/handoff'){state.posted=new URLSearchParams(route.request().postData()!);return route.fulfill({body:'Synthetic Business session handoff received'});}
  if(u.origin!=='http://127.0.0.1:3016')return route.abort();
  if(!p.startsWith('/api/'))return route.continue();
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(p.endsWith('/employment/session/'))return state.signedIn?reply({binding:'a'.repeat(64),user:{display_name:'Synthetic Amina'}}):reply({},401);
  if(p.endsWith('/capabilities/'))return reply({enabled:true});
  if(p.endsWith('/email/start/'))return reply({reference:'EMAIL_fixture'});
  if(p.endsWith('/email/cancel/'))return reply({});
  if(p.endsWith('/passkey/options/'))return reply({options:{challenge:'YWJj',rpId:'nihiloba.com'}});
  if(p.endsWith('/verify/')){if(state.failed)return reply({},400);state.signedIn=true;return reply({authenticated:true});}
  if(p.endsWith('/registration/personal/'))return reply({can_complete:setup});
  if(p.endsWith('/registration/business-handoff/')){state.grants++;return reply({token:'x'.repeat(43)});}
  return reply({},404);
 });return state;
}
for(const method of ['email','passkey'])test(`${method} authenticates the existing account and POSTs the preserved creation intent`,async({page})=>{
 const state=await fixture(page);
 if(method==='passkey')await page.addInitScript(()=>{Object.defineProperty(window,'PublicKeyCredential',{value:class {}});Object.defineProperty(navigator.credentials,'get',{value:async()=>({id:'fixture',type:'public-key',rawId:new Uint8Array([1]).buffer,response:{clientDataJSON:new Uint8Array([1]).buffer,authenticatorData:new Uint8Array([1]).buffer,signature:new Uint8Array([1]).buffer,userHandle:null},getClientExtensionResults:()=>({})})});});
 await page.goto('/fr/shida/business-login/?returnTo=%2Fcreate-organization&method='+method);
 if(method==='email'){
  await page.locator('.auth-email>button').click();await page.locator('input[type=email]').fill('synthetic@example.test');await page.locator('.auth-email button[type=submit]').click();await page.locator('input[autocomplete=one-time-code]').fill('12345678');await page.locator('.auth-email button[type=submit]').click();
 }else await page.locator('.auth-passkey>button').click();
 await expect.poll(()=>state.posted?.get('returnTo')).toBe('/create-organization');expect(state.posted?.get('language')).toBe('fr');expect(state.grants).toBe(1);expect(page.url()).not.toContain('x'.repeat(43));
});
test('cancelled passkey and failed email remain recoverable without a grant',async({page})=>{
 const state=await fixture(page);state.failed=true;
 await page.addInitScript(()=>{Object.defineProperty(window,'PublicKeyCredential',{value:class{}});Object.defineProperty(navigator.credentials,'get',{value:async()=>{throw new DOMException('cancelled','NotAllowedError');}});});
 await page.goto('/fr/shida/business-login/?method=passkey');await page.locator('.auth-passkey>button').click();await expect(page.locator('.auth-passkey [role=alert]')).toBeVisible();expect(state.grants).toBe(0);
 await page.goto('/fr/shida/business-login/?method=email');await page.locator('.auth-email>button').click();await page.locator('input[type=email]').fill('synthetic@example.test');await page.locator('.auth-email button[type=submit]').click();await page.locator('input[autocomplete=one-time-code]').fill('12345678');await page.locator('.auth-email button[type=submit]').click();await expect(page.locator('.auth-email [role=alert]')).toBeVisible();expect(state.grants).toBe(0);
});
test('verified incomplete creator returns automatically to native Business onboarding',async({page})=>{
 const state=await fixture(page,true,false);await page.goto('/fr/shida/business-login/?returnTo=%2Fcreate-organization');await expect.poll(()=>state.posted?.get('returnTo')).toBe('/create-organization');expect(state.grants).toBe(1);
});

test('registration continuation retains invitation context',async({page})=>{
 const state=await fixture(page,true);await page.goto('/fr/shida/business-login/?returnTo=%2Fguardian-links');await expect(page.getByText('Synthetic Amina')).toBeVisible();await page.goto('/fr/shida/business-login/');await expect.poll(()=>state.posted?.get('returnTo')).toBe('/guardian-links');
});
for(const width of [320,390,1440])for(const lang of ['fr','en','ln','sw'])test(`central sign-in ${lang} ${width}`,async({page})=>{
 await fixture(page);await page.setViewportSize({width,height:900});await page.goto(`/${lang==='en'?'':lang+'/'}shida/business-login/?method=email`);await expect(page.locator('.auth-email>button')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('external destination becomes the safe Business home',async({page})=>{
 const state=await fixture(page,true);await page.goto('/fr/shida/business-login/?returnTo=https%3A%2F%2Fevil.test');await page.getByRole('button',{name:'Continuer vers Business'}).click();await expect.poll(()=>state.posted?.get('returnTo')).toBe('/');
});

test('verified invitation recipient returns automatically to the exact Business invitation',async({page})=>{
 const state=await fixture(page,true);await page.goto('/fr/shida/business-login/?returnTo=%2Finvitations%2FBMR_fixture');await expect.poll(()=>state.posted?.get('returnTo')).toBe('/invitations/BMR_fixture');expect(state.grants).toBe(1);
});
test('invitation registration retains its destination through canonical personal registration',async({page})=>{
 await fixture(page);await page.goto('/fr/shida/business-login/?returnTo=%2Finvitations%2FBMR_fixture&register=1');await expect(page).toHaveURL(/fr\/shida\/register\/\?returnTo=/);expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('shida-business-return')||'null'))).toBeTruthy();
});
