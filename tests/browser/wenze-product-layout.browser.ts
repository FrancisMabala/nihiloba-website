import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './wenze-checkout-fixture';
import {savedText,type SavedProduct} from '../../app/lib/wenze-saved';
import {wenzeCopy,type WenzeLocale} from '../../app/lib/wenze-copy';
import {posText} from '../../app/lib/wenze-pos-copy';

const evidence=process.env.WENZE_LAYOUT_EVIDENCE;
const title='Chemise élégante à manches longues';
const shirt:SavedProduct={public_ref:'WNP_shirt',name:title,status:'active',visible:'true',revision:1,price:'15000',currency:'CDF',category:'shirts',condition:'new',
 description:'Chemise vert foncé à manches longues, avec col classique et poignets boutonnés.',variant_type:'custom',available_stock:19,
 photos:[{photo_ref:'WIM_cover',url:'/fixture-cover.png'}],variants:['XS','S','M','L','XL'].map(size=>({public_ref:'WNV_'+size,label:size+' / Vert',option_attributes:{size,colour:'Vert'},is_available:'yes',available_stock:size==='L'?3:4,committed_quantity:0}))};
const bottle:SavedProduct={...shirt,public_ref:'WNP_bottle',category:'other',name:'Bouteille isotherme',photos:[],available_stock:5,variants:[{public_ref:'WNV_volume',label:'500 ml',option_attributes:{volume:'500 ml'},is_available:'yes',available_stock:5,committed_quantity:1}]};
const soap:SavedProduct={...shirt,public_ref:'WNP_soap',name:'Savon au miel',category:'other',price:'3.50',currency:'USD',photos:[],variant_type:undefined,variants:[],available_stock:8,committed_quantity:2};
const products=[shirt,bottle,soap];

async function setup(page:Page,locale:WenzeLocale){
 const f=await fixture(page,{locale});
 await page.route('**/fixture-cover.png',route=>route.fulfill(process.env.WENZE_LAYOUT_PHOTO?{contentType:'image/png',body:readFileSync(process.env.WENZE_LAYOUT_PHOTO)}:{contentType:'image/webp',body:readFileSync('public/images/wenze-boutique-market.webp')}));
 await page.route('**/api/shida/personal/wenze/stores/**',async route=>{
   const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');
   const shop={public_ref:'WNZ_fixture',name:'Boutique Mwinda',store_type:'online_and_physical',status:'active',visible:'true',revision:1,category:'shirts',catalog_ready:true,order_ready:false};
   if(path.endsWith('/stores'))return route.fulfill({json:{stores:[shop],categories:[{code:'shirts',labels:{fr:'Chemises',en:'Shirts',ln:'Bashémisi',sw:'Mashati'}}]}});
   if(path.endsWith('/WNZ_fixture'))return route.fulfill({json:shop});
   if(path.endsWith('/products')){
     const filtered=url.searchParams.get('search')==='Chemise',next=url.searchParams.get('offset')==='20';
     const first=Array.from({length:20},(_,i)=>({...shirt,public_ref:'WNP_other'+i,name:'Chemise '+(i+1)}));
     return route.fulfill({json:{products:filtered?(next?[shirt]:first):products,total:filtered?21:3}});
   }
   if(path.endsWith('/private-cost')){
     if(path.includes('WNP_soap'))return route.fulfill({status:403,json:{detail:'forbidden'}});
     const target=url.searchParams.get('variant_ref');
     return route.fulfill({json:{target_ref:target,configured:target!=='WNV_volume',unit_cost:target==='WNV_volume'?null:target==='WNV_L'?'7500':'6000',currency:'CDF'}});
   }
   if(path.endsWith('/labels/pdf'))return route.fulfill({contentType:'application/pdf',body:'%PDF-1.4 test',headers:{'content-disposition':'attachment; filename=labels.pdf'}});
   if(path.endsWith('/labels/WNP_soap'))return route.fulfill({json:{barcode:soap.public_ref,shop_name:shop.name,name:soap.name,variant:null,price:soap.price,currency:soap.currency,bars:[[10,3]],width:22}});
   const product=products.find(p=>path.endsWith('/products/'+p.public_ref));
   if(product)return route.fulfill({json:product});
   if(path.endsWith('/inventory/stock'))return route.fulfill({json:{items:products.flatMap(p=>(p.variants?.length?p.variants:[p]).map(row=>({item_ref:'I_'+row.public_ref,catalog_ref:row.public_ref,catalog_parent_ref:p.public_ref,on_hand:row.available_stock!+(row.committed_quantity??0),reserved:row.committed_quantity??0,available:row.available_stock,unit:'piece'})))}});
   await route.fallback();
 });
 await page.goto(f.url+'&view=catalog');
 return f;
}
async function shot(page:Page,name:string){
 if(!evidence)return;
 await page.evaluate(()=>window.scrollTo(0,0));mkdirSync(evidence,{recursive:true});
 await page.screenshot({path:join(evidence,name+'.png'),animations:'disabled'});
}
const positions=(page:Page)=>page.locator('.wz-header, .market-avatar, .market-language, .seller-sidebar, .seller-heading, .wz-current-shop, .wz-section-tabs, .wz-section-tabs button').evaluateAll(elements=>elements.map(el=>{const {x,y,width,height}=el.getBoundingClientRect();return [x,y,width,height];}));

