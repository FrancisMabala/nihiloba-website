import {test,expect} from '@playwright/test';
import choices from '../../app/lib/wenze-choice-copy.json' with {type:'json'};
import copy from '../../app/lib/wenze-editor-copy.json' with {type:'json'};
import taxonomy from '../../app/lib/wenze-product-categories.json' with {type:'json'};
import {wenzeCopy} from '../../app/lib/wenze-copy';
import {wenzeUX} from '../../app/lib/wenze-ux-copy';
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,820,1366])test(`product editor ${locale} ${width}`,async({page})=>{
 const e=copy[locale],w=wenzeCopy[locale],c=choices[locale];
 const shop={public_ref:'WNZ_fixture',name:'Marché du Fleuve',city:'Kinshasa',category:'fashion_clothing',description:'Maison, accessoires et produits du quotidien',revision:1,status:'active',visible:'true',catalog_ready:true,order_ready:true};
 const product={public_ref:'WNP_fixture',revision:1,name:'Marmite familiale',category:'fashion_clothing',status:'active',visible:'true',price:'15000',currency:'CDF',available_stock:7,condition:'new',price_negotiable:'no',variant_type:null as string|null,photos:[],variants:[] as {public_ref:string,label:string,is_available:string,available_stock:number|null,committed_quantity:number}[]};
 const stock={item_ref:'INV_fixture',catalog_ref:product.public_ref,catalog_label:product.name,revision:1,operational_code:'INV-ABC123',on_hand:7,reserved:0,available:7,unit:'piece',low_stock_threshold:2};
 const receipt={store_ref:shop.public_ref,receipt_ref:'WRC_fixture',shop_name:shop.name,city:'Kinshasa',sold_at:'2026-10-21T12:00:00Z',source:'basket',payment:'not_recorded',has_reversals:false,lines:[{name:product.name,quantity:1,unit_price:'15000',total:'15000',currency:'CDF'}],totals:[{currency:'CDF',amount:'15000'}]};
 let blockChoices=true;let writes=0;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',()=>{throw Error('Unexpected native dialog');});
 await page.addInitScript(l=>localStorage.setItem('shida-wenze-language',l),locale);
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Demo seller'}});
  if(path.endsWith('/contexts'))return reply({contexts:[{type:'organization',public_ref:'BUS_fixture',name:'Marché du Fleuve',role:'owner',restricted:false,onboarding_status:'complete',operational_state:'operational'}]});
  if(path.endsWith('/stores'))return reply({stores:[shop],categories:taxonomy.filter(row=>!row.parent),product_categories:taxonomy,currencies:['CDF','USD']});
  if(path.endsWith('/WNZ_fixture'))return reply(shop);
  if(path.endsWith('/drafts'))return reply({draft_ref:'WDR_fixture',revision:1});
  if(path.endsWith('/uploads'))return reply({upload_ref:'WCU_fixture'});
  if(path.endsWith('/products')){
   if(req.method()==='POST'){
    const data=req.postDataJSON();expect(data.upload_refs).toEqual(['WCU_fixture']);
    expect(data.name).toBe('New product');expect(data.price).toBe('12000');
    if(data.mode==='detailed'){expect(data.variant_type).toBe('option');expect(data.variants).toEqual([{label:'M / Rouge',stock_quantity:3,option_attributes:{size:'M',colour:'Rouge'}},{label:'M / Noir',stock_quantity:4,option_attributes:{size:'M',colour:'Noir'}}]);}
    else expect(data.mode).toBe('quick');
    return reply(product);
   }
   return reply({products:[product],total:1});
  }
  if(path.endsWith('/WNP_fixture')){if(req.method()==='PATCH'){const data=req.postDataJSON();expect(data.expected_revision).toBe(product.revision);Object.assign(product,data.fields);product.revision++;}return reply(product);}
  if(path.endsWith('/preview'))return reply({...product,public_detail_url:'https://nihiloba.com/shida/wenze/products/WNP_fixture'});
  if(path.endsWith('/preflight')){if(blockChoices){blockChoices=false;return reply({detail:'wenze_active_customer_activity'},409);}return reply({operation_ref:'WOP_fixture',revision:product.revision,available_stock:7});}
  if(path.endsWith('/operations/confirm')){const data=req.postDataJSON();expect(data.expected_revision).toBe(product.revision);product.variant_type=data.fields.variant_type;product.variants=data.fields.allocations.map((v:{label:string,available_quantity:number},i:number)=>({public_ref:'WNV_'+i,label:v.label,available_stock:v.available_quantity,committed_quantity:0,is_available:'yes'}));product.revision++;return reply({product_ref:product.public_ref});}
  if(path.endsWith('/variants')){const data=req.postDataJSON();expect(data.expected_revision).toBe(product.revision);if(data.action==='rename')expect(data.label).toBe('Rouge / M');if(data.action==='rename')product.variants.find(v=>v.public_ref===data.variant_ref)!.label=data.label;product.revision++;return reply(product);}

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
 const url=(locale==='en'?'':'/'+locale)+'/shida/seller/wenze?store=WNZ_fixture';
 await page.setViewportSize({width,height:900});await page.goto(url);
 await page.getByText('24',{exact:true}).waitFor();
 const nav=page.locator(width<761?'.wz-mobile-navigation':'.seller-navigation');
 await nav.getByRole('button',{name:wenzeUX(locale,'productsStock'),exact:true}).click();
 await expect(page.getByRole('button',{name:e.quick,exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:e.detailed,exact:true})).toBeVisible();
 for(const kind of ['quick','detailed'] as const){
  await page.getByRole('button',{name:e[kind],exact:true}).click();
  const form=page.locator('.wz-editor');
  await form.getByLabel(w.name,{exact:true}).fill('New product');
  await form.getByLabel(w.price,{exact:true}).fill('12000');
  if(kind==='quick')await expect(page.getByRole('combobox',{name:e.choiceType,exact:true})).toHaveCount(0);
  else {
   await page.getByRole('checkbox',{name:c.size,exact:true}).check();
   await page.getByRole('button',{name:'M',exact:true}).click();
   await page.getByRole('checkbox',{name:c.colour,exact:true}).check();
   const colour=page.locator('.wz-choice-dimension').filter({has:page.locator('strong',{hasText:c.colour})});
   for(const value of ['Rouge','Noir']){
    await colour.getByRole('textbox').fill(value);
    await colour.getByRole('button',{name:c.add,exact:true}).click();
   }
   await page.getByRole('button',{name:c.generate+' (2)',exact:true}).click();
   const generated=page.locator('.wz-choice-row');
   await generated.nth(0).getByRole('spinbutton').fill('3');
   await generated.nth(1).getByRole('spinbutton').fill('4');
   await page.screenshot({path:`docs/evidence/wenze-category-choices/${locale}-${width}-sizes-colours.png`,fullPage:true});
  }
  await form.locator('input[type=file]').setInputFiles({name:'product.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7ZkAAAAASUVORK5CYII=','base64')});
  await expect(form.getByRole('button',{name:w.save,exact:true})).toBeEnabled();
  await form.getByRole('button',{name:w.save,exact:true}).click();
  await expect(form).toHaveCount(0);
  await page.locator('.wz-product-heading').getByRole('button',{name:w.back,exact:true}).click();
 }
 await page.getByRole('button',{name:w.manage,exact:true}).click();
 const header=page.locator('.wz-product-heading');await expect(header.getByRole('heading',{name:product.name})).toBeVisible();
 await expect(page.getByRole('button',{name:e.addChoices,exact:true})).toBeVisible();
 await page.getByRole("combobox",{name:e.category,exact:true}).selectOption('beauty_cosmetics');
 await page.getByRole("combobox",{name:e.type,exact:true}).selectOption('beauty_cosmetics:perfume');
 await expect(page.getByRole('button',{name:e.saveContinue,exact:true})).toBeEnabled();
 await page.getByRole('button',{name:e.saveContinue,exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:c.active})).toHaveText(c.active);
 await expect(page.getByRole('checkbox',{name:w.confirmFresh,exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:e.addChoices,exact:true}).click();
 await expect(page.getByRole('checkbox',{name:c.volume,exact:true})).toBeVisible();
 expect(product.category).toBe('beauty_cosmetics:perfume');expect(shop.category).toBe('fashion_clothing');
 await page.getByRole('checkbox',{name:c.volume,exact:true}).check();
 await page.getByRole('button',{name:'50 ml',exact:true}).click();
 await page.getByRole('button',{name:'100 ml',exact:true}).click();
 await page.getByRole('button',{name:c.generate+' (2)',exact:true}).click();
 await expect(page.locator('.wz-choice-row')).toHaveCount(2);
 await expect(page.getByText(c.mismatch,{exact:true})).toBeVisible();
 await page.locator('.wz-choice-row').first().getByRole('button',{name:c.remove}).click();
 await page.locator('.wz-choice-row').first().getByRole('button',{name:c.remove}).click();
 await page.getByRole('checkbox',{name:c.volume,exact:true}).uncheck();

 await page.getByRole('button',{name:c.manual,exact:true}).click();
 await page.getByRole('button',{name:c.manual,exact:true}).click();
 const rows=page.locator('.wz-choice-row');
 await rows.nth(0).getByRole('textbox').fill('Rouge');await rows.nth(0).getByRole('spinbutton').fill('3');
 await rows.nth(1).getByRole('textbox').fill('Noir');await rows.nth(1).getByRole('spinbutton').fill('4');
 await page.screenshot({path:`docs/evidence/wenze-category-choices/${locale}-${width}-allocation.png`,fullPage:true});
 await page.locator('.wz-save-bar').getByRole('button').first().click();
 expect(product.variant_type).toBe('option');
 await expect(page.locator(".wz-product-choices").getByLabel(e.choice,{exact:true}).first()).toHaveValue('Rouge');
 await expect(page.locator(".wz-product-choices").getByLabel(e.choice,{exact:true}).first()).toBeEnabled();
 await page.locator(".wz-product-choices").getByLabel(e.choice,{exact:true}).first().fill('Rouge / M');
 await expect(page.locator(".wz-product-choices").getByLabel(e.choice,{exact:true}).first()).toHaveValue('Rouge / M');
 await page.locator('.wz-product-choices form').first().getByRole('button',{name:w.save,exact:true}).click();
 await expect(page.locator(".wz-product-choices").getByLabel(e.choice,{exact:true}).first()).toHaveValue('Rouge / M');
 await header.getByRole('button',{name:wenzeUX(locale,'details'),exact:true}).click();
 await expect(page.getByRole("combobox",{name:e.type,exact:true})).toHaveValue('beauty_cosmetics:perfume');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/wenze-category-choices/${locale}-${width}-details.png`,fullPage:true});
 await header.getByRole('button',{name:e.share,exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 await expect(dialog.locator('input')).toHaveValue('https://nihiloba.com/shida/wenze/products/WNP_fixture');
 await expect(dialog.getByRole('link',{name:e.view})).toHaveAttribute('href','https://nihiloba.com/shida/wenze/products/WNP_fixture');
 await expect(dialog.locator('canvas')).toBeVisible();
 const box=await dialog.boundingBox();expect(Math.abs(box!.x+box!.width/2-width/2)).toBeLessThan(3);
 await page.screenshot({path:`docs/evidence/wenze-category-choices/${locale}-${width}-share.png`,fullPage:false});
 await dialog.getByRole('button',{name:e.close}).click();
 expect(errors).toEqual([]);
});
