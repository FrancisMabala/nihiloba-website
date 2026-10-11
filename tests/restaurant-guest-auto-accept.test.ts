import {describe,expect,it} from 'vitest';
import {allowedSellerRoute,validSellerBody,validSellerQuery} from '../app/lib/restaurant-seller-contract';
import {guestAutoCopy} from '../app/lib/restaurant-guest-auto-accept';

describe('Personal owner guest QR preference gateway',()=>{
  const path='RST_test/guest-auto-accept';
  it('permits only exact read and revisioned write',()=>{
    expect(allowedSellerRoute(path,'GET')).toBe(true);
    expect(allowedSellerRoute(path,'PUT')).toBe(true);
    expect(allowedSellerRoute(path,'POST')).toBe(false);
    expect(validSellerQuery(path,'GET',new URLSearchParams())).toBe(true);
    expect(validSellerQuery(path,'GET',new URLSearchParams('business_id=1'))).toBe(false);
    expect(validSellerBody(path,'PUT',{operation_key:'enable',expected_revision:0,enabled:true})).toBe(true);
    expect(validSellerBody(path,'PUT',{operation_key:'enable',expected_revision:0,enabled:true,owner_ref:'USR_other'})).toBe(false);
    expect(validSellerBody(path,'PUT',{operation_key:'enable',expected_revision:-1,enabled:true})).toBe(false);
  });
  it.each(['en','fr','ln','sw'] as const)('explains the result and optional setting in %s',locale=>{
    const copy=guestAutoCopy[locale];
    for(const field of ['title','description','on','off','enable','disable','retry'] as const)expect(copy[field].length).toBeGreaterThan(3);
  });
});
