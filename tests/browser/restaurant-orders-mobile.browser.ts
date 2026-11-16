import {test,expect,type Page} from '@playwright/test';
const revision='2026-11-14T08:00:00Z';
async function fixture(page:Page,ordersMode=false){
 const state={moneyFailure:0,readyFailure:false,writes:0,feedFailure:false,stamp:revision,delay:0,empty:false};
 const orders=Array.from({length:25},(_,i)=>({order_ref:`ROD_${1042-i}`,state:i===24?'completed':i===0?'accepted':i%2?'preparing':'ready',entry_source:i%2?'counter':'customer',channel:i%2?'counter':'web',revision:1,submitted_at:revision,fulfillment_method:i%2?'on_premise':'pickup',order_total:'15000.00',currency:'CDF',receipt_terms:{standalone:[{key:'one',name:'Poulet braisé avec accompagnement',quantity:1,subtotal:'15000.00'}],plates:[],food_subtotal:'15000.00',order_total:'15000.00',currency:'CDF'},pickup_verification:{required:true,method:'pending',locked:false}}));
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:3000'?route.continue():route.abort());
 const restaurant={public_ref:'RST_test',revision,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links','unpublish'],profile:{name:'Malewa Nzambe — cuisine de Lemba et spécialités familiales',food_business_type:'malewa',city:'Kinshasa',commune:'Lemba',timezone_name:'Africa/Kinshasa',service_modes:'eat_there,takeaway',establishment_photo_url:null}};
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');
  if(path.endsWith('/employment/session'))return route.fulfill({json:{user:{display_name:'Restaurant fixture'},binding:'a'.repeat(64)}});
  if(path.endsWith('/capabilities'))return route.fulfill({json:{capabilities:['restaurant.kitchen','restaurant.inventory','restaurant.pos','restaurant.reservations'].map(capability=>({capability,available:true}))}});
  if(path.endsWith('/restaurants'))return route.fulfill({json:{items:[restaurant],total:1,page:1,page_size:20,actions:['create']}});
  if(path.endsWith('/RST_test'))return route.fulfill({json:restaurant});
  if(path.endsWith('/order-configuration'))return route.fulfill({json:{intake_released:true}});
  if(path.endsWith('/daily/summary'))return route.fulfill({status:state.moneyFailure||200,json:state.moneyFailure?{}:{time_zone:'Africa/Kinshasa',as_of:revision,currencies:{CDF:{recorded_net:'185000.00',balance_due:'30000.00'},USD:{recorded_net:'25.00',balance_due:'0.00'}}}});
  if(ordersMode&&path.endsWith('/order-feed'))return new Promise(resolve=>setTimeout(resolve,state.delay)).then(()=>route.fulfill({status:state.feedFailure?503:200,json:{changed:[],removed:[],cursor:'cursor',as_of:state.stamp}}));
  if(ordersMode&&path.includes('/orders/')){const ref=path.split('/orders/')[1].split('/')[0],order=orders.find(order=>order.order_ref===ref);if(order&&route.request().method()==='POST'){state.writes++;order.state=path.endsWith('/accept')?'accepted':'ready';order.revision++;return route.fulfill({json:{current_order:order}});}return route.fulfill({status:order?200:404,json:order??{}});}
  if(ordersMode&&path.endsWith('/orders')){const states=url.searchParams.getAll('states'),search=url.searchParams.get('search'),origin=url.searchParams.get('origin'),fulfillment=url.searchParams.get('fulfillment');const rows=(state.empty?[]:orders).filter(order=>(!states.length||states.includes(order.state))&&(!search||order.order_ref.includes(search))&&(!origin||order.entry_source===(origin==='online'?'customer':origin))&&(!fulfillment||order.fulfillment_method===(fulfillment==='takeaway'?'pickup':'on_premise')));const pageNo=Number(url.searchParams.get('page')??1),size=Number(url.searchParams.get('page_size')??20);return route.fulfill({json:{items:rows.slice((pageNo-1)*size,pageNo*size),total:rows.length,as_of:revision}});}
  if(path.endsWith('/orders')){const statuses=url.searchParams.getAll('states'),status=statuses[0];if(status==='ready'&&state.readyFailure)return route.fulfill({status:503,json:{}});return route.fulfill({json:{items:status==='pending'||status==='ready'?[{order_ref:status==='pending'?'ROD_1042':'ROD_1038',state:status,submitted_at:revision,fulfillment_method:status==='pending'?'takeaway':'delivery'}]:[],total:status==='pending'?3:status==='ready'?2:4,as_of:revision}});}
  if(path.endsWith('/inventory'))return route.fulfill({json:{items:[{item_ref:'INV_1',name:'Poulet braisé',low_stock:true},{item_ref:'INV_2',name:'Boissons fraîches',low_stock:true}],total:2}});
  if(path.endsWith('/reservations/pending'))return route.fulfill({json:{items:[{reservation_ref:'RSR_1',state:'pending',starts_at:revision,party_size:4}],has_more:true}});
  if(path.endsWith('/reservations/calendar')||path.endsWith('/service/groups'))return route.fulfill({json:{items:[],has_more:false}});
  return route.fulfill({status:404,json:{}});
 });return Object.assign(state,{orders});
}

