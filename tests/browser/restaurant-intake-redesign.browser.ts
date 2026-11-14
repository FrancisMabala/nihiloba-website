import {test,expect,type Page} from '@playwright/test';
import {managementNavigation} from './restaurant-management-navigation';
import {sellerDesignCopy} from '../../app/lib/restaurant-seller-design-copy';
import {restaurantText} from '../../app/lib/restaurant-seller-copy';
import {managementCopy} from '../../app/lib/restaurant-management-copy';
import {workText} from '../../app/lib/restaurant-work-copy';
import {intakeDesignText} from '../../app/lib/restaurant-intake-design-copy';
import {menuText} from '../../app/lib/restaurant-menu-redesign-copy';
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
  if(p.endsWith('/capabilities'))return send({capabilities:[{capability:'restaurant.inventory',available:true}]});
  if(p.endsWith('/order-feed'))return send({changed:[],removed:[],cursor:'fixture',as_of:stamp});
  const schedule={revision:1,timezone_name:'Africa/Kinshasa',weekly_periods:[{weekday:5,start:'11:00',end:'20:00'}],minimum_lead_minutes:15,cutoff_minutes:15,allow_tomorrow:true};
  if(p.endsWith('/order-configuration')){if(state.failConfig)return route.abort();const pickup={available:state.pickup&&!state.blocked,reasons:state.blocked?[state.blocked]:state.pickup?[]:['paused']};const delivery={available:false,reasons:['paused','windows']};return send({revision:state.revision,intake_released:true,schedules:{pickup:schedule,delivery:null},hours:{schedule:{windows:[{weekday:5,start:'11:00',end:'20:00'}]},exceptional_closures:[]},receiving:{evaluated_at:stamp,timezone:'Africa/Kinshasa',hours:'open',in_person:{available:true,reasons:[]},pickup:{web:pickup,whatsapp:pickup,activation_blockers:[]},delivery:{web:delivery,whatsapp:delivery,activation_blockers:[]}},pickup:{enabled:state.pickup,windows:[]},delivery:null});}
  if(p.endsWith('/guest-auto-accept')&&req.method()==='GET')return send({enabled:state.qr,revision:state.qrRevision});
  if(req.method()==='PUT'&&p.endsWith('/guest-auto-accept')){const body=req.postDataJSON();state.qr=body.enabled;state.qrRevision++;return send({enabled:state.qr,revision:state.qrRevision});}
  if(req.method()==='PUT'&&p.endsWith('/pickup-intake')){const body=req.postDataJSON();state.writes.push({path:p,body});if(state.keys.has(body.operation_key))return send(state.keys.get(body.operation_key));if(state.staleIntake){state.staleIntake=false;bump();return send({detail:'restaurant_stale'},409);}state.pickup=body.enabled;bump();const result={enabled:state.pickup};state.keys.set(body.operation_key,result);if(state.lostIntake){state.lostIntake=false;return route.abort();}return send(result);}

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

async function enter(page:Page,locale:'fr'|'en'|'ln'|'sw'='fr'){await page.goto(`/${locale}/shida/seller/restaurants`);await managementNavigation(page,workText(locale,'intake'));await expect(page.locator('.rst-intake-redesign')).toBeVisible();}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,390,820,1440])test(`intake layout ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await seed(page);await enter(page,locale);await expect(page.locator('[data-service=pickup] .rst-intake-badge')).toHaveText(intakeDesignText(locale,'ready'));
 await expect(page.locator('[data-service=delivery] .rst-intake-badge')).toHaveText(intakeDesignText(locale,'setup'));
 await expect(page.getByRole('radio',{name:new RegExp(intakeDesignText(locale,'manual'))})).toBeChecked();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr'&&[375,1440].includes(width))await page.screenshot({path:`C:/NIHILOBA/release-evidence/restaurant-seven-20261114/intake-${width}.png`,fullPage:true});
});
test('independent pickup pause, retry, resume, closure and failed verification',async({page})=>{
 const s=await seed(page);await enter(page);s.lostIntake=true;await page.getByRole('button',{name:'Mettre en pause',exact:true}).click();
 await expect(page.getByRole('button',{name:'Réessayer la demande initiale',exact:true})).toBeVisible();await page.getByRole('button',{name:'Réessayer la demande initiale',exact:true}).click();
 await expect(page.locator('[data-service=pickup] .rst-intake-badge')).toHaveText('En pause');expect(s.writes[0].body).toEqual(s.writes[1].body);expect(s.delivery).toBe(false);expect(Object.keys(s.writes[0].body.schedule as object)).not.toContain('revision');
 await page.getByRole('button',{name:'Reprendre les commandes',exact:true}).click();await expect(page.locator('[data-service=pickup] .rst-intake-badge')).toHaveText('Commandes ouvertes');
 s.blocked='closure';await page.locator('.rst-intake-refresh button').click();await expect(page.locator('[data-service=pickup] .rst-intake-badge')).toHaveText('Fermé pour le moment');
 const time=await page.locator('.rst-intake-refresh small').innerText();s.failConfig=true;await page.locator('.rst-intake-refresh button').click();await expect(page.locator('[data-service=pickup] .rst-intake-badge')).toHaveText('Impossible de vérifier');await expect(page.locator('.rst-intake-refresh small')).toHaveText(time);
});
test('QR choice commits only after confirmation and does not open delivery',async({page})=>{
 const s=await seed(page);await enter(page);await page.getByRole('radio',{name:'Accepter automatiquement',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();expect(s.qr).toBe(false);await page.getByRole('dialog').getByRole('button',{name:'Activer',exact:true}).click();await expect(page.getByRole('radio',{name:/Accepter automatiquement/})).toBeChecked();expect(s.delivery).toBe(false);
});

test('stale pause requires refreshed review, hours editor preserves weekly terms',async({page})=>{
 const s=await seed(page);await enter(page);s.staleIntake=true;await page.getByRole('button',{name:'Mettre en pause',exact:true}).click();await expect(page.getByText("Les paramètres de l'établissement ont changé.",{exact:false})).toBeVisible();await page.locator('.rst-intake-refresh button').click();await page.getByRole('button',{name:'Mettre en pause',exact:true}).click();await expect(page.locator('[data-service=pickup] .rst-intake-badge')).toHaveText('En pause');
 await page.getByRole('button',{name:'Modifier les horaires',exact:true}).click();await expect(page.locator('.rst-intake-editor')).toBeVisible();await expect(page.locator('.rst-intake-editor input[type=time]').first()).toHaveValue('11:00');
});
