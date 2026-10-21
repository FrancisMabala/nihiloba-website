import {describe,it,expect} from 'vitest';
import {cashChange,cents,decimal} from '../app/lib/restaurant-counter-values';
import {validOrderBody,orderRoutes} from '../app/lib/restaurant-orders-contract';
import {actionsFor,type Order} from '../app/lib/restaurant-work';
describe('counter workflow',()=>{
 it('calculates change without losing cent precision',()=>{
  expect(cashChange('25000','20000')).toBe('5000.00');
  expect(cashChange('0.30','0.10')).toBe('0.20');
  expect(cashChange('9007199254740999.99','9007199254740999.98')).toBe('0.01');
  expect(cashChange('100','200')).toBe('0.00');
  expect(cents('1e3')).toBeNull();expect(cents('-1')).toBeNull();
  expect(decimal(cents('12,30')!)).toBe('12.30');
 });
 it('allows held reads and prepare on both counter paths without client prices',()=>{
  for(const prefix of ['RST_one','RST_one/pos']){
   expect(orderRoutes.some(([p,m])=>p.test(prefix+'/counter-baskets')&&m.includes('GET'))).toBe(true);
   const path=prefix+'/counter-baskets/RBA_one';
   const line={key:'line',item_ref:'RMI_one',quantity:1,portion_key:'large',extra_keys:['rice'],note:'Sans piment'};
   const body={operation_key:'quote',expected_revision:1,fulfillment_method:'takeaway',selections:{standalone:[line],plates:[]}};
   expect(validOrderBody(path+'/quote',body)).toBe(true);
   expect(validOrderBody(path+'/quote',{...body,selections:{standalone:[{...line,unit_price:'1'}],plates:[]}})).toBe(false);
   expect(validOrderBody(path+'/prepare',{operation_key:'prepare',expected_revision:2,quote_ref:'RQU_one',confirm:true,fulfillment_method:'takeaway'})).toBe(true);
  }
 });
 it('offers actual handover, never customer pickup-code verification',()=>{
  for(const fulfillment_method of ['takeaway','on_premise'])expect(actionsFor({state:'ready',fulfillment_method} as Order)).toEqual(['assisted_handover','cancel']);
 });
});