test('same-viewport evidence',async({page})=>{
 await fixture(page,true);await page.setViewportSize({width:390,height:844});await page.goto('/fr/shida/seller/restaurants/?establishment=RST_test&tab=orders');
 await expect(page.locator('.rst-orders-row')).toHaveCount(20);await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 await page.screenshot({path:`C:/NIHILOBA/release-evidence/restaurant-orders-mobile-20261116/${process.env.RESTAURANT_BEFORE?'before':'after'}-390.png`,fullPage:false});

});

const url='/fr/shida/seller/restaurants/?establishment=RST_test&tab=orders';
for(const width of [320,375,390,430,820,1440])test(`layout and touch navigation ${width}`,async({page})=>{
 const state=await fixture(page,true);await page.setViewportSize({width,height:844});await page.goto(url);
 const rows=page.locator('.rst-orders-row');await expect(rows).toHaveCount(20);
 if([820,1440].includes(width)){await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await page.screenshot({path:`C:/NIHILOBA/release-evidence/restaurant-orders-mobile-20261116/after-${width}.png`});}
 await expect(rows.first()).toContainText('Acceptée');await expect(rows.first()).toContainText('ROD_1042');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await rows.first().focus();expect(await rows.first().evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
 if(width===390){const headingSize=await page.locator('.rst-orders-heading h2').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));expect(headingSize).toBeGreaterThanOrEqual(26);expect(headingSize).toBeLessThanOrEqual(28);expect(await page.getByRole('searchbox').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBe(16);const first=(await rows.first().boundingBox())!,next=(await rows.nth(1).boundingBox())!;expect(first.y+first.height).toBeLessThan(760);expect(next.y).toBeLessThan(760);}
 await rows.nth(10).scrollIntoViewIfNeeded();const position=await page.evaluate(()=>scrollY);
 await rows.nth(10).tap();await expect(page.locator('.rst-order-detail')).toContainText('Poulet braisé');await expect(page).toHaveURL(/order=ROD_1032/);
 await page.goBack();await expect(page.locator('.rst-order-detail')).toHaveCount(0);await expect(rows).toHaveCount(20);expect(Math.abs(await page.evaluate(()=>scrollY)-position)).toBeLessThan(5);
 await page.goForward();await expect(page.locator('.rst-order-detail')).toContainText('Poulet braisé');
 await page.getByRole('button',{name:'Retour aux commandes',exact:true}).click();await expect(page.locator('.rst-order-detail')).toHaveCount(0);
 await rows.last().scrollIntoViewIfNeeded();if(width<1024){const nav=(await page.locator('.management-mobile-nav').boundingBox())!,last=(await rows.last().boundingBox())!;expect(last.y+last.height).toBeLessThanOrEqual(nav.y);}
 expect(state.writes).toBe(0);
});
test('filters, search, counts, reload, deep links and return',async({page})=>{
 await fixture(page,true);await page.setViewportSize({width:390,height:844});await page.goto(url);
 const screen=page.locator('.rst-orders-screen'),rows=screen.locator('.rst-orders-row');await expect(rows).toHaveCount(20);
 await screen.getByRole('button',{name:/^Filtres/}).click();await screen.getByRole('combobox',{name:'Toutes les origines',exact:true}).selectOption('counter');
 await expect(rows).toHaveCount(12);await expect(screen.locator('.rst-orders-tabs button').first()).toContainText('12');
 await screen.getByRole('searchbox').fill('ROD_1041');await screen.getByRole('searchbox').press('Enter');await expect(rows).toHaveCount(1);
 await page.reload();await expect(rows).toHaveCount(1);await expect(screen.getByRole('searchbox')).toHaveValue('ROD_1041');
 await rows.first().tap();await expect(page.locator('.rst-order-detail')).toContainText('Poulet braisé');const direct=page.url();await page.reload();await expect(page.locator('.rst-order-detail')).toContainText('Poulet braisé');
 await page.getByRole('button',{name:'Retour aux commandes',exact:true}).click();await expect(rows).toHaveCount(1);await expect(screen.getByRole('searchbox')).toHaveValue('ROD_1041');
 await screen.getByRole('button',{name:/^Filtres/}).click();await screen.getByRole('button',{name:'Effacer les filtres',exact:true}).click();await expect(rows).toHaveCount(20);
 await screen.getByRole('button',{name:'Historique',exact:true}).click();await expect(rows).toHaveCount(1);await expect(rows.first()).toContainText('ROD_1018');
 await screen.getByRole('searchbox').fill('MISSING');await screen.getByRole('searchbox').press('Enter');await expect(screen.getByText('Aucune commande ne correspond à vos filtres.')).toBeVisible();
 await screen.locator('.rst-orders-empty').getByRole('button',{name:'Effacer les filtres'}).click();await expect(rows).toHaveCount(1);
 await page.goto(direct);await expect(page.locator('.rst-order-detail')).toContainText('Poulet braisé');
});
test('successful refresh time, loading, failure retry and truthful empty states',async({page})=>{
 const state=await fixture(page,true);await page.goto(url);const screen=page.locator('.rst-orders-screen'),refresh=screen.getByRole('button',{name:'Actualiser les commandes',exact:true});
 await expect(screen.locator('.rst-orders-tools')).toContainText('Actualisé à 09:00');state.stamp='2026-11-14T10:34:00Z';state.delay=300;
 await refresh.click();await expect(refresh).toBeDisabled();await expect(refresh).toHaveAttribute('aria-busy','true');await expect(screen.locator('.rst-orders-row')).toHaveCount(20);
 await expect(screen.locator('.rst-orders-tools')).toContainText('Actualisé à 11:34');await expect(refresh).toBeEnabled();
 state.feedFailure=true;await refresh.click();await expect(screen.locator('.rst-orders-tools').getByRole('button',{name:'Réessayer',exact:true})).toBeVisible();await expect(screen.locator('.rst-orders-tools')).toContainText('Actualisé à 11:34');await expect(screen.locator('.rst-orders-row')).toHaveCount(20);
 state.feedFailure=false;state.empty=true;await screen.locator('.rst-orders-tools').getByRole('button',{name:'Réessayer',exact:true}).click();await expect(screen.getByText('Aucune commande à traiter pour le moment.')).toBeVisible();await expect(screen.getByRole('button',{name:'Effacer les filtres'})).toHaveCount(0);
});
test('initial error never becomes empty',async({page})=>{
 const state=await fixture(page,true);state.feedFailure=true;await page.goto(url);await expect(page.locator('.rst-orders-tools').getByRole('button',{name:'Réessayer',exact:true})).toBeVisible();await expect(page.locator('.rst-orders-empty')).toHaveCount(0);await expect(page.getByText('Actualisé à',{exact:false})).toHaveCount(0);
});
test('screen awake options unsupported and keyboard closing',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'wakeLock',{value:undefined,configurable:true}));await fixture(page,true);await page.goto(url);
 const options=page.locator('.rst-orders-options');await options.getByLabel('Options de la page').click();await expect(options.getByRole('checkbox')).toBeDisabled();await expect(options).toContainText('Ce navigateur ne permet pas');await page.keyboard.press('Escape');await expect(options).not.toHaveAttribute('open','');await expect(options.locator('summary')).toBeFocused();
});
test('screen awake acquire and release',async({page})=>{
 await page.addInitScript(()=>{const calls={acquired:0,released:0};Object.assign(window,{wakeCalls:calls});Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{request:async()=>{calls.acquired++;return {released:false,release:async()=>{calls.released++;},addEventListener:()=>{}};}}});});
 await fixture(page,true);await page.goto(url);const options=page.locator('.rst-orders-options');await options.locator('summary').click();await options.getByRole('checkbox').check();await expect.poll(()=>page.evaluate(()=>(window as unknown as {wakeCalls:{acquired:number}}).wakeCalls.acquired)).toBe(1);await options.getByRole('checkbox').uncheck();await expect.poll(()=>page.evaluate(()=>(window as unknown as {wakeCalls:{released:number}}).wakeCalls.released)).toBe(1);
});
for(const locale of ['fr','en','ln','sw'])test(`long content and enlarged text ${locale}`,async({page})=>{
 const state=await fixture(page,true);state.orders[0].order_ref='ROD_'+ 'LONGREFERENCE'.repeat(4);state.orders[0].state='out_for_delivery';state.orders[0].order_total='999999999999.99';state.orders[0].currency='USD';
 await page.setViewportSize({width:320,height:844});await page.goto(`${locale==='en'?'':'/'+locale}/shida/seller/restaurants/?establishment=RST_test&tab=orders`);await expect(page.locator('.rst-orders-row')).toHaveCount(20);
 await page.addStyleTag({content:'html{font-size:200%!important}'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const row=page.locator('.rst-orders-row').first();await expect(row).toContainText(state.orders[0].order_ref);const reference=(await row.locator('strong').first().boundingBox())!,status=(await row.locator('.rst-orders-state').boundingBox())!;expect(reference.x+reference.width).toBeLessThanOrEqual(status.x+1);
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});if(locale==='fr')await page.screenshot({path:'C:/NIHILOBA/release-evidence/restaurant-orders-mobile-20261116/enlarged-320.png'});
});
