import {type Page} from '@playwright/test';
const revision='2026-11-14T08:00:00Z';
export async function fixture(page:Page,ordersMode=false){
 const state={moneyFailure:0,readyFailure:false,writes:0,feedFailure:false,stamp:revision,delay:0,empty:false};
 const orders=Array.from({length:25},(_,i)=>({order_ref:`ROD_${1042-i}`,state:i===24?'completed':i===0?'accepted':i%2?'preparing':'ready',entry_source:i%2?'counter':'customer',channel:i%2?'counter':'web',revision:1,submitted_at:revision,fulfillment_method:i%2?'on_premise':'pickup',order_total:'15000.00',currency:'CDF',receipt_terms:{standalone:[{key:'one',name:'Poulet braisé avec accompagnement',quantity:1,subtotal:'15000.00'}],plates:[],food_subtotal:'15000.00',order_total:'15000.00',currency:'CDF'},pickup_verification:{required:true,method:'pending',locked:false}}));
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:3000'?route.continue():route.abort());
 const restaurant={public_ref:'RST_test',revision,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links','unpublish'],profile:{name:'Malewa Nzambe — cuisine de Lemba et spécialités familiales',food_business_type:'malewa',city:'Kinshasa',commune:'Lemba',timezone_name:'Africa/Kinshasa',service_modes:'eat_there,takeaway',establishment_photo_url:null}};
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');
  if(path.endsWith('/employment/session'))return route.fulfill({json:{user:{display_name:'Restaurant fixture'},binding:'a'.repeat(64)}});
  if(path.endsWith('/capabilities'))return route.fulfill({json:{capabilities:['restaurant.kitchen','restaurant.inventory','restaurant.pos','restaurant.reservations'].map(capability=>({capability,available:true}))}});
  if(path.endsWith('/restaurants'))return route.fulfill({json:{items:[restaurant],total:1,page:1,page_size:20,actions:['create']}});
  if(path.endsWith('/RST_test'))return route.fulfill({json:restaurant});
  if(path.endsWith('/order-configuration'))return route.fulfill({json:{intake_released:true}});
  if(path.endsWith('/daily/summary'))return route.fulfill({status:state.moneyFailure||200,json:state.moneyFailure?{}:{time_zone:'Africa/Kinshasa',as_of:revision,currencies:{CDF:{recorded_net:'185000.00',balance_due:'30000.00'},USD:{recorded_net:'25.00',balance_due:'0.00'}}}});
  if(ordersMode&&path.endsWith('/order-feed'))return new Promise(resolve=>setTimeout(resolve,state.delay)).then(()=>route.fulfill({status:state.feedFailure?503:200,json:{changed:[],removed:[],cursor:'cursor',as_of:state.stamp}}));
  if(ordersMode&&path.includes('/orders/')){const ref=path.split('/orders/')[1].split('/')[0],order=orders.find(order=>order.order_ref===ref);if(order&&route.request().method()==='POST'){state.writes++;order.state=path.endsWith('/accept')?'accepted':'ready';order.revision++;return route.fulfill({json:{current_order:order}});}return route.fulfill({status:order?200:404,json:order??{}});}
  if(ordersMode&&path.endsWith('/orders')){const states=url.searchParams.getAll('states'),search=url.searchParams.get('search'),origin=url.searchParams.get('origin'),fulfillment=url.searchParams.get('fulfillment');const rows=(state.empty?[]:orders).filter(order=>(!states.length||states.includes(order.state))&&(!search||order.order_ref.includes(search))&&(!origin||order.entry_source===(origin==='online'?'customer':origin))&&(!fulfillment||order.fulfillment_method===(fulfillment==='takeaway'?'pickup':'on_premise')));const pageNo=Number(url.searchParams.get('page')??1),size=Number(url.searchParams.get('page_size')??20);return route.fulfill({json:{items:rows.slice((pageNo-1)*size,pageNo*size),total:rows.length,as_of:revision}});}
  if(path.endsWith('/orders')){const statuses=url.searchParams.getAll('states'),status=statuses[0];if(status==='ready'&&state.readyFailure)return route.fulfill({status:503,json:{}});return route.fulfill({json:{items:status==='pending'||status==='ready'?[{order_ref:status==='pending'?'ROD_1042':'ROD_1038',state:status,submitted_at:revision,fulfillment_method:status==='pending'?'takeaway':'delivery'}]:[],total:status==='pending'?3:status==='ready'?2:4,as_of:revision}});}
  if(path.endsWith('/inventory'))return route.fulfill({json:{items:[{item_ref:'INV_1',name:'Poulet braisé',low_stock:true},{item_ref:'INV_2',name:'Boissons fraîches',low_stock:true}],total:2}});
  if(path.endsWith('/reservations/pending'))return route.fulfill({json:{items:[{reservation_ref:'RSR_1',state:'pending',starts_at:revision,party_size:4}],has_more:true}});
  if(path.endsWith('/reservations/calendar')||path.endsWith('/service/groups'))return route.fulfill({json:{items:[],has_more:false}});
  return route.fulfill({status:404,json:{}});
 });return Object.assign(state,{orders});
}
