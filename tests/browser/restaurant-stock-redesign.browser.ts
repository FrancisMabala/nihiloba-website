import {mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const evidence=process.env.RESTAURANT_EVIDENCE_DIR??join(tmpdir(),`shida-restaurant-evidence-${Date.now()}`);mkdirSync(evidence,{recursive:true});
import { test, expect, type Page } from '@playwright/test';
import { managementNavigation } from './restaurant-management-navigation';
import { managementCopy } from '../../app/lib/restaurant-management-copy';

const at = '2026-10-15T08:00:00+00:00';
type Item = { item_ref:string; name:string; purpose:'sellable'|'ingredient'; stock_kind:'prepared'|'packaged'|'ingredient'|null; unit:string; display_label:null; status:string; revision:number; initialized:boolean; on_hand:string; reserved:string; available:string; balance_revision:number; low_stock:boolean; low_stock_threshold:string|null; last_changed_at:string; tracking_active:boolean };
function item(ref:string,name:string,kind:Item['stock_kind'],unit:string,balance:number,threshold:number|null):Item { return {item_ref:ref,name,purpose:kind==='ingredient'?'ingredient':'sellable',stock_kind:kind,unit,display_label:null,status:'active',revision:1,initialized:true,on_hand:balance.toFixed(3),reserved:'0.000',available:balance.toFixed(3),balance_revision:1,low_stock:threshold!==null&&balance<=threshold,low_stock_threshold:threshold===null?null:threshold.toFixed(3),last_changed_at:at,tracking_active:true}; }
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
  if(path.endsWith('/inventory')){const q=url.searchParams.get('search')?.toLowerCase()??'';const kind=url.searchParams.get('stock_kind');const rows=stock.filter(row=>row.name.toLowerCase().includes(q)&&(!kind||kind==='other'?!kind||row.stock_kind===null:row.stock_kind===kind));const size=Number(url.searchParams.get('page_size')??20),start=(Number(url.searchParams.get('page')??1)-1)*size;return respond({tracking_active:true,timezone_name:'Africa/Kinshasa',total:rows.length,items:rows.slice(start,start+size)});}
  if(/\/inventory\/items\/RII_[^/]+$/.test(path)&&request.method()==='GET')return respond(stock.find(row=>path.endsWith(row.item_ref)));
  if(path.endsWith('/history')){const ref=path.match(/(RII_[^/]+)\/history$/)?.[1]??'';return respond({entries:movements[ref]??[],next_before_id:null});}
  if(path.endsWith('/archive')&&request.method()==='POST'){const body=request.postDataJSON();writes.push({body,path});if(seen.has(body.operation_key))return respond(seen.get(body.operation_key));const ref=path.match(/(RII_[^/]+)\/archive$/)?.[1]??'';const row=stock.find(entry=>entry.item_ref===ref)!;if(body.expected_revision!==row.revision)return respond({detail:'restaurant_stale'},409);row.status='archived';row.revision++;seen.set(body.operation_key,row);if(uncertain){uncertain=false;return route.abort();}return respond(row);}
  if(path.endsWith('/inventory/items')&&request.method()==='POST'){const body=request.postDataJSON();writes.push({body,path});if(seen.has(body.operation_key))return respond(seen.get(body.operation_key));const made=item('RII_created',body.name,body.stock_kind,body.unit,Number(body.opening_quantity),body.low_stock_threshold===null?null:Number(body.low_stock_threshold));stock.push(made);seen.set(body.operation_key,made);return respond(made);}
  if(path.endsWith('/kind')&&request.method()==='POST'){const body=request.postDataJSON();writes.push({body,path});if(seen.has(body.operation_key))return respond(seen.get(body.operation_key));const ref=path.match(/(RII_[^/]+)\/kind$/)?.[1]??'';const row=stock.find(entry=>entry.item_ref===ref)!;if(body.expected_revision!==row.revision)return respond({detail:'restaurant_stale'},409);row.stock_kind=body.stock_kind;row.revision++;seen.set(body.operation_key,row);return respond(row);}
  if(path.endsWith('/movements')&&request.method()==='POST'){const body=request.postDataJSON();writes.push({body,path});if(seen.has(body.operation_key))return respond(seen.get(body.operation_key));const ref=path.match(/(RII_[^/]+)\/movements$/)?.[1]??'';const row=stock.find(entry=>entry.item_ref===ref)!;if(stale){stale=false;row.balance_revision++;return respond({detail:'restaurant_stale'},409);}if(body.expected_revision!==row.balance_revision)return respond({detail:'restaurant_stale'},409);const before=Number(row.on_hand);const after=body.action==='count'?Number(body.amount):before+(body.action==='waste'?-1:1)*Number(body.amount);row.on_hand=`${after}.000`;row.available=row.on_hand;row.balance_revision++;row.low_stock=row.low_stock_threshold!==null&&after<=Number(row.low_stock_threshold);row.last_changed_at=at;const movement={movement_ref:`RIM_${row.balance_revision}`,kind:body.action==='count'?'count_correction_out':body.action,quantity_effect:`${after-before}.000`,unit:row.unit,created_at:at,balance_after:row.on_hand};movements[ref]=[movement,...(movements[ref]??[])];seen.set(body.operation_key,row);if(uncertain){uncertain=false;return route.abort();}return respond(row);}
  if(path.endsWith('/restaurants'))return respond({items:[establishment],total:1,page:1,page_size:20,actions:['create']});
  if(path.endsWith('/RST_stock'))return respond(establishment);
  return respond({},404);
 });
 return {stock,writes,makeStale:()=>{stale=true;},makeUncertain:()=>{uncertain=true;}};
}

