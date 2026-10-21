import {test,expect,type Page} from '@playwright/test';
import {fixture} from './restaurant-c1e-fixture';
const stamp='2026-10-21T12:00:00Z';
const dish={public_ref:'RMI_one',name:'Poulet braisé',presentation:'fixed_dish',pricing_model:'UNIT_PRICED',unit_price:'12000.00',currency:'CDF',sale_unit_label:'assiette',availability:'available',category:{public_ref:'RMC_food',name:'Plats'},counter_options:{portions:[{key:'large',label:'Grande',amount:'17000.00'}],extras:[{key:'rice',label:'Riz blanc',amount:'3000.00'}]}};
const terms={currency:'CDF',food_subtotal:'20000.00',order_total:'20000.00',delivery_fee:null,standalone:[{key:'food',item_ref:'RMI_one',name:dish.name,quantity:1,sale_unit_label:'assiette',portion_label:'Grande',extras:dish.counter_options.extras,note:'Sans piment',subtotal:'20000.00'}],plates:[]};
async function setup(page:Page){
 const base=await fixture(page);base.establishment.status='active';
 await page.addInitScript(()=>localStorage.setItem('shida:restaurant:start:personal/restaurants/RST_fixture','sell'));
 const state={orderState:'accepted',revision:1,held:false,paid:false,writes:[] as {path:string;body:Record<string,unknown>}[],basket:{basket_ref:'RBA_one',revision:1,quote:null as typeof terms|null,quote_ref:null as string|null,order_ref:null as string|null,selections:{standalone:[] as Record<string,unknown>[],plates:[]},fulfillment_method:'takeaway',expires_at:'2026-10-22T12:00:00Z'}};
 const order=()=>({order_ref:'ROD_one',revision:state.revision,state:state.orderState,entry_source:'counter',fulfillment_method:'takeaway',submitted_at:stamp,cancellation_pending:false,receipt_terms:terms,bill_group_ref:'RSG_one',payment_verified:false});
 const totals=(amount:string,paid:string)=>({chargeable:amount,net_allocated:paid,balance_due:String(Number(amount)-Number(paid)),refund_owed:'0.00'});
 const entry={entry_ref:'RME_one',kind:'receipt',target_ref:null,currency:'CDF',amount:'25000.00',change_returned:'5000.00',net_amount:'20000.00',method:{method_ref:'RPM_cash',label:'Espèces',kind:'cash',provider_verified:false},allocations:[{order_ref:'ROD_one',amount:'20000.00'}]};
 const bill=()=>({group_ref:'RSG_one',group_revision:3,payment_revision:state.paid?1:0,bill_revision:(state.paid?'b':'a').repeat(64),state:'checkout',chargeable_rounds:[{order_ref:'ROD_one',state:'accepted',currency:'CDF',amount:'20000.00'}],pending_rounds:[],excluded_rounds:[],currencies:{CDF:totals('20000.00',state.paid?'20000.00':'0.00'),USD:totals('0.00','0.00')},entries:state.paid?[entry]:[]});
 await page.route('**/api/shida/personal/restaurants/RST_fixture/**',async route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,''),method=route.request().method();
  const json=(v:unknown)=>route.fulfill({json:v});
  if(p.endsWith('/capabilities'))return json({capabilities:[{capability:'restaurant.pos',available:true}]});
  if(p.endsWith('/pos'))return json({intake_released:true,items:[dish,{...dish,public_ref:'RMI_two',name:'Poisson grillé'},{...dish,public_ref:'RMI_three',name:'Pondu et fufu'}],recent:state.basket.order_ref?[order()]:[]});
  if(p.includes('/counter-baskets')){
   if(method==='GET')return json(p.endsWith('/counter-baskets')?{items:state.held?[state.basket]:[],has_more:false}:state.basket);
   const body=route.request().postDataJSON();state.writes.push({path:p,body});
   if(p.endsWith('/counter-baskets'))return json(state.basket);
   if(p.endsWith('/prepare')){state.basket.order_ref='ROD_one';state.held=false;return json({current_order:order(),bill_group_ref:'RSG_one'});}
   Object.assign(state.basket,{revision:state.basket.revision+1,selections:body.selections,fulfillment_method:body.fulfillment_method});
   if(p.endsWith('/quote'))Object.assign(state.basket,{quote:terms,quote_ref:'RQU_one'});else state.held=true;
   return json({basket:state.basket});
  }
  if(p.includes('/actions/')){state.writes.push({path:p,body:route.request().postDataJSON()});state.orderState=p.endsWith('/solo_ready')?'ready':'completed';state.revision++;return json({current_order:order()});}
  if(p.endsWith('/payment-methods'))return json({items:[{method_ref:'RPM_cash',label:'Espèces',kind:'cash',currencies:['CDF'],enabled:true,revision:1},{method_ref:'RPM_mobile',label:'Mobile Money',kind:'external_mobile_money',currencies:['CDF'],enabled:true,revision:1}]});
  if(p.endsWith('/bill'))return json(bill());
  if(p.endsWith('/money/receipts')){state.writes.push({path:p,body:route.request().postDataJSON()});state.paid=true;return json({bill:bill(),operation_outcome:{entry_ref:'RME_one'}});}
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
for(const width of [320,390,820,1440])test(`complete counter ${width}`,async({page})=>{
 await page.setViewportSize({width,height:960});const state=await setup(page);
 await expect(page.locator('.rst-focus-toolbar').getByRole('button',{name:/Écran épinglé/})).toBeVisible();
 await page.screenshot({path:`docs/evidence/counter-2026-10-21/menu-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Ajouter Poulet braisé',exact:true}).click();
 await page.getByRole('radio',{name:/Grande/}).check();await page.getByRole('checkbox',{name:/Riz blanc/}).check();
 await page.getByRole('textbox',{name:'Note pour la commande'}).fill('Sans piment');
 await page.screenshot({path:`docs/evidence/counter-2026-10-21/options-${width}.png`,fullPage:true});
 await page.locator('.rst-choice').getByRole('button',{name:/Ajouter ·/}).click();
 if(width<=700)await page.locator('.rst-selling-mobile-summary').click();
 await expect(page.locator('.rst-selling-line')).toContainText('Grande');
 await page.getByRole('button',{name:'Mettre en attente',exact:true}).click();
 await expect(page.locator('.rst-held')).toContainText('Poulet braisé');
 expect(state.writes.some(w=>w.path.endsWith('/prepare'))).toBe(false);
 await page.screenshot({path:`docs/evidence/counter-2026-10-21/held-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Reprendre',exact:true}).click();
 await page.getByRole('button',{name:'Vérifier la vente',exact:true}).click();
 await page.screenshot({path:`docs/evidence/counter-2026-10-21/basket-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Confirmer la commande',exact:true}).click();
 await page.getByRole('button',{name:'Repas prêt',exact:true}).click();
 await page.getByRole('button',{name:'Remis au client',exact:true}).click();
 expect(state.paid).toBe(false);
 await page.getByRole('button',{name:'Encaisser',exact:true}).click();
 await page.getByRole('button',{name:'Espèces',exact:true}).click();
 await page.getByRole('textbox',{name:'Montant reçu'}).fill('25000');
 await expect(page.locator('.rst-payment-change')).toContainText('5 000');
 await page.screenshot({path:`docs/evidence/counter-2026-10-21/payment-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Enregistrer le paiement',exact:true}).click();
 await expect(page.locator('.rst-payment-total')).toContainText('Paiement enregistré');
 expect(state.writes.filter(w=>w.path.endsWith('/money/receipts'))).toHaveLength(1);
 expect(state.writes.find(w=>w.path.endsWith('/money/receipts'))?.body.change_returned).toBe('5000.00');
 await expect(page.locator('.rst-money-receipt')).toContainText('Sans piment');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Retour à la commande',exact:true}).click();
 await page.locator('.rst-focus-toolbar').getByRole('button',{name:'Plein écran',exact:true}).click();
 await expect(page.locator('.rst-focus-mode')).toBeVisible();
 await page.getByRole('button',{name:'Quitter le plein écran',exact:true}).click();
 await expect(page.locator('.rst-focus-mode')).toHaveCount(0);
 if(width===390){
  await page.locator('.rst-bottom-nav').getByRole('button',{name:'Plus',exact:true}).click();
  await page.locator('.rst-more').getByRole('button',{name:'Aujourd’hui',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Aujourd’hui',exact:true})).toBeVisible();
  await page.locator('.rst-focus-toolbar').getByRole('button',{name:'Définir comme écran d’accueil'}).click();
  expect(await page.evaluate(()=>localStorage.getItem('shida:restaurant:start:personal/restaurants/RST_fixture'))).toBe('today');
  await page.evaluate(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{configurable:true,value:undefined}));
  await page.getByRole('button',{name:'Plein écran',exact:true}).click();
  await expect(page.locator('.rst-focus-mode')).toBeVisible();
  await page.getByRole('button',{name:'Quitter le plein écran',exact:true}).click();
 }
});
