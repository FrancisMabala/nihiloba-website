import {test,expect,type Page} from '@playwright/test';
import {managementNavigation} from './restaurant-management-navigation';
import {sellerDesignCopy} from '../../app/lib/restaurant-seller-design-copy';
import {restaurantText} from '../../app/lib/restaurant-seller-copy';
import {managementCopy} from '../../app/lib/restaurant-management-copy';
import {menuText} from '../../app/lib/restaurant-menu-redesign-copy';
const stamp='2026-11-14T09:00:00Z';
async function seed(page:Page){
 const category={public_ref:'RMC_one',name:'Plats',visible:true};
 const item={public_ref:'RMI_one',name:'Pondu avec accompagnement et une très longue description du plat',category,pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000.00',sale_unit_label:'assiette',availability:'available',visible:true,presentation:'fixed_dish',permanent:true,image_url:null,preparation_station:'serve',enable_blocker:null,menu_state:'available'};
 const state={failItems:false,revision:stamp,items:[item] as Record<string,unknown>[],lost:'',keys:new Map<string,unknown>(),writes:[] as {path:string;body:Record<string,unknown>}[],queries:[] as URLSearchParams[],routingQueries:[] as string[]};
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
  if(req.method()==='GET'&&p.endsWith('/preparation-routing')){
   state.routingQueries.push(url.search);
   if(url.search!=='?page=1')return send({detail:'restaurant_invalid_input'},422);
   return send({items:state.items.map(row=>({item_ref:row.public_ref,station:row.preparation_station})),has_more:false,revision:state.revision});
  }
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
async function enter(page:Page,locale:'fr'|'en'|'ln'|'sw'='fr'){await page.goto(`/${locale}/shida/seller/restaurants`);await managementNavigation(page,sellerDesignCopy[locale].menu);await expect(page.locator('.rst-menu-card')).toHaveCount(1);}
for(const locale of ['fr','en','ln','sw'] as const)test(`Menu bootstrap keeps preparation routing locale-free ${locale}`,async({page,baseURL})=>{
 if(!baseURL)throw new Error('Menu regression requires an isolated loopback baseURL.');
 const target=new URL(baseURL);
 if(!['http:','https:'].includes(target.protocol)||!['127.0.0.1','localhost','[::1]'].includes(target.hostname)||target.username||target.password)throw new Error('Menu regression requires an isolated loopback target.');
 await page.context().route('**/*',route=>new URL(route.request().url()).origin===target.origin?route.continue():route.abort('blockedbyclient'));
 const state=await seed(page),prefix=locale==='en'?'':`/${locale}`;
 for(const width of [390,1440]){
  state.routingQueries.length=0;
  await page.setViewportSize({width,height:900});
  await page.goto(`${prefix}/shida/seller/restaurants/?establishment=RST_menu&tab=items`);
  await expect.poll(()=>state.routingQueries.length).toBeGreaterThan(0);
  await expect(page.locator('.rst-menu-card')).toHaveCount(1);
  expect(state.routingQueries.every(query=>query==='?page=1')).toBe(true);
  await expect(page.locator('.rst-menu-card')).toContainText(String(state.items[0].name));
  expect(state.writes).toHaveLength(0);
 }
});
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,390,820,1440])test(`menu layout ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});await seed(page);await enter(page,locale);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr'&&[375,1440].includes(width))await page.screenshot({path:`C:/NIHILOBA/release-evidence/restaurant-seven-20261114/menu-${width}.png`,fullPage:true});
 await page.locator('.rst-menu-actions .button-primary').click();await expect(page.locator('.rst-menu-form')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr'&&[375,1440].includes(width))await page.screenshot({path:`C:/NIHILOBA/release-evidence/restaurant-seven-20261114/menu-create-${width}.png`,fullPage:true});
 await expect(page.getByRole('button',{name:menuText(locale,'publish'),exact:true})).toBeVisible();
});
for(const lost of ['item','route','enable'])test(`create and recover lost ${lost} response without duplication`,async({page})=>{
 const state=await seed(page);state.lost=lost;await enter(page);
 await page.locator('.rst-menu-actions .button-primary').click();const form=page.locator('.rst-menu-form');
 await form.getByLabel('Nom',{exact:true}).fill('Eau');await form.getByRole('combobox',{name:'Catégorie',exact:true}).selectOption('RMC_one');await form.getByLabel('Prix',{exact:true}).fill('1000');await form.getByLabel('Pour quelle quantité ?',{exact:true}).fill('bouteille');
 await form.getByLabel('Prêt à servir',{exact:true}).check();await form.getByRole('button',{name:menuText('fr','publish'),exact:true}).click();
 await expect(form.getByRole('button',{name:menuText('fr','retry'),exact:true})).toBeEnabled();await form.getByRole('button',{name:menuText('fr','retry'),exact:true}).click();
 await expect(page.locator('.rst-menu-form')).toHaveCount(0);expect(state.items.filter(row=>row.name==='Eau')).toHaveLength(1);expect(state.items[1]).toMatchObject({availability:'available',visible:true,preparation_station:'serve'});
 const writes=state.writes.filter(w=>lost==='item'?w.path.endsWith('/menu-batches'):lost==='route'?w.path.includes('/preparation-routing/'):w.path.includes('/menu/items/'));
 expect(writes).toHaveLength(2);expect(writes[0].body).toEqual(writes[1].body);
});
test('save hidden, server filters, validation retains form and pagination',async({page})=>{
 const state=await seed(page);await enter(page);await page.locator('.rst-menu-actions .button-primary').click();const form=page.locator('.rst-menu-form');
 await form.getByLabel('Nom',{exact:true}).fill('Tea');await form.getByRole('combobox',{name:'Catégorie',exact:true}).selectOption('RMC_one');await form.getByLabel('Prix',{exact:true}).fill('invalid');await form.getByLabel('Pour quelle quantité ?',{exact:true}).fill('cup');
 await form.getByRole('button',{name:menuText('fr','later'),exact:true}).click();await expect(form.getByLabel('Prix',{exact:true})).toBeEnabled();expect(state.writes).toHaveLength(0);
 await form.getByLabel('Prix',{exact:true}).fill('2000');await form.getByRole('button',{name:menuText('fr','later'),exact:true}).click();await expect(page.locator('.rst-menu-form')).toHaveCount(0);expect(state.items[1]).toMatchObject({visible:false,availability:'temporarily_unavailable'});
 await page.locator('.rst-menu-filter-panel summary').click();await page.locator('.rst-menu-filters select').selectOption('hidden');await expect(page.locator('.rst-menu-card')).toHaveCount(1);expect(state.queries.at(-1)?.get('menu_state')).toBe('hidden');
 await page.locator('.rst-menu-filters input').fill('Tea');await expect.poll(()=>state.queries.at(-1)?.get('search')).toBe('Tea');
});

test('unknown refresh state can recover without claiming availability',async({page})=>{
 const state=await seed(page);await enter(page);state.failItems=true;await page.locator('.rst-menu-options summary').click();await page.locator('.rst-menu-actions').getByRole('button').last().click();await expect(page.locator('.rst-menu-workspace [role=alert]')).toBeVisible();await expect(page.locator('.rst-menu-badge')).toHaveText(menuText('fr','unknown'));state.failItems=false;await page.locator('.rst-menu-actions').getByRole('button').last().click();await expect(page.locator('.rst-menu-badge')).toHaveText(menuText('fr','available'));
});
test('stock restriction is displayed and prevents enabling',async({page})=>{
 const state=await seed(page);state.items[0].menu_state='sold_out';state.items[0].enable_blocker='sold_out';state.items[0].availability='temporarily_unavailable';await enter(page);await expect(page.locator('.rst-menu-badge')).toHaveText(menuText('fr','unavailable'));await expect(page.getByRole('switch',{name:/Disponibilité/})).toBeDisabled();
});
test('availability edit is retained by the POS selection',async({page})=>{
 const state=await seed(page);await enter(page);await page.locator('.rst-menu-card').getByRole('button',{name:'Modifier',exact:true}).click();const form=page.locator('.rst-menu-form');await form.locator('summary').click();await form.getByRole('combobox',{name:'Disponibilité',exact:true}).selectOption('sold_out');await form.getByRole('button',{name:restaurantText('fr','save'),exact:true}).click();await expect(form).toHaveCount(0);expect(state.items[0].availability).toBe('sold_out');await managementNavigation(page,managementCopy.fr.selling);await expect(page.locator('.rst-selling-item button')).toBeDisabled();
});
