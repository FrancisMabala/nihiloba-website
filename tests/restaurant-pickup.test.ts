import { describe, expect, it } from 'vitest';
import { actionsFor, type Order } from '../app/lib/restaurant-work';
import { validOrderBody } from '../app/lib/restaurant-orders-contract';

describe('restaurant pickup verification', () => {
  const ready = { order_ref:'ROD_test', revision:4, state:'ready', entry_source:'customer', fulfillment_method:'pickup', pickup_verification:{method:'unverified',required:true,locked:false} } as Order;
  it('replaces direct pickup completion with proof or a reasoned exception', () => {
    expect(actionsFor(ready)).toEqual(['verify_pickup','pickup_exception','cancel']);
    expect(actionsFor({...ready,pickup_verification:{method:'unverified',required:true,locked:false,legacy:true}})).toEqual(['pickup_exception','cancel']);
    expect(actionsFor({...ready,pickup_verification:{method:'unverified',required:true,locked:true}})).toEqual(['pickup_exception','cancel']);
    expect(actionsFor({...ready,fulfillment_method:'delivery'})).toEqual(['dispatch','cancel']);
  });
  it('accepts only bounded code input and named exception reasons', () => {
    const verify='RST_test/orders/ROD_test/actions/verify_pickup';
    const payload={operation_key:'verify',expected_revision:4,pickup_code:'012345'};
    expect(validOrderBody(verify,payload)).toBe(true);
    expect(validOrderBody(verify,{...payload,pickup_code:'123'})).toBe(false);
    expect(validOrderBody(verify,{...payload,pickup_code:'1234567'})).toBe(false);
    expect(validOrderBody(verify,{...payload,reason:'other'})).toBe(false);
    const exception='RST_test/orders/ROD_test/actions/pickup_exception';
    expect(validOrderBody(exception,{operation_key:'exception',expected_revision:4,reason:'device_unavailable'})).toBe(true);
    expect(validOrderBody(exception,{operation_key:'exception',expected_revision:4})).toBe(false);
  });
});
