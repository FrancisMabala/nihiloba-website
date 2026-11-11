import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './wenze-checkout-fixture';
import {productFixture} from './wenze-products-fixture';

const evidence=process.env.WENZE_CREATION_EVIDENCE||'test-results/creation-evidence';
const shop={public_ref:'WNZ_fixture',revision:1,name:'Boutique Mwinda',category:'fashion_clothing',status:'active',visible:'true',city:'Kinshasa',catalog_ready:true,order_ready:false,store_type:'online_and_physical'};
const labels=(fr:string)=>({fr,en:fr,ln:fr,sw:fr});
async function capture(page:Page,name:string){mkdirSync(evidence,{recursive:true});await page.evaluate(()=>window.scrollTo(0,0));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(name.endsWith('1536'))writeFileSync(join(evidence,name+'-layout.json'),JSON.stringify(await page.locator('.wp-steps,h1,.wc-lead,.wc-card,.wc-private,.wc-stock tr,.wp-step-actions').evaluateAll(nodes=>nodes.filter(el=>el.getClientRects().length).map(el=>({tag:el.tagName,cls:el.className,y:Math.round(el.getBoundingClientRect().y),h:Math.round(el.getBoundingClientRect().height)})))));await page.screenshot({path:join(evidence,name+'.png'),animations:'disabled',fullPage:name.endsWith('-390')});}
for(const width of [1536,390])test('create shop, first product, selective stock and partial retries '+width,async({page})=>{
 await page.setViewportSize({width,height:width===1536?1024:844});const base=await fixture(page,{locale:'fr'});
 let shops=0,posts=0,costs=0,labelReads=0,labelsFail=true,costFail=true;
 const photoData:string[]=[],identities:string[]=[];let saved:Record<string,unknown>={};
 await page.route('**/api/shida/personal/wenze/stores/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,''),reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/stores')){
   if(req.method()==='POST'){shops++;expect(req.postDataJSON().name).toBe(shop.name);return reply(shop);}
   return reply({stores:shops?[shop]:[],categories:[{code:'fashion_clothing',labels:labels('Mode & vêtements')}],product_categories:[{parent:'fashion_clothing',code:'fashion_clothing:shirts',labels:labels('Chemise')}],currencies:['CDF','USD']});
  }
  if(path.endsWith('/WNZ_fixture'))return reply(shop);
  if(path.endsWith('/drafts'))return reply({draft_ref:'WFW_first',revision:1});
  if(path.endsWith('/uploads')){photoData.push((process.env.WENZE_CREATION_EVIDENCE?'data:image/png;base64,':'data:image/webp;base64,')+req.postDataJSON().content_base64);return reply({upload_ref:'U'+photoData.length});}
  if(path.endsWith('/products')&&req.method()==='POST'){
   posts++;const f=req.postDataJSON();expect(f.purchase_price).toBeUndefined();expect(f.draft_ref).toBe('WFW_first');identities.push(req.headers()['idempotency-key']);
   expect(f.variants.map((v:{stock_quantity:number})=>v.stock_quantity)).toEqual([4,4,4,4,4,2]);
   saved={...f,public_ref:'WNP_saved',revision:1,status:'active',visible:'true',available_stock:22,photos:photoData.map((url,i)=>({url,photo_ref:'PHOTO'+i})),variants:f.variants.map((v:{label:string;stock_quantity:number;option_attributes:Record<string,string>},i:number)=>({...v,is_available:'yes',available_stock:v.stock_quantity,public_ref:'WNV_'+i}))};
   if(posts===1)return route.abort('failed');return reply(saved);
  }
  if(path.endsWith('/products/WNP_saved'))return reply(saved);
  if(path.endsWith('/private-cost')){costs++;if(costFail)return reply({detail:'temporary'},503);return reply({revision:1});}
  if(path.includes('/labels/')){labelReads++;if(labelsFail)return reply({detail:'temporary'},503);return reply({barcode:path.split('/').at(-1),name:saved.name,shop_name:shop.name,price:'15000',currency:'CDF',variant:null,bars:[[2,2]],width:24});}
  return route.fallback();
 });
 await page.goto(base.url.split('?')[0]);await page.locator('.wz-seller-setup button.button-primary').click();
 const storeForm=page.locator('.wb-content');await storeForm.getByRole('textbox').first().fill(shop.name);await storeForm.locator('.wb-categories input').first().check();await storeForm.locator('.wb-fields input').first().fill('Kinshasa');
 for(let i=0;i<3;i++)await storeForm.locator('footer .button-primary').click();
 await expect(page.locator('.wc-welcome h1')).toHaveText(shop.name);await capture(page,'5-welcome-'+width);
 await page.getByRole('button',{name:'Ajouter mon premier produit'}).click();
 const w=page.locator('.wp-wizard');await w.getByLabel('Nom du produit').fill('Chemise élégante à manches longues');await w.locator('select').nth(1).selectOption('fashion_clothing:shirts');await w.getByLabel('Description').fill('Chemise vert foncé à manches longues, avec col classique et poignets boutonnés.');
 const cost=w.locator('.wc-private input');await w.getByLabel('Prix de vente').fill('15000');await expect(w.locator('output')).toContainText('Entrez le coût');await cost.fill('0');await expect(w.locator('output')).toContainText(/15\s000 CDF/);await cost.fill('20000');await expect(w.locator('output')).toContainText('Vous perdez');await cost.fill('10000');await w.locator('.wc-toggle input').check();await expect(w).toContainText('Le calcul utilise le prix affiché');await w.locator('.wc-toggle input').uncheck();
 await page.locator('.market-language').click();await page.getByRole('button',{name:'Kiswahili',exact:true}).click();await expect(w).toContainText('Kinachobaki kwa kila shati');await expect(w.getByLabel('Jina la bidhaa')).toHaveValue('Chemise élégante à manches longues');await page.locator('.market-language').click();await page.getByRole('button',{name:'Français',exact:true}).click();await expect(w.locator('output')).toContainText('Ce qu’il vous reste par chemise');await capture(page,'4-info-'+width);
 const next=()=>w.locator('.wp-step-actions .seller-primary').click();await next();
 for(let i=0;i<4;i++){const buffer=process.env.WENZE_CREATION_EVIDENCE?readFileSync(join(evidence,'upload-'+i+'.png')):readFileSync('public/images/wenze-boutique-market.webp');await w.locator('input[type=file]').setInputFiles({name:'photo'+i+(process.env.WENZE_CREATION_EVIDENCE?'.png':'.webp'),mimeType:process.env.WENZE_CREATION_EVIDENCE?'image/png':'image/webp',buffer});await expect(w.locator('.wp-photo-grid img')).toHaveCount(i+1);}
 await capture(page,'6-photos-'+width);await next();await w.getByRole('button',{name:'Plusieurs versions'}).click();await w.getByRole('button',{name:'Vert',exact:true}).click();
 for(const size of ['XS','S','M','L','XL']){await w.getByRole('button',{name:size,exact:true}).click();await w.getByRole('spinbutton',{name:'Quantité · '+size+' / Vert',exact:true}).fill('4');}
 await expect(w).toContainText('20 pièces au total');await w.getByLabel(/Votre taille manque/).fill('3XL');await w.getByRole('button',{name:'Ajouter cette taille'}).click();
 const q=w.getByRole('spinbutton',{name:'Quantité · 3XL / Vert'});await expect(q).toBeFocused();await expect(q).toBeInViewport({ratio:1});await expect(q).toHaveValue('');await expect(w).toContainText('Taille 3XL ajoutée. Indiquez la quantité.');await expect(w).toContainText('20 pièces au total');await capture(page,'1-options-'+width);await q.fill('2');await expect(w).toContainText('22 pièces au total');await next();
 for(const [edit,selector] of [['Modifier les informations','input'],['Modifier les photos','.wp-photo-grid img'],['Modifier le stock','table']] as const){await w.getByRole('button',{name:edit}).click();await expect(w.locator(selector).first()).toBeVisible();await next();await expect(w.getByRole('heading',{name:'Vérifier le produit'})).toBeVisible();}
 await expect(w.locator('tbody tr')).toHaveCount(6);await capture(page,'3-review-'+width);await w.locator('.wp-step-actions .seller-primary').evaluate((button:HTMLButtonElement)=>{button.click();button.click();});await expect(w.getByRole('alert')).toBeVisible();await next();expect(identities[1]).toBe(identities[0]);
 const card=page.locator('.wp-created');await expect(card.getByRole('heading').first()).toContainText('Produit ajouté à Boutique Mwinda !');await expect(card).toContainText('22 pièces · 6 tailles · Vert');await expect(card).toContainText('Étiquettes indisponibles');await expect(card).toContainText('Coût d’achat à confirmer');await capture(page,'2-confirmation-'+width);
 const count=labelReads;costFail=false;await card.getByRole('button',{name:'Vérifier le coût d’achat'}).click();await expect(card.getByText('Coût d’achat à confirmer')).toHaveCount(0);expect(labelReads).toBe(count);const costCount=costs;labelsFail=false;await card.getByRole('button',{name:'Réessayer les étiquettes'}).click();await expect(card.getByRole('button',{name:'Imprimer les étiquettes'})).toBeVisible();expect(costs).toBe(costCount);
 await card.getByRole('button',{name:'Voir le produit'}).click();await expect(page.locator('.wp-product-summary')).toContainText('Chemise élégante');await page.reload();await expect(page.locator('.wc-welcome')).toHaveCount(0);await expect(page.locator('.wp-product-summary')).toContainText('Chemise élégante');expect(shops).toBe(1);expect(posts).toBe(2);expect(base.errors).toEqual([]);
});
test('basic plan: electronics, single quantity, no private fields',async({page})=>{
 const f=await productFixture(page);await page.route('**/products/WNP_created/preview/',route=>route.fulfill({json:{name:'Radio',public_detail_url:'https://nihiloba.com/shida/wenze/products/WNP_created'}}));await page.route('**/plan/',route=>route.fulfill({json:{plan:'free'}}));await page.goto(f.url);await page.getByRole('button',{name:'Add product',exact:true}).click();const w=page.locator('.wp-wizard');await w.getByLabel('Product name').fill('Radio');await w.getByLabel('Selling price').fill('10');await w.locator('select').first().selectOption('phones_electronics');await expect(w.locator('.wc-private')).toHaveCount(0);const next=()=>w.locator('.wp-step-actions .seller-primary').click();await next();await w.locator('input[type=file]').setInputFiles('public/images/wenze-boutique-market.webp');await next();await w.getByRole('spinbutton').fill('7');await next();await expect(w).toContainText('7 items in total');await expect(w.locator('.wc-private')).toHaveCount(0);await next();await expect(w).toHaveCount(0);const payload=f.writes.find(x=>x.path.endsWith('/products'))?.body;expect(payload).toMatchObject({stock_quantity:7,category:'phones_electronics',variants:[]});expect(payload).not.toHaveProperty('purchase_price');await expect(page.locator('.wp-created')).toContainText('7 items in total');
 await page.getByRole('button',{name:'View product',exact:true}).click();await expect(page.locator('.wd-details')).toContainText('7 pieces available');await page.getByRole('button',{name:'Share',exact:true}).click();await expect(page.getByRole('dialog').getByRole('link')).toHaveAttribute('href','https://nihiloba.com/shida/wenze/products/WNP_created');await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Print labels',exact:true}).click();await expect(page.locator('.wd-labels input')).toHaveCount(1);await page.locator('.wd-labels tbody button').click();await expect(page.locator('.wd-labels .seller-primary')).toBeEnabled();
});

