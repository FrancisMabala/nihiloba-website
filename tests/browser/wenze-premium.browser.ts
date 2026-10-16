import {test,expect,type Page} from '@playwright/test';
import type {CommerceCart} from '../../app/types/shida-commerce';

test('mobile catalog puts products before the boutique story without horizontal overflow',async({page})=>{
 await fixture(page,false);await page.setViewportSize({width:390,height:844});await page.goto('/shida/wenze/WNZ_VFNON8');
 await expect(page.locator('.wenze-product-card').first()).toBeVisible();
 await expect.poll(()=>page.locator('.wenze-product-card img').first().evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 const photo=await page.locator('.wenze-product-card .marketplace-card-image').first().boundingBox();
 expect(photo!.y).toBeLessThan(520);
 expect(await page.locator('#about').evaluate(el=>el.getBoundingClientRect().top)).toBeGreaterThan(photo!.y+photo!.height);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'docs/evidence/wenze-premium/boutique-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'docs/evidence/wenze-premium/boutique-desktop.png',fullPage:true});
});

test('cart stays usable on mobile, updates quantities, and does not promise free delivery',async({page})=>{
 let quantity=2;
 const cart=():CommerceCart=>({reference:'CRT_fixture',status:'active',currency:'CDF',version:quantity,item_count:quantity,seller_count:quantity?1:0,product_subtotal:String(quantity*15000),delivery_total:'0',grand_total:String(quantity*15000),expires_at:'2099-01-01T00:00:00Z',seller_groups:quantity?[{store_reference:'WNZ_fixture',store_name:'SHIDA Boutique Test',subtotal:String(quantity*15000),currency:'CDF',fulfillment_method:null,delivery_fee:null,delivery_fee_status:null,items:[{reference:'CI_fixture',product_reference:'WNP_fixture',name:'Chemise Blanc',variant:'M · Blanc',quantity,unit_price:'15000',line_total:String(quantity*15000),currency:'CDF',image:null,product_url:null}]}]:[]});
 await page.route('**/api/**',async route=>{const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');if(path==='/api/shida/cart/items/CI_fixture'){quantity=request.method()==='DELETE'?0:request.postDataJSON().quantity;return route.fulfill({json:{cart:cart()}});}if(path==='/api/shida/cart')return route.fulfill({json:{cart:cart()}});return route.fulfill({status:401,json:{}});});
 await page.setViewportSize({width:1440,height:1000});await page.goto('/shida/wenze/cart');
 await expect(page.getByRole('heading',{name:'Order summary'})).toBeVisible();await expect(page.locator('.wenze-cart-summary')).toContainText('Calculated in WhatsApp');await expect(page.locator('.wenze-cart-grand-total')).toHaveCount(0);
 await page.screenshot({path:'docs/evidence/wenze-premium/cart-desktop.png',fullPage:true});
 await page.setViewportSize({width:360,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Increase quantity: Chemise Blanc',exact:true}).click();await expect(page.getByRole('spinbutton',{name:'Quantity: Chemise Blanc'})).toHaveValue('3');
 await expect(page.locator('.wenze-cart-line-total')).toContainText('45,000 CDF');
 await page.screenshot({path:'docs/evidence/wenze-premium/cart-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Remove',exact:true}).click();await expect(page.getByText('Your cart is empty.',{exact:false})).toBeVisible();
});
// Public catalog rendering uses the same read-only test boutique as the reported issue.
// Every browser API mutation is intercepted locally; no live order or relationship is changed.
async function fixture(page:Page,loggedIn=true){
 const state={loggedIn,saved:false,following:false,writes:[] as {path:string;body:Record<string,unknown>}[],cartVersion:1,stale:false,cartReads:0,review:false};
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return state.loggedIn?reply({binding:'a'.repeat(64),user:{display_name:'Fixture buyer'}}):reply({},401);
  const cart={reference:'CRT_fixture',status:'active',currency:'CDF',version:state.cartVersion,item_count:0,seller_count:0,product_subtotal:'0',delivery_total:null,grand_total:null,seller_groups:[],expires_at:'2099-01-01T00:00:00Z'};
  if(path==='/api/shida/cart'){state.cartReads++;return reply({cart});}
  if(path==='/api/shida/cart/items'){
   state.writes.push({path,body:req.postDataJSON()});
   if(state.stale){state.stale=false;state.cartVersion=3;return reply({error:{code:'cart_conflict',conflicts:[{code:'stale_cart_version'}]}},409);}
   return reply({cart:{...cart,item_count:1,version:4}});
  }
  if(path.startsWith('/api/shida/wenze-reviews/'))return reply({items:state.review?[{review_ref:'RVW_fixture',rating:5,comment:'Great shirt',verified_experience:true}]:[],total:state.review?1:0,summary:{average:state.review?5:null,count:state.review?1:0}});
  if(!path.startsWith('/api/shida/personal/wenze-buyer/'))return reply({},404);
  expect(req.headers()['x-shida-session']).toBe('a'.repeat(64));
  if(req.method()!=='GET'){
   const body=req.postDataJSON();state.writes.push({path,body});
   if(path.includes('/relations/')){if(body.relation==='following')state.following=body.enabled;else state.saved=body.enabled;return reply({enabled:body.enabled});}
   if(path.endsWith('/review')){state.review=true;return reply({});}
   return reply({});
  }
  if(path.endsWith('/saved'))return reply({items:state.saved?[{kind:'wenze_product',reference:'WNP_BUXYSHRL',name:'Chemise Blanc'}]:[]});
  if(path.endsWith('/review-eligibility'))return reply({eligible:true,existing_review:state.review?{review_ref:'RVW_fixture',rating:5,comment:'Great shirt',revision:1,status:'visible'}:null});
  return reply({saved:state.saved,following:state.following});
 });return state;
}
test('signed-in buyer follows, saves privately, reads and writes a verified review',async({page})=>{
 const state=await fixture(page);await page.goto('/shida/wenze/WNZ_VFNON8');
 await page.getByRole('button',{name:'Follow boutique',exact:true}).click();await expect(page.getByRole('button',{name:'Following',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.locator('.wenze-product-card').getByRole('button',{name:'♡ Favourite',exact:true}).click();await expect(page.locator('.wenze-product-card').getByRole('button',{name:'♥ Saved',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'My favourites',exact:true}).click();await expect(page.locator('.wzp-favourites section').getByRole('link',{name:'Chemise Blanc'})).toBeVisible();
 await page.getByLabel('Comment (optional)').fill('Great shirt');await page.getByRole('button',{name:'Publish review'}).click();await expect(page.locator('#reviews article')).toContainText('Verified SHIDA order');
 expect(state.writes.find(w=>w.path.endsWith('/review'))?.body).toEqual({rating:5,comment:'Great shirt',expected_revision:null});
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));await page.screenshot({path:'docs/evidence/wenze-premium/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'docs/evidence/wenze-premium/mobile.png',fullPage:true});
 state.loggedIn=false;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.getByLabel('Comment (optional)')).toHaveCount(0);await expect(page.locator('.wzp-favourites section')).toHaveCount(0);
});
test('guests can read reviews and receive a working sign-in prompt',async({page})=>{
 await fixture(page,false);await page.goto('/shida/wenze/WNZ_VFNON8');await expect(page.getByText('No reviews yet',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Follow boutique',exact:true}).click();await expect(page.getByRole('region',{name:'Sign in',exact:true})).toBeVisible();await expect(page.getByLabel('Comment (optional)')).toHaveCount(0);
});
test('stale cart refreshes before a deliberate retry and stock conflicts show their cause',async({page})=>{
 const state=await fixture(page,false);state.stale=true;await page.goto('/shida/wenze/WNZ_VFNON8');await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.locator('.wenze-cart-action-error')).toContainText('cart changed');await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.getByText('Added to cart',{exact:false})).toBeVisible();expect(state.writes.filter(w=>w.path.endsWith('/cart/items')).map(w=>w.body.expected_version)).toEqual([1,3]);
 await page.route('**/api/shida/cart/items/',route=>route.fulfill({status:409,json:{error:{code:'cart_conflict',conflicts:[{code:'insufficient_stock'}]}}}));await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.locator('.wenze-cart-action-error')).toContainText('requested quantity');
});
