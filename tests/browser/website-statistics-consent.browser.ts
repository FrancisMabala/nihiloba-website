import {test,expect} from '@playwright/test';
import {statisticsCopy} from '../../app/lib/website-statistics-consent';
test.beforeEach(async({page})=>{await page.route('**/*',route=>['127.0.0.1','localhost','[::1]'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());});
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [360,390,1440])test(`optional statistics consent and revocation ${locale} ${width}`,async({page},info)=>{
 const events:Record<string,unknown>[]=[];await page.route('**/api/shida/statistics/**',route=>{events.push(route.request().postDataJSON());return route.fulfill({status:204});});
 await page.setViewportSize({width,height:844});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/emplois/`);const t=statisticsCopy[locale],panel=page.locator('.website-statistics');
 const dialog=panel.getByRole('dialog',{name:t.title}),heading=dialog.getByRole('heading',{name:t.title});
 await expect(dialog).toBeVisible();await expect(heading).toBeFocused();
 expect((await dialog.boundingBox())!.y).toBeLessThan(40);expect(await page.evaluate(()=>scrollY)).toBe(0);
 await dialog.getByRole('button',{name:t.close,exact:true}).click();await expect(dialog).not.toBeVisible();
 expect(events).toHaveLength(0);expect(await page.evaluate(()=>localStorage.getItem('shida_statistics_consent_v1'))).toBeNull();
 expect(await page.evaluate(()=>scrollY)).toBe(0);
 const settings=panel.getByRole('button',{name:t.settings,exact:true});await settings.click();await expect(heading).toBeFocused();
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(settings).toBeFocused();
 expect(await page.evaluate(()=>localStorage.getItem('shida_statistics_consent_v1'))).toBeNull();
 // A fresh navigation tests initial choice; reload would restore the footer scroll from reopening.
 await page.goto(page.url()+'?initial-choice=1');await expect(dialog).toBeVisible();
 expect(await page.evaluate(()=>scrollY)).toBe(0);
 if(width===360){await page.emulateMedia({reducedMotion:'reduce'});expect(await dialog.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');}
 await expect(panel.getByRole('button',{name:t.accept,exact:true})).toBeVisible();expect(events).toHaveLength(0);
 expect(await page.evaluate(()=>Object.keys(localStorage).some(key=>key.startsWith('shida_statistics_')))).toBe(false);
 for(const name of [t.accept,t.decline]){const box=await panel.getByRole('button',{name,exact:true}).boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);}
 expect(await dialog.locator('.website-statistics-actions button').evaluateAll(buttons=>buttons.map(button=>getComputedStyle(button).backgroundColor))).toEqual(['rgb(21, 63, 50)','rgb(21, 63, 50)']);
 await page.screenshot({path:info.outputPath('consent-'+locale+'-'+width+'.png'),fullPage:true});
 for(const name of [t.close,t.accept,t.decline]){await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name,exact:true})).toBeFocused();}
 await page.keyboard.press('Tab');await expect(dialog.getByRole('link',{name:t.privacy,exact:true})).toBeFocused();
 await page.keyboard.press('Tab');
 // Native Chrome may visit browser controls between the last and first dialog targets.
 // A background page control must never receive focus during this boundary.
 if(!await dialog.evaluate(el=>el.contains(document.activeElement))){expect(await page.evaluate(()=>!document.hasFocus()&&document.activeElement===document.body&&!!document.querySelector('dialog:modal'))).toBe(true);await page.keyboard.press('Tab');}
 await expect(dialog.getByRole('button',{name:t.close,exact:true})).toBeFocused();
 await page.keyboard.press('Shift+Tab');
 if(!await dialog.evaluate(el=>el.contains(document.activeElement))){expect(await page.evaluate(()=>!document.hasFocus()&&document.activeElement===document.body&&!!document.querySelector('dialog:modal'))).toBe(true);await page.keyboard.press('Shift+Tab');}
 await expect(dialog.getByRole('link',{name:t.privacy,exact:true})).toBeFocused();
 await panel.getByRole('button',{name:t.decline,exact:true}).click();expect(events).toHaveLength(0);expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('shida_statistics_')))).toEqual(['shida_statistics_consent_v1']);
 expect(await page.evaluate(()=>scrollY)).toBe(0);expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
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
