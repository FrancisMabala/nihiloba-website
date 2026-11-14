import {test,expect} from '@playwright/test';
import {signInReader} from './job-reader-session';

for(const width of [390,1440])for(const [slug,reference] of [['technical','JOB_technical'],['home-helper','JOB_home'],['report-external','JOB_airtel']]){
 test(`WhatsApp report handoff ${slug} ${width}`,async({page,context})=>{
  await page.setViewportSize({width,height:960});
  await signInReader(page);
  // Capture the destination locally: never contact WhatsApp or create a ticket.
  await context.route('https://wa.me/**',route=>route.fulfill({contentType:'text/plain',body:'Isolated handoff destination'}));
  await page.goto(`/fr/shida/emplois/${slug}`);
  const report=page.getByRole('link',{name:'Signaler l’offre',exact:true});
  await expect(report).toBeVisible();
  const href=await report.getAttribute('href');
  expect(new URL(href!).searchParams.get('text')).toContain(`SHIDA JOB REPORT ${reference} fr`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await report.scrollIntoViewIfNeeded();
  await page.screenshot({path:test.info().outputPath('report-link.png')});
  const original=page.url();
  const popupPromise=page.waitForEvent('popup');
  await report.click();
  const popup=await popupPromise;
  await expect(popup.locator('body')).toHaveText('Isolated handoff destination');
  expect(page.url()).toBe(original);
  await popup.close();
 });
}
