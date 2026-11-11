import {test,expect,type Page} from '@playwright/test';
import {fixture} from './wenze-checkout-fixture';
async function setup(page:Page,locale:'en'|'fr'|'ln'|'sw'='en'){
 const f=await fixture(page,{locale});const writes:Record<string,unknown>[]=[];
 await page.route('**/api/shida/registration-reference/**',route=>route.fulfill({json:{kinshasa_communes:['Gombe','Lemba','Limete']}}));
 await page.route('**/api/shida/personal/wenze/stores/**',route=>{
  if(!new URL(route.request().url()).pathname.endsWith('/stores/'))return route.fallback();
  if(route.request().method()==='POST'){writes.push(route.request().postDataJSON());return route.fulfill({status:503,json:{detail:'controlled retry'}});}
  return route.fulfill({json:{stores:[],categories:['fashion_clothing','phones_electronics','home_equipment','beauty_cosmetics','other'].map((code,i)=>({code,labels:{en:['Clothing','Electronics','Home','Beauty','Other'][i],fr:['Mode et vêtements','Téléphones','Maison','Beauté','Autre'][i],ln:['Bilamba','Telefone','Ndako','Kitoko','Mosusu'][i],sw:['Mavazi','Simu','Nyumba','Urembo','Nyingine'][i]}})),currencies:['CDF','USD']}});
 });
 await page.goto(f.url.split('?')[0]);await page.locator('.wz-seller-setup button.button-primary').click();await expect(page.locator('.wb-create')).toBeVisible();return{...f,writes};
}
for(const width of [360,390,768,1024,1440])test(`boutique steps ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const f=await setup(page);
 await page.getByLabel('Shop name',{exact:false}).fill('Controlled boutique');await page.locator('.wb-categories input').first().check();await page.getByLabel('City',{exact:false}).fill('Kinshasa');await page.getByRole('combobox',{name:'Commune',exact:true}).selectOption('Lemba');
 await page.screenshot({path:`test-results/boutique-evidence/identity-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:/Continue/}).click();await page.getByLabel('Configure ordering later').uncheck();await page.locator('.wb-content select').first().selectOption('online_and_physical');await page.locator('.wb-content select').nth(1).selectOption('pickup_and_delivery');
 await page.getByLabel('Public pickup address',{exact:false}).fill('Controlled public pickup point');await page.getByLabel('I agree to display').check();await page.getByRole('combobox',{name:'Delivery fee *',exact:true}).selectOption('fixed');await page.getByRole('textbox',{name:'Fee amount *',exact:true}).fill('1500');await page.getByRole('combobox',{name:'Fee currency *',exact:true}).selectOption('CDF');await page.getByRole('textbox',{name:/Delivery zones/}).fill('Lemba\nGombe');await page.getByLabel('Cash',{exact:true}).check();await page.getByLabel('External Mobile Money',{exact:true}).check();
 await page.screenshot({path:`test-results/boutique-evidence/settings-${width}.png`,fullPage:true});await page.getByRole('button',{name:/Continue/}).click();await expect(page.locator('.wb-review')).toContainText('Controlled boutique');await page.screenshot({path:`test-results/boutique-evidence/review-${width}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:/Create my shop/}).click();await expect.poll(()=>f.writes.length).toBe(1);expect(f.writes[0]).toMatchObject({name:'Controlled boutique',fulfillment_mode:'pickup_and_delivery',delivery_fee:'1500',initial_settings:{payment_methods:['cash','mobile_money'],public_address_confirmed:true}});await expect(page.locator('.wb-review')).toContainText('Controlled boutique');await page.getByRole('button',{name:/Create my shop/}).click();await expect.poll(()=>f.writes.length).toBe(2);expect(f.writes[1]).toEqual(f.writes[0]);expect(f.errors).toEqual([]);
});
for(const locale of ['fr','ln','sw'] as const)test(`localized boutique ${locale}`,async({page})=>{await setup(page,locale);await expect(page.locator('.wb-content h1')).not.toHaveText('Create my Wenze shop');await expect(page.locator('.wb-categories label')).toHaveCount(4);expect(await page.locator('.wb-content').innerText()).not.toContain('undefined');});

test('same-session draft survives reload without publishing',async({page})=>{
 const f=await setup(page);await page.getByLabel('Shop name',{exact:false}).fill('Recoverable boutique');
 await page.reload();await page.locator('.wz-seller-setup button.button-primary').click();
 await expect(page.getByLabel('Shop name',{exact:false})).toHaveValue('Recoverable boutique');expect(f.writes).toEqual([]);
});

test('successful creation opens management without claiming public activation',async({page})=>{
 await setup(page);const shop={public_ref:'WNZ_fixture',name:'New boutique',store_type:'online_only',city:'Kinshasa',category:'fashion_clothing',revision:1,status:'active',visible:'false',catalog_ready:true,order_ready:false};
 await page.route('**/api/shida/personal/wenze/stores/',route=>route.fulfill({json:route.request().method()==='POST'?shop:{stores:[shop],categories:[],currencies:['CDF','USD']}}));
 await page.getByLabel('Shop name',{exact:false}).fill(shop.name);await page.locator('.wb-categories input').first().check();await page.getByLabel('City',{exact:false}).fill('Kinshasa');
 await page.getByRole('button',{name:/Continue/}).click();await page.getByRole('button',{name:/Continue/}).click();await page.getByRole('button',{name:/Create my shop/}).click();
 await expect(page.getByRole('heading',{name:'Welcome to Wenze!'})).toBeVisible();await expect(page.getByRole('button',{name:'Manage my shop'})).toBeVisible();await expect(page.getByRole('button',{name:'Add my first product'})).toBeVisible();
 await expect(page.getByText('Publicly active',{exact:true})).toHaveCount(0);
});
