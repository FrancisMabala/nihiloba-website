import {test,expect} from '@playwright/test';
import {wenzeCartCopy} from '../../app/components/shida/wenze-cart-copy';
import {confirmationCopy} from '../../app/components/shida/confirmation-dialog';
import {productFixture} from './wenze-products-fixture';

for(const width of [390,1440])test(`Wenze failed archive stays open and prevents uncertain repeat ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 const fixture=await productFixture(page);let writes=0;
 await page.route('**/lifecycle/archive/**',route=>{writes++;return route.fulfill({status:503,json:{detail:'unavailable'}});});
 page.on('dialog',()=>{throw new Error('Native browser dialog');});
 await page.goto(fixture.url);await page.getByRole('button',{name:'Manage',exact:true}).click();
 await page.locator('.wz-more-actions summary').click();await page.locator('.wz-more-actions').getByRole('button',{name:'Archive',exact:true}).click();
 const modal=page.getByRole('dialog');await expect(modal).toBeVisible();
 await modal.getByRole('button',{name:'Archive',exact:true}).click();await expect(modal.getByRole('alert')).toBeVisible();
 expect(writes).toBe(1);await modal.getByRole('button',{name:'Archive',exact:true}).click();expect(writes).toBe(1);
 await page.screenshot({path:`test-results/confirmations/wenze-failure-${width}.png`,fullPage:true});
 await modal.getByRole('button',{name:'Go back'}).click();await expect(page.locator('.wp-product-summary')).toContainText('Test cotton shirt');
});
for(const locale of ['en','fr','ln','sw'] as const)test(`basket clear keeps failed action visible ${locale}`,async({page})=>{
 const t=wenzeCartCopy[locale];let deletes=0;
 const cart={reference:'CART_test',status:'active',currency:'CDF',version:2,item_count:1,seller_count:1,product_subtotal:'100',delivery_total:null,grand_total:null,expires_at:'2030-01-01T00:00:00Z',seller_groups:[{store_reference:'S_test',store_name:'Fixture shop',subtotal:'100',currency:'CDF',fulfillment_method:null,delivery_fee:null,delivery_fee_status:null,items:[{reference:'I_test',product_reference:'P_test',name:'Fixture item',variant:null,quantity:1,unit_price:'100',line_total:'100',currency:'CDF',image:null,product_url:null}]}]};
 await page.route('**/api/**',route=>{const r=route.request();if(new URL(r.url()).pathname==='/api/shida/cart/'){
  if(r.method()==='DELETE'){deletes++;return route.fulfill({status:503,json:{error:{code:'api_unavailable'}}});}
  return route.fulfill({json:{cart}});
 }return route.fulfill({status:404,json:{}});});
 page.on('dialog',()=>{throw new Error('Native browser dialog');});
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/wenze/${locale==='en'?'cart':'panier'}`);
 await page.getByRole('button',{name:t.clear,exact:true}).click();
 const modal=page.getByRole('dialog');await expect(modal).toBeVisible();
 await modal.getByRole('button',{name:confirmationCopy[locale].back}).click();expect(deletes).toBe(0);
 await page.getByRole('button',{name:t.clear,exact:true}).click();await modal.getByRole('button',{name:t.clear,exact:true}).click();
 await expect(modal.getByRole('alert')).toBeVisible();expect(deletes).toBe(1);
 await modal.getByRole('button',{name:confirmationCopy[locale].back}).click();await expect(page.getByText('Fixture item',{exact:true})).toBeVisible();
});

test('service template archive preserves retry identity and unsaved leave is explicit',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('shida-language','en'));
 const writes:string[]=[];let failed=true;page.on('pageerror',error=>{throw error;});
 await page.route('**/api/shida/**',route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');
  if(path.endsWith('/employment/session'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Provider'}}});
  if(path.endsWith('/services/capabilities'))return route.fulfill({json:{capabilities:['profile','quote_templates'],access_policy:'pilot'}});
  if(path.endsWith('/services'))return route.fulfill({json:{profiles:[{public_ref:'SVC_test',provider_ref:'SVI_test',professional_profile:{name:'Provider',bio:'Repairs',photo:null},name:'Provider',service_name:'Repairs',category:'repair_maintenance',description:'Repairs',service_duration_minutes:60,commune:'Gombe',service_location_type:'private_home',home_service_available:'yes',booking_mode:'flexible',availability:'Weekdays',publication_origin:'pilot',visible_to_customers:true,requests_enabled:true,is_active:'yes',revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}}]}});
  if(path.endsWith('/onboarding'))return route.fulfill({json:{progress:[],remaining_capacity:4,professional_profile:{public_ref:'SVI_test',revision:1,name:'Provider',bio:'Repairs',primary_category:null}}});
  if(path.endsWith('/reviews'))return route.fulfill({json:{reviews:[]}});
  if(path.endsWith('/templates'))return route.fulfill({json:{templates:[{template_ref:'SDT_test',kind:'quote',name:'Fixture quote',content:{currency:'USD'},revision:4,archived:false}]}});
  if(path.endsWith('/SDT_test/archive')){writes.push(req.postData()!);return route.fulfill({status:failed?503:200,json:{}});}
  return route.fulfill({status:404,json:{}});
 });
 page.on('dialog',()=>{throw new Error('Native browser dialog');});
 await page.goto('/shida/seller/services?view=templates');
 const panel=page.locator('.svc-templates');await panel.locator('summary').click();await panel.getByRole('button',{name:'Archive',exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 await dialog.getByRole('button',{name:'Archive',exact:true}).click();await expect(dialog.getByRole('alert')).toBeVisible();failed=false;
 await dialog.getByRole('button',{name:'Archive',exact:true}).click();await expect(dialog).toHaveCount(0);expect(writes).toHaveLength(2);expect(writes[0]).toBe(writes[1]);
 await panel.getByRole('button',{name:'New template',exact:false}).click();await panel.getByLabel('Template name').fill('Unsaved draft');
 await panel.getByRole('button',{name:'Cancel',exact:true}).click();await expect(dialog).toBeVisible();
 await dialog.getByRole('button',{name:'Go back'}).click();await expect(panel.getByLabel('Template name')).toHaveValue('Unsaved draft');
});
