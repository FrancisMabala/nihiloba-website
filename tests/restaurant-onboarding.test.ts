import {describe,it,expect} from 'vitest';
import {allowedSellerRoute,validSellerBody,validSellerQuery} from '../app/lib/restaurant-seller-contract';
const ref='onboarding/RON_'+ 'a'.repeat(48), revision='b'.repeat(64);
describe('private restaurant onboarding boundary',()=>{
  it('admits only the explicit progress and confirmation surface',()=>{
    expect(allowedSellerRoute('onboarding/current','GET')).toBe(true);
    expect(allowedSellerRoute(ref,'GET')).toBe(true);
    expect(allowedSellerRoute(ref,'PATCH')).toBe(true);
    expect(allowedSellerRoute(ref+'/confirm','POST')).toBe(true);
    expect(allowedSellerRoute(ref+'/publish','POST')).toBe(false);
    expect(allowedSellerRoute(ref,'DELETE')).toBe(false);
    expect(validSellerQuery(ref,'GET',new URLSearchParams('actor_account_id=4'))).toBe(false);
  });
  it('requires explicit final confirmation and rejects ownership/publication injection',()=>{
    expect(validSellerBody(ref+'/confirm','POST',{revision,confirmed:true})).toBe(true);
    expect(validSellerBody(ref+'/confirm','POST',{revision})).toBe(false);
    expect(validSellerBody(ref+'/confirm','POST',{revision,confirmed:false})).toBe(false);
    for(const fields of [{status:'active'},{actor_account_id:2},{business_id:2},{confirm_location:'true'},{name:'x'.repeat(201)}])expect(validSellerBody(ref,'PATCH',{revision,fields})).toBe(false);
    expect(validSellerBody(ref,'PATCH',{revision,fields:{name:'My private restaurant',description:null,food_business_type:'cafe',address_visibility:'broad',confirm_location:false}})).toBe(true);
  });
});
