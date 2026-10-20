import {test,expect} from '@playwright/test';
for(const locale of ['en','fr'] as const)for(const method of ['pickup','delivery'] as const)test(`${locale} mobile ${method} checkout retry`,async({page})=>{
 let attempts=0;const keys:string[]=[];
 const group={store_reference:'WNZ_fixture',store_name:'Boutique du Fleuve',subtotal:'15000',currency:'CDF',fulfillment_method:null as string|null,available_methods:['pickup','delivery'],delivery_areas:['Gombe'],delivery_fee:null,delivery_fee_status:null,items:[{reference:'CI_fixture',product_reference:'WNP_fixture',name:'Chemise blanche',variant:'M',quantity:1,unit_price:'15000',line_total:'15000',currency:'CDF'}]};
 const cart={reference:'C_fixture',status:'active',currency:'CDF',version:1,item_count:1,seller_count:1,product_subtotal:'15000',delivery_total:'0',grand_total:'15000',expires_at:'2027-01-01',seller_groups:[group]};
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(path.endsWith('/employment/session'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Buyer'}}});
  if(path.endsWith('/cart/fulfillment')){expect(route.request().postDataJSON().method).toBe(method);group.fulfillment_method=method;cart.version++;return route.fulfill({json:{cart}});}
  if(path.endsWith('/cart/confirm')){keys.push(route.request().postDataJSON().idempotency_key);attempts++;return route.fulfill(attempts===1?{status:503,json:{error:{code:'api_unavailable'}}}:{json:{reference:'WNO_fixture',created:false}});}
  if(path.endsWith('/cart'))return route.fulfill({json:{cart}});
  return route.fulfill({json:{}});
 });
 await page.setViewportSize({width:390,height:844});await page.goto(locale==='fr'?'/fr/shida/wenze/panier/':'/shida/wenze/cart/');
 await page.getByRole('combobox').selectOption(method);
 if(method==='delivery'){await page.getByLabel(locale==='fr'?'Ville':'City',{exact:true}).fill('Kinshasa');await page.getByLabel('Commune',{exact:true}).fill('Gombe');await page.getByLabel(locale==='fr'?'Adresse de livraison':'Delivery address',{exact:true}).fill('Synthetic test address');}
 await page.getByRole('button',{name:locale==='fr'?'Enregistrer le choix':'Save choice',exact:true}).click();
 const confirm=page.getByRole('button',{name:locale==='fr'?'Passer commande':'Place order',exact:true});await expect(confirm).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:`docs/evidence/wenze-checkout/${locale}-${method}-mobile.png`,fullPage:true});
 await confirm.click();await expect(page.locator('.wenze-web-checkout').getByRole('alert')).toBeVisible();await confirm.click();
 await expect(page.getByRole('heading',{name:locale==='fr'?'Commande enregistrée':'Order placed'})).toBeVisible();
 expect(keys[0]).toBe(keys[1]);
 await expect(page.getByRole('link',{name:locale==='fr'?'Suivre mes commandes':'Track my orders'})).toBeVisible();
});
