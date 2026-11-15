import {test,expect,type Page} from '@playwright/test';
import {fixture} from './wenze-checkout-fixture';
const business=false;
const evidence=process.env.SHIDA_MOBILE_EVIDENCE_DIR!;
async function setup(page:Page,{locale='fr' as 'en'|'fr'|'ln'|'sw',count=22,edit=true,error=false}={}){
 const base=await fixture(page,{locale});
 let expenses=Array.from({length:count},(_,i)=>({expense_ref:'EXP_'+i,category:i===0?'TRANSPORT':i===1?'RENT':i===2?'Un libellé de dépense très long pour vérifier la lisibilité du détail et de la liste':i===3?'X'.repeat(90):'OTHER',amount:i===3?'999999999999.99':i===1?'350000':i===2?'12345.67':'45000',currency:i===2?'USD':'CDF',occurred_on:'2026-11-12',note:'Note privée : '+('Livraison avec beaucoup de précisions. '.repeat(10)),status:i===1?'reversed':'active',created_at:'2026-11-12T12:00:00Z',source:'web',reversal_ref:i===1?'WER_old':null,reversal_reason:i===1?'wrong_amount':null}));
 const reads:string[]=[],writes:{path:string;body:unknown;key:string|undefined}[]=[];
 await page.route('**/api/**',async route=>{
 const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');
 if(!path.includes('/expenses'))return route.fallback();
 reads.push(url.search);
 if(path.endsWith('.csv'))return route.fulfill({body:'amount;currency\n45000;CDF',contentType:'text/csv',headers:{'content-disposition':'attachment; filename="expenses.csv"'}});
 if(path.endsWith('/reversal')){writes.push({path,body:req.postDataJSON(),key:req.headers()['idempotency-key']});if(error)return route.fulfill({status:422,json:{detail:'wenze_expense_invalid_reason'}});expenses=expenses.map(e=>path.includes(e.expense_ref+'/')?{...e,status:'reversed',reversal_ref:'WER_new'}:e);return route.fulfill({json:expenses.find(e=>path.includes(e.expense_ref+'/'))});}
 if(path.endsWith('/reports/expenses'))return route.fulfill({json:{can_edit:edit,period:{date_from:'2026-10-16',date_to:'2026-11-15'},currency_summaries:[{currency:'CDF',total_expenses:'90000',expense_count:2},{currency:'USD',total_expenses:'12345.67',expense_count:1}]}});
 if(req.method()==='POST'){writes.push({path,body:req.postDataJSON(),key:req.headers()['idempotency-key']});expenses.push({...expenses[0],expense_ref:'EXP_new',...req.postDataJSON()});return route.fulfill({json:expenses.at(-1)});}
 return route.fulfill({json:{expenses:url.searchParams.has('cursor')?expenses.slice(20):expenses.slice(0,20),next_cursor:count>20&&!url.searchParams.has('cursor')?'EXP_19':null}});
 });
 return {url:base.url+'&view=expenses',reads,writes,errors:base.errors};
}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,390,430,820,1440])test(`expenses layout ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:850});const f=await setup(page,{locale});await page.goto(f.url);
 const rows=page.locator('.we-row');await expect(rows).toHaveCount(20);
 await expect(page.locator('.we-filters')).not.toHaveAttribute('open','');
 await expect(page.locator('.we-list')).not.toContainText('Note privée');await expect(rows.nth(1).locator('.we-badge')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width<=760){await expect(page.locator('.we-section-select select')).toBeVisible();expect(await page.locator('.we-section-select option').count()).toBeGreaterThanOrEqual(5);}else{await expect(page.locator('.we-section-select select')).toBeHidden();}
 await rows.nth(10).scrollIntoViewIfNeeded();const scroll=await page.evaluate(()=>scrollY);await rows.nth(10).click();
 await expect(page.locator('.we-detail')).toBeVisible();await expect(page.locator('.we-detail')).toContainText('Note privée');
 expect(await page.locator('.we-detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.keyboard.press('Escape');await expect(page.locator('.we-detail')).toHaveCount(0);await expect(rows.nth(10)).toBeFocused();expect(Math.abs(await page.evaluate(()=>scrollY)-scroll)).toBeLessThan(3);
 await rows.nth(2).click();await page.goBack();await expect(page.locator('.we-detail')).toHaveCount(0);await expect(rows.nth(2)).toBeFocused();
 await page.evaluate(()=>scrollTo(0,0));if(locale==='fr'&&[320,390,1440].includes(width))await page.screenshot({path:`${evidence}/${business?'business':'website'}-expenses-${width}.png`,fullPage:false});
 await rows.last().scrollIntoViewIfNeeded();expect(await rows.last().evaluate(e=>{const nav=document.querySelector('.management-mobile-nav')?.getBoundingClientRect();return !nav||!nav.height||e.getBoundingClientRect().bottom<=nav.top;})).toBe(true);
 expect(f.errors).toEqual([]);
});
for(const count of [0,1])test(`empty and single ${count}`,async({page})=>{await page.setViewportSize({width:375,height:800});const f=await setup(page,{count});await page.goto(f.url);await expect(page.locator('.we-row')).toHaveCount(count);await expect(page.getByRole('button',{name:/Ajouter une dépense/})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);});
test('cancellation requires review, retains history, permissions and errors',async({page})=>{
 await page.setViewportSize({width:390,height:800});const f=await setup(page);await page.goto(f.url);await page.locator('.we-row').first().click();
 await page.locator('.we-cancellation summary').click();await expect(page.locator('.we-cancellation')).toContainText('ne rembourse rien');
 await page.locator('.we-cancellation select').selectOption('wrong_amount');await page.locator('.we-cancellation textarea').fill('Montant saisi deux fois');
 await page.locator('.we-cancellation button').click();await expect(page.locator('.shida-confirmation')).toContainText('Montant saisi deux fois');expect(f.writes).toHaveLength(0);
 await page.locator('.shida-confirmation button').first().click();expect(f.writes).toHaveLength(0);
 await page.locator('.we-cancellation button').click();await page.locator('.shida-confirmation-submit').click();
 await expect(page.locator('.we-detail')).toContainText('Annulée');expect(f.writes).toHaveLength(1);expect(f.writes[0].body).toEqual({reason:'wrong_amount',note:'Montant saisi deux fois'});expect(f.writes[0].key).toBeTruthy();
 await expect(page.locator('.we-cancellation')).toHaveCount(0);await page.keyboard.press('Escape');
});
test('read only and rejected cancellation',async({page})=>{
 let f=await setup(page,{edit:false});await page.goto(f.url);await page.locator('.we-row').first().click();await expect(page.locator('.we-cancellation')).toHaveCount(0);await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:/Ajouter une dépense/})).toHaveCount(0);
 await page.unrouteAll({behavior:'wait'});f=await setup(page,{error:true});await page.goto(f.url);await page.locator('.we-row').first().click();await page.locator('.we-cancellation summary').click();await page.locator('.we-cancellation button').click();await page.locator('.shida-confirmation-submit').click();await expect(page.locator('.shida-confirmation [role=alert]')).toBeVisible();expect(f.writes).toHaveLength(1);await page.locator('.shida-confirmation button').first().click();await page.keyboard.press('Escape');await expect(page.locator('.we-detail')).toHaveCount(0);
});
test('period, timezone, export, pagination and section selection',async({page})=>{
 await page.setViewportSize({width:375,height:800});const f=await setup(page);await page.goto(f.url);
 await page.locator('.we-filters summary').click();await page.locator('.we-filters select').first().selectOption('last_7_days');
 if(business)await page.locator('.we-filters button').click();else await page.locator('.we-filters select').nth(1).selectOption('Africa/Lubumbashi');
 await expect.poll(()=>f.reads.some(s=>s.includes('last_7_days'))).toBe(true);await page.locator('.we-filters summary').click();await expect(page.locator('.we-filters summary')).toContainText(business?'UTC':'Lubumbashi');
 await page.locator('.we-secondary summary').click();const download=page.waitForEvent('download');await page.locator('.we-secondary button').click();expect((await download).suggestedFilename()).toBe('expenses.csv');
 expect(f.reads.at(-1)).toContain('period=last_7_days');if(!business)expect(f.reads.at(-1)).toContain('Africa%2FLubumbashi');
 await page.getByRole('button',{name:'Suivant',exact:true}).click();await expect(page.locator('.we-row')).toHaveCount(business?2:22);
 await page.locator('.we-section-select select').selectOption('costs');await expect(page.locator('.we-list')).toHaveCount(0);
});

test('cancellation on a later page retains the list and correction opens its editor',async({page})=>{
 await page.setViewportSize({width:390,height:800});const f=await setup(page);await page.goto(f.url);
 await page.getByRole('button',{name:'Suivant',exact:true}).click();const rows=page.locator('.we-row');await expect(rows).toHaveCount(business?2:22);await rows.last().click();
 await page.locator('.we-cancellation summary').click();await page.locator('.we-cancellation button').click();await page.locator('.shida-confirmation-submit').click();await expect(page.locator('.we-detail')).toContainText('Annulée');
 await page.keyboard.press('Escape');await expect(rows).toHaveCount(business?2:22);await expect(rows.last()).toBeFocused();
 await rows.last().click();await page.locator('.we-detail').getByRole('button',{name:'Remplacer l’écriture annulée'}).click();await expect(page.locator('.we-detail')).toHaveCount(0);await expect(page.locator(business?'.we-editor':'.wm-editor')).toBeVisible();
});
test('detail with keyboard-sized viewport remains scrollable and traps focus',async({page})=>{
 await page.setViewportSize({width:320,height:850});const f=await setup(page);await page.goto(f.url);await page.locator('.we-row').first().click();await page.locator('.we-cancellation summary').click();await page.locator('.we-cancellation textarea').focus();await page.setViewportSize({width:320,height:420});await page.locator('.we-cancellation button').scrollIntoViewIfNeeded();
 expect(await page.locator('.we-cancellation button').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
 for(let i=0;i<12;i++){await page.keyboard.press('Tab');expect(await page.locator('.we-detail').evaluate(e=>e.contains(document.activeElement))).toBe(true);}
 await page.screenshot({path:`${evidence}/${business?'business':'website'}-expense-detail-320.png`});await page.keyboard.press('Escape');
});
