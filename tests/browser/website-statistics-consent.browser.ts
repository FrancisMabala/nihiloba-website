import {test,expect} from '@playwright/test';
import {statisticsCopy,STATISTICS_CHOICE_POLICY,STATISTICS_CHOICE_KEY,STATISTICS_VISITOR_KEY,STATISTICS_SESSION_KEY} from '../../app/lib/website-statistics-consent';

test.beforeEach(async({context,baseURL})=>{
 const loopback=['127.0.0.1','localhost','[::1]'];
 if(!baseURL||!loopback.includes(new URL(baseURL).hostname))throw Error('Use the approved isolated loopback Website runtime');
 await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL).origin?route.continue():route.abort());
});

for(const locale of ['fr','en','ln','sw'] as const)for(const width of [360,390,1440])test(`optional statistics consent and revocation ${locale} ${width}`,async({page},info)=>{
 const events:Record<string,unknown>[]=[];
 await page.route('**/api/shida/statistics/**',route=>{events.push(route.request().postDataJSON());return route.fulfill({status:204});});
 await page.setViewportSize({width,height:844});
 const path=`${locale==='en'?'':`/${locale}`}/shida/emplois/`;
 await page.goto(path);
 const t=statisticsCopy[locale];
 const notice=page.getByRole('region',{name:t.title});
 const dialog=page.getByRole('dialog',{name:t.preferences});
 const heading=dialog.getByRole('heading',{name:t.preferences});
 const setting=page.locator('footer').getByRole('button',{name:t.settings,exact:true});
 const choice=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'null')?.choice??null,STATISTICS_CHOICE_KEY);

 await expect(notice).toBeVisible();
 await expect(notice).toHaveCount(1);
 await expect(dialog).toBeHidden();
 expect(await page.evaluate(()=>({overflow:document.body.style.overflow,scrollY,active:document.activeElement?.tagName}))).toEqual({overflow:'',scrollY:0,active:'BODY'});
 const rectangle=(await notice.boundingBox())!;
 if(width<700){
  const nav=(await page.locator('.shida-navigation').boundingBox())!;
  expect(rectangle.x).toBe(0);expect(rectangle.width).toBe(width);
  expect(rectangle.y+rectangle.height).toBeLessThanOrEqual(nav.y+1);
 }else{
  expect(rectangle.width).toBeGreaterThanOrEqual(380);expect(rectangle.width).toBeLessThanOrEqual(420);
  expect(rectangle.x).toBeLessThanOrEqual(24);
  expect(rectangle.y+rectangle.height).toBeGreaterThan(810);
 }
 const buttons=await notice.locator('.website-statistics-actions button').evaluateAll(nodes=>nodes.map(node=>{
  const {width,height}=node.getBoundingClientRect();
  return {width,height,color:getComputedStyle(node).backgroundColor};
 }));
 expect(buttons).toHaveLength(2);expect(buttons[0]).toEqual(buttons[1]);expect(buttons[0].height).toBeGreaterThanOrEqual(44);
 await expect(notice.getByRole('link',{name:t.privacy})).toBeVisible();
 await page.screenshot({path:info.outputPath(`consent-${locale}-${width}.png`)});

 const customize=notice.getByRole('button',{name:t.customize,exact:true});
 await customize.click();await expect(heading).toBeFocused();
 const checkbox=dialog.getByRole('checkbox',{name:t.analytics,exact:true});
 await expect(checkbox).not.toBeChecked();await expect(dialog.getByText(t.always)).toBeVisible();
 await expect(dialog.getByText(t.details)).toBeVisible();
 await page.screenshot({path:info.outputPath(`preferences-${locale}-${width}.png`)});
 await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:t.close,exact:true})).toBeFocused();
 await page.keyboard.press('Tab');await expect(checkbox).toBeFocused();
 await page.keyboard.press('Space');await expect(checkbox).toBeChecked();
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(customize).toBeFocused();
 expect(await choice()).toBeNull();expect(events).toHaveLength(0);
 await customize.click();await expect(checkbox).not.toBeChecked();
 await dialog.getByRole('button',{name:t.close,exact:true}).click();await expect(customize).toBeFocused();

 await notice.getByRole('button',{name:t.dismiss,exact:true}).click();await expect(notice).toBeHidden();
 expect(await choice()).toBeNull();expect(events).toHaveLength(0);
 await page.goto(path+'?initial-choice=1');await expect(notice).toBeVisible();
 await notice.getByRole('button',{name:t.decline,exact:true}).click();await expect(notice).toBeHidden();
 expect(await choice()).toBe('declined');expect(events).toHaveLength(0);

 await setting.click();await expect(checkbox).not.toBeChecked();await checkbox.check();
 await dialog.getByRole('button',{name:t.save,exact:true}).click();await expect(setting).toBeFocused();
 expect(await choice()).toBe('accepted');await expect.poll(()=>events.length).toBeGreaterThan(0);
 expect(events[0]).toMatchObject({consent:true,policy:'web-statistics-v1',language:locale,page_group:'employment'});
 expect(Object.keys(events[0])).not.toContain('url');expect(Object.keys(events[0])).not.toContain('user');

 await setting.click();await expect(checkbox).toBeChecked();await checkbox.uncheck();
 await dialog.getByRole('button',{name:t.save,exact:true}).click();await expect(setting).toBeFocused();
 expect(await choice()).toBe('declined');
 expect(await page.evaluate(([visitor,session])=>[localStorage.getItem(visitor),sessionStorage.getItem(session)],[STATISTICS_VISITOR_KEY,STATISTICS_SESSION_KEY])).toEqual([null,null]);
 const count=events.length;
 await page.reload();await expect(notice).toBeHidden();await setting.click();await expect(checkbox).not.toBeChecked();
 expect(events).toHaveLength(count);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

