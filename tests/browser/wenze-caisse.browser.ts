import {test,expect} from '@playwright/test';
import path from 'node:path';
import {fixture,basket} from './wenze-checkout-fixture';

for(const width of [390,1536])test('cash sale from size selection to today’s receipt '+width,async({page})=>{
  const f=await fixture(page);
  await page.setViewportSize({width,height:width===390?844:1024});
  const photo='/test-shirt.png';
  await page.route('**/test-shirt.png',r=>r.fulfill({path:process.env.WENZE_EVIDENCE?path.join(process.env.WENZE_EVIDENCE,'inventory-photo-0.png'):'public/images/wenze-boutique-market.webp'}));
  const variants=['L','M','XS','XL','S'].map(size=>({product_ref:'WNP_shirt',variant_ref:'WNV_'+size,barcode:'WNV_'+size,name:'Chemise élégante à manches longues',variant:size+' / Vert',variant_type:'option',option_attributes:{size,colour:'Vert'},price:'15000',currency:'CDF',available:4,image_url:photo}));
  const soap={product_ref:'WNP_soap',variant_ref:null,barcode:'WNP_soap',name:'Savon au miel',variant:null,price:'2500',currency:'CDF',available:42,image_url:'/test-soap.png'};
  await page.route('**/test-soap.png',r=>r.fulfill({path:process.env.WENZE_EVIDENCE?path.join(process.env.WENZE_EVIDENCE,'inventory-photo-2.png'):'public/images/wenze-boutique-market.webp'}));
  const receipt={store_ref:'WNZ_fixture',receipt_ref:'WRC_SALE_TEST',shop_name:'Boutique du Fleuve',city:'Kinshasa',source:'basket',sold_at:new Date().toISOString(),payment:'seller_recorded_cash',has_reversals:false,totals:[{currency:'CDF',amount:'15000'}],lines:[{name:variants[0].name+' · L / Vert',quantity:1,unit_price:'15000',total:'15000',currency:'CDF',reversed:false}],payment_details:{received:{CDF:'50000'},change:{CDF:'35000'}}};
  let sales=0;
  await page.route('**/pos/catalog/**',r=>r.fulfill({json:{items:[...variants,soap],total:2,categories:['fashion_clothing']}}));
  await page.route('**/pos/checkout/',async r=>{
    expect(r.request().postDataJSON().lines[0]).toMatchObject({variant_ref:'WNV_L',quantity:1});
    sales++;variants[0].available--;return r.fulfill({json:{...receipt,remaining_stock:variants[0].available}});
  });
  await page.route('**/pos/receipts/**',r=>{
    const u=new URL(r.request().url());
    if(u.pathname.includes('WRC_'))return r.fulfill({json:receipt});
    expect(u.searchParams.get('period')).toBe('today');
    return r.fulfill({json:{receipts:[receipt],total:sales}});
  });
  const capture=async(state:string)=>page.screenshot({fullPage:!(await page.locator('dialog[open]').count()),path:path.join(process.env.WENZE_EVIDENCE??'test-results/products-evidence','caisse-'+state+'-'+width+'.png')});
  await page.goto(f.url+'&view=sales');
  await page.getByRole('button',{name:/Choisir la taille/}).click();
  const modal=page.getByRole('dialog');
  await expect(modal.locator('.wz-variant-options strong')).toHaveText(['XS','S','M','L','XL']);
  await capture('options');await modal.getByRole('button',{name:/^L\s*4/}).click();
  const cart=await basket(page);await cart.getByRole('button',{name:'Espèces',exact:true}).click();
  const input=cart.getByLabel('Montant reçu · CDF');
  await cart.getByRole('button',{name:'Montant exact'}).click();await expect(input).toHaveValue('15000');
  await input.fill('10000');await expect(cart).toContainText(/Il manque 5.000 CDF/);
  await expect(cart.locator('.wz-checkout-pay')).toBeDisabled();
  await input.fill('50000');await expect(cart.locator('.wc-cash-change')).toContainText(/35.000 CDF/);
  await capture('checkout');await cart.locator('.wz-checkout-pay').click();
  const saved=page.locator('.wz-success-confirmation');
  await expect(saved).toContainText(/35.000 CDF/);await expect(saved).toContainText(/L \/ Vert.*3/);
  await capture('confirmation');await saved.getByRole('button',{name:'Voir les ventes du jour'}).click();
  const history=page.locator('.wz-receipt-history');await expect(history).toHaveCount(1);await history.click();
  await expect(page.locator('.wz-receipt-paper')).toContainText(/35.000 CDF/);
  await expect(page.locator('.wz-receipt-paper')).toContainText(receipt.receipt_ref);if(width===390)expect((await page.locator('.wm-receipt-toolbar select').boundingBox())!.width).toBeGreaterThan(110);
  await capture('receipt');
  if(width===390)await page.locator('dialog[open] header button').first().click();
  await page.getByRole('button',{name:'Retour à la caisse'}).click();
  await expect(page.locator('.wz-pos-product').first()).toContainText('19');
  expect(sales).toBe(1);expect(f.errors).toEqual([]);
});

test('volume choices, sold-out option and recorded mobile payment',async({page})=>{
 const f=await fixture(page,{locale:'fr'});await page.setViewportSize({width:1280,height:900});
 const items=['250 ml','500 ml','1 L'].map((label,i)=>({product_ref:'WNP_juice',name:'Jus de mangue',variant_ref:'WNV_'+i,variant:label,variant_type:'volume',option_attributes:{volume:label},barcode:'WNV_'+i,price:'2500',currency:'CDF',available:i,image_url:null}));
 await page.route('**/pos/catalog/**',r=>r.fulfill({json:{items,total:1,categories:[]}}));
 await page.goto(f.url+'&view=sales');await page.getByRole('button',{name:/Choisir le volume/}).click();
 const dialog=page.getByRole('dialog');await expect(dialog.getByRole('button',{name:/250 ml/})).toBeDisabled();
 await dialog.getByRole('button',{name:/500 ml/}).click();const cart=await basket(page);
 await cart.getByRole('button',{name:'Mobile Money',exact:true}).click();
 await expect(cart.locator('.wz-cash-entry')).toHaveCount(0);
 await cart.locator('.wz-checkout-pay').click();await expect(page.locator('.wz-success-confirmation')).toBeVisible();
 expect(f.writes[0].body).toMatchObject({payment:'seller_recorded_mobile',lines:[{variant_ref:'WNV_1'}]});
});
