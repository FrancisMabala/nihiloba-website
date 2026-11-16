import {test,expect,type Page} from '@playwright/test';
import {fixture} from './wenze-checkout-fixture';
import {moneyText} from '../../app/lib/wenze-money-copy';
import {sellerText} from '../../app/lib/wenze-seller-copy';
import {posText} from '../../app/lib/wenze-pos-copy';
import type {WenzeLocale} from '../../app/lib/wenze-copy';

async function setup(page:Page,locale:WenzeLocale='fr'){
 const f=await fixture(page,{locale});const requests:string[]=[],writes:unknown[]=[];
 const name='Lampe rechargeable pour bureau et atelier — éclairage longue durée';
 const targets=Array.from({length:33},(_,i)=>({name:i<32?name:'Savon',option:i<32?'Autonomie '+(i+1)+' heures':null,product_ref:i<32?'WNP_lamp':'WNP_soap',target_ref:'WNV_'+i,target_type:i<32?'variant':'product',price:i<32?'15000':'5.5',sale_currency:i<32?'CDF':'USD',unit_cost:i===1?null:i===0?'0':i<32?'7500':'2.5',currency:i===1?null:i<32?'CDF':'USD',revision:1,image_url:null}));
 await page.route('**/api/**',async route=>{const req=route.request(),u=new URL(req.url()),p=u.pathname.replace(/\/$/,'');requests.push(u.pathname+u.search);
  if(p.endsWith('/purchase-costs')){const found=targets.filter(r=>(u.searchParams.get('missing')!=='true'||r.unit_cost===null)&&r.name.toLowerCase().includes((u.searchParams.get('search')??'').toLowerCase()));const start=Number(u.searchParams.get('offset'));return route.fulfill({json:{items:found.slice(start,start+30),total:found.length}});}
  if(p.endsWith('/private-cost')&&req.method()==='PUT'){const body=req.postDataJSON(),row=targets.find(r=>r.target_ref===u.searchParams.get('variant_ref'))!;writes.push(body);Object.assign(row,{unit_cost:body.amount,currency:body.currency,revision:row.revision+1});return route.fulfill({json:row});}
  if(p.endsWith('/private-cost/history'))return route.fulfill({json:{history:[]}});
  if(p.endsWith('/pro/dashboard'))return route.fulfill({json:{store_ref:'WNZ_fixture',period:{date_from:'2026-10-18',date_to:'2026-11-16',timezone:u.searchParams.get('timezone')},currency_summaries:['CDF','USD'].map(currency=>({currency,combined_sales:{total_revenue:'15000',known_gross_profit:'7500'},physical_sales:{total_revenue:'15000'},marketplace_sales:{total_revenue:'0'},recorded_operating_expenses:{total:'395000',top_categories:[{category:'RENT',total_expenses:'350000',expense_count:1}]},operational_result:'-387500',completeness:{profit_complete:currency==='CDF',revenue_cost_coverage_percent:50}})),top_items:{top_by_revenue:[{currency:'CDF',items:[{label:name,revenue:'15000',channel_breakdown:{physical:{quantity:1}}}]}]},current_inventory:{items:[{label:name,available:5,reserved:2}]}}});
  if(p.endsWith('/reports/history'))return route.fulfill({json:{reports:[],next_cursor:null}});
  if(p.endsWith('/reports/physical-sales'))return route.fulfill({json:{sales:[],total:0,recorded:0,cancelled:0,next_cursor:null}});
  if(p.endsWith('/report-schedules'))return route.fulfill({json:{schedules:[]}});
  if(p.endsWith('/expenses'))return route.fulfill({json:{expenses:[],total:0}});
  if(p.endsWith('/reports/expenses'))return route.fulfill({json:{currency_summaries:[]}});
  if(p.endsWith('/reports/advanced')){writes.push(req.postDataJSON());return route.fulfill({json:{artifacts:[{format:req.postDataJSON().formats[0],artifact_ref:'WRA_test'}]}});}
  if(p.includes('/reports/artifacts/'))return route.fulfill({body:'fixture export',contentType:'application/octet-stream',headers:{'Content-Disposition':'attachment; filename="report.pdf"'}});
  return route.fallback();
 });return {...f,requests,writes,name};
}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
async function shot(page:Page,name:string){if(process.env.SHIDA_EVIDENCE)await page.screenshot({path:process.env.SHIDA_EVIDENCE+'/'+name+'.png',fullPage:true});}
test('report archive distinguishes unavailable history from an empty successful retry',async({page})=>{
 await page.setViewportSize({width:390,height:844});const f=await setup(page);let fail=true;
 await page.route(/\/reports\/history\/?\?/,r=>fail?r.fulfill({status:503,json:{}}):r.fulfill({json:{reports:[],next_cursor:null}}));
 await page.goto(f.url+'&view=reports');const archive=page.locator('.finance-report-section').filter({has:page.locator('summary',{hasText:sellerText('fr','reportArchive')})});
 await archive.locator('summary').click();await expect(archive).toContainText(sellerText('fr','unavailable'));await expect(archive).not.toContainText(sellerText('fr','empty'));
 fail=false;await page.locator('.wm-period>[role=alert]').getByRole('button',{name:sellerText('fr','retry')}).click();
 await expect(archive).toContainText(sellerText('fr','empty'));await expect(page.locator('.wm-period>[role=alert]')).toHaveCount(0);
});
for(const width of [320,375,390,430,768,1440])test(`finance costs, details and exact edit ${width}`,async({page})=>{
 await page.setViewportSize({width,height:850});const f=await setup(page);await page.goto(f.url+'&view=costs');
 const mobile=width<=760;
 await expect(page.locator(mobile?'.finance-cost-row':'.finance-cost-desktop tbody>tr').first()).toBeVisible();await noOverflow(page);
 if(mobile){await expect(page.locator('.finance-cost-group')).toHaveCount(1);await expect(page.locator('.finance-cost-group strong')).toHaveText(f.name);await expect(page.locator('.finance-cost-row').first()).toContainText('0 CDF');await expect(page.locator('.finance-cost-row').nth(1)).toContainText('À renseigner');
 await page.locator('.finance-cost-row').nth(1).tap();const dialog=page.getByRole('dialog');await expect(dialog).toContainText('Autonomie 2 heures');await expect(dialog.locator('.finance-cost-facts>div').last()).toContainText('—');await shot(page,'cost-detail-'+width);
 await dialog.getByRole('button',{name:'Ajouter le coût'}).click();await dialog.locator('input[name=amount]').fill('8000');await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();await expect(dialog.locator('.finance-cost-facts')).toContainText('8 000 CDF');await dialog.getByRole('button',{name:'Fermer',exact:true}).click();await expect(page.locator('.finance-cost-row').nth(1)).toContainText('8 000 CDF');expect(f.writes).toEqual([{expected_revision:1,amount:'8000',currency:'CDF'}]);
 await page.getByRole('button',{name:sellerText('fr','next'),exact:true}).click();await expect(page.locator('.finance-cost-group')).toHaveCount(2);await noOverflow(page);
 }await shot(page,'purchase-costs-'+width);expect(f.errors).toEqual([]);
});
for(const locale of ['fr','en','ln','sw'] as const)test(`all finance destinations render and history restores ${locale}`,async({page})=>{
 await page.setViewportSize({width:390,height:844});const f=await setup(page,locale);await page.goto(f.url+'&view=costs');await expect(page.locator('.finance-cost-row').first()).toBeVisible();
 const destinations=[['reports','.wm-period'],['receipts','.wm-receipt-list'],['expenses','.wm-empty'],['schedules','.wm-period'],['money','.wm-dashboard'],['costs','.finance-cost-group']];
 for(const [view,selector] of destinations){await page.locator('.finance-section-trigger').tap();const sheet=page.getByRole('dialog');const label=view==='money'?moneyText(locale,'overview'):view==='receipts'?posText(locale,'receipts'):sellerText(locale,view);await sheet.getByRole('button',{name:label,exact:true}).click();await expect(sheet).toHaveCount(0);await expect(page.locator(selector).first()).toBeVisible();expect(new URL(page.url()).searchParams.get('view')).toBe(view);}
 await page.goBack();await expect(page.locator('.wm-dashboard')).toBeVisible();await page.goForward();await expect(page.locator('.finance-cost-group').first()).toBeVisible();await page.reload();await expect(page.locator('.finance-cost-row').first()).toBeVisible();await page.locator('.finance-section-trigger').click();await page.keyboard.press('Escape');await expect(page.locator('.finance-section-trigger')).toBeFocused();await noOverflow(page);expect(f.errors).toEqual([]);
});
for(const width of [320,375,390,430,768,1440])test(`reports, filters, receipt row and return ${width}`,async({page})=>{
 await page.setViewportSize({width,height:850});const f=await setup(page);await page.goto(f.url+'&view=reports');await expect(page.locator('.wm-period .wm-kpis')).toHaveCount(2);await expect(page.locator('.wm-period .wm-kpis').first()).toContainText('-387 500 CDF');await noOverflow(page);await shot(page,'reports-'+width);
 await page.locator('.finance-export>summary').click();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger le PDF',exact:true}).click();await download;expect(f.writes[0]).toMatchObject({formats:['pdf'],period:'last_30_days',timezone:'Africa/Kinshasa'});
 await page.goto(f.url+'&view=receipts');await expect(page.locator('.wz-receipt-history')).toHaveCount(1);await noOverflow(page);await shot(page,'receipts-'+width);await page.locator('.wz-receipt-history').click();await expect(page.locator('.wz-receipt-paper')).toContainText('WRC_fixture');await expect(page.locator('.wz-receipt-paper')).toContainText('30 000 CDF');await noOverflow(page);await shot(page,'receipt-detail-'+width);
 if(width<=760){await page.getByRole('button',{name:moneyText('fr','backReceipts')}).click();await expect(page.locator('.wz-receipt-history')).toBeVisible();}expect(f.errors).toEqual([]);
});

