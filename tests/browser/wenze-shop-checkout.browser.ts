import {test,expect,type Page} from '@playwright/test';
import {checkoutText as copy} from '../../app/lib/wenze-checkout-copy';
import {posText} from '../../app/lib/wenze-pos-copy';
import {fixture,basket,addShirt} from './wenze-checkout-fixture';
async function screenshot(page:Page,name:string){await page.screenshot({path:`test-results/checkout-review/${name}.png`,fullPage:!(await page.locator('dialog[open]').count())});}
for(const width of [360,390,768,1024,1440])test(`integrated cash sale and receipt ${width}`,async({page})=>{
 const {writes,errors,url}=await fixture(page);await page.setViewportSize({width,height:960});await page.goto(url+'&view=sales');
 await expect(page.locator('.wz-pos-product')).toHaveCount(3);await screenshot(page,`${width}-catalog`);
 await addShirt(page,'fr');const cart=await basket(page);await cart.getByRole('button',{name:/Augmenter/}).click();
 await expect(cart.getByRole('spinbutton')).toHaveValue('2');await expect(cart.getByRole('checkbox')).toHaveCount(0);
 const submit=cart.getByRole('button',{name:copy('fr','confirm'),exact:true});await expect(submit).toBeDisabled();
 await cart.getByRole('button',{name:copy('fr','cash'),exact:true}).click();await expect(submit).toBeDisabled();
 await cart.getByLabel('Montant reçu · CDF').fill('20000');await expect(submit).toBeDisabled();
 const amount=await cart.getByLabel('Montant reçu · CDF').boundingBox();const calculator=await cart.getByRole('button',{name:'Calculatrice · CDF',exact:true}).boundingBox();
 expect(amount).not.toBeNull();expect(calculator).not.toBeNull();expect(calculator!.y).toBeGreaterThanOrEqual(amount!.y+amount!.height+6);
 await cart.getByRole('button',{name:'Calculatrice · CDF',exact:true}).click();const keypad=width<761?page.getByRole('dialog',{name:'Calculatrice'}):cart;
 await keypad.getByRole('button',{name:copy('fr','clear'),exact:true}).click();for(const digit of ['5','0','0','0','0'])await keypad.getByRole('button',{name:digit,exact:true}).click();
 await expect(keypad.getByLabel('Montant reçu · CDF')).toHaveValue('50000');await screenshot(page,`${width}-calculator`);
 if(width<761){await expect(page.locator('dialog[open]')).toHaveCount(1);await keypad.getByRole('button',{name:copy('fr','done'),exact:true}).click();}
 await expect(cart.locator('.wz-cash-row strong')).toHaveText('20 000 CDF');await screenshot(page,`${width}-basket`);expect(writes).toHaveLength(0);
 await submit.click();await expect(page.locator('.wz-success-confirmation')).toBeVisible();await expect(page.locator('.wz-receipt-paper')).toHaveCount(0);await screenshot(page,`${width}-success`);
 expect(writes).toHaveLength(1);expect(writes[0].body).toMatchObject({payment:'seller_recorded_cash',payment_details:{received:{CDF:'50000'}},lines:[{variant_ref:'WNV_medium',quantity:2}]});
 await page.locator('.wz-success-confirmation').getByRole('button').first().click();await expect(page.locator('.wz-receipt-paper')).toBeVisible();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:posText('fr','download'),exact:true}).click();expect((await download).suggestedFilename()).toBe('receipt.pdf');
 await screenshot(page,`${width}-receipt`);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
