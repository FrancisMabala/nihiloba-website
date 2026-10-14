import {test,expect,type Page} from '@playwright/test';
import {managementNavigation} from './restaurant-management-navigation';

const stamp='2026-10-13T08:00:00+00:00';
const reservation={reservation_ref:'RRS_1',establishment_ref:'RST_WORKFLOW',establishment_name:'Malewa du Marché',state:'pending',revision:1,starts_at:'2030-10-14T18:00:00+01:00',timezone_name:'Africa/Kinshasa',party_size:3,response_deadline:'2030-10-14T12:00:00+01:00',overlapping_requests:0};
const establishment={public_ref:'RST_WORKFLOW',revision:stamp,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links'],profile:{name:'Malewa du Marché',food_business_type:'malewa',city:'Kinshasa',commune:'Limete',timezone_name:'Africa/Kinshasa'}};
const food=[{public_ref:'FOOD_1',name:'Fufu et pondu',presentation:'fixed_dish',pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000',sale_unit_label:'assiette',availability:'available',visible:true},{public_ref:'DRINK_1',name:'Jus de mangue sans alcool',presentation:'fixed_dish',pricing_model:'UNIT_PRICED',currency:'USD',unit_price:'2.50',sale_unit_label:'verre',availability:'available',visible:true}];
const order=(ref:string,state:string)=>({order_ref:ref,revision:1,state,entry_source:'customer',fulfillment_method:'pickup',submitted_at:stamp,cancellation_pending:false,order_total:'3000',currency:'CDF',food_preview:{},receipt_terms:null});
const stationOrder=(ref:string,station:'kitchen'|'bar',stationState:'waiting'|'preparing'|'ready')=>({order_ref:ref,state:stationState==='waiting'?'accepted':stationState,revision:1,submitted_at:stamp,updated_at:stamp,cancellation_pending:false,fulfillment_method:'pickup',food_preference:null,standalone:[{key:ref+'-item',name:station==='bar'?'Jus de mangue sans alcool':'Fufu et pondu',pricing_model:'UNIT_PRICED',currency:station==='bar'?'USD':'CDF',quantity:1,sale_unit_label:station==='bar'?'verre':'assiette'}],plates:[],station,station_state:stationState,stations:{[station]:stationState},legacy_whole_order:false});
const moneyTotals=(chargeable:string,paid:string,due:string)=>({chargeable,net_allocated:paid,balance_due:due,refund_owed:'0.00',signed_balance:due});
const bill={group_ref:'RSG_VISIT',group_revision:3,payment_revision:2,bill_revision:'a'.repeat(64),state:'checkout',chargeable_rounds:[{order_ref:'ORD_ROUND_1',revision:2,state:'completed',currency:'CDF',amount:'3000.00'},{order_ref:'ORD_ROUND_2',revision:2,state:'completed',currency:'USD',amount:'2.50'}],pending_rounds:[],excluded_rounds:[],currencies:{CDF:moneyTotals('3000.00','3000.00','0.00'),USD:moneyTotals('2.50','2.50','0.00')},entries:[{entry_ref:'PAY_CDF',kind:'receipt',target_ref:null,currency:'CDF',amount:'3000.00',change_returned:'0.00',net_amount:'3000.00',method:{method_ref:'CASH',label:'Espèces',kind:'cash',provider_verified:false},created_at:stamp,allocations:[{order_ref:'ORD_ROUND_1',amount:'3000.00'}]},{entry_ref:'PAY_USD',kind:'receipt',target_ref:null,currency:'USD',amount:'2.50',change_returned:'0.00',net_amount:'2.50',method:{method_ref:'MOBILE',label:'Mobile déclaré',kind:'external_mobile_money',provider_verified:false},created_at:stamp,allocations:[{order_ref:'ORD_ROUND_2',amount:'2.50'}]}]};
const counterTerms={currency:'CDF',standalone:[{key:'food-1',name:'Fufu et pondu',quantity:1,sale_unit_label:'assiette',subtotal:'3000.00'}],plates:[],food_subtotal:'3000.00',delivery_fee:null,order_total:'3000.00',food_preference:null};
const counterBill={group_ref:'RSG_COUNTER',group_revision:4,payment_revision:0,bill_revision:'c'.repeat(64),state:'closed',chargeable_rounds:[{order_ref:'ORD_COUNTER',revision:1,state:'completed',currency:'CDF',amount:'3000.00'}],pending_rounds:[],excluded_rounds:[],currencies:{CDF:moneyTotals('3000.00','0.00','3000.00'),USD:moneyTotals('0.00','0.00','0.00')},entries:[]};
const day={local_date:'2026-10-13',time_zone:'Africa/Kinshasa',start_utc:'2026-10-12T23:00:00Z',end_utc:'2026-10-13T23:00:00Z',revision:2,closed:false,preview_revision:'b'.repeat(64),closed_at:null,currencies:{CDF:{opening:'10000.00',counted:'12500.00'},USD:{opening:'10.00',counted:'10.00'}},cash:{CDF:{opening:'10000.00',cash_receipts_net:'3000.00',actual_cash_refunds:'0.00',cash_expense_effect:'-200.00',cash_movements:'0.00',expected:'12800.00',counted:'12500.00',discrepancy:'-300.00'},USD:{opening:'10.00',cash_receipts_net:'0.00',actual_cash_refunds:'0.00',cash_expense_effect:'0.00',cash_movements:'0.00',expected:'10.00',counted:'10.00',discrepancy:'0.00'}},expenses:{CDF:'200.00',USD:'0.00'},outstanding:{CDF:{balance_due:'0.00',refund_owed:'0.00'},USD:{balance_due:'0.00',refund_owed:'0.00'}},bill_summary:{CDF:{order_value:'3000.00',recorded_collections:'3000.00'},USD:{order_value:'2.50',recorded_collections:'2.50'}},open_orders:{count:0,refs:[]},stock_exceptions:{count:0,refs:[]},methods:[{method_ref:'CASH',label:'Espèces',kind:'cash',currency:'CDF',recorded_net:'3000.00',actual_refunds:'0.00',corrections:'0.00',paid_expenses:'200.00',actual_expense_recoveries:'0.00',provider_verified:false},{method_ref:'MOBILE',label:'Mobile déclaré',kind:'external_mobile_money',currency:'USD',recorded_net:'2.50',actual_refunds:'0.00',corrections:'0.00',paid_expenses:'0.00',actual_expense_recoveries:'0.00',provider_verified:false}],supplemental_adjustments:[],supplemental_adjustment_count:0,next_adjustment_after:null};
async function seed(page:Page,intake:boolean,empty=false,rich=false){
 let counterPaid=false;
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),p=url.pathname.replace(/\/$/,''),m=route.request().method();
  const json=(value:unknown)=>route.fulfill({json:value});
  if(p.endsWith('/employment/session'))return json({user:{display_name:'Founder'},binding:'a'.repeat(64)});
  if(p.endsWith('/capabilities'))return json({capabilities:['restaurant.kitchen','restaurant.inventory','restaurant.pos'].map(capability=>({capability,available:true}))});
  if(p.endsWith('/order-feed'))return json({changed:[],removed:[],cursor:'cursor',as_of:stamp});
  if(rich&&p.includes('/preparation/')){
   const station=p.includes('/bar/')?'bar':'kitchen';
   if(p.endsWith('/feed'))return json({full_refresh:true,changed:[],removed:[],cursor:'cursor',expires_at:'2026-10-14T08:00:00Z',as_of:stamp});
   if(p.endsWith('/orders')){const items=station==='bar'?[stationOrder('ORD_BAR_READY','bar','ready')]:[stationOrder('ORD_KITCHEN_WAIT','kitchen','waiting'),stationOrder('ORD_KITCHEN_ACTIVE','kitchen','preparing')];return json({items,total:items.length,page:1,page_size:20,as_of:stamp,copy:{}});}
  }
  if(rich&&p.endsWith('/service/financial/entries'))return json({financial_revision:1,entries:[{entry_ref:'EXP_CDF',revision:1,kind:'expense',target_ref:null,currency:'CDF',amount:'200.00',category:'Fournitures',description:'Charbon',reason:null,method:{method_ref:'CASH',label:'Espèces',kind:'cash',provider_verified:false},recorded_at:stamp,cash_effect:'-200.00',expense_effect:'200.00',recovered_effect:'0.00'}],next_after_revision:null});
  if(rich&&p.endsWith('/service/daily/time-zone'))return json({time_zone:'Africa/Kinshasa',time_zone_revision:1,confirmed_at:stamp});
  if(rich&&p.endsWith('/service/daily/reports'))return json({reports:[],next_before:null});
  if(rich&&p.includes('/service/daily/days/')&&p.endsWith('/preview'))return json(day);
  if(rich&&p.endsWith('/payment-methods'))return json({items:[{method_ref:'CASH',label:'Espèces',kind:'cash',currencies:['CDF'],enabled:true,revision:1},{method_ref:'MOBILE',label:'Mobile déclaré',kind:'external_mobile_money',currencies:['USD'],enabled:true,revision:1}]});
  if(rich&&p.endsWith('/service/groups/RSG_COUNTER/money/receipts')&&m==='POST'){counterPaid=true;return json({operation_outcome:{entry_ref:'PAY_COUNTER'},bill:{...counterBill,payment_revision:1,entries:[{entry_ref:'PAY_COUNTER',kind:'receipt',method:{method_ref:'CASH',label:'Espèces',kind:'cash',provider_verified:false},currency:'CDF',amount:'3000.00',change_returned:'0.00',net_amount:'3000.00',allocations:[{order_ref:'ORD_COUNTER',amount:'3000.00'}]}],currencies:{...counterBill.currencies,CDF:moneyTotals('3000.00','3000.00','0.00')}}});}
  if(rich&&p.endsWith('/service/groups/RSG_COUNTER/bill'))return json(counterPaid?{...counterBill,payment_revision:1,bill_revision:'d'.repeat(64),entries:[{entry_ref:'PAY_COUNTER',kind:'receipt',target_ref:null,method:{method_ref:'CASH',label:'Espèces',kind:'cash',provider_verified:false},currency:'CDF',amount:'3000.00',change_returned:'0.00',net_amount:'3000.00',allocations:[{order_ref:'ORD_COUNTER',amount:'3000.00'}]}],currencies:{...counterBill.currencies,CDF:moneyTotals('3000.00','3000.00','0.00')}}:counterBill);
  if(rich&&p.endsWith('/service/groups/RSG_VISIT/bill'))return json(bill);
  if(rich&&p.endsWith('/service/groups/RSG_VISIT'))return json({group_ref:'RSG_VISIT',revision:3,state:'checkout',guest_confirmed:false,can_add_round:false,order_until:'2026-10-14T08:00:00Z',rounds:[{order_ref:'ORD_ROUND_1',entry_source:'assisted',state:'completed',currency:'CDF',amount:'3000.00',revision:2,submitted_at:stamp,fulfillment_method:'assisted',cancellation_pending:false},{order_ref:'ORD_ROUND_2',entry_source:'assisted',state:'completed',currency:'USD',amount:'2.50',revision:2,submitted_at:stamp,fulfillment_method:'assisted',cancellation_pending:false}],payment_verified:false});
  if(rich&&p.endsWith('/service/groups'))return json({items:[{group_ref:'RSG_VISIT',revision:3,state:'checkout',guest_confirmed:false}],has_more:false});
  if(rich&&p.endsWith('/service'))return json({items:food,intake_released:true});
  if(p.endsWith('/order-configuration'))return json({intake_released:intake});
  if(p.endsWith('/orders')){const states=url.searchParams.getAll('states');const items=empty?[]:states.includes('pending')?[order('ORD_PENDING','pending')]:states.includes('accepted')?[order('ORD_ACCEPTED','accepted')]:[];return json({items,total:items.length,as_of:stamp});}
  if(p.endsWith('/menu/items'))return json({revision:stamp,currency:'CDF',result:{items:empty?[]:food,total:empty?0:food.length,page:1,page_size:20}});
  if(p.endsWith('/reservations/setting'))return json({enabled:intake,revision:1,available:true});
  if(p.endsWith('/reservations/calendar'))return json({items:[],has_more:false,timezone_name:'Africa/Kinshasa'});
  if(p.endsWith('/reservations/pending'))return json({items:empty?[]:[reservation],has_more:false,timezone_name:'Africa/Kinshasa'});
  if(p.endsWith('/reservations/RRS_1'))return json(reservation);
  if(p.endsWith('/reservations'))return json({items:empty?[]:[{reservation_ref:'RSV_1',establishment_ref:establishment.public_ref,establishment_name:establishment.profile.name,state:'pending',revision:1,starts_at:'2026-10-14T18:00:00+01:00',timezone_name:'Africa/Kinshasa',party_size:3,response_deadline:'2026-10-14T12:00:00+01:00',overlapping_requests:0}]});
  if(p.endsWith('/order-summary'))return json({as_of:stamp,coverage_from:null,coverage_to:null,measurement_status:'unavailable',metrics:null});
  if(rich&&p.endsWith('/counter-baskets/BSK_1/quote'))return json({basket:{basket_ref:'BSK_1',revision:2,quote:counterTerms,quote_ref:'RQU_1',order_ref:null}});
  if(rich&&p.endsWith('/counter-baskets/BSK_1/finalize'))return json({operation_outcome:{order_ref:'ORD_COUNTER',bill_group_ref:'RSG_COUNTER'},bill_group_ref:'RSG_COUNTER',current_order:{order_ref:'ORD_COUNTER',revision:1,state:'completed',entry_source:'counter',fulfillment_method:'on_premise',submitted_at:stamp,receipt_terms:counterTerms}});
  if(p.endsWith('/counter-baskets')&&m==='POST')return json({basket_ref:'BSK_1',revision:1,quote:null,quote_ref:null,order_ref:null});
  if(p.endsWith('/restaurants'))return json({items:[establishment],total:1,page:1,page_size:20,actions:['create']});
  if(p.endsWith('/'+establishment.public_ref))return json(establishment);
  return route.fulfill({status:404,json:{detail:'unseeded'}});
 });
}
for(const width of [360,820,1440])test(`seller workflow FR ${width}`,async({page})=>{
 page.on('dialog',dialog=>dialog.accept());
 await page.setViewportSize({width,height:900});await seed(page,true);await page.goto('/fr/shida/seller/restaurants/');
 await expect(page.getByText('ORD_ACCEPTED')).toBeVisible();
 await page.screenshot({path:`docs/evidence/workflow-orders-${width}.png`,fullPage:true});
 await page.getByRole('combobox',{name:'Commandes'}).selectOption('pending');await expect(page.getByText('ORD_PENDING')).toBeVisible();
 await managementNavigation(page,'Vente au comptoir');await expect(page.getByText('Fufu et pondu')).toBeVisible();
 await page.getByRole('button',{name:'Ajouter',exact:true}).first().click();await expect(page.getByText('CDF: 3000.00')).toBeVisible();
 await expect(page.locator('.rst-work').getByRole('button',{name:'Suivant'})).toHaveCount(0);
 await page.screenshot({path:`docs/evidence/workflow-counter-${width}.png`,fullPage:true});
 await managementNavigation(page,'Réservations');await page.getByRole('region',{name:'En attente du vendeur'}).getByRole('button').first().click();await expect(page.getByRole('button',{name:'Accepter cette demande'})).toBeVisible();
 await page.screenshot({path:`docs/evidence/workflow-reservations-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const width of [360,820,1440])test(`seller work and finances FR ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await seed(page,true,false,true);await page.goto('/fr/shida/seller/restaurants/');
 await managementNavigation(page,'Préparation');await expect(page.getByText('ORD_KITCHEN_WAIT')).toBeVisible();await page.screenshot({path:`docs/evidence/workflow-preparation-kitchen-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:/Bar/}).first().click();await expect(page.getByText('ORD_BAR_READY')).toBeVisible();await page.screenshot({path:`docs/evidence/workflow-preparation-bar-${width}.png`,fullPage:true});
 await managementNavigation(page,'Service');await page.getByRole('button',{name:/RSG_VISIT/}).click();await expect(page.locator('.rst-service-round').filter({hasText:'ORD_ROUND_2'})).toBeVisible();await expect(page.locator('.rst-money-totals')).toContainText('USD');await expect(page.getByText('PAY_USD')).toBeVisible();await page.screenshot({path:`docs/evidence/workflow-service-${width}.png`,fullPage:true});
 await managementNavigation(page,'Finances');await expect(page.getByText('EXP_CDF')).toBeVisible();await expect(page.locator('.rst-daily-summary')).toContainText('-300.00');await expect(page.locator('.rst-daily-summary')).toContainText('Valeur des commandes liées');await expect(page.locator('.rst-daily-summary')).toContainText('Encaissements nets enregistrés');await page.screenshot({path:`docs/evidence/workflow-finances-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const width of [360,820,1440])test(`closed intake and empty states ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await seed(page,false,true);await page.goto('/fr/shida/seller/restaurants/');
 await expect(page.getByText(/réception des nouvelles commandes est fermée/i)).toBeVisible();
 await expect(page.locator('.rst-order-layout').getByRole('button',{name:'Suivant'})).toHaveCount(0);
 await page.screenshot({path:`docs/evidence/workflow-empty-closed-${width}.png`,fullPage:true});
 await managementNavigation(page,'Statistiques des commandes');await expect(page.getByRole('button',{name:'Activer la mesure des commandes'})).toBeVisible();
 await expect(page.getByRole('textbox',{name:'Du'})).toHaveCount(0);
 await page.screenshot({path:`docs/evidence/workflow-empty-statistics-${width}.png`,fullPage:true});
 await managementNavigation(page,'Réservations');await expect(page.getByText('Les nouvelles demandes sont fermées.')).toBeVisible();
 await expect(page.getByRole('region',{name:'En attente du vendeur'}).getByRole('button',{name:'Suivant'})).toHaveCount(0);
 await page.screenshot({path:`docs/evidence/workflow-empty-reservations-${width}.png`,fullPage:true});
});

for(const width of [360,820,1440])test(`counter handover and canonical bill ${width}`,async({page})=>{
 page.on('dialog',dialog=>dialog.accept());
 await page.setViewportSize({width,height:900});await seed(page,true,false,true);await page.goto('/fr/shida/seller/restaurants/');
 await managementNavigation(page,'Vente au comptoir');
 await page.getByRole('button',{name:'Ajouter',exact:true}).first().click();
 await expect(page.getByText('CDF: 3000.00')).toBeVisible();
 await page.getByRole('button',{name:'Calculer le total exact'}).click();
 await expect(page.locator('.rst-details').getByText('3000.00 CDF').first()).toBeVisible();
 await page.getByRole('button',{name:'Confirmer la remise des aliments'}).click();
 await expect(page.getByText('Référence de la facture: RSG_COUNTER').first()).toBeVisible();
 await expect(page.locator('.rst-money-totals')).toContainText('3000.00');
 await page.screenshot({path:`docs/evidence/workflow-counter-bill-${width}.png`,fullPage:true});
 await page.getByRole('combobox',{name:'Mode'}).first().selectOption('CASH');
 await page.getByRole('combobox',{name:'Devise'}).selectOption('CDF');
 await page.getByRole('textbox',{name:'Montant réel'}).fill('3000');
 await page.getByRole('button',{name:'Confirmer l’argent effectivement reçu'}).click();
 await expect(page.getByText('PAY_COUNTER')).toBeVisible();
 await page.screenshot({path:`docs/evidence/workflow-counter-paid-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
