import {test,expect} from '@playwright/test';
test('public viewing requires visible human interaction; item details are distinct from menu impressions',async({page})=>{
 const events:{kind:string;item_ref?:string;operation_key:string}[]=[];
 await page.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
 await page.route('**/api/shida/employment/session/**',route=>route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Synthetic customer'}}}));
 await page.route('**/api/shida/personal/restaurant-orders/establishments/*/interest/**',route=>{events.push(route.request().postDataJSON());return route.fulfill({json:{recorded:true}});});
 await page.goto('/shida/restaurants/RST-TEST1/');
 await expect(page.locator('.restaurant-detail-header')).toBeVisible();
 await page.waitForTimeout(1200);
 expect(events).toEqual([]);
 await page.locator('.restaurant-detail-header h1').click();
 await expect.poll(()=>events.some(e=>e.kind==='profile_opens')).toBe(true);
 expect(events.filter(e=>e.kind==='item_views')).toHaveLength(0);
 const detail=page.locator('details[data-restaurant-item-view]').first();
 await detail.locator('summary').click();
 await expect.poll(()=>events.filter(e=>e.kind==='item_views').length).toBe(1);
 const ref=await detail.getAttribute('data-restaurant-item-view');
 expect(events.find(e=>e.kind==='item_views')?.item_ref).toBe(ref);
 await detail.locator('summary').click();await detail.locator('summary').click();await page.waitForTimeout(1200);
 expect(events.filter(e=>e.kind==='item_views')).toHaveLength(1);
});
test('automated browser traffic is excluded even when it clicks',async({page})=>{
 let events=0;
 await page.route('**/api/shida/personal/restaurant-orders/establishments/*/interest/**',route=>{events++;return route.fulfill({json:{recorded:false}});});
 await page.goto('/shida/restaurants/RST-TEST1/');await page.locator('.restaurant-detail-header h1').click();await page.waitForTimeout(1200);
 expect(events).toBe(0);
});
