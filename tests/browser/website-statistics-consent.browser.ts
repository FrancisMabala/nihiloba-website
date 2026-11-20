import {test,expect} from '@playwright/test';
import {statisticsCopy} from '../../app/lib/website-statistics-consent';
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [390,1440])test(`optional statistics consent and revocation ${locale} ${width}`,async({page},info)=>{
 const events:Record<string,unknown>[]=[];await page.route('**/api/shida/statistics/**',route=>{events.push(route.request().postDataJSON());return route.fulfill({status:204});});
 await page.setViewportSize({width,height:900});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/emplois/`);const t=statisticsCopy[locale],panel=page.locator('.website-statistics');
 await expect(panel.getByRole('button',{name:t.accept,exact:true})).toBeVisible();expect(events).toHaveLength(0);
 expect(await page.evaluate(()=>Object.keys(localStorage).some(key=>key.startsWith('shida_statistics_')))).toBe(false);
 for(const name of [t.accept,t.decline]){const box=await panel.getByRole('button',{name,exact:true}).boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);}
 await page.screenshot({path:info.outputPath('consent-'+locale+'-'+width+'.png'),fullPage:true});
 await panel.getByRole('button',{name:t.decline,exact:true}).click();expect(events).toHaveLength(0);expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('shida_statistics_')))).toEqual(['shida_statistics_consent_v1']);
 await panel.getByRole('button',{name:t.settings,exact:true}).click();await panel.getByRole('button',{name:t.accept,exact:true}).click();await expect.poll(()=>events.length).toBeGreaterThan(0);
 expect(events[0]).toMatchObject({consent:true,policy:'web-statistics-v1',language:locale,page_group:'employment'});expect(Object.keys(events[0])).not.toContain('url');expect(Object.keys(events[0])).not.toContain('user');
 await panel.getByRole('button',{name:t.settings,exact:true}).click();await panel.getByRole('button',{name:t.decline,exact:true}).click();const count=events.length;
 expect(await page.evaluate(()=>localStorage.getItem('shida_statistics_visitor_v1'))).toBeNull();expect(await page.evaluate(()=>sessionStorage.getItem('shida_statistics_session_v1'))).toBeNull();
 await page.reload();await expect(panel).toContainText(t.off);expect(events).toHaveLength(count);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
for(const property of ['doNotTrack','globalPrivacyControl'])test(`browser ${property} prevents measurement despite historical acceptance`,async({page})=>{
 await page.addInitScript(({property})=>{Object.defineProperty(navigator,property,{configurable:true,value:property==='doNotTrack'?'1':true});localStorage.setItem('shida_statistics_consent_v1',JSON.stringify({choice:'accepted',expires:Date.now()+86400000}));localStorage.setItem('shida_statistics_visitor_v1',JSON.stringify({id:'00000000-0000-4000-8000-000000000001',expires:Date.now()+86400000}));},{property});
 let sends=0;await page.route('**/api/shida/statistics/**',route=>{sends++;return route.fulfill({status:204});});await page.goto('/shida/emplois/');await expect(page.locator('.website-statistics')).toContainText(statisticsCopy.en.blocked);expect(sends).toBe(0);expect(await page.evaluate(()=>localStorage.getItem('shida_statistics_visitor_v1'))).toBeNull();
});
