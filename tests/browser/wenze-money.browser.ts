import {readFile} from 'node:fs/promises';
import {test,expect,type Page} from '@playwright/test';
import {fixture} from './wenze-checkout-fixture';
import {item} from './wenze-products-fixture';
type Scenario='complete'|'incomplete'|'empty'|'mixed';
function summary(currency:string,partial:boolean){return{currency,combined_sales:{total_revenue:currency==='CDF'?'30000':'85',known_gross_profit:currency==='CDF'?'10000':'25',sale_facts_count:2,sales_missing_cost:partial?1:0},recorded_operating_expenses:{total:currency==='CDF'?'2000':'5',expense_count:2,top_categories:[{category:'RENT',total_expenses:currency==='CDF'?'1500':'3'},{category:'TRANSPORT',total_expenses:currency==='CDF'?'500':'2'}]},operational_result:currency==='CDF'?'8000':'20',completeness:{profit_complete:!partial,operational_result_complete:!partial,revenue_cost_coverage_percent:partial?'50':'100'}};}
async function moneyFixture(page:Page,scenario:Scenario='incomplete',locale:'en'|'fr'|'ln'|'sw'='en'){
 const f=await fixture(page,{locale});const writes:{path:string;body:Record<string,unknown>}[]=[];let cost:{revision:number;unit_cost:string|null;currency:string|null}={revision:1,unit_cost:'5000',currency:'CDF'},lamp:{revision:number;unit_cost:string|null;currency:string|null}={revision:0,unit_cost:null,currency:null},expenseRows:Record<string,unknown>[]=scenario==='empty'?[]:[{expense_ref:'EXP_fixture',category:'RENT',amount:'2000',currency:'CDF',occurred_on:'2026-10-30',note:'Controlled test expense',status:'active'}],schedules:Record<string,unknown>[]=[{frequency:'weekly',enabled:true,status:'active',formats:['pdf','whatsapp_summary'],next_run_at:'2026-11-02T08:00:00Z',timezone:'UTC',revision:1}];
 const currencies=scenario==='empty'?[]:[summary('CDF',scenario!=='complete'),...(scenario==='mixed'?[summary('USD',false)]:[])];
 const data={can_edit_finances:true,missing_cost_currencies:['CDF'],store_ref:'WNZ_fixture',period:{date_from:'2026-10-01',date_to:'2026-10-31'},currency_summaries:currencies,comparison:{period:{date_from:'2026-09-01',date_to:'2026-09-30'},currency_summaries:currencies.map(r=>({currency:r.currency,revenue:{current:r.combined_sales.total_revenue,previous:'0',percentage_change:null},known_gross_profit:{current:r.combined_sales.known_gross_profit,previous:'0'},recorded_operating_expenses:{current:r.recorded_operating_expenses.total,previous:'0'},completeness:{previous_sales_missing_cost:0}}))},top_items:{top_by_revenue:currencies.map(r=>({currency:r.currency,items:[{label:'Controlled test product',revenue:r.combined_sales.total_revenue,channel_breakdown:{physical:{quantity:2},marketplace:{quantity:0}}}]}))},current_inventory:{currency_summaries:[]}};
 await page.route('**/api/**/stores/WNZ_fixture/**',async route=>{const path=new URL(route.request().url()).pathname.replace(/\/$/,'');if(route.request().method()!=='GET'){const body=route.request().postDataJSON();writes.push({path,body});if(path.endsWith('/private-cost')){const isLamp=path.includes('WNP_missing'),previous=isLamp?lamp:cost;const next={revision:previous.revision+1,unit_cost:body.amount==null?null:String(body.amount),currency:body.currency==null?null:String(body.currency)};if(isLamp)lamp=next;else cost=next;return route.fulfill({json:next});}if(path.endsWith('/expenses')){expenseRows=[...expenseRows,{...body,expense_ref:'EXP_created_'+expenseRows.length,status:'active'}];return route.fulfill({json:expenseRows.at(-1)});}if(path.includes('/report-schedules')){if(route.request().method()==='DELETE')schedules=schedules.map(r=>({...r,enabled:false,status:'disabled'}));else schedules=[{...body,frequency:'weekly',status:'active',revision:2,next_run_at:'2026-11-02T08:00:00Z'}];return route.fulfill({json:{schedules}});}if(path.endsWith('/reports/advanced'))return route.fulfill({json:{status:'generated',period_start:'2026-10-01',period_end:'2026-10-31',artifacts:[]}});}
 if(path.endsWith('/purchase-costs')){const params=new URL(route.request().url()).searchParams;
 const targets=[{target_ref:'WNP_fixture',product_ref:'WNP_fixture',name:'Chemise Blanc',...cost},{target_ref:'WNP_missing',product_ref:'WNP_missing',name:'Lampe rechargeable',...lamp}].map((r,i)=>({...r,target_type:'product',price:i?'20000':'15000',sale_currency:'CDF',option:null,image_url:null}));
 const items=targets.filter(r=>(params.get('missing')!=='true'||r.unit_cost===null)&&r.name.toLowerCase().includes((params.get('search')??'').toLowerCase()));return route.fulfill({json:{items,total:items.length}});}
 if(path.endsWith('/pro/dashboard'))return route.fulfill({json:data});if(path.endsWith('/reports/expenses'))return route.fulfill({json:{can_edit:true,currency_summaries:['CDF','USD'].map(currency=>{const active=expenseRows.filter(r=>r.currency===currency&&r.status==='active');return {currency,total_expenses:active.reduce((sum,r)=>sum+Number(r.amount),0),expense_count:active.length};})}});if(path.endsWith('/expenses'))return route.fulfill({json:{expenses:expenseRows,next_cursor:null}});if(path.endsWith('/report-schedules'))return route.fulfill({json:{schedules}});if(path.endsWith('/products'))return route.fulfill({json:{products:[item,{...item,public_ref:'WNP_missing',name:'Product without cost'}],total:2}});if(path.endsWith('/private-cost/history'))return route.fulfill({json:{history:[{unit_cost:'5000',currency:'CDF',changed_at:'2026-10-01T10:00:00Z'}]}});if(path.endsWith('/private-cost'))return route.fulfill({json:path.includes('WNP_missing')?{revision:0,unit_cost:null,currency:null}:cost});if(path.endsWith('/products/WNP_fixture'))return route.fulfill({json:item});return route.fallback();});return{...f,writes,data};
}
for(const scenario of ['complete','incomplete','empty','mixed'] as const)for(const width of [390,1440])test(`financial report ${scenario} ${width}`,async({page})=>{await page.setViewportSize({width,height:1000});const f=await moneyFixture(page,scenario);await page.goto(f.url+'&view=reports');const dashboard=page.locator('.wm-dashboard');await expect(dashboard).toBeVisible();if(scenario==='empty'){await expect(dashboard).toContainText('No transactions');await expect(dashboard.locator('svg')).toHaveCount(0);}else{await expect(dashboard.locator('.wm-kpis').first()).toContainText('30,000');await expect(dashboard.locator('.wm-kpis').first()).toContainText('10,000');await expect(dashboard.locator('.wm-kpis').first()).toContainText('8,000');if(scenario!=='complete')await expect(dashboard.locator('.wm-warning').first()).toContainText('50 % of sales revenue');else await expect(dashboard.locator('.wm-warning')).toHaveCount(0);if(scenario==='mixed'){await expect(dashboard.locator('.wm-currency')).toHaveCount(2);await expect(dashboard.locator('.wm-currency').nth(1)).toContainText('85');}await expect(dashboard.locator('.wm-chart').first()).toBeVisible();}expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:`test-results/money-evidence/report-${scenario}-${width}.png`,fullPage:true});expect(f.writes).toHaveLength(0);expect(f.errors).toEqual([]);});
for(const width of [360,390,768,1440])test(`money workflows ${width}`,async({page})=>{await page.setViewportSize({width,height:1000});const f=await moneyFixture(page);await page.goto(f.url+'&view=money');await expect(page.locator('.wm-dashboard')).toContainText('Partial calculation');await page.screenshot({path:`test-results/money-evidence/overview-${width}.png`,fullPage:true});await page.goto(f.url+'&view=costs');await expect(page.locator('.wm-cost-list')).toContainText('5,000');await expect(page.locator('.wm-cost-list')).toContainText('No purchase cost recorded');await page.screenshot({path:`test-results/money-evidence/costs-${width}.png`,fullPage:true});await page.getByRole('button',{name:'Edit cost',exact:true}).click();await page.screenshot({path:`test-results/money-evidence/edit-cost-${width}.png`,fullPage:true});await page.locator('.wm-editor input[name=amount]').fill('6000');await page.locator('.wm-editor').getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.wm-cost-list')).toContainText('6,000');expect(f.writes[0].body).toMatchObject({expected_revision:1,amount:'6000',currency:'CDF'});await page.goto(f.url+'&view=expenses');await expect(page.locator('.wm-expense-summary')).toContainText('2,000');await page.screenshot({path:`test-results/money-evidence/expenses-${width}.png`,fullPage:true});await page.getByRole('button',{name:/Add expense/}).click();await page.locator('.wm-editor input[name=amount]').fill('25');await page.screenshot({path:`test-results/money-evidence/add-expense-${width}.png`,fullPage:true});await page.locator('.wm-editor').getByRole('button',{name:'Save expense',exact:true}).click();await expect(page.locator('.wm-editor')).toHaveCount(0);await page.goto(f.url+'&view=schedules');await expect(page.locator('.wm-schedule')).toContainText('Weekly');await page.screenshot({path:`test-results/money-evidence/schedules-${width}.png`,fullPage:true});await page.locator('.wm-schedule').getByRole('button',{name:'Edit',exact:true}).click();await page.locator('.wm-editor').getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.wm-editor')).toHaveCount(0);await page.locator('.wm-schedule').getByRole('button',{name:'Disable',exact:true}).click();await expect(page.locator('.wm-schedule')).toContainText('Disabled');await page.locator('.wm-schedule').getByRole('button',{name:'Enable',exact:true}).click();await expect(page.locator('.wm-schedule')).toContainText('Active');await page.goto(f.url+'&view=receipts');await expect(page.locator('.wz-receipt-history')).toHaveCount(1);await page.screenshot({path:`test-results/money-evidence/receipts-${width}.png`,fullPage:true});await page.locator('.wz-receipt-history').click();await expect(page.locator('.wz-receipt-paper')).toContainText('30,000');await page.screenshot({path:`test-results/money-evidence/receipt-preview-${width}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(f.errors).toEqual([]);});
test('expenses empty state and denied financial access',async({page})=>{const f=await moneyFixture(page,'empty');await page.goto(f.url+'&view=expenses');await expect(page.locator('.wm-empty')).toContainText('No expenses recorded yet');await page.screenshot({path:'test-results/money-evidence/expenses-empty.png',fullPage:true});await page.route('**/pro/dashboard/**',route=>route.fulfill({status:403,json:{detail:'denied'}}));await page.goto(f.url+'&view=reports');await expect(page.locator('.wm-kpis')).toHaveCount(0);await expect(page.locator('.wm-workspace')).not.toContainText('No transactions in this period');});

for(const locale of ['fr','ln','sw'] as const)test(`localized money ${locale}`,async({page})=>{await page.setViewportSize({width:390,height:900});const f=await moneyFixture(page,'mixed',locale);await page.goto(f.url+'&view=reports');await expect(page.locator('.wm-currency')).toHaveCount(2);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:`test-results/money-evidence/locale-${locale}.png`,fullPage:true});expect(f.errors).toEqual([]);});
test('private costs denied do not expose cached figures',async({page})=>{const f=await moneyFixture(page);await page.route(/\/purchase-costs\/?\?/,route=>route.fulfill({status:403,json:{detail:'denied'}}));await page.goto(f.url+'&view=costs');await expect(page.locator('.wm-purchase').getByRole('alert')).toContainText('You do not have access');await expect(page.locator('.wm-cost-list tbody tr')).toHaveCount(0);await expect(page.locator('.wm-editor')).toHaveCount(0);expect(f.writes).toHaveLength(0);});

test('receipt PDF and print retain the historical payment caveat',async({page})=>{const f=await moneyFixture(page);await page.goto(f.url+'&view=receipts');await page.locator('.wz-receipt-history').click();await expect(page.locator('.wz-receipt-paper')).toContainText('does not verify payment');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();expect((await download).suggestedFilename()).toBe('receipt.pdf');const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Print',exact:true}).click();await(await popup).close();expect(f.writes).toHaveLength(0);});


test('receipt filters are page-scoped and never claim physical printing',async({page})=>{const f=await moneyFixture(page);await page.goto(f.url+'&view=receipts');await expect(page.locator('.wz-receipt-history')).toHaveCount(1);await page.getByRole('searchbox').fill('no-match');await expect(page.locator('.wz-receipt-history')).toHaveCount(0);await expect(page.getByText('No receipts match these filters.')).toBeVisible();await page.getByRole('searchbox').fill('');await page.locator('.wm-receipt-filters summary').click();await page.locator('.wm-receipt-filters select').selectOption('seller_recorded_card');await expect(page.locator('.wz-receipt-history')).toHaveCount(0);await page.locator('.wm-receipt-filters select').selectOption('');await page.locator('.wz-receipt-history').click();await expect(page.locator('.wz-receipt-history')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.wm-receipts')).not.toContainText('Printed');await expect(page.locator('.wz-receipt-paper')).toContainText('Payment recorded by seller');await page.getByRole('combobox',{name:'Paper size'}).selectOption('58');const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();await downloaded;expect(f.writes).toHaveLength(0);});

test('report details and exports remain available',async({page})=>{const f=await moneyFixture(page);await page.goto(f.url+'&view=reports');await expect(page.locator('.wm-dashboard .wm-kpis')).toBeVisible();const details=page.locator('.wm-workspace>fieldset>.wz-report-group');for(const section of await details.all()){await section.locator(':scope > summary').click();}await page.screenshot({path:'test-results/money-evidence/reports-expanded.png',fullPage:true});await page.locator('.wz-export-bar').getByRole('button',{name:'PDF report',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);expect(f.writes[0].body).toMatchObject({formats:['pdf'],timezone:'Africa/Kinshasa'});});


test('reversed historical receipt stays distinct and unauthorized reads clear data',async({page})=>{const f=await moneyFixture(page);const receipt={store_ref:'WNZ_fixture',receipt_ref:'WRC_reversed',shop_name:'Historical shop',city:'Kinshasa',source:'basket',sold_at:'2026-10-21T12:30:00Z',payment:'not_recorded',has_reversals:true,totals:[{currency:'USD',amount:'12.50'}],lines:[{name:'Original recorded item',quantity:1,unit_price:'12.50',total:'12.50',currency:'USD',reversed:true}]};await page.route('**/pos/receipts/**',route=>{const path=new URL(route.request().url()).pathname.replace(/\/$/,'');return route.fulfill({json:path.endsWith('WRC_reversed')?receipt:{receipts:[receipt],total:1}});});await page.goto(f.url+'&view=receipts');await page.locator('.wz-receipt-history').click();await expect(page.locator('.wz-receipt-paper')).toContainText('Original recorded item');await expect(page.locator('.wz-receipt-paper')).toContainText('12.5');await expect(page.locator('.wz-receipt-paper')).toContainText('Reversed');await page.route('**/pos/receipts/**',route=>route.fulfill({status:403,json:{detail:'denied'}}));await page.reload();await expect(page.locator('.wm-receipts [role=alert]')).toBeVisible();await expect(page.locator('.wz-receipt-history')).toHaveCount(0);await expect(page.locator('.wz-receipt-paper')).toHaveCount(0);expect(f.writes).toHaveLength(0);});

test('period changes preserve explicit shop-local reporting inputs',async({page})=>{const f=await moneyFixture(page);const calls:string[]=[];page.on('request',r=>{if(r.url().includes('/pro/dashboard'))calls.push(r.url());});await page.goto(f.url+'&view=reports');await expect(page.locator('.wm-kpis')).toBeVisible();await page.getByRole('combobox',{name:'Period',exact:true}).selectOption('last_7_days');await page.getByRole('combobox',{name:'Shop time',exact:true}).selectOption('Africa/Lubumbashi');await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect.poll(()=>calls.some(url=>url.includes('last_7_days')&&url.includes('Lubumbashi'))).toBeTruthy();expect(f.writes).toHaveLength(0);});

test('notification opens its specific protected report',async({page})=>{
 const f=await moneyFixture(page);
 const suffix='/reports/artifacts/WRA_requested';
 await page.route('**'+suffix+'*/**',route=>route.fulfill({status:200,contentType:'application/pdf',body:'%PDF-1.4 synthetic'}));
 await page.goto(f.url+'&view=reports&artifact=WRA_requested');
 const request=page.waitForRequest(req=>new URL(req.url()).pathname.replace(/\/$/,'').endsWith(suffix));
 await page.getByRole('button',{name:'View report',exact:true}).click();
 expect((await request).url()).toContain('WNZ_fixture');
});

test('French purchase cost previews and retry preserve the saved row',async({page})=>{
 await page.setViewportSize({width:360,height:800});
 const f=await moneyFixture(page,'incomplete','fr');
 await page.goto(f.url+'&view=money');
 await page.getByRole('link',{name:/Compléter les coûts/}).click();
 await expect(page).toHaveURL(/costFilter=missing/);
 await expect(page.locator('.wm-cost-list')).toContainText('Lampe rechargeable');
 await page.getByRole('button',{name:'Ajouter le coût',exact:true}).click();
 const editor=page.locator('.wm-editor');
 await editor.getByRole('textbox').fill('12 000');
 await expect(editor.locator('.wm-preview-margin')).toContainText(/8\s000 CDF/);
 await editor.getByRole('combobox').selectOption('USD');
 await expect(editor).toContainText('devises différentes');
 await expect(editor.getByRole('button',{name:'Enregistrer',exact:true})).toBeDisabled();
 await editor.getByRole('combobox').selectOption('CDF');
 await page.route(/WNP_missing\/private-cost\/?$/,route=>route.fulfill({status:503,json:{detail:'temporary'}}),{times:1});
 const save=editor.getByRole('button',{name:'Enregistrer',exact:true});
 await save.click();await expect(editor.getByRole('alert')).toBeVisible();await expect(editor.getByRole('textbox')).toHaveValue('12 000');
 await save.click();await expect(page.locator('.wm-purchase')).toContainText('Coût enregistré');
 await expect(page.locator('.wm-cost-list')).toHaveCount(0);
 await page.getByRole('button',{name:'Tous les produits'}).click();
 await page.getByRole('searchbox').fill('Chemise');await page.getByRole('button',{name:'Modifier le coût'}).click();
 await expect(save).toBeDisabled();await editor.getByRole('textbox').fill('6 000');await expect(editor).toContainText(/9\s000 CDF/);
 await editor.getByRole('textbox').fill('16000');await expect(editor).toContainText(/−1\s000 CDF/);
 await editor.getByRole('textbox').fill('15000');await expect(editor.locator('.wm-preview-margin')).toContainText('0 CDF');
 await editor.getByRole('button',{name:'Annuler'}).click();await expect(page.locator('.wm-cost-list')).toContainText(/5\s000 CDF/);
 await page.reload();await expect(page.locator('.wm-cost-list')).toContainText(/12\s000 CDF/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('empty expenses, saved totals, download and refresh at phone width',async({page})=>{
 await page.setViewportSize({width:360,height:800});
 const f=await moneyFixture(page,'empty','fr');await page.goto(f.url+'&view=expenses');
 const add=page.getByRole('button',{name:/Ajouter une dépense/});
 const downloadAction=page.getByRole('button',{name:'Exporter en CSV'});
 await expect(add).toHaveCount(1);await expect(downloadAction).toHaveCount(0);
 for(const [amount,currency] of [['35 000','CDF'],['5 000','CDF'],['10','USD']]){
  await add.click();const form=page.locator('.wm-expense-fields');
  await form.locator('[name=amount]').fill(amount);await form.locator('[name=currency]').selectOption(currency);
  await form.locator('[name=note]').fill('Transport; "à livrer"');
  await form.getByRole('button',{name:'Enregistrer la dépense'}).click();
  await expect(form).toHaveCount(0);await expect(page.locator('.wm-expense-summary')).toBeVisible();
 }
 await page.reload();await expect(page.locator('.wm-expense-summary')).toContainText(/40\s000 CDF/);
 await expect(page.locator('.wm-expense-summary')).toContainText('10 USD');await expect(page.locator('.wm-ledger tbody tr')).toHaveCount(3);
 await page.route(/\/reports\/expenses\.csv/,route=>{
  const url=new URL(route.request().url());expect(url.searchParams.get('timezone')).toBe('Africa/Kinshasa');expect(url.searchParams.get('language')).toBe('fr');
  return route.fulfill({contentType:'text/csv',headers:{'Content-Disposition':'attachment; filename="depenses-WNZ_fixture-last_30_days.csv"'},body:'\ufeffMontant;Devise\r\n35000,00;CDF'});
 });
 const downloaded=page.waitForEvent('download');await downloadAction.click();expect((await downloaded).suggestedFilename()).toBe('depenses-WNZ_fixture-last_30_days.csv');
 await page.route(/\/reports\/expenses\.csv/,route=>route.fulfill({status:204}));
 await downloadAction.click();await expect(page.locator('.wm-workspace')).toContainText('Aucune dépense à exporter');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

for(const width of [390,1440])test('readable sale snapshots and report downloads '+width,async({page})=>{
 await page.setViewportSize({width,height:900});
 const f=await moneyFixture(page,'complete','fr');
 const sale={sale_ref:'WPS_a',target_label:'Chemise élégante à manches longues - XL / Vert',target_type:'variant',occurred_at:'2026-11-12T21:39:00Z',quantity:2,unit:'piece',currency:'CDF',unit_sale_price:'15000',revenue:'30000',unit_cost_snapshot:'5000',cost_basis:'10000',gross_profit:'20000',status:'active'};
 const report={run_ref:'WRA_a',run_type:'manual',period_start:'2026-10-13T23:00:00Z',period_end:'2026-11-12T23:00:00Z',generated_at:'2026-11-12T15:51:00Z',status:'generated',artifacts:[{format:'pdf',artifact_ref:'PDF_a',status:'active'},{format:'xlsx',artifact_ref:'XLS_a',status:'active'}]};
 const fixtures='tests/browser/fixtures/';
 const files:Record<string,Buffer>={
  PDF_a:await readFile(fixtures+'wenze-report-a.pdf'),PDF_b:await readFile(fixtures+'wenze-report-b.pdf'),
  XLS_a:await readFile(fixtures+'wenze-report.xlsx'),'physical-sales.csv':await readFile(fixtures+'wenze-sales.csv'),
 };
 await page.route('**/reports/**',route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(path.endsWith('physical-sales'))return route.fulfill({json:{sales:[sale,{...sale,sale_ref:'WPS_b',target_type:'product',target_label:'Chemise Blanc',quantity:1,revenue:'15000',cost_basis:null,unit_cost_snapshot:null,gross_profit:null,status:'reversed'}]}});
  if(path.endsWith('/history'))return route.fulfill({json:{reports:[report,{...report,run_ref:'WRA_b',generated_at:'2026-11-12T15:52:00Z',artifacts:[{format:'pdf',artifact_ref:'PDF_b',status:'active'}]},{...report,run_ref:'WRA_c',run_type:'scheduled_weekly',timezone:'Africa/Lubumbashi',period_start:'2026-11-02T00:00:00Z',period_end:'2026-11-09T00:00:00Z',artifacts:[]}]}});
  const file=path.split('/').at(-1)!;
  return file in files?route.fulfill({body:files[file],headers:{'Content-Disposition':'attachment; filename="'+file+'"'}}):route.fallback();
 });
 await page.goto(f.url+'&view=reports&reportZone=Africa%2FKinshasa');
 const sales=page.locator('.wr-sales'),history=page.locator('.wr-history');
 await expect(page.getByText(/1 vente enregistrée/)).toBeVisible();await expect(sales).toContainText('22:39');await expect(sales).toContainText('Annulée');
 await sales.getByRole('button',{name:/Chemise élégante/}).focus();await page.keyboard.press('Enter');const detail=sales.locator('.wr-detail').first();await expect(detail).toContainText(/Prix de vente unitaire15\s000 CDF/);await detail.locator('summary').click();await expect(detail).toContainText(/2 pièces × 15\s000 CDF/);await expect(detail).toContainText(/Coût total des articles10\s000 CDF/);await expect(detail).toContainText(/Marge brute20\s000 CDF/);await sales.getByRole('button',{name:'Chemise Blanc'}).click();await expect(sales).toContainText('Coût non renseigné');
 await expect(history.locator('tbody tr')).toHaveCount(3);await expect(history.locator('#WRA_a td').first()).toHaveText(await history.locator('#WRA_b td').first().innerText());await expect(history.locator('#WRA_a')).toContainText('12 nov. 2026 à 16:51');
 await history.locator('#WRA_c summary').click();await expect(history.locator('#WRA_c small')).toHaveText(/02:00.*01:59.*Lubumbashi/);
 for(const [button,file] of [[history.locator('#WRA_a').getByRole('button',{name:'PDF'}),'PDF_a'],[history.locator('#WRA_a').getByRole('button',{name:'Excel'}),'XLS_a'],[history.locator('#WRA_b').getByRole('button',{name:'PDF'}),'PDF_b'],[page.getByRole('button',{name:'Exporter en CSV'}),'physical-sales.csv']] as const){
  const pending=page.waitForEvent('download');await button.click();const result=await pending;expect(await readFile((await result.path())!)).toEqual(files[file]);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await sales.scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/money-evidence/reports-'+width+'.png',fullPage:true});
});

test('only requested ten-sale pages load and the CSV covers the period',async({page})=>{
 const fixture=await moneyFixture(page,'complete','fr');
 const requested:string[]=[];
 await page.route('**/reports/physical-sales/**',route=>{
  const params=new URL(route.request().url()).searchParams;
  expect(params.get('limit')).toBe('10');
  const cursor=params.get('cursor')??'';
  requested.push(cursor);
  const total=params.get('period')==='last_7_days'?10:240;
  const start=cursor?Number(cursor.slice(4)):total;
  const sales=Array.from({length:10},(_,i)=>({
   sale_ref:'WPS_'+(start-i),target_label:'Article '+(start-i),quantity:1,unit:'piece',unit_sale_price:'125',
   currency:'CDF',revenue:'125',unit_cost_snapshot:'0',cost_basis:'0',gross_profit:'125',status:'active',
  }));
  return route.fulfill({json:{sales,total,recorded:total,cancelled:0,next_cursor:start>10?'WPS_'+(start-10):null}});
 });
 await page.route('**/reports/physical-sales.csv/**',route=>{
  const params=new URL(route.request().url()).searchParams;
  expect(params.get('period')).toBe('last_30_days');expect(params.has('cursor')).toBe(false);expect(params.has('limit')).toBe(false);
  const csv=['sale_ref,revenue',...Array.from({length:240},(_,i)=>'WPS_'+(240-i)+',125')].join('\n');
  return route.fulfill({body:csv,contentType:'text/csv',headers:{'Content-Disposition':'attachment; filename="ventes.csv"'}});
 });
 await page.goto(fixture.url+'&view=reports');
 const nav=page.locator('.wr-pages'), rows=page.locator('.wr-sales tbody tr');
 await expect(nav).toContainText('1–10 sur 240 ventes');await expect(rows).toHaveCount(10);
 await expect(nav.getByRole('button',{name:'Précédent'})).toBeDisabled();
 expect(requested).toEqual(['']);
 await nav.getByRole('button',{name:'Suivant'}).click();
 await expect(nav).toContainText('11–20 sur 240 ventes');await expect(rows.first()).toContainText('Article 230');
 await expect(page.locator('.wm-kpis').first()).toContainText(/30\s000 CDF/);
 await rows.first().getByRole('button').press('Space');
 await expect(page.locator('.wr-detail')).toContainText('Coût total des articles0 CDF');
 await expect(page.locator('.wr-detail')).toContainText('Marge brute125 CDF');
 const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter en CSV'}).click();
 const file=await downloading;const csv=await readFile((await file.path())!,'utf8');
 expect(csv.split('\n')).toHaveLength(241);expect(csv).toContain('WPS_230,125');expect(csv).toContain('WPS_1,125');
 await nav.getByRole('button',{name:'Précédent'}).click();await expect(nav).toContainText('1–10 sur 240 ventes');
 await nav.getByRole('button',{name:'Suivant'}).click();await expect(nav).toContainText('11–20 sur 240 ventes');
 await page.locator('.wm-filters select').first().selectOption('last_7_days');
 await expect(nav).toHaveCount(0);await expect(rows.first()).toContainText('Article 10');
 expect(requested).toEqual(['','WPS_230','','WPS_230','']);
});
