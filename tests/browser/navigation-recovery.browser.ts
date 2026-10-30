import {test,expect,type Page} from '@playwright/test';
import {accountNavigationCopy} from '../../app/lib/account-navigation-copy';
import {optionalRecoveryCopy} from '../../app/lib/optional-recovery-copy';
import {securityText} from '../../app/lib/account-security-copy';
async function fixture(page:Page){
 // WebKit upgrades loopback HTTP assets under the production CSP. Adapt only
 // local fixture document responses; all other policy directives remain intact.
 await page.route('http://127.0.0.1:3044/**',async route=>{
  if(route.request().resourceType()!=='document')return route.fallback();
  const response=await route.fetch(),headers=response.headers();
  headers['content-security-policy']=headers['content-security-policy']?.replace(/;?\s*upgrade-insecure-requests/g,'')||'';
  await route.fulfill({response,headers});
 });
 const state={manage:false,name:'Synthetic Person',writes:0,methods:[] as object[],value:'',binding:'a'.repeat(64)};
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,''),post=route.request().method()==='POST',body=post?route.request().postDataJSON():{},reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:state.binding,user:{display_name:state.name}});
  if(path.endsWith('/security/navigation'))return reply({can_manage:state.manage,markets:state.manage?['wenze']:[],organization_management:false});
  if(path.endsWith('/security/profile')){if(post){state.writes++;state.name=body.values.personal_name??state.name;}return reply({revision:'revision',values:{personal_name:state.name,city:'Kinshasa',country_code:'CD',area:'Gombe'},primary_phone:{masked:'•••• 0001',verified:true},neighborhood:'Gombe'});}
  if(path.endsWith('/security'))return reply({email:'s***@example.test',email_ready_at:'2025-01-01',passkeys:[],protected:false});
  if(path.endsWith('/security/phone'))return reply({changes:[]});
  if(path.endsWith('/security/recovery'))return reply({methods:state.methods});
  if(path.endsWith('/email/proof/start'))return reply({reference:'SEC_proof'});
  if(path.endsWith('/email/proof/verify'))return reply({authorization:'SEC_authorized'});
  if(path.endsWith('/recovery/set')){expect(body.authorization).toBe('SEC_authorized');state.value=body.value??'';state.methods=[{kind:body.kind,ready_at:'2099-01-01',verified:true,consumed:false}];return reply({ready_at:'2099-01-01',...(body.kind==='code'?{code:'synthetic_recovery_code_keep_safe'}:{})});}
  if(path.includes('/notifications')){
   if(path.endsWith('/count'))return reply({unread_count:1});
   if(path.endsWith('/actions'))return reply({updated:1});
   return reply({items:[{reference:'NTF_fixture',marketplace:'wenze',title:'Synthetic order',description:'Marketplace activity',created_at:'2026-10-30T12:00:00Z',read:false,acknowledged:false,expired:false,action_required:true,action_url:'https://nihiloba.com/shida/wenze/orders'}],next_cursor:null});
  }
  return reply({},404);
 });return state;
}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,390,768,1440])test(`navigation and profile ${locale} ${width}`,async({page})=>{
 const state=await fixture(page),n=accountNavigationCopy[locale],prefix=locale==='en'?'':`/${locale}`;
 await page.setViewportSize({width,height:850});await page.goto(`${prefix}/shida/space?view=settings`);
 const card=page.locator('.registration-card');await expect(card).toContainText('•••• 0001');await expect(card.getByRole('textbox')).toHaveCount(0);
 await card.getByRole('button',{name:n.edit,exact:true}).click();await card.locator('#profile-personal_name').fill('Discarded Name');await card.getByRole('button',{name:n.cancel,exact:true}).click();await expect(card).not.toContainText('Discarded Name');expect(state.writes).toBe(0);
 await card.getByRole('button',{name:n.edit,exact:true}).click();await card.locator('#profile-personal_name').fill('Updated Person');await card.locator('button[type="submit"],button.button-primary').click();await expect.poll(()=>state.name).toBe('Updated Person');
 const nav=page.locator('.shida-navigation');await expect(nav).toBeVisible({visible:width<768});await expect(nav.getByRole('link',{includeHidden:true})).toHaveCount(3);state.manage=true;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(nav.getByRole('link',{includeHidden:true})).toHaveCount(4);state.manage=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(nav.getByRole('link',{includeHidden:true})).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto(`${prefix}/shida/space?view=messages`);await expect(page.locator('.notification-inline')).toContainText('Synthetic order');await expect(page.locator('.space-content .notification-bell')).toHaveCount(0);await expect(page.locator('.notification-header-link')).toHaveCount(1);
});
test('passphrase and generated code require existing proof and show code once',async({page})=>{
 const state=await fixture(page),t=optionalRecoveryCopy.fr;await page.goto('/fr/shida/space?view=settings');const section=page.locator('#optional-recovery');
 await section.getByLabel(t.passphrase,{exact:true}).fill('River lantern velvet orchard 2026!');await section.getByRole('button',{name:t.save,exact:true}).click();
 const proof=page.getByRole('region',{name:securityText('fr','emailProof')});await proof.getByRole('textbox').fill('12345678');await proof.getByRole('button',{name:securityText('fr','verify'),exact:true}).click();
 await expect.poll(()=>state.value).toBe('River lantern velvet orchard 2026!');await expect(section.getByLabel(t.passphrase,{exact:true})).toHaveValue('');
 await section.getByRole('button',{name:t.generate,exact:true}).click();await proof.getByRole('textbox').fill('12345678');await proof.getByRole('button',{name:securityText('fr','verify'),exact:true}).click();await expect(section.locator('output')).toHaveText('synthetic_recovery_code_keep_safe');await section.getByRole('button',{name:t.hide,exact:true}).click();await expect(section.locator('output')).toHaveCount(0);
});
