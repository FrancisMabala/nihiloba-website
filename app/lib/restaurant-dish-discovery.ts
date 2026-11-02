import {getRestaurantDishes, type RestaurantLocale, type RestaurantSearch} from '../services/shida/restaurants-client';

export async function discoverRestaurantDishes(locale: RestaurantLocale, search: RestaurantSearch) {
 return {...await getRestaurantDishes(locale, search), failed: false};
}
