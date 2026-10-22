import {test,expect,type Page} from '@playwright/test';
import {accountSpaceCopy} from '../../app/lib/account-space-copy';
import {marketplaceAccountCopy} from '../../app/components/shida/marketplace-account-copy';
async function fixture(page:Page){
 const state={signedIn:true,name:'Francis Mabala',binding:'a'.repeat(64),foodStatus:200,provider:true,privateReads:0,writes:0};
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,''),reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(route.request().method()!=='GET')state.writes++;
  if(path.endsWith('/employment/session'))return state.signedIn?reply({binding:state.binding,user:{display_name:state.name}}):reply({},401);
  if(path.endsWith('/employment/logout')){state.signedIn=false;return reply({authenticated:false});}
  if(path.endsWith('/personal/services'))return reply({profiles:state.provider?[{public_ref:'SVC_demo'}]:[]});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:['profile']});
  if(path.endsWith('/personal/restaurant-orders')){state.privateReads++;return reply({items:[{order_ref:'ROD_DEMO',establishment_name:state.name==='Francis Mabala'?'Malewa ya Marché':'Nouveau restaurant',state:'ready',submitted_at:'2026-10-21T12:30:00Z',order_total:'20000',currency:'CDF'}]},state.foodStatus);}
  if(path.endsWith('/wenze-buyer/orders')){state.privateReads++;return reply({orders:[{reference:'WZ_DEMO',store_name:'Boutique Kin',total:'35000',currency:'CDF',timeline:{current:'preparing'}}],total:1});}
  return reply({},404);
 });return state;
}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [390,820,1440])test(`space navigation ${locale} ${width}`,async({page})=>{
 const state=await fixture(page),t=accountSpaceCopy[locale],a=marketplaceAccountCopy[locale],prefix=locale==='en'?'':`/${locale}`;
 await page.setViewportSize({width,height:900});await page.goto(`${prefix}/shida/space`);
 await expect(page.getByRole('heading',{name:`${t.hello} Francis`,exact:true})).toBeVisible();await expect(page.locator('.space-recent')).toContainText('Malewa ya Marché');await expect(page.locator('.space-recent')).toContainText('Boutique Kin');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr')await page.screenshot({path:`docs/evidence/account-space/home-${width}.png`});
 await page.getByRole('button',{name:`${a.account} · Francis Mabala`,exact:true}).click();
 const account=page.locator('.market-menu');await expect(account.getByRole('link')).toHaveCount(2);await expect(account.getByRole('link',{name:t.settings,exact:true})).toBeVisible();await expect(account.getByRole('button')).toHaveCount(2);await page.keyboard.press('Escape');
 if(width<=700){await page.locator('.space-bottom').getByRole('button',{name:t.menu,exact:true}).click();const menu=page.getByRole('dialog',{name:a.space,exact:true});await expect(menu).toBeVisible();await expect(menu.getByRole('link',{name:t.receipts,exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(menu).not.toBeVisible();await expect(page.locator('.space-bottom').getByRole('button',{name:t.menu,exact:true})).toBeFocused();await page.locator('.space-bottom').getByRole('link',{name:t.management,exact:true}).click();await expect(page.locator('.space-content').getByRole('link',{name:t.services,exact:true})).toBeVisible();}
 else{await page.locator('.space-management summary').click();await expect(page.locator('.space-management').getByRole('link',{name:t.services,exact:true})).toBeVisible();}
 await page.screenshot({path:`docs/evidence/account-space/${locale}-${width}.png`,fullPage:true});expect(state.writes).toBe(0);
 await page.goto(`${prefix}/shida/space?view=receipts`);await expect(page.locator('.space-content').getByRole('link',{name:t.bills,exact:true})).toHaveAttribute('href',`${prefix}/shida/service-bills`);
 await page.goto(`${prefix}/shida/space?view=inbox`);await expect(page.locator('h1')).toHaveText(t.messages);
 await page.goto(`${prefix}/shida/space?view=settings`);await expect(page.getByRole('combobox',{name:t.language,exact:true})).toHaveValue(locale);
});
test('clears the previous identity and orders on switch and sign-out',async({page})=>{
 const state=await fixture(page);await page.goto('/fr/shida/space');await expect(page.locator('.space-recent')).toContainText('Malewa ya Marché');state.binding='b'.repeat(64);state.name='Marie Test';await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.locator('h1')).toHaveText('Bonjour Marie');await expect(page.locator('.space-recent')).not.toContainText('Malewa ya Marché');await expect(page.locator('.space-recent')).toContainText('Nouveau restaurant');
 await page.getByRole('button',{name:'Mon compte SHIDA · Marie Test',exact:true}).click();await page.locator('.market-menu').getByRole('button',{name:'Se déconnecter',exact:true}).click();await expect(page.locator('h1')).toHaveText('Bonjour');await expect(page.locator('.space-recent')).toHaveCount(0);
});
test('guest, unavailable source and corporate cart boundaries',async({page})=>{
 const state=await fixture(page);state.signedIn=false;await page.goto('/fr/shida/space');await expect(page.locator('.space-sign-in')).toBeVisible();expect(state.privateReads).toBe(0);await page.goto('/fr');await expect(page.locator('.header-cart-link,.market-cart')).toHaveCount(0);state.signedIn=true;state.foodStatus=503;await page.goto('/fr/shida/space');await expect(page.locator('.space-recent')).toContainText(accountSpaceCopy.fr.failed);await expect(page.locator('.space-recent')).toContainText('Boutique Kin');await expect(page.locator('.market-cart')).toBeVisible();
});
test('mobile has no horizontal overflow at 320px and settings language preserves destination',async({page})=>{
 await fixture(page);await page.setViewportSize({width:320,height:720});await page.goto('/fr/shida/space?view=settings');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('combobox',{name:'Langue',exact:true}).selectOption('sw');await expect(page).toHaveURL(/\/sw\/shida\/space\/?\?view=settings/);await expect(page.locator('h1')).toHaveText(accountSpaceCopy.sw.settings);
});
