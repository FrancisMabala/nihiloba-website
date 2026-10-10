import {describe,expect,it} from 'vitest';
import {serviceRoutes,validServiceBody,validServiceQuery} from '../app/lib/restaurant-service-contract';
import {guestRoute} from '../app/lib/restaurant-guest-contract';
const owner='RST_store/service',worker='RST_store/stations/service',group='/groups/RSG_group';
const allowed=(path:string,method:string)=>serviceRoutes.some(([pattern,methods])=>pattern.test(path)&&methods.includes(method));
const body={operation_key:'once',method_ref:'RPM_cash',currency:'CDF',amount:'15.00',change_returned:'5.00',expected_bill_revision:'a'.repeat(64),expected_payment_revision:0};
describe('private Service money gateway',()=>{
 it('adds only the exact private guest payment read',()=>{
  const visit='establishments/RST_store/visits/RGV_visit/service-payment';
  expect(guestRoute(visit,'GET')).toBe(true);
  expect(guestRoute(visit,'POST')).toBe(false);
  expect(guestRoute(visit+'/receipt','GET')).toBe(false);
 });
 it('keeps worker corrections and owner method configuration separate',()=>{
  expect(allowed(worker+group+'/money/receipts','POST')).toBe(true);
  expect(allowed(worker+group+'/money/recover','POST')).toBe(true);
  expect(allowed(worker+group+'/money/refunds','POST')).toBe(false);
  expect(allowed(owner+group+'/money/refunds','POST')).toBe(true);
  expect(allowed(worker+'/payment-methods','GET')).toBe(false);
  expect(allowed(owner+'/payment-methods','POST')).toBe(true);
  expect(allowed(owner+'/payment-methods/RPM_cash','PUT')).toBe(true);
 });
 it('requires the exact assignment query for each worker path and permits receipt language',()=>{
  expect(validServiceQuery(worker+group+'/bill','GET',new URLSearchParams('assignment_ref=RSA_1&assignment_revision=2'))).toBe(true);
  expect(validServiceQuery(worker+group+'/bill','GET',new URLSearchParams())).toBe(false);
  expect(validServiceQuery(worker+group+'/receipt','GET',new URLSearchParams('assignment_ref=RPA_1&assignment_revision=3&language=ln'))).toBe(true);
 });
 it('accepts decimal-string receipt and exact recovery, rejects accidental refund claims',()=>{
  expect(validServiceBody(owner+group+'/money/receipts',body)).toBe(true);
  expect(validServiceBody(owner+group+'/money/recover',{...body,kind:'receipt'})).toBe(true);
  expect(validServiceBody(owner+group+'/money/receipts',{...body,actually_returned:true})).toBe(false);
  expect(validServiceBody(owner+group+'/money/refunds',{...body,target_ref:'RME_1',reason:'returned'})).toBe(false);
  expect(validServiceBody(owner+group+'/money/refunds',{...body,target_ref:'RME_1',reason:'returned',actually_returned:true})).toBe(true);
  expect(validServiceBody(worker+group+'/money/recover',{...body,kind:'refund',target_ref:'RME_1',reason:'returned',actually_returned:true})).toBe(false);
  expect(validServiceBody(owner+group+'/money/receipts',{...body,amount:15})).toBe(false);
 });
});