for(const locale of ['fr','en','ln','sw'] as const)test('Manage keeps the catalogue layout and selection '+locale,async({page})=>{
 await page.setViewportSize({width:1536,height:1024});const f=await setup(page,locale);
 const list=page.locator('.wp-catalog'),detail=page.locator('.wd-details'),table=detail.locator('.wd-stock-table');
 const manage=(name:string)=>list.locator('tr').filter({hasText:name}).getByRole('button',{name:wenzeCopy[locale].manage}).click();
 const shirtRow=list.locator('tr').filter({hasText:title});
 await expect(shirtRow.locator('.wp-stock-dot')).toHaveText('19');
 await expect(shirtRow).toContainText(/15\D?000 CDF/);
 await page.evaluate(()=>document.fonts.ready);const original=await positions(page);
 if(locale==='fr')await shot(page,'desktop-list');
 await manage(title);await expect(detail.locator('h2')).toHaveText(title);
 expect(await positions(page)).toEqual(original);
 await expect(page.locator('.wz-section-tabs button').first()).toHaveAttribute('aria-current','page');
 await expect(detail.locator('.wd-stock-count')).toContainText(savedText(locale,'availableCount',19));
 await expect(table.getByRole('row').filter({has:page.getByRole('cell',{name:'L',exact:true})}).getByRole('cell').nth(2)).toHaveText('3');
 await detail.locator('.wd-prices select').selectOption('WNV_L');await expect(detail.locator('output')).toHaveText(/7\D?500 CDF/);
 if(locale==='fr')await shot(page,'desktop-detail');
 await detail.locator('.wd-description summary').click();await expect(detail.locator('.wd-description p')).toHaveText(shirt.description!);
 await detail.getByRole('button',{name:savedText(locale,'viewPhotos')}).click();await expect(page.locator('.wp-gallery img')).toHaveCount(1);await page.locator('.wd-back').click();
 const avatar=page.locator('.market-avatar');await expect(avatar).toHaveText('DS');await avatar.click();await expect(page.locator('.auth-account-menu')).toContainText('Demo seller');await page.keyboard.press('Escape');
 await page.locator('.wd-back').click();await manage(bottle.name);await expect(table.locator('tbody')).toContainText('500 ml');await expect(table.locator('th:visible')).toHaveCount(3);await expect(detail).toContainText(savedText(locale,'noCost'));
 await page.locator('.wd-back').click();await manage(soap.name);await expect(table.locator('th:visible')).toHaveCount(2);await expect(table.locator('td:visible')).toHaveText(['8','2'],{useInnerText:true});await expect(detail.locator('output')).toHaveCount(0);
 await detail.getByRole('button',{name:posText(locale,'labels')}).click();const labels=page.locator('.wd-labels');
 const download=page.waitForEvent('download');await labels.getByRole('button',{name:posText(locale,'download')}).click();await download;
 const print=page.waitForEvent('popup');await labels.getByRole('button',{name:savedText(locale,'printOne')}).click();await (await print).close();await page.locator('.wd-back').click();await page.locator('.wd-back').click();
 await list.getByRole('textbox').fill('Chemise');await list.locator('select').selectOption('all');await list.locator('form button').click();await list.getByRole('button',{name:wenzeCopy[locale].next}).click();await manage(title);
 const names={fr:'English',en:'Lingala',ln:'Kiswahili',sw:'Français'};
 await page.locator('.market-language').click();await page.locator('.market-menu').getByRole('button',{name:names[locale]}).click();
 await expect(detail.locator('h2')).toHaveText(title);await expect(page.locator('.market-language')).toHaveText({fr:'EN',en:'LN',ln:'SW',sw:'FR'}[locale]);
 await page.locator('.wd-back').click();await expect(list.getByRole('textbox')).toHaveValue('Chemise');await expect(list.locator('select')).toHaveValue('all');await expect(list).toContainText('21–21 / 21');
 await page.locator('.wz-section-tabs button').nth(1).click();const inventory=page.locator('.wi-product').filter({hasText:title});await expect(inventory.locator('.wi-metric').nth(2)).toContainText('19');await inventory.locator('button[aria-expanded]').click();await expect(inventory.locator('tbody tr').filter({has:page.getByRole('button',{name:/ · L \/ Vert$/})}).locator('td').last()).toHaveText('3');
 expect(f.errors).toEqual([]);
});
test('mobile detail follows the seller navigation and reading order',async({page})=>{
 await page.setViewportSize({width:390,height:844});await setup(page,'fr');await page.locator('.wp-catalog tr').filter({hasText:title}).getByRole('button').click();
 await page.locator('.wd-prices>summary').click();await page.locator('.wd-prices select').selectOption('WNV_L');await expect(page.locator('.wd-prices output')).toHaveText(/7\D?500 CDF/);
 await expect(page.locator('.management-mobile-nav')).toBeVisible();const stock=await page.locator('.wd-stock-table').boundingBox(),prices=await page.locator('.wd-prices').boundingBox();expect(prices!.y).toBeGreaterThan(stock!.y+stock!.height);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(evidence){
   // Capture the full reading order with the real fixed navigation at the foot of the image.
   await page.setViewportSize({width:390,height:await page.evaluate(()=>document.documentElement.scrollHeight)});
   await shot(page,'mobile-detail');
 }
});

