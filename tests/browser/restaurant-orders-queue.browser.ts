import { test, expect, type Page } from '@playwright/test';
import { managementNavigation } from './restaurant-management-navigation';
import { workText } from '../../app/lib/restaurant-work-copy';

const stamp='2026-10-14T09:18:00+00:00';
const preview=(name:string)=>({available:true,groups:[{kind:'standalone',plate_number:null,lines:[{name,currency:'CDF',quantity:2,sale_unit_label:'portions'}],remaining_lines:0}],total_groups:1,total_lines:1,remaining_groups:0,remaining_lines:0,truncated:false});
const base=(ref:string,state:string,source='customer',method='pickup',channel='web')=>({order_ref:ref,revision:1,state,entry_source:source,channel,fulfillment_method:method,submitted_at:stamp,response_deadline:state==='pending'?'2026-10-14T09:45:00+00:00':null,cancellation_pending:false,order_total:'6000.00',currency:'CDF',food_preview:preview('Fufu et pondu')});
const orders=[
 base('ORD_QR_7G3F9P2L','pending'),
 {...base('ORD_WEB_CANCEL_4V8H','preparing','customer','delivery'),cancellation_pending:true,preparation:{kitchen:'preparing',bar:'ready'},food_preview:preview('Poulet braisé et jus de gingembre')},
 {...base('ORD_ASSISTED_8K2M','accepted','assisted','assisted','service'),preparation:{kitchen:'waiting',bar:'waiting'}},
 {...base('ORD_PICKUP_2N6R','ready'),preparation:{kitchen:'ready'},pickup_verification:{method:'unverified',required:true,locked:false}},
 {...base('ORD_DELIVERY_9P4D','out_for_delivery','customer','delivery'),delivery_verification:{method:'unverified',required:true,locked:false}},
 base('ORD_COUNTER_5J7S','completed','counter','on_premise','counter'),
 base('ORD_CANCELLED_3C1T','cancelled','customer','pickup','whatsapp'),
];
const establishment={public_ref:'RST_ORDERS',revision:stamp,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links'],profile:{name:'Malewa ya Marché',food_business_type:'malewa',city:'Kinshasa',commune:'Limete',timezone_name:'Africa/Kinshasa'}};
const labels={fr:'Commandes',en:'Orders',ln:'Bakomande',sw:'Maagizo'} as const;
async function seed(page:Page,option:{closed?:boolean;empty?:boolean;historyOnly?:boolean;stale?:boolean}={}){
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),p=url.pathname.replace(/\/$/,'');
  const json=(value:unknown)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
  if(p.endsWith('/employment/session'))return json({user:{display_name:'Owner'},binding:'a'.repeat(64)});
  if(p.endsWith('/capabilities'))return json({capabilities:[{capability:'restaurant.kitchen',available:true},{capability:'restaurant.pos',available:true}]});
  if(p.endsWith('/order-feed'))return json({changed:[],removed:[],cursor:'queue-cursor',as_of:stamp});
  if(p.endsWith('/order-configuration'))return json({intake_released:!option.closed});
  if(p.endsWith('/pos'))return json({items:[],recent:[],intake_released:!option.closed});
  if(p.endsWith('/orders')){
   const states=url.searchParams.getAll('states');
   const items=option.empty?[]:orders.filter(o=>(!option.historyOnly||['completed','cancelled'].includes(o.state))&&states.includes(o.state));
   return json({items,total:items.length,page:1,page_size:20,as_of:stamp});
  }
  if(p.includes('/orders/')){
   if(option.stale && p.endsWith('/actions/accept'))return route.fulfill({status:409,json:{detail:'restaurant_stale'}});
   const ref=p.split('/orders/')[1].split('/')[0],order=orders.find(o=>o.order_ref===ref);
   if(order)return json({...order,receipt_terms:{currency:'CDF',food_subtotal:'6000.00',delivery_fee:null,order_total:'6000.00',standalone:[{key:'fufu',item_ref:'FOOD_1',name:'Fufu et pondu',quantity:2,sale_unit_label:'portions',subtotal:'6000.00'}],plates:[]}});
  }
  if(p.endsWith('/restaurants'))return json({items:[establishment],total:1,page:1,page_size:20,actions:['create']});
  if(p.endsWith('/RST_ORDERS'))return json(establishment);
  if(p.endsWith('/order-summary'))return json({as_of:stamp,coverage_from:null,coverage_to:null,measurement_status:'unavailable',metrics:null});
  return json({items:[],total:0,as_of:stamp});
 });
}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [360,820,1440])test(`owner Orders queue ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await seed(page);
 await page.goto((locale==='en'?'':'/'+locale)+'/shida/seller/restaurants/');
 await managementNavigation(page,labels[locale]);
 await expect(page.locator('.rst-order-section')).toHaveCount(4);
 await expect(page.locator('.rst-order-row')).toHaveCount(7);
 await expect(page.locator('.rst-order-row').first()).toContainText('ORD_QR_7G3F9P2L');
 await expect(page.locator('.rst-order-row').filter({hasText:'ORD_WEB_CANCEL_4V8H'})).toContainText('Poulet braisé');
 await expect(page.locator('.rst-order-row').filter({hasText:'ORD_COUNTER_5J7S'})).toContainText('Fufu et pondu');
 await expect(page.locator('.rst-order-row').filter({hasText:'ORD_PICKUP_2N6R'})).not.toContainText(labels[locale]==='Orders'?'Handed over':'Remise effectuée');
 await page.addStyleTag({content:'nextjs-portal{display:none!important}.skip-link{transform:translateY(-150%)!important}'});
 await page.screenshot({path:`docs/evidence/restaurant-orders-2026-10-14/after-${locale}-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [360,820,1440])test(`closed intake and no orders ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await seed(page,{closed:true,empty:true});await page.goto((locale==='en'?'':'/'+locale)+'/shida/seller/restaurants/');
 await managementNavigation(page,labels[locale]);
 await expect(page.locator('.rst-order-empty')).toBeVisible();
 await expect(page.locator('.rst-order-notice')).toBeVisible();
 await expect(page.locator('.rst-order-row')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr'&&width===360){
  await page.addStyleTag({content:'nextjs-portal{display:none!important}.skip-link{transform:translateY(-150%)!important}'});
  await page.screenshot({path:'docs/evidence/restaurant-orders-2026-10-14/after-empty-closed-360.png',fullPage:true});
  await page.locator('.rst-order-empty').getByRole('button').click();
  await expect(page.locator('.rst-selling')).toBeVisible();
  await managementNavigation(page,'Commandes');
  await page.locator('.rst-order-notice').getByRole('button',{name:'Réception des commandes'}).click();
  await expect(page.locator('form.rst-work h2')).toHaveText('Réception des commandes');
 }
});
test('history only says nothing needs action',async({page})=>{
 await seed(page,{historyOnly:true});await page.goto('/shida/seller/restaurants/');await managementNavigation(page,'Orders');
 await expect(page.locator('.rst-order-quiet')).toContainText('Nothing needs action');
 await expect(page.locator('.rst-order-row')).toHaveCount(2);
});
test('routed preparation and cancellation show distinct next work',async({page})=>{
 await seed(page);await page.goto('/shida/seller/restaurants/');await managementNavigation(page,'Orders');
 await expect(page.locator('.rst-order-row').filter({hasText:'ORD_ASSISTED_8K2M'})).toContainText('Start preparing');
 await expect(page.locator('.rst-order-row').filter({hasText:'ORD_WEB_CANCEL_4V8H'})).toContainText('Review cancellation request');
 await expect(page.locator('.rst-order-row').filter({hasText:'ORD_PICKUP_2N6R'})).toContainText('Verify pickup code');
});
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [360,820,1440])test(`stale acceptance requires review ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await seed(page,{stale:true});await page.goto((locale==='en'?'':'/'+locale)+'/shida/seller/restaurants/');await managementNavigation(page,labels[locale]);
 await page.locator('.rst-order-row').filter({hasText:'ORD_QR_7G3F9P2L'}).getByRole('button').last().click();
 await page.locator('.rst-order-detail').getByRole('button',{name:workText(locale,'accept')}).click();
 await page.locator('.rst-order-detail').getByRole('button',{name:workText(locale,'confirm')}).click();
 await expect(page.locator('.rst-order-detail')).toContainText(workText(locale,'conflict'));
 await expect(page.locator('.rst-order-detail').getByRole('button',{name:workText(locale,'review')})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='en'&&width===1440){
  await page.evaluate(()=>{(document.activeElement as HTMLElement|null)?.blur();window.scrollTo(0,0);});
  await page.addStyleTag({content:'nextjs-portal{display:none!important}.skip-link{transform:translateY(-150%)!important}'});
  await page.screenshot({path:'docs/evidence/restaurant-orders-2026-10-14/after-stale-en-1440.png',fullPage:true});
 }
});
