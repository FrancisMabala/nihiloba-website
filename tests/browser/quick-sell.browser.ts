import {test,expect} from '@playwright/test';
import {listingCopy} from '../../app/lib/wenze-listings-copy';
import {quickSellCopy} from '../../app/lib/quick-sell-copy';
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,768,1280])test(`Quick Sell ${locale} ${width}`,async({page})=>{
 const t=quickSellCopy[locale];let signedIn=true;let store:Record<string,unknown>|null=null;let product:Record<string,unknown>|null=null;let publications=0;let firstPayload:unknown;let failedUpload=false;let saved:Record<string,unknown>|null=null;
 await page.setViewportSize({width,height:900});
 await page.route('**/api/shida/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');const respond=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return respond(signedIn?{binding:'a'.repeat(64),user:{display_name:'Synthetic seller'}}:{},signedIn?200:401);
  if(path.endsWith('/quick-sell')){if(req.method()==='GET')return respond({store});store={public_ref:'WNZ_QUICK',selling_mode:'individual',revision:1,name:'Vente rapide',city:req.postDataJSON().city,delivery_areas:[],order_ready:false};return respond(store);}
  if(path.endsWith('/stores'))return respond({stores:store?[store]:[],product_categories:[{code:'shoes_accessories',labels:{en:'Shoes',fr:'Chaussures',ln:'Sapato',sw:'Viatu'}}],categories:[],currencies:['CDF','USD']});
  if(path.endsWith('/quick-sell-drafts/WFW_QUICK')){saved={...req.postDataJSON(),draft_ref:'WFW_QUICK',revision:2,photos:[{ref:'WCU_QUICK',url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9h0AAAAASUVORK5CYII='}]};return respond(saved);}
  if(path.endsWith('/quick-sell-drafts'))return respond({drafts:saved?[saved]:[]});
  if(path.endsWith('/plan'))return respond({active_products:product?1:0,active_product_limit:100});
  if(path.endsWith('/drafts'))return respond({draft_ref:'WFW_QUICK',revision:1});
  if(path.endsWith('/uploads')){if(!failedUpload){failedUpload=true;return respond({detail:'wenze_upload_failed'},400);}return respond({upload_ref:'WCU_QUICK'});}
  if(path.endsWith('/fulfillment')){store={...store,...req.postDataJSON().fields,revision:2,order_ready:true};return respond(store);}
  if(path.endsWith('/products')){if(req.method()==='GET')return respond({products:product?[product]:[],total:product?1:0});const payload=req.postDataJSON();publications++;if(publications===1){firstPayload=payload;return respond({detail:'service_unavailable'},503);}expect(payload).toEqual(firstPayload);expect(payload.stock_quantity).toBe(1);expect(payload.mode).toBe('detailed');saved=null;product={...payload,public_ref:'WNP_QUICK',revision:1,status:'active',visible:'true',available_stock:1,committed_quantity:0,quick_sell_state:'available',photos:[]};return respond(product);}
  if(path.endsWith('/orders'))return respond({orders:[],total:0,counts:{all:0},stores:store?[store]:[]});
  if(path.endsWith('/catalog-imports/options'))return respond({stores:store?[store]:[],categories:[],currencies:['CDF','USD'],issues:{}});
  return respond({});
 });
 const url=`${locale==='en'?'':'/'+locale}/shida/wenze/sell/`;
 await page.goto(url);await page.getByLabel(t.city,{exact:true}).fill('Kinshasa');await page.getByRole('button',{name:t.setup,exact:true}).click();
 await page.getByRole('button',{name:t.title,exact:true}).click();
 await page.locator('input[name=name]').fill('Chaussures seconde main — édition avec un nom très long');await page.getByRole("combobox",{name:t.category,exact:true}).selectOption('shoes_accessories');await page.locator('input[name=price]').fill('25000');
 await page.getByLabel(t.description,{exact:false}).fill('Pointure 42. Description synthétique.');
 const photo={name:'shoes.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')};
 await page.locator('input[type=file]').setInputFiles(photo);await expect(page.getByRole('status').filter({hasText:t.failed})).toBeVisible();await page.locator('input[type=file]').setInputFiles(photo);await expect(page.getByRole('button',{name:t.remove,exact:true})).toBeVisible();
 await page.getByRole('button',{name:listingCopy[locale].saveDraft,exact:true}).click();
 await page.reload();await page.getByRole('button',{name:listingCopy[locale].drafts,exact:true}).click();await page.getByRole('button',{name:listingCopy[locale].resume,exact:true}).click();
 await expect(page.getByLabel(t.name,{exact:true})).not.toHaveValue('');
 await page.getByRole('button',{name:t.next,exact:true}).click();
 await page.getByLabel(t.commune,{exact:true}).fill('Gombe');await page.getByLabel(t.point,{exact:true}).fill('Point de retrait public — exemple');await page.getByLabel(t.publicPoint,{exact:true}).check();await page.getByRole('button',{name:`${t.save} · ${t.next}`,exact:true}).click();
 await expect(page.getByRole('heading',{name:t.review,exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`docs/evidence/wenze-program/${locale}-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:t.publish,exact:true}).click();await expect(page.getByRole('status').filter({hasText:t.failed})).toBeVisible();await expect(page.getByRole('button',{name:t.back,exact:true})).toBeDisabled();
 await page.getByRole('button',{name:t.publish,exact:true}).click();await expect(page.getByRole('heading',{name:listingCopy[locale].title,exact:true}).first()).toBeVisible();expect(publications).toBe(2);
 await page.getByRole('button',{name:t.orders,exact:true}).first().click();await expect(page.getByRole('heading',{name:listingCopy[locale].title,exact:true}).first()).toBeVisible();
 signedIn=false;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.getByRole('button',{name:listingCopy[locale].title,exact:true})).toHaveCount(0);await expect(page.getByRole('heading',{name:t.title,exact:true})).toBeVisible();
 await expect(page.locator('.ssl-browse')).toHaveAttribute('href',`${locale==='en'?'':'/'+locale}/shida/wenze/`);
 signedIn=true;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.getByRole('heading',{name:listingCopy[locale].title,exact:true}).first()).toBeVisible();expect(publications).toBe(2);
});
