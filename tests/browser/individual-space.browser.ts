import {test,expect} from '@playwright/test';

for(const kind of ['individual','mixed','partial','property','organization'])test(`listing navigation preserves ${kind} context`,async({page})=>{
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  const store={public_ref:'WNZ_fixture',revision:1,name:'Individual listings',selling_mode:'individual',catalog_ready:true,status:'active',visible:'true',city:'Kinshasa',delivery_areas:[],order_ready:true};
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test seller'}});
  if(path.endsWith('/security/navigation'))return reply({markets:kind==='property'?['wenze','apartments']:['wenze'],organization_management:kind==='organization'});
  if(path.endsWith('/wenze/stores'))return reply({stores:url.searchParams.get('archived')==='true'?[]:[store,...kind==='mixed'?[{...store,public_ref:'WNZ_shop',name:'Real boutique',selling_mode:'shop'}]:[]],product_categories:[]});
  if(path.endsWith('/restaurants'))return reply({items:[],total:0,actions:['create']},kind==='partial'?503:200);
  if(path.endsWith('/services'))return reply({profiles:[]});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:['profile']});
  if(path.endsWith('/quick-sell'))return reply({store});
  if(path.endsWith('/products'))return reply({products:[{public_ref:'WNP_fixture',revision:1,name:'Controlled individual listing',price:'120',currency:'USD',category:'other',condition:'used',quick_sell_state:'sold',sale_provenance:'seller_reported',status:'active',visible:'true',available_stock:0,committed_quantity:0,photos:[]}],next_offset:null});
  if(path.endsWith('/quick-sell-drafts'))return reply({drafts:[],next_offset:null});
  if(path.endsWith('/plan'))return reply({active_products:0,active_product_limit:100});
  if(path.endsWith('/notifications/count'))return reply({unread_count:0});
  return reply({},404);
 });
 await page.goto('/shida/space?view=management');
 const navigation=page.locator('.space-sidebar');
 if(kind==='individual'){
  await expect(page.locator('.qs-embedded')).toBeVisible();
  await expect(navigation.getByRole('link',{name:'My activities',exact:true})).toHaveCount(0);
  await expect(navigation.getByRole('link',{name:'My listings',exact:true})).toHaveAttribute('aria-current','page');
  await expect(page.locator('.qs-listing-card')).toContainText('Outside sale reported by you');
  await expect(page.locator('.qs-listing-card')).not.toContainText('Payment verified');
  await page.locator('.qs-listing-card summary').click();
  await expect(page.locator('.qs-listing-card').getByRole('button',{name:'Mark as sold',exact:true})).toBeDisabled();
 }else{
  await expect(page.locator('.activities-dashboard')).toBeVisible();
  await expect(navigation.getByRole('link',{name:'My activities',exact:true})).toHaveAttribute('aria-current','page');
  await expect(navigation.getByRole('link',{name:'My listings',exact:true})).toBeVisible();
 }
 await page.screenshot({path:`test-results/individual-space-${kind}-desktop.png`,fullPage:true});
 await page.setViewportSize({width:390,height:844});
 if(kind==='individual')await expect(page.locator('.qs-tabs').last()).toHaveCSS('flex-wrap','nowrap');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/individual-space-${kind}.png`,fullPage:true});
});


for(const width of [390,1440])test(`personal sales preserve role and canonical order ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});
 const seen:string[]=[];
 const store={public_ref:'WNZ_personal',name:'Personal listings'};
 const order={reference:'SH-ORDER-fixture',shop_reference:store.public_ref,shop_name:store.name,source:'fixed',buyer_name:'Controlled buyer',bucket:'completed',status_label:'Completed',total:'120',currency:'USD',fulfillment_method:'pickup',payment_verified:false,created_at:'2026-11-01T12:00:00Z',updated_at:'2026-11-01T12:00:00Z',delivery_details:null,items:[{name:'Controlled sold item',variant:'',quantity:1,unit_price:'120'}],allowed_actions:[],action_revision:'review-fixture'};
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');seen.push(path+'?'+url.searchParams.toString());
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test seller'}});
  if(path.endsWith('/security/navigation'))return reply({markets:['wenze'],organization_management:false});
  if(path.endsWith('/notifications/count'))return reply({unread_count:0});
  if(path.endsWith('/transactions')){
   const seller=url.searchParams.get('role')==='seller';
   return reply({counts:{all:seller?1:0,orders:seller?1:0,requests:0,documents:0},items:seller?[{id:'seller-fixture',role:'seller',store_reference:store.public_ref,kind:'wenze',category:'orders',reference:order.reference,related_reference:null,title:'Controlled personal sale',status:'completed',date:order.created_at,amount:'120',currency:'USD'}]:[],documents:[],page:1,page_size:10,has_more:false});
  }
  if(path.endsWith('/catalog-imports/options'))return reply({stores:[store],categories:[],currencies:['USD'],issues:{},support_url:null});
  if(path.endsWith('/orders/'+order.reference))return reply(order);
  if(path.endsWith('/orders'))return reply({orders:[order],counts:{all:1,completed:1},total:1});
  if(path.endsWith('/updates'))return reply({items:[]});
  return reply({},404);
 });
 await page.goto('/shida/space/?view=transactions&role=seller');
 await expect(page.locator('.tx-row')).toContainText('Controlled personal sale');
 await page.locator('.tx-row button').click();
 await expect(page.locator('.wo-orders')).toContainText(order.reference);
 await expect(page.locator('.wo-payment-detail')).toContainText(/not verified/i);
 expect(seen.some(url=>url.includes('/orders?')&&url.includes('store_ref=WNZ_personal'))).toBe(true);
 await page.locator('.tx-roles button').first().click();
 await expect(page.getByRole('heading',{name:'No transactions yet'})).toBeVisible();
 await expect(page.locator('.wo-orders')).toHaveCount(0);
 await expect(page.locator('.tx-summary strong')).toHaveText(['0','0','0']);
 await page.locator('.tx-roles button').last().click();
 await expect(page.locator('.tx-row')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
