import {test,expect} from '@playwright/test';

test('an employer page observes visible visits with separate receipts and company-scoped sessions', async ({page})=>{
  const events:Record<string,string>[] = [];
  await page.route('**/api/shida/employer-pages/*/view/',route=>{
    events.push(route.request().headers());
    return route.fulfill({status:204});
  });
  const open = (ref:string)=>page.goto('/fr/shida/emplois/employeurs/ORGDIR_'+ref);
  await open('one');
  await expect.poll(()=>events.length).toBe(1);
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.reload();
  await expect.poll(()=>events.length).toBe(2);
  expect(events[1]['x-shida-event']).not.toBe(events[0]['x-shida-event']);
  expect(events[1]['x-shida-visitor']).toBe(events[0]['x-shida-visitor']);
  await open('two');
  await expect.poll(()=>events.length).toBe(3);
  expect(events[2]['x-shida-visitor']).not.toBe(events[0]['x-shida-visitor']);
  await page.addInitScript(()=>Object.defineProperty(navigator,'doNotTrack',{value:'1'}));
  await open('private');
  await page.waitForLoadState('networkidle');
  expect(events).toHaveLength(3);
});
