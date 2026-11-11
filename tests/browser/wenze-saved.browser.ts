import {expect,test} from '@playwright/test';
import {mkdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './wenze-checkout-fixture';
import {creationText} from '../../app/lib/wenze-creation';
import {savedText,type SavedProduct,type SavedOption} from '../../app/lib/wenze-saved';
import {posText} from '../../app/lib/wenze-pos-copy';
import editor from '../../app/lib/wenze-editor-copy.json';
import {wenzeCopy,type WenzeLocale} from '../../app/lib/wenze-copy';

const sizes=['XS','S','M','L','XL'],shop={public_ref:'WNZ_fixture',revision:1,name:'Boutique Mwinda',status:'active',visible:'true',city:'Kinshasa',category:'fashion_clothing',catalog_ready:true,order_ready:false,store_type:'online_and_physical'};
// Alternating Code128 module widths for the five test barcodes.
const barcodeBars=["2112143113211133213111231112242131132313113123111321131231223113212331112", "2112143113211133213111231112242131132313113123111321131232211114222331112", "2112143113211133213111231112242131132313113123111321132232111421122331112", "2112143113211133213111231112242131132313113123111321132211321212412331112", "2112143113211133213111231112242131132313113123111321132212314121212331112"].map(code=>{let x=10;return Array.from({length:Math.ceil(code.length/2)},(_,i)=>{const w=Number(code[i*2]),bar=[x,w];x+=w+Number(code[i*2+1]??0);return bar;});});
const title='Chemise élégante à manches longues', evidence=process.env.WENZE_CREATION_EVIDENCE;
const locales:WenzeLocale[]=['fr','en','ln','sw'];
for(const [locale,width] of [...locales.map(l=>[l,390] as const),['fr',1536] as const])test('first product to stock and labels '+locale+' '+width,async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width,height:width===390?844:1024});
 const f=await fixture(page,{locale}),ct=creationText.bind(null,locale),st=savedText.bind(null,locale),e=editor[locale];
 const green={fr:'Vert',en:'Green',ln:'Vert',sw:'Kijani'}[locale],w=page.locator('.wp-wizard'),click=(name:string)=>page.getByRole('button',{name,exact:true}).click(),next=()=>w.locator('.wp-step-actions .seller-primary').click();
 async function capture(key:string){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(evidence){mkdirSync(evidence,{recursive:true});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:join(evidence,key+'-'+locale+'-'+width+'.png'),fullPage:width===390,animations:'disabled'});}}
 let shops=0,posts=0,adds=0,puts=0,intervene=false,pending=width===1536;const exports:unknown[]=[];
 const photos:string[]=[];let p:SavedProduct={public_ref:'WNP_saved',name:title,revision:1,category:'fashion_clothing:shirts',status:'active',visible:'true',variants:[],available_stock:20};
 const publicURL='https://www.nihiloba.com/shida/wenze/products/WNP_saved/';
 await page.route('**/api/shida/personal/wenze/stores/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,''),reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/stores')){if(req.method()==='POST'){shops++;return reply(shop);}
   return reply({stores:shops?[shop]:[],categories:[{code:'fashion_clothing',labels:{fr:'Mode & vêtements',en:'Clothing',ln:'Bilamba',sw:'Mavazi'}}],product_categories:[{parent:'fashion_clothing',code:'fashion_clothing:shirts',labels:{fr:'Chemises',en:'Shirts',ln:'Bashémisi',sw:'Mashati'}}],currencies:['CDF','USD']});}
  if(path.endsWith('/WNZ_fixture'))return reply(shop);
  if(path.endsWith('/drafts'))return reply({draft_ref:'WFW_test',revision:1});
  if(path.endsWith('/uploads')){photos.push('data:image/'+(evidence?'png':'webp')+';base64,'+req.postDataJSON().content_base64);return reply({upload_ref:'U'+photos.length});}
  if(path.endsWith('/products')&&req.method()==='POST'){posts++;const b=req.postDataJSON();expect(b).not.toHaveProperty('purchase_price');p={...p,...b,photos:b.upload_refs.map((ref:string)=>({photo_ref:ref,url:photos[Number(ref.slice(1))-1]})),variants:b.variants.map((r:SavedOption & {stock_quantity:number},i:number)=>({...r,public_ref:'WNV_SIZE'+i,available_stock:r.stock_quantity,committed_quantity:0,is_available:'yes'}))};return reply(p);}
  if(path.endsWith('/preview'))return reply({name:p.name,public_detail_url:publicURL});
  if(path.endsWith('/private-cost'))return req.method()==='PUT'?(pending?reply({detail:'temporary'},503):reply({revision:1})):reply({target_ref:url.searchParams.get('variant_ref'),configured:true,unit_cost:'10000',currency:'CDF'});
  if(path.endsWith('/variants')){const b=req.postDataJSON();expect(b.expected_revision).toBe(p.revision);adds++;p.variants!.push({public_ref:'WNV_3XL',label:b.label,option_attributes:b.option_attributes,available_stock:b.available_quantity,committed_quantity:0,is_available:'yes'});p.available_stock=22;p.revision++;return route.abort('failed');}
  if(path.endsWith('/stock')){const b=req.postDataJSON(),r=p.variants!.find(x=>x.public_ref===b.variant_ref)!;puts++;
   if(intervene&&puts===2){r.available_stock=3;r.committed_quantity=1;return reply({detail:'stock_changed'},409);}expect(b.observed.available).toBe(r.available_stock);r.available_stock=b.available_quantity;p.revision++;p.available_stock=p.variants!.reduce((n,v)=>n+(v.available_stock??0),0);return reply(p);}
  if(path.endsWith('/labels/pdf')){exports.push(req.postDataJSON());return route.fulfill({contentType:'application/pdf',body:'%PDF-1.4 test',headers:{'content-disposition':'attachment; filename="labels.pdf"'}});}
  if(path.includes('/labels/')){const code=path.split('/').at(-1),row=p.variants!.find(v=>v.public_ref===code)!;return reply({shop_name:shop.name,name:p.name,price:p.price,currency:p.currency,variant:row.label,barcode:code,bars:barcodeBars[sizes.indexOf(row.option_attributes!.size)]??barcodeBars[0],width:154});}
  if(path.endsWith('/products/WNP_saved'))return reply(p);return route.fallback();
 });
 await page.goto(f.url.split('?')[0]);await page.locator('.wz-seller-setup button.button-primary').click();const form=page.locator('.wb-content');
 await form.getByRole('textbox').first().fill(shop.name);await form.locator('.wb-categories input').first().check();await form.locator('.wb-fields input').first().fill('Kinshasa');for(let i=0;i<3;i++)await form.locator('footer .button-primary').click();
 await expect(page.locator('.wc-welcome h1')).toHaveText(shop.name);await capture('welcome');await click(ct('first'));
 await w.getByLabel(ct('name')).fill(title);await w.locator('select').nth(1).selectOption('fashion_clothing:shirts');await w.locator('textarea').fill('Chemise élégante pour homme à manches longues, confortable et facile à porter.');await w.locator('.wc-info details summary').click();await w.locator('.wc-info details select').selectOption('new');await w.locator('.wc-info details summary').click();
 await w.getByLabel(ct('sale')).fill('15000');await w.locator('.wc-private input').fill('10000');await expect(w.locator('output')).toContainText(ct('before',{amount:await page.evaluate(l=>new Intl.NumberFormat(l).format(5000),locale)+' CDF'}));await capture('info');await next();
 for(const [index,i] of [0,1,3,2].entries()){await w.locator('input[type=file]').setInputFiles({name:'photo'+i+(evidence?'.png':'.webp'),mimeType:evidence?'image/png':'image/webp',buffer:readFileSync(evidence?join(evidence,'upload-'+i+'.png'):'public/images/wenze-boutique-market.webp')});await expect(w.locator('.wp-photo-grid img')).toHaveCount(index+1);await expect(w.locator('.wp-photo-grid img').last()).toBeVisible();}
 await expect(w.locator('.wp-photo-grid img')).toHaveCount(4);await capture('photos');await next();await click(ct('multi'));await click(green);
 for(const size of sizes){await click(size);await w.getByRole('spinbutton').last().fill('4');}
 await expect(w).toContainText(ct('total',{n:20}));await capture('stock');await next();
 await click(ct('editInfo'));await w.getByLabel(ct('sale')).fill('15500');await next();await expect(w.locator('.wc-price')).toContainText(await page.evaluate(l=>new Intl.NumberFormat(l).format(15500),locale));
 await click(ct('editInfo'));await w.getByLabel(ct('sale')).fill('15000');await next();await click(ct('editPhotos'));await w.locator('.wp-photo-grid article').last().getByRole('button',{name:wenzeCopy[locale].earlier}).click();await next();
 await click(ct('editStock'));await w.getByRole('spinbutton').first().fill('3');await next();await expect(w).toContainText(ct('total',{n:19}));await click(ct('editStock'));await w.getByRole('spinbutton').first().fill('4');await next();await capture('review');await next();
 await expect(page.locator('.wp-created')).toContainText(ct('created',{shop:shop.name}));await capture('created');await click(posText(locale,'viewProduct'));
 await expect(page.locator('.wd-details')).toContainText(st('count',20));if(pending){await expect(page.locator('.wd-prices')).toContainText(ct('pending'));await capture('details');pending=false;await click(ct('retryCost'));}await expect(page.locator('.wd-prices output')).toBeVisible();if(width===390)await capture('details');
 await click(e.share);await expect(page.getByRole('dialog').locator('a')).toHaveAttribute('href',publicURL);await click(e.close);
 await click(st('printLabels'));const panel=page.locator('.wd-labels'),copies=panel.getByRole('spinbutton');await expect(copies).toHaveCount(5);await expect(panel.getByRole('button',{name:st('printCount',5)})).toBeEnabled();await capture('labels');
 const send=async(n:number)=>{const pop=page.waitForEvent('popup');await click(n===1?st('printOne'):st('printCount',n));await (await pop).close();await expect.poll(()=>exports.length).toBeGreaterThan(0);};
 await send(5);await click(st('each'));await expect(panel.getByRole('button',{name:st('printCount',20)})).toBeEnabled();await send(20);
 for(let i=0;i<5;i++)await copies.nth(i).fill(i===1?'1':'0');await panel.locator('tbody button').nth(2).click();await expect(copies.nth(1)).toHaveValue('1');
 const download=page.waitForEvent('download');await click(posText(locale,'download'));await download;await send(1);await expect.poll(()=>exports.length).toBe(4);
 expect(exports).toEqual([1,4].map(n=>({items:sizes.map((_,i)=>({code:'WNV_SIZE'+i,copies:n}))})).concat(Array(2).fill({items:[{code:'WNV_SIZE1',copies:1}]})));expect(p.available_stock).toBe(20);
 await page.locator('.wd-back').click();await click(st('editStock'));await click('＋ '+st('addSizeColour'));await page.locator('.wd-add input').first().fill('3XL');await click(ct('addSize'));
 const field=page.locator('.wd-editor tr[data-new=true] input');await expect(field).toBeFocused();await expect(field).toHaveValue('');await expect(page.locator('.wd-editor h3')).toHaveText(st('count',20));await capture('editor');await field.fill('2');await expect(page.locator('.wd-editor h3')).toHaveText(st('count',22));await click(st('save'));
 await expect(page.locator('.wd-details')).toContainText(st('count',22));await page.reload();await expect(page.locator('.wd-details tbody tr')).toHaveCount(6);expect(p.variants!.map(v=>v.available_stock)).toEqual([4,4,4,4,4,2]);expect([shops,posts,adds]).toEqual([1,1,1]);
 if(width===1536){intervene=true;await click(st('editStock'));const q=page.locator('.wd-editor tbody input[type=number]');await q.nth(0).fill('5');await q.nth(1).fill('6');await q.nth(2).fill('7');await click(st('save'));await expect(page.locator('.wd-editor').getByRole('alert')).toContainText(st('conflict',3));await expect(q.nth(2)).toHaveValue('7');await click(st('useMine'));await click(st('save'));await expect(page.locator('.wd-details tbody tr').nth(1)).toContainText('6');expect(p.variants![1].committed_quantity).toBe(1);expect(puts).toBe(4);}
 expect(f.errors).toEqual([]);
});
