import {type Page} from '@playwright/test';
const revision='2026-10-13T08:00:00+00:00';
export async function restaurantFixture(page:Page,count=1,advanced=true) {
 await page.route('**/*',route=>new URL(route.request().url()).origin===(process.env.ROLLOUT_BASE_URL??'http://127.0.0.1:3017')?route.continue():route.abort());
 const state={logout:false,station:'kitchen',routingWrites:0};
 const establishments=Array.from({length:count},(_,i)=>({public_ref:`RST_${i}`,revision,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links','unpublish'],profile:{name:i===0?'Chez maman — Restaurant & Malewa de la commune de Limete':`Restaurant ${i+1}`,food_business_type:'malewa',city:'Kinshasa',commune:'Limete',timezone_name:'Africa/Kinshasa',establishment_photo_url:null}}));
 await page.route('**/api/**',route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(p.endsWith('/employment/logout')){state.logout=true;return route.fulfill({json:{}});}
  if(p.endsWith('/employment/session'))return route.fulfill({status:state.logout?401:200,json:{user:{display_name:'Francis Mabala'},binding:'a'.repeat(64)}});
  if(p.endsWith('/capabilities'))return route.fulfill({json:{capabilities:(advanced?['restaurant.kitchen','restaurant.inventory','restaurant.pos']:[]).map(capability=>({capability,available:true}))}});
  if(p.endsWith('/order-feed'))return route.fulfill({json:{changed:[],removed:[],cursor:'cursor',as_of:revision}});
  if(p.endsWith('/order-configuration'))return route.fulfill({json:{intake_released:true}});
  if(p.endsWith('/service/groups')||p.endsWith('/reservations/pending')||p.endsWith('/reservations/calendar')||p.endsWith('/inventory'))return route.fulfill({json:{items:[],total:0,has_more:false}});
  if(p.includes('/service/daily/days/')&&p.endsWith('/preview'))return route.fulfill({json:{bill_summary:{CDF:{recorded_collections:'42000',order_value:'50000'},USD:{recorded_collections:'12',order_value:'12'}},outstanding:{CDF:{balance_due:'8000'},USD:{balance_due:'0'}}}});
  if(p.endsWith('/orders'))return route.fulfill({json:{items:[],total:0,as_of:revision}});
  if(p.endsWith('/menu/items'))return route.fulfill({json:{revision,currency:'CDF',result:{items:[{public_ref:'RMI_1',name:'Pondu, poisson et accompagnement au choix',image_url:null,pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000',sale_unit_label:'assiette',availability:'available'}],total:1,page:1,page_size:20}}});
  if(p.endsWith('/menu/categories'))return route.fulfill({json:{revision,currency:'CDF',result:{items:[{public_ref:'RMC_1',name:'Plats',visible:true}],total:1,page:1,page_size:50}}});
  if(p.endsWith('/menu/offerings'))return route.fulfill({json:{revision,currency:'CDF',result:{items:[],total:0,page:1,page_size:50}}});
  if(p.endsWith('/inventory/bindings'))return route.fulfill({json:{bindings:[]}});
  if(p.endsWith('/restaurant-menus/RST_0'))return route.fulfill({json:{items:[{public_ref:'RMI_1',availability:'available'}],total:1,page:1,page_size:20}});
  if(p.endsWith('/preparation-routing/RMI_1')&&route.request().method()==='PUT'){state.station=String(route.request().postDataJSON().station);state.routingWrites++;return route.fulfill({json:{station:state.station,revision}});}
  if(p.endsWith('/preparation-routing'))return route.fulfill({json:{items:[{item_ref:'RMI_1',name:'Pondu, poisson et accompagnement au choix',station:state.station}],has_more:false,revision}});
  if(p.endsWith('/menu/items/RMI_1'))return route.fulfill({json:{revision,currency:'CDF',result:{public_ref:'RMI_1',name:'Pondu',image_url:null,category:{public_ref:'RMC_1',name:'Plats',visible:true},pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000',sale_unit_label:'assiette',availability:'available',presentation:'fixed_dish'}}});
  if(p.endsWith('/restaurants'))return route.fulfill({json:{items:establishments,total:count,page:1,page_size:20,actions:['create']}});
  const selected=establishments.find(row=>p.endsWith('/'+row.public_ref));
  return route.fulfill({status:selected?200:404,json:selected??{}});
 });return state;
}
