import {test,expect} from '@playwright/test';
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,1280])for(const method of ['pickup','delivery'] as const)test(`${locale} ${width} ${method} checkout retry`,async({page})=>{
 let attempts=0;const keys:string[]=[];
 const group={store_reference:'WNZ_fixture',store_name:'Boutique du Fleuve',subtotal:'15000',currency:'CDF',fulfillment_method:null as string|null,available_methods:['pickup','delivery'],delivery_areas:['Gombe'],delivery_fee:null as string|null,delivery_fee_status:null as string|null,items:[{reference:'CI_fixture',product_reference:'WNP_fixture',name:'Chemise blanche',variant:'M',quantity:1,unit_price:'15000',line_total:'15000',currency:'CDF'}]};
 const cart={reference:'C_fixture',status:'active',currency:'CDF',version:1,item_count:1,seller_count:1,product_subtotal:'15000',delivery_total:'0',grand_total:'15000',expires_at:'2027-01-01',seller_groups:[group]};
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(path.endsWith('/employment/session'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Buyer'}}});
  if(path.endsWith('/cart/fulfillment')){expect(route.request().postDataJSON().method).toBe(method);group.fulfillment_method=method;group.delivery_fee_status="known";group.delivery_fee="0";cart.version++;return route.fulfill({json:{cart}});}
  if(path.endsWith('/cart/confirm')){keys.push(route.request().postDataJSON().idempotency_key);attempts++;return route.fulfill(attempts===1?{status:503,json:{error:{code:'api_unavailable'}}}:{json:{reference:'WNO_fixture',created:false}});}
  if(path.endsWith('/cart'))return route.fulfill({json:{cart}});
  return route.fulfill({json:{}});
 });
 await page.setViewportSize({width,height:844});await page.goto(locale==='en'?'/shida/wenze/cart/':`/${locale}/shida/wenze/panier/`);
 await expect(page.getByRole('combobox')).toBeEnabled();await page.getByRole('combobox').selectOption(method);
 const labels={en:{city:'City',area:'Commune',address:'Street, compound or precise delivery description',save:'Save choice',confirm:'Place order',placed:'Order placed',track:'Track my orders'},fr:{city:'Ville',area:'Commune',address:'Avenue, parcelle ou description précise',save:'Enregistrer le choix',confirm:'Passer commande',placed:'Commande enregistrée',track:'Suivre mes commandes'},ln:{city:'Engumba',area:'Commune / zone',address:'Balabala, lopango to esika ya sikisiki',save:'Bomba boponi',confirm:'Tinda commande',placed:'Commande ebombami',track:'Landa bacommande na ngai'},sw:{city:'Mji',area:'Manispaa / eneo',address:'Barabara, kiwanja au maelezo sahihi',save:'Hifadhi chaguo',confirm:'Tuma agizo',placed:'Agizo limehifadhiwa',track:'Fuatilia maagizo yangu'}}[locale];
 if(method==='delivery'){await page.getByLabel(labels.city,{exact:true}).fill('Kinshasa');await page.getByLabel(labels.area,{exact:true}).fill('Gombe');await page.getByLabel(labels.address,{exact:true}).fill('Synthetic test address');}
 await page.getByRole('button',{name:labels.save,exact:true}).click();
 const confirm=page.getByRole('button',{name:labels.confirm,exact:true});await expect(confirm).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:`docs/evidence/delivery-workflow/${locale}-${method}-${width}.png`,fullPage:true});
 await confirm.click();await expect(page.locator('.wenze-web-checkout').getByRole('alert')).toBeVisible();await confirm.click();
 await expect(page.getByRole('heading',{name:labels.placed})).toBeVisible();
 expect(keys[0]).toBe(keys[1]);
 await expect(page.getByRole('link',{name:labels.track})).toBeVisible();
});