test('sparse electronics choices preserve other rows, block duplicates and stop at twenty',async({page})=>{
 const f=await productFixture(page);await page.goto(f.url);await page.getByRole('button',{name:'Add product',exact:true}).click();const w=page.locator('.wp-wizard'),next=()=>w.locator('.wp-step-actions .seller-primary').click();
 await w.getByLabel('Product name').fill('Portable radio');await w.getByLabel('Selling price').fill('40');await w.locator('select').first().selectOption('phones_electronics');await next();await w.locator('input[type=file]').setInputFiles('public/images/wenze-boutique-market.webp');await next();await w.getByRole('button',{name:'Several versions'}).click();
 await w.getByRole('button',{name:'Black',exact:true}).click();await w.getByRole('button',{name:'64 GB',exact:true}).click();await w.getByRole('spinbutton').fill('4');await w.getByRole('button',{name:'128 GB',exact:true}).click();await w.getByRole('spinbutton').last().fill('7');await w.getByRole('button',{name:'Green',exact:true}).click();await expect(w.getByRole('spinbutton')).toHaveCount(3);
 await expect(w.getByRole('spinbutton',{name:'Quantity · 64 GB / Green'})).toHaveCount(0);await w.getByRole('button',{name:'Green',exact:true}).click();await expect(w.getByRole('status')).toHaveText('This version is already in your stock.');await expect(w.getByRole('spinbutton')).toHaveCount(3);
 await w.getByRole('button',{name:'Remove · 128 GB / Black'}).click();await expect(w.getByRole('spinbutton').first()).toHaveValue('4');
 const custom=w.getByLabel('Storage: is your choice missing?');for(let i=0;i<19;i++){await custom.fill('Model '+i);await w.getByRole('button',{name:'Add Storage',exact:true}).click();if(i<18)await expect(w.getByRole('spinbutton').last()).toBeFocused();}
 await expect(w.getByRole('spinbutton')).toHaveCount(20);await expect(w.getByRole('status')).toContainText('20-version limit');await expect(w.getByRole('spinbutton').first()).toHaveValue('4');
});

