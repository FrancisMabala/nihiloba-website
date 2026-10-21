import {soloCopy} from '../../app/lib/restaurant-solo-copy';
import { test, expect, type Page } from '@playwright/test';
import { managementNavigation } from './restaurant-management-navigation';
import { sellerDesignCopy } from '../../app/lib/restaurant-seller-design-copy';
import { personalMenuCopy } from '../../app/lib/restaurant-personal-menu-copy';
import { preparationCopy, soloPreparationCopy } from '../../app/lib/restaurant-preparation-copy';
import { restaurantText } from '../../app/lib/restaurant-seller-copy';
import { managementCopy } from '../../app/lib/restaurant-management-copy';

const stamp='2026-10-15T09:00:00+00:00';
async function seed(page:Page) {
 const category={public_ref:'RMC_1',name:'Plats',visible:true};
 const item={public_ref:'RMI_1',name:'Pondu',category,pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000.00',sale_unit_label:'portion',availability:'available',visible:true,presentation:'fixed_dish',permanent:true,image_url:null};
 const state={items:[item] as Array<typeof item>,routes:new Map<string,string|null>([['RMI_1','serve']]),publicOverride:new Map<string,string>(),failItems:false,writes:[] as Array<{path:string;body:Record<string,unknown>}>,revision:stamp};
 const bump=()=>{state.revision=new Date(Date.parse(state.revision)+1000).toISOString();};
 const establishment={public_ref:'RST_1',revision:stamp,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links','unpublish'],profile:{name:'Chez maman',food_business_type:'malewa',city:'Kinshasa',commune:'Limete',timezone_name:'Africa/Kinshasa'}};
 await page.route('**/api/**',async route=>{
  const request=route.request(),p=new URL(request.url()).pathname.replace(/\/$/,'');
  const body=request.postDataJSON?.() as Record<string,unknown>|undefined;
  const send=(json:unknown,status=200)=>route.fulfill({status,json});
  if(p.endsWith('/employment/session'))return send({user:{display_name:'Solo owner'},binding:'a'.repeat(64)});
  if(p.endsWith('/capabilities'))return send({capabilities:['restaurant.kitchen','restaurant.inventory','restaurant.pos'].map(capability=>({capability,available:true}))});
  if(p.endsWith('/order-feed'))return send({changed:[],removed:[],cursor:'cursor',as_of:stamp});
  if(p.endsWith('/order-configuration'))return send({intake_released:true});
  if(p.endsWith('/orders'))return send({items:[],total:0,as_of:stamp});
  if(p.endsWith('/pos'))return send({intake_released:true,items:state.items,recent:[]});
  if(p.endsWith('/inventory/bindings'))return send({bindings:[]});
  if(p.endsWith('/restaurant-menus/RST_1'))return send({items:state.items.filter(value=>value.visible&&value.category.visible).map(value=>({...value,availability:state.publicOverride.get(value.public_ref)??value.availability})),total:state.items.length,page:1,page_size:20,hours:{status:'unknown'}});
  if(p.endsWith('/menu/categories'))return send({revision:state.revision,currency:'CDF',result:{items:[category],total:1,page:1,page_size:50}});
  if(p.endsWith('/menu/offerings'))return send({revision:state.revision,currency:'CDF',result:{items:[],total:0,page:1,page_size:50}});
  if(p.endsWith('/menu/items') && request.method()==='POST') {
    if(body!.expected_updated_at!==state.revision)return send({detail:'restaurant_stale'},409);
    state.writes.push({path:p,body:body!});const fields=body!.fields as Record<string,unknown>;
    const created={...item,...fields,public_ref:'RMI_2',name:String(fields.name),category};
    state.items.push(created);state.routes.set('RMI_2',null);bump();
    return send({revision:state.revision,currency:'CDF',result:created});
  }
  const itemRef=p.match(/\/menu\/items\/(RMI_\d+)$/)?.[1];
  if(itemRef) {
    const current=state.items.find(value=>value.public_ref===itemRef);
    if(!current)return send({},404);
    if(request.method()==='PATCH'){if(body!.expected_updated_at!==state.revision)return send({detail:'restaurant_stale'},409);state.writes.push({path:p,body:body!});Object.assign(current,body!.fields);bump();return send({revision:state.revision,currency:'CDF',result:current});}
    return send({revision:state.revision,currency:'CDF',result:current});
  }
  if(p.endsWith('/menu/items'))return state.failItems?send({},503):send({revision:state.revision,currency:'CDF',result:{items:state.items,total:state.items.length,page:1,page_size:50}});
  const routeRef=p.match(/\/preparation-routing\/(RMI_\d+)$/)?.[1];
  if(routeRef && request.method()==='PUT'){if(body!.expected_updated_at!==state.revision)return send({detail:'restaurant_stale'},409);state.writes.push({path:p,body:body!});state.routes.set(routeRef,String(body!.station));bump();return send({item_ref:routeRef,station:body!.station,revision:state.revision});}
  if(p.endsWith('/preparation-routing'))return send({items:state.items.map(value=>({item_ref:value.public_ref,name:value.name,station:state.routes.get(value.public_ref)??null})),has_more:false,revision:state.revision});
  if(p.endsWith('/restaurants'))return send({items:[establishment],total:1,page:1,page_size:20,actions:['create']});
  if(p.endsWith('/RST_1'))return send(establishment);
  return send({},404);
 });
 return state;
}

for(const locale of ['fr','en','ln','sw'] as const)for(const width of [360,820,1440])test(`personal menu ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:width===360?800:900});
 await seed(page);
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/`);
 await managementNavigation(page,sellerDesignCopy[locale].menu);
 await expect(page.locator('.rst-personal-menu .rst-menu-row')).toHaveCount(1);
 await expect(page.locator('.rst-menu-status')).toContainText(soloPreparationCopy[locale].serve);
 await expect(page.locator('.rst-menu-filters')).toContainText(personalMenuCopy[locale].setup);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/seller-workspace/restaurant-personal-menu-after-${locale}-${width}.png`,fullPage:true});
 await page.locator('.rst-personal-menu .rst-menu-row').getByRole('button',{name:restaurantText(locale,'edit'),exact:true}).click();
 await expect(page.locator('.rst-editor .rst-item-routing')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.skip-link').evaluate(element=>{(element as HTMLElement).style.visibility='hidden';});
 await page.screenshot({path:`docs/evidence/seller-workspace/restaurant-personal-menu-edit-${locale}-${width}.png`,fullPage:true});
});

test('create unavailable, configure preparation, then change availability',async({page})=>{
 const state=await seed(page);
 await page.goto('/shida/seller/restaurants/');
 await managementNavigation(page,sellerDesignCopy.en.menu);
 await page.locator('.rst-personal-menu .rst-menu-heading').getByRole('button',{name:'+ '+personalMenuCopy.en.addItem,exact:true}).click();
 await page.locator('.rst-editor input[name="name"]').fill('Tea');
 await page.locator('.rst-editor input[name="pricing_model"]').first().check();
 await page.locator('.rst-editor input[name="sale_unit_label"]').fill('cup');
 await page.locator('.rst-editor input[name="unit_price"]').fill('2000');
 await page.locator('.rst-editor select').filter({has:page.locator('option[value="RMC_1"]')}).selectOption('RMC_1');
 await page.locator('.rst-editor').getByRole('button',{name:'Save',exact:false}).first().click();
 await expect(page.locator('.rst-editor')).toContainText('Tea');
 expect((state.writes.find(value=>value.path.endsWith('/menu/items'))?.body.fields as Record<string,unknown>).availability).toBe('temporarily_unavailable');
 const routing=page.locator('.rst-editor .rst-item-routing');
 await expect(routing.getByRole('button',{name:preparationCopy.en.kitchen,exact:true})).toHaveCount(0);
 await expect(routing.getByRole('button',{name:preparationCopy.en.bar,exact:true})).toHaveCount(0);
 await routing.getByRole('button',{name:soloCopy.en.single,exact:true}).click();
 await routing.getByRole('button',{name:preparationCopy.en.save}).click();
 await expect(routing.getByRole('button',{name:soloCopy.en.single,exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(routing.getByRole('button',{name:soloCopy.en.single,exact:true})).toBeEnabled();
 await page.locator('.rst-editor select').filter({has:page.locator('option[value="available"]')}).selectOption('available');
 await page.locator('.rst-editor').getByRole('button',{name:'Save',exact:false}).first().click();
 await expect(page.locator('.rst-personal-menu .rst-menu-row')).toHaveCount(2);
 expect(state.items.find(value=>value.public_ref==='RMI_2')?.availability).toBe('available');
 await page.locator('.rst-menu-filters select').selectOption('setup');
 await expect(page.locator('.rst-personal-menu .rst-menu-row')).toHaveCount(0);
});

test('item availability disables a new Selling selection',async({page})=>{
 const state=await seed(page);
 await page.goto('/shida/seller/restaurants/');
 await managementNavigation(page,sellerDesignCopy.en.menu);
 await page.locator('.rst-menu-row').getByRole('button',{name:'Edit',exact:true}).click();
 await page.locator('.rst-editor select').filter({has:page.locator('option[value="sold_out"]')}).selectOption('sold_out');
 await page.locator('.rst-editor').getByRole('button',{name:'Save',exact:false}).first().click();
 expect(state.items[0].availability).toBe('sold_out');
 await managementNavigation(page,managementCopy.en.selling);
 await expect(page.locator('.rst-selling-item').getByRole('button',{name:/Add/})).toBeDisabled();
});

test('public current availability overrides a managed available setting',async({page})=>{
 const state=await seed(page);state.publicOverride.set('RMI_1','sold_out');
 await page.goto('/shida/seller/restaurants/');
 await managementNavigation(page,sellerDesignCopy.en.menu);
 await expect(page.locator('.rst-menu-status')).toContainText(restaurantText('en','sold_out'));
 await page.locator('.rst-menu-filters select').selectOption('available');
 await expect(page.locator('.rst-personal-menu .rst-menu-row')).toHaveCount(0);
 await page.locator('.rst-menu-filters select').selectOption('unavailable');
 await expect(page.locator('.rst-personal-menu .rst-menu-row')).toHaveCount(1);
});

test('failed Menu read has an explicit recovery action',async({page})=>{
 const state=await seed(page);state.failItems=true;
 await page.goto('/shida/seller/restaurants/');
 await managementNavigation(page,sellerDesignCopy.en.menu);
 await expect(page.locator('.rst-personal-menu').getByRole('alert')).toContainText(personalMenuCopy.en.failed);
 state.failItems=false;
 await page.locator('.rst-personal-menu .rst-menu-heading').getByRole('button',{name:personalMenuCopy.en.refresh}).click();
 await expect(page.locator('.rst-personal-menu .rst-menu-row')).toHaveCount(1);
});
