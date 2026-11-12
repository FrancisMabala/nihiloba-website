import {fixture} from './account-security-fixture';
import {deletionUx} from '../../app/lib/deletion-ux-copy';
import {test,expect} from '@playwright/test';
import {mySpaceCopy} from '../../app/lib/my-space-refinement-copy';
import {securityText} from '../../app/lib/account-security-copy';
import {accountSupportCopy} from '../../app/lib/account-support-copy';
import {recoveryCopy} from '../../app/lib/account-recovery-copy';
import {emailLoginCopy} from '../../app/lib/email-login-copy';
import {accountDesignText} from '../../app/lib/account-design-copy';
import {deletionReviewText} from '../../app/lib/deletion-review-copy';
import {deletionText} from '../../app/lib/account-deletion-copy';
import {securityActionErrorText} from '../../app/lib/account-security-errors';

for(const locale of ['en','fr','ln','sw'] as const)for(const method of ['missing','new-passkey','new-email'] as const)test(`deletion verification guidance ${locale} ${method}`,async({page})=>{
 await fixture(page);let writes=0;
 await page.route('**/api/shida/personal/security/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(route.request().method()==='POST'){writes++;return route.fulfill({status:403,json:{detail:'security_method_not_ready'}});}
  if(path.endsWith('/security'))return route.fulfill({json:{login_email:'l***@example.test',login_email_verified:true,email:method==='new-email'?'r***@example.test':null,email_ready_at:'2099-01-01T00:00:00Z',protected:false,passkeys:method==='new-passkey'?[{reference:'KEY_new',ready_at:'2099-01-01T00:00:00Z'}]:[]}});
  if(path.endsWith('/delete'))return route.fulfill({json:{eligible:true,obligations:[],retained_records:false}});
  return route.fallback();
 });
 await page.setViewportSize({width:390,height:844});await page.goto(`${locale==='en'?'':'/'+locale}/shida/space/?view=settings`);await page.locator('.space-danger > summary').click();
 const panel=page.locator('#account-deletion'),message=securityActionErrorText(locale,new Error(method==='missing'?'security_method_missing':'security_method_not_ready'))!;
 await panel.getByRole('button',{name:deletionText(locale,'check'),exact:true}).click();
 await expect(panel.getByText(message,{exact:true})).toBeVisible();
 await panel.getByRole('button',{name:deletionText(locale,'confirm'),exact:true}).click();
 await expect(panel.getByRole('alert')).toContainText(message);expect(writes).toBe(0);
 await panel.locator('a[href="#account-recovery-verification"]').click();
 await expect(page.locator('#account-recovery-verification')).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const code of ['security_method_not_ready','security_fresh_login_required'])test(`deletion explains server verification rejection ${code}`,async({page})=>{
 await fixture(page,true,true);let confirmations=0;
 await page.route('**/api/shida/personal/security/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith('/delete/')){if(route.request().method()==='POST')confirmations++;return route.fulfill({json:{eligible:true,obligations:[],retained_records:false}});}
  if(path.endsWith('/email/proof/start/'))return route.fulfill({status:403,json:{detail:code}});
  return route.fallback();
 });
 await page.goto('/fr/shida/space/?view=settings');await page.locator('.space-danger > summary').click();await page.getByLabel(securityText('fr','preferEmail'),{exact:true}).check();
 const panel=page.locator('#account-deletion');
 await panel.getByRole('button',{name:deletionText('fr','check'),exact:true}).click();
 await panel.getByRole('button',{name:deletionText('fr','confirm'),exact:true}).click();
 await expect(panel.getByRole('alert')).toContainText(securityActionErrorText('fr',new Error(code))!);expect(confirmations).toBe(0);
});
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,1366])test(`deletion review consent and withdrawal ${locale} ${width}`,async({page})=>{
 const state=await fixture(page,true,true),t=(key:Parameters<typeof deletionReviewText>[1])=>deletionReviewText(locale,key);
 await page.setViewportSize({width,height:900});await page.goto(`${locale==='en'?'':'/'+locale}/shida/space/?view=settings`);await page.locator('.space-danger > summary').click();
 await page.getByLabel(securityText(locale,'preferEmail'),{exact:true}).check();
 await page.getByRole('button',{name:deletionText(locale,'check'),exact:true}).click();
 await expect(page.locator('#account-deletion .deletion-obligations')).toContainText(deletionUx(locale,'wewa'));
 await page.locator('#account-deletion .deletion-actions').getByRole('button',{name:deletionUx(locale,'review'),exact:true}).click();
 const review=page.locator('.account-deletion-review');
 await review.getByLabel(t('message')).fill('Please review my unresolved obligations.');
 await expect(review.getByRole('button',{name:deletionUx(locale,'reviewSelection'),exact:true})).toBeDisabled();
 await review.getByRole('checkbox').check();await review.getByRole('button',{name:deletionUx(locale,'reviewSelection'),exact:true}).click();await review.getByRole('button',{name:t('title'),exact:true}).click();
 const proof=page.getByRole('region',{name:securityText(locale,'emailProof'),exact:true});
 await proof.getByLabel(securityText(locale,'code'),{exact:true}).fill('12345678');
 await proof.getByRole('button',{name:securityText(locale,'verify'),exact:true}).click();
 await expect(review.getByText(t('sent'),{exact:true})).toBeVisible();
 await review.getByRole('button',{name:t('withdraw'),exact:true}).click();
 await expect.poll(()=>state.review).toBe('deletion_cancelled');
 await expect(review.getByRole('button',{name:t('withdraw'),exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/account-security/review-${locale}-${width}.png`,fullPage:true});
});
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,1366])test(`deletion schedule and explicit restoration ${locale} ${width}`,async({page})=>{
 const state=await fixture(page,true,true),t=(key:Parameters<typeof deletionText>[1])=>deletionText(locale,key);
 // A mature recovery email alone is sufficient; sign-in email is not a recovery factor.
 state.registered=false;
 const blockedStorage=locale==='en'&&width===390;
 if(blockedStorage)await page.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('Storage disabled','SecurityError');}}));
 const prefix=locale==='en'?'':'/'+locale;
 let confirmations=0,cancellations=0,freshLogin=false;
 const receipt={reference:'DEL_fixture',status:'scheduled',scheduled_at:'2026-12-06T15:00:00Z',can_cancel:true};
 await page.route('**/api/shida/personal/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(path.endsWith('/security/delete')){
   if(route.request().method()==='GET')return route.fulfill({json:{eligible:true,obligations:[],retained_records:false}});
   expect(state.proof).toBe(true);expect(route.request().postDataJSON()).toEqual({authorization:'SEC_authorized',confirmed:true});confirmations++;
   return route.fulfill({json:receipt});
  }
  if(path.endsWith('/personal/deletion'))return route.fulfill({status:freshLogin?200:401,json:freshLogin?{deletion:receipt,binding:'a'.repeat(64)}:{}});
  if(path.endsWith('/delete/cancel')){expect(freshLogin).toBe(true);expect(route.request().postDataJSON()).toEqual({reference:'DEL_fixture',confirmed:true});cancellations++;return route.fulfill({json:{cancelled:true}});}
  return route.fallback();
 });
 await page.setViewportSize({width,height:900});await page.goto(`${prefix}/shida/space/?view=settings`);await page.locator('.space-danger > summary').click();
 await page.getByLabel(securityText(locale,'preferEmail'),{exact:true}).check();
 await expect(page.locator('.account-deletion-review')).toHaveCount(0);
 await page.getByRole('button',{name:t('check'),exact:true}).click();
 await expect(page.getByText(t('eligible'),{exact:true})).toBeVisible();
 await expect(page.locator('.account-deletion-review')).toHaveCount(0);
 await page.getByRole('button',{name:t('confirm'),exact:true}).click();
 const proof=page.getByRole('region',{name:securityText(locale,'emailProof'),exact:true});
 await proof.getByLabel(securityText(locale,'code'),{exact:true}).fill('12345678');await proof.getByRole('button',{name:securityText(locale,'verify'),exact:true}).click();
 await expect(page).toHaveURL(new RegExp(`${prefix}/shida/deletion/?$`));
 await expect(page.getByText(t(blockedStorage?'signin':'pending'),{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:t('cancel'),exact:true})).toHaveCount(0);
 expect(confirmations).toBe(1);expect(cancellations).toBe(0);
 // A new successful login permits the status screen; it is not cancellation.
 freshLogin=true;await page.reload();
 await expect(page.getByRole('button',{name:t('cancel'),exact:true})).toBeVisible();expect(cancellations).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/account-security/pending-${locale}-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:t('cancel'),exact:true}).click();
 await expect(page.getByText(t('cancelled'),{exact:true})).toBeVisible();expect(cancellations).toBe(1);
});
test('failed eligibility read offers retry without confirmation or review',async({page})=>{
 await fixture(page,true,true);let attempts=0;
 await page.route('**/api/shida/personal/security/delete/',route=>{attempts++;return route.fulfill(attempts===1?{status:503,json:{}}:{json:{eligible:true,obligations:[],retained_records:false}});});
 await page.goto('/shida/space/?view=settings');await page.locator('.space-danger > summary').click();await page.getByRole('button',{name:deletionText('en','check'),exact:true}).click();
 const panel=page.locator('#account-deletion');await expect(page.getByRole('dialog')).toBeVisible();
 await expect(panel.getByRole('button',{name:deletionText('en','confirm'),exact:true})).toHaveCount(0);
 await panel.getByRole('button',{name:deletionText('en','retry'),exact:true}).click();await expect(panel.getByText(deletionText('en','eligible'))).toBeVisible();
});
test('deadline status offers sign out without restoration',async({page})=>{
 await fixture(page,true,true);let logout=0;
 await page.route('**/api/shida/personal/deletion/',route=>route.fulfill({json:{deletion:{reference:'DEL_fixture',status:'retrying',scheduled_at:'2026-01-01T12:00:00Z',can_cancel:false},binding:'a'.repeat(64)}}));
 await page.route('**/api/shida/employment/logout/',route=>{logout++;return route.fulfill({json:{logged_out:true}});});
 await page.goto('/shida/deletion/');await expect(page.getByText(deletionText('en','closed'),{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:deletionText('en','cancel'),exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:deletionText('en','signout'),exact:true}).click();
 await expect.poll(()=>logout).toBe(1);
});
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,390,768,1024,1440])test(`login email enrollment ${locale} ${width}`,async({page})=>{
 const state=await fixture(page,true,true),t=emailLoginCopy[locale];
 await page.setViewportSize({width,height:900});
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/space/?view=settings`);
 const setting=page.locator('.space-security-setting').filter({has:page.locator('summary').filter({hasText:t.email})});
 await setting.locator('summary').click();
 await setting.getByLabel(t.email,{exact:true}).fill('login@example.test');
 await setting.getByRole('button',{name:securityText(locale,'send'),exact:true}).click();
 await setting.getByLabel(t.code,{exact:true}).fill('12345678');
 await setting.getByRole('button',{name:securityText(locale,'verify'),exact:true}).click();
 await expect.poll(()=>state.loginEmail).toBe(true);
 await expect(setting.getByText('l***@example.test',{exact:true})).toBeVisible();
 expect(state.email).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,390,768,1024,1440])test(`passkey removal ${locale} ${width}: confirmation and fresh proof`,async({page})=>{
 const state=await fixture(page,true,true),t=(key:Parameters<typeof securityText>[1])=>securityText(locale,key);
 await page.setViewportSize({width,height:900});
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/space/?view=settings`);
 await page.locator('.space-security-setting').filter({has:page.getByRole('button',{name:t('passkey'),exact:true,includeHidden:true})}).locator('summary').click();
 await page.getByLabel(t('preferEmail'),{exact:true}).check();
 await page.getByRole('button',{name:t('removePasskey'),exact:true}).click();
 await expect(page.getByText(t('removePasskeyHelp'),{exact:true})).toBeVisible();expect(state.removed).toBe(0);
 await page.screenshot({path:`test-results/account-security/confirmation-${locale}-${width}.png`,fullPage:true});
 const confirmation=page.locator('li').filter({has:page.getByRole('button',{name:t('removePasskey'),exact:true})});
 await confirmation.getByRole('button',{name:t('cancel'),exact:true}).click();expect(state.removed).toBe(0);
 await page.getByRole('button',{name:t('removePasskey'),exact:true}).click();
 await confirmation.getByRole('button',{name:t('confirmRemovePasskey'),exact:true}).click();
 const proof=page.getByRole('region',{name:t('emailProof'),exact:true});await expect(proof).toBeVisible();expect(state.removed).toBe(0);
 await proof.getByLabel(t('code'),{exact:true}).fill('12345678');await proof.getByRole('button',{name:t('verify'),exact:true}).click();
 await expect.poll(()=>state.removed).toBe(1);await expect(page.getByRole('button',{name:t('removePasskey'),exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/account-security/removal-${locale}-${width}.png`,fullPage:true});
});
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,1366])test(`${locale} ${width}: security and signed-out reporting are usable`,async({page})=>{
 await fixture(page);await page.setViewportSize({width,height:900});const prefix=locale==='en'?'':`/${locale}`;
 await page.goto(`${prefix}/shida/space/?view=settings`);
 await expect(page.getByRole('heading',{name:accountDesignText(locale,'securityTitle'),exact:true})).toBeVisible();
 await expect(page.locator('.space-danger > summary')).toBeVisible();
 await expect(page.getByRole('heading',{name:mySpaceCopy[locale].lost,exact:true})).toBeVisible();
 await expect(page.locator('.account-protection a')).toHaveAttribute('href','?view=recovery');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto(`${prefix}/shida/space/?view=recovery`);
 const t=recoveryCopy[locale];await page.getByLabel(t.phone,{exact:true}).fill('243800000000');await page.getByLabel(t.email,{exact:true}).fill('synthetic@example.test');await page.getByLabel(t.message,{exact:true}).fill('Synthetic lost phone for account review');await page.getByRole('button',{name:t.send,exact:true}).click();
 await page.getByLabel(t.code,{exact:true}).fill('12345678');await page.getByRole('button',{name:t.verify,exact:true}).click();await expect(page.getByText(t.review,{exact:true})).toBeVisible();
});
test('support creates, replies and closes through the account space',async({page})=>{
 const state=await fixture(page),t=accountSupportCopy.en;await page.goto('/shida/space/?view=support');
 await page.getByLabel(t.message,{exact:true}).fill('Synthetic support ticket');await page.getByRole('button',{name:t.send,exact:true}).click();await expect(page.getByText('Synthetic support ticket',{exact:true})).toBeVisible();
 await page.getByLabel(t.message,{exact:true}).fill('Synthetic follow-up');await page.getByRole('button',{name:t.reply,exact:true}).click();await expect(page.getByText('Synthetic follow-up',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:t.close,exact:true}).click();await expect(page.getByLabel(t.message,{exact:true})).toHaveCount(0);expect(state.closed).toBe(true);
});

