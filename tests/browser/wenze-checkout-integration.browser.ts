import {test,expect} from '@playwright/test';
import {fixture,basket} from './wenze-checkout-fixture';
test('real backend: products → payment → committed sale → receipt',async({page,request})=>{
 const bridge=process.env.WENZE_TEST_BRIDGE;
 expect(bridge).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
 const {url}=await fixture(page,{locale:'en'});
 // Authentication is the existing backend fixture seam. All POS operations,
 // including receipt/PDF/stock, use the real protected backend route/service.
 await page.route('**/api/**/pos/**',async route=>{
  const original=route.request(),path=new URL(original.url()).pathname;
  const suffix=path.slice(path.indexOf('/pos/')).replace(/\/$/,'')+new URL(original.url()).search;
  const response=await request.fetch(bridge+suffix,{method:original.method(),data:original.postDataBuffer()??undefined,
   headers:{'Content-Type':'application/json','Idempotency-Key':original.headers()['idempotency-key']??''}});
  await route.fulfill({response});
 });
 await page.setViewportSize({width:1440,height:1000});await page.goto(url+'&view=sales');
 for(const method of ['Cash','Mobile Money','Card']){
  await expect(page.locator('.wz-pos-product')).toHaveCount(2);
  await page.locator('.wz-pos-product-button').filter({hasText:'Juice'}).click();
  await page.locator('.wz-pos-product-button').filter({hasText:'Controlled basket second product'}).click();
  const cart=await basket(page);await cart.getByRole('button',{name:/Increase quantity Juice/}).click();
  await cart.getByRole('button',{name:method,exact:true}).click();
  if(method==='Cash')await cart.getByLabel('Amount received · CDF').fill('10000');
  else await cart.getByLabel('Transaction reference (optional)').fill('CONTROLLED-EXTERNAL');
  await cart.getByRole('button',{name:'Record payment received',exact:true}).click();
  if(method==='Cash'){
   await expect(page.getByRole('dialog',{name:'Could not record the sale'})).toBeVisible();
   await expect(page.locator('.wz-success-confirmation')).toHaveCount(0);
   await page.locator('.wz-sale-error').getByRole('button').first().click();
  }
  const success=page.locator('.wz-success-confirmation');await expect(success).toBeVisible();await expect(success).toContainText('9,000 CDF');
  await page.screenshot({path:`test-results/checkout-review/real-${method}-success.png`});
  await success.getByRole('button').first().click();const receipt=page.locator('.wz-receipt-paper');await expect(receipt).toContainText('Payment method: '+method);await expect(receipt).toContainText('9,000 CDF');
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();await (await download).saveAs(`test-results/checkout-review/real-${method}.pdf`);
  await page.screenshot({path:`test-results/checkout-review/real-${method}-receipt.png`});
  await page.getByRole('dialog').locator('header').first().getByRole('button',{name:'Close',exact:true}).click();
 }
 const history=await request.get(bridge+'/pos/receipts');expect((await history.json()).total).toBe(3);
 const stock=await request.get(bridge+'/pos/catalog');const items=(await stock.json()).items;
 expect(items.find((item:{name:string})=>item.name==='Juice').available).toBe(4);
 expect(items.find((item:{name:string})=>item.name==='Controlled basket second product').available).toBe(7);
});
