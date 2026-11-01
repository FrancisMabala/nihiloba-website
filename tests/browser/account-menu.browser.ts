import {test,expect} from '@playwright/test';
const routes=['space','wenze','services','restaurants','emplois','appartements','hotels','transport','seller/wenze','seller/services','seller/restaurants'];
for(const width of [360,390,768,1024,1440])for(const route of routes)test(`${route} account menu ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.route('**/api/**',async r=>{const path=new URL(r.request().url()).pathname.replace(/\/$/,'');const reply=(json:unknown)=>r.fulfill({json});
 if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Review Account'}});
 if(path.endsWith('/stores'))return reply({stores:[{public_ref:'WNZ_fixture',name:'Review shop',status:'active',city:'Kinshasa',category:'other',revision:1,visible:'true',catalog_ready:true,order_ready:true}],categories:[],currencies:['CDF']});
 if(path.endsWith('/services'))return reply({profiles:[{public_ref:'SVC_review',provider_ref:'SVI_review',name:'Review professional',service_name:'Review consultation',category:'consulting',description:'Consultation',service_duration_minutes:60,commune:'Gombe',service_location_type:'public_place',booking_mode:'flexible',visible_to_customers:true,is_active:'yes',revision:1,missing_fields:[],packages:[],rating:{count:0,average:null}}]});
 if(path.endsWith('/restaurants'))return reply({items:[{public_ref:'RST_review',revision:'2026-11-01T08:00:00Z',status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours'],profile:{name:'Review restaurant',city:'Kinshasa',commune:'Gombe',food_business_type:'restaurant',timezone_name:'Africa/Kinshasa'}}],total:1});
 if(path.endsWith('/establishments'))return reply({items:[],establishments:[]});
 if(path.endsWith('/capabilities'))return reply({capabilities:['profile','reservations','messages'],access_policy:'pilot',purchase_required:false});
 if(path.endsWith('/notifications/count'))return reply({unread_count:0});
 if(path.endsWith('/today'))return reply({date:'2026-11-01',timezone:'Africa/Kinshasa',requests:{items:[]},pending:{items:[]},upcoming:{items:[]},messages:{items:[]},currency_summaries:[],sold_items:[]});
 return reply({items:[],total:0,has_more:false});});
 if(route==='seller/wenze')await wenzeFixture(page);
 if(route==='seller/restaurants')await restaurantFixture(page);
 await page.goto('/shida/'+route);
 const trigger=page.getByRole('button',{name:'My SHIDA account · Review Account',exact:true});await expect(trigger).toBeVisible();
 await expect(page.locator('.seller-space-return')).toHaveCount(0);
 await trigger.focus();await page.keyboard.press('Enter');const menu=page.locator('.auth-account-menu');await expect(menu).toBeVisible();
 await expect(menu).toContainText('Personal account');await expect(menu.getByRole('link')).toHaveCount(3);
 await expect(menu.getByRole('link',{name:'My space',exact:true})).toHaveAttribute('href','/shida/space');
 await expect(menu.getByRole('link',{name:'Messages',exact:true})).toHaveAttribute('href','/shida/space?view=messages');
 await expect(menu.getByRole('link',{name:'Account settings',exact:true})).toHaveAttribute('href','/shida/space?view=settings');
 await expect(menu.getByRole('button',{name:'Close account menu'})).toBeFocused();await page.keyboard.press('Tab');await expect(menu.getByRole('link').first()).toBeFocused();
 const box=await menu.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);expect(box!.y+box!.height).toBeLessThanOrEqual(900);
 await page.screenshot({path:`test-results/header-evidence/${route.replaceAll('/','-')}-${width}.png`});
 await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(menu).toHaveCount(0);
 await page.keyboard.press('Space');await expect(menu).toBeVisible();await menu.getByRole('button',{name:'Close account menu'}).click();await expect(trigger).toBeFocused();
 await trigger.click();await page.mouse.click(2,200);await expect(menu).toHaveCount(0);
 await page.screenshot({path:`test-results/header-evidence/${route.replaceAll('/','-')}-closed-${width}.png`});
});

async function wenzeFixture(page:import('@playwright/test').Page){const locale='en';
 const shop={public_ref:'WNZ_fixture',name:'SHIDA Boutique Test',city:'Kinshasa',category:'other',description:'Maison, accessoires et produits du quotidien',revision:1,status:'active',visible:'true',catalog_ready:true,order_ready:true};
 const product={public_ref:'WNP_fixture',revision:1,name:'Marmite familiale',category:'other',status:'active',visible:'true',price:'15000',currency:'CDF',available_stock:7,photos:[],variants:[]};
 const stock={item_ref:'INV_fixture',catalog_ref:product.public_ref,catalog_label:product.name,revision:1,operational_code:'INV-ABC123',on_hand:7,reserved:0,available:7,unit:'piece',low_stock_threshold:2};
 const receipt={store_ref:shop.public_ref,receipt_ref:'WRC_fixture',shop_name:shop.name,city:'Kinshasa',sold_at:'2026-10-21T12:00:00Z',source:'basket',payment:'not_recorded',has_reversals:false,lines:[{name:product.name,quantity:1,unit_price:'15000',total:'15000',currency:'CDF'}],totals:[{currency:'CDF',amount:'15000'}]};
 let writes=0;page.on('dialog',()=>{throw Error('Unexpected native dialog');});
 await page.addInitScript(l=>localStorage.setItem('shida-wenze-language',l),locale);
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Review Account'}});
  if(path.endsWith('/me'))return reply({user:{account_type:'both',display_name:'Review Account'},businesses:[]});
  if(path.endsWith('/contexts'))return reply({contexts:[{type:'organization',public_ref:'BUS_fixture',name:'SHIDA Boutique Test',role:'owner',restricted:false,onboarding_status:'complete',operational_state:'operational'}]});
  if(path.endsWith('/stores'))return reply({stores:[shop],categories:[{code:'other',labels:{en:'Other products',fr:'Autres produits',ln:'Biloko mosusu',sw:'Bidhaa nyingine'}}],currencies:['CDF','USD']});
  if(path.endsWith('/WNZ_fixture'))return reply(shop);
  if(path.endsWith('/products'))return reply({products:[product],total:1});
  if(path.endsWith('/WNP_fixture'))return reply(product);
  if(path.endsWith('/plan'))return reply({plan:'pro',source:'personal_pilot',active_products:1,active_product_limit:1000});
  if(path.endsWith('/today'))return reply({date:'2026-10-21',timezone:'Africa/Kinshasa',followers:24,new_followers:2,orders_today:4,reviews:{count:8,average:4.8},financial_access:true,currency_summaries:[{currency:'CDF',revenue:'45000',quantity:3,known_profit:'15000',profit_complete:true,expenses:'2000'}],sold_items:[{product_ref:product.public_ref,variant_ref:null,label:product.name,currency:'CDF',quantity:3,revenue:'45000',image_url:null}]});
  if(path.endsWith('/catalog-imports/options'))return reply({stores:[shop],categories:[],currencies:['CDF','USD'],issues:{}});
  if(path.endsWith('/orders'))return reply({orders:[],counts:{action_required:2,in_progress:3},stores:[shop],total:0});
  if(path.endsWith('/inventory/summary'))return reply({low_stock_items:1,untracked_items:0});
  if(path.endsWith('/inventory/stock'))return reply({items:[stock]});
  if(path.includes('/by-code/'))return reply({detail:'not found'},404);
  if(path.endsWith('/movements'))return reply({movements:[]});
  if(path.endsWith('/reservations'))return reply({reservations:[]});
  if(path.endsWith('/pos/catalog'))return reply({items:[{...product,product_ref:product.public_ref,variant_ref:null,barcode:product.public_ref,variant:null,available:7,image_url:null}],total:1});
  if(path.endsWith('/checkout')){writes++;return reply(receipt);}
  if(path.endsWith('/WRC_fixture'))return reply(receipt);
  if(path.endsWith('/pdf'))return route.fulfill({body:'%PDF-1.4\nfixture',contentType:'application/pdf',headers:{'Content-Disposition':'attachment; filename="receipt.pdf"'}});
  if(path.endsWith('/private-cost/history'))return reply({history:[]});
  if(path.endsWith('/private-cost'))return reply({revision:1,unit_cost:'5000',currency:'CDF'});
  if(path.endsWith('/expenses'))return reply({expenses:[]});
  return reply({});
 });

 void writes;
}

async function restaurantFixture(page:import('@playwright/test').Page){const count=1,advanced=true,revision='2026-11-01T08:00:00Z';
 const state={logout:false,station:'kitchen',routingWrites:0};
 const establishments=Array.from({length:count},(_,i)=>({public_ref:`RST_${i}`,revision,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links','unpublish'],profile:{name:i===0?'Chez maman — Restaurant & Malewa de la commune de Limete':`Restaurant ${i+1}`,food_business_type:'malewa',city:'Kinshasa',commune:'Limete',timezone_name:'Africa/Kinshasa',establishment_photo_url:null}}));
 await page.route('**/api/**',route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(p.endsWith('/employment/logout')){state.logout=true;return route.fulfill({json:{}});}
  if(p.endsWith('/employment/session'))return route.fulfill({status:state.logout?401:200,json:{user:{display_name:'Review Account'},binding:'a'.repeat(64)}});
  if(p.endsWith('/capabilities'))return route.fulfill({json:{capabilities:(advanced?['restaurant.kitchen','restaurant.inventory','restaurant.pos']:[]).map(capability=>({capability,available:true}))}});
  if(p.endsWith('/order-feed'))return route.fulfill({json:{changed:[],removed:[],cursor:'cursor',as_of:revision}});
  if(p.endsWith('/order-configuration'))return route.fulfill({json:{intake_released:true}});
  if(p.endsWith('/service/groups')||p.endsWith('/reservations/pending')||p.endsWith('/reservations/calendar')||p.endsWith('/inventory'))return route.fulfill({json:{items:[],total:0,has_more:false}});
  if(p.includes('/service/daily/days/')&&p.endsWith('/preview'))return route.fulfill({json:{bill_summary:{CDF:{recorded_collections:'42000',order_value:'50000'},USD:{recorded_collections:'12',order_value:'12'}},outstanding:{CDF:{balance_due:'8000'},USD:{balance_due:'0'}}}});
  if(p.endsWith('/orders'))return route.fulfill({json:{items:[],total:0,as_of:revision}});
  if(p.endsWith('/menu/items'))return route.fulfill({json:{revision,currency:'CDF',result:{items:[{public_ref:'RMI_1',name:'Pondu, poisson et accompagnement au choix',image_url:null,pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000',sale_unit_label:'assiette',availability:'available'}],total:1,page:1,page_size:20}}});
  if(p.endsWith('/menu/categories'))return route.fulfill({json:{revision,currency:'CDF',result:{items:[{public_ref:'RMC_1',name:'Plats',visible:true}],total:1,page:1,page_size:50}}});
  if(p.endsWith('/menu/offerings'))return route.fulfill({json:{revision,currency:'CDF',result:{items:[],total:0,page:1,page_size:50}}});
  if(p.endsWith('/inventory/bindings'))return route.fulfill({json:{bindings:[]}});
  if(p.endsWith('/restaurant-menus/RST_0'))return route.fulfill({json:{items:[{public_ref:'RMI_1',availability:'available'}],total:1,page:1,page_size:20}});
  if(p.endsWith('/preparation-routing/RMI_1')&&route.request().method()==='PUT'){state.station=String(route.request().postDataJSON().station);state.routingWrites++;return route.fulfill({json:{station:state.station,revision}});}
  if(p.endsWith('/preparation-routing'))return route.fulfill({json:{items:[{item_ref:'RMI_1',name:'Pondu, poisson et accompagnement au choix',station:state.station}],has_more:false,revision}});
  if(p.endsWith('/menu/items/RMI_1'))return route.fulfill({json:{revision,currency:'CDF',result:{public_ref:'RMI_1',name:'Pondu',image_url:null,category:{public_ref:'RMC_1',name:'Plats',visible:true},pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000',sale_unit_label:'assiette',availability:'available',presentation:'fixed_dish'}}});
  if(p.endsWith('/restaurants'))return route.fulfill({json:{items:establishments,total:count,page:1,page_size:20,actions:['create']}});
  const selected=establishments.find(row=>p.endsWith('/'+row.public_ref));
  return route.fulfill({status:selected?200:404,json:selected??{}});
 });return state;
}