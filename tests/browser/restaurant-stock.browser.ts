import { test, expect, type Page } from '@playwright/test';
import { managementNavigation } from './restaurant-management-navigation';
import { managementCopy } from '../../app/lib/restaurant-management-copy';

const at = '2026-10-15T08:00:00+00:00';
type Item = { item_ref:string; name:string; purpose:'sellable'|'ingredient'; stock_kind:'prepared'|'packaged'|'ingredient'|null; unit:string; display_label:null; status:string; revision:number; initialized:boolean; on_hand:string; reserved:string; available:string; balance_revision:number; low_stock:boolean; low_stock_threshold:string|null; last_changed_at:string; tracking_active:boolean };
function item(ref:string,name:string,kind:Item['stock_kind'],unit:string,balance:number,threshold:number|null):Item { return {item_ref:ref,name,purpose:kind==='ingredient'?'ingredient':'sellable',stock_kind:kind,unit,display_label:null,status:'active',revision:1,initialized:true,on_hand:`${balance}.000`,reserved:'0.000',available:`${balance}.000`,balance_revision:1,low_stock:threshold!==null&&balance<=threshold,low_stock_threshold:threshold===null?null:`${threshold}.000`,last_changed_at:at,tracking_active:true}; }
async function fixture(page:Page, kind:'malewa'|'restaurant'|'fast_food'|'cafe'='malewa', empty=false) {
 const seed:Record<typeof kind,Item[]>={malewa:[item('RII_fufu','Fufu portions','prepared','portion',2,3),item('RII_rice','Rice','ingredient','kg',5,1)],restaurant:[item('RII_plate','Ready plates','prepared','portion',0,2)],fast_food:[item('RII_burger','Burgers ready','prepared','piece',8,3)],cafe:[item('RII_water','Bottled water','packaged','bottle',4,2)]};
 const stock=empty?[]:seed[kind]; const movements:Record<string,unknown[]>={}; const seen=new Map<string,unknown>(); const writes:{body:Record<string,unknown>;path:string}[]=[]; let stale=false,uncertain=false;
 const establishment={public_ref:'RST_stock',revision:at,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links'],profile:{name:'Solo stock fixture',food_business_type:kind,city:'Kinshasa',commune:'Limete',timezone_name:'Africa/Kinshasa'}};
 await page.route('**/api/**', async route=>{ const request=route.request();const url=new URL(request.url());const path=url.pathname.replace(/\/$/,'');const respond=(value:unknown,status=200)=>route.fulfill({status,json:value});
  if(path.endsWith('/employment/session'))return respond({user:{display_name:'Solo seller'},binding:'a'.repeat(64)});
  if(path.endsWith('/capabilities'))return respond({capabilities:[{capability:'restaurant.inventory',available:true}]});
  if(path.endsWith('/order-feed'))return respond({changed:[],removed:[],cursor:'fixture',as_of:at});
  if(path.endsWith('/order-configuration'))return respond({intake_released:true});
  if(path.endsWith('/orders'))return respond({items:[],total:0,as_of:at});
  if(path.endsWith('/inventory/bindings'))return respond({tracking_active:true,bindings:[]});
  if(path.endsWith('/menu/items'))return respond({revision:at,currency:'CDF',result:{items:[{public_ref:'RMI_food',name:'Menu portion',pricing_model:'UNIT_PRICED',availability:'available'}],total:1,page:1,page_size:50}});
  if(path.endsWith('/inventory'))return respond({tracking_active:true,total:stock.length,items:stock});
  if(path.endsWith('/history')){const ref=path.match(/(RII_[^/]+)\/history$/)?.[1]??'';return respond({entries:movements[ref]??[],next_before_id:null});}
  if(path.endsWith('/inventory/items')&&request.method()==='POST'){const body=request.postDataJSON();writes.push({body,path});if(seen.has(body.operation_key))return respond(seen.get(body.operation_key));const made=item('RII_created',body.name,body.stock_kind,body.unit,Number(body.opening_quantity),body.low_stock_threshold===null?null:Number(body.low_stock_threshold));stock.push(made);seen.set(body.operation_key,made);return respond(made);}
  if(path.endsWith('/kind')&&request.method()==='POST'){const body=request.postDataJSON();writes.push({body,path});if(seen.has(body.operation_key))return respond(seen.get(body.operation_key));const ref=path.match(/(RII_[^/]+)\/kind$/)?.[1]??'';const row=stock.find(entry=>entry.item_ref===ref)!;if(body.expected_revision!==row.revision)return respond({detail:'restaurant_stale'},409);row.stock_kind=body.stock_kind;row.revision++;seen.set(body.operation_key,row);return respond(row);}
  if(path.endsWith('/movements')&&request.method()==='POST'){const body=request.postDataJSON();writes.push({body,path});if(seen.has(body.operation_key))return respond(seen.get(body.operation_key));const ref=path.match(/(RII_[^/]+)\/movements$/)?.[1]??'';const row=stock.find(entry=>entry.item_ref===ref)!;if(stale){stale=false;row.balance_revision++;return respond({detail:'restaurant_stale'},409);}if(body.expected_revision!==row.balance_revision)return respond({detail:'restaurant_stale'},409);const before=Number(row.on_hand);const after=body.action==='count'?Number(body.amount):before+(body.action==='waste'?-1:1)*Number(body.amount);row.on_hand=`${after}.000`;row.available=row.on_hand;row.balance_revision++;row.low_stock=row.low_stock_threshold!==null&&after<=Number(row.low_stock_threshold);row.last_changed_at=at;const movement={movement_ref:`RIM_${row.balance_revision}`,kind:body.action==='count'?'count_correction_out':body.action,quantity_effect:`${after-before}.000`,unit:row.unit,created_at:at,balance_after:row.on_hand};movements[ref]=[movement,...(movements[ref]??[])];seen.set(body.operation_key,row);if(uncertain){uncertain=false;return route.abort();}return respond(row);}
  if(path.endsWith('/restaurants'))return respond({items:[establishment],total:1,page:1,page_size:20,actions:['create']});
  if(path.endsWith('/RST_stock'))return respond(establishment);
  return respond({},404);
 });
 return {stock,writes,makeStale:()=>{stale=true;},makeUncertain:()=>{uncertain=true;}};
}

for(const locale of ['fr','en','ln','sw'] as const)for(const width of [360,820,1440])test(`Stock ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await fixture(page,'malewa');await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants`);
 await managementNavigation(page,managementCopy[locale].stock);
 const stock=page.locator('.rst-stock');await expect(stock.locator('.rst-stock-row')).toHaveCount(2);
 await page.screenshot({path:`docs/evidence/stock-before-${locale}-${width}.png`,fullPage:true});
 await stock.locator('.rst-stock-row').first().click();await expect(stock.locator('.rst-stock-detail')).toBeVisible();
 await page.screenshot({path:`docs/evidence/stock-after-${locale}-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await stock.getByRole('searchbox').fill('absent');await expect(stock.locator('.rst-stock-row')).toHaveCount(0);
});

test('solo stock work handles first use, four inventories, movements, stale revision and exact retry',async({page})=>{
 await page.setViewportSize({width:360,height:800});const state=await fixture(page,'malewa',true);await page.goto('/en/shida/seller/restaurants');await managementNavigation(page,managementCopy.en.stock);
 const stock=page.locator('.rst-stock');await expect(stock.getByText('No tracked items.')).toBeVisible();await stock.getByRole('button',{name:'Create item'}).click();await stock.getByLabel('Name').fill('Fufu portions');await stock.getByLabel('Opening quantity').fill('2');await stock.getByRole('button',{name:'Save'}).click();await expect(stock.locator('.rst-stock-row')).toHaveCount(1);
 await stock.locator('.rst-stock-row').click();await expect(stock.getByText('No recent movements.')).toBeVisible();await stock.locator('.rst-stock-action input').fill('3');await stock.getByRole('button',{name:'Save'}).click();await expect(stock.locator('.rst-stock-movement')).toContainText(['Received']);
 await stock.getByRole('button',{name:'Waste'}).click();await stock.locator('.rst-stock-action input').fill('1');state.makeStale();await stock.getByRole('button',{name:'Save'}).click();await expect(stock.getByText(/Stock changed/)).toBeVisible();await stock.getByRole('button',{name:'Waste'}).click();await stock.locator('.rst-stock-action input').fill('1');state.makeUncertain();await stock.getByRole('button',{name:'Save'}).click();await expect(stock.getByRole('button',{name:'Retry the same operation'})).toBeVisible();await stock.getByRole('button',{name:'Retry the same operation'}).click();await expect(stock.locator('.rst-stock-movement')).toHaveCount(2);await expect(stock.locator('.rst-stock-action input')).toHaveValue('');expect(state.writes.at(-1)?.body.operation_key).toBe(state.writes.at(-2)?.body.operation_key);
 await stock.getByRole('button',{name:'Observed count'}).click();await stock.locator('.rst-stock-action input').fill('1');await stock.getByRole('button',{name:'Save'}).click();await expect(stock.locator('.rst-stock-movement')).toHaveCount(3);
 for(const kind of ['restaurant','fast_food','cafe'] as const){await page.unroute('**/api/**');await fixture(page,kind);await page.reload();await managementNavigation(page,managementCopy.en.stock);await expect(page.locator('.rst-stock-row')).toHaveCount(1);}
});

test('older stock is labelled only after the seller classifies it',async({page})=>{
 const state=await fixture(page);state.stock[0].stock_kind=null;await page.goto('/en/shida/seller/restaurants');await managementNavigation(page,managementCopy.en.stock);
 const stock=page.locator('.rst-stock');await expect(stock.locator('.rst-stock-row').first()).toContainText('Type not specified');await stock.locator('.rst-stock-row').first().click();await stock.locator('.rst-stock-classify select').selectOption('packaged');await stock.locator('.rst-stock-classify button').click();await expect(stock.locator('.rst-stock-row').first()).toContainText('Drinks or sellable units');expect(state.writes.at(-1)?.path).toContain('/kind');
});


