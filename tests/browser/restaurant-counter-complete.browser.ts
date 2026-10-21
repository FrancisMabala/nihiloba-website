import {test,expect,type Page} from '@playwright/test';
import {fixture} from './restaurant-c1e-fixture';
const stamp='2026-10-21T12:00:00Z';
const dish={public_ref:'RMI_one',name:'Poulet braisé',presentation:'fixed_dish',pricing_model:'UNIT_PRICED',unit_price:'12000.00',currency:'CDF',sale_unit_label:'assiette',availability:'available',category:{public_ref:'RMC_food',name:'Plats'},counter_options:{portions:[{key:'large',label:'Grande',amount:'17000.00'}],extras:[{key:'rice',label:'Riz blanc',amount:'3000.00'}]}};
const terms={currency:'CDF',food_subtotal:'20000.00',order_total:'20000.00',delivery_fee:null,standalone:[{key:'food',item_ref:'RMI_one',name:dish.name,quantity:1,sale_unit_label:'assiette',portion_label:'Grande',extras:dish.counter_options.extras,note:'Sans piment',subtotal:'20000.00'}],plates:[]};
async function setup(page:Page){
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
  if(p.endsWith('/counter-unpaid'))return json({items:state.basket.order_ref&&!state.paid?[{...order(),balance_due:'20000.00'}]:[],has_more:false});
  if(p.endsWith('/pos'))return json({intake_released:true,items:[dish,{...dish,public_ref:'RMI_two',name:'Poisson grillé'},{...dish,public_ref:'RMI_three',name:'Pondu et fufu'}],recent:state.basket.order_ref?[order()]:[]});
  if(p.includes('/counter-baskets')){
   if(method==='GET')return json(p.endsWith('/counter-baskets')?{items:state.held?[state.basket]:[],has_more:false}:state.basket);
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
  if(p.endsWith('/receipt'))return json({...bill(),original_rounds:[{...order(),amount:'20000',currency:'CDF',immutable_terms:{...terms,food:{standalone:terms.standalone,plates:[]}}}],statement:'Paiement enregistré au restaurant.',settlement_statement:'Aucun solde restant.',settled_in_restaurant_records:state.paid});
  return route.fallback();
 });
 page.on('dialog',d=>d.accept());
 await page.goto('/fr/shida/seller/restaurants');
 await page.locator('.rst-grid .rst-card button').first().click();
 await expect(page.getByRole('heading',{name:'Vendre au comptoir'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Ajouter Poulet braisé',exact:true})).toBeEnabled();
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 return state;
}
for(const width of [320,390,820,1440])for(const payment of ['Espèces','Mobile Money','Carte','later'])test(`simple counter ${width} ${payment}`,async({page})=>{
 await page.setViewportSize({width,height:960});const state=await setup(page);
 await page.getByRole('button',{name:'Ajouter Poulet braisé',exact:true}).click();
 await page.getByRole('radio',{name:/Grande/}).check();await page.getByRole('checkbox',{name:/Riz blanc/}).check();
 await page.locator('.rst-choice textarea').fill('Sans piment');
 await page.locator('.rst-choice').getByRole('button',{name:/Ajouter ·/}).click();
 if(width<=700)await page.locator('.rst-selling-mobile-summary').click();
 await expect(page.getByRole('button',{name:'Vérifier la vente',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Confirmer la commande',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Mettre en attente',exact:true})).not.toBeVisible();
 await page.screenshot({path:`docs/evidence/simple-counter/basket-${width}-${payment}.png`,fullPage:true});
 if(payment==='later'){
  await page.getByRole('button',{name:'Payer plus tard',exact:true}).click();
  await expect(page.locator('.rst-selling-recent')).toContainText('Poulet braisé');
  expect(state.paid).toBe(false);
  expect(state.writes.filter(w=>w.path.endsWith('/prepare'))).toHaveLength(1);
  await page.reload();
  // Personal workspace selection may be required after reload.
  const choose=page.locator('.rst-grid .rst-card button').first();
  await choose.click();
  await page.locator('.rst-selling-recent').getByRole('button',{name:'Encaisser',exact:true}).click();
 }else await page.getByRole('button',{name:/^Encaisser ·/}).click();
 await expect(page.locator('.rst-selling-result')).toHaveCount(0);
 await page.getByRole('button',{name:payment==='later'?'Espèces':payment,exact:true}).click();
 if(payment==='Espèces'||payment==='later'){
  await page.getByRole('textbox',{name:'Montant reçu'}).fill('19000');
  await expect(page.getByRole('button',{name:'Confirmer le paiement reçu',exact:true})).toBeDisabled();
  await page.getByRole('textbox',{name:'Montant reçu'}).fill('25000');
  await expect(page.locator('.rst-payment-change')).toContainText('5 000');
 }else await expect(page.getByRole('textbox',{name:'Montant reçu'})).toHaveCount(0);
 await page.screenshot({path:`docs/evidence/simple-counter/payment-${width}-${payment}.png`,fullPage:true});
 await page.getByRole('button',{name:'Confirmer le paiement reçu',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Payé',exact:true})).toBeVisible();
 expect(state.writes.filter(w=>w.path.endsWith('/money/receipts'))).toHaveLength(1);
 const body=state.writes.find(w=>w.path.endsWith('/money/receipts'))?.body;
 expect(body?.method_ref).toBe(payment==='Carte'?'RPM_card':payment==='Mobile Money'?'RPM_mobile':'RPM_cash');
 expect(body?.change_returned).toBe(payment==='Espèces'||payment==='later'?'5000.00':'0');
 await page.getByRole('button',{name:'Imprimer le reçu',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-printed','yes');
 await expect(page.locator('.rst-money-receipt')).toContainText('Sans piment');
 await page.emulateMedia({media:'print'});
 await expect(page.getByRole('button',{name:'Imprimer le reçu',exact:true})).not.toBeVisible();
 await page.emulateMedia({media:'screen'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Nouvelle vente',exact:true}).click();
 await expect(page.locator('.rst-selling-recent>article')).toHaveCount(0);
});

async function fillBasket(page:Page){
 await page.getByRole('button',{name:'Ajouter Poulet braisé',exact:true}).click();
 await page.getByRole('radio',{name:/Grande/}).check();await page.getByRole('checkbox',{name:/Riz blanc/}).check();
 await page.locator('.rst-choice').getByRole('button',{name:/Ajouter ·/}).click();
}
test('changed total requires review; no silent order submission',async({page})=>{
 const state=await setup(page);state.changedPrice=true;await fillBasket(page);
 await page.getByRole('button',{name:/^Encaisser ·/}).click();
 await expect(page.locator('.rst-selling-quote')).toContainText('21 000');
 expect(state.writes.filter(w=>w.path.endsWith('/prepare'))).toHaveLength(0);
 await page.getByRole('button',{name:'Accepter le total et continuer',exact:true}).click();
 await expect(page.getByRole('button',{name:'Espèces',exact:true})).toBeVisible();
 expect(state.writes.filter(w=>w.path.endsWith('/prepare'))).toHaveLength(1);
});
test('lost prepare response retries the exact operation',async({page})=>{
 const state=await setup(page);state.failPrepare=true;await fillBasket(page);
 await page.getByRole('button',{name:/^Encaisser ·/}).click();
 await page.getByRole('button',{name:/^Réessayer ·/}).click();
 await expect(page.getByRole('button',{name:'Espèces',exact:true})).toBeVisible();
 const writes=state.writes.filter(w=>w.path.endsWith('/prepare'));
 expect(writes).toHaveLength(2);expect(writes[1].body).toEqual(writes[0].body);
});

test('lost payment response recovers the recorded payment without charging twice',async({page})=>{
 const state=await setup(page);state.failPayment=true;await fillBasket(page);
 await page.getByRole('button',{name:/^Encaisser ·/}).click();
 await page.getByRole('button',{name:'Carte',exact:true}).click();
 await page.getByRole('button',{name:'Confirmer le paiement reçu',exact:true}).click();
 await page.getByRole('button',{name:/Rechercher l’écriture exacte/}).click();
 await expect(page.getByRole('heading',{name:'Payé',exact:true})).toBeVisible();
 expect(state.writes.filter(w=>w.path.endsWith('/money/receipts'))).toHaveLength(1);
});
