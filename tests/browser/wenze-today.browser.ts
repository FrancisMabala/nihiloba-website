import {test,expect,type Page} from '@playwright/test';
import {todayText} from '../../app/lib/wenze-today-copy';
type Scenario='new'|'zero'|'active'|'attention'|'error'|'partial'|'restricted'|'daily-error'|'mixed';
async function fixture(page:Page,scenario:Scenario,locale='en'){
 const shop={public_ref:'WNZ_demo',name:'Atelier du fleuve',city:'Kinshasa',store_type:'online_and_physical',status:'active',revision:1,visible:'true',category:'other',catalog_ready:scenario!=='new',order_ready:scenario!=='new'};
 const second={...shop,public_ref:'WNZ_second',name:'Maison du cuivre',city:'Lubumbashi',catalog_ready:true,order_ready:true};
 const populated=scenario==='active'||scenario==='attention'||scenario==='mixed';
 const orders=[{reference:'WOR_review',shop_reference:shop.public_ref,shop_name:shop.name,buyer_name:'Client de démonstration',created_at:'2026-10-29T14:15:00Z',updated_at:'2026-10-31T07:00:00Z',status_label:'Preparing',bucket:'in_progress',total:'42000',currency:'CDF',items:[{name:'Panier tressé',quantity:2,unit_price:'21000',variant:''}],allowed_actions:[],action_revision:'review',fulfillment_method:'pickup',payment_verified:false,delivery_details:null}];
 orders.push(...(['Pending','Ready','Completed'] as const).map((status,i)=>({...orders[0],reference:`WOR_review_${i}`,buyer_name:`Client ${i+2}`,created_at:`2026-10-31T0${9-i}:00:00Z`,status_label:status,bucket:i===0?'action_required':i===1?'in_progress':'completed'})));
 await page.addInitScript(l=>localStorage.setItem('shida-wenze-language',l),locale);
 await page.route('**/api/**',async route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  const switched=path.includes('WNZ_second')||url.searchParams.get('store_ref')==='WNZ_second';
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test seller'}});
  if(path.endsWith('/stores'))return reply({stores:[shop,second],categories:[],currencies:['CDF','USD']});
  if(path.endsWith('/WNZ_demo'))return reply(shop);
  if(path.endsWith('/WNZ_second'))return reply(second);
  if(path.endsWith('/products'))return reply({products:[],total:0});
  if(path.endsWith('/options'))return reply({stores:[shop,second],categories:[],issues:{}});
  if(path.endsWith('/WOR_review'))return reply(orders[0]);
  if(path.endsWith('/updates'))return reply({updates:[],unread_count:0});
  if(path.endsWith('/today')){
   if(scenario==='error'||scenario==='daily-error')return reply({detail:'temporary'},503);
   return reply({date:'2026-10-31',timezone:url.searchParams.get('timezone'),followers:switched?73:populated?28:0,new_followers:populated?2:0,orders_today:populated&&!switched?3:0,reviews:{count:populated?4:0,average:populated?4.5:null},financial_access:scenario!=='restricted',currency_summaries:scenario==='restricted'?null:populated?[{currency:'CDF',revenue:'84000',quantity:4,known_profit:'12000',profit_complete:scenario!=='mixed',expenses:'1000'},...(scenario==='mixed'?[{currency:'USD',revenue:'25.50',quantity:1,known_profit:'5.50',profit_complete:true,expenses:'2'}]:[])]:[],sold_items:populated?[{product_ref:'PRD_demo',variant_ref:null,label:'Panier tressé',currency:'CDF',quantity:4,revenue:'84000',image_url:null},...(scenario==='mixed'?[{product_ref:'PRD_usd',variant_ref:null,label:'Sac léger',currency:'USD',quantity:1,revenue:'25.50',image_url:null}]:[])]:[]});
  }
  if(path.endsWith('/orders')){
   if(scenario==='error')return reply({detail:'temporary'},503);
   return reply({counts:{action_required:populated&&!switched?1:0,in_progress:populated&&!switched?2:0},orders:populated&&!switched?orders:[],total:populated?1:0});
  }
  if(path.endsWith('/inventory/summary')){
   if(scenario==='error'||scenario==='partial')return reply({detail:'temporary'},503);
   return reply({items_in_stock:populated?12:0,low_stock_items:scenario==='attention'?2:0,items_out_of_stock:0,untracked_items:scenario==='attention'?1:0,uninitialized_items:0});
  }
  if(path.endsWith('/plan'))return reply({plan:'pro',active_products:0});
  return reply({});
 });
}
for(const scenario of ['new','zero','active','attention','error','partial','restricted','daily-error','mixed'] as const)for(const width of [360,390,768,1440])test(`${scenario} at ${width}`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await fixture(page,scenario);await page.setViewportSize({width,height:900});await page.goto('/shida/seller/wenze?store=WNZ_demo');
 const dashboard=page.locator('.wt-dashboard');await expect(dashboard).toHaveAttribute('aria-busy','false');
 await expect(page.locator('.wt-setup')).toHaveCount(scenario==='new'?1:0);
 await expect(page.locator('.wt-clear')).toHaveCount(['new','zero','restricted'].includes(scenario)?1:0);
 await expect(page.locator('.wt-attention')).toHaveCount(['active','attention','mixed'].includes(scenario)?1:0);
 if(scenario==='error'||scenario==='daily-error')await expect(page.locator('.wt-metrics')).not.toContainText('0');
 if(scenario==='partial')await expect(page.locator('.wt-stock')).toContainText('—');
 if(scenario==='restricted')await expect(page.locator('.wt-metric').first()).toContainText('—');
 if(scenario==='active'||scenario==='attention'||scenario==='mixed'){await expect(page.locator('.wt-metrics')).toContainText('84,000 CDF');await expect(page.locator('.wt-order').first()).toContainText('42,000 CDF');}
 await expect(dashboard).not.toContainText('%');
 if(scenario==='mixed'){
  await expect(page.locator('.wt-sold-total')).toHaveCount(2);
  await expect(page.locator('.wt-sold-total').first()).toContainText('84,000 CDF');
  await expect(page.locator('.wt-sold-total').last()).toContainText('25.5 USD');
  await expect(page.locator('.wt-financial-currency').first()).toContainText('12,000 CDF');
  await expect(page.locator('.wt-cost-warning')).toHaveCount(1);
 }
 if(scenario==='zero')await expect(page.locator('.wt-sold')).toContainText('No products sold today');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/wenze-today/${scenario}-${width}.png`,fullPage:true});expect(errors).toEqual([]);
});
for(const locale of ['fr','ln','sw'] as const)test(`localized dashboard ${locale}`,async({page})=>{
 await fixture(page,'new',locale);await page.setViewportSize({width:390,height:844});await page.goto(`/${locale}/shida/seller/wenze?store=WNZ_demo`);
 await expect(page.getByText(todayText(locale,'setup'),{exact:true})).toBeVisible();await expect(page.locator('.wt-dashboard')).toHaveAttribute('aria-busy','false');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('shop switching, order detail and new sale destinations',async({page})=>{
 await fixture(page,'active');await page.goto('/shida/seller/wenze?store=WNZ_demo');await expect(page.locator('.wt-order').first()).toBeVisible();
 await page.locator('.wt-order').first().click();await expect(page).toHaveURL(/view=orders/);await expect(page.getByRole('heading',{name:/WOR_review/})).toBeVisible();
 await page.goto('/shida/seller/wenze?store=WNZ_demo');await expect(page.locator('.wt-dashboard')).toHaveAttribute('aria-busy','false');
 await page.locator('.wz-store-selector select').selectOption('WNZ_second');await expect(page.locator('.wt-metric').last()).toContainText('73');await expect(page.locator('.wt-order')).toHaveCount(0);await expect(page.locator('.wt-toolbar select')).toHaveValue('Africa/Lubumbashi');
 await page.screenshot({path:'test-results/wenze-today/shop-switch.png',fullPage:true});
 await page.locator('.wt-tools .seller-primary').click();await expect(page).toHaveURL(/view=sales/);
});
test('loading is not an all-clear and setup links keep the shop',async({page})=>{
 await fixture(page,'new');let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);
 await page.route(/\/today\/?\?/,async route=>{await held;await route.fallback();});
 await page.goto('/shida/seller/wenze?store=WNZ_demo');await expect(page.locator('.wt-dashboard')).toHaveAttribute('aria-busy','true');await expect(page.locator('.wt-clear')).toHaveCount(0);
 await page.screenshot({path:'test-results/wenze-today/loading-1440.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/wenze-today/loading-390.png',fullPage:true});release();await expect(page.locator('.wt-dashboard')).toHaveAttribute('aria-busy','false');
 await page.getByRole('button',{name:'Complete shop setup',exact:true}).click();await expect(page).toHaveURL(/view=shop/);await expect(page).toHaveURL(/store=WNZ_demo/);
});
test('late responses cannot restore data from the previous shop',async({page})=>{
 await fixture(page,'active');let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);
 await page.route(/\/WNZ_demo\/today\/?\?/,async route=>{await held;await route.fallback();});
 await page.goto('/shida/seller/wenze?store=WNZ_demo');await expect(page.locator('.wt-dashboard')).toHaveAttribute('aria-busy','true');
 await page.locator('.wz-store-selector select').selectOption('WNZ_second');await expect(page.locator('.wt-metric').last()).toContainText('73');
 const finished=page.waitForResponse(/\/WNZ_demo\/today\/?\?/);release();await finished;await expect(page.locator('.wt-metric').last()).toContainText('73');await expect(page.locator('.wt-order')).toHaveCount(0);
});

test('financial summary opens existing Money reports and preserves shop',async({page})=>{
 await fixture(page,'mixed');await page.goto('/shida/seller/wenze?store=WNZ_demo');
 await expect(page.locator('.wt-dashboard')).toHaveAttribute('aria-busy','false');
 await page.getByRole('button',{name:'View full report'}).click();
 await expect(page).toHaveURL(/view=reports/);await expect(page).toHaveURL(/store=WNZ_demo/);
});

test('refresh and timezone preserve read-only requests and returned local day',async({page})=>{
 const writes:string[]=[];page.on('request',req=>{if(req.url().includes('/api/')&&req.method()!=='GET')writes.push(req.method());});
 await fixture(page,'active');await page.goto('/shida/seller/wenze?store=WNZ_demo');
 await expect(page.locator('.wt-dashboard')).toHaveAttribute('aria-busy','false');
 const refreshed=page.waitForRequest(req=>req.url().includes('/today')&&req.url().includes('timezone='));
 await page.getByRole('button',{name:'Refresh',exact:true}).press('Enter');await refreshed;
 await expect(page.locator('.wt-dashboard')).toHaveAttribute('aria-busy','false');
 const changed=page.waitForRequest(req=>req.url().includes('/today')&&req.url().includes('Lubumbashi'));
 await page.locator('.wt-toolbar select').selectOption('Africa/Lubumbashi');await changed;
 await expect(page.locator('.wt-toolbar')).toContainText('Saturday, October 31, 2026');
 await expect(page.locator('.wt-order').first()).toContainText('4:15 PM');
 expect(writes).toEqual([]);
});