for(const width of [320,375,390,430,768,1440])test(`compact product actions and stock ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});const f=await setup(page,'fr');await page.locator('.wp-catalog tr').filter({hasText:title}).getByRole('button').click();
 const detail=page.locator('.wd-details');await expect(detail.locator('h2')).toHaveText(title);await expect(detail.locator('.wd-price')).toContainText(/15\D?000 CDF/);
 if(width<=760){await expect(detail.locator('.wd-prices')).not.toHaveAttribute('open','');const edit=await detail.locator('.wd-actions>.seller-primary').boundingBox(),hero=await detail.locator('.wd-hero').boundingBox();expect(edit!.width).toBeGreaterThan(hero!.width-3);await expect(page.locator('.management-mobile-nav [aria-current=page]')).toContainText('Produits');await expect(page.locator('.wd-import-desktop')).toBeHidden();}
 await detail.locator('.wd-description summary').click();await expect(detail.locator('.wd-description p')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await shot(page,`product-${width}`);await detail.getByRole('button',{name:savedText('fr','viewPhotos'),exact:true}).click();await expect(page.locator('.wp-gallery img')).toHaveCount(1);await page.locator('.wd-back').click();
 await page.locator('.wd-actions>.seller-primary').click();await expect(page.locator('.wz-editing-product')).toBeVisible();expect(f.errors).toEqual([]);
});
for(const locale of ['fr','en','ln','sw'] as const)test(`long names, missing photo, many generic variants ${locale}`,async({page})=>{
 await page.setViewportSize({width:320,height:850});await setup(page,locale);
 const variants=Array.from({length:14},(_,i)=>({public_ref:'V_'+i,label:'Model '+i,option_attributes:{capacity:(i+1)+' litres',material:'Acier inoxydable'},available_stock:i,committed_quantity:i===0?2:0,is_available:'yes'}));
 await page.route('**/products/WNP_shirt/',r=>r.fulfill({json:{...shirt,name:'Batterie rechargeable pour équipements professionnels '+ 'X'.repeat(70),category:'electronics',price:'999999999.99',currency:'USD',photos:[],variants,available_stock:91,price_negotiable:'yes',description:'A long description. '.repeat(100)}}));
 await page.locator('.wp-catalog tr').filter({hasText:title}).getByRole('button').click();await expect(page.locator('.wd-photo img')).toHaveCount(0);await expect(page.locator('.wd-stock-table tbody tr:visible')).toHaveCount(5);await expect(page.locator('.wd-stock-table tbody tr:visible').first()).toContainText('capacity: 1 litres');await expect(page.locator('.wd-stock-table tbody tr:visible').first()).toContainText('2');
 await page.locator('.wd-stock-toggle').click();await expect(page.locator('.wd-stock-table tbody tr:visible')).toHaveCount(14);await page.locator('.wd-stock-toggle').click();await expect(page.locator('.wd-stock-table tbody tr:visible')).toHaveCount(5);
 await expect(page.locator('.wd-metadata')).toContainText(savedText(locale,'negotiable'));await page.locator('.wd-prices>summary').click();await expect(page.locator('.wd-prices select option')).toHaveCount(14);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await shot(page,`long-${locale}`);
});
test('archived simple product retains restricted costs and zero stock',async({page})=>{
 await page.setViewportSize({width:375,height:850});await setup(page,'en');await page.route('**/products/WNP_soap/',r=>r.fulfill({json:{...soap,status:'archived',available_stock:0,committed_quantity:2}}));await page.locator('.wp-catalog tr').filter({hasText:soap.name}).getByRole('button').click();
 await expect(page.locator('.wd-actions>.seller-primary')).toHaveCount(0);await expect(page.getByRole('button',{name:savedText('en','editStock'),exact:true})).toHaveCount(0);await expect(page.locator('.wd-stock-count')).toHaveText(savedText('en','availableCount',0));await page.locator('.wd-prices>summary').click();await expect(page.locator('.wd-prices output')).toHaveCount(0);await expect(page.locator('.wd-price')).toContainText('3.5 USD');await page.locator('.wd-menu summary').click();await expect(page.locator('.wd-menu')).toContainText('Restore');
});
test('product list scroll and criteria survive detail return; import and inventory remain reachable',async({page})=>{
 await page.setViewportSize({width:390,height:800});await setup(page,'en');const list=page.locator('.wp-catalog');await list.getByRole('textbox').fill('Chemise');await list.locator('select').selectOption('all');await list.locator('form button').click();await expect(list.locator('tbody tr')).toHaveCount(20);
 await page.route('**/products/WNP_other15/',r=>r.fulfill({json:{...shirt,public_ref:'WNP_other15',name:'Chemise 16'}}));const manage=list.locator('tr').filter({hasText:'Chemise 16'}).getByRole('button');await manage.scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY);await manage.click();await expect(page.locator('.wd-details')).toBeVisible();await page.locator('.wd-back').click();await expect(list.getByRole('textbox')).toHaveValue('Chemise');await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before-30);
 await page.locator('.wz-section-tabs>button').nth(1).click();await expect(page.locator('.wi-page')).toBeVisible();await page.route('**/catalog-imports/?**',r=>r.fulfill({json:{jobs:[],total:0}}));await page.locator('.wd-import-menu>summary').click();await page.locator('.wd-import-menu button').click();await expect(page.locator('.wp-import')).toBeVisible();await expect(page).toHaveURL(/view=imports/);await expect(page.locator('.wd-import-menu')).not.toHaveAttribute('open','');
});

test('unknown quantities and prices stay unknown; free plan does not request private costs',async({page})=>{
 await page.setViewportSize({width:320,height:800});await setup(page,'en');let privateReads=0;
 await page.route('**/plan/',r=>r.fulfill({json:{plan:'free'}}));await page.route('**/private-cost/**',r=>{privateReads++;return r.fulfill({json:{}});});
 await page.route('**/products/WNP_soap/',r=>r.fulfill({json:{...soap,price:null,available_stock:null,committed_quantity:null,description:'Long description. '.repeat(80)}}));
 await page.locator('.wp-catalog tr').filter({hasText:soap.name}).getByRole('button').click();await expect(page.locator('.wd-price strong')).toHaveText('—');await expect(page.locator('.wd-stock-count')).toContainText(wenzeCopy.en.untracked);
 const summary=page.locator('.wd-prices>summary');await summary.focus();await page.keyboard.press('Enter');await expect(page.locator('.wd-prices')).toHaveAttribute('open','');await expect(page.locator('.wd-prices output')).toHaveCount(0);expect(privateReads).toBe(0);
 await page.locator('.wd-description summary').click();await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));const content=await page.locator('.wd-description').boundingBox(),nav=await page.locator('.management-mobile-nav').boundingBox();expect(content!.y+content!.height).toBeLessThanOrEqual(nav!.y+1);
});