for(const locale of ['en','fr','ln','sw'] as const)for(const failure of ['server','truncated','network'])test(`safe retry ${locale} failure=${failure}`,async({page})=>{
 const {writes,errors,url}=await fixture(page,{retry:failure==='server',truncated:failure==='truncated',network:failure==='network',locale});await page.setViewportSize({width:390,height:900});await page.goto(url+'&view=sales');
 await page.getByRole('group',{name:copy(locale,'category'),exact:true}).getByRole('button').nth(2).click();await expect(page.locator('.wz-pos-product')).toHaveCount(1);await page.locator('.wz-pos-product-button').click();
 const cart=await basket(page);await cart.getByRole('button',{name:copy(locale,'card'),exact:true}).click();await cart.getByLabel(copy(locale,'reference'),{exact:true}).fill('TEST-TERMINAL-7');
 await cart.getByRole('button',{name:copy(locale,'confirm'),exact:true}).click();const dialog=page.getByRole('dialog',{name:copy(locale,'saleError')});await expect(dialog.getByRole('alert')).toHaveText(posText(locale,'uncertain'));
 await expect(page.locator('.wz-success-confirmation')).toHaveCount(0);await expect(page.locator('.wz-receipt-paper')).toHaveCount(0);await screenshot(page,`${locale}-error-${failure}`);
 await dialog.getByRole('button',{name:posText(locale,'retry'),exact:true}).click();await expect(page.locator('.wz-success-confirmation')).toBeVisible();expect(writes).toHaveLength(2);expect(writes[0]).toEqual(writes[1]);expect(writes[0].key).toBeTruthy();expect(errors).toEqual([]);
});
test('mixed currencies, mobile money, stock limits, close and clear basket',async({page})=>{
 const {writes,url}=await fixture(page);await page.setViewportSize({width:390,height:900});await page.goto(url+'&view=sales');await addShirt(page,'fr');await page.locator('.wz-pos-product-button').filter({hasText:'Savon doux'}).click();
 let cart=await basket(page);const increase=cart.getByRole('button',{name:/Augmenter.*Chemise/});await increase.click();await increase.click();await expect(increase).toBeDisabled();
 await cart.getByRole('button',{name:copy('fr','cash'),exact:true}).click();await cart.getByLabel('Montant reçu · CDF').fill('45000');await expect(cart.getByRole('button',{name:copy('fr','confirm')})).toBeDisabled();await cart.getByLabel('Montant reçu · USD').fill('5.50');await expect(cart.getByRole('button',{name:copy('fr','confirm')})).toBeEnabled();
 await page.getByRole('dialog').getByRole('button',{name:'Fermer',exact:true}).click();cart=await basket(page);await expect(cart.getByLabel('Montant reçu · USD')).toHaveValue('5.50');
 await cart.getByRole('button',{name:'Mobile Money',exact:true}).click();await cart.getByLabel(copy('fr','provider')).fill('Test provider');await cart.getByRole('button',{name:copy('fr','confirm')}).click();await expect(page.locator('.wz-success-confirmation')).toBeVisible();expect(writes[0].body).toMatchObject({payment:'seller_recorded_mobile',payment_details:{provider:'Test provider'}});expect(writes[0].body.lines).toHaveLength(2);
});
test('online-only shop retains receipts without counter',async({page})=>{
 const {writes,url}=await fixture(page,{online:true});await page.goto(url+'&view=sales');await expect(page.locator('.wz-pos')).toHaveCount(0);await page.goto(url+'&view=receipts');await page.locator('.wz-receipt-history').click();await expect(page.locator('.wz-receipt-paper')).toBeVisible();await expect(page.locator('.wz-success-confirmation')).toHaveCount(0);expect(writes).toHaveLength(0);
});

