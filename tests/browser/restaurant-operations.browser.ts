import {test,expect,type Page} from '@playwright/test';
import {workText} from '../../app/lib/restaurant-work-copy';
import {operationsCopy} from '../../app/lib/restaurant-operations-copy';
const revision='2026-11-14T08:00:00Z';
async function fixture(page:Page,ordersMode=false){
 const state={moneyFailure:0,readyFailure:false,writes:0};
 const orders=Array.from({length:25},(_,i)=>({order_ref:`ROD_${1042-i}`,state:i===24?'completed':i===0?'pending':i%2?'preparing':'ready',entry_source:i%2?'counter':'customer',channel:i%2?'counter':'web',revision:1,submitted_at:revision,fulfillment_method:i%2?'on_premise':'pickup',order_total:'15000.00',currency:'CDF',receipt_terms:{standalone:[{key:'one',name:'Poulet braisé avec accompagnement',quantity:1,subtotal:'15000.00'}],plates:[],food_subtotal:'15000.00',order_total:'15000.00',currency:'CDF'},pickup_verification:{required:true,method:'pending',locked:false}}));
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:3013'?route.continue():route.abort());
 const restaurant={public_ref:'RST_test',revision,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links','unpublish'],profile:{name:'Malewa Nzambe — cuisine de Lemba et spécialités familiales',food_business_type:'malewa',city:'Kinshasa',commune:'Lemba',timezone_name:'Africa/Kinshasa',service_modes:'eat_there,takeaway',establishment_photo_url:null}};
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');
  if(path.endsWith('/employment/session'))return route.fulfill({json:{user:{display_name:'Restaurant fixture'},binding:'a'.repeat(64)}});
  if(path.endsWith('/capabilities'))return route.fulfill({json:{capabilities:['restaurant.kitchen','restaurant.inventory','restaurant.pos','restaurant.reservations'].map(capability=>({capability,available:true}))}});
  if(path.endsWith('/restaurants'))return route.fulfill({json:{items:[restaurant],total:1,page:1,page_size:20,actions:['create']}});
  if(path.endsWith('/RST_test'))return route.fulfill({json:restaurant});
  if(path.endsWith('/order-configuration'))return route.fulfill({json:{intake_released:true}});
  if(path.endsWith('/daily/summary'))return route.fulfill({status:state.moneyFailure||200,json:state.moneyFailure?{}:{time_zone:'Africa/Kinshasa',as_of:revision,currencies:{CDF:{recorded_net:'185000.00',balance_due:'30000.00'},USD:{recorded_net:'25.00',balance_due:'0.00'}}}});
  if(ordersMode&&path.endsWith('/order-feed'))return route.fulfill({json:{changed:[],removed:[],cursor:'cursor',as_of:revision}});
  if(ordersMode&&path.includes('/orders/')){const ref=path.split('/orders/')[1].split('/')[0],order=orders.find(order=>order.order_ref===ref);if(order&&route.request().method()==='POST'){state.writes++;order.state=path.endsWith('/accept')?'accepted':'ready';order.revision++;return route.fulfill({json:{current_order:order}});}return route.fulfill({status:order?200:404,json:order??{}});}
  if(ordersMode&&path.endsWith('/orders')){const states=url.searchParams.getAll('states'),search=url.searchParams.get('search'),origin=url.searchParams.get('origin'),fulfillment=url.searchParams.get('fulfillment');const rows=orders.filter(order=>(!states.length||states.includes(order.state))&&(!search||order.order_ref.includes(search))&&(!origin||order.entry_source===(origin==='online'?'customer':origin))&&(!fulfillment||order.fulfillment_method===(fulfillment==='takeaway'?'pickup':'on_premise')));const pageNo=Number(url.searchParams.get('page')??1),size=Number(url.searchParams.get('page_size')??20);return route.fulfill({json:{items:rows.slice((pageNo-1)*size,pageNo*size),total:rows.length,as_of:revision}});}
  if(path.endsWith('/orders')){const statuses=url.searchParams.getAll('states'),status=statuses[0];if(status==='ready'&&state.readyFailure)return route.fulfill({status:503,json:{}});return route.fulfill({json:{items:status==='pending'||status==='ready'?[{order_ref:status==='pending'?'ROD_1042':'ROD_1038',state:status,submitted_at:revision,fulfillment_method:status==='pending'?'takeaway':'delivery'}]:[],total:status==='pending'?3:status==='ready'?2:4,as_of:revision}});}
  if(path.endsWith('/inventory'))return route.fulfill({json:{items:[{item_ref:'INV_1',name:'Poulet braisé',low_stock:true},{item_ref:'INV_2',name:'Boissons fraîches',low_stock:true}],total:2}});
  if(path.endsWith('/reservations/pending'))return route.fulfill({json:{items:[{reservation_ref:'RSR_1',state:'pending',starts_at:revision,party_size:4}],has_more:true}});
  if(path.endsWith('/reservations/calendar')||path.endsWith('/service/groups'))return route.fulfill({json:{items:[],has_more:false}});
  return route.fulfill({status:404,json:{}});
 });return state;
}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,390,820,1440])test(`today ${locale} ${width}`,async({page})=>{
 await fixture(page);await page.setViewportSize({width,height:950});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/`);
 const c=operationsCopy[locale],today=page.locator('.rst-operations');await expect(today).toBeVisible();await expect(today.getByText('185 000',{exact:true}).or(today.getByText('185,000',{exact:true}))).toBeVisible();
 await expect(today.locator('.rst-ops-work')).toHaveCount(3);await expect(today.locator('.rst-ops-metrics article')).toHaveCount(5);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr'&&[375,1440].includes(width))await page.screenshot({path:`C:/NIHILOBA/release-evidence/restaurants-management-20261114/today-${width}.png`,fullPage:true});
 await page.evaluate(()=>{HTMLElement.prototype.requestFullscreen=()=>Promise.reject(new Error('test rejection'));});
 if(width<600)await page.locator('.rst-focus-toolbar summary').click();await page.locator('.rst-focus-toolbar').getByRole('button',{name:c.fullscreen,exact:true}).filter({visible:true}).click();
 await expect(page.locator('.rst-focus-mode')).toBeVisible();await expect(page.getByText(c.expanded,{exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.rst-focus-mode')).toHaveCount(0);
});
test('partial errors preserve other sections; financial access loss clears prior totals',async({page})=>{
 const state=await fixture(page);await page.goto('/fr/shida/seller/restaurants/');const today=page.locator('.rst-operations');await expect(today.getByText('185 000',{exact:true})).toBeVisible();
 state.moneyFailure=503;state.readyFailure=true;await today.getByRole('button',{name:'Actualiser',exact:true}).click();await expect(today.getByText('Ces données ne sont plus à jour.',{exact:false}).first()).toBeVisible();await expect(today.locator('.rst-ops-work')).toHaveCount(3);
 state.moneyFailure=403;await today.locator('.rst-ops-money').getByRole('button',{name:'Réessayer'}).click();await expect(today.getByText('185 000',{exact:true})).toHaveCount(0);await expect(today.getByText('Vous n’avez pas accès à ces données.',{exact:false})).toBeVisible();
 state.moneyFailure=0;await today.locator('.rst-ops-money').getByRole('button',{name:'Réessayer'}).click();await expect(today.getByText('185 000',{exact:true})).toBeVisible();
});

for(const width of [320,375,390,820,1440])test(`orders list and detail ${width}`,async({page})=>{
 const state=await fixture(page,true);await page.setViewportSize({width,height:950});await page.goto('/fr/shida/seller/restaurants/');await expect(page.locator('.rst-operations')).toBeVisible();await page.locator('.rst-ops-panel').first().getByRole('button',{name:'Tout voir'}).click();
 const screen=page.locator('.rst-orders-redesign');await expect(screen.locator('.rst-orders-row')).toHaveCount(20);await expect(screen.locator('.rst-orders-tabs button').first()).toContainText('24');
 await screen.getByRole('button',{name:'Suivant',exact:true}).click();await expect(screen.locator('.rst-orders-row')).toHaveCount(4);await screen.getByRole('button',{name:'Précédent',exact:true}).click();await expect(screen.locator('.rst-orders-row')).toHaveCount(20);
 await screen.locator('[data-order-ref="ROD_1042"]').click();await expect(screen.locator('.rst-order-detail')).toBeVisible();await expect(screen.getByText('Poulet braisé avec accompagnement',{exact:false})).toBeVisible();
 if(width===1440)await expect(screen.locator('.rst-orders-list')).toBeVisible();else await expect(screen.locator('.rst-orders-list')).toBeHidden();
 if([375,1440].includes(width))await page.screenshot({path:`C:/NIHILOBA/release-evidence/restaurants-management-20261114/orders-detail-${width}.png`,fullPage:true});
 await screen.locator('.rst-order-detail').getByRole('button',{name:workText('fr','accept'),exact:true}).click();await screen.locator('.rst-confirm').getByRole('button',{name:workText('fr','confirm'),exact:true}).dblclick();await expect.poll(()=>state.writes).toBe(1);
 await screen.getByRole('button',{name:'Retour aux commandes',exact:true}).click();await expect(screen.locator('.rst-orders-row')).toHaveCount(20);
 if(width<700)await screen.getByRole('button',{name:'Filtres',exact:true}).click();await screen.getByRole('combobox',{name:'Toutes les origines',exact:true}).selectOption('online');await screen.getByRole('combobox',{name:'Origine / Remise',exact:true}).selectOption('takeaway');await expect(screen.locator('.rst-orders-row')).toHaveCount(12);await expect(screen.locator('.rst-orders-tabs button').first()).toContainText('12');
 await screen.getByRole('button',{name:'Historique',exact:true}).click();await expect(screen.locator('.rst-orders-row')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
