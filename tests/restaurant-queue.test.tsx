import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {RestaurantOrdersList} from '../app/components/shida/restaurant-orders-list';
import {queueFiltersFromSearch,queueLocation,queueQuery,queueCopy,emptyQueueFilters,activeStates,historyStates} from '../app/lib/restaurant-queue-copy';
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

it('round trips queue filters and keeps establishment and parent tab in order links',()=>{
 const filters={...emptyQueueFilters,tab:'history' as const,state:'completed',search:'ROD_123',origin:'counter',fulfillment:'takeaway',from:'2026-11-01',to:'2026-11-16',page:3};
 const url=queueLocation('?establishment=RST_one&tab=orders',filters,'ROD_123');
 expect(queueFiltersFromSearch(url)).toEqual(filters);expect(new URLSearchParams(url).get('establishment')).toBe('RST_one');expect(new URLSearchParams(url).get('tab')).toBe('orders');expect(new URLSearchParams(queueLocation(url,filters)).has('order')).toBe(false);
});
it('rejects invalid queue route state and retains legacy orderStates links',()=>{
 expect(queueFiltersFromSearch('?orderStates=accepted,preparing').state).toBe('accepted,preparing');
 expect(queueFiltersFromSearch('?orderTab=bad&orderStates=completed&orderPage=-1&orderSearch=%3Cscript%3E&orderOrigin=other')).toEqual(emptyQueueFilters);
});
it('renders one real card link with full reference, source, fulfilment and currency',()=>{
 const order={order_ref:'ROD_FULL_REFERENCE',state:'accepted',entry_source:'counter',fulfillment_method:'on_premise',revision:1,submitted_at:'2026-11-15T12:44:00Z',cancellation_pending:false,order_total:'3000.00',currency:'CDF'};
 const html=renderToStaticMarkup(<RestaurantOrdersList locale="fr" timezone="Africa/Kinshasa" filters={emptyQueueFilters} onFilters={()=>{}} onOpen={()=>{}} blocked={false} list={{items:[order],total:1}} loading={false} orderHref={()=>'?order=ROD_FULL_REFERENCE'}/>);
 expect(html).toContain('href="?order=ROD_FULL_REFERENCE"');expect(html).toContain('aria-label="Voir la commande ROD_FULL_REFERENCE"');expect(html).toContain('Comptoir');expect(html).toContain('Sur place');expect(html).toContain('CDF');expect(html).not.toContain('rst-orders-open-copy');
});
