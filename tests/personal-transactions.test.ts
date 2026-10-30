import {describe,it,expect} from 'vitest';
import {isOverview,transactionAmount,transactionLink,transactionStatus,type Transaction} from '../app/lib/personal-transactions';
const row:Transaction={id:'food:ROD_example',kind:'food',category:'orders',reference:'ROD_example',related_reference:null,title:'Example kitchen',date:null,amount:null,currency:null,status:'preparing'};
describe('transaction projection',()=>{
 it('rejects partial counts and malformed records instead of asserting zero',()=>{
  expect(isOverview({counts:{orders:0},items:[]})).toBe(false);
  expect(isOverview({counts:{orders:0,requests:0,documents:0,all:1},items:[],documents:[],has_more:false})).toBe(false);
  expect(isOverview({counts:{orders:1,requests:0,documents:0,all:1},items:[{...row,reference:'../private'}],documents:[],has_more:false})).toBe(false);
 });
 it('formats known amounts, preserves missing values and never invents currency',()=>{
  expect(transactionAmount(row,'en')).toBe('—');
  expect(transactionAmount({...row,amount:'0',currency:'USD'},'en')).toBe('$0.00');
  expect(transactionAmount({...row,amount:'42.50',currency:'USD'},'fr')).toContain('42,50');
  expect(transactionAmount({...row,amount:'NaN',currency:'USD'},'en')).toBe('—');
 });
 it.each(['en','fr','ln','sw'] as const)('uses working localized destinations and statuses: %s',locale=>{
  const prefix=locale==='en'?'':`/${locale}`;
  expect(transactionLink(row,locale)).toBe(`${prefix}/shida/restaurant-orders/ROD_example`);
  expect(transactionLink({...row,kind:'food_receipt'},locale)).toMatch(/\/receipt$/);
  expect(transactionLink({...row,kind:'bill',related_reference:'RSV_example'},locale)).toBe(`${prefix}/shida/service-bills/RSV_example`);
  expect(transactionLink({...row,kind:'booking',reference:'RSV_example'},locale)).toBe(`${prefix}/shida/service-requests?booking=RSV_example`);
  expect(transactionStatus({...row,kind:'service',status:'IN_REVIEW'},locale)).not.toContain('IN_REVIEW');
  expect(transactionStatus({...row,kind:'bill',status:'unknown_future_status'},locale)).not.toContain('unknown_future_status');
 });
});
