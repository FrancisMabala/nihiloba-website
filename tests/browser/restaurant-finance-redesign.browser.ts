import {mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const evidence=process.env.RESTAURANT_EVIDENCE_DIR??join(tmpdir(),`shida-restaurant-evidence-${Date.now()}`);mkdirSync(evidence,{recursive:true});
import {test,expect,type Page} from '@playwright/test';
import {managementNavigation} from './restaurant-management-navigation';
import {financeText} from '../../app/lib/restaurant-finance-design-copy';
const stamp='2026-11-14T09:00:00Z';
async function seed(page:Page){
 const category={public_ref:'RMC_one',name:'Plats',visible:true};
 const item={public_ref:'RMI_one',name:'Pondu avec accompagnement et une très longue description du plat',category,pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000.00',sale_unit_label:'assiette',availability:'available',visible:true,presentation:'fixed_dish',permanent:true,image_url:null,preparation_station:'serve',enable_blocker:null,menu_state:'available'};
 const state={pickup:true,delivery:false,qr:false,qrRevision:1,lostIntake:false,staleIntake:false,failConfig:false,blocked:'',failItems:false,revision:stamp,items:[item] as Record<string,unknown>[],lost:'',keys:new Map<string,unknown>(),writes:[] as {path:string;body:Record<string,unknown>}[],queries:[] as URLSearchParams[]};
 const bump=()=>state.revision=new Date(Date.parse(state.revision)+1000).toISOString();
 const parent=()=>({public_ref:'RST_menu',revision:state.revision,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links'],profile:{name:'Menu acceptance fixture',food_business_type:'malewa',city:'Kinshasa',commune:'Lemba',timezone_name:'Africa/Kinshasa'}});
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.replace(/\/$/,'');const send=(json:unknown,status=200)=>route.fulfill({status,json});
  if(p.endsWith('/employment/session'))return send({user:{display_name:'Fixture'},binding:'a'.repeat(64)});
  if(p.endsWith('/capabilities'))return send({capabilities:[{capability:'restaurant.pos',available:true}]});
  if(p.endsWith('/order-feed'))return send({changed:[],removed:[],cursor:'fixture',as_of:stamp});
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Kinshasa',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const cash={opening:null,counted:null,cash_receipts_net:'80000.00',actual_cash_refunds:'0.00',cash_expense_effect:'-20000.00',cash_movements:'0.00',expected:null,discrepancy:null};
 if(p.endsWith('/time-zone'))return send({time_zone:'Africa/Kinshasa',time_zone_revision:1,confirmed_at:stamp});
 if(p.endsWith('/reports'))return send({reports:[],next_before:null});
 if(p.endsWith('/preview')){const day=p.split('/days/')[1].split('/')[0];return send({local_date:day,time_zone:'Africa/Kinshasa',start_utc:day+'T00:00:00Z',end_utc:day+'T23:59:59Z',revision:1,closed:false,preview_revision:'a'.repeat(64),currencies:{CDF:{opening:null,counted:null},USD:{opening:null,counted:null}},cash:{CDF:cash,USD:{...cash,cash_receipts_net:'25.00',cash_expense_effect:'0.00'}},expenses:{CDF:'20000.00',USD:'0.00'},outstanding:{CDF:{balance_due:day===today?'14000.00':'1.00',refund_owed:'3000.00'},USD:{balance_due:'0.00',refund_owed:'0.00'}},open_orders:{count:0,refs:[]},stock_exceptions:{count:0,refs:[]},methods:[{method_ref:'PM_mobile',label:'Mobile Money',kind:'external_mobile_money',currency:'CDF',recorded_net:'5000.00',corrections:'0.00'}],supplemental_adjustment_count:0,supplemental_adjustments:[]});}
 if(p.endsWith('/activity'))return send({items:[{entry_ref:'F_one',kind:'expense',description:'Achat de riz',amount:'-20000.00',currency:url.searchParams.get('currency'),recorded_at:stamp,method:'Espèces'}],next_before:null});
 if(p.endsWith('/invoices')){state.queries.push(url.searchParams);return send({items:[{group_ref:'RSG_test',created_at:stamp,invoice_state:'checkout',payment_status:url.searchParams.get('status')==='refund'?'refund':'due',currency:'CDF',chargeable:'40000.00',balance_due:'14000.00',refund_owed:'3000.00'}],next_before:null});}
 if(p.endsWith('/entries')&&req.method()==='GET')return send({entries:[],financial_revision:0,next_after_revision:null});
 if(p.endsWith('/payment-methods'))return send({items:[{method_ref:'PM_cash',label:'Espèces',kind:'cash',currencies:['CDF','USD'],enabled:true}]});
 if(p.endsWith('/entries')&&req.method()==='POST'){state.writes.push({path:p,body:req.postDataJSON()});if(state.lost==='expense')return route.abort();return send({});}
 if(p.endsWith('/recover'))return send({found:false});
  if(p.endsWith('/pos'))return send({intake_released:true,items:state.items,recent:[]});
  if(p.endsWith('/orders'))return send({items:[],total:0,as_of:stamp});
  if(p.endsWith('/restaurants'))return send({items:[parent()],total:1,page:1,page_size:20,actions:['create']});
  if(p.endsWith('/RST_menu'))return send(parent());
  if(p.endsWith('/menu/categories'))return send({revision:state.revision,currency:'CDF',result:{items:[category],total:1,page:1,page_size:50}});
  if(req.method()==='GET'&&p.endsWith('/menu/items')){
   if(state.failItems)return send({},503);state.queries.push(url.searchParams);const rows=state.items.filter(row=>(!url.searchParams.get('search')||String(row.name).toLowerCase().includes(url.searchParams.get('search')!.toLowerCase()))&&(!url.searchParams.get('menu_state')||row.menu_state===url.searchParams.get('menu_state')));const start=(Number(url.searchParams.get('page')||1)-1)*20;
   return send({revision:state.revision,currency:'CDF',result:{items:rows.slice(start,start+20),total:rows.length,page:1,page_size:20}});
  }
  const ref=p.match(/\/menu\/items\/(RMI_\w+)$/)?.[1];
  if(req.method()==='GET'&&ref)return send({revision:state.revision,currency:'CDF',result:state.items.find(row=>row.public_ref===ref)});
  if(req.method()!=='GET'){
   const body=req.postDataJSON();state.writes.push({path:p,body});if(state.keys.has(body.operation_key))return send(state.keys.get(body.operation_key));
   if(body.expected_updated_at!==state.revision)return send({detail:'restaurant_stale'},409);
   let result:unknown,stage='';bump();
   if(p.endsWith('/menu-batches')){stage='item';const fields=body.rows[0].fields;const created={...item,...fields,public_ref:'RMI_created',preparation_station:null,category,menu_state:'hidden'};state.items.push(created);result={revision:state.revision,operation_outcome:{items:[{item_ref:'RMI_created'}]}};}
   else if(p.includes('/preparation-routing/')){stage='route';const row=state.items.find(row=>p.endsWith(String(row.public_ref)))!;row.preparation_station=body.station;result={revision:state.revision};}
   else if(ref){stage='enable';const row=state.items.find(row=>row.public_ref===ref)!;Object.assign(row,body.fields);row.menu_state=row.visible?row.availability==='available'?'available':'unavailable':'hidden';result={revision:state.revision,currency:'CDF',result:row};}
   else return send({},404);
   state.keys.set(body.operation_key,result);if(state.lost===stage){state.lost='';return route.abort();}return send(result);
  }
  return send({},404);
 });return state;
}

async function enter(page:Page,locale:'fr'|'en'|'ln'|'sw'='fr'){await page.goto(`/${locale}/shida/seller/restaurants`);await managementNavigation(page,financeText(locale,'title'));await expect(page.locator('.rst-finance-redesign')).toBeVisible();await expect(page.locator('[data-metric=received] strong')).not.toContainText('—');}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,390,430,820,1440])test(`finance layout ${locale} ${width}`,async({page})=>{await page.setViewportSize({width,height:width===390?844:1000});await seed(page);await enter(page,locale);await expect(page.locator('.rst-finance-tabs button')).toHaveCount(4);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(locale==='fr'&&[375,390,1440].includes(width))await page.screenshot({path:`${evidence}/finance-${width}.png`,fullPage:true});});
test('day totals, currency and current invoices are separate',async({page})=>{const s=await seed(page);await enter(page);await expect(page.locator('[data-metric=received] strong')).toContainText('85');await page.locator('.rst-finance-filters>details>summary').click();await page.getByRole('button',{name:'Hier',exact:true}).click();await expect(page.locator('.rst-finance-outstanding').getByText(/14.*000/)).toBeVisible();await page.getByRole('button',{name:'USD',exact:true}).click();await expect(page.locator('[data-metric=received] strong')).toContainText('25');await page.getByRole('button',{name:'CDF',exact:true}).click();await page.locator('.rst-finance-outstanding button').last().click();await expect(page.locator('.rst-invoice-list')).toContainText('RSG_test');expect(s.queries.at(-1)?.get('status')).toBe('refund');});
test('cash missing values stay unknown and failed expense preserves fields',async({page})=>{await page.setViewportSize({width:390,height:844});const s=await seed(page);await enter(page);await page.locator('.rst-finance-tabs').getByRole('button',{name:'Caisse',exact:true}).click();await expect(page.locator('.rst-daily-grid')).toContainText('À compléter');await page.locator('.rst-finance-tabs').getByRole('button',{name:'Dépenses',exact:true}).click();await page.screenshot({path:`${evidence}/after-expense-390.png`,fullPage:true});await page.getByLabel('Motif',{exact:true}).fill('Riz');await page.getByLabel('Montant',{exact:true}).fill('12000');await page.getByRole('combobox',{name:'Mode de paiement',exact:true}).selectOption('PM_cash');s.lost='expense';await page.locator('.rst-daily-task fieldset').getByRole('button',{name:'Enregistrer',exact:true}).click();await page.getByRole('dialog').getByRole('button').last().click();await expect(page.getByLabel('Montant',{exact:true})).toHaveValue('12000');expect(s.writes).toHaveLength(1);expect(s.writes[0].body.kind).toBe('expense');expect(s.writes[0].body.declared_occurred_at).toBeTruthy();});

