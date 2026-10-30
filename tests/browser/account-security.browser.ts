import {test,expect,type Page} from '@playwright/test';
import {mySpaceCopy} from '../../app/lib/my-space-refinement-copy';
import {securityText} from '../../app/lib/account-security-copy';
import {accountSupportCopy} from '../../app/lib/account-support-copy';
import {recoveryCopy} from '../../app/lib/account-recovery-copy';

async function fixture(page:Page,signedIn=true){
 const state={registered:false,email:false,closed:false,message:'',replies:[] as string[],proof:false};
 await page.route('**/api/shida/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,''),body=route.request().method()==='POST'?route.request().postDataJSON():{};
  const reply=(data:unknown,status=200)=>route.fulfill({status,json:data});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Synthetic user'}},signedIn?200:401);
  if(path.includes('/personal/security')){
   const base='/api/shida/personal/security',part=path.slice(base.length);
   if(part==='')return reply({email:state.email?'s***@example.test':null,email_ready_at:'2026-01-01T00:00:00Z',protected:false,passkeys:state.registered?[{reference:'KEY_fixture',ready_at:'2026-01-01T00:00:00Z'}]:[]});
   if(part==='/phone')return reply({changes:[]});
   if(part==='/passkeys/register/options')return reply({reference:'SEC_fixture',options:{challenge:Buffer.alloc(32,7).toString('base64url'),rp:{id:'localhost',name:'SHIDA'},user:{id:Buffer.from('USR_fixture').toString('base64url'),name:'Synthetic user',displayName:'Synthetic user'},pubKeyCredParams:[{type:'public-key',alg:-7}],authenticatorSelection:{residentKey:'required',userVerification:'required'},timeout:30000}});
   if(part==='/passkeys/register/verify'){expect(body.credential.response.attestationObject).toBeTruthy();state.registered=true;return reply({registered:true});}
   if(part==='/email/start')return reply({reference:'SEC_email'});
   if(part==='/email/verify'){expect(body.code).toBe('12345678');state.email=true;return reply({verified:true});}
   if(part==='/email/proof/start')return reply({reference:'SEC_proof'});
   if(part==='/email/proof/verify'){state.proof=true;return reply({authorization:'SEC_authorized'});}
   if(part==='/sessions/revoke'){expect(state.proof).toBe(true);expect(body.authorization).toBe('SEC_authorized');return reply({revoked:true});}
   if(part==='/delete')return reply({eligible:false});
  }
  if(path.includes('/personal/support')){
   if(route.request().method()==='POST'&&path.endsWith('/support'))state.message=body.message;
   if(path.endsWith('/reply'))state.replies.push(body.message);
   if(path.endsWith('/close'))state.closed=true;
   const ticket={public_ref:'SUP_fixture',category:'other',message:state.message,status:state.closed?'closed':'open',created_at:'2026-01-01T00:00:00Z'};
   if(path.endsWith('/support')&&route.request().method()==='GET')return reply({tickets:state.message?[ticket]:[]});
   return reply({ticket,messages:state.replies.map(message=>({sender_type:'user',message}))});
  }
  if(path==='/api/shida/recovery')return reply({reference:'REC_fixture'});
  if(path==='/api/shida/recovery/verify')return reply({submitted:true});
  return reply({},404);
 });
 return state;
}
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,1366])test(`${locale} ${width}: security and signed-out reporting are usable`,async({page})=>{
 await fixture(page);await page.setViewportSize({width,height:900});const prefix=locale==='en'?'':`/${locale}`;
 await page.goto(`${prefix}/shida/space/?view=settings`);
 await expect(page.getByRole('heading',{name:securityText(locale,'title'),exact:true})).toBeVisible();
 await expect(page.locator('#account-deletion summary')).toBeVisible();
 await expect(page.getByRole('link',{name:mySpaceCopy[locale].lost,exact:true})).toBeVisible();
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
test('real browser passkey enrollment and recovery-email step-up',async({page,context})=>{
 const state=await fixture(page);const cdp=await context.newCDPSession(page);await cdp.send('WebAuthn.enable');await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});
 await page.goto('http://localhost:3044/shida/space/?view=settings');await page.locator('summary').filter({hasText:'Passkey'}).click();await page.getByRole('button',{name:securityText('en','passkey'),exact:true}).click();await expect.poll(()=>state.registered).toBe(true);
 await page.locator('summary').filter({hasText:securityText('en','email')}).click();await page.getByLabel(securityText('en','email'),{exact:true}).fill('synthetic@example.test');await page.getByRole('button',{name:securityText('en','send'),exact:true}).first().click();await page.getByLabel(securityText('en','code'),{exact:true}).fill('12345678');await page.getByRole('button',{name:securityText('en','verify'),exact:true}).click();await expect.poll(()=>state.email).toBe(true);
 await page.getByLabel(securityText('en','preferEmail'),{exact:true}).check();await page.locator('summary').filter({hasText:securityText('en','revoke')}).click();await page.getByRole('button',{name:securityText('en','revoke'),exact:true}).click();
 const region=page.getByRole('region',{name:securityText('en','emailProof'),exact:true});await region.getByLabel(securityText('en','code'),{exact:true}).fill('12345678');await region.getByRole('button',{name:securityText('en','verify'),exact:true}).click();await expect(region).toHaveCount(0);expect(state.proof).toBe(true);
 await page.screenshot({path:'test-results/account-security/settings.png',fullPage:true});
});
test('lost phone reporting requires no signed-in session',async({page})=>{
 await fixture(page,false);await page.goto('/shida/space/?view=recovery');await expect(page.getByLabel(recoveryCopy.en.phone,{exact:true})).toBeVisible();
});
