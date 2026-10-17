import {test,expect} from '@playwright/test';
import {sellerText} from '../../app/lib/wenze-seller-copy';
import {wenzeDesignText} from '../../app/lib/wenze-design-copy';
for(const locale of ['en','fr','ln','sw'] as const)test(`Wenze seller redesign ${locale}`,async({page})=>{
 const t=(key:string)=>sellerText(locale,key),d=(key:string)=>wenzeDesignText(locale,key);
 const store={public_ref:'WNZ_fixture',name:'Boutique du Fleuve',city:'Kinshasa',category:'fashion_clothing',description:'Vêtements et accessoires',revision:1,status:'active',visible:'true',catalog_ready:true,order_ready:true,profile_image_url:null as string|null};
 const product={public_ref:'WNP_fixture',name:'Chemise blanche',revision:1,status:'active',visible:'true',price:'15000',currency:'CDF',category:'fashion_clothing',available_stock:10,photos:[{photo_ref:'WIM_fixture',url:'/images/wenze-boutique-market.webp'}],variants:[]};
 const writes:string[]=[];
 page.on('dialog',()=>{throw new Error('Native browser dialog should not be used');});
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test seller'}});
  if(req.method()!=='GET'){
   writes.push(path);const body=req.postDataJSON();
   if(path.endsWith('/uploads')){expect(body.target_type).toBe('store_profile');expect(body.target_ref).toBe(store.public_ref);return reply({upload_ref:'WCU_fixture'});}
   if(path.endsWith('/profile-photo')){expect(body.expected_revision).toBe(store.revision);store.profile_image_url=body.upload_ref?'/images/wenze-boutique-market.webp':null;store.revision++;return reply(store);}
   if(path.endsWith('/hide')){store.visible='false';store.revision++;return reply(store);}
   if(path.endsWith('/drafts'))return reply({draft_ref:'WFW_fixture',revision:1});
   if(req.method()==='PATCH'){Object.assign(store,body.fields);store.revision++;return reply(store);}
   return reply({},404);
  }
  if(path.endsWith('/stores'))return reply({stores:[store],categories:[{code:'fashion_clothing',labels:{en:'Fashion',fr:'Mode',ln:'Bilamba',sw:'Mavazi'}}],currencies:['CDF','USD']});
  if(path.endsWith('/WNZ_fixture'))return reply(store);
  if(path.endsWith('/products'))return reply({products:[product],total:1});
  if(path.endsWith('/today'))return reply({date:'2026-10-17',timezone:'Africa/Kinshasa',followers:24,new_followers:3,orders_today:4,reviews:{count:8,average:4.8},financial_access:true,currency_summaries:[{currency:'CDF',revenue:'45000',quantity:3,known_profit:'18000',profit_complete:true,expenses:'5000'},{currency:'USD',revenue:'10',quantity:1,known_profit:'0',profit_complete:false,expenses:'0'}],sold_items:[{product_ref:'WNP_fixture',variant_ref:null,label:'Chemise blanche',currency:'CDF',quantity:3,revenue:'45000',image_url:'/images/wenze-boutique-market.webp'}]});
  if(path.endsWith('/orders'))return reply({orders:[],counts:{action_required:2,in_progress:3},total:0});
  if(path.endsWith('/inventory/summary'))return reply({low_stock_items:1,untracked_items:0,uninitialized_items:0});
  if(path.endsWith('/plan'))return reply({plan:'pro',source:'personal_pilot',active_products:1,active_product_limit:1000,free_import_used:0,free_import_allowance:1});
  return reply({},404);
 });
 await page.setViewportSize({width:390,height:844});await page.goto(`${locale==='en'?'':'/'+locale}/shida/seller/wenze/`);
 await expect(page.getByText('24',{exact:true})).toBeVisible();await expect(page.getByText(d('soldToday'),{exact:true})).toBeVisible();
 await expect(page.getByText('3',{exact:true}).first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/wenze-redesign/today-${locale}-mobile.png`,fullPage:true});
 await page.setViewportSize({width:1440,height:1000});
 if(locale==='en')await page.screenshot({path:'docs/evidence/wenze-redesign/today-desktop.png',fullPage:true});
 await page.locator('.seller-navigation').getByRole('button',{name:t('catalog'),exact:true}).click();
 await expect(page.locator('.wz-product-list img')).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/wenze-redesign/products-${locale}-mobile.png`,fullPage:true});
 await page.getByRole('button',{name:d('shopDetails'),exact:true}).click();
 await page.locator('.wz-shop-photo input[type=file]').setInputFiles({name:'shop.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0ZkAAAAASUVORK5CYII=','base64')});
 await expect(page.locator('.wz-shop-photo img')).toBeVisible();await page.getByRole('button',{name:t('save'),exact:true}).click();
 await expect(page.locator('.wz-editor')).toHaveCount(0);
 await page.getByRole('button',{name:d('settings'),exact:true}).click();await expect(page.getByText(d('testingAccess'))).toBeVisible();
 await page.getByRole('button',{name:t('hide'),exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByText(d('hideHelp'))).toBeVisible();
 await page.screenshot({path:`docs/evidence/wenze-redesign/confirmation-${locale}-mobile.png`,fullPage:true});
 await page.getByRole('dialog').getByRole('button',{name:t('cancel'),exact:true}).click();expect(writes.filter(p=>p.endsWith('/hide'))).toHaveLength(0);
 await page.getByRole('button',{name:t('hide'),exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:t('hide'),exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();expect(writes.filter(p=>p.endsWith('/hide'))).toHaveLength(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