test('cost filters, non-variant USD, unavailable and permission denied',async({page})=>{
 await page.setViewportSize({width:320,height:850});const f=await setup(page);await page.goto(f.url+'&view=costs');
 await page.getByRole('button',{name:moneyText('fr','missingFilter'),exact:true}).click();await expect(page.locator('.finance-cost-row')).toHaveCount(1);await expect(page.locator('.finance-cost-row')).toContainText('À renseigner');
 await page.getByRole('button',{name:moneyText('fr','allProducts'),exact:true}).click();const search=page.locator('.wm-cost-tools input');await search.fill('Savon');await expect(page.locator('.finance-cost-row')).toHaveCount(1);await expect(page.locator('.finance-cost-row')).toContainText('2,5 USD');await page.locator('.finance-cost-row').tap();await expect(page.getByRole('dialog')).toContainText('5,5 USD');await page.goBack();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(search).toHaveValue('Savon');
 await search.fill('Aucun produit ne porte ce nom');await expect(page.locator('.finance-cost-row')).toHaveCount(0);await expect(page.locator('.wm-purchase')).toContainText(moneyText('fr','noProducts'));
 let denied=false;await page.route(/\/purchase-costs\/?\?/,r=>r.fulfill({status:denied?403:503,json:{}}));await search.fill('erreur');await expect(page.locator('.wm-purchase [role=alert]')).toContainText(sellerText('fr','unavailable'));denied=true;await page.locator('.wm-purchase [role=alert] button').click();await expect(page.locator('.wm-purchase [role=alert]')).toContainText(sellerText('fr','accessDenied'));await expect(page.locator('.finance-cost-row')).toHaveCount(0);await noOverflow(page);
});
test('report timezone, period, Excel and section CSV preserve request scope',async({page})=>{
 await page.setViewportSize({width:375,height:850});const f=await setup(page);await page.goto(f.url+'&view=reports');await expect(page.locator('.wm-period')).toBeVisible();await page.locator('.we-filters>summary').click();
 await page.locator('.wm-filters select').first().selectOption('last_7_days');await page.locator('.wm-filters select').last().selectOption('Africa/Lubumbashi');await expect(page.locator('.wm-period')).toBeVisible();await expect.poll(()=>f.requests.some(p=>p.includes('/pro/dashboard')&&p.includes('Africa%2FLubumbashi')&&p.includes('last_7_days'))).toBe(true);
 await page.locator('.we-filters>summary').click();await expect(page.locator('.we-filters>summary')).toContainText('Lubumbashi');await page.locator('.finance-export>summary').click();const excel=page.waitForEvent('download');await page.getByRole('button',{name:'Classeur Excel',exact:true}).click();await excel;expect(f.writes.at(-1)).toMatchObject({formats:['xlsx'],period:'last_7_days',timezone:'Africa/Lubumbashi'});
 await page.route(/\/reports\/physical-sales\.csv\/?\?/,r=>r.fulfill({body:'synthetic,csv',contentType:'text/csv',headers:{'Content-Disposition':'attachment; filename="sales.csv"'}}));const section=page.locator('.finance-report-section').filter({has:page.locator('summary',{hasText:'Ventes en boutique'})});await section.locator('summary').click();const csv=page.waitForEvent('download');await section.getByRole('button',{name:sellerText('fr','saleExport')}).click();await csv;await noOverflow(page);
});
test('receipt search, back/forward, PDF, empty and denied states',async({page})=>{
 await page.setViewportSize({width:430,height:850});const f=await setup(page);await page.goto(f.url+'&view=receipts');const search=page.locator('.wm-receipt-filters input[type=search]');await search.fill('WRC_fixture');await expect(page.locator('.wz-receipt-history')).toHaveCount(1);await page.locator('.wz-receipt-history').click();await expect(page.locator('.wz-receipt-paper')).toContainText('Espèces');
 const pdf=page.waitForEvent('download');await page.locator('.wm-receipt-toolbar').getByRole('button',{name:posText('fr','download'),exact:true}).click();await pdf;await page.goBack();await expect(search).toBeVisible();await expect(search).toHaveValue('WRC_fixture');await page.goForward();await expect(page.locator('.wz-receipt-paper')).toBeVisible();await page.getByRole('button',{name:moneyText('fr','backReceipts')}).click();
 let denied=false;await page.route(/\/pos\/receipts\/?\?/,r=>r.fulfill({status:denied?403:200,json:denied?{}:{receipts:[],total:0}}));await search.fill('absent');await expect(page.locator('.wm-empty')).toContainText(moneyText('fr','noReceiptResults'));await search.fill('');await expect(page.locator('.wm-empty')).toContainText(moneyText('fr','noStoreReceipts'));denied=true;await search.fill('denied');await expect(page.locator('.wm-receipts [role=alert]')).toBeVisible();await expect(page.locator('.wz-receipt-history')).toHaveCount(0);
});
test('cost details restore long-list position and keyboard focus',async({page})=>{
 await page.setViewportSize({width:390,height:850});const f=await setup(page);await page.goto(f.url+'&view=costs');const row=page.locator('.finance-cost-row').nth(24);await row.scrollIntoViewIfNeeded();const scroll=await page.evaluate(()=>scrollY);await row.click();await expect(page.getByRole('dialog')).toContainText('Autonomie 25 heures');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(row).toBeFocused();await expect.poll(async()=>Math.abs(await page.evaluate(()=>scrollY)-scroll)).toBeLessThan(3);
});
