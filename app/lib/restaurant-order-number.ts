import type {RestaurantLocale} from '../services/shida/restaurants-client';
export type NumberedOrder={order_ref:string;order_number?:number|null;order_local_date?:string|null;order_timezone?:string|null};
export function restaurantOrderLabel(order:NumberedOrder,locale:RestaurantLocale){
 const number=order.order_number;
 if(!Number.isSafeInteger(number)||!number||number<1)return order.order_ref;
 const prefix={fr:'Commande n°',en:'Order no.',ln:'Komande n°',sw:'Agizo namba'}[locale];
 return `${prefix} ${String(number).padStart(3,'0')}`;
}
