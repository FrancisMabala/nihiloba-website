import {it,expect} from 'vitest';
import {restaurantWorkspaceGroups,restaurantSection,restaurantDestination} from '../app/lib/restaurant-workspace-navigation';
it('keeps every operational destination in exactly one group',()=>{for(const locale of ['en','fr','ln','sw'] as const){const groups=restaurantWorkspaceGroups(locale),keys=groups.flatMap(group=>group.keys);expect(new Set(keys).size).toBe(keys.length);for(const key of ['today','orders','counter','pos','inventory','daily','recovery','activity','reservations','items','offerings','settings','profile','hours','intake','reviews','sharing'])expect(keys).toContain(key);expect(groups).toHaveLength(4);}});

it('keeps legacy routes under the correct flat destination',()=>{
 for(const key of ['items','categories','batch','offerings'])expect(restaurantSection(key)).toBe('items');
 for(const key of ['profile','hours','settings','intake','sharing','photos','preview','paymentMethods'])expect(restaurantSection(key)).toBe('profile');
 expect(restaurantSection('recovery')).toBe('daily');expect(restaurantDestination('kitchen')).toBe('orders');expect(restaurantDestination('hours')).toBe('hours');expect(restaurantDestination('unrecognized')).toBe('today');
});