test('barcode, remove, clear, known rejection and preserved payment',async({page})=>{
 const {url,writes}=await fixture(page,{locale:'en',reject:true});await page.goto(url+'&view=sales');
 await page.locator('.wz-checkout-search input').fill('WNP_soap');await page.locator('.wz-checkout-search button').click();const cart=await basket(page);await expect(cart.locator('.wz-checkout-line')).toHaveCount(1);
 await cart.getByRole('button',{name:'Remove',exact:true}).click();await expect(cart.locator('.wz-checkout-line')).toHaveCount(0);
 await page.locator('.wz-pos-product-button').filter({hasText:'Savon doux'}).click();await cart.getByRole('button',{name:'Clear basket',exact:true}).click();await expect(cart.locator('.wz-checkout-line')).toHaveCount(0);
 await page.locator('.wz-pos-product-button').filter({hasText:'Savon doux'}).click();await cart.getByRole('button',{name:'Cash',exact:true}).click();await cart.getByLabel('Amount received · USD').fill('10');await cart.getByRole('button',{name:'Record payment received'}).click();
 const error=page.getByRole('dialog',{name:'Could not record the sale'});await expect(error).toBeVisible();await error.getByRole('button',{name:'Cancel',exact:true}).click();await expect(cart.getByLabel('Amount received · USD')).toHaveValue('10');await expect(cart.getByLabel('Amount received · USD')).toBeEnabled();
 await cart.getByRole('button',{name:'Record payment received'}).click();await expect(page.locator('.wz-success-confirmation')).toBeVisible();expect(writes).toHaveLength(2);expect(writes[0].key).not.toEqual(writes[1].key);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.wz-success-check')).toHaveCSS('animation-name','none');
 await page.locator('.wz-success-confirmation').getByRole('button').first().click();const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Print',exact:true}).click();await (await popup).close();
});

for(const width of [360,390,768,1024,1440])test(`large mixed currency amounts and calculator alignment ${width}`,async({page})=>{
 const {url}=await fixture(page,{locale:'fr'});await page.setViewportSize({width,height:960});await page.goto(url+'&view=sales');
 await addShirt(page,'fr');await page.locator('.wz-pos-product-button').filter({hasText:'Savon doux'}).click();const cart=await basket(page);
 await cart.getByRole('button',{name:copy('fr','cash'),exact:true}).click();
 for(const currency of ['CDF','USD']){
  const input=cart.getByLabel('Montant reçu · '+currency);await input.fill('999999999.99');
  const amount=await input.boundingBox(),calc=await cart.getByRole('button',{name:'Calculatrice · '+currency,exact:true}).boundingBox();
  expect(calc!.y).toBeGreaterThanOrEqual(amount!.y+amount!.height+6);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await screenshot(page,`${width}-large-mixed`);
});
for(const width of [390,1440])test(`history is secondary and reversal remains contextual ${width}`,async({page})=>{
 const {url}=await fixture(page,{locale:'en'});await page.setViewportSize({width,height:960});
 await page.route('**/api/**/physical-sales/priced/**',route=>route.fulfill({json:{sales:[{sale_ref:'SALE_one',target_label:'Controlled sale',quantity:2,total_revenue:'30000',currency:'CDF',gross_profit:'10000',status:'active',completed_at:'2026-10-31T09:00:00Z'},{sale_ref:'SALE_two',target_label:'Corrected sale',quantity:1,total_revenue:'15000',currency:'CDF',gross_profit:null,status:'reversed',completed_at:'2026-10-30T09:00:00Z',reversal_ref:'REV_two'}]}}));
 await page.goto(url+'&view=sales');const history=page.locator('.wz-legacy-sales');await expect(history).not.toHaveAttribute('open','');
 await screenshot(page,`${width}-history-collapsed`);await history.locator(':scope > summary').click();await expect(history.locator('input:visible')).toHaveCount(0);
 await expect(history.locator('.wz-history-status')).toHaveText(['Active','Reversed']);await screenshot(page,`${width}-history-expanded`);
 await history.locator('.wz-history-action summary').first().click();await expect(history.getByRole('combobox',{name:'Reason'})).toBeVisible();await expect(history.getByRole('textbox')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await screenshot(page,`${width}-history-action`);
 await history.getByRole('button',{name:'Reverse entry',exact:true}).click();const confirm=page.getByRole('dialog',{name:'Confirm this operation?',exact:true});await expect(confirm).toBeVisible();await confirm.getByRole('button',{name:'Cancel',exact:true}).click();await expect(confirm).not.toBeVisible();
 await history.locator('.wz-history-action summary').last().click();await history.getByRole('button',{name:'Replace reversed entry',exact:true}).click();await expect(history.locator('.wz-history-tools > details').last()).toHaveAttribute('open','');
});
