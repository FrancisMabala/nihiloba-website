import { describe, expect, it } from 'vitest';
import { actionsFor, type Order } from '../app/lib/restaurant-work';
import { validOrderBody, orderRoutes } from '../app/lib/restaurant-orders-contract';

describe('restaurant delivery verification', () => {
  const dispatched = { order_ref:'ROD_test', revision:5, state:'out_for_delivery', entry_source:'customer', fulfillment_method:'delivery', delivery_verification:{method:'unverified',required:true,locked:false} } as Order;
  it('offers proof or explicit exception and hides the old direct completion', () => {
    expect(actionsFor(dispatched)).toEqual(['verify_delivery','delivery_exception','delivery_failed','cancel']);
    expect(actionsFor({...dispatched,delivery_verification:{method:'unverified',required:true,locked:true}})).toEqual(['delivery_exception','delivery_failed','cancel']);
    expect(actionsFor({...dispatched,delivery_verification:{method:'unverified',required:true,locked:false,legacy:true}})).toEqual(['delivery_exception','delivery_failed','cancel']);
  });
  it('bounds the submitted code and exception reason', () => {
    const verify='RST_test/orders/ROD_test/actions/verify_delivery';
    const payload={operation_key:'verify',expected_revision:5,delivery_code:'012345'};
    expect(orderRoutes.some(([pattern,methods])=>pattern.test(verify) && methods.includes('POST'))).toBe(true);
    expect(validOrderBody(verify,payload)).toBe(true);
    expect(validOrderBody(verify,{...payload,delivery_code:'123'})).toBe(false);
    expect(validOrderBody(verify,{...payload,delivery_code:'1234567'})).toBe(false);
    expect(validOrderBody(verify,{...payload,pickup_code:'012345'})).toBe(false);
    const exception='RST_test/orders/ROD_test/actions/delivery_exception';
    expect(validOrderBody(exception,{operation_key:'exception',expected_revision:5,reason:'recipient_handoff_without_code',confirm:true})).toBe(true);
    expect(validOrderBody(exception,{operation_key:'exception',expected_revision:5})).toBe(false);
  });
});
