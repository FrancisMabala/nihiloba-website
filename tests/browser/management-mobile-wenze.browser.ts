import {test,expect} from '@playwright/test';
import {wenzeCopy} from '../../app/lib/wenze-copy';
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,390,430,820,1440])test(`Wenze ${locale} ${width}`,async({page})=>{
 const shop={public_ref:'WNZ_fixture',name:'SHIDA Boutique Test',city:'Kinshasa',category:'other',description:'Maison, accessoires et produits du quotidien',revision:1,status:'active',visible:'true',catalog_ready:true,order_ready:true};
 const product={public_ref:'WNP_fixture',revision:1,name:'Marmite familiale',category:'other',status:'active',visible:'true',price:'15000',currency:'CDF',available_stock:7,photos:[],variants:[]};
 const stock={item_ref:'INV_fixture',catalog_ref:product.public_ref,catalog_label:product.name,revision:1,operational_code:'INV-ABC123',on_hand:7,reserved:0,available:7,unit:'piece',low_stock_threshold:2};
 const receipt={store_ref:shop.public_ref,receipt_ref:'WRC_fixture',shop_name:shop.name,city:'Kinshasa',sold_at:'2026-10-21T12:00:00Z',source:'basket',payment:'not_recorded',has_reversals:false,lines:[{name:product.name,quantity:1,unit_price:'15000',total:'15000',currency:'CDF'}],totals:[{currency:'CDF',amount:'15000'}]};
 let writes=0;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',()=>{throw Error('Unexpected native dialog');});
 await page.addInitScript(l=>localStorage.setItem('shida-wenze-language',l),locale);
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Demo seller'}});
  if(path.endsWith('/me'))return reply({user:{account_type:'both',display_name:'Demo seller'},businesses:[]});
  if(path.endsWith('/contexts'))return reply({contexts:[{type:'organization',public_ref:'BUS_fixture',name:'SHIDA Boutique Test',role:'owner',restricted:false,onboarding_status:'complete',operational_state:'operational'}]});
  if(path.endsWith('/stores'))return reply({stores:[shop],categories:[{code:'other',labels:{en:'Other products',fr:'Autres produits',ln:'Biloko mosusu',sw:'Bidhaa nyingine'}}],currencies:['CDF','USD']});
  if(path.endsWith('/WNZ_fixture'))return reply(shop);
  if(path.endsWith('/products'))return reply({products:[product],total:1});
  if(path.endsWith('/WNP_fixture'))return reply(product);
  if(path.endsWith('/plan'))return reply({plan:'pro',source:'personal_pilot',active_products:1,active_product_limit:1000});
  if(path.endsWith('/today'))return reply({date:'2026-10-21',timezone:'Africa/Kinshasa',followers:24,new_followers:2,orders_today:4,reviews:{count:8,average:4.8},financial_access:true,currency_summaries:[{currency:'CDF',revenue:'45000',quantity:3,known_profit:'15000',profit_complete:true,expenses:'2000'}],sold_items:[{product_ref:product.public_ref,variant_ref:null,label:product.name,currency:'CDF',quantity:3,revenue:'45000',image_url:null}]});
  if(path.endsWith('/catalog-imports/options'))return reply({stores:[shop],categories:[],currencies:['CDF','USD'],issues:{}});
  if(path.endsWith('/orders'))return reply({orders:[],counts:{action_required:2,in_progress:3},stores:[shop],total:0});
  if(path.endsWith('/inventory/summary'))return reply({low_stock_items:1,untracked_items:0});
  if(path.endsWith('/inventory/stock'))return reply({items:[stock]});
  if(path.includes('/by-code/'))return reply({detail:'not found'},404);
  if(path.endsWith('/movements'))return reply({movements:[]});
  if(path.endsWith('/reservations'))return reply({reservations:[]});
  if(path.endsWith('/pos/catalog'))return reply({items:[{...product,product_ref:product.public_ref,variant_ref:null,barcode:product.public_ref,variant:null,available:7,image_url:null}],total:1});
  if(path.endsWith('/checkout')){writes++;return reply(receipt);}
  if(path.endsWith('/WRC_fixture'))return reply(receipt);
  if(path.endsWith('/pdf'))return route.fulfill({body:'%PDF-1.4\nfixture',contentType:'application/pdf',headers:{'Content-Disposition':'attachment; filename="receipt.pdf"'}});
  if(path.endsWith('/private-cost/history'))return reply({history:[]});
  if(path.endsWith('/private-cost'))return reply({revision:1,unit_cost:'5000',currency:'CDF'});
  if(path.endsWith('/expenses'))return reply({expenses:[]});
  return reply({});
 });

 await page.setViewportSize({width,height:900});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/wenze/?store=WNZ_fixture`);
 const nav=page.locator('.management-mobile-nav');await expect(nav).toHaveCount(1);
 if(width<1024){await expect(nav).toBeVisible();expect(await nav.locator('button').count()).toBeLessThanOrEqual(5);for(const index of Array.from({length:await nav.locator('button:not([aria-haspopup])').count()},(_,i)=>i)){await nav.locator('button').nth(index).click();await expect(nav.locator('button').nth(index)).toHaveAttribute('aria-current','page');}
 }else {await expect(nav).toBeHidden();await expect(page.locator('.wz-desktop-navigation')).toBeVisible();}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);expect(writes).toBe(0);
 if(locale==='fr')await page.screenshot({path:`${process.env.SHIDA_MOBILE_EVIDENCE_DIR||'test-results/management-mobile/evidence'}/web-wenze-${width}.png`,fullPage:true});
 if(locale==='fr'&&width===390){
  await nav.locator('button').nth(2).click();await page.getByRole('button',{name:wenzeCopy.fr.manage,exact:true}).click();await page.getByRole('button',{name:'Modifier le produit',exact:true}).click();
  const name=page.getByLabel(wenzeCopy.fr.name,{exact:true});await name.fill('Unsaved mobile name');await nav.locator('button').nth(1).click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await page.keyboard.press('Escape');await expect(name).toHaveValue('Unsaved mobile name');expect(writes).toBe(0);
 }
});
