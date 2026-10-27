import {test,expect} from '@playwright/test';
import {sellerImprovements} from '../../app/lib/wenze-seller-improvements';
import {wenzeUX} from '../../app/lib/wenze-ux-copy';
import {wenzeCopy} from '../../app/lib/wenze-copy';
import {posText} from '../../app/lib/wenze-pos-copy';
import {wenzeDesignText} from '../../app/lib/wenze-design-copy';
import editorCopy from '../../app/lib/wenze-editor-copy.json';
for(const locale of ['en','fr','ln','sw'] as const)for(const mode of ['quick','detailed'] as const)test(`shop settings and private purchase cost ${locale} ${mode}`,async({page})=>{
 const copy=sellerImprovements[locale],w=wenzeCopy[locale],u=(k:Parameters<typeof wenzeUX>[1])=>wenzeUX(locale,k);
 const shop={public_ref:'WNZ_fixture',name:'Première boutique',city:'Kinshasa',store_type:'online_and_physical',category:'other',revision:1,status:'active',visible:'true',catalog_ready:true,order_ready:true};
 const second={...shop,public_ref:'WNZ_second',name:'Deuxième boutique',city:'Lubumbashi'};
 const product={public_ref:'WNP_fixture',name:'Chemise',price:'15000',currency:'CDF',revision:1,status:'active',visible:'true',photos:[],variants:[],available_stock:9};
 let created=0,costAttempts=0;const costs:unknown[]=[];const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(l=>localStorage.setItem('shida-wenze-language',l),locale);
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Demo'}});
  if(path.endsWith('/stores'))return reply({stores:[shop,second],categories:[{code:'other',labels:{en:'Other',fr:'Autres',ln:'Mosusu',sw:'Nyingine'}}],currencies:['CDF','USD']});
  if(path.endsWith('/WNZ_fixture'))return reply(shop);
  if(path.endsWith('/WNZ_second'))return reply(second);
  if(path.endsWith('/products')){if(req.method()==='POST'){created++;expect(req.postDataJSON()).not.toHaveProperty('purchase_price');return reply(product);}return reply({products:[product],total:1});}
  if(path.endsWith('/WNP_fixture'))return reply(product);
  if(path.endsWith('/plan'))return reply({plan:'pro',source:'personal_pilot',active_products:1,active_product_limit:1000});
  if(path.endsWith('/drafts'))return reply({draft_ref:'WDR_fixture',revision:1});
  if(path.endsWith('/uploads'))return reply({upload_ref:'WUP_fixture'});
  if(path.endsWith('/private-cost')&&req.method()==='PUT'){costAttempts++;costs.push(req.postDataJSON());return costAttempts===1?reply({detail:'temporary'},503):reply({revision:1,amount:'10000',currency:'CDF'});}
  if(path.endsWith('/pro/dashboard')){expect(url.searchParams.get('timezone')).toBe('Africa/Lubumbashi');return reply({currency_summaries:[]});}
  if(path.endsWith('/today'))return reply({date:'2026-10-27',followers:24,orders_today:0,reviews:{count:0,average:null},financial_access:true,currency_summaries:[],sold_items:[]});
  if(path.endsWith('/orders'))return reply({counts:{},orders:[],total:0});
  return reply({});
 });
 await page.setViewportSize({width:390,height:844});await page.goto(`${locale==='en'?'':'/'+locale}/shida/seller/wenze?store=WNZ_fixture`);
 const nav=page.locator('.wz-mobile-navigation');
 await nav.getByRole('button',{name:u('productsStock'),exact:true}).click();
 await expect(page.locator('.wz-shop-header')).toHaveCount(0);
 await expect(page.getByRole('button',{name:posText(locale,'shareShop'),exact:true})).toHaveCount(0);
 const shops=page.locator('.wz-store-selector select');await shops.selectOption('WNZ_second');
 await expect(page).toHaveURL(/store=WNZ_second/);await expect(page).toHaveURL(/view=catalog/);
 await nav.getByRole('button',{name:u('money'),exact:true}).click();
 await expect(page.getByLabel(copy.zone)).toHaveValue('Africa/Lubumbashi');await expect(page.getByText(/UTC/)).toHaveCount(0);
 await nav.getByRole('button',{name:u('shop'),exact:true}).click();
 await page.locator('.wz-shop-tabs').getByRole('button',{name:wenzeDesignText(locale,'settings'),exact:true}).click();
 await expect(page.getByRole('button',{name:posText(locale,'shareShop'),exact:true})).toBeVisible();
 await nav.getByRole('button',{name:u('productsStock'),exact:true}).click();
 await page.getByRole('button',{name:editorCopy[locale][mode],exact:true}).click();
 const form=page.locator('.wz-editor');await form.getByLabel(w.name,{exact:true}).fill('Chemise');await form.getByLabel(w.price,{exact:true}).fill('15000');
 await expect(form.getByText(copy.missing,{exact:true})).toBeVisible();await form.getByLabel(copy.purchase).fill('10000');
 await expect(form.locator('output')).toContainText(/33[,.]3%/);
 await shops.selectOption('WNZ_fixture');await page.getByRole('dialog').getByRole('button',{name:u('keep')}).click();
 await expect(shops).toHaveValue('WNZ_second');await expect(form.getByLabel(copy.purchase)).toHaveValue('10000');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/wenze-seller-improvements/${locale}-${mode}-cost-mobile.png`,fullPage:true});
 await form.locator('input[type=file]').setInputFiles({name:'product.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7ZkAAAAASUVORK5CYII=','base64')});
 await form.getByRole('button',{name:w.save,exact:true}).click();await expect(page.getByRole('button',{name:copy.retry,exact:true})).toBeVisible();
 expect(created).toBe(1);await page.getByRole('button',{name:copy.retry,exact:true}).click();await expect(page.getByText(copy.saved,{exact:true})).toBeVisible();
 expect(created).toBe(1);expect(costAttempts).toBe(2);expect(costs).toEqual([{amount:'10000',currency:'CDF',expected_revision:0},{amount:'10000',currency:'CDF',expected_revision:0}]);expect(errors).toEqual([]);
});
