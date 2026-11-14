import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {RestaurantOrdersList} from '../app/components/shida/restaurant-orders-list';
import {queueQuery,queueCopy,emptyQueueFilters,activeStates,historyStates} from '../app/lib/restaurant-queue-copy';
import {validOrderQuery} from '../app/lib/restaurant-orders-contract';
describe('order queue',()=>{
 it('combines filters before requesting one bounded page',()=>{
  const q=queueQuery({...emptyQueueFilters,tab:'history',page:3,search:'ROD_one',origin:'counter',fulfillment:'takeaway',from:'2026-11-01',to:'2026-11-14'});
  expect(q.getAll('states')).toEqual(historyStates);expect(q.get('page')).toBe('3');expect(q.get('page_size')).toBe('20');expect(q.get('origin')).toBe('counter');expect(q.get('search')).toBe('ROD_one');
  expect(validOrderQuery('RST_one/orders','GET',q)).toBe(true);
  expect(validOrderQuery('RST_one/orders','GET',new URLSearchParams('origin=other'))).toBe(false);
  expect(queueQuery(emptyQueueFilters).getAll('states')).toEqual(activeStates);
 });
 it.each(['fr','en','ln','sw'] as const)('uses translated empty state without false loading zero in %s',locale=>{
  const props={locale,timezone:'Africa/Kinshasa',filters:emptyQueueFilters,onFilters:()=>{},onOpen:()=>{},blocked:false};
  expect(renderToStaticMarkup(<RestaurantOrdersList {...props} list={null} loading/>)).not.toContain(queueCopy[locale].empty);
  expect(renderToStaticMarkup(<RestaurantOrdersList {...props} list={{items:[],total:0}} loading={false}/>)).toContain(queueCopy[locale].empty);
 });
});
