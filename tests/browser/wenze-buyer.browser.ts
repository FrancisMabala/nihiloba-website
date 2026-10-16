import {test,expect,type Page} from '@playwright/test';
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
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));await page.screenshot({path:'docs/evidence/wenze-buyer/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'docs/evidence/wenze-buyer/mobile.png',fullPage:true});
 state.loggedIn=false;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.getByLabel('Comment (optional)')).toHaveCount(0);await expect(page.locator('.wzp-favourites section')).toHaveCount(0);
});
test('guests can read reviews and receive a working sign-in prompt',async({page})=>{
 await fixture(page,false);await page.goto('/shida/wenze/WNZ_VFNON8');await expect(page.getByText('No reviews yet',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Follow boutique',exact:true}).click();await expect(page.getByRole('region',{name:'Sign in',exact:true})).toBeVisible();await expect(page.getByLabel('Comment (optional)')).toHaveCount(0);
});
test('stale cart refreshes before a deliberate retry and stock conflicts show their cause',async({page})=>{
 const state=await fixture(page,false);state.stale=true;await page.goto('/shida/wenze/WNZ_VFNON8');await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.locator('.wenze-cart-action-error')).toContainText('cart changed');await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.getByText('Added to cart',{exact:false})).toBeVisible();expect(state.writes.filter(w=>w.path.endsWith('/cart/items')).map(w=>w.body.expected_version)).toEqual([1,3]);
 await page.route('**/api/shida/cart/items/',route=>route.fulfill({status:409,json:{error:{code:'cart_conflict',conflicts:[{code:'insufficient_stock'}]}}}));await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.locator('.wenze-cart-action-error')).toContainText('requested quantity');
});
