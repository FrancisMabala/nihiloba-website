import {cents,decimal} from './restaurant-counter-values';
import type {RestaurantMenuItem} from '../services/shida/restaurants-client';
import type {GuestLine} from './restaurant-guest-browser';
/** A browsing estimate, never a quote. Missing menu pages and mixed currencies are not summed. */
export function menuLinesEstimate(lines:GuestLine[],items:RestaurantMenuItem[]):{amount:string;currency:string}|null{
 if(!lines.length)return null;
 const menu=new Map(items.map(item=>[item.public_ref,item]));let total=BigInt(0),currency:string|null=null;
 for(const line of lines){
  const item=menu.get(line.item_ref);
  if(!item||!item.currency||item.availability!=='available'||(currency&&currency!==item.currency))return null;
  currency=item.currency;
  if(item.pricing_model==='UNIT_PRICED'){
   const unit=cents(item.unit_price??'');
   if(unit===null||!Number.isSafeInteger(line.quantity)||line.quantity!<1||line.quantity!>1000)return null;
   total+=unit*BigInt(line.quantity!);
  }else if(item.pricing_model==='AMOUNT_PRICED'){
   const amount=menuAmountInput(item,line.selected_amount??'');if(amount===null)return null;total+=cents(amount)!;
  }else return null;
 }
 return currency?{amount:decimal(total),currency}:null;
}
/** Form validation only. The server quote and submission recalculate every price. */
export function menuAmountInput(item:RestaurantMenuItem,value:string):string|null{
 const amount=cents(value),minimum=cents(item.minimum_amount??'');
 if(amount===null||amount<=BigInt(0)||(minimum!==null&&amount<minimum))return null;
 if(item.amount_mode==='flexible'){
  if(minimum===null)return null;
  const step=item.amount_step===null?null:cents(item.amount_step);
  if(item.amount_step!==null&&(step===null||step<=BigInt(0)||(amount-minimum)%step!==BigInt(0)))return null;
 }else if(!item.allowed_amounts.some(candidate=>cents(candidate)===amount))return null;
 return decimal(amount);
}
