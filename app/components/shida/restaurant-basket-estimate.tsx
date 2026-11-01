import {menuLinesEstimate} from '../../lib/restaurant-menu-selection';
import {displayMoney} from '../../lib/restaurant-counter-values';
import type {GuestLine} from '../../lib/restaurant-guest-browser';
import type {RestaurantLocale,RestaurantMenuItem} from '../../services/shida/restaurants-client';
export function RestaurantBasketEstimate({lines,items,locale}:{lines:GuestLine[];items:RestaurantMenuItem[];locale:RestaurantLocale}){
 const estimate=menuLinesEstimate(lines,items);
 if(!estimate)return null;
 const label={en:'Estimated subtotal',fr:'Sous-total estimé',ln:'Motango ya mbongo mpo na sikoyo',sw:'Jumla ya makadirio'}[locale];
 return <p className="rst-food-subtotal"><span>{label}</span><strong>{displayMoney(estimate.amount,locale)} {estimate.currency}</strong></p>;
}
