import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RestaurantKitchen } from '../app/components/shida/restaurant-kitchen';
import { allowedSellerRoute, validSellerBody, validSellerQuery } from '../app/lib/restaurant-seller-contract';

describe('Personal Kitchen surface contract',()=>{
 it('allows only narrow Kitchen reads and start/ready writes',()=>{
  expect(allowedSellerRoute('RST_one/kitchen/orders','GET')).toBe(true);
  expect(allowedSellerRoute('RST_one/kitchen/feed','GET')).toBe(true);
  expect(allowedSellerRoute('RST_one/kitchen/orders/RORD_one/actions/start','POST')).toBe(true);
  expect(allowedSellerRoute('RST_one/kitchen/orders/RORD_one/actions/accept','POST')).toBe(false);
  expect(validSellerQuery('RST_one/kitchen/orders','GET',new URLSearchParams('page=1&page_size=20&completed=false'))).toBe(true);
  expect(validSellerQuery('RST_one/kitchen/feed','GET',new URLSearchParams('states=pending'))).toBe(false);
  expect(validSellerBody('RST_one/kitchen/orders/RORD_one/actions/start','POST',{expected_revision:2,operation_key:'one'})).toBe(true);
  expect(validSellerBody('RST_one/kitchen/orders/RORD_one/actions/start','POST',{expected_revision:2,operation_key:'one',customer_phone:'private'})).toBe(false);
 });
 it.each([['fr','Cuisine'],['en','Kitchen'],['ln','Kizini'],['sw','Jikoni']] as const)('renders %s copy', (locale,title)=>{
  const html=renderToStaticMarkup(<RestaurantKitchen path="personal/restaurants/RST_one" binding="bound" locale={locale} onFreeOrders={()=>{}}/>);
  expect(html).toContain(title);
  expect(html).not.toContain('customer_phone');
 });
});
