import {it,expect} from 'vitest';
import {validOrderBody,orderRoutes} from '../app/lib/restaurant-orders-contract';
it('allows only a revision-bound payment bill request',()=>{const path='RST_one/orders/ROD_one/payment-bill';expect(orderRoutes.some(([r,m])=>r.test(path)&&m.includes('POST'))).toBe(true);expect(validOrderBody(path,{operation_key:'pay-one',expected_revision:2})).toBe(true);expect(validOrderBody(path,{operation_key:'pay-one',expected_revision:0})).toBe(false);expect(validOrderBody(path,{operation_key:'pay-one',expected_revision:2,amount:'1'})).toBe(false);});