test('bottled drinks use volume and preserve stock per format',async({page})=>{
 const f=await productFixture(page);await page.route(/\/api\/shida\/personal\/wenze\/stores\/(?:\?.*)?$/,route=>route.fulfill({json:{stores:[{...shop,category:'food_drinks'}],categories:[{code:'food_drinks',labels:labels('Food and drinks')}],product_categories:[{parent:'food_drinks',code:'food_drinks:drinks',labels:labels('Drinks')}],currencies:['CDF']}}));
 await page.goto(f.url);await page.getByRole('button',{name:'Add product',exact:true}).click();const w=page.locator('.wp-wizard'),next=()=>w.locator('.wp-step-actions .seller-primary').click();await w.getByLabel('Product name').fill('Jus de mangue');await w.getByLabel('Selling price').fill('2000');await w.locator('select').first().selectOption('food_drinks');await w.locator('select').nth(1).selectOption('food_drinks:drinks');await next();await w.locator('input[type=file]').setInputFiles('public/images/wenze-boutique-market.webp');await next();await w.getByRole('button',{name:'Several versions'}).click();
 for(const [i,format] of ['250 ml','500 ml'].entries()){await w.getByRole('button',{name:format,exact:true}).click();await w.getByRole('spinbutton').nth(i).fill(String(i+2));}await next();await expect(w).toContainText('5 items in total');await next();const b=f.writes.find(x=>x.path.endsWith('/products'))?.body;expect(b).toMatchObject({category:'food_drinks:drinks',variants:[{option_attributes:{volume:'250 ml'},stock_quantity:2},{option_attributes:{volume:'500 ml'},stock_quantity:3}]});
});
