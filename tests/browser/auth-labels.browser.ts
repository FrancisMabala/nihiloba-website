import {test,expect} from '@playwright/test';
import {fixture} from './account-security-fixture';
for(const width of [390,1366])test(`missing name returns through profile to passkey setup at ${width}`,async({page,context})=>{
 const state=await fixture(page);let saved=false,options=0;
 const cdp=await context.newCDPSession(page);await cdp.send('WebAuthn.enable');
 await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});
 await page.addInitScript(()=>{
  Object.defineProperty(window,'labelSignals',{value:[],writable:true});
  Object.defineProperty(PublicKeyCredential,'signalCurrentUserDetails',{configurable:true,value:async(details:unknown)=>{(window as unknown as {labelSignals:unknown[]}).labelSignals.push(details);}});
 });
 await page.route('**/api/shida/personal/security/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(path.endsWith('/profile')){
   if(route.request().method()==='POST'){
    expect(route.request().postDataJSON().values).toMatchObject({first_name:'Francis',family_name:'Mabala'});saved=true;
   }
   return route.fulfill({json:{revision:saved?'saved':'original',values:{personal_name:saved?'Francis Mabala':null,first_name:saved?'Francis':null,family_name:saved?'Mabala':null,city:'Kinshasa',country_code:'CD',preferred_language:'fr'},primary_phone:{masked:'•••• 0000',verified:true},neighborhood:null}});
  }
  if(path.endsWith('/security'))return route.fulfill({json:{email:null,email_ready_at:null,protected:false,passkeys:[],passkey_user:saved?{rpId:'localhost',userId:Buffer.from('USR_fixture').toString('base64url'),name:'Francis Mabala',displayName:'Francis Mabala'}:null}});
  if(path.endsWith('/passkeys/register/options')){
   options++;expect(saved).toBe(true);
   return route.fulfill({json:{reference:'SEC_fixture',options:{challenge:Buffer.alloc(32,7).toString('base64url'),rp:{id:'localhost',name:'SHIDA'},user:{id:Buffer.from('USR_fixture').toString('base64url'),name:'Francis Mabala',displayName:'Francis Mabala'},pubKeyCredParams:[{type:'public-key',alg:-7}],authenticatorSelection:{residentKey:'required',userVerification:'required'},timeout:30000}}});
  }
  return route.fallback();
 });
 await page.setViewportSize({width,height:900});await page.goto('/fr/shida/space/?view=settings#job-alert-passkey');
 await page.locator('#add-passkey').click();await expect(page.locator('#profile-first_name')).toBeFocused();expect(options).toBe(0);
 await page.locator('#profile-first_name').fill('Francis');await page.locator('#profile-family_name').fill('Mabala');
 await page.locator('#passkey-profile form button.button-primary').click();
 await expect(page).toHaveURL(/#job-alert-passkey$/);await expect(page.locator('#add-passkey')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {labelSignals:{name:string}[]}).labelSignals.map(value=>value.name))).toContain('Francis Mabala');
 await page.locator('#add-passkey').click();await expect.poll(()=>state.registered).toBe(true);expect(options).toBe(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