for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,390,430,820,1440])test(`simple stock ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});await fixture(page,'cafe');await page.goto(`/${locale}/shida/seller/restaurants`);await managementNavigation(page,managementCopy[locale].stock);
 const stock=page.locator('.rst-stock');await expect(stock.locator('.rst-stock-row')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr'&&[375,390,1440].includes(width))await page.screenshot({path:`${evidence}/stock-${width}.png`,fullPage:true});
 await stock.locator('.rst-stock-head .button-primary').click();await expect(stock.locator('.rst-stock-types')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr'&&[375,390,1440].includes(width))await page.screenshot({path:`${evidence}/stock-create-${width}.png`,fullPage:true});
});

test('distinct quantity actions, history, stale correction and immutable uncertain retry',async({page})=>{
 await page.setViewportSize({width:390,height:900});const state=await fixture(page,'cafe');state.stock[0].on_hand='24.000';state.stock[0].available='24.000';await page.goto('/fr/shida/seller/restaurants');await managementNavigation(page,managementCopy.fr.stock);
 const stock=page.locator('.rst-stock'),row=stock.locator('.rst-stock-row').first();
 await row.getByRole('button',{name:'Ajouter une quantité'}).click();await stock.getByLabel('Combien avez-vous reçu ?').fill('12');await expect(stock.locator('output')).toContainText('36 bouteilles');await stock.getByRole('button',{name:'Enregistrer',exact:true}).click();await expect(row).toContainText('36 bouteilles');
 await row.getByRole('button',{name:'Retirer une quantité'}).click();await stock.getByLabel('Combien retirez-vous ?').fill('2');await expect(stock.locator('output')).toContainText('34 bouteilles');state.makeUncertain();await stock.getByRole('button',{name:'Enregistrer',exact:true}).click();await stock.getByRole('button',{name:'Réessayer la même opération'}).click();await expect(row).toContainText('34 bouteilles');expect(state.writes.at(-1)?.body).toEqual(state.writes.at(-2)?.body);
 await row.getByRole('button',{name:'Corriger ce qui reste'}).click();await stock.getByLabel('Après avoir compté, combien reste-t-il ?').fill('30');state.makeStale();await stock.getByRole('button',{name:'Enregistrer la correction'}).click();await expect(stock.locator('.rst-stock-notice')).toContainText('Le stock a changé');await expect(stock.getByLabel('Après avoir compté, combien reste-t-il ?')).toHaveValue('30');await stock.getByRole('button',{name:'Enregistrer la correction'}).click();await expect(row).toContainText('30 bouteilles');
 await row.getByRole('button',{name:'Voir les changements'}).click();await expect(stock.locator('.rst-stock-movement')).toHaveCount(3);expect(state.writes.filter(write=>write.path.endsWith('/movements')).at(-1)?.body.amount).toBe('30');
});

test('blank quantity stays blank; zero, decimals, optional warning and bounded pages',async({page})=>{
 const state=await fixture(page,'malewa',true);await page.goto('/en/shida/seller/restaurants');await managementNavigation(page,managementCopy.en.stock);const stock=page.locator('.rst-stock');
 await stock.getByRole('button',{name:'Add a product'}).click();await expect(stock.getByLabel('How much do you have now?')).toHaveValue('');await stock.getByLabel('What is it called?').fill('Rice');await stock.locator('.rst-stock-types select').selectOption('ingredient');await stock.getByLabel('How much do you have now?').fill('0.250');await stock.getByRole('switch').check();await stock.getByLabel('Warn me when there is…').fill('0.500');await expect(stock.getByText(/No message is sent/)).toBeVisible();await stock.getByRole('button',{name:'Add to my stock'}).click();await expect(stock.locator('.rst-stock-row')).toContainText('0.25 kg');expect(state.writes[0].body).toMatchObject({opening_quantity:'0.250',purpose:'ingredient',low_stock_threshold:'0.500'});
 for(let i=0;i<24;i++)state.stock.push(item(`RII_${i}`,`Water ${i}`,'packaged','bottle',0,null));await stock.getByRole('button',{name:'Refresh',exact:true}).click();await expect(stock.locator('.rst-stock-row')).toHaveCount(20);await stock.locator('.rst-stock-pagination').getByRole('button',{name:'Next'}).click();await expect(stock.locator('.rst-stock-row')).toHaveCount(5);await stock.getByRole('searchbox').fill('Rice');await expect(stock.locator('.rst-stock-row')).toHaveCount(1);await expect(stock.locator('.rst-stock-pagination')).toHaveCount(0);
});


test('stock touch navigation with enlarged text retains reachable controls',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});const page=await context.newPage();
 try{await fixture(page,'cafe');await page.goto('/fr/shida/seller/restaurants');await managementNavigation(page,managementCopy.fr.stock);
 await page.addStyleTag({content:'html {font-size:200% !important}'});const stock=page.locator('.rst-stock');await stock.getByRole('searchbox').fill('');
 await stock.locator('.rst-stock-head .button-primary').tap();await expect(stock.locator('.rst-stock-types select')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await stock.locator('.rst-stock-types select').selectOption('ingredient');await expect(stock.locator('.rst-stock-types select')).toHaveValue('ingredient');
 await stock.getByRole('button',{name:'Annuler',exact:true}).tap();await expect(stock.locator('.rst-stock-types select')).toHaveCount(0);
 }finally{await context.close();}
});
