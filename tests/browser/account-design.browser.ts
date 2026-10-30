import {test,expect,type Page} from '@playwright/test';
import {securityText} from '../../app/lib/account-security-copy';
import {accountDesignText} from '../../app/lib/account-design-copy';
import {accountNavigationCopy} from '../../app/lib/account-navigation-copy';
const output=process.env.ACCOUNT_DESIGN_EVIDENCE_DIR||'test-results/account-design/evidence';
async function fixture(page:Page){
 const state={writes:0,values:{personal_name:'Demo Account',city:'Kinshasa',country_code:'CD',area:'Gombe'}};
 await page.route('**/api/**',route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(route.request().method()==='POST')state.writes++;
  if(p.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Demo Account'}});
  if(p.endsWith('/security/navigation'))return reply({can_manage:false,markets:[],organization_management:false});
  if(p.endsWith('/security/profile')){if(route.request().method()==='POST'){const body=route.request().postDataJSON();expect(body.revision).toBe('r1');expect(body.values).not.toHaveProperty('phone');Object.assign(state.values,body.values);}return reply({revision:'r1',values:state.values,primary_phone:{masked:'•••• 0001',verified:true},neighborhood:null});}
  if(p.endsWith('/security'))return reply({email:null,email_ready_at:null,passkeys:[],protected:false});
  if(p.endsWith('/security/phone'))return reply({changes:[]});
  if(p.endsWith('/security/recovery'))return reply({methods:[]});
  if(p.endsWith('/notifications/count'))return reply({unread_count:0});
  return reply({},404);
 });return state;
}
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,1440])test(`approved account design ${locale} ${width}`,async({page})=>{
 const state=await fixture(page);await page.setViewportSize({width,height:1000});await page.goto(`${locale==='en'?'':'/'+locale}/shida/space?view=settings`);
 const rows=page.locator('.space-security-setting');await expect(rows).toHaveCount(8);await expect(rows.nth(2).locator('small')).toBeVisible();await expect(page.locator('.space-security-setting[open]')).toHaveCount(0);
 await expect(page.locator('.space-profile')).toContainText('•••• 0001');await expect(page.locator('.space-profile')).toContainText('Demo Account');
 const profile=(await page.locator('.space-profile').boundingBox())!,security=(await page.locator('.space-account-security').boundingBox())!;expect(profile.x).toBe(security.x);expect(profile.width).toBe(security.width);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`${output}/account-${locale}-${width}-collapsed.png`,fullPage:true});
 await rows.nth(0).locator('summary').focus();await page.keyboard.press('Enter');await expect(rows.nth(0)).toHaveAttribute('open');
 await rows.nth(1).locator('summary').click();await expect(page.locator('.space-security-setting[open]')).toHaveCount(1);await expect(rows.nth(0)).not.toHaveAttribute('open');
 await rows.nth(1).getByLabel(securityText(locale,'email'),{exact:true}).fill('unsaved@example.test');await rows.nth(1).getByRole('button',{name:accountNavigationCopy[locale].cancel,exact:true}).click();await expect(page.locator('.space-security-setting[open]')).toHaveCount(0);await expect(rows.nth(1).locator('summary')).toBeFocused();
 await rows.nth(1).locator('summary').click();await expect(rows.nth(1).getByLabel(securityText(locale,'email'),{exact:true})).toHaveValue('');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/account-${locale}-${width}-expanded.png`,fullPage:true});
 await rows.nth(7).locator('summary').click();await expect(page.locator('.space-security-setting[open]')).toHaveCount(1);expect(state.writes).toBe(0);
 await expect(page.locator('.space-danger')).toContainText(accountDesignText(locale,'dangerHelp'));
 await expect(page.locator('.account-protection a')).toHaveAttribute('href','?view=recovery');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('profile edits save through existing revision API, cancel discards changes',async({page})=>{
 const state=await fixture(page);await page.goto('/shida/space?view=settings');const profile=page.locator('.space-profile');
 await expect(profile).toContainText('Congo');await profile.getByRole('button',{name:'Edit',exact:true}).click();await profile.locator('#profile-personal_name').fill('Discard me');await profile.getByRole('button',{name:'Cancel',exact:true}).click();expect(state.writes).toBe(0);
 await profile.getByRole('button',{name:'Edit',exact:true}).click();await expect(profile.locator('#profile-personal_name')).toHaveValue('Demo Account');await profile.locator('#profile-personal_name').fill('Updated Demo');await profile.getByRole('button',{name:'Save changes',exact:true}).click();await expect.poll(async()=>{const cards=await profile.allTextContents();return cards.length===1&&cards[0].includes('Updated Demo');}).toBe(true);expect(state.writes).toBe(1);await expect(profile.locator('input[type=tel]')).toHaveCount(0);
});
test('failed security reads do not claim configured status',async({page})=>{
 await fixture(page);await page.route('**/personal/security/recovery/',r=>r.fulfill({status:503,json:{}}));await page.goto('/shida/space?view=settings');await expect(page.locator('#optional-recovery [role=alert]')).toBeVisible();await expect(page.locator('#optional-recovery summary small')).toHaveCount(0);
});
