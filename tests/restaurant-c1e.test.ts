import { describe,it,expect } from 'vitest';
import { allowedSellerRoute,validSellerBody,validSellerQuery } from '../app/lib/restaurant-seller-contract';
import { localCandidates } from '../app/components/shida/restaurant-local-time';
import { actionsFor, type Order } from '../app/lib/restaurant-work';
describe('C1-E bounded Personal contracts',()=>{
 it('permits exact routes and repeated states while rejecting authority injection',()=>{
  expect(allowedSellerRoute('RST_a/orders/ROR_a/actions/accept','POST')).toBe(true);
  expect(allowedSellerRoute('RST_a/orders/ROR_a/actions/paid','POST')).toBe(false);
  expect(validSellerQuery('RST_a/order-feed','GET',new URLSearchParams('states=pending&states=ready&limit=50'))).toBe(true);
  for(const q of ['limit=51','cursor=x&cursor=y','states=paid','account_id=4','page=2'])expect(validSellerQuery('RST_a/order-feed','GET',new URLSearchParams(q))).toBe(false);
 });
 it('keeps batch keys/revisions exact and validates every nested field',()=>{
  const body={operation_key:'x'.repeat(120),expected_updated_at:'2026-09-11T12:00:00.123456+00:00',category_name:'Food',rows:[{key:'a',fields:{name:'Fufu',pricing_model:'UNIT_PRICED',presentation:'component',unit_price:'9007199254740991.25',currency:'CDF',sale_unit_label:'bowl'}}]};
  expect(validSellerBody('RST_a/menu-batches','POST',body)).toBe(true);
  expect(validSellerBody('RST_a/menu-batches','POST',{...body,operation_key:'x'.repeat(121)})).toBe(false);
  for(const fields of [{category_ref:'RMC_a'},{unit_price:1.5},{visible:'true'},{actor_id:3},{allowed_amounts:['1e3']}])expect(validSellerBody('RST_a/menu-batches','POST',{...body,rows:[{key:'a',fields}]})).toBe(false);
  expect(validSellerBody('RST_a/menu-batches','POST',{...body,rows:[{key:'a',skip:true}]})).toBe(false);
  expect(validSellerBody('RST_a/menu-batches','POST',{...body,rows:[...body.rows,...body.rows]})).toBe(false);
 });
 it('rejects quantities as booleans, arbitrary amounts and false handoff',()=>{
  const data={operation_key:'one',expected_revision:1,fulfillment_method:'takeaway',selections:{standalone:[{key:'a',item_ref:'RMI_a',quantity:2}],plates:[]}};
  expect(validSellerBody('RST_a/counter-baskets/RBA_a/quote','POST',data)).toBe(true);
  expect(validSellerBody('RST_a/counter-baskets/RBA_a/quote','POST',{...data,selections:{standalone:[{key:'a',item_ref:'RMI_a',quantity:true}],plates:[]}})).toBe(false);
  expect(validSellerBody('RST_a/counter-baskets/RBA_a/finalize','POST',{operation_key:'a',expected_revision:1,quote_ref:'RQU_a',confirm:true,handoff_confirmed:false,fulfillment_method:'takeaway'})).toBe(false);
 });
 it('never guesses a repeated/nonexistent local clock',()=>{
  expect(localCandidates('2026-03-29T02:30','Europe/Stockholm')).toEqual([]);
  expect(localCandidates('2026-10-25T02:30','Europe/Stockholm')).toEqual(['2026-10-25T02:30:00+02:00','2026-10-25T02:30:00+01:00']);
  expect(localCandidates('2026-09-11T12:30','Africa/Kinshasa')).toEqual(['2026-09-11T12:30:00+01:00']);
 });
 it('offers state/method actions without payment authority',()=>{
  const o={state:'pending',fulfillment_method:'pickup'} as Order;expect(actionsFor(o)).toEqual(['accept','reject']);
  expect(actionsFor({...o,state:'completed'})).toEqual([]);
  expect(actionsFor({...o,state:'ready',fulfillment_method:'delivery'})).toEqual(['dispatch','cancel']);
 });
});
