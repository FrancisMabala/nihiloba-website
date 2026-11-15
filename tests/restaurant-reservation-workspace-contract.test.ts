import {it,expect} from 'vitest';
import {validReservationWorkspaceQuery as valid} from '../app/lib/restaurant-reservation-workspace-contract';
import {allowedSellerRoute,validSellerQuery} from '../app/lib/restaurant-seller-contract';
it('bounds reservation scopes and filters',()=>{expect(allowedSellerRoute('RST_test/reservations/workspace','GET')).toBe(true);expect(validSellerQuery('RST_test/reservations/workspace','GET',new URLSearchParams('scope=history&search=RRS_123&page=2&page_size=20'))).toBe(true);for(const input of ['scope=all','page_size=51','search=%25','scope=pending&scope=history','month=bad'])expect(valid(new URLSearchParams(input))).toBe(false);});
