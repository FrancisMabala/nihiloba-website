import {test,expect,type Page} from '@playwright/test';
import {checkoutText as copy} from '../../app/lib/wenze-checkout-copy';
import {managementRefinement} from '../../app/lib/wenze-management-copy';
import {wenzeUX} from '../../app/lib/wenze-ux-copy';
import {sellerText} from '../../app/lib/wenze-seller-copy';
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

for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,768,1440])test(`program management ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});const {url,errors}=await fixture(page,{locale});await page.goto(url);
 await expect(page.locator('.wz-change-shop')).toHaveCount(0);
 await expect(page.locator('.wz-current-shop')).toHaveText('Boutique du Fleuve');
 await expect(page.getByRole('button',{name:posText(locale,'shareShop'),exact:true})).toHaveCount(1);
 const nav=page.locator(width<768?'.wz-mobile-navigation':'.wz-desktop-navigation');
 await nav.getByRole('button',{name:wenzeUX(locale,'productsStock'),exact:true}).click();
 await expect(page.getByRole('button',{name:posText(locale,'labels'),exact:true})).toBeVisible();
 await page.locator('.wz-section-tabs').getByRole('button',{name:sellerText(locale,'inventory'),exact:true}).click();
 await page.getByLabel(managementRefinement[locale].search,{exact:true}).fill('Chemise');
 const requested=page.waitForRequest(r=>r.url().includes('/inventory/stock')&&r.url().includes('availability=out'));
 await page.getByRole('button',{name:managementRefinement[locale].out,exact:true}).click();await requested;
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/wenze-program/stock-${locale}-${width}.png`,fullPage:true});
 await nav.getByRole('button',{name:wenzeUX(locale,'money'),exact:true}).click();
 await expect(page.getByText(managementRefinement[locale].scope,{exact:true})).toBeVisible();
 await expect(page.getByText(managementRefinement[locale].coverage,{exact:true})).toBeVisible();
 expect(errors).toEqual([]);
});
