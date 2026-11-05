import {test, expect} from '@playwright/test';
import {apartmentSafetyCopy} from '../../app/lib/apartment-safety-copy';
for (const width of [390,1440]) for (const locale of ['en','fr','ln','sw'] as const) {
 test(`private apartment report ${locale} ${width}`, async({page}) => {
  await page.setViewportSize({width,height:900});
  const writes:unknown[] = [];
  await page.route('**/api/shida/**', route => {
   const path = new URL(route.request().url()).pathname;
   if(path.includes('/employment/session')) return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Test visitor'}}});
   if(path.includes('/support/apartment-report')) {writes.push(route.request().postDataJSON()); return route.fulfill({json:{reference:'SCT_fixture',status:'persisted'}});}
   return route.fulfill({status:404,json:{}});
  });
  await page.goto(`${locale === 'en' ? '' : '/'+locale}/shida/appartements/limete-fixture/`);
  const t = apartmentSafetyCopy[locale];
  await expect(page.getByRole('heading',{name:t.title})).toBeVisible();
  await expect(page.getByText(t.property,{exact:true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button',{name:t.report,exact:true}).click();
  await expect(page.getByRole('dialog',{name:t.report})).toBeVisible();
  await page.getByLabel(t.description,{exact:true}).fill('Controlled misleading listing report');
  await page.getByRole('button',{name:t.send,exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:t.saved})).toBeVisible();
  expect(writes).toEqual([{listing_ref:'APT_fixture',reason:'false_property',message:'Controlled misleading listing report',language:locale}]);
  await page.getByRole('dialog').getByRole('button',{name:t.close,exact:true}).last().click();
  if(locale === 'fr') await page.screenshot({path:`test-results/apartments-batch2-${width}.png`,fullPage:true});
 });
}
