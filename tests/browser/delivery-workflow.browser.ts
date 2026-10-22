import {test,expect} from '@playwright/test';
import {checkoutCopy} from '../../app/lib/restaurant-checkout-copy';
import {deliveryLabels} from '../../app/components/shida/delivery-details';
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,1280])test(`restaurant destination refresh ${locale} ${width}`,async({page})=>{
 const t=checkoutCopy[locale];let signedIn=true,revision=1;let destination:Record<string,unknown>|null=null;
 let selections={standalone:[{key:'one',item_ref:'RMI-FIXED',quantity:1}],plates:[]};let quote:Record<string,unknown>|null=null;
 const basket=()=>({basket_ref:'RBA-DELIVERY',establishment_ref:'RST-CHECKOUT',channel:'web',revision,selections,quote,quote_ref:quote?'RQU-delivery':null,order_ref:null,food_preference:null,fulfillment_method:'delivery',window_ref:'RWD-CHECKOUT'});
 await page.addInitScript(()=>sessionStorage.setItem('shida-restaurant-web:RST-CHECKOUT:basket','RBA-DELIVERY'));
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');const respond=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return respond(signedIn?{binding:'a'.repeat(64),user:{display_name:'Delivery buyer'}}:{},signedIn?200:401);
  if(path.endsWith('/destination')){if(req.method()==='PUT'){const body=req.postDataJSON();destination={fields:body.fields,delivery_instruction:body.delivery_instruction};revision++;return respond({revision});}return respond({destination});}
  if(path.endsWith('/quote')){quote={standalone:[{key:'one',name:'Fufu',quantity:1,unit_price:'1000',subtotal:'1000',pricing_model:'UNIT_PRICED'}],plates:[],food_subtotal:'1000',delivery_fee:'500',order_total:'1500',currency:'CDF',fulfillment_method:'delivery',arrival_window:{starts_at:'2027-01-01T10:00:00Z',ends_at:'2027-01-01T12:00:00Z'}};revision++;return respond({basket:basket()});}
  if(path.endsWith('/baskets/RBA-DELIVERY')){if(req.method()==='PATCH'){selections=req.postDataJSON().selections;revision++;return respond({basket:basket()});}return respond(basket());}
  return respond({});
 });
 await page.setViewportSize({width,height:900});await page.goto(`${locale==='en'?'':'/'+locale}/shida/restaurants/RST-CHECKOUT/order/`);
 await expect(page.getByRole('button',{name:t.basket,exact:true})).toBeEnabled();await page.getByRole('button',{name:t.basket,exact:true}).click();await page.getByRole('button',{name:t.continue,exact:true}).click();
 await page.getByLabel(t.landmark,{exact:true}).fill('Cour bleue derrière la pharmacie — synthetic');await page.getByLabel(t.quartier,{exact:true}).fill('Centre');await page.getByLabel(t.instruction,{exact:true}).fill('Sonner deux fois');
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.getByLabel(t.instruction,{exact:true})).toHaveValue('Sonner deux fois');
 await page.getByRole('button',{name:t.quote,exact:true}).click();await expect(page.getByText(/Cour bleue/)).toBeVisible();expect(destination).toMatchObject({fields:{quartier:'Centre',street:null,building:null},delivery_instruction:'Sonner deux fois'});
 await page.reload();await expect(page.getByRole('button',{name:t.basket,exact:true})).toBeEnabled();await page.getByRole('button',{name:t.basket,exact:true}).click();await page.getByRole('button',{name:t.continue,exact:true}).click();
 await expect(page.getByLabel(t.landmark,{exact:true})).toHaveValue('Cour bleue derrière la pharmacie — synthetic');await expect(page.getByLabel(t.instruction,{exact:true})).toHaveValue('Sonner deux fois');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`docs/evidence/delivery-workflow/restaurant-${locale}-${width}.png`,fullPage:true});
 signedIn=false;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.getByLabel(t.landmark,{exact:true})).toHaveCount(0);
});
for(const locale of ['en','fr','ln','sw'] as const)test(`private Wenze destination ${locale}`,async({page})=>{
 let signedIn=true;const t=deliveryLabels[locale];const order={reference:'SO-private',store_name:'Boutique du Fleuve',total:'1500',currency:'CDF',fulfillment_method:'delivery',items:[{name:'Produit',quantity:1}],timeline:{current:'preparing',steps:['processing','preparing','out_for_delivery','delivered']},delivery_fee:'500',delivery_fee_status:'known'};
 await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname.replace(/\/$/,'');if(path.endsWith('/employment/session'))return route.fulfill({status:signedIn?200:401,json:signedIn?{binding:'a'.repeat(64),user:{display_name:'Buyer'}}:{}});if(path.endsWith('/orders/SO-private'))return route.fulfill({json:{...order,delivery_details:{city:'Kinshasa',commune:'Gombe',address:'PRIVATE-SYNTHETIC-DESTINATION',instructions:'Sonner deux fois'}}});if(path.endsWith('/orders'))return route.fulfill({json:{orders:[order],total:1}});return route.fulfill({json:{updates:[],unread_count:0}});});
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/wenze/orders/`);await expect(page.getByText('PRIVATE-SYNTHETIC-DESTINATION')).toHaveCount(0);await page.getByRole('button',{name:t.open}).click();await expect(page.getByText('PRIVATE-SYNTHETIC-DESTINATION')).toBeVisible();signedIn=false;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.getByText('PRIVATE-SYNTHETIC-DESTINATION')).toHaveCount(0);
});

for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,1280])test(`Personal seller delivery ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 const shop={public_ref:'WNZ_demo123',revision:1,name:'Boutique Exemple',status:'active',visible:'true',city:'Kinshasa'};
 const order={reference:'SO_delivery',source:'fixed',shop_name:shop.name,buyer_name:'Synthetic buyer',status_label:'En préparation',total:'15000',currency:'CDF',fulfillment_method:'delivery',payment_verified:false,created_at:'2026-10-22T10:00:00Z',updated_at:'2026-10-22T10:00:00Z',items:[{name:'Chemise',quantity:1,unit_price:'15000'}],allowed_actions:['out_for_delivery'],action_revision:'WOR_fixture',delivery_fee:'500',delivery_fee_status:'known',delivery_details:{country:'CD',city:'Kinshasa',commune:'Gombe',quartier:'Centre',address:'Cour bleue — synthetic',instructions:'Sonner deux fois'}};
 await page.route('**/api/shida/**',route=>{const p=new URL(route.request().url()).pathname.replace(/\/$/,'');let json:unknown={};
 if(p.endsWith('/employment/session'))json={binding:'a'.repeat(64),user:{display_name:'Synthetic seller'}};
 else if(p.endsWith('/stores')||p.endsWith('/catalog-imports/options'))json={stores:[shop],categories:[],currencies:['CDF']};
 else if(p.endsWith('/WNZ_demo123'))json=shop;
 else if(p.endsWith('/orders'))json={orders:[order],total:1,counts:{all:1,action_required:1},stores:[shop]};
 else if(p.endsWith('/SO_delivery'))json=order;
 else if(p.endsWith('/products'))json={products:[],total:0};
 return route.fulfill({json});});
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/seller/wenze/?store=WNZ_demo123&view=orders`);await page.getByRole('button',{name:/Chemise/}).click();
 await expect(page.getByText('Cour bleue — synthetic')).toBeVisible();await expect(page.locator('dt').filter({hasText:deliveryLabels[locale].address})).toBeVisible();await expect(page.getByText('Sonner deux fois')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`docs/evidence/delivery-workflow/personal-${locale}-${width}.png`,fullPage:true});
});
