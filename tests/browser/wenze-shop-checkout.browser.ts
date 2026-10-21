import {test,expect,type Page} from '@playwright/test';
import {checkoutText as copy} from '../../app/lib/wenze-checkout-copy';
import {posText} from '../../app/lib/wenze-pos-copy';
const business=false;
type Locale='en'|'fr'|'ln'|'sw';
async function fixture(page:Page,{online=false,retry=false,locale='fr' as Locale}={}){
 const shop={public_ref:'WNZ_fixture',name:'Boutique du Fleuve',store_type:online?'online_only':'online_and_physical',city:'Kinshasa',category:'fashion_clothing',revision:1,status:'active',visible:'true',catalog_ready:true,order_ready:true};
 const items=[{product_ref:'WNP_shirt',variant_ref:'WNV_medium',barcode:'WNV_medium',name:'Chemise blanche',variant:'Blanc / M',price:'15000',currency:'CDF',available:3,image_url:'/images/wenze-boutique-market.webp',category:'fashion_clothing'},{product_ref:'WNP_shirt',variant_ref:'WNV_large',barcode:'WNV_large',name:'Chemise blanche',variant:'Blanc / L',price:'15000',currency:'CDF',available:3,image_url:null,category:'fashion_clothing'},{product_ref:'WNP_phone',variant_ref:null,barcode:'WNP_phone',name:'Téléphone 128 Go',variant:null,price:'350000',currency:'CDF',available:5,image_url:null,category:'phones_electronics'},{product_ref:'WNP_soap',variant_ref:null,barcode:'WNP_soap',name:'Savon doux',variant:null,price:'5.50',currency:'USD',available:8,image_url:null,category:'other'}];
 const receipt={store_ref:shop.public_ref,receipt_ref:'WRC_fixture',shop_name:shop.name,city:'Kinshasa',source:'basket',sold_at:'2026-10-21T12:30:00Z',payment:'seller_recorded_cash',has_reversals:false,totals:[{currency:'CDF',amount:'30000'}],lines:[{name:'Chemise blanche · Blanc / M',quantity:2,unit_price:'15000',total:'30000',currency:'CDF',reversed:false}],payment_details:{received:{CDF:'50000.00'},change:{CDF:'20000.00'}}};
 const writes:{key:string;body:Record<string,unknown>}[]=[];const errors:string[]=[];page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER ERROR:',e.message);});
 await page.addInitScript(l=>localStorage.setItem('shida-wenze-language',l),locale);
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Demo seller'}});
  if(path.endsWith('/me'))return reply({user:{account_type:'both',display_name:'Demo seller'},businesses:[]});
  if(path.endsWith('/contexts'))return reply({contexts:[{type:'organization',public_ref:'BUS_fixture',name:shop.name,role:'owner',restricted:false,onboarding_status:'complete',operational_state:'operational'}]});
  if(path.endsWith('/stores'))return reply({stores:[shop],categories:['fashion_clothing','phones_electronics','other'].map((code,i)=>({code,labels:{en:['Clothing','Electronics','Other'][i],fr:['Vêtements','Électronique','Autres'][i],ln:code,sw:code}})),currencies:['CDF','USD']});
  if(path.endsWith('/WNZ_fixture'))return reply(shop);
  if(path.endsWith('/products'))return reply({products:[],total:0});
  if(path.endsWith('/plan'))return reply({plan:'pro',source:'personal_pilot'});
  if(path.endsWith('/today'))return reply({date:'2026-10-21',timezone:'Africa/Kinshasa',followers:0,new_followers:0,orders_today:0,reviews:{count:0},financial_access:true,currency_summaries:[],sold_items:[]});
  if(path.endsWith('/catalog-imports/options'))return reply({stores:[shop],categories:[],currencies:['CDF','USD'],issues:{},support_url:null});
  if(path.endsWith('/orders'))return reply({orders:[],stores:[shop],counts:{},total:0});
  if(path.endsWith('/inventory/summary'))return reply({low_stock_items:0,untracked_items:0});
  if(path.endsWith('/inventory/stock'))return reply({items:[]});
  if(path.endsWith('/physical-sales/priced'))return reply({sales:[]});
  if(path.endsWith('/pos/catalog')){const category=url.searchParams.get('category'),found=items.filter(i=>!category||i.category===category);return reply({items:found,categories:['fashion_clothing','phones_electronics','other'],total:new Set(found.map(i=>i.product_ref)).size});}
  if(path.includes('/pos/lookup/'))return reply(items.find(i=>path.endsWith(i.barcode)));
  if(path.endsWith('/pos/checkout')){writes.push({key:req.headers()['idempotency-key'],body:req.postDataJSON()});return retry&&writes.length===1?reply({detail:'temporarily unavailable'},503):reply({...receipt,payment:req.postDataJSON().payment});}
  if(path.endsWith('/pos/receipts/WRC_fixture'))return reply(receipt);
  if(path.endsWith('/pos/receipts'))return reply({receipts:[receipt],total:1});
  if(path.endsWith('/pdf'))return route.fulfill({body:'%PDF-1.4\nfixture',contentType:'application/pdf',headers:{'Content-Disposition':'attachment; filename="receipt.pdf"'}});
  return reply({});
 });
 const url=business?'/wenze?context=BUS_fixture&store=WNZ_fixture':`${locale==='en'?'':'/'+locale}/shida/seller/wenze/?store=WNZ_fixture`;
 return {writes,errors,url};
}
async function basket(page:Page){if(await page.locator('.wz-checkout-basket-shortcut').isVisible())await page.locator('.wz-checkout-basket-shortcut').click();return page.locator('.wz-checkout-basket-content');}
async function addShirt(page:Page,locale:Locale){await page.locator('.wz-pos-product-button').filter({hasText:'Chemise blanche'}).click();await page.getByRole('dialog',{name:copy(locale,'chooseVariant')}).getByRole('button',{name:/Blanc \/ M/}).click();}
for(const [name,width,height] of [['phone',390,844],['tablet',820,1180],['laptop',1366,900]] as const){
 test(`shop checkout, cash, calculator and receipt ${name}`,async({page})=>{
  const {writes,errors,url}=await fixture(page);await page.setViewportSize({width,height});await page.goto(url+'&view=sales');
  const pos=page.locator('.wz-pos');await expect(pos.locator('.wz-pos-product')).toHaveCount(3);
  await addShirt(page,'fr');let cart=await basket(page);await cart.getByRole('button',{name:/Augmenter/}).click();await expect(cart.getByRole('spinbutton')).toHaveValue('2');
  if(width<761)await page.getByRole('dialog').getByRole('button',{name:'Fermer',exact:true}).click();
  await pos.getByRole('button',{name:'Calculatrice',exact:true}).click();const calc=page.getByRole('dialog',{name:'Calculatrice'});for(const digit of ['5','0','0','0','0','−','3','0','0','0','0','='])await calc.getByRole('button',{name:digit,exact:true}).click();await expect(calc.getByLabel('Résultat')).toHaveText('20000');await calc.getByRole('button',{name:'Fermer',exact:true}).click();expect(writes).toHaveLength(0);
  await page.screenshot({path:`docs/evidence/shop-checkout/${name}-catalog.png`,fullPage:true});
  cart=await basket(page);await cart.getByRole('button',{name:/Encaisser/}).click();const dialog=page.getByRole('dialog',{name:'Encaisser',exact:true});await expect(dialog).toBeVisible();
  await dialog.getByLabel('Montant reçu · CDF').fill('20000');await dialog.getByLabel('J’ai reçu ce paiement').check();await expect(dialog.getByRole('button',{name:'Confirmer le paiement reçu'})).toBeDisabled();
  await dialog.getByLabel('Montant reçu · CDF').fill('50000');await expect(dialog.locator('.wz-cash-row strong')).toHaveText('20 000 CDF');
  await expect(dialog.locator('.wz-payment-ack')).toHaveCSS('display','flex');await expect(dialog.locator('.wz-payment-ack')).toHaveCSS('flex-direction','row');const bounds=await dialog.boundingBox();expect(bounds).not.toBeNull();expect(Math.abs(bounds!.y+bounds!.height/2-height/2)).toBeLessThan(5);
  await page.screenshot({path:`docs/evidence/shop-checkout/${name}-payment.png`,fullPage:false});
  await dialog.getByRole('button',{name:'Confirmer le paiement reçu'}).click();await expect(page.locator('.wz-receipt-paper')).toBeVisible();expect(writes).toHaveLength(1);expect(writes[0].body).toMatchObject({payment:'seller_recorded_cash',payment_details:{received:{CDF:'50000'}},lines:[{variant_ref:'WNV_medium',quantity:2,unit_sale_price:'15000'}]});
  await expect(pos.getByRole('button',{name:posText('fr','print'),exact:true})).toBeVisible();const download=page.waitForEvent('download');await pos.getByRole('button',{name:posText('fr','download'),exact:true}).click();expect((await download).suggestedFilename()).toBe('receipt.pdf');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
  await page.screenshot({path:`docs/evidence/shop-checkout/${name}-receipt.png`,fullPage:true});
 });
 test(`online-only hides counter, retains historical receipts ${name}`,async({page})=>{
  const {writes,errors,url}=await fixture(page,{online:true});await page.setViewportSize({width,height});await page.goto(url+'&view=sales');await expect(page.getByRole('heading',{level:1})).toHaveText('Commandes');await expect(page.locator('.wz-pos')).toHaveCount(0);await expect(page.locator('nav').getByRole('button',{name:'Caisse',exact:true})).toHaveCount(0);
  await page.goto(url+'&view=today');await expect(page.locator('.wz-today')).toBeVisible();await expect(page.locator('.wz-new-sale')).toHaveCount(0);await page.screenshot({path:`docs/evidence/shop-checkout/${name}-online.png`,fullPage:true});
  await page.goto(url+'&view=receipts');await expect(page.locator('.wz-receipt-history')).toBeVisible();await page.locator('.wz-receipt-history').click();await expect(page.locator('.wz-receipt-paper')).toBeVisible();await expect(page.locator('.wz-checkout-search')).toHaveCount(0);expect(writes).toHaveLength(0);expect(errors).toEqual([]);
 });
}
for(const locale of ['en','fr','ln','sw'] as const)test(`card, category filter and safe retry ${locale}`,async({page})=>{
 const {writes,errors,url}=await fixture(page,{retry:true,locale});await page.setViewportSize({width:1366,height:900});await page.goto(url+'&view=sales');const pos=page.locator('.wz-pos');await expect(pos.locator('.wz-pos-product')).toHaveCount(3);await pos.getByRole('combobox',{name:copy(locale,'category'),exact:true}).selectOption('phones_electronics');await expect(pos.locator('.wz-pos-product')).toHaveCount(1);await pos.locator('.wz-pos-product-button').click();await page.locator('.wz-checkout-pay').click();const dialog=page.getByRole('dialog',{name:copy(locale,'pay'),exact:true});await dialog.getByRole('button',{name:copy(locale,'card'),exact:true}).click();await dialog.getByLabel(copy(locale,'reference'),{exact:true}).fill('TERMINAL-TEST-7');await dialog.getByLabel(copy(locale,'acknowledged')).check();await dialog.getByRole('button',{name:copy(locale,'confirm'),exact:true}).click();await expect(dialog.getByRole('alert')).toHaveText(posText(locale,'uncertain'));await expect(dialog.getByLabel(copy(locale,'reference'))).toBeDisabled();await dialog.getByRole('button',{name:posText(locale,'retry'),exact:true}).click();await expect(page.locator('.wz-receipt-paper')).toBeVisible();expect(writes).toHaveLength(2);expect(writes[0]).toEqual(writes[1]);expect(writes[0].key).toBeTruthy();expect(writes[0].body).toMatchObject({payment:'seller_recorded_card',payment_details:{reference:'TERMINAL-TEST-7'}});expect(errors).toEqual([]);
});
test('mobile money, mixed currencies, cancel preserves basket and stock limits',async({page})=>{
 const {writes,url}=await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto(url+'&view=sales');await addShirt(page,'fr');await page.locator('.wz-pos-product-button').filter({hasText:'Savon doux'}).click();const cart=await basket(page);const increase=cart.getByRole('button',{name:/Augmenter.*Chemise/});await increase.click();await increase.click();await expect(increase).toBeDisabled();await cart.getByRole('button',{name:/Encaisser/}).click();let dialog=page.getByRole('dialog',{name:'Encaisser',exact:true});await expect(dialog.getByLabel('Montant reçu · USD')).toHaveValue('5.50');await dialog.getByRole('button',{name:'Annuler',exact:true}).click();expect(writes).toHaveLength(0);await basket(page);await expect(page.locator('.wz-checkout-line')).toHaveCount(2);await page.locator('.wz-checkout-pay').click();dialog=page.getByRole('dialog',{name:'Encaisser',exact:true});await dialog.getByRole('button',{name:'Mobile Money',exact:true}).click();await dialog.getByLabel('Opérateur (facultatif)').fill('M-Pesa');await dialog.getByLabel('J’ai reçu ce paiement').check();await dialog.getByRole('button',{name:'Confirmer le paiement reçu'}).click();await expect(page.locator('.wz-receipt-paper')).toBeVisible();expect(writes[0].body).toMatchObject({payment:'seller_recorded_mobile',payment_details:{provider:'M-Pesa'}});expect(writes[0].body.lines).toHaveLength(2);
});
