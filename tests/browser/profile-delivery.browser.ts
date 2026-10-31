import {test,expect} from '@playwright/test';
for(const scenario of ['delivery','pickup','foreign','switch'] as const)test(`profile prefill ${scenario} stays private and requires checkout confirmation`,async({page})=>{
 let reads=0,writes=0,release=()=>{};
 const waiting=new Promise<void>(resolve=>{release=resolve;});
 const group={store_reference:'WNZ_fixture',store_name:'Fixture shop',subtotal:'15000',currency:'CDF',fulfillment_method:null,available_methods:['pickup','delivery'],delivery_areas:['Gombe'],items:[{reference:'CI_fixture',product_reference:'WNP_fixture',name:'Fixture item',quantity:1,unit_price:'15000',line_total:'15000',currency:'CDF'}]};
 const cart={reference:'C_fixture',status:'active',currency:'CDF',version:1,item_count:1,seller_count:1,product_subtotal:'15000',delivery_total:'0',grand_total:'15000',expires_at:'2027-01-01',seller_groups:[group]};
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(route.request().method()!=='GET')writes++;
  if(path.endsWith('/employment/session'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Fixture buyer'}}});
  if(path.endsWith('/security/profile')){reads++;expect(route.request().headers()['x-shida-session']).toBe('a'.repeat(64));if(scenario==='switch')await waiting;return route.fulfill({json:{values:{country_code:scenario==='foreign'?'SE':'CD',city:'Kinshasa',commune:'Gombe',avenue:'PRIVATE_PREFILL',parcel_number:'2'}}});}
  if(path.endsWith('/cart'))return route.fulfill({json:{cart}});
  return route.fulfill({json:{}});
 });
 await page.goto('/shida/wenze/cart/');await expect(page.getByRole('combobox')).toBeEnabled();await page.getByRole('combobox').selectOption(scenario==='pickup'?'pickup':'delivery');
 expect(reads).toBe(0);
 const button=page.getByRole('button',{name:'Use my profile location'});
 if(scenario==='pickup'){await expect(button).toHaveCount(0);await expect(page.getByLabel('City',{exact:true})).toHaveCount(0);return;}
 await button.click();await expect.poll(()=>reads).toBe(1);
 if(scenario==='switch'){await page.getByRole('combobox').selectOption('pickup');release();await page.getByRole('combobox').selectOption('delivery');await expect(page.getByLabel('Street, compound or precise delivery description')).toHaveValue('');}
 else if(scenario==='foreign'){await expect(page.getByText('Your profile location cannot prefill this delivery. Enter the address below.')).toBeVisible();await expect(page.getByLabel('City',{exact:true})).toHaveValue('');}
 else {await expect(page.getByLabel('City',{exact:true})).toHaveValue('Kinshasa');await expect(page.getByLabel('Street, compound or precise delivery description')).toHaveValue('PRIVATE_PREFILL, 2');await expect(page.getByText('Review and complete this delivery address before saving.')).toBeVisible();}
 expect(writes).toBe(0);expect(await page.evaluate(()=>JSON.stringify({...sessionStorage,...localStorage}))).not.toContain('PRIVATE_PREFILL');
});