for(const property of ['doNotTrack','globalPrivacyControl'])test(`browser ${property} prevents measurement despite historical acceptance`,async({page})=>{
 await page.addInitScript(({property,policy,choiceKey,visitorKey})=>{
  Object.defineProperty(navigator,property,{configurable:true,value:property==='doNotTrack'?'1':true});
  localStorage.setItem(choiceKey,JSON.stringify({choice:'accepted',policy,expires:Date.now()+86400000}));
  localStorage.setItem(visitorKey,JSON.stringify({id:'00000000-0000-4000-8000-000000000001',expires:Date.now()+86400000}));
 },{property,policy:STATISTICS_CHOICE_POLICY,choiceKey:STATISTICS_CHOICE_KEY,visitorKey:STATISTICS_VISITOR_KEY});
 let sends=0;
 await page.route('**/api/shida/statistics/**',route=>{sends++;return route.fulfill({status:204});});
 await page.goto('/shida/emplois/');
 const t=statisticsCopy.en,dialog=page.getByRole('dialog',{name:t.preferences});
 await page.getByRole('button',{name:t.settings,exact:true}).click();
 await expect(dialog.getByText(t.blocked)).toBeVisible();
 await expect(dialog.getByRole('checkbox',{name:t.analytics})).toBeDisabled();
 await expect(dialog.getByRole('button',{name:t.accept,exact:true})).toBeDisabled();
 expect(sends).toBe(0);expect(await page.evaluate(key=>localStorage.getItem(key),STATISTICS_VISITOR_KEY)).toBeNull();
});


test('a stale open preference cannot restore consent withdrawn in a second tab',async({page,context})=>{
 const t=statisticsCopy.en;
 await context.route('**/api/shida/statistics/**',route=>route.fulfill({status:204}));
 await page.goto('/en/privacy/');
 const initial=page.getByRole('region',{name:t.title});
 await initial.getByRole('button',{name:t.accept,exact:true}).click();
 const open=(tab:typeof page)=>tab.getByRole('button',{name:t.settings,exact:true}).click();
 const preferences=(tab:typeof page)=>tab.getByRole('dialog',{name:t.preferences});
 await open(page);
 await expect(preferences(page).getByRole('checkbox',{name:t.analytics})).toBeChecked();
 const second=await context.newPage();
 let secondTabRequests=0;
 await second.route('**/api/shida/statistics/**',route=>{secondTabRequests++;return route.fulfill({status:204});});
 await second.goto('/en/privacy/');
 await second.bringToFront();
 // The accepted observer confirms hydration before using the server-rendered footer.
 await expect.poll(()=>secondTabRequests).toBeGreaterThan(0);
 await open(second);
 await preferences(second).getByRole('button',{name:t.decline,exact:true}).click();
 await second.close();
 await page.bringToFront();

 await preferences(page).getByRole('button',{name:t.save,exact:true}).click();
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).choice,STATISTICS_CHOICE_KEY)).toBe('declined');
 await open(page);
 await expect(preferences(page).getByRole('checkbox',{name:t.analytics})).not.toBeChecked();
});
