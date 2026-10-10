import { describe, it, expect } from 'vitest';
import { preparationRoutes, validPreparationQuery, validPreparationBody, preparationPath, preparationEnvelope, validStationOrder, validPreparationResponse } from '../app/lib/restaurant-preparation-contract';
import { allowedSellerRoute, validSellerQuery, validSellerBody } from '../app/lib/restaurant-seller-contract';
import { preparationCopy } from '../app/lib/restaurant-preparation-copy';
import { actionsFor } from '../app/lib/restaurant-work';
const root = 'RST_one', worker = root+'/stations/preparation/bar', owner = root+'/preparation/bar';
const line = {key:'drink',name:'Original drink',pricing_model:'UNIT_PRICED',currency:'CDF',quantity:1,sale_unit_label:'bottle'};
const order = {order_ref:'ROD_one',state:'preparing',revision:3,submitted_at:'2026-10-10T12:00:00Z',updated_at:'2026-10-10T12:01:00Z',cancellation_pending:false,fulfillment_method:'assisted',food_preference:'No ice',standalone:[line],plates:[],station:'bar',station_state:'preparing',stations:{kitchen:'ready',bar:'preparing'},legacy_whole_order:false};
describe('10B3 preparation contract', () => {
 it('accepts only preparation reads/start/ready, individual recovery and explicit item routing', () => {
  for (const path of [owner+'/orders',worker+'/orders',worker+'/feed',root+'/orders/ROD_one/preparation/bar',root+'/preparation-routing']) expect(preparationRoutes.some(([p,m])=>p.test(path)&&m.includes('GET'))).toBe(true);
  for (const path of [owner+'/orders/ROD_one/actions/ready',root+'/orders/ROD_one/preparation/bar/recover']) expect(preparationRoutes.some(([p,m])=>p.test(path)&&m.includes('POST'))).toBe(true);
  for (const suffix of ['/payments','/handover','/stock','/orders/ROD_one/actions/cancel','/orders/ROD_one/recover']) expect(preparationRoutes.some(([p])=>p.test(worker+suffix))).toBe(false);
 });
 it('requires the exact worker generation on every read, action, feed and retry', () => {
  for (const [path,method] of [[worker+'/orders','GET'],[worker+'/feed','GET'],[worker+'/orders/ROD_one','GET'],[worker+'/orders/ROD_one/actions/start','POST']]) {
   expect(validPreparationQuery(path,method,new URLSearchParams())).toBe(false);
   expect(validPreparationQuery(path,method,new URLSearchParams('assignment_ref=RKA_old&assignment_revision=2'))).toBe(true);
   expect(validPreparationQuery(path,method,new URLSearchParams('assignment_ref=RKA_old&assignment_revision=2&assignment_revision=3'))).toBe(false);
  }
  expect(validPreparationQuery(owner+'/orders','GET',new URLSearchParams('assignment_ref=RKA_old&assignment_revision=2'))).toBe(false);
  expect(validPreparationBody(worker+'/orders/ROD_one/actions/start',{operation_key:'exact',expected_revision:3,assignment_ref:'RKA_old'})).toBe(false);
 });
 it('bounds queues/feeds and excludes old completed/history filters', () => {
  const bound = preparationPath(worker+'/feed?limit=50', '', {assignment_ref:'RKA_old',assignment_revision:2});
  const query = new URLSearchParams(bound.split('?')[1]);
  expect(query.get('limit')).toBe('50');expect(query.get('assignment_ref')).toBe('RKA_old');expect(validPreparationQuery(worker+'/feed','GET',query)).toBe(true);
  expect(validPreparationQuery(owner+'/orders','GET',new URLSearchParams('page=1&page_size=20&language=sw'))).toBe(true);
  for(const query of ['page_size=21','completed=true','states=pending','language=de','page=0'])expect(validPreparationQuery(owner+'/orders','GET',new URLSearchParams(query))).toBe(false);
  expect(validPreparationQuery(owner+'/feed','GET',new URLSearchParams('cursor=RFC_one&limit=50'))).toBe(true);
  expect(validPreparationQuery(owner+'/feed','GET',new URLSearchParams('limit=51'))).toBe(false);
 });
 it('freezes the complete uncertain operation envelope including binding and generation', () => {
  const url=preparationPath('businesses/BUS_one/restaurants/'+root,'/stations/preparation/bar/orders/ROD_one/actions/start',{assignment_ref:'RKA_old',assignment_revision:2});
  const op=preparationEnvelope(url,'POST',{operation_key:'same',expected_revision:3},'session-old',url.replace('/actions/start',''));
  expect(Object.isFrozen(op)).toBe(true);expect(op.url).toContain('assignment_ref=RKA_old&assignment_revision=2');expect(JSON.parse(op.body)).toEqual({operation_key:'same',expected_revision:3});expect(op.binding).toBe('session-old');
 });
 it('requires affirmative non-alcoholic declaration for each Bar route and rejects heuristics', () => {
  const path=root+'/preparation-routing/RMI_one',body={operation_key:'route',expected_updated_at:'2026-10-10T12:00:00Z',station:'bar'};
  expect(validPreparationBody(path,body)).toBe(false);expect(validPreparationBody(path,{...body,supported_non_alcoholic_drink:false})).toBe(false);expect(validPreparationBody(path,{...body,supported_non_alcoholic_drink:true})).toBe(true);
  expect(validPreparationBody(path,{...body,station:'kitchen'})).toBe(true);expect(validPreparationBody(path,{...body,category:'drinks',supported_non_alcoholic_drink:true})).toBe(false);
 });
 it('requires explicit confirmation and bounded reason for one owner station recovery', () => {
  const path=root+'/orders/ROD_one/preparation/bar/recover',body={operation_key:'recover',expected_revision:3,confirm:true,reason:'cannot_fulfill'};
  expect(validPreparationBody(path,body)).toBe(true);
  for (const changes of [{confirm:false},{confirm:undefined},{reason:undefined},{reason:'payment_received'},{station:'kitchen'},{quantity:1}])expect(validPreparationBody(path,{...body,...changes})).toBe(false);
 });
 it('validates the original station DTO and excludes money, contacts, secrets and other-station previews', () => {
  expect(validStationOrder(order)).toBe(true);
  for (const extra of [{order_total:'1000'},{payment_verified:false},{pickup_code:'123456'},{actor_ref:'USR_one'},{food_preview:{}}])expect(validStationOrder({...order,...extra})).toBe(false);
  expect(validStationOrder({...order,standalone:[{...line,quantity:0}]})).toBe(false);
  expect(validPreparationResponse(worker+'/orders','GET',{items:[order]})).toBe(true);
  expect(validPreparationResponse(worker+'/orders','GET',{items:[{...order,receipt_terms:{}}]})).toBe(false);
 });
 it('keeps legacy Kitchen usable while routed orders cannot use whole-order preparation', () => {
  expect(validStationOrder({...order,station:'kitchen',station_state:'preparing',stations:{},legacy_whole_order:true})).toBe(true);
  expect(validStationOrder({...order,stations:{},legacy_whole_order:true})).toBe(false);
  const original={order_ref:'ROD_one',state:'preparing',revision:3,entry_source:'assisted',fulfillment_method:'assisted',submitted_at:order.submitted_at,cancellation_pending:false};
  expect(actionsFor(original)).toContain('ready');expect(actionsFor({...original,preparation:{kitchen:'ready',bar:'preparing'}})).not.toContain('ready');expect(actionsFor({...original,state:'ready',preparation:{bar:'ready'}})).toContain('assisted_handover');
 });
 it('exposes Personal paid preparation and Free individual recovery without worker scope', () => {
  expect(allowedSellerRoute(owner+'/orders','GET')).toBe(true);expect(allowedSellerRoute(worker+'/orders','GET')).toBe(false);expect(allowedSellerRoute(root+'/orders/ROD_one/preparation/bar/recover','POST')).toBe(true);
  expect(validSellerQuery(owner+'/orders','GET',new URLSearchParams('language=en&page_size=20'))).toBe(true);expect(validSellerBody(root+'/orders/ROD_one/preparation/bar/actions/start','POST',{operation_key:'one',expected_revision:3})).toBe(true);
 });
 it.each(['fr','en','ln','sw'] as const)('has matching localized station/recovery/routing labels in %s', locale => {
  expect(Object.keys(preparationCopy[locale]).sort()).toEqual(Object.keys(preparationCopy.en).sort());
  for(const value of Object.values(preparationCopy[locale]))expect(value.trim().length).toBeGreaterThan(0);
  expect(preparationCopy[locale].bar).not.toBe('bar');expect(preparationCopy[locale].confirm).not.toBe(preparationCopy[locale].declaration);
 });
});
