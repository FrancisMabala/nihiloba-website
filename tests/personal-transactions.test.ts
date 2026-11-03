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

const overview={counts:{all:1,orders:1,requests:0,documents:0},items:[row],documents:[],page:1,page_size:10,has_more:false};
it('accepts server totals larger than a page without replacing them with row counts',()=>{
 expect(isOverview({...overview,counts:{all:25,orders:25,requests:0,documents:0},has_more:true})).toBe(true);
});
it('rejects inconsistent empty claims, invalid categories and incomplete pagination',()=>{
 expect(isOverview(overview)).toBe(true);
 expect(isOverview({...overview,counts:{all:0,orders:0,requests:0,documents:0}})).toBe(false);
 expect(isOverview({...overview,page:undefined})).toBe(false);
 expect(isOverview({...overview,items:[{...row,category:'documents'}]})).toBe(false);
 expect(isOverview({...overview,documents:[row]})).toBe(false);
 expect(isOverview({...overview,items:[row,row]})).toBe(false);
});
it('rejects unexpected private detail fields and malformed dates without rendering them',()=>{
 expect(isOverview({...overview,items:[{...row,details:{private_address:'private'}}]})).toBe(false);
 expect(isOverview({...overview,items:[{...row,date:'not a date'}]})).toBe(false);
 expect(isOverview({...overview,items:[{...row,details:{guests:2}}]})).toBe(true);
});

it("keeps Wenze customer purchases in Orders with direct authorized history links",()=>{const purchase={...row,id:"wenze:SHO_TEST",kind:"wenze" as const,reference:"SHO_TEST"};expect(isOverview({...overview,items:[purchase]})).toBe(true);expect(transactionLink(purchase,"en")).toBe("/shida/wenze/orders#SHO_TEST");expect(isOverview({...overview,items:[{...purchase,category:"requests"}]})).toBe(false);});

it('requires an authorized store reference for personal-selling rows',()=>{
 const sale={...row,id:'wenze:SHO_TEST',kind:'wenze',role:'seller',store_reference:'WNZ_TEST',reference:'SHO_TEST'};
 expect(isOverview({...overview,items:[sale]})).toBe(true);
 expect(isOverview({...overview,items:[{...sale,store_reference:null}]})).toBe(false);
 expect(isOverview({...overview,items:[{...sale,kind:'food'}]})).toBe(false);
 expect(isOverview({...overview,items:[{...sale,role:'administrator'}]})).toBe(false);
});
