import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RestaurantCounter } from '../app/components/shida/restaurant-counter';
import { orderRoutes, validOrderBody, validOrderQuery } from '../app/lib/restaurant-orders-contract';
import { workText } from '../app/lib/restaurant-work-copy';

describe('POS and Free counter contract',()=>{
 it('allows only exact counter operations and minimum read query',()=>{
  const allows=(p:string,m:string)=>orderRoutes.some(([pattern,methods])=>pattern.test(p)&&methods.includes(m));
  expect(allows('RST_one/pos','GET')).toBe(true);
  expect(allows('RST_one/pos/counter-baskets','POST')).toBe(true);
  expect(allows('RST_one/pos/counter-baskets/RBA_one/quote','POST')).toBe(true);
  expect(allows('RST_one/pos/counter-baskets/RBA_one/finalize','POST')).toBe(true);
  expect(allows('RST_one/pos/orders/ROD_one/destination','GET')).toBe(false);
  expect(validOrderQuery('RST_one/pos','GET',new URLSearchParams('language=ln'))).toBe(true);
  expect(validOrderQuery('RST_one/pos','GET',new URLSearchParams('customer_id=1'))).toBe(false);
 });
 it.each(['RST_one/counter-baskets/RBA_one','RST_one/pos/counter-baskets/RBA_one'])('accepts bounded optional preparation content at %s',path=>{
  const body={operation_key:'edit',expected_revision:1,selections:{standalone:[],plates:[]},fulfillment_method:'takeaway'};
  for(const food_preference of ['Sans piment','Mchuzi pembeni',null,''])expect(validOrderBody(path,{...body,food_preference})).toBe(true);
  expect(validOrderBody(path,{...body,food_preference:'x'.repeat(401)})).toBe(false);
  expect(validOrderBody(path,{...body,delivery_instruction:'private'})).toBe(false);
 });
 it.each(['fr','en','ln','sw'] as const)('renders paid and Free headings in %s',locale=>{
  const props={path:'personal/restaurants/RST_one',binding:'bound',locale,onFailure:()=>{}};
  expect(renderToStaticMarkup(<RestaurantCounter {...props} pos/>)).toContain(workText(locale,'pos'));
  expect(renderToStaticMarkup(<RestaurantCounter {...props}/>)).toContain(workText(locale,'counter'));
  expect(workText(locale,'preferenceHelp')).not.toBe('preferenceHelp');
 });
});
