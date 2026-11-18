# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: restaurant-panel-recovery.browser.ts >> baseline actual Orders chunk failure 390
- Location: tests\browser\restaurant-panel-recovery.browser.ts:13:80

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Application error: a client-side exception/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/Application error: a client-side exception/) with timeout 5000ms
  - waiting for getByText(/Application error: a client-side exception/)

```

```yaml
- img
- heading "This page couldn’t load" [level=1]
- paragraph: Reload to try again, or go back.
- button "Reload"
- button "Back"
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
  3  | import {join} from 'node:path';
  4  | import {restaurantPanelFixture} from './restaurant-panel-fixtures';
  5  |
  6  | function chunkFor(marker:string){
  7  |  const root=join(process.cwd(),'.next','static','chunks');
  8  |  const matches=readdirSync(root,{recursive:true}).map(String).filter(file=>file.endsWith('.js')&&readFileSync(join(root,file),'utf8').includes(marker));
  9  |  expect(matches,`unique production panel chunk for ${marker}`).toHaveLength(1);
  10 |  return '/_next/static/chunks/'+matches[0].replaceAll('\\','/');
  11 | }
  12 |
  13 | if(process.env.PANEL_RECOVERY_BASELINE==='1')for(const width of [390,1440])test(`baseline actual Orders chunk failure ${width}`,async({page})=>{
  14 |  await restaurantPanelFixture(page);await page.setViewportSize({width,height:900});
  15 |  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  16 |  await page.goto('/fr/shida/seller/restaurants/?establishment=RST_0&tab=today');
  17 |  await expect(page.locator('.rst-ops-updated')).toBeVisible();
  18 |  const path=chunkFor('rst-orders-screen');let attempts=0;let fail=true;
  19 |  await page.route('**'+path,route=>{attempts++;return fail?route.abort('failed'):route.continue();});
  20 |  await page.locator('.rst-metric-incoming > button').click();
  21 |  await expect.poll(()=>attempts).toBe(1);
> 22 |  await expect(page.getByText(/Application error: a client-side exception/)).toBeVisible();
     |                                                                             ^ Error: expect(locator).toBeVisible() failed
  23 |  fail=false;await page.waitForTimeout(1000);
  24 |  await expect(page.locator('.rst-management')).toHaveCount(0);
  25 |  const output=process.env.PERF_OUTPUT!;mkdirSync(output,{recursive:true});
  26 |  await page.screenshot({path:join(output,`download-failed-${width}.png`),fullPage:true});
  27 |  const observation={width,path,attempts,errors,headerVisible:await page.locator('.wz-header').count(),workspaceVisible:await page.locator('.rst-management').count(),retryButtons:await page.getByRole('button').allTextContents(),restoredDownloadDidNotRecover:await page.getByText(/Application error: a client-side exception/).isVisible()};
  28 |  writeFileSync(join(output,`download-failed-${width}.json`),JSON.stringify(observation,null,2));
  29 |  await page.reload();await expect(page.locator('.rst-orders-screen')).toBeVisible();
  30 | });
  31 |
```
