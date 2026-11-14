import {test,expect,type Page} from '@playwright/test';
import {counterCopy} from '../../app/lib/restaurant-counter-copy';
import {workText} from '../../app/lib/restaurant-work-copy';
import {posCopy} from '../../app/lib/restaurant-pos-copy';
import {fixture} from './restaurant-c1e-fixture';
const stamp='2026-10-21T12:00:00Z';
const dish={public_ref:'RMI_one',name:'Poulet braisé',presentation:'fixed_dish',pricing_model:'UNIT_PRICED',unit_price:'12000.00',currency:'CDF',sale_unit_label:'assiette',availability:'available',category:{public_ref:'RMC_food',name:'Plats'},counter_options:{portions:[{key:'large',label:'Grande',amount:'17000.00'}],extras:[{key:'rice',label:'Riz blanc',amount:'3000.00'}]}};
const terms={currency:'CDF',food_subtotal:'20000.00',order_total:'20000.00',delivery_fee:null,standalone:[{key:'food',item_ref:'RMI_one',name:dish.name,quantity:1,sale_unit_label:'assiette',portion_label:'Grande',extras:dish.counter_options.extras,note:'Sans piment',subtotal:'20000.00'}],plates:[]};
async function setup(page:Page,locale:'fr'|'en'|'ln'|'sw'='fr'){
 const base=await fixture(page);base.establishment.status='active';
 await page.addInitScript(()=>localStorage.setItem('shida:restaurant:start:personal/restaurants/RST_fixture','sell'));
 await page.addInitScript(()=>{window.print=()=>{document.documentElement.dataset.printed='yes';};});
 const state={failPrepare:false,failPayment:false,changedPrice:false,orderState:'accepted',revision:1,held:false,paid:false,writes:[] as {path:string;body:Record<string,unknown>}[],basket:{basket_ref:'RBA_one',revision:1,quote:null as typeof terms|null,quote_ref:null as string|null,order_ref:null as string|null,selections:{standalone:[] as Record<string,unknown>[],plates:[]},fulfillment_method:'takeaway',expires_at:'2026-10-22T12:00:00Z'}};
 const order=()=>({order_ref:'ROD_one',revision:state.revision,state:state.orderState,entry_source:'counter',fulfillment_method:'takeaway',submitted_at:stamp,cancellation_pending:false,receipt_terms:terms,bill_group_ref:'RSG_one',payment_verified:false});
 const totals=(amount:string,paid:string)=>({chargeable:amount,net_allocated:paid,balance_due:String(Number(amount)-Number(paid)),refund_owed:'0.00'});
 const entry={entry_ref:'RME_one',kind:'receipt',target_ref:null,currency:'CDF',amount:'25000.00',change_returned:'5000.00',net_amount:'20000.00',method:{method_ref:'RPM_cash',label:'Espèces',kind:'cash',provider_verified:false},allocations:[{order_ref:'ROD_one',amount:'20000.00'}]};
 const bill=()=>({group_ref:'RSG_one',group_revision:3,payment_revision:state.paid?1:0,bill_revision:(state.paid?'b':'a').repeat(64),state:'checkout',chargeable_rounds:[{order_ref:'ROD_one',state:'accepted',currency:'CDF',amount:'20000.00'}],pending_rounds:[],excluded_rounds:[],currencies:{CDF:totals('20000.00',state.paid?'20000.00':'0.00'),USD:totals('0.00','0.00')},entries:state.paid?[entry]:[]});
 await page.route('**/api/shida/personal/restaurants/RST_fixture/**',async route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,''),method=route.request().method();
  const json=(v:unknown)=>route.fulfill({json:v});
  if(p.endsWith('/capabilities'))return json({capabilities:[{capability:'restaurant.pos',available:true}]});
  if(p.endsWith('/counter-unpaid'))return json({items:state.basket.order_ref&&!state.paid?[{...order(),balance_due:'20000.00'}]:[],has_more:false,total:state.basket.order_ref&&!state.paid?1:0});
  if(p.endsWith('/pos'))return json({intake_released:true,items:[dish,{...dish,public_ref:'RMI_two',name:'Poisson grillé',counter_options:{portions:[],extras:[]}},{...dish,public_ref:'RMI_three',name:'Pondu et fufu'},{...dish,public_ref:'RMI_rice',name:'Riz',presentation:'component',unit_price:'2000.00',counter_options:{portions:[],extras:[]}}],recent:state.basket.order_ref?[order()]:[]});
  if(p.includes('/counter-baskets')){
   if(method==='GET')return json(p.endsWith('/counter-baskets')?{items:state.held?[state.basket]:[],has_more:false,total:state.held?1:0}:state.basket);
   const body=route.request().postDataJSON();state.writes.push({path:p,body});
   if(p.endsWith('/counter-baskets'))return json(state.basket);
   if(p.endsWith('/prepare')){state.basket.order_ref='ROD_one';state.held=false;if(state.failPrepare){state.failPrepare=false;return route.abort();}return json({current_order:order(),bill_group_ref:'RSG_one'});}
   Object.assign(state.basket,{revision:state.basket.revision+1,selections:body.selections,fulfillment_method:body.fulfillment_method});
   if(p.endsWith('/quote'))Object.assign(state.basket,{quote:state.changedPrice?{...terms,order_total:'21000.00'}:terms,quote_ref:'RQU_one'});else state.held=true;
   return json({basket:state.basket});
  }
  if(p.includes('/actions/')){state.writes.push({path:p,body:route.request().postDataJSON()});state.orderState=p.endsWith('/solo_ready')?'ready':'completed';state.revision++;return json({current_order:order()});}
  if(p.endsWith('/payment-methods'))return json({items:[{method_ref:'RPM_cash',label:'Espèces',kind:'cash',currencies:['CDF'],enabled:true,revision:1},{method_ref:'RPM_mobile',label:'Mobile Money',kind:'external_mobile_money',currencies:['CDF'],enabled:true,revision:1},{method_ref:'RPM_card',label:'Carte',kind:'external_card',currencies:['CDF'],enabled:true,revision:1}]});
  if(p.endsWith('/money/recover'))return json({found:state.paid,bill:bill()});
  if(p.endsWith('/bill'))return json(bill());
  if(p.endsWith('/money/receipts')){state.writes.push({path:p,body:route.request().postDataJSON()});state.paid=true;if(state.failPayment){state.failPayment=false;return route.abort();}return json({bill:bill(),operation_outcome:{entry_ref:'RME_one'}});}
  if(p.endsWith('/receipt'))return json({...bill(),original_rounds:[{...order(),customer_receipt:{number:'001248',restaurant:'Restaurant SHIDA',date:stamp,currency:'CDF',total:'20000.00',paid:state.paid,standalone:terms.standalone,plates:[],payments:[{method:'Espèces',amount:'20000.00',kind:'receipt'}],url:'https://api.example.test/api/restaurant-receipts/view#ROD_one.'+'a'.repeat(64),food_subtotal:'20000.00',delivery_fee:null},amount:'20000',currency:'CDF',immutable_terms:{...terms,food:{standalone:terms.standalone,plates:[]}}}],statement:'Paiement enregistré au restaurant.',settlement_statement:'Aucun solde restant.',settled_in_restaurant_records:state.paid});
  return route.fallback();
 });
 page.on('dialog',d=>d.accept());
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants`);
 await page.locator('.rst-grid .rst-card button').first().click();
 await expect(page.getByRole('heading',{name:counterCopy(locale).title})).toBeVisible();
 await expect(page.getByRole('button',{name:workText(locale,'add')+' Poulet braisé',exact:true})).toBeEnabled();
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 return state;
}
async function customBasket(page:Page,width=1440){
 await page.getByRole('button',{name:'Ajouter Poulet braisé',exact:true}).click();
 await page.getByRole('radio',{name:/Grande/}).check();await page.getByRole('checkbox',{name:/Riz blanc/}).check();
 await page.locator('.rst-choice[open] textarea').fill('Sans piment');await page.locator('.rst-choice[open]').getByRole('button',{name:/Ajouter ·/}).click();
 if(width<=700)await page.locator('.rst-selling-mobile-summary').click();
}
for(const width of [320,375,390,820,1440])test(`redesigned POS ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});const state=await setup(page);
 await page.getByRole('button',{name:'Ajouter Poisson grillé',exact:true}).click();await page.getByRole('button',{name:'Ajouter Poisson grillé',exact:true}).click();
 await expect(page.locator('.rst-choice[open]')).toHaveCount(0);
 if(width<=700)await page.locator('.rst-selling-mobile-summary').click();
 await expect(page.locator('.rst-selling-line input')).toHaveValue('2');await page.locator('.rst-selling-line').getByRole('button',{name:'Retirer',exact:true}).click();
 if(width<=700)await page.getByRole('dialog').getByRole('button',{name:'← Menu',exact:true}).click();
 await customBasket(page,width);await expect(page.locator('.rst-selling-line')).toHaveCount(1);
 if([375,1440].includes(width))await page.screenshot({path:`C:/NIHILOBA/release-evidence/restaurants-management-20261114/pos-basket-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:/^Encaisser ·/}).click();await page.getByRole('button',{name:'Espèces',exact:true}).click();
 await page.getByRole('textbox',{name:'Montant reçu'}).fill('19000');await expect(page.getByRole('button',{name:'Confirmer le paiement reçu',exact:true})).toBeDisabled();
 await page.getByRole('textbox',{name:'Montant reçu'}).fill('25000');await expect(page.locator('.rst-payment-change')).toContainText('5 000');
 await page.getByRole('button',{name:'← Retour au panier',exact:true}).click();
 if(width<=700)await page.locator('.rst-selling-mobile-summary').click();
 await expect(page.locator('.rst-selling-line')).toHaveCount(1);await page.getByRole('button',{name:/^Encaisser ·/}).click();
 await expect(page.getByRole('textbox',{name:'Montant reçu'})).toHaveValue('25000');
 expect(state.writes.filter(write=>write.path.endsWith('/prepare'))).toHaveLength(1);
 if([375,1440].includes(width))await page.screenshot({path:`C:/NIHILOBA/release-evidence/restaurants-management-20261114/pos-payment-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Confirmer le paiement reçu',exact:true}).dblclick();await expect(page.locator('.rst-pos-success')).toContainText('Paiement enregistré');
 expect(state.writes.filter(write=>write.path.endsWith('/money/receipts'))).toHaveLength(1);await expect(page.locator('.rst-selling-line')).toHaveCount(0);
 await page.locator('.rst-pos-success').getByRole('button',{name:'Afficher le reçu'}).click();await page.getByRole('button',{name:'Imprimer le reçu',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-printed','yes');await page.emulateMedia({media:'print'});await expect(page.locator('.rst-thermal')).toBeVisible();await expect(page.getByRole('button',{name:'Imprimer le reçu',exact:true})).toBeHidden();expect(await page.locator('.rst-pos-dialog[open]').evaluate(node=>getComputedStyle(node).overflow)).toBe('visible');await page.emulateMedia({media:'screen'});
 await page.getByRole('button',{name:'← Retour au panier',exact:true}).click();await expect(page.getByRole('button',{name:'Ajouter Poulet braisé',exact:true})).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('POS lost responses reconcile without duplicating prepare or payment',async({page})=>{
 await page.setViewportSize({width:1440,height:950});const state=await setup(page);state.failPrepare=true;await customBasket(page);await page.getByRole('button',{name:/^Encaisser ·/}).click();await page.getByRole('button',{name:/^Réessayer ·/}).click();await page.getByRole('button',{name:'Carte',exact:true}).click();
 const prepared=state.writes.filter(w=>w.path.endsWith('/prepare'));expect(prepared).toHaveLength(2);expect(prepared[0].body).toEqual(prepared[1].body);
 state.failPayment=true;await page.getByRole('button',{name:'Confirmer le paiement reçu',exact:true}).click();await expect(page.getByRole('button',{name:'← Retour au panier',exact:true})).toBeDisabled();await page.getByRole('button',{name:/Rechercher l’écriture exacte/}).click();await expect(page.locator('.rst-pos-success')).toBeVisible();expect(state.writes.filter(w=>w.path.endsWith('/money/receipts'))).toHaveLength(1);
});
test('POS changed price needs review; saved order is distinct from drafts',async({page})=>{
 await page.setViewportSize({width:1440,height:950});const state=await setup(page);state.changedPrice=true;await customBasket(page);await page.getByRole('button',{name:'Enregistrer sans paiement',exact:true}).click();await expect(page.locator('.rst-selling-quote')).toContainText('21 000');expect(state.writes.filter(w=>w.path.endsWith('/prepare'))).toHaveLength(0);await page.getByRole('button',{name:'Accepter le total et continuer',exact:true}).click();await expect(page.locator('.rst-selling-line')).toHaveCount(0);await page.locator('.rst-pos-queues').getByRole('button',{name:/À encaisser/}).click();await expect(page.getByRole('dialog').locator('.rst-selling-recent')).toContainText('Poulet braisé');await page.getByRole('dialog').getByRole('button',{name:'Encaisser',exact:true}).click();await page.getByRole('button',{name:'Espèces',exact:true}).click();expect(state.writes.filter(w=>w.path.endsWith('/prepare'))).toHaveLength(1);
});

for(const locale of ['en','ln','sw'] as const)for(const width of [320,375,390,820,1440])test(`POS locale ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});await setup(page,locale);const c=counterCopy(locale);
 await page.getByRole('button',{name:workText(locale,'add')+' Poisson grillé',exact:true}).click();
 if(width<=700)await page.locator('.rst-selling-mobile-summary').click();
 await expect(page.getByRole('heading',{name:posCopy[locale].basket,exact:true})).toBeVisible();
 await expect(page.locator('.rst-selling-line input')).toHaveValue('1');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:posCopy[locale].later,exact:true}).click();
 await expect(page.locator('.rst-selling-quote')).toBeVisible();
});

test('composed plate and suspended draft preserve their grouping and selections',async({page})=>{
 await page.setViewportSize({width:375,height:950});const state=await setup(page);await page.getByRole('button',{name:'Composer une assiette',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Riz · 2 000 CDF'}).click();await page.getByRole('dialog').getByRole('button',{name:'Voir la commande',exact:true}).click();await expect(page.locator('.rst-selling-line')).toContainText('Riz');await page.getByRole('button',{name:'Mettre en attente',exact:true}).click();await expect(page.getByRole('dialog').getByRole('button',{name:'Reprendre',exact:true})).toBeVisible();const held=state.writes.find(write=>write.body.selections);expect(held?.body.selections).toMatchObject({standalone:[],plates:[{key:'plate-1',components:[{item_ref:'RMI_rice',quantity:1}]}]});await page.getByRole('dialog').getByRole('button',{name:'Reprendre',exact:true}).click();await expect(page.locator('.rst-selling-line')).toContainText('Riz');expect(state.writes.some(write=>write.path.endsWith('/prepare'))).toBe(false);
});
