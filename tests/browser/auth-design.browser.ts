import {generateKeyPairSync} from 'node:crypto';
import {marketplaceAccountCopy} from '../../app/components/shida/marketplace-account-copy';
import {test,expect,type Page} from '@playwright/test';
import {authDesignCopy} from '../../app/lib/auth-design-copy';
import {personalLoginCopy} from '../../app/lib/personal-login-copy';
import {publicAccountCopy} from '../../app/lib/public-account-copy';
async function fixture(page:Page){
 const state={signedIn:false,enabled:true,status:'pending',starts:0,exchanges:0,passkeys:0,logout:0,name:'Review Account'};
 await page.addInitScript(()=>{window.open=()=>null;});
 await page.route('**/api/**',async route=>{const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
 if(path.endsWith('/employment/session'))return state.signedIn?reply({binding:'a'.repeat(64),user:{display_name:state.name}}):reply({},401);
 if(path.endsWith('/employment/logout')){state.signedIn=false;state.logout++;return reply({authenticated:false});}
 if(path.endsWith('/notifications/count'))return reply({unread_count:0});
 if(path.endsWith('/passkey/capabilities'))return reply({enabled:state.enabled});
 if(path.endsWith('/passkey/options'))return reply({options:{challenge:'YXV0aC1maXh0dXJl',rpId:'localhost',userVerification:'required',timeout:5000}});
 if(path.endsWith('/passkey/verify')){state.passkeys++;state.signedIn=true;return reply({authenticated:true});}
 if(path.endsWith('/auth/whatsapp')){state.starts++;return reply({challenge_ref:'DWC_fixture_'+state.starts,expires_at:new Date(Date.now()+240000).toISOString(),whatsapp_url:'https://wa.me/243000000000?text=isolated-fixture'});}
 if(path.includes('/auth/whatsapp/DWC_')){if(request.method()==='DELETE')return reply({status:'cancelled'});if(path.endsWith('/session')){state.exchanges++;if(request.postDataJSON().code!=='123456')return reply({error:{code:'invalid_code'}},400);state.signedIn=true;return reply({authenticated:true});}return reply({status:state.status});}
 return reply({},404);
 });return state;
}
for(const width of [360,390,768,1440])for(const view of ['signin','code','menu','error'])test(`${view} ${width}`,async({page})=>{
 const state=await fixture(page);state.signedIn=view==='menu';await page.setViewportSize({width,height:900});await page.goto('/shida/services/');
 if(view==='menu'){await page.getByRole('button',{name:'My SHIDA account · Review Account',exact:true}).click();await expect(page.locator('.auth-account-identity')).toContainText('Review Account');await expect(page.locator('.auth-account-menu a')).toHaveCount(3);}
 else{await page.getByRole('button',{name:'Sign in to SHIDA',exact:true}).click();await expect(page.getByRole('button',{name:'Continue with passkey'})).toBeVisible();if(view!=='signin'){state.status='verified';await page.getByRole('button',{name:'Continue with WhatsApp',exact:true}).click();await expect(page.getByLabel(personalLoginCopy.en.codeLabel)).toBeVisible();if(view==='error'){await page.getByLabel(personalLoginCopy.en.codeLabel).fill('000000');await page.getByRole('button',{name:'Verify and sign in',exact:true}).click();await expect(page.locator('.candidate-login [role=alert]')).toContainText(personalLoginCopy.en.invalidCode);}}}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/auth-evidence/${view}-${width}.png`,fullPage:false});
 await page.keyboard.press('Escape');await expect(page.locator('.auth-account-menu')).toHaveCount(0);await expect(page.getByRole('dialog')).not.toBeVisible();
});
for(const locale of ['en','fr','ln','sw'] as const)test(`WhatsApp round trip and switching ${locale}`,async({page})=>{
 const state=await fixture(page),t=authDesignCopy[locale],p=personalLoginCopy[locale],a=publicAccountCopy[locale];await page.goto(`${locale==='en'?'':'/'+locale}/shida/services/?city=test`);await page.getByRole('button',{name:a.signInLabel,exact:true}).click();state.status='verified';await page.getByRole('button',{name:t.whatsapp,exact:true}).click();const input=page.getByLabel(p.codeLabel);await expect(input).toBeVisible();await input.fill('123456');await input.press('Backspace');await expect(input).toHaveValue('12345');await input.press('6');await page.getByRole('button',{name:t.verify,exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();expect(state.exchanges).toBe(1);expect(page.url()).toContain('?city=test');
 await page.locator('.market-avatar').click();await page.locator('.auth-account-menu').getByRole('button',{name:marketplaceAccountCopy[locale].change,exact:true}).click();await expect(page.getByRole('button',{name:t.whatsapp,exact:true})).toBeVisible();expect(state.logout).toBe(1);expect(state.signedIn).toBe(false);
});
test('passkey controlled gate, cancellation and existing session',async({page,context})=>{
 const state=await fixture(page);state.enabled=false;await page.goto('/shida/services/');await page.getByRole('button',{name:'Sign in to SHIDA',exact:true}).click();await expect(page.getByRole('button',{name:'Continue with passkey'})).toHaveCount(0);await page.keyboard.press('Escape');await expect(page.locator('.candidate-login')).toHaveCount(0);state.enabled=true;await page.getByRole('button',{name:'Sign in to SHIDA',exact:true}).click();
 // Browser-managed virtual authenticator: tests navigator.credentials.get rather
 // than a mocked success. The backend separately verifies real signatures.
 const cdp=await context.newCDPSession(page);await cdp.send('WebAuthn.enable');const {authenticatorId}=await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});
 await page.getByRole('button',{name:'Continue with passkey'}).click();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();expect(state.passkeys).toBe(0);await page.getByRole('button',{name:'Sign in to SHIDA',exact:true}).click();await expect(page.getByRole('button',{name:'Continue with WhatsApp',exact:true})).toBeVisible();const pair=generateKeyPairSync('ec',{namedCurve:'prime256v1'});await cdp.send('WebAuthn.addCredential',{authenticatorId,credential:{credentialId:Buffer.from('fixture-credential').toString('base64'),isResidentCredential:true,rpId:'localhost',privateKey:pair.privateKey.export({type:'pkcs8',format:'der'}).toString('base64'),userHandle:Buffer.from('ACC_fixture').toString('base64'),signCount:0}});await page.getByRole('button',{name:'Continue with passkey'}).click();await expect(page.getByRole('dialog')).not.toBeVisible();expect(state.passkeys).toBe(1);await expect(page.getByRole('button',{name:'My SHIDA account · Review Account',exact:true})).toBeVisible();await cdp.send('WebAuthn.removeVirtualAuthenticator',{authenticatorId});
});
