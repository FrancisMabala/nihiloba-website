import {test,expect,type Page} from '@playwright/test';
import {fixture} from './wenze-checkout-fixture';
async function setup(page:Page,status='active',locale:'en'|'fr'|'ln'|'sw'='en'){
 const f=await fixture(page,{locale});let shop={public_ref:"WNZ_fixture",name:"Boutique du Fleuve",store_type:"online_and_physical",city:"Kinshasa",category:"fashion_clothing",revision:1,catalog_ready:true,order_ready:true,status,visible:status==='active'?'true':'false',description:'Controlled shop description',area:'Gombe',commune:'Gombe',quartier:'Centre',fulfillment_mode:'pickup_and_delivery',address:'Controlled public pickup address',landmark:'Market entrance',delivery_fee_type:'fixed',delivery_fee:'1500',delivery_currency:'CDF',delivery_areas:['Gombe','Limete'],preparation_estimate:'2 hours',delivery_estimate:'1 day',profile_image_url:'/images/wenze-boutique-market.webp'};
 const writes:{path:string;body:Record<string,unknown>}[]=[];let methods=['cash'];
 await page.route('**/api/**/stores/**',async route=>{const path=new URL(route.request().url()).pathname.replace(/\/$/,'');if(route.request().method()!=='GET'){const body=route.request().postDataJSON();writes.push({path,body});if(path.endsWith('/payment-preferences')){methods=body.methods;return route.fulfill({json:{revision:2,selected:methods,available:['cash','mobile_money','other'],coming_soon:['card','paypal'],online_collection_enabled:false}});}if(path.endsWith('/uploads'))return route.fulfill({json:{upload_ref:'UPLOAD_controlled'}});if(path.endsWith('/profile-photo')){shop={...shop,revision:shop.revision+1,profile_image_url:body.upload_ref?'/images/wenze-boutique-market.webp':''};return route.fulfill({json:shop});}shop={...shop,...body.fields,revision:shop.revision+1};if(path.includes('/lifecycle/')){const action=path.split('/').pop();shop={...shop,status:action==='archive'?'inactive':'active',visible:action==='show'?'true':'false'};}return route.fulfill({json:shop});}
 if(path.endsWith('/stores'))return route.fulfill({json:{stores:[shop,{...shop,public_ref:'WNZ_second',name:'Second controlled shop',description:'Different shop details'}],categories:[{code:'fashion_clothing',labels:{en:'Clothing',fr:'Vêtements',ln:'Bilamba',sw:'Mavazi'}}],currencies:['CDF','USD']}});
 if(path.endsWith('/WNZ_second'))return route.fulfill({json:{...shop,public_ref:'WNZ_second',name:'Second controlled shop',description:'Different shop details'}});
 if(path.endsWith('/WNZ_fixture'))return route.fulfill({json:shop});if(path.endsWith('/plan'))return route.fulfill({json:{plan:'pro',source:'personal_pilot',active_products:3,active_product_limit:200,free_import_allowance:20,free_import_used:0}});if(path.endsWith('/payment-preferences'))return route.fulfill({json:{revision:shop.revision,selected:methods,available:['cash','mobile_money','other'],coming_soon:['card','paypal'],online_collection_enabled:false}});return route.fallback();});return{...f,writes};
}
for(const width of [360,390,768,1440])test(`shop management ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const f=await setup(page);await page.goto(f.url+'&view=shop');await expect(page.locator('.wz-shop-identity')).toContainText('Boutique du Fleuve');await expect(page.locator('.ws-facts')).toContainText('Controlled shop description');await expect(page.locator('.wz-editor')).toHaveCount(0);await page.screenshot({path:`test-results/shop-evidence/details-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Edit',exact:true}).click();await page.locator('.wz-editor').getByLabel('Name',{exact:true}).fill('Unsaved name');await page.screenshot({path:`test-results/shop-evidence/edit-${width}.png`,fullPage:true});await page.locator('.wz-editor').getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:/Discard/}).click();await expect(page.locator('.ws-facts')).not.toContainText('Unsaved name');
 await page.getByRole('button',{name:'Edit',exact:true}).click();await page.locator('.wz-editor').getByLabel('Name',{exact:true}).fill('Updated controlled shop');await page.locator('.wz-editor').getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.wz-shop-identity')).toContainText('Updated controlled shop');expect(f.writes.at(-1)?.body).toMatchObject({expected_revision:1,fields:{name:'Updated controlled shop'}});
 await page.locator('.wz-shop-tabs').getByRole('button').nth(1).click();await expect(page.locator('.ws-modes')).toBeVisible();await expect(page.locator('.wz-editor input[type=checkbox]')).not.toBeChecked();await page.screenshot({path:`test-results/shop-evidence/delivery-${width}.png`,fullPage:true});await page.locator('.wz-editor input[type=checkbox]').check();await page.locator('.wz-editor').getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.wz-editor')).toHaveCount(0);expect(f.writes.at(-1)?.body.public_address_confirmed).toBe(true);
 await page.locator('.wz-shop-tabs').getByRole('button').nth(2).click();await expect(page.locator('.ws-trust')).toContainText('not a violation notice');await expect(page.locator('.wz-payment-preferences input[disabled]')).toHaveCount(2);await expect(page.locator('.wz-account-access')).toContainText('3 / 200');await page.screenshot({path:`test-results/shop-evidence/settings-${width}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(f.errors).toEqual([]);
});
test('suspended shop has a restriction and no owner reactivation',async({page})=>{const f=await setup(page,'suspended');await page.goto(f.url+'&view=shop');await expect(page.locator('.ws-trust')).toContainText('Shop suspended');await expect(page.locator('.ws-visibility button:enabled')).toHaveCount(0);await expect(page.locator('.wz-shop-identity')).not.toContainText('Archived');await page.screenshot({path:'test-results/shop-evidence/suspended.png',fullPage:true});expect(f.writes).toHaveLength(0);});
test('changing shop replaces details and selected context',async({page})=>{const f=await setup(page);await page.goto(f.url+'&view=shop');await page.getByRole('combobox',{name:'Shops',exact:true}).selectOption('WNZ_second');await expect(page.locator('.wz-shop-identity')).toContainText('Second controlled shop');await expect(page.locator('.ws-facts')).toContainText('Different shop details');expect(f.writes).toHaveLength(0);});
test('photo replacement, removal and supported payments use existing APIs',async({page})=>{
 const f=await setup(page);await page.goto(f.url+'&view=shop');
 const upload=page.locator('.wz-shop-photo input[type=file]');
 for(let n=0;n<2;n++){
 await upload.setInputFiles('public/images/wenze-boutique-market.webp');
 await expect.poll(()=>f.writes.filter(w=>w.path.endsWith('/profile-photo')).length).toBe(n+1);
 await expect(page.locator('.wz-shop-photo img')).toBeVisible();
 }
 await page.screenshot({path:'test-results/shop-evidence/photo-upload.png',fullPage:true});
 await page.locator('.wz-shop-photo').getByRole('button',{name:'Remove',exact:true}).click();
 await expect(page.locator('.wz-shop-photo img')).toHaveCount(0);
 expect(f.writes.at(-1)?.body.upload_ref).toBeNull();
 await page.locator('.wz-shop-tabs button').nth(2).click();
 const prefs=page.locator('.wz-payment-preferences');await prefs.getByLabel('Mobile money',{exact:true}).check();
 await prefs.getByRole('button',{name:'Save preferences',exact:true}).click();await expect(prefs.getByRole('status')).toContainText('saved');
 expect(f.writes.at(-1)?.body.methods).toEqual(['cash','mobile_money']);await expect(prefs.getByLabel('Other offline methods')).toBeEnabled();expect(f.errors).toEqual([]);
});
test('voluntary visibility transitions retain confirmation and hide public link',async({page})=>{
 const f=await setup(page);await page.goto(f.url+'&view=shop');await page.locator('.wz-shop-tabs button').nth(2).click();
 for(const [index,action,status] of [[1,'hide','Hidden'],[2,'archive','Archived'],[1,'restore','Hidden'],[0,'show','Active']] as const){
 await page.locator('.ws-visibility button').nth(index).click();await expect(page.locator('.wz-confirm[open]')).toBeVisible();
 await page.locator('.wz-confirm[open] button').last().click();await expect(page.locator('.wz-shop-identity .wz-status')).toHaveText(status);
 expect(f.writes.at(-1)?.path).toContain('/lifecycle/'+action);await expect(page.locator('.wz-shop-identity a')).toHaveCount(status==='Active'?1:0);
 }
});
for(const locale of ['fr','ln','sw'] as const)test(`localized shop ${locale}`,async({page})=>{
 await page.setViewportSize({width:390,height:900});const f=await setup(page,'active',locale);await page.goto(f.url+'&view=shop');await page.locator('.wz-shop-tabs button').nth(2).click();
 await expect(page.locator('.ws-trust h3')).not.toBeEmpty();await expect(page.locator('.ws-trust a')).toHaveAttribute('href','/fr/utilisation-acceptable');
 await page.screenshot({path:`test-results/shop-evidence/settings-${locale}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(f.errors).toEqual([]);
});
test('failed save keeps full edited data for retry',async({page})=>{
 const f=await setup(page);await page.goto(f.url+'&view=shop');await page.getByRole('button',{name:'Edit',exact:true}).click();const editor=page.locator('.wz-editor');
 await editor.getByRole('textbox',{name:'Description',exact:true}).fill('Full description retained after a failed save');
 await page.route('**/api/**',route=>route.request().method()==='PATCH'&&new URL(route.request().url()).pathname.replace(/\/$/,'').endsWith('/stores/WNZ_fixture')?route.fulfill({status:503,json:{detail:'unavailable'}}):route.fallback());
 await editor.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.ws-shop').getByRole('alert')).toBeVisible();await expect(editor.getByRole('textbox',{name:'Description',exact:true})).toHaveValue('Full description retained after a failed save');await page.screenshot({path:'test-results/shop-evidence/save-error.png',fullPage:true});
});
test('pickup, delivery-only and free fees preserve supported field rules',async({page})=>{
 const f=await setup(page);await page.goto(f.url+'&view=shop');await page.locator('.wz-shop-tabs button').nth(1).click();const editor=page.locator('.wz-editor');
 await editor.getByRole('radio',{name:'Pickup',exact:true}).check();await expect(editor.getByLabel('Fee amount',{exact:true})).toHaveCount(0);await page.screenshot({path:'test-results/shop-evidence/pickup-only.png',fullPage:true});
 await editor.getByRole('button',{name:'Save',exact:true}).click();expect(f.writes).toHaveLength(0);
 await editor.getByRole('radio',{name:'Delivery',exact:true}).check();await expect(editor.locator('input[type=checkbox]')).toHaveCount(0);await expect(editor.getByLabel('Public pickup address',{exact:true})).toHaveCount(0);await page.screenshot({path:'test-results/shop-evidence/delivery-only.png',fullPage:true});
 await editor.getByRole('combobox',{name:'Delivery fee',exact:true}).selectOption('free');await expect(editor.getByLabel('Fee amount',{exact:true})).toHaveCount(0);
 await editor.getByRole('button',{name:'Save',exact:true}).click();await expect(editor).toHaveCount(0);expect(f.writes.at(-1)?.body).toMatchObject({public_address_confirmed:false,fields:{fulfillment_mode:'delivery',delivery_fee_type:'free'}});
});
test('loading and empty shop states do not invent shop data',async({page})=>{
 const f=await setup(page);let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/**/stores?*',async route=>{await gate;await route.fulfill({json:{stores:[],categories:[],currencies:['CDF','USD']}});});
 await page.goto(f.url.split('?')[0]+'?view=shop');await expect(page.locator('.wz-shop-identity')).toHaveCount(0);await page.screenshot({path:'test-results/shop-evidence/loading.png',fullPage:true});release();
 await expect(page.getByRole('button',{name:'Create',exact:true})).toBeVisible();await expect(page.locator('.wz-shop-identity')).toHaveCount(0);await page.screenshot({path:'test-results/shop-evidence/empty.png',fullPage:true});
});

test('low product usage is 0.1 percent and does not fake a filled meter',async({page})=>{const f=await setup(page);await page.route('**/plan**',route=>route.fulfill({json:{plan:'pro',source:'personal_pilot',active_products:1,active_product_limit:1000}}));await page.goto(f.url+'&view=shop');await page.locator('.wz-shop-tabs button').nth(2).click();await expect(page.locator('.wz-account-access')).toContainText('1 / 1000');await expect(page.locator('.ws-usage-number')).toHaveText('0.1%');await expect(page.locator('.wz-account-access progress')).toHaveAttribute('value','0.1');await expect(page.locator('.wz-account-access progress')).toHaveAttribute('max','100');await page.screenshot({path:'test-results/shop-evidence/usage-point-one.png',fullPage:true});});
test('invalid photo never uploads and current photo remains',async({page})=>{const f=await setup(page);await page.goto(f.url+'&view=shop');await page.locator('.wz-shop-photo input[type=file]').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('not an image')});await expect(page.locator('.ws-shop [role=alert]')).toBeVisible();await expect(page.locator('.wz-shop-photo img')).toBeVisible();expect(f.writes).toHaveLength(0);});
test('denied shop access does not render private settings',async({page})=>{const f=await setup(page);await page.route('**/api/**/stores/**',route=>route.fulfill({status:403,json:{detail:'denied'}}));await page.goto(f.url+'&view=shop');await expect(page.locator('.wz-shop-identity')).toHaveCount(0);await expect(page.locator('.wz-payment-preferences')).toHaveCount(0);expect(f.writes).toHaveLength(0);});
