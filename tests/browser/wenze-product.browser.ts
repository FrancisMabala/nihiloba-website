import {test,expect} from '@playwright/test';

for(const locale of ['en','fr'])test(`${locale} product gallery, mobile purchase controls and cart remain usable`,async({page})=>{
 let writes=0;
 const cart={reference:'CRT_fixture',status:'active',currency:'CDF',version:1,item_count:0,seller_count:0,product_subtotal:'0',delivery_total:null,grand_total:null,seller_groups:[],expires_at:'2099-01-01T00:00:00Z'};
 await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname.replace(/\/$/,'');if(path==='/api/shida/cart')return route.fulfill({json:{cart}});if(path==='/api/shida/cart/items'){writes++;expect(route.request().postDataJSON().product_reference).toBe('WNP_BUXYSHRL');return route.fulfill({json:{cart:{...cart,version:2,item_count:1}}});}return route.fulfill({status:401,json:{}});});
 await page.setViewportSize({width:1440,height:1000});await page.goto(locale==='fr'?'/fr/shida/wenze/produits/WNP_BUXYSHRL':'/shida/wenze/products/WNP_BUXYSHRL');
 await expect(page.getByRole('heading',{name:'Chemise Blanc',exact:true})).toBeVisible();
 const gallery=page.locator('.wzp-product-gallery');await expect.poll(()=>gallery.locator('.marketplace-gallery-open img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 const imageBox=await gallery.boundingBox(),panel=await page.locator('.wzp-product-info').boundingBox();expect(panel!.x).toBeGreaterThan(imageBox!.x+imageBox!.width);expect(panel!.y).toBeLessThan(imageBox!.y+40);
 await page.screenshot({path:`docs/evidence/wenze-product/${locale}-desktop.png`,fullPage:true});
 await gallery.getByRole('button',{name:locale==='fr'?'Image suivante':'Next image',exact:true}).click();await expect(gallery.locator('.marketplace-image-count').first()).toContainText('2 /');
 await gallery.locator('.marketplace-gallery-open').click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 await gallery.getByRole('button',{name:'1 / 3',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const add=page.getByRole('button',{name:locale==='fr'?'Ajouter au panier':'Add to cart',exact:true});expect((await add.boundingBox())!.y).toBeLessThan(844);
 await page.screenshot({path:`docs/evidence/wenze-product/${locale}-mobile.png`,fullPage:true});
 await add.click();await expect(page.getByRole('status').filter({hasText:locale==='fr'?'Ajouté':'Added'})).toBeVisible();expect(writes).toBe(1);
});
