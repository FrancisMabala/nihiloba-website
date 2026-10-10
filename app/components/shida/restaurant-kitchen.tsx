'use client';
import { RestaurantPreparation, RestaurantPreparationOwner } from './restaurant-preparation';
import type { PreparationAssignment, Station } from '../../lib/restaurant-preparation-contract';
export function RestaurantKitchen({ assignment, station='kitchen', ...props }: { path:string; binding:string; locale:'fr'|'en'|'ln'|'sw'; onFreeOrders?:()=>void; assignment?:PreparationAssignment; station?:Station }) {
 return assignment ? <RestaurantPreparation {...props} assignment={assignment} station={station}/> : <RestaurantPreparationOwner {...props}/>;
}
