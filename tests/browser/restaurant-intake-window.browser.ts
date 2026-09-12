import {test,expect} from '@playwright/test';
import {fixture} from './restaurant-c1e-fixture';
import {workText,intakeErrorCodes} from '../../app/lib/restaurant-work-copy';
for(const locale of ['en','fr','ln','sw'] as const) test(`Personal intake errors and retained values: ${locale}`,async({page})=>{
 await fixture(page);await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants`);await page.locator('.rst-grid .rst-card button').first().click();
 const t=(k:string)=>workText(locale,k);
 await page.route('**/RST_fixture/order-configuration/',r=>r.fulfill({json:{revision:'2026-09-10T06:30:00Z',intake_released:true,pickup:{enabled:true,windows:[{starts_at:'2026-09-10T08:30:00Z',ends_at:'2026-09-10T15:00:00Z'}]},delivery:null}}));
 await page.getByRole('button',{name:t('intake'),exact:true}).click();
 const inputs=page.locator('input[type=datetime-local]');await expect(inputs).toHaveCount(2);
 await inputs.first().fill('2026-09-10T08:30');
 const values=await inputs.evaluateAll(nodes=>nodes.map(n=>(n as HTMLInputElement).value));
 for(const code of intakeErrorCodes){
  await page.route('**/RST_fixture/pickup-intake/',r=>r.fulfill({status:['restaurant_stale','restaurant_intake_closed'].includes(code)?409:422,json:{detail:code}}));
  const review=page.getByRole('button',{name:t('review'),exact:true});if(await review.isVisible())await review.click();
  await page.getByRole('button',{name:t('confirm'),exact:true}).click();
  await expect(page.getByText(t(code),{exact:true})).toBeVisible();
  expect(await inputs.evaluateAll(nodes=>nodes.map(n=>(n as HTMLInputElement).value))).toEqual(values);
  if(['restaurant_stale','restaurant_intake_closed'].includes(code)){
   await expect(page.getByRole('button',{name:t('retry'),exact:true})).toBeDisabled();
   await page.getByRole('button',{name:t('refresh'),exact:true}).click();
   await expect(review).toBeEnabled();
   expect(await inputs.evaluateAll(nodes=>nodes.map(n=>(n as HTMLInputElement).value))).toEqual(values);
  }
 }
});