for(const width of [390,1366])test(`administrator deletion review ${width}: proof, revision and failed execution`,async({page})=>{
 await fixture(page);
 const decisions:string[]=[];
 let proofs=0;
 await page.addInitScript(()=>{
  Object.defineProperty(navigator.credentials,'get',{value:async()=>({id:'synthetic-key',rawId:new Uint8Array([1]).buffer,type:'public-key',response:{clientDataJSON:new Uint8Array([2]).buffer,authenticatorData:new Uint8Array([3]).buffer,signature:new Uint8Array([4]).buffer,userHandle:null},getClientExtensionResults:()=>({})})});
 });
 await page.route('**/api/shida/personal/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(path.endsWith('/passkeys/verify/options')){
   expect(route.request().postDataJSON()).toEqual({action:'review'});
   return route.fulfill({json:{reference:'SEC_review',options:{challenge:Buffer.alloc(32,8).toString('base64url')}}});
  }
  if(path.endsWith('/passkeys/verify/finish')){proofs++;return route.fulfill({json:{authorization:'SEC_review_proof'}});}
  if(path.endsWith('/deletion-review'))return route.fulfill({json:{requests:[{reference:'SCT_review',account_reference:'USR_synthetic',message:'Please review this synthetic account.',state:'deletion_requested',updated_at:'revision-1'}]}});
  if(path.endsWith('/deletion-review/SCT_review')){
   const body=route.request().postDataJSON();
   expect(body.authorization).toBe('SEC_review_proof');expect(body.revision).toBe('revision-1');expect(body.note.length).toBeGreaterThanOrEqual(40);
   decisions.push(body.decision);
   return route.fulfill({status:409,json:{error:'security_deletion_review_required'}});
  }
  return route.fallback();
 });
 await page.setViewportSize({width,height:900});await page.goto('/shida/space/?view=support');
 const review=page.locator('section').filter({has:page.getByRole('heading',{name:'Restricted deletion review',exact:true})});
 const execute=review.getByRole('button',{name:'Mark review resolved',exact:true});
 await expect(execute).toBeDisabled();
 await review.getByLabel('Review record',{exact:true}).fill('Independently reviewed the synthetic account obligations.');
 await expect(execute).toBeDisabled();
 await review.getByRole('checkbox').check();await execute.click();
 await expect(review.getByRole('alert')).toBeVisible();
 expect(decisions).toEqual(['resolved']);expect(proofs).toBe(1);
 await expect(review.getByText('SCT_review',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('real browser passkey enrollment and recovery-email step-up',async({page,context})=>{
 const state=await fixture(page);const cdp=await context.newCDPSession(page);await cdp.send('WebAuthn.enable');await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});
 await page.goto('http://localhost:3044/shida/space/?view=settings');await page.locator('summary').filter({hasText:'Passkey'}).click();await page.getByRole('button',{name:securityText('en','passkey'),exact:true}).click();await expect.poll(()=>state.registered).toBe(true);
 await page.locator('summary').filter({hasText:securityText('en','email')}).click();await page.getByLabel(securityText('en','email'),{exact:true}).fill('synthetic@example.test');await page.getByRole('button',{name:securityText('en','send'),exact:true}).first().click();await page.getByLabel(securityText('en','code'),{exact:true}).fill('12345678');await page.getByRole('button',{name:securityText('en','verify'),exact:true}).click();await expect.poll(()=>state.email).toBe(true);
 await page.getByLabel(securityText('en','preferEmail'),{exact:true}).check();await page.locator('.account-sessions summary').click();await page.getByRole('button',{name:securityText('en','revoke'),exact:true}).click();
 const region=page.getByRole('region',{name:securityText('en','emailProof'),exact:true});await region.getByLabel(securityText('en','code'),{exact:true}).fill('12345678');await region.getByRole('button',{name:securityText('en','verify'),exact:true}).click();await expect(region).toHaveCount(0);expect(state.proof).toBe(true);
 await page.screenshot({path:'test-results/account-security/settings.png',fullPage:true});
});
test('lost phone reporting requires no signed-in session',async({page})=>{
 await fixture(page,false);await page.goto('/shida/space/?view=recovery');await expect(page.getByLabel(recoveryCopy.en.phone,{exact:true})).toBeVisible();
});

