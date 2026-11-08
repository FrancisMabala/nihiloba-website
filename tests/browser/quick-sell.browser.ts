import {test,expect} from '@playwright/test';
import {listingWorkspaceCopy} from '../../app/lib/listing-workspace-copy';
import {listingCopy} from '../../app/lib/wenze-listings-copy';
import {individualSellingCopy} from '../../app/lib/individual-selling-copy';
import {draftUX} from '../../app/lib/draft-ux-copy';
import {quickSellCopy} from '../../app/lib/quick-sell-copy';
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,390,768,1024,1440])test(`Listings workspace ${locale} ${width}`,async({page})=>{
 const l=listingCopy[locale],w=listingWorkspaceCopy[locale];let reads=0;
 const store={public_ref:'WNZ_WORKSPACE',selling_mode:'individual',revision:1,name:'Personal listings',city:'Kinshasa'};
 await page.setViewportSize({width,height:1000});
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');const reply=(json:unknown)=>route.fulfill({json});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Synthetic seller'}});
  if(path.endsWith('/quick-sell'))return reply({store});
  if(path.endsWith('/stores'))return reply({stores:[store],product_categories:[]});
  if(path.endsWith('/products')){reads++;const offset=Number(url.searchParams.get('offset'));return reply({products:offset===0?[]:['available','sold','pending','unpublished','archived'].map(state=>({public_ref:'WNP_'+state,revision:1,name:'Fixture '+state,price:'100',currency:'CDF',category:'other',condition:'used',quick_sell_state:state,status:state==='archived'?'archived':'active',visible:'true',available_stock:state==='sold'?0:1,photos:[]})),next_offset:offset===0?100:null});}
  if(path.endsWith('/quick-sell-drafts'))return reply({drafts:[0,1].map(step=>({draft_ref:'WFW_'+step,revision:1,fields:{name:''},photos:[],step,updated_at:'2026-11-08T10:00:00Z'})),next_offset:null});
  if(path.endsWith('/plan'))return reply({active_products:4,active_product_limit:100});
  if(path.endsWith('/security/navigation'))return reply({markets:['wenze'],organization_management:false});
  return reply({});
 });
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/space/?view=listings`);
 const filters=page.locator('.qs-primary-filters');
 await expect(filters.getByRole('button',{name:l.all+' (7)',exact:true})).toBeVisible();
 await expect(page.locator('.qs-draft-card')).toHaveCount(2);await expect(page.locator('.qs-listing-card')).toHaveCount(5);
 await filters.getByRole('button',{name:l.drafts+' (2)',exact:true}).click();await expect(page.locator('.qs-listing-card')).toHaveCount(0);
 await expect(page.locator('.qs-draft-card progress').first()).toHaveAttribute('value','1');
 await expect(page.locator('.qs-draft-card progress').last()).toHaveAttribute('value','2');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/mes-annonces-${locale}-${width}.png`,fullPage:true});
 await filters.getByRole('button',{name:w.online+' (1)',exact:true}).click();await expect(page.locator('.qs-listing-card')).toHaveCount(1);await expect(page.locator('.qs-listing-card')).toContainText('Fixture available');
 await page.locator('.qs-advice summary').click();await page.locator('.qs-secondary-filters').getByRole('button',{name:l.pending+' (1)',exact:true}).click();await expect(page.locator('.qs-listing-card')).toContainText('Fixture pending');
 expect(reads).toBe(2);
});
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,390,768,1024,1440])test(`Quick Sell ${locale} ${width}`,async({page})=>{
 const t=quickSellCopy[locale],c=individualSellingCopy[locale],d=draftUX[locale];let signedIn=true;let store:Record<string,unknown>|null=null;let product:Record<string,unknown>|null=null;let publications=0;let firstPayload:unknown;let failedUpload=false;let saved:Record<string,unknown>|null=null;
 await page.setViewportSize({width,height:900});
 await page.route('**/api/shida/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');const respond=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return respond(signedIn?{binding:'a'.repeat(64),user:{display_name:'Synthetic seller'}}:{},signedIn?200:401);
  if(path.endsWith('/quick-sell')){if(req.method()==='GET')return respond({store});store={public_ref:'WNZ_QUICK',selling_mode:'individual',revision:1,name:'Vente rapide',city:req.postDataJSON().city??'',delivery_areas:[],order_ready:false};return respond(store);}
  if(path.endsWith('/stores'))return respond({stores:[...(store?[store]:[]),{public_ref:'WNZ_BOUTIQUE',name:'Synthetic existing boutique',selling_mode:'store'}],product_categories:[{code:'shoes_accessories',labels:{en:'Shoes',fr:'Chaussures',ln:'Sapato',sw:'Viatu'}}],categories:[],currencies:['CDF','USD']});
  if(path.endsWith('/quick-sell-drafts/WFW_QUICK')){if(req.method()==='DELETE'){saved=null;return respond({status:'cancelled'});}saved={...req.postDataJSON(),draft_ref:'WFW_QUICK',revision:Number(req.postDataJSON().expected_revision)+1,photos:[{ref:'WCU_QUICK',url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9h0AAAAASUVORK5CYII='}]};return respond(saved);}
  if(path.endsWith('/quick-sell-drafts'))return respond({drafts:saved?[saved]:[]});
  if(path.endsWith('/plan'))return respond({active_products:product?1:0,active_product_limit:100});
  if(path.endsWith('/drafts'))return respond({draft_ref:'WFW_QUICK',revision:1});
  if(path.endsWith('/uploads')){if(!failedUpload){failedUpload=true;return respond({detail:'wenze_upload_failed'},400);}return respond({upload_ref:'WCU_QUICK'});}
  if(path.endsWith('/fulfillment'))throw new Error('Individual listing flow must not mutate store fulfillment');
  if(path.endsWith('/products')){if(req.method()==='GET')return respond({products:product?[product]:[],total:product?1:0});const payload=req.postDataJSON();publications++;if(publications===1){firstPayload=payload;return respond({detail:'service_unavailable'},503);}expect(payload).toEqual(firstPayload);expect(payload.stock_quantity).toBe(1);expect(payload.mode).toBe('detailed');expect(payload.individual_terms.city).toBe('Kinshasa');expect(payload.individual_terms.payment_methods).toEqual(['cash']);expect(payload.individual_terms.public_address_confirmed).toBe(true);saved=null;product={...payload,public_ref:'WNP_QUICK',revision:1,status:'active',visible:'true',available_stock:1,committed_quantity:0,quick_sell_state:'available',photos:[]};return respond(product);}
  if(path.endsWith('/orders'))return respond({orders:[],total:0,counts:{all:0},stores:store?[store]:[]});
  if(path.endsWith('/catalog-imports/options'))return respond({stores:store?[store]:[],categories:[],currencies:['CDF','USD'],issues:{}});
  return respond({});
 });
 const url=`${locale==='en'?'':'/'+locale}/shida/wenze/sell/`;
 await page.goto(url);await expect(page.locator('.qs-boutiques')).toContainText('Synthetic existing boutique');await expect(page.locator('.qs-boutiques a')).toHaveAttribute('href',`${locale==='en'?'':'/'+locale}/shida/seller/wenze?store=WNZ_BOUTIQUE`);await page.getByRole('button',{name:t.start,exact:true}).click();
 await page.locator('input[name=name]').fill('Chaussures seconde main — édition avec un nom très long');await page.getByRole("combobox",{name:t.category,exact:true}).selectOption('shoes_accessories');
 await page.getByLabel(t.description,{exact:false}).fill('Pointure 42. Description synthétique.');
 const photo={name:'shoes.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')};
 await page.locator('input[type=file]').setInputFiles(photo);await expect(page.getByRole('status').filter({hasText:t.failed})).toBeVisible();await page.locator('input[type=file]').setInputFiles(photo);await expect(page.getByRole('button',{name:t.remove,exact:true})).toBeVisible();
 await page.getByRole('button',{name:listingCopy[locale].saveDraft,exact:true}).click();
 await page.getByRole('button',{name:listingWorkspaceCopy[locale].continue,exact:true}).click();
 await page.locator('input[name=name]').fill('Unsaved change');await page.getByRole('button',{name:t.cancel,exact:true}).click();
 await page.getByRole('dialog').getByRole('radio').last().check();await page.getByRole('dialog').getByRole('button',{name:d.continue,exact:true}).click();
 await expect(page.locator('.qs-draft-card')).not.toContainText('Unsaved change');
 await page.reload();await page.locator('.qs-primary-filters').getByRole('button',{name:listingCopy[locale].drafts+' (1)',exact:true}).click();await page.getByRole('button',{name:listingWorkspaceCopy[locale].continue,exact:true}).click();
 await expect(page.getByLabel(t.name,{exact:true})).not.toHaveValue('');
 await page.getByRole('button',{name:t.next,exact:true}).click();
 await page.locator('input[name=price]').fill('25000');await page.getByLabel(c.cash,{exact:true}).check();await page.getByRole('button',{name:t.next,exact:true}).click();
 await page.getByLabel(t.city,{exact:true}).fill('Kinshasa');await page.getByLabel(t.commune,{exact:true}).fill('Gombe');await page.getByLabel(t.point,{exact:true}).fill('Point de retrait public — exemple');await page.getByLabel(t.publicPoint,{exact:true}).check();await page.getByRole('button',{name:`${t.save} · ${t.next}`,exact:true}).click();
 await expect(page.getByRole('heading',{name:t.review,exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`test-results/wenze-program/${locale}-${width}.png`,fullPage:true});
 await expect(page.getByRole('button',{name:t.publish,exact:true})).toBeDisabled();await page.getByLabel(c.confirm,{exact:true}).check();await page.getByRole('button',{name:t.publish,exact:true}).click();await expect(page.getByRole('status').filter({hasText:t.failed})).toBeVisible();await expect(page.getByRole('button',{name:t.back,exact:true})).toBeDisabled();
 await page.getByRole('button',{name:t.publish,exact:true}).click();await expect(page.getByRole('heading',{name:listingCopy[locale].title,exact:true}).first()).toBeVisible();expect(publications).toBe(2);
 await page.getByRole('button',{name:t.orders+' →',exact:true}).first().click();await expect(page.getByRole('heading',{name:listingCopy[locale].title,exact:true}).first()).toBeVisible();
 signedIn=false;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.getByRole('button',{name:listingCopy[locale].title,exact:true})).toHaveCount(0);await expect(page.getByRole('heading',{name:t.title,exact:true})).toBeVisible();
 await expect(page.locator('.ssl-browse')).toHaveAttribute('href',`${locale==='en'?'':'/'+locale}/shida/wenze/`);
 signedIn=true;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.getByRole('heading',{name:listingCopy[locale].title,exact:true}).first()).toBeVisible();expect(publications).toBe(2);
});
import {mkdirSync} from 'node:fs';
const evidence='C:/Users/mabal/Documents/Codex/2026-10-30/one-important-architectural-point-i-would-2/outputs/individual-selling-refinement';
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,1440])test(`Draft dialogs ${locale} ${width}`,async({page})=>{
 const t=quickSellCopy[locale],d=draftUX[locale];let saved:Record<string,unknown>|null=null,failSave=true,failDelete=true;
 await page.setViewportSize({width,height:900});
 await page.route('**/api/shida/**',async route=>{const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
 if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Synthetic seller'}});
 const store={public_ref:'WNZ_DIALOG',selling_mode:'individual',revision:1,name:'Vente rapide'};
 if(path.endsWith('/quick-sell'))return reply({store});
 if(path.endsWith('/stores'))return reply({stores:[store],product_categories:[],categories:[],currencies:['CDF']});
 if(path.endsWith('/drafts'))return reply({draft_ref:'WFW_DIALOG',revision:1});
 if(path.endsWith('/quick-sell-drafts/WFW_DIALOG')){if(req.method()==='DELETE'){if(failDelete){failDelete=false;return reply({detail:'service_unavailable'},503);}saved=null;return reply({status:'cancelled'});}if(failSave){failSave=false;return reply({detail:'service_unavailable'},503);}saved={...req.postDataJSON(),draft_ref:'WFW_DIALOG',revision:2,photos:[],updated_at:'2026-11-06T10:00:00Z'};return reply(saved);}
 if(path.endsWith('/quick-sell-drafts'))return reply({drafts:saved?[saved]:[]});
 if(path.endsWith('/products'))return reply({products:[],total:0});
 return reply({});});
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/wenze/sell/`);await page.getByRole('button',{name:t.title,exact:true}).click();
 await page.locator('input[name=name]').fill('Article de test privé');mkdirSync(evidence,{recursive:true});await page.screenshot({path:`${evidence}/form-${locale}-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:t.cancel,exact:true}).click();const dialog=page.getByRole('dialog');await expect(dialog.getByRole('radio').first()).toBeChecked();await dialog.getByRole('radio').nth(1).check();await dialog.getByRole('button',{name:d.continue,exact:true}).click();await expect(dialog.getByRole('alert')).toBeVisible();await expect(page.locator('input[name=name]')).toHaveValue('Article de test privé');await page.screenshot({path:`${evidence}/leave-${locale}-${width}.png`,fullPage:true});
 await dialog.getByRole('button',{name:d.continue,exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.locator('.qs-draft-card')).toContainText('Article de test privé');
 await page.locator('.qs-draft-card').getByRole('button',{name:listingWorkspaceCopy[locale].remove,exact:true}).click();await expect(dialog.getByRole('button',{name:d.retainDraft,exact:true})).toBeFocused();
 await expect(dialog.getByRole('button',{name:d.deleteDraft,exact:true})).toBeVisible();
 const heading=await dialog.getByRole('heading',{name:d.remove,exact:true}).boundingBox(),icon=await dialog.locator('.shida-confirmation-symbol').boundingBox();
 expect(heading).not.toBeNull();expect(icon).not.toBeNull();expect(icon!.x+icon!.width).toBeLessThan(heading!.x);expect(Math.abs(icon!.y+icon!.height/2-heading!.y-heading!.height/2)).toBeLessThan(2);
 expect(await dialog.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
 await page.screenshot({path:`${evidence}/delete-${locale}-${width}.png`,fullPage:true});
 await dialog.getByRole('button',{name:d.retainDraft,exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.locator('.qs-draft-card')).toBeVisible();
 await page.locator('.qs-draft-card').getByRole('button',{name:listingWorkspaceCopy[locale].remove,exact:true}).click();await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(page.locator('.qs-draft-card')).toBeVisible();
 await page.locator('.qs-draft-card').getByRole('button',{name:listingWorkspaceCopy[locale].remove,exact:true}).click();await dialog.getByRole('button').last().click();await expect(page.locator('.qs-draft-card')).toBeVisible();await expect(dialog.getByRole('alert')).toBeVisible();
 await dialog.getByRole('button').last().click();await expect(page.locator('.qs-draft-card')).toHaveCount(0);
});
