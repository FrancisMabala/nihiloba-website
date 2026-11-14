import {test,expect,type Page} from '@playwright/test';
import {managementNavigation} from './restaurant-management-navigation';
import {sellerDesignCopy} from '../../app/lib/restaurant-seller-design-copy';
import {restaurantText} from '../../app/lib/restaurant-seller-copy';
import {managementCopy} from '../../app/lib/restaurant-management-copy';
import {specialsText} from '../../app/lib/restaurant-specials-copy';
import {menuText} from '../../app/lib/restaurant-menu-redesign-copy';
const stamp='2026-11-14T09:00:00Z';
async function seed(page:Page){
 const category={public_ref:'RMC_one',name:'Plats',visible:true};
 const item={public_ref:'RMI_one',name:'Pondu avec accompagnement et une très longue description du plat',category,pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000.00',sale_unit_label:'assiette',availability:'available',visible:true,presentation:'fixed_dish',permanent:true,image_url:null,preparation_station:'serve',enable_blocker:null,menu_state:'available'};
 const state={offers:[] as Record<string,unknown>[],failItems:false,revision:stamp,items:[item] as Record<string,unknown>[],lost:'',keys:new Map<string,unknown>(),writes:[] as {path:string;body:Record<string,unknown>}[],queries:[] as URLSearchParams[]};
 const bump=()=>state.revision=new Date(Date.parse(state.revision)+1000).toISOString();
 const parent=()=>({public_ref:'RST_menu',revision:state.revision,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links'],profile:{name:'Menu acceptance fixture',food_business_type:'malewa',city:'Kinshasa',commune:'Lemba',timezone_name:'Africa/Kinshasa'}});
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.replace(/\/$/,'');const send=(json:unknown,status=200)=>route.fulfill({status,json});
  if(p.endsWith('/employment/session'))return send({user:{display_name:'Fixture'},binding:'a'.repeat(64)});
  if(p.endsWith('/capabilities'))return send({capabilities:[{capability:'restaurant.inventory',available:true}]});
  if(p.endsWith('/order-feed'))return send({changed:[],removed:[],cursor:'fixture',as_of:stamp});
  if(p.endsWith('/order-configuration'))return send({intake_released:true});
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
  if(req.method()==='GET'&&p.endsWith('/menu/offerings'))return send({revision:state.revision,currency:'CDF',day_plan:{day:url.searchParams.get('day')||'2027-01-04',today:'2027-01-04',timezone_name:'Africa/Kinshasa',opening_known:true,opening_error:null,opening_periods:[{starts_at:'2027-01-04T11:00:00+01:00',ends_at:'2027-01-04T16:00:00+01:00'},{starts_at:'2027-01-04T18:00:00+01:00',ends_at:'2027-01-05T02:00:00+01:00'}]},evaluated_at:stamp,result:{items:state.offers,total:state.offers.length,page:1,page_size:20}});
  const offerRef=p.match(/\/menu\/offerings\/(RDO_\w+)$/)?.[1];
  if(req.method()==='GET'&&offerRef)return send({revision:state.revision,result:state.offers.find(r=>r.public_ref===offerRef)});
  if(req.method()!=='GET'){
   const body=req.postDataJSON();state.writes.push({path:p,body});if(state.keys.has(body.operation_key))return send(state.keys.get(body.operation_key));
   if(body.expected_updated_at!==state.revision)return send({detail:'restaurant_stale'},409);
   let result:unknown,stage='';bump();
   if(p.includes('/menu/offerings')){stage='offering';let row=state.offers.find(r=>r.public_ref===offerRef);if(!row){row={public_ref:'RDO_'+state.offers.length,item:state.items.find(r=>r.public_ref===body.fields.item_ref),confirmed_at:stamp,effective_state:'scheduled',visible:true,availability:'available'};state.offers.push(row);}Object.assign(row,body.fields);if(body.fields.confirm===false)row.confirmed_at=null;if(body.fields.availability)row.effective_state=body.fields.availability;result={revision:state.revision,result:row};}
   else if(p.endsWith('/menu-batches')){stage='item';const fields=body.rows[0].fields;const created={...item,...fields,public_ref:'RMI_created',preparation_station:null,category,menu_state:'hidden'};state.items.push(created);result={revision:state.revision,operation_outcome:{items:[{item_ref:'RMI_created'}]}};}
   else if(p.includes('/preparation-routing/')){stage='route';const row=state.items.find(row=>p.endsWith(String(row.public_ref)))!;row.preparation_station=body.station;result={revision:state.revision};}
   else if(ref){stage='enable';const row=state.items.find(row=>row.public_ref===ref)!;Object.assign(row,body.fields);row.menu_state=row.visible?row.availability==='available'?'available':'unavailable':'hidden';result={revision:state.revision,currency:'CDF',result:row};}
   else return send({},404);
   state.keys.set(body.operation_key,result);if(state.lost===stage){state.lost='';return route.abort();}return send(result);
  }
  return send({},404);
 });return state;
}

async function enter(page:Page,locale:'fr'|'en'|'ln'|'sw'='fr'){await page.goto(`/${locale}/shida/seller/restaurants`);await managementNavigation(page,sellerDesignCopy[locale].daily);await expect(page.locator('.rst-specials')).toBeVisible();}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,390,820,1440])test(`specials layout ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});await seed(page);await enter(page,locale);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'+ '+specialsText(locale,'add'),exact:true}).click();
 await expect(page.locator('.rst-specials form')).toBeVisible();
 await page.getByRole('combobox',{name:specialsText(locale,'dish'),exact:true}).selectOption('RMI_one');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr'&&[375,1440].includes(width))await page.screenshot({path:`C:/NIHILOBA/release-evidence/restaurant-seven-20261114/specials-form-${width}.png`,fullPage:true});
});
test('split day lost response replay and scoped sold out / removal',async({page})=>{
 const state=await seed(page);state.lost='offering';await enter(page);
 await page.getByRole('button',{name:'+ Ajouter un plat',exact:true}).click();
 await page.getByRole('combobox',{name:'Quel plat ?',exact:true}).selectOption('RMI_one');
 await page.getByRole('button',{name:'Ajouter aux plats du jour',exact:true}).click();
 await expect(page.getByRole('button',{name:restaurantText('fr','retry'),exact:true})).toBeVisible();
 await page.getByRole('button',{name:restaurantText('fr','retry'),exact:true}).click();
 await expect(page.locator('.rst-specials-list article')).toHaveCount(2);
 expect(state.offers).toHaveLength(2);expect(state.writes[0].body.operation_key).toBe(state.writes[1].body.operation_key);
 await page.getByRole('button',{name:'Indiquer comme épuisé',exact:true}).first().click();
 await expect(page.getByRole('button',{name:'Proposer à nouveau',exact:true})).toBeVisible();
 expect(state.items[0].availability).toBe('available');
 await page.getByRole('button',{name:'Retirer de ce jour',exact:true}).first().click();
 await page.getByRole('dialog').getByRole('button',{name:'Retirer de ce jour',exact:true}).click();
 await expect(page.getByText('Retiré de ce jour',{exact:true})).toBeVisible();expect(state.items).toHaveLength(1);
 await page.screenshot({path:'C:/NIHILOBA/release-evidence/restaurant-seven-20261114/specials-list-1440.png',fullPage:true});
});
test('explicit overnight and day inheritance',async({page})=>{
 const state=await seed(page);await enter(page);await page.getByRole('button',{name:'Demain',exact:true}).click();
 await page.getByRole('button',{name:'+ Ajouter un plat',exact:true}).click();
 await expect(page.getByLabel('Pour quel jour ?',{exact:true})).toHaveValue('2027-01-05');
 await page.getByRole('combobox',{name:'Quel plat ?',exact:true}).selectOption('RMI_one');
 await page.getByRole('radio',{name:'Choisir les heures',exact:true}).check();
 await page.getByLabel('De',{exact:true}).fill('18:00');await page.getByLabel('À',{exact:true}).fill('02:00');
 await page.getByRole('checkbox',{name:'Se termine le lendemain',exact:true}).check();
 await page.getByRole('button',{name:'Ajouter aux plats du jour',exact:true}).click();
 await expect(page.locator('.rst-specials-list article')).toHaveCount(1);
 expect(state.offers[0].ends_at).toBe('2027-01-06T02:00');
});

test('new menu dish returns to the preserved scheduling form',async({page})=>{
 const state=await seed(page);await enter(page);await page.getByRole('button',{name:'+ Ajouter un plat',exact:true}).click();
 await page.getByRole('radio',{name:'Choisir les heures',exact:true}).check();await page.getByLabel('De',{exact:true}).fill('12:00');await page.getByLabel('À',{exact:true}).fill('15:00');
 await page.getByRole('button',{name:'+ Ajouter un nouveau plat',exact:true}).click();const form=page.locator('.rst-menu-form');
 await form.getByLabel('Nom',{exact:true}).fill('Eau');await form.getByRole('combobox',{name:'Catégorie',exact:true}).selectOption('RMC_one');await form.getByLabel('Prix',{exact:true}).fill('1000');await form.getByLabel('Pour quelle quantité ?',{exact:true}).fill('bouteille');await form.getByLabel('Prêt à servir',{exact:true}).check();await form.getByRole('button',{name:menuText('fr','publish'),exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Quel plat ?',exact:true})).toHaveValue('RMI_created');await expect(page.getByLabel('De',{exact:true})).toHaveValue('12:00');await expect(page.getByLabel('À',{exact:true})).toHaveValue('15:00');
 await page.getByRole('button',{name:'Ajouter aux plats du jour',exact:true}).click();await expect(page.locator('.rst-specials-list article')).toHaveCount(1);expect(state.offers[0].item_ref).toBe('RMI_created');
});
