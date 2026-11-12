import {test,expect,type BrowserContext} from '@playwright/test';
const output=process.env.TRANSACTIONS_EVIDENCE_DIR||'test-results/transactions-evidence';
async function signIn(context:BrowserContext,kind:string){await context.addCookies([{name:'nihiloba_personal_session',value:`transactions-acceptance-${kind}-session`,domain:'127.0.0.1',path:'/'}]);}
for(const kind of ['empty','one','many'])for(const width of [360,390,768,1024,1440])test(`normal authorized APIs ${kind} ${width}`,async({page,context})=>{
 await signIn(context,kind);await page.setViewportSize({width,height:950});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/shida/space/?view=transactions');
 if(kind==='empty'){
  await expect(page.getByRole('heading',{name:'No transactions yet'})).toBeVisible();
  await expect(page.locator('.tx-summary strong')).toHaveText(['0','0','0']);
  await expect(page.locator('.tx-filters:not(.tx-roles),.tx-pagination')).toHaveCount(0);
  await expect(page.locator('.tx-empty a')).toHaveAttribute('href','/shida/');
 }else{
  await expect(page.locator('.tx-row')).toHaveCount(kind==='one'?1:2);
  await expect(page.locator('.tx-summary strong')).toHaveText(kind==='one'?['1','0','0']:['2','3','2']);
  await expect(page.getByRole('heading',{name:'No transactions yet'})).toHaveCount(0);
  if(kind==='many'){
   await expect(page.locator('[data-kind="wenze"]')).toContainText('Long-sleeve shirt');
   await expect(page.locator('[data-kind="food"]')).toContainText('Grilled chicken and rice');
  }else{
   await page.locator('.tx-summary-documents').click();await expect(page.getByText('No receipts or invoices yet')).toBeVisible();
   await expect(page.locator('.tx-summary-orders strong')).toHaveText('1');
  }
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
 await expect(page.locator('.space-content > .space-eyebrow')).toHaveCount(0);
 await expect(page.locator('button.market-avatar:visible').first()).toBeVisible();
 await page.screenshot({path:`${output}/transactions-${kind}-${width}.png`,fullPage:true});
});
test('filters, dates, documents, keyboard and account switching',async({page,context})=>{
 await signIn(context,'many');await page.goto('/shida/space/?view=transactions');
 const orders=page.locator('.tx-summary-orders');await orders.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.tx-row')).toHaveCount(2);await expect(orders).toHaveAttribute('aria-pressed','true');
 await page.getByRole('combobox').selectOption('oldest');
 await expect(page.locator('.tx-row').first()).toHaveAttribute('data-kind','food');
 await page.locator('.tx-summary-documents').click();await expect(page.locator('.tx-row')).toHaveCount(2);
 await expect(page.locator('.tx-row[data-kind="bill"] a')).toHaveAttribute('href',/\/shida\/service-bills\/RSV_/);
 await expect(page.locator('.tx-row[data-kind="food_receipt"] a')).toHaveAttribute('href',/\/shida\/restaurant-orders\/ROD_.*\/receipt/);
 await signIn(context,'empty');await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.getByRole('heading',{name:'No transactions yet'})).toBeVisible();await expect(page.locator('.tx-row')).toHaveCount(0);
});
for(const locale of ['fr','ln','sw'])test(`localized ${locale}`,async({page,context})=>{
 await signIn(context,'many');await page.goto(`/${locale}/shida/space/?view=transactions`);await expect(page.locator('.tx-row')).toHaveCount(2);
 await expect(page.locator('[data-kind="application"]')).toHaveCount(0);
 await expect(page.locator('.tx-overview')).not.toContainText('under_review');
});
test('failed and partial responses never become an empty state',async({page,context})=>{
 await signIn(context,'empty');let mode='failed';
 await page.route('**/api/shida/personal/transactions/**',route=>mode==='failed'?route.fulfill({status:503,json:{detail:'unavailable'}}):mode==='partial'?route.fulfill({json:{counts:{orders:0},items:[]}}):route.continue());
 await page.goto('/shida/space/?view=transactions');await expect(page.locator('.tx-overview').getByRole('alert')).toBeVisible();await expect(page.getByRole('heading',{name:'No transactions yet'})).toHaveCount(0);
 mode='partial';await page.getByRole('button',{name:'Try again'}).click();await expect(page.locator('.tx-overview').getByRole('alert')).toBeVisible();await expect(page.locator('.tx-summary strong')).toHaveText(['—','—','—']);
 mode='normal';await page.getByRole('button',{name:'Try again'}).click();await expect(page.getByRole('heading',{name:'No transactions yet'})).toBeVisible();
});
test('real pagination, failed next page and retry',async({page,context})=>{
 await signIn(context,'pages');let fail=true;
 await page.route('**/api/shida/personal/transactions/**',route=>new URL(route.request().url()).searchParams.get('page')==='2'&&fail?route.fulfill({status:503,json:{detail:'unavailable'}}):route.continue());
 await page.goto('/shida/space/?view=transactions');await expect(page.locator('.tx-row')).toHaveCount(10);
 await expect(page.locator('.tx-summary strong')).toHaveText(['12','0','0']);
 await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.locator('.tx-overview').getByRole('alert')).toBeVisible();await expect(page.locator('.tx-row')).toHaveCount(0);
 fail=false;await page.getByRole('button',{name:'Try again'}).click();await expect(page.locator('.tx-row')).toHaveCount(2);await expect(page.getByRole('button',{name:'Next',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Previous',exact:true}).click();await expect(page.locator('.tx-row')).toHaveCount(10);
});
test('existing service bill and reservation detail routes resolve through normal APIs',async({page,context})=>{
 await signIn(context,'many');await page.goto('/shida/space/?view=transactions');await page.locator('.tx-summary-documents').click();const billResponse=page.waitForResponse(r=>r.url().includes('/api/shida/personal/services/transactions/customer/')&&r.status()!==308);await page.locator('.tx-row[data-kind="bill"] a').click();const billResult=await billResponse;expect(billResult.status(),await billResult.text()).toBe(200);
 await expect(page.locator('#main-content')).toContainText('42.00');
 await page.goto('/shida/space/?view=transactions');await page.locator('.tx-summary-requests').click();await page.locator('.tx-row[data-kind="reservation"] a').click();
 await expect(page.locator('.transaction-card')).toHaveCount(1);await expect(page.locator('.transaction-card')).toContainText('Acceptance Garden Kitchen');
});

for(const width of [360,1440])test(`summary navigation and state evidence ${width}`,async({page,context})=>{
 await signIn(context,'many');await page.setViewportSize({width,height:950});
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/shida/personal/transactions/**',async route=>{await pending;await route.continue();});
 await page.goto('/shida/space/?view=transactions');
 await expect(page.locator('.tx-overview [role="status"]')).toContainText('Loading');
 await expect(page.locator('.tx-summary strong')).toHaveText(['—','—','—']);
 await page.screenshot({path:`${output}/transactions-loading-${width}.png`,fullPage:true});
 release();await expect(page.locator('.tx-row')).toHaveCount(2);
 for(const [category,count] of [['orders',2],['requests',3],['documents',2]] as const){
  await page.locator(`.tx-summary-${category}`).click();
  await expect(page.locator(`.tx-summary-${category}`)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.tx-row')).toHaveCount(count);
  await page.screenshot({path:`${output}/transactions-${category}-${width}.png`,fullPage:true});
 }
 await page.unroute('**/api/shida/personal/transactions/**');
 await page.route('**/api/shida/personal/transactions/**',route=>route.fulfill({status:503,json:{detail:'unavailable'}}));
 await page.reload();await expect(page.locator('.tx-overview [role="alert"]')).toBeVisible();
 await expect(page.getByRole('heading',{name:'No transactions yet'})).toHaveCount(0);
 await page.screenshot({path:`${output}/transactions-error-${width}.png`,fullPage:true});
});

for (const width of [360, 1440]) for (const kind of ['food', 'wenze']) test(`shared selected order ${kind} ${width}`, async ({page, context}) => {
 await signIn(context, 'many'); await page.setViewportSize({width, height:950});
 await page.goto('/shida/space/?view=transactions');
 const trigger=page.locator(`.tx-row[data-kind="${kind}"] button`);
 await trigger.click();
 await expect(page.locator('.tx-selected')).toBeFocused();
 await expect(page.locator('.tx-selected .shida-order-detail')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`${output}/selected-${kind}-${width}.png`,fullPage:true});
 await page.locator('.tx-selected > button').click();
 await expect(trigger).toBeFocused();
 await trigger.click();
 await signIn(context,'empty'); await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.locator('.tx-selected')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'No transactions yet'})).toBeVisible();
});

test('restaurant receipt retries its canonical endpoint without fetching handover secrets',async({page,context})=>{
 await signIn(context,'many');
 await page.goto('/shida/space/?view=transactions');
 await page.locator('.tx-summary-documents').click();
 const receiptHref=await page.locator('.tx-row[data-kind="food_receipt"] a').getAttribute('href');
 expect(receiptHref).toBeTruthy();
 let fail=true;let attempts=0;const privateRequests:string[]=[];
 page.on('request',request=>{if(/\/(pickup-code|delivery-code|destination)\//.test(request.url()))privateRequests.push(request.url());});
 await page.route('**/api/shida/personal/restaurant-orders/*/receipt/**',async route=>{
  attempts++;if(fail)await route.fulfill({status:503,json:{detail:'temporary_failure'}});else await route.continue();
 });
 await page.goto(receiptHref!);
 const retry=page.getByRole('button',{name:/try again|retry/i});
 await expect(retry).toBeVisible();expect(attempts).toBe(1);
 fail=false;await retry.click();
 await expect(page.locator('.rst-thermal')).toBeVisible();
 expect(attempts).toBe(2);expect(privateRequests).toEqual([]);
 await expect(page.locator('.rst-thermal')).toContainText('Commercial receipt');
});

test('preparing restaurant order requests cancellation, retains failures and retries the same operation',async({page,context})=>{
 await signIn(context,'many');
 let attempts=0;const keys:string[]=[];
 await page.route('**/api/shida/personal/restaurant-orders/*/actions/request_cancellation/**',async route=>{
  attempts++;keys.push(route.request().postDataJSON().operation_key);
  await route.fulfill({status:503,json:{detail:'temporary_failure'}});
 });
 await page.goto('/shida/space/?view=transactions');
 await page.locator('.tx-row[data-kind="food"] button').click();
 const cancel=page.locator('.tx-selected button').filter({hasText:/^Request cancellation$/});
 await cancel.click();
 const dialog=page.getByRole('dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('button',{name:'Keep the order'})).toBeFocused();
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);expect(attempts).toBe(0);
 await cancel.click();
 await dialog.getByRole('button',{name:'Request cancellation',exact:true}).click();
 await expect(dialog.getByRole('alert')).toBeVisible();expect(attempts).toBe(1);
 await dialog.getByRole('button',{name:'Request cancellation',exact:true}).click();
 await expect.poll(()=>attempts).toBe(2);expect(keys[0]).toBe(keys[1]);
 await expect(dialog).toBeVisible();
});

for(const width of [360,1440])test(`personal listing sale and boutique isolation ${width}`,async({page,context})=>{
 await signIn(context,'seller');await page.setViewportSize({width,height:920});
 await page.goto('/fr/shida/space/?view=transactions');await page.getByRole('button',{name:'Mes ventes personnelles'}).click();
 await expect(page.locator('.tx-row')).toHaveCount(1);await expect(page.locator('.tx-row')).toContainText('Wooden chair');
 await expect(page.locator('.tx-row')).not.toContainText('Long-sleeve shirt');
 await page.screenshot({path:`${output}/personal-sale-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Voir la vente'}).click();await expect(page.locator('.wo-detail-item')).toContainText('Wooden chair');await expect(page.locator('.wo-payment-detail')).toContainText('Espèces reçues');
 await page.goBack();await expect(page.locator('.tx-summary-orders')).toHaveAttribute('aria-pressed','true');
});
