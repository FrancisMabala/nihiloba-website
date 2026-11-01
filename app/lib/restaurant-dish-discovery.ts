import {getRestaurants,getRestaurantMenu,getRestaurantDishMatches,type RestaurantLocale,type RestaurantSearch} from '../services/shida/restaurants-client';

/** Bounded previews, not a second global menu catalogue. Each item retains its parent. */
export async function discoverRestaurantDishes(locale:RestaurantLocale,search:RestaurantSearch){
 const params={...search,page:search.dish_page??'1'};
 const term=Array.isArray(search.dish)?search.dish[0]:search.dish;
 const query=Array.isArray(search.query)?search.query[0]:search.query;
 if(term||query){
  const result=await getRestaurantDishMatches(locale,{...params,query:undefined,dish:term||query});
  return {...result,failed:false,items:result.items.flatMap(({establishment,items})=>items.map(item=>({establishment,item})))};
 }
 const parents=await getRestaurants(locale,params,4);
 const menus=await Promise.allSettled(parents.items.map(parent=>getRestaurantMenu(locale,parent.public_ref,'1',3)));
 return {...parents,failed:menus.some(result=>result.status==='rejected'),items:menus.flatMap((result,index)=>result.status==='fulfilled'?result.value.items.map(item=>({establishment:parents.items[index],item})):[])};
}
