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
 await page.getByRole('button',{name:'Accept statistics',exact:true}).click();
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
 await page.goto('/shida/restaurants/RST-TEST1/');await page.getByRole('button',{name:'Accept statistics',exact:true}).click();await page.locator('.restaurant-detail-header h1').click();await page.waitForTimeout(1200);
 expect(events).toBe(0);
});

test('declining and revoking optional interest keeps menu and basket actions available',async({page})=>{
 let events=0;await page.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
 await page.route('**/api/shida/statistics/**',route=>route.fulfill({status:204}));
 await page.route('**/api/shida/personal/restaurant-orders/establishments/*/interest/**',route=>{events++;return route.fulfill({json:{recorded:true}});});
 await page.goto('/shida/restaurants/RST-TEST1/menu/');await page.getByRole('button',{name:'Decline statistics',exact:true}).click();
 const opener=page.locator('button[data-restaurant-item-open]').first();await expect(opener).toBeEnabled();await opener.click();
 const add=page.locator('dialog[open] button[data-restaurant-item-selection]');await expect(add).toBeEnabled();await add.click();await expect(page.locator('.rst-sticky-basket')).toBeVisible();
 await page.waitForTimeout(1100);expect(events).toBe(0);
 await page.getByRole('button',{name:'Statistics preferences',exact:true}).click();await page.getByRole('button',{name:'Accept statistics',exact:true}).click();
 await page.getByRole('button',{name:'Statistics preferences',exact:true}).click();await page.getByRole('button',{name:'Decline statistics',exact:true}).click();const after=events;
 await expect(opener).toBeEnabled();await opener.click();await expect(add).toBeEnabled();await add.click();await expect(page.locator('.rst-sticky-basket')).toBeVisible();await page.waitForTimeout(1100);expect(events).toBe(after);
});