for(const width of [320,375,390,430,820,1440])test(`numbered invoice detail and return ${width}`,async({page})=>{
 await page.setViewportSize({width,height:844});const state=await seed(page);
 const order={order_ref:'ROD_full_reference_kept',order_number:42,order_local_date:'2026-11-17',order_timezone:'Africa/Kinshasa',submitted_at:'2026-11-17T15:04:00Z',entry_source:'counter',fulfillment_method:'takeaway',state:'completed',currency:'CDF',amount:'40000.00',food_subtotal:'40000.00',delivery_fee:null,items:[{name:'Pondu et accompagnement avec un nom très long',quantity:2,unit_price:'20000.00',subtotal:'40000.00',sale_unit_label:'portion'}]};
 const values={chargeable:'40000.00',net_allocated:'26000.00',balance_due:'14000.00',refund_owed:'0.00'};
 await page.route(/\/financial\/invoices\/?\?/,route=>route.fulfill({json:{items:[{orders:[order],group_ref:'RSG_test',created_at:stamp,invoice_state:'checkout',payment_status:'due',currency:'CDF',...values}],next_before:null}}));
 await page.route(/\/groups\/RSG_test\/bill\/?$/,route=>route.fulfill({json:{group_ref:'RSG_test',group_revision:1,payment_revision:1,bill_revision:'revision-1',state:'checkout',chargeable_rounds:[order],pending_rounds:[],excluded_rounds:[],currencies:{CDF:values,USD:{chargeable:'0',net_allocated:'0',balance_due:'0',refund_owed:'0'}},entries:[]}}));
 await enter(page);await page.locator('.rst-finance-tabs').getByRole('button',{name:'Factures',exact:true}).click();
 const row=page.locator('.rst-invoice-row');await expect(row).toContainText('Commande n° 042');await expect(row).toContainText('Partiellement payée');
 await page.getByRole('searchbox',{name:'N° de commande ou de facture'}).fill('042');await page.getByRole('searchbox',{name:'N° de commande ou de facture'}).press('Enter');
 if(width===390)await page.screenshot({path:`${evidence}/after-invoices-390.png`,fullPage:true});
 await row.click();const dialog=page.getByRole('dialog',{name:'Commande n° 042',exact:true});await expect(dialog.getByText('Pondu et accompagnement avec un nom très long')).toBeVisible();await expect(dialog).toContainText('Comptoir');await expect(dialog).toContainText('RSG_test');await expect(dialog.locator('fieldset')).toHaveCount(0);expect(state.writes).toHaveLength(0);
 await expect(dialog.getByRole('button',{name:'Retour à la liste',exact:true})).toBeEnabled();
 if(width===390)await page.screenshot({path:`${evidence}/after-invoice-detail-390.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goBack();await expect(dialog).not.toBeVisible();await expect(page.getByRole('searchbox',{name:'N° de commande ou de facture'})).toHaveValue('042');await expect(row).toBeVisible();expect(state.writes).toHaveLength(0);
 await page.goForward();await expect(dialog).toBeVisible();
 if(width===390){
  await dialog.getByRole('button',{name:'Encaisser',exact:true}).click();const form=dialog.locator('fieldset');await expect(form).toBeVisible();
  await form.getByRole('combobox',{name:'Mode',exact:true}).first().selectOption('PM_cash');await form.getByRole('combobox',{name:'Devise',exact:true}).selectOption('CDF');await form.getByLabel('Montant réel',{exact:true}).fill('14000');
  const submit=form.getByRole('button',{name:'Confirmer l’argent effectivement reçu',exact:true});await submit.click();await page.locator('.shida-confirmation').getByRole('button',{name:'Revenir',exact:true}).click();expect(state.writes).toHaveLength(0);
  let attempts=0;await page.route(/\/money\/receipts\/?$/,route=>{attempts++;return route.abort();});await submit.click();await page.locator('.shida-confirmation-submit').click();await expect(page.locator('.shida-confirmation-error')).toBeVisible();await page.locator('.shida-confirmation').getByRole('button',{name:'Revenir',exact:true}).click();
  await expect(dialog.getByRole('button',{name:'Retour à la liste',exact:true})).toBeDisabled();await page.goBack();await expect(dialog).toBeVisible();expect(attempts).toBe(1);
  await dialog.getByRole('button',{name:'Abandonner la recherche en attente',exact:true}).click();await expect(dialog.getByRole('button',{name:'Retour à la liste',exact:true})).toBeEnabled();
 }
 await dialog.getByRole('button',{name:'Retour à la liste',exact:true}).click();await expect(dialog).not.toBeVisible();
});


test('finance enlarged text and payment-method failure are explicit',async({page})=>{
 await page.setViewportSize({width:320,height:844});await seed(page);await enter(page);await page.addStyleTag({content:'html{font-size:200% !important}'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.rst-daily-settings>summary').click();await expect(page.locator('.rst-daily-settings')).toContainText('Espèces');
 await page.route(/\/service\/payment-methods\/?$/,route=>route.fulfill({status:503,json:{}}));await page.locator('.rst-finance-refresh').click();
 await expect(page.locator('.rst-daily-settings').getByRole('alert')).toContainText('Impossible de charger cette section');await expect(page.locator('.rst-daily-settings').getByRole('button',{name:'Réessayer',exact:true})).toBeVisible();
 await page.locator('.rst-finance-tabs').getByRole('button',{name:'Dépenses',exact:true}).click();await expect(page.getByLabel('Montant',{exact:true})).toBeDisabled();
});
