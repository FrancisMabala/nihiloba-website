import {expect,test,type Page} from '@playwright/test';
import {item,productFixture} from './wenze-products-fixture';
import {sellerText} from '../../app/lib/wenze-seller-copy';
import copy from '../../app/lib/wenze-stock-language.json';
import path from 'node:path';

async function inventoryFixture(page:Page, single=false, locale: keyof typeof copy='fr'){
  const f=await productFixture(page,{locale});
  const names=['Chemise à manches longues','Riz parfumé · 5 kg','Savon au miel','Câble USB-C'];
  const sizes=['XL','M','XS','L','S'];
  const variants=sizes.map(size=>({public_ref:'WNV_'+size,label:size+' / Vert',is_available:'yes',option_attributes:{size,colour:'Vert'},available_stock:single?4:size==='M'?0:3,committed_quantity:0}));
  const products=names.slice(0,single?1:4).map((name,i)=>({...item,name,public_ref:'WNP_'+i,variant_type:i===0?'option':null,variants:i===0?variants:[],photos:[{photo_ref:'photo',url:'/inventory-photo-'+i+'.png'}]}));
  const balances=products.flatMap((p,i)=>(i===0?variants:[{public_ref:p.public_ref,label:p.name,available_stock:[0,8,2,0][i],committed_quantity:[0,1,2,0][i]}]).map(v=>({item_ref:'INV_'+v.public_ref,catalog_ref:v.public_ref,catalog_label:p.name+' '+v.label,on_hand:v.available_stock+v.committed_quantity,reserved:v.committed_quantity,available:v.available_stock,unit:'piece',is_low_stock:i===2})));
  await page.route('**/inventory-photo-*.png',route=>{
    const file=process.env.WENZE_EVIDENCE?path.join(process.env.WENZE_EVIDENCE,route.request().url().split('/').at(-1)!):'public/images/wenze-boutique-market.webp';
    return route.fulfill({path:file});
  });
  await page.route('**/api/**/products/?**',route=>{const offset=Number(new URL(route.request().url()).searchParams.get('offset'));return route.fulfill({json:{products:products.slice(offset,offset+2),total:products.length}});});
  await page.route('**/api/**/inventory/stock/?**',route=>route.fulfill({json:{items:balances}}));
  await page.route('**/api/**/products/WNP_0/',route=>route.fulfill({json:products[0]}));
  return {...f,url:f.url.replace('view=catalog','view=inventory'),balances};
}
const capture=(page:Page,name:string)=>page.screenshot({path:path.join(process.env.WENZE_EVIDENCE??'test-results/products-evidence',name+'.png'),fullPage:true});
for(const width of [390,1536])test('inventory filters and expanded sizes '+width,async({page})=>{
  await page.setViewportSize({width,height:width===390?844:1024});
  const f=await inventoryFixture(page);await page.goto(f.url);
  const filters=page.locator('.wi-filters button');
  await expect(filters).toHaveText(['Tout le stock · 4','Disponible · 3','Stock faible · 1','Épuisé · 2']);
  await expect(page.locator('.wi-product')).toHaveCount(4);await capture(page,'inventory-'+width);
  await filters.nth(1).click();await expect(page.locator('.wi-product')).toHaveCount(3);
  await filters.nth(2).click();await expect(page.locator('.wi-product')).toHaveText(/Savon au miel/);
  await filters.nth(3).click();await expect(page.locator('.wi-product')).toHaveCount(2);
  await expect(page.locator('tr[data-match=true]')).toHaveText(/M.*Vert/);
  await page.getByRole('searchbox').fill('Chemise');await expect(filters.first()).toHaveText(/1$/);
  await page.locator('tr[data-match=true] button').click();
  await expect(page.locator('.wd-flow')).toBeVisible();
  await page.getByRole('button',{name:/Retour au produit/}).click();
  await expect(page.getByRole('searchbox')).toHaveValue('Chemise');
  await expect(filters.last()).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect(f.errors).toEqual([]);
});
for(const width of [390,1536])test('twenty shirts '+width,async({page})=>{
  await page.setViewportSize({width,height:width===390?844:1024});
  const f=await inventoryFixture(page,true);await page.goto(f.url);
  await page.getByRole('button',{name:/5 tailles/}).click();
  await expect(page.locator('.wi-versions tbody tr td:first-child')).toHaveText(['XS','S','M','L','XL']);
  await expect(page.locator('.wi-sellable strong')).toHaveText('20');if(width===390)expect((await page.locator('.wi-versions').boundingBox())!.height).toBeLessThan(430);
  await capture(page,'inventory-expanded-'+width);
});
for(const locale of ['en','ln','sw'] as const)test('inventory language '+locale,async({page})=>{
  const f=await inventoryFixture(page,true,locale);await page.goto(f.url);
  await expect(page.getByRole('button',{name:copy[locale].receive})).toBeVisible();
});
test('receiving and counting use different quantities',async({page})=>{
  const f=await inventoryFixture(page,true,'en');const writes:string[]=[];
  await page.route('**/api/**/inventory/items/*/receive/',route=>{writes.push('receipt');return route.fulfill({json:{}});});
  await page.route('**/api/**/inventory/counts/',route=>route.fulfill({json:{count_ref:'COUNT_fixture',revision:1,status:'draft',lines:[]}}));
  await page.route('**/api/**/inventory/counts/*/lines/',route=>{writes.push('count:'+route.request().postDataJSON().observed_on_hand);return route.fulfill({json:{count_ref:'COUNT_fixture',revision:2,status:'draft',lines:[{label:'L / Vert',expected_on_hand:4,observed_on_hand:0,variance:-4,result_state:'pending'}]}});});
  const countLine={label:'L / Vert',expected_on_hand:4,observed_on_hand:0,variance:-4,result_state:'ready'};
  await page.route('**/inventory/counts/*/review/',r=>r.fulfill({json:{count_ref:'COUNT_fixture',revision:3,status:'reviewed',lines:[countLine]}}));
  await page.route('**/inventory/counts/*/post/',r=>{writes.push('post');return r.fulfill({json:{count_ref:'COUNT_fixture',revision:4,status:'posted',lines:[countLine]}});});
  await page.goto(f.url);await page.getByRole('button',{name:copy.en.receive}).click();
  const tools=page.locator('.wp-count-tools');await tools.locator('select').selectOption('INV_WNV_L');
  await tools.locator('input').fill('3');await expect(tools).toContainText('7 in the shop');await tools.locator('form button').click();
  await page.getByRole('dialog').getByRole('button',{name:copy.en.confirm}).click();await expect.poll(()=>writes).toEqual(['receipt']);
  await page.getByRole('button',{name:copy.en.count,exact:true}).click();await tools.getByRole('button',{name:/Start/}).click();
  await tools.locator('select').selectOption('INV_WNV_L');await expect(tools.locator('form button')).toBeDisabled();
  await tools.locator('input').fill('3');await expect(tools).toContainText('1 fewer');
  await tools.locator('input').fill('0');await tools.locator('form button').click();await expect.poll(()=>writes).toEqual(['receipt','count:0']);
  await tools.getByRole('button',{name:sellerText('en','review'),exact:true}).click();
  await tools.getByRole('button',{name:sellerText('en','post'),exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:sellerText('en','post'),exact:true}).click();
  await expect.poll(()=>writes).toEqual(['receipt','count:0','post']);
});

for(const width of [390,1440])test('catalogue tabs retain position '+width,async({page})=>{
 await page.setViewportSize({width,height:900});const f=await inventoryFixture(page);
 await page.route('**/catalog-imports/?**',r=>r.fulfill({json:{jobs:[],total:0}}));await page.goto(f.url.replace('view=inventory','view=catalog'));await expect(page.locator('.wp-catalog')).toBeVisible();
const tabs=page.locator('.wz-section-tabs').first();await expect(tabs).toBeVisible();await page.evaluate(()=>document.fonts.ready);const first=await tabs.boundingBox();
 await capture(page,'products-'+width);
 for(const index of [1,2,0]){
  await tabs.getByRole('button').nth(index).click();await expect(tabs.getByRole('button').nth(index)).toHaveAttribute('aria-current','page');
  if(index===1)await expect(page.locator('.wi-search')).toBeVisible();
  if(index===2)await expect(page.locator('.wp-import-upload')).toBeVisible();
  const box=await tabs.boundingBox();expect(Math.abs(box!.x-first!.x)).toBeLessThan(2);expect(Math.abs(box!.y-first!.y)).toBeLessThan(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