for(const locale of ['en','fr','ln','sw'] as const)test(`independent email login ${locale}: restart and canonical session`,async({page})=>{
 await fixture(page,false);
 let signedIn=false,starts=0,cancels=0,verifications=0,whatsapp=0;
 await page.route('**/api/shida/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(path.endsWith('/employment/session'))return route.fulfill({status:signedIn?200:401,json:signedIn?{binding:'a'.repeat(64),user:{display_name:'Synthetic user'}}:{}});
  if(path.includes('/personal/auth/email/')){
   const action=path.split('/').pop();
   if(action==='capabilities')return route.fulfill({json:{enabled:true}});
   if(action==='start'){expect(route.request().postDataJSON()).toEqual({email:'login@example.test',language:locale});starts++;return route.fulfill({json:{reference:`EML_fixture_${starts}`,expires_in:600}});}
   if(action==='cancel'){cancels++;return route.fulfill({json:{cancelled:true}});}
   if(action==='verify'){expect(route.request().postDataJSON()).toEqual({reference:'EML_fixture_2',code:'12345678'});verifications++;signedIn=true;return route.fulfill({json:{authenticated:true}});}
  }
  if(route.request().method()==='POST'&&path.includes('/employment/login'))whatsapp++;
  return route.fallback();
 });
 const t=emailLoginCopy[locale];
 await page.setViewportSize({width:390,height:900});
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/space/?view=support`);
 await page.getByRole('button',{name:t.method,exact:true}).click();
 const form=page.locator('.auth-email form');
 await form.getByLabel(t.email,{exact:true}).fill('login@example.test');
 await form.getByRole('button',{name:t.send,exact:true}).click();
 await form.getByRole('button',{name:t.restart,exact:true}).click();
 await expect(form.getByLabel(t.email,{exact:true})).toBeVisible();
 expect(cancels).toBe(1);
 await form.getByRole('button',{name:t.send,exact:true}).click();
 await form.getByLabel(t.code,{exact:true}).fill('12345678');
 await form.getByRole('button',{name:t.verify,exact:true}).click();
 await expect(page.locator('.auth-email')).toHaveCount(0);
 expect(verifications).toBe(1);expect(starts).toBe(2);expect(whatsapp).toBe(0);
});

for(const width of [360,1440])test(`account sections identify the exact key, recovery and sessions at ${width}`,async({page})=>{
 const state=await fixture(page,true,true);
 let keys=[{reference:'KEY_one',created_at:'2026-01-01T10:00:00Z',ready_at:'2026-01-02T10:00:00Z'},{reference:'KEY_two',name:'Mon téléphone',created_at:'2026-02-01T10:00:00Z',ready_at:'2026-02-02T10:00:00Z'}];
 let failed=true,multiple=false,phone=false,removed='';
 await page.route('**/personal/security/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(path.endsWith('/security'))return route.fulfill({json:{email:multiple?'r***@example.test':null,email_ready_at:'2026-01-01T10:00:00Z',login_email:'m***@example.test',login_email_verified:true,passkeys:keys}});
  if(path.endsWith('/recovery'))return route.fulfill(failed?{status:503,json:{}}:{json:{methods:phone?[{kind:'phone',phone:'•••• 0123',verified:true,ready_at:'2099-01-01T10:00:00Z'}]:[]}});
  if(path.endsWith('/sessions'))return route.fulfill(failed?{status:503,json:{}}:{json:{sessions:[{reference:'one',current:true,last_seen_at:'2026-01-01T12:00:00Z'},...(multiple?[{reference:'two',current:false,last_seen_at:'2026-01-01T10:00:00Z'}]:[])]}});
  if(path.endsWith('/passkeys/revoke')){
   const body=route.request().postDataJSON();expect(state.proof).toBe(true);expect(body.confirmed).toBe(true);
   removed=body.reference;keys=keys.filter(key=>key.reference!==removed);return route.fulfill({json:{revoked:true}});
  }
  if(path.endsWith('/security/passkeys/verify/options'))return route.fulfill({status:403,json:{detail:'security_verification_required'}});
  return route.fallback();
 });
 await page.setViewportSize({width,height:800});await page.goto('/fr/shida/space?view=settings');
 await expect(page.locator('.account-sessions [role=alert]')).toBeVisible();
 await expect(page.getByText('Seule cette session est ouverte.')).toHaveCount(0);
 const empty='Ajoutez un moyen de retrouver votre compte si vous perdez votre téléphone.';
 await expect(page.getByText(empty)).toHaveCount(0);await expect(page.locator('#optional-recovery [role=alert]')).toBeVisible();failed=false;
 await page.locator('.account-sessions [role=alert] button').click();await page.locator('#optional-recovery [role=alert] button').click();
 await expect(page.getByText('Seule cette session est ouverte.')).toBeVisible();await expect(page.getByText(empty)).toBeVisible();
 await expect(page.locator('.space-account-security')).toContainText('•••• 0000');
 await expect(page.locator('#job-alert-login-email summary')).toContainText('m***@example.test');
 await expect(page.locator('.space-danger')).not.toHaveAttribute('open','');
 await page.locator('#job-alert-passkey summary').click();
 const second=page.locator('#job-alert-passkey li').nth(1);await second.getByRole('button',{name:'Retirer',exact:true}).click();
 await expect(second.locator('p')).toContainText('Mon téléphone');await expect(page.locator('#job-alert-passkey li').first().getByRole('button',{name:securityText('fr','confirmRemovePasskey')})).toHaveCount(0);
 expect(state.removed).toBe(0);await second.getByRole('button',{name:securityText('fr','cancel'),exact:true}).click();
 await page.screenshot({path:`test-results/account-security/account-${width}.png`,fullPage:true});
 multiple=true;phone=true;await page.reload();
 await expect(page.locator('#optional-recovery > fieldset summary').first()).toContainText('2099');
 await expect(page.getByText(empty)).toHaveCount(0);await page.locator('.account-sessions summary').click();
 await expect(page.getByRole('button',{name:'Déconnecter les autres sessions'})).toBeVisible();await expect(page.getByText('Seule cette session est ouverte.')).toHaveCount(0);
 await page.getByLabel(securityText('fr','preferEmail'),{exact:true}).check();
 await page.locator('#job-alert-passkey summary').click();
 await second.getByRole('button',{name:'Retirer',exact:true}).click();
 await second.getByRole('button',{name:securityText('fr','confirmRemovePasskey')}).click();
 const proof=page.getByRole('region',{name:securityText('fr','emailProof')});
 await proof.getByRole('textbox').fill('12345678');await proof.getByRole('button',{name:securityText('fr','verify'),exact:true}).click();
 await expect.poll(()=>removed).toBe('KEY_two');await expect(page.locator('#job-alert-passkey li')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
