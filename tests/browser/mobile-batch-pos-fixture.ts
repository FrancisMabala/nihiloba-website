import {expect,type Page} from '@playwright/test';
import {counterCopy} from '../../app/lib/restaurant-counter-copy';
import {workText} from '../../app/lib/restaurant-work-copy';
import {fixture} from './restaurant-c1e-fixture';
const stamp='2026-10-21T12:00:00Z';
const dish={public_ref:'RMI_one',name:'Poulet braisé',presentation:'fixed_dish',pricing_model:'UNIT_PRICED',unit_price:'12000.00',currency:'CDF',sale_unit_label:'assiette',availability:'available',category:{public_ref:'RMC_food',name:'Plats'},counter_options:{portions:[{key:'large',label:'Grande',amount:'17000.00'}],extras:[{key:'rice',label:'Riz blanc',amount:'3000.00'}]}};
const terms={currency:'CDF',food_subtotal:'20000.00',order_total:'20000.00',delivery_fee:null,standalone:[{key:'food',item_ref:'RMI_one',name:dish.name,quantity:1,sale_unit_label:'assiette',portion_label:'Grande',extras:dish.counter_options.extras,note:'Sans piment',subtotal:'20000.00'}],plates:[]};
export async function setup(page:Page,locale:'fr'|'en'|'ln'|'sw'='fr'){
 const base=await fixture(page);base.establishment.status='active';
 await page.addInitScript(()=>localStorage.setItem('shida:restaurant:start:personal/restaurants/RST_fixture','sell'));
 await page.addInitScript(()=>{window.print=()=>{document.documentElement.dataset.printed='yes';};});
 const state={inventory:true,failReceipt:false,partial:false,failPrepare:false,failPayment:false,changedPrice:false,orderState:'accepted',revision:1,held:false,paid:false,writes:[] as {path:string;body:Record<string,unknown>}[],basket:{basket_ref:'RBA_one',revision:1,quote:null as typeof terms|null,quote_ref:null as string|null,order_ref:null as string|null,selections:{standalone:[] as Record<string,unknown>[],plates:[]},fulfillment_method:'takeaway',expires_at:'2026-10-22T12:00:00Z'}};
 const order=()=>({order_ref:'ROD_one',revision:state.revision,state:state.orderState,entry_source:'counter',fulfillment_method:'takeaway',submitted_at:stamp,cancellation_pending:false,receipt_terms:terms,bill_group_ref:'RSG_one',payment_verified:false});
 const totals=(amount:string,paid:string)=>({chargeable:amount,net_allocated:paid,balance_due:String(Number(amount)-Number(paid)),refund_owed:'0.00'});
 const entry={entry_ref:'RME_one',kind:'receipt',target_ref:null,currency:'CDF',amount:'25000.00',change_returned:'5000.00',net_amount:'20000.00',method:{method_ref:'RPM_cash',label:'Espèces',kind:'cash',provider_verified:false},allocations:[{order_ref:'ROD_one',amount:'20000.00'}]};
 const bill=()=>({group_ref:'RSG_one',group_revision:3,payment_revision:state.paid?1:0,bill_revision:(state.paid?'b':'a').repeat(64),state:'checkout',chargeable_rounds:[{order_ref:'ROD_one',state:'accepted',currency:'CDF',amount:'20000.00'}],pending_rounds:[],excluded_rounds:[],currencies:{CDF:totals('20000.00',state.paid?(state.partial?'5000.00':'20000.00'):'0.00'),USD:totals('0.00','0.00')},entries:state.paid?[entry]:[]});
 await page.route('**/api/shida/personal/restaurants/RST_fixture/**',async route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,''),method=route.request().method();
  const json=(v:unknown)=>route.fulfill({json:v});
  if(p.endsWith('/menu/offerings'))return json({revision:stamp,currency:'CDF',result:{items:[],total:0,page:1,page_size:20},evaluated_at:stamp,day_plan:{day:'2026-11-15',today:'2026-11-15',timezone_name:'Africa/Kinshasa',opening_known:true,opening_error:null,opening_periods:[]}});
  if(p.endsWith('/capabilities'))return json({capabilities:[{capability:'restaurant.pos',available:true},{capability:'restaurant.inventory',available:state.inventory}]});
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
  if(p.endsWith('/money/receipts')){state.writes.push({path:p,body:route.request().postDataJSON()});state.paid=true;const body=route.request().postDataJSON();entry.amount=body.amount;entry.change_returned=body.change_returned;entry.net_amount=String(Number(body.amount)-Number(body.change_returned));if(state.failPayment){state.failPayment=false;return route.abort();}return json({bill:bill(),operation_outcome:{entry_ref:'RME_one'}});}
  if(p.endsWith('/receipt')&&state.failReceipt)return route.fulfill({status:503,json:{detail:'unavailable'}});
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
