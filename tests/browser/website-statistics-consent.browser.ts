import {test,expect} from '@playwright/test';
import {statisticsCopy,STATISTICS_CHOICE_KEY,STATISTICS_VISITOR_KEY} from '../../app/lib/website-statistics-consent';

for(const locale of ['fr','en','ln','sw'] as const)for(const width of [360,1440])test(`recovery pauses optional collection ${locale} ${width}`,async({page,baseURL})=>{
 if(!baseURL||!['127.0.0.1','localhost','[::1]'].includes(new URL(baseURL).hostname))throw Error('Use an approved loopback Website');
 let sends=0;
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin!==new URL(baseURL).origin)return route.abort();
  if(url.pathname==='/api/shida/statistics/'){sends++;return route.fulfill({status:204});}
  return route.continue();
 });
 await page.addInitScript(({choice,visitor})=>{
  if(!localStorage.getItem(choice)){
   localStorage.setItem(choice,JSON.stringify({choice:'accepted',expires:Date.now()+86400000}));
   localStorage.setItem(visitor,'historical visitor');
  }
 },{choice:STATISTICS_CHOICE_KEY,visitor:STATISTICS_VISITOR_KEY});
 await page.setViewportSize({width,height:844});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/emplois/`);
 const t=statisticsCopy[locale],panel=page.locator('.website-statistics');
 const dialog=panel.getByRole('dialog',{name:t.title});
 await expect(dialog).toBeHidden();
 await expect(panel.getByRole('status')).toHaveText(t.blocked);
 const settings=panel.getByRole('button',{name:t.settings});
 await settings.click();
 await expect(dialog.getByText(t.blocked)).toBeVisible();
 await expect(dialog.getByRole('button')).toHaveCount(1);
 await page.keyboard.press('Escape');
 await expect(dialog).toBeHidden();await expect(settings).toBeFocused();
 expect(await page.evaluate(key=>localStorage.getItem(key),STATISTICS_VISITOR_KEY)).toBeNull();
 expect(sends).toBe(0);
});
