import {test,expect} from '@playwright/test';
import {fixture} from './restaurant-c1e-fixture';
import {managementNavigation} from './restaurant-management-navigation';
import {workflowText} from '../../app/lib/restaurant-workflow-copy';
import {restaurantClarityCopy} from '../../app/lib/restaurant-clarity-copy';
import {insightsCopy} from '../../app/lib/restaurant-insights-copy';
const measured={state:'available',value:12},unavailable={state:'unavailable',value:null};
const keys=['profile_opens','menu_opens','item_views','item_selections','menu_requests','orders_started'];
const report={state:'available',coverage:'authenticated_best_effort',current_followers:{state:'available',value:8},as_of:'2026-10-15T12:00:00Z',period:{from:'2026-08-11T00:00:00Z',to:'2026-09-10T00:00:00Z'},measurement_started_at:'2026-07-01T12:00:00Z',first_block_start:'2026-07-12T00:00:00Z',release_at:'2026-09-12T00:00:00Z',metrics:Object.fromEntries(keys.map(key=>[key,key==='item_selections'?unavailable:measured])),by_channel:Object.fromEntries(keys.map(key=>[key,{web:key==='menu_requests'||key==='item_selections'?unavailable:measured,whatsapp:key==='menu_requests'?measured:unavailable,unknown:unavailable}])),popular_items:[{item_ref:'RMI_fixture',name:'Pondu',interest:measured}]};
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,820,1440])test(`insights ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await fixture(page);
 await page.route('**/RST_fixture/insights/**',route=>route.fulfill({json:report}));
 await page.route('**/RST_fixture/order-summary/**',route=>route.fulfill({json:{as_of:report.as_of,coverage_from:null,coverage_to:report.as_of,measurement_status:'unavailable',metrics:null}}));
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants`);await page.locator('.rst-grid .rst-card button').first().click();
 await managementNavigation(page,process.env.INSIGHTS_CAPTURE_PHASE==='before'?workflowText(locale,'statistics'):insightsCopy[locale].title);
 await expect(page.locator('.rst-work').first()).toBeVisible();
 if(process.env.INSIGHTS_CAPTURE_PHASE!=='before'){
  await expect(page.locator('.rst-insights-total')).toHaveText('8');
  await expect(page.locator('.rst-insights')).toContainText('Pondu');
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/restaurant-insights-2026-10-15/${process.env.INSIGHTS_CAPTURE_PHASE??'after'}-${locale}-${width}.png`,fullPage:true});
 if(process.env.INSIGHTS_CAPTURE_PHASE!=='before'){
  await page.locator('.rst-insights summary').filter({hasText:insightsCopy[locale].sources}).click();
  await expect(page.locator('.rst-insights-sources')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`docs/evidence/restaurant-insights-2026-10-15/sources-${locale}-${width}.png`,fullPage:true});
 }
});

for(const scenario of ['empty','low','outage'] as const)test(`insights ${scenario}`,async({page})=>{
 await fixture(page);
 await page.route('**/RST_fixture/insights/**',route=>scenario==='outage'?route.fulfill({status:503,json:{detail:'restaurant_unavailable'}}):route.fulfill({json:{...report,state:'unavailable',current_followers:scenario==='empty'?{state:'available',value:0}:report.current_followers,metrics:Object.fromEntries(keys.map(key=>[key,unavailable])),popular_items:[]}}));
 await page.route('**/RST_fixture/order-summary/**',route=>route.fulfill({json:{as_of:report.as_of,coverage_from:report.period.from,coverage_to:report.as_of,measurement_status:'available',metrics:{submitted_orders:0,completed_in_period:0,completed_food_value:{},completed_delivery_fees:{},status_breakdown:{},by_method:{},by_channel:{}}}}));
 await page.goto('/shida/seller/restaurants');await page.locator('.rst-grid .rst-card button').first().click();await managementNavigation(page,insightsCopy.en.title);
 await expect(page.getByRole('heading',{name:insightsCopy.en.orders,exact:true})).toBeVisible();
 await expect(page.locator('.rst-insights').getByText(restaurantClarityCopy.en.noTrends,{exact:true})).toHaveCount(scenario==='outage'?0:1);
 await expect(page.locator('.rst-insights-total')).toHaveText(scenario==='empty'?'0':scenario==='low'?'8':'Unavailable');
 await expect(page.locator('.rst-insights .rst-stat-cards').first()).not.toContainText('Unavailable');
 await expect(page.locator('.rst-stats-table').last().getByRole('row')).toHaveCount(5);
 await expect(page.locator('.rst-stats-table').last().getByRole('cell',{name:'0',exact:true})).toHaveCount(8);
});

for(const width of [320,390,820,1440])test(`plain French statistics tables ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await fixture(page);
 await page.route('**/RST_fixture/insights/**',route=>route.fulfill({json:report}));
 await page.route('**/RST_fixture/order-summary/**',route=>route.fulfill({json:{as_of:report.as_of,coverage_from:report.period.from,coverage_to:report.as_of,measurement_status:'available',metrics:{submitted_orders:12,completed_in_period:9,completed_food_value:{CDF:'50000.00',USD:'12.50'},completed_delivery_fees:{},status_breakdown:{pending:3,completed:9},by_method:{},by_channel:{web:{submitted:5,completed:4},whatsapp:{submitted:4,completed:3},counter:{submitted:3,completed:2}}}}}));
 await page.goto('/fr/shida/seller/restaurants');await page.locator('.rst-grid .rst-card button').first().click();await managementNavigation(page,insightsCopy.fr.title);
 const stats=page.locator('.rst-order-statistics');
 await expect(stats.locator('.rst-stat-cards')).toContainText('12');
 await expect(stats.getByRole('table',{name:'État des commandes'}).getByRole('row')).toHaveCount(3);
 await expect(stats.getByRole('table',{name:'Origine des commandes'}).getByRole('row').filter({hasText:'WhatsApp'})).toContainText('4');
 await expect(page.getByText(insightsCopy.fr.privacy,{exact:true})).not.toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 await page.screenshot({path:`docs/evidence/restaurant-mobile-2026-10-27/statistics-fr-${width}.png`,fullPage:true});
});
