import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 await page.route('**/api/shida/**',r=>r.fulfill({status:401,json:{}}));
 await page.route('**/_next/image**',r=>r.fulfill({path:'public/NIHILOBA_logo.png',contentType:'image/png'}));
});
for(const width of [320,390,820,1440])test(`public marketplaces and filters ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 for(const market of ['','wenze','services','restaurants','emplois','appartements','hotels','transport']){
  await page.goto(`/fr/shida/${market}`);
  await expect(page.locator('h1').filter({visible:true})).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(!market||market==='transport')continue;
  const input=page.locator('input[name=query]').first();await input.fill('empty');
  await input.press('Enter');await expect(page).toHaveURL(/query=empty/);
  const active=page.getByRole('navigation',{name:'Filtres actifs'});await expect(active).toContainText('empty');
  await active.getByRole('link',{name:'Effacer les filtres',exact:true}).click();
  await expect(page).not.toHaveURL(/query=/);
 }
});
test('French Wenze filters stay visible, independently removable, and survive browser back',async({page})=>{
 await page.setViewportSize({width:390,height:900});
 await page.goto('/fr/shida/wenze?min_price=10&availability=in_stock&city=Kinshasa');
 const active=page.getByRole('navigation',{name:'Filtres actifs'});
 await expect(active).toContainText('10');await expect(page.locator('.wzp-filters details')).not.toHaveAttribute('open');
 await active.getByRole('link',{name:/Retirer.*10/}).click();
 await expect(page).not.toHaveURL(/min_price/);await expect(page).toHaveURL(/city=Kinshasa/);
 await page.goBack();await expect(active).toContainText('10');
 await expect(page.locator('.wenze-product-card h2 a').first()).toHaveAttribute('href',/^\/fr\/shida\/wenze\/produits\//);
 await expect(page.locator('.market-cart')).toHaveAttribute('data-contextual','true');
 await page.screenshot({path:'docs/evidence/ux-refinement-20261028/filters-fr-390.png',fullPage:true});
});
test('mobile menu preserves all cart languages and has no duplicate settings destination',async({page})=>{
 await page.setViewportSize({width:390,height:900});
 for(const locale of ['fr','ln','sw']){
  await page.goto(`/${locale}/shida/emplois`);
  await expect(page.locator('.market-cart')).not.toHaveAttribute('data-contextual');
  const trigger=page.locator('.shida-navigation button');await trigger.click();
  const dialog=page.locator('#shida-menu');await expect(dialog.locator(`a[href="/${locale}/shida/wenze/panier"]`)).toBeVisible();
  await expect(dialog.locator(`a[href="/${locale}/shida/space?view=settings"]`)).toHaveCount(1);
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
 }
});

test('French discovery, variant, cart and return preserve language and search context',async({page})=>{
 const cart={reference:'C_UX',status:'active',currency:'USD',version:1,item_count:0,seller_count:0,product_subtotal:'0',delivery_total:null,grand_total:null,expires_at:'2099-01-01',seller_groups:[] as unknown[]};let writes=0;
 await page.route('**/api/shida/cart**',route=>{
  if(new URL(route.request().url()).pathname.endsWith('/items/')){writes++;expect(route.request().postDataJSON()).toMatchObject({product_reference:'WNP_REFINE0',variant_reference:'WNV_M'});Object.assign(cart,{version:2,item_count:1,seller_count:1,product_subtotal:'15',seller_groups:[{store_reference:'WNZ_UX',store_name:'Test shop',currency:'USD',subtotal:'15',available_methods:['pickup'],items:[{reference:'CI_UX',product_reference:'WNP_REFINE0',name:'Product 1',variant:'M',quantity:1,unit_price:'15',line_total:'15',currency:'USD',product_url:'https://nihiloba.com/shida/wenze/products/refine-0'}]}]});}
  return route.fulfill({json:{cart}});
 });
 await page.setViewportSize({width:390,height:900});await page.goto('/fr/shida/wenze?city=Kinshasa');
 await page.locator('.wenze-product-card h2 a').first().click();await expect(page).toHaveURL(/\/fr\/shida\/wenze\/produits\/refine-0/);
 await page.getByRole('button',{name:'M',exact:true}).click();await page.getByRole('button',{name:'Ajouter au panier',exact:true}).click();
 await page.getByRole('link',{name:'Voir le panier',exact:true}).click();await expect(page).toHaveURL(/\/fr\/shida\/wenze\/panier/);
 await expect(page.locator('.wenze-cart-item h3 a')).toHaveAttribute('href','/fr/shida/wenze/produits/refine-0/');expect(writes).toBe(1);
 await page.goBack();await page.goBack();await expect(page).toHaveURL(/city=Kinshasa/);
 await page.goto('/fr/shida/emplois');await expect(page.locator('.market-cart')).toHaveAttribute('data-contextual','true');await expect(page.locator('.market-cart')).toContainText('1');
});
