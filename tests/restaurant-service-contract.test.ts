import {describe,it,expect} from 'vitest';
import {serviceRoutes,validServiceBody,validServiceQuery,servicePath,serviceEnvelope} from '../app/lib/restaurant-service-contract';
import {actionsFor} from '../app/lib/restaurant-work';
import {serviceText} from '../app/lib/restaurant-service-copy';
const root='RST_one/service',worker='RST_one/stations/service';
const selections={standalone:[{key:'food',item_ref:'RMI_food',quantity:1}],plates:[{key:'plate',components:[{key:'component',item_ref:'RMI_pondu',selected_amount:'1000.00'}]}]};
describe('10B2 exact Service contract',()=>{
 it('exposes only bounded ordering/group routes, with ready handover as the only worker action',()=>{
  for(const suffix of ['/groups','/baskets','/groups/RSG_one/proposals','/orders/ROD_one/actions/assisted_handover'])expect(serviceRoutes.some(([p,m])=>p.test(worker+suffix)&&m.includes('POST'))).toBe(true);
  for(const suffix of ['/payments','/orders/ROD_one/actions/start','/orders/ROD_one/actions/ready','/orders/ROD_one/actions/cancel','/orders/ROD_one/pickup-code','/stock'])expect(serviceRoutes.some(([p])=>p.test(worker+suffix))).toBe(false);
 });
 it('requires worker query locators on GET, write and retry; excludes body locators',()=>{
  for(const method of ['GET','POST','PATCH']){
   expect(validServiceQuery(worker+'/baskets/RBA_one',method,new URLSearchParams())).toBe(false);
   expect(validServiceQuery(worker+'/baskets/RBA_one',method,new URLSearchParams('assignment_ref=RKA_one&assignment_revision=1'))).toBe(true);
  }
  expect(validServiceQuery(root,'GET',new URLSearchParams('assignment_ref=RKA_one&assignment_revision=1'))).toBe(false);
  expect(validServiceQuery(worker,'GET',new URLSearchParams('assignment_ref=RKA_one&assignment_ref=RKA_two&assignment_revision=1'))).toBe(false);
  expect(validServiceBody(worker+'/baskets',{operation_key:'new',assignment_ref:'RKA_one'})).toBe(false);
 });
 it('preserves grouped selections, preferences and exact grouped revision/quote confirmation',()=>{
  expect(validServiceBody(root+'/baskets/RBA_one/quote',{operation_key:'quote',expected_revision:1,selections,food_preference:'No chili'})).toBe(true);
  const body={operation_key:'submit',expected_revision:2,quote_ref:'RQU_original',confirm:true,group_ref:'RSG_one',expected_group_revision:4};
  expect(validServiceBody(root+'/baskets/RBA_one/submit',body)).toBe(true);
  for(const changes of [{confirm:false},{expected_group_revision:0},{expected_group_revision:undefined},{payment_verified:true},{fulfillment_method:'pickup'}])expect(validServiceBody(root+'/baskets/RBA_one/submit',{...body,...changes})).toBe(false);
  expect(validServiceBody(root+'/baskets/RBA_one/quote',{operation_key:'quote',expected_revision:1,selections:{...selections,plates:[{key:'food',components:selections.plates[0].components}]}})).toBe(false);
 });
 it('freezes original assignment locator, key, body, revision and quote',()=>{
  const original=serviceEnvelope(servicePath('businesses/BUS_one/restaurants/RST_one','/baskets/RBA_one/submit',{assignment_ref:'RKA_old',assignment_revision:1}),'POST',{operation_key:'same',expected_revision:7,quote_ref:'RQU_old',confirm:true});
  expect(Object.isFrozen(original)).toBe(true);expect(original.path).toContain('assignment_ref=RKA_old&assignment_revision=1');expect(original.body).toContain('RQU_old');
 });
 it('keeps assisted handover separate from pickup and counter',()=>{
  const order={order_ref:'ROD_one',revision:1,state:'ready',entry_source:'assisted',fulfillment_method:'assisted',submitted_at:'2026-10-10T10:00:00Z',cancellation_pending:false};
  expect(actionsFor(order)).toEqual(['assisted_handover','cancel']);
  expect(actionsFor({...order,state:'accepted'})).not.toContain('assisted_handover');
  expect(actionsFor({...order,fulfillment_method:'pickup'})).toContain('verify_pickup');
  expect(validServiceBody(root+'/orders/ROD_one/actions/assisted_handover',{operation_key:'h',expected_revision:3,confirm:true})).toBe(true);
  expect(validServiceBody(root+'/orders/ROD_one/actions/assisted_handover',{operation_key:'h',expected_revision:3,confirm:true,pickup_code:'123456'})).toBe(false);
 });
 it.each(['en','fr','ln','sw'] as const)('localizes consent and staff rounds in %s',locale=>{
  for(const key of ['title','send','handover','approval','approve','decline','staffRound','rounds','lost','expired'])expect(serviceText(locale,key)).not.toMatch(/^(\u2014|title|send|handover)$/);
 });
});
