import {it,expect} from 'vitest';
import {validTodayOrders} from '../app/lib/restaurant-today-contract';
import {allowedSellerRoute,validSellerQuery} from '../app/lib/restaurant-seller-contract';
const page={items:[],total:0,as_of:'2026-11-18T12:00:00Z'};
const snapshot={version:1,sections:{pending:page,ready:page,preparing:page}};
it('accepts only the fixed read route with no caller-expanded work or scope',()=>{
 expect(allowedSellerRoute('RST_test/today-orders','GET')).toBe(true);
 for(const method of ['POST','PATCH','DELETE'])expect(allowedSellerRoute('RST_test/today-orders',method)).toBe(false);
 for(const query of ['page_size=100','actor_account_id=1','states=completed','language=fr'])expect(validSellerQuery('RST_test/today-orders','GET',new URLSearchParams(query))).toBe(false);
 expect(validSellerQuery('RST_test/today-orders','GET',new URLSearchParams())).toBe(true);
});
it('validates totals, fixed section count, dates and bounded existing projections',()=>{
 expect(validTodayOrders(snapshot)).toBe(true);
 expect(validTodayOrders({...snapshot,intake_released:true})).toBe(true);
 expect(validTodayOrders({...snapshot,intake_released:false})).toBe(true);
 expect(validTodayOrders({...snapshot,intake_released:null})).toBe(false);
 for(const value of [null,{}, {...snapshot,version:2},{...snapshot,sections:{pending:page}},
  {...snapshot,sections:{...snapshot.sections,secret:page}},
  ...[{...page,total:-1},{...page,total:null},{...page,as_of:'tomorrow'},{...page,items:Array(6).fill({}),total:6},
   {...page,items:[{response_deadline:'invalid'}],total:1}].map(pending=>({...snapshot,sections:{...snapshot.sections,pending}}))])expect(validTodayOrders(value)).toBe(false);
});
