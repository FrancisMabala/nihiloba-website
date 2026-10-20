import {sellerText} from '../../app/lib/wenze-seller-copy';
import {wenzeCopy} from '../../app/lib/wenze-copy';
import {wenzeDesignText} from '../../app/lib/wenze-design-copy';
import {test,expect,type Page} from '@playwright/test';
const store={public_ref:'WNS_fixture',name:'Boutique du Fleuve',city:'Kinshasa',category:'other',description:'Synthetic local fixture',revision:1,status:'active',visible:'true',catalog_ready:true,order_ready:true};
const product={public_ref:'WNP_fixture',name:'Sac en raphia',revision:1,status:'active',visible:'true',price:'15000',currency:'CDF',category:'other',condition:'new',available_stock:12,committed_quantity:2,photos:[],variants:[]};
async function fixture(page:Page,plan='pro'){
 const state={session:true,fail:false,writes:[] as {path:string;body:Record<string,unknown>;key:string}[]};
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');if(url.origin!=='http://127.0.0.1:3024')return route.abort();if(!path.startsWith('/api/'))return route.continue();
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return state.session?reply({binding:'a'.repeat(64),user:{display_name:'Synthetic seller'}}):reply({},401);
  if(path.endsWith('/employment/logout')){state.session=false;return reply({});}
  if(!path.startsWith('/api/shida/personal/wenze'))return reply({},404);
  expect(req.headers()['x-shida-session']).toBe('a'.repeat(64));
  if(req.method()!=='GET'){state.writes.push({path,body:req.postDataJSON(),key:req.headers()['idempotency-key']});if(state.fail){state.fail=false;return route.abort();}if(path.endsWith('/counts'))return reply({count_ref:'ISC_fixture',revision:1,status:'draft',lines:[]});if(path.endsWith('/private-cost'))return reply({unit_cost:'5000',currency:'CDF',revision:2});return reply({...store,...req.postDataJSON()});}
  if(path.endsWith('/stores'))return reply({stores:[store],categories:[{code:'other',labels:{en:'Other',fr:'Autre',ln:'Mosusu',sw:'Nyingine'}}],currencies:['CDF','USD']});
  if(path.endsWith('/WNS_fixture'))return reply(store);
  if(path.endsWith('/products'))return reply({products:[product],total:1});if(path.endsWith('/WNP_fixture'))return reply(product);
  if(path.endsWith('/plan'))return reply({plan,active_products:1,active_product_limit:1000,free_import_used:0,free_import_allowance:1,source:plan==='pro'?'personal_pilot':'free'});
  if(path.endsWith('/inventory/stock'))return reply({items:[{item_ref:'INV_fixture',catalog_label:product.name,label:product.name,on_hand:14,reserved:2,available:12,revision:2,unit:'piece',low_stock_threshold:3}],next_cursor:null});
  if(path.endsWith('/counts/ISC_fixture'))return reply({count_ref:'ISC_fixture',revision:1,status:'draft',lines:[]});
  if(path.endsWith('/inventory/summary'))return reply({tracked_items:1,low_stock_items:0});
  if(path.endsWith('/private-cost'))return reply({unit_cost:'4000',currency:'CDF',revision:1});if(path.endsWith('/private-cost/history'))return reply({history:[]});
  if(path.endsWith('/expenses'))return reply({expenses:[],next_cursor:null});if(path.endsWith('/priced')||path.endsWith('/manual-sales'))return reply({sales:[],next_cursor:null});
  if(path.endsWith('/report-schedules'))return reply({schedules:[]});
  if(path.endsWith('/catalog-imports/options'))return reply({stores:[store],categories:[],currencies:['CDF','USD'],issues:{}});
  if(path.endsWith('/catalog-imports'))return reply({jobs:[],total:0});if(path.endsWith('/orders'))return reply({orders:[],counts:{action_required:3,in_progress:2},total:0});
  if(path.endsWith('/today'))return reply({date:'2026-10-17',timezone:'Africa/Kinshasa',followers:12,new_followers:2,orders_today:3,reviews:{count:0,average:null},financial_access:plan==='pro',currency_summaries:plan==='pro'?[{currency:'CDF',revenue:'150000',quantity:10,known_profit:'70000',expenses:'10000',profit_complete:false}]:null,sold_items:[]});
  if(path.endsWith('/pro/dashboard'))return reply({currency_summaries:[{currency:'CDF',combined_sales:{total_revenue:'150000',known_gross_profit:'70000',sales_missing_cost:1,quantity_sold:10},recorded_operating_expenses:{total:'10000'},operational_result:'60000',completeness:{profit_complete:false}}],top_items:{top_by_quantity:[]},low_stock:{items:[]}});
  return reply({});
 });return state;
}
const nav=async(page:Page,name:string)=>{const button=page.locator('.rst-management-nav').getByRole('button',{name,exact:true});await page.locator('.rst-management-sidebar').waitFor({state:'attached'});if(!await button.isVisible())await page.locator('.wz-navigation-toggle').click();await button.click();};
async function openStore(page:Page){await page.goto('/shida/seller/wenze');await nav(page,'Shops & products');}
test('Personal catalog, Inventory and Pro reports are connected and responsive',async({page})=>{
 await fixture(page);await openStore(page);await expect(page.getByText('Sac en raphia',{exact:true})).toBeVisible();
 await nav(page,'Inventory');await expect(page.locator('.wz-stock-card').filter({hasText:'Sac en raphia'})).toBeVisible();
 await nav(page,'Reports');await expect(page.getByRole('article').filter({has:page.getByRole('heading',{name:'CDF',exact:true})}).getByText('150,000',{exact:true})).toBeVisible();
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:test.info().outputPath('wenze-desktop.png'),fullPage:true});
 await page.setViewportSize({width:360,height:800});await page.screenshot({path:test.info().outputPath('wenze-mobile.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await nav(page,'Orders');await expect(page.locator('.wz-r6')).toBeVisible();await nav(page,'Add products from a file');await expect(page.getByRole('button',{name:/template/i})).toBeVisible();
});
test('Free sellers retain catalog and stock while Pro tools are gated',async({page})=>{await fixture(page,'free');await openStore(page);await nav(page,'Expenses');await expect(page.getByText('This tool requires Wenze Pro for this shop.')).toBeVisible();await expect(page.getByLabel('Amount',{exact:true})).toHaveCount(0);await nav(page,'In-store sales');await page.locator('.wz-legacy-sales > summary').click();await expect(page.getByText('Record stock-only sale',{exact:true})).toBeVisible();await expect(page.getByText('Record sale with price · Pro',{exact:true})).toHaveCount(0);});
test('uncertain expense retries the original payload with the original key',async({page})=>{const state=await fixture(page);await openStore(page);await nav(page,'Expenses');await page.getByLabel('Amount',{exact:true}).fill('1000');await page.getByLabel('Private note',{exact:true}).fill('Fixture');state.fail=true;await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByText(/result is not confirmed/)).toBeVisible();await page.getByRole('button',{name:'Retry the same action',exact:true}).click();await expect.poll(()=>state.writes.length).toBe(2);expect(state.writes[0]).toEqual(state.writes[1]);await expect(page.getByText('Saved',{exact:true})).toBeVisible();});
test('session expiry clears private content immediately',async({page})=>{const state=await fixture(page);await openStore(page);state.session=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.getByRole('heading',{name:'Your boutique, your space.',exact:true})).toBeVisible();await expect(page.getByText('Sac en raphia',{exact:true})).toHaveCount(0);});
for(const locale of ['fr','ln','sw'] as const)test(`localized seller route ${locale}`,async({page})=>{await fixture(page);await page.setViewportSize({width:360,height:800});await page.goto(`/${locale}/shida/seller/wenze`);await expect(page.getByRole('heading',{name:sellerText(locale,'today'),exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);});
test('stock thresholds preserve revisions and stock-only sales use the exact Inventory item',async({page})=>{const state=await fixture(page,'free');await openStore(page);await nav(page,'Inventory');await page.locator('.wz-stock-card').click();await page.getByRole('combobox',{name:'Choose a stock item',exact:true}).first().selectOption('INV_fixture');await page.getByLabel('Low stock threshold',{exact:true}).fill('5');await page.getByRole('button',{name:'Save',exact:true}).click();await expect.poll(()=>state.writes.length).toBe(1);expect(state.writes[0].body).toEqual({expected_revision:2,low_stock_threshold:5});await expect(page.getByText('Saved',{exact:true})).toBeVisible();await nav(page,'In-store sales');await page.locator('.wz-legacy-sales > summary').click();await page.getByRole('combobox',{name:'Choose a stock item',exact:true}).selectOption('INV_fixture');await page.getByLabel('Quantity',{exact:true}).fill('2');await page.getByRole('button',{name:'Record stock-only sale',exact:true}).click();await expect.poll(()=>state.writes.length).toBe(2);expect(state.writes[1].body.lines).toEqual([{item_ref:'INV_fixture',quantity:2,unit:'piece'}]);});
test('private cost edits and scheduled reports use the existing Pro contracts',async({page})=>{const state=await fixture(page);await openStore(page);await nav(page,'Purchase costs');await page.getByRole('combobox',{name:'Choose a product',exact:true}).selectOption('WNP_fixture');await page.getByRole('button',{name:'Manage',exact:true}).click();await page.getByLabel('Amount',{exact:true}).fill('5000');await page.getByRole('button',{name:'Save',exact:true}).click();await expect.poll(()=>state.writes.length).toBe(1);expect(state.writes[0].body).toEqual({expected_revision:1,amount:'5000',currency:'CDF'});await expect(page.getByText('Saved',{exact:true})).toBeVisible();await nav(page,'Scheduled reports');await page.getByRole('combobox',{name:'Scheduled reports',exact:true}).selectOption('monthly');await page.getByRole('button',{name:'Save',exact:true}).click();await expect.poll(()=>state.writes.length).toBe(2);expect(state.writes[1].path).toContain('/report-schedules/monthly');expect(state.writes[1].body).toEqual({enabled:true,formats:['pdf','xlsx'],language:'en'});});

test('an active stock count resumes after a refresh',async({page})=>{await fixture(page,'free');await openStore(page);await nav(page,'Inventory');await page.locator('.wz-stock-tools > summary').click();await page.getByRole('button',{name:'Start count',exact:true}).click();await expect(page).toHaveURL(/count=ISC_fixture/);await page.reload();await expect(page.getByRole('button',{name:'Confirm stock count',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Start count',exact:true})).toHaveCount(0);});

test('Today is the default with current work and unlocked pilot statistics',async({page})=>{await fixture(page);await page.goto('/shida/seller/wenze');await expect(page.getByRole('heading',{name:'Today',exact:true})).toBeVisible();await expect(page.getByText('undefined',{exact:true})).toHaveCount(0);await expect(page.getByText('Followers',{exact:true})).toBeVisible();await expect(page.getByText('150,000 CDF',{exact:true})).toBeVisible();await page.locator('.wz-daily-details summary').click();await expect(page.getByText('Some sales have no recorded cost. Profit figures are incomplete.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/Needs your attention/})).toContainText('3');await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:test.info().outputPath('wenze-today-desktop.png'),fullPage:true});await page.setViewportSize({width:360,height:800});await page.screenshot({path:test.info().outputPath('wenze-today-mobile.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.getByRole('button',{name:/Needs your attention/}).click();await expect(page.locator('.wz-r6')).toBeVisible();});
test('Free fallback shows operational work without pretending financial data is zero',async({page})=>{await fixture(page,'free');await page.goto('/shida/seller/wenze');await expect(page.getByRole('button',{name:/Needs your attention/})).toContainText('3');await expect(page.getByText(/Financial statistics require Pro/)).toBeVisible();await expect(page.getByText('150000',{exact:true})).toHaveCount(0);});
test('Today handles a partial failure without hiding the other summaries',async({page})=>{await fixture(page);await page.route('**/inventory/summary/',route=>route.fulfill({status:503,json:{}}));await page.goto('/shida/seller/wenze');await expect(page.getByText('Some information could not be loaded. Refresh to try again.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/Low-stock items/})).toContainText('—');await expect(page.getByText('150,000 CDF',{exact:true})).toBeVisible();});
test('an explicit product link opens the catalog instead of Today',async({page})=>{await fixture(page);await page.goto('/shida/seller/wenze?store=WNS_fixture&product=WNP_fixture');await expect(page.getByRole('heading',{name:'Sac en raphia',exact:true})).toBeVisible();});


test('shared Personal login without a Wenze shop opens setup, not seller tools',async({page})=>{
 await fixture(page);let created=false;
 await page.route('**/api/shida/personal/wenze/stores**',async route=>{const url=new URL(route.request().url());if(!/\/stores\/?$/.test(url.pathname))return route.fallback();if(route.request().method()==='POST'){created=true;expect(route.request().postDataJSON()).toMatchObject({name:'My Wenze shop',city:'Kinshasa'});return route.fulfill({json:store});}return route.fulfill({json:{stores:created?[store]:[],categories:[{code:'other',labels:{en:'Other',fr:'Autre',ln:'Mosusu',sw:'Nyingine'}}]}});});
 await page.goto('/shida/seller/wenze?view=reports');await expect(page.getByRole('heading',{name:'Start selling on Wenze'})).toBeVisible();await expect(page.locator('.rst-management-nav')).toHaveCount(0);await expect(page.getByText(/Your Restaurant or Services profile/)).toBeVisible();
 await page.getByRole('button',{name:'Create',exact:true}).click();await page.getByLabel('Name',{exact:true}).fill('My Wenze shop');await page.getByLabel('City',{exact:true}).fill('Kinshasa');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.rst-management-nav')).toBeVisible();
});

test('failed Wenze ownership discovery does not open setup or management',async({page})=>{
 await fixture(page);await page.route('**/api/shida/personal/wenze/stores**',route=>route.fulfill({status:503,json:{}}));await page.goto('/shida/seller/wenze');await expect(page.locator('.wz-seller-setup').getByRole('alert')).toContainText('could not verify');await expect(page.locator('.rst-management-nav')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Start selling on Wenze'})).toHaveCount(0);
 await page.unroute('**/api/shida/personal/wenze/stores**');await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('heading',{name:'Today',exact:true})).toBeVisible();
});

for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,1440])test(`shared Wenze design ${locale} ${width}`,async({page})=>{
 await fixture(page);await page.setViewportSize({width,height:900});await page.goto(`${locale==='en'?'':'/'+locale}/shida/seller/wenze`);
 const navigation=page.locator('.seller-navigation');await expect(navigation.getByRole('button',{name:sellerText(locale,'today'),exact:true})).toHaveAttribute('aria-current','page');
 if(width===360)expect(await page.locator('.seller-heading h1').evaluate(el=>el.getBoundingClientRect().right)).toBeLessThanOrEqual(360);
 await expect(navigation.locator('[aria-current=page]')).toHaveCSS('background-color','rgb(23, 62, 50)');
 await page.screenshot({path:test.info().outputPath(`wenze-today-${locale}-${width}.png`),fullPage:true});
 const expenses=navigation.getByRole('button',{name:sellerText(locale,'expenses'),exact:true});await expenses.focus();await page.keyboard.press('Enter');await expect(expenses).toHaveAttribute('aria-current','page');
 await expect(page.getByLabel(sellerText(locale,'amount'),{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:test.info().outputPath(`wenze-expenses-${locale}-${width}.png`),fullPage:true});
});

test('partial photo failure preserves accepted photos and retries only the failed file',async({page})=>{
 await fixture(page);
 const current={...product,photos:[] as {photo_ref:string;url:string}[]};
 let uploads=0,failSecond=true;
 const actions:{action:string;photo_ref?:string;expected_revision:number}[]=[];
 await page.route('**/api/shida/personal/wenze/stores/WNS_fixture/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');
  if(path.endsWith('/uploads')){
   uploads++;expect(req.postDataJSON().target_ref).toBe(product.public_ref);
   return route.fulfill({status:uploads===2&&failSecond?422:200,json:{upload_ref:`WCU_${uploads}`}});
  }
  if(path.endsWith('/photos')){
   const body=req.postDataJSON();actions.push(body);expect(body.expected_revision).toBe(current.revision);
   if(body.action==='add')current.photos.push({photo_ref:`WIM_${uploads}`,url:'/images/wenze-boutique-market.webp'});
   if(body.action==='remove')current.photos=current.photos.filter(p=>p.photo_ref!==body.photo_ref);
   current.revision++;return route.fulfill({json:current});
  }
  if(path.endsWith('/WNP_fixture'))return route.fulfill({json:current});
  return route.fallback();
 });
 await page.goto('/shida/seller/wenze?store=WNS_fixture&product=WNP_fixture');
 const upload=page.locator('input[type=file][multiple]');
 const png={name:'photo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0ZkAAAAASUVORK5CYII=','base64')};
 await upload.setInputFiles([png,{...png,name:'second.png'}]);
 await expect(page.getByRole('alert')).toBeVisible();
 await expect(page.locator('.wz-card img')).toHaveCount(1);
 expect(actions).toHaveLength(1);
 failSecond=false;await upload.setInputFiles({...png,name:'second.png'});
 await expect(page.locator('.wz-card img')).toHaveCount(2);
 expect(actions).toHaveLength(2);expect(uploads).toBe(3);
 await page.getByRole('button',{name:wenzeCopy.en.cover,exact:true}).nth(1).click();
 await expect.poll(()=>actions.length).toBe(3);
 expect(actions[2]).toMatchObject({action:'cover',photo_ref:'WIM_3',expected_revision:3});
 await page.getByRole('button',{name:wenzeCopy.en.remove,exact:true}).first().click();
 await expect(page.locator('.wz-card img')).toHaveCount(1);
 await expect(page.locator('.wz-personal [role=alert]')).toHaveCount(0);
});

test('unsaved stock values survive cancelled navigation and Back',async({page})=>{
 await fixture(page);await page.goto('/shida/seller/wenze?store=WNS_fixture&product=WNP_fixture');
 await page.getByLabel(wenzeCopy.en.available,{exact:true}).fill('9');
 page.on('dialog',dialog=>dialog.dismiss());
 await nav(page,'Reports');
 await expect(page.getByLabel(wenzeCopy.en.available,{exact:true})).toHaveValue('9');
 await page.getByRole('button',{name:wenzeCopy.en.back,exact:true}).click();
 await expect(page.getByLabel(wenzeCopy.en.available,{exact:true})).toHaveValue('9');
});

for(const width of [360,1440])test(`confirmation keyboard focus and escape ${width}`,async({page})=>{
 await fixture(page);await page.setViewportSize({width,height:900});await openStore(page);
 await page.getByRole('button',{name:wenzeDesignText('en','settings'),exact:true}).click();
 const trigger=page.getByRole('button',{name:wenzeCopy.en.hide,exact:true});
 await expect(trigger).toBeEnabled();await trigger.focus();await expect(trigger).toBeFocused();await trigger.press('Enter');
 const dialog=page.getByRole('dialog',{name:wenzeCopy.en.hide,exact:true});
 await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('button',{name:wenzeCopy.en.cancel,exact:true})).toBeFocused();
 await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:wenzeCopy.en.hide,exact:true})).toBeFocused();
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
});
