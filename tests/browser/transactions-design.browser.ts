import {test,expect,type BrowserContext} from '@playwright/test';
const output=process.env.TRANSACTIONS_EVIDENCE_DIR||'test-results/transactions-evidence';
async function signIn(context:BrowserContext,kind:string){await context.addCookies([{name:'nihiloba_personal_session',value:`transactions-acceptance-${kind}-session`,domain:'127.0.0.1',path:'/'}]);}
for(const kind of ['empty','one','many'])for(const width of [360,390,768,1440])test(`normal authorized APIs ${kind} ${width}`,async({page,context})=>{
 await signIn(context,kind);await page.setViewportSize({width,height:950});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/shida/space/?view=transactions');
 if(kind==='empty'){
  await expect(page.getByRole('heading',{name:'No transactions yet'})).toBeVisible();
  await expect(page.locator('.tx-summary strong')).toHaveText(['0','0','0']);
  await expect(page.locator('.tx-filters,.tx-pagination')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'Go to my activities'})).toHaveAttribute('href','/shida/space/?view=management');
 }else{
  await expect(page.locator('.tx-row')).toHaveCount(kind==='one'?1:8);
  await expect(page.locator('.tx-summary strong')).toHaveText(kind==='one'?['0','1','0']:['2','4','2']);
  await expect(page.getByRole('heading',{name:'No transactions yet'})).toHaveCount(0);
  if(kind==='many'){
   for(const type of ['wenze','food','reservation','application','booking','food_receipt','bill','service'])await expect(page.locator(`.tx-row[data-kind="${type}"]`)).toHaveCount(1);
   await expect(page.locator('.tx-row[data-kind="bill"]')).toContainText('$42.00');
   await expect(page.locator('.tx-row[data-kind="food_receipt"]')).toContainText('Order document');
  }
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
 await page.screenshot({path:`${output}/transactions-${kind}-${width}.png`,fullPage:true});
});
test('filters, dates, documents, keyboard and account switching',async({page,context})=>{
 await signIn(context,'many');await page.goto('/shida/space/?view=transactions');
 const orders=page.locator('.tx-filters').getByRole('button',{name:'Orders (2)'});await orders.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.tx-row')).toHaveCount(2);await expect(orders).toHaveAttribute('aria-pressed','true');
 await page.getByRole('combobox').selectOption('oldest');
 await expect(page.locator('.tx-row').first()).toHaveAttribute('data-kind','food');
 await page.locator('.tx-filters').getByRole('button',{name:'Documents (2)'}).click();await expect(page.locator('.tx-row')).toHaveCount(2);
 await expect(page.locator('.tx-row[data-kind="bill"] a')).toHaveAttribute('href',/\/shida\/service-bills\/RSV_/);
 await expect(page.locator('.tx-row[data-kind="food_receipt"] a')).toHaveAttribute('href',/\/shida\/restaurant-orders\/ROD_.*\/receipt/);
 await signIn(context,'empty');await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.getByRole('heading',{name:'No transactions yet'})).toBeVisible();await expect(page.locator('.tx-row')).toHaveCount(0);
});
for(const locale of ['fr','ln','sw'])test(`localized ${locale}`,async({page,context})=>{
 await signIn(context,'many');await page.goto(`/${locale}/shida/space/?view=transactions`);await expect(page.locator('.tx-row')).toHaveCount(8);
 await expect(page.locator('.tx-row[data-kind="application"] a')).toHaveAttribute('href',locale==='fr'?/\/fr\/shida\/mes-candidatures\//:new RegExp(`/${locale}/shida/my-applications/`));
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
 await expect(page.locator('.tx-summary strong')).toHaveText(['0','12','0']);
 await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.locator('.tx-overview').getByRole('alert')).toBeVisible();await expect(page.locator('.tx-row')).toHaveCount(0);
 fail=false;await page.getByRole('button',{name:'Try again'}).click();await expect(page.locator('.tx-row')).toHaveCount(2);await expect(page.getByRole('button',{name:'Next',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Previous',exact:true}).click();await expect(page.locator('.tx-row')).toHaveCount(10);
});
test('existing service bill and reservation detail routes resolve through normal APIs',async({page,context})=>{
 await signIn(context,'many');await page.goto('/shida/space/?view=transactions');const billResponse=page.waitForResponse(r=>r.url().includes('/api/shida/personal/services/transactions/customer/')&&r.status()!==308);await page.locator('.tx-row[data-kind="bill"] a').click();const billResult=await billResponse;expect(billResult.status(),await billResult.text()).toBe(200);
 await expect(page.locator('#main-content')).toContainText('42.00');
 await page.goto('/shida/space/?view=transactions');await page.locator('.tx-row[data-kind="reservation"] a').click();
 await expect(page.locator('.transaction-card')).toHaveCount(1);await expect(page.locator('.transaction-card')).toContainText('Acceptance Garden Kitchen');
});
