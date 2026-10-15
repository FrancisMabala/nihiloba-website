import {describe,it,expect} from 'vitest';
import {eligibleInterest,interestReceipt} from '../app/lib/restaurant-interest';
import {allowedSellerRoute,validSellerQuery} from '../app/lib/restaurant-seller-contract';
import {insightsCopy} from '../app/lib/restaurant-insights-copy';
describe('Restaurant interest viewing boundary',()=>{
 it('excludes hidden documents, untrusted programmatic events, automation and opt-out',()=>{
  expect(eligibleInterest({isTrusted:true},true,false,false)).toBe(true);
  expect(eligibleInterest({isTrusted:false},true,false,false)).toBe(false);
  expect(eligibleInterest({isTrusted:true},false,false,false)).toBe(false);
  expect(eligibleInterest({isTrusted:true},true,true,false)).toBe(false);
  expect(eligibleInterest({isTrusted:true},true,false,true)).toBe(false);
 });
 it('keeps retry identity stable without merging items, views and selections',()=>{
  const receipt=interestReceipt();
  expect(receipt('item_views','RMI_a')).toBe(receipt('item_views','RMI_a'));
  expect(receipt('item_views','RMI_a')).not.toBe(receipt('item_views','RMI_b'));
  expect(receipt('item_views','RMI_a')).not.toBe(receipt('item_selections','RMI_a'));
 });
 it('admits only the exact Personal read route and language query',()=>{
  expect(allowedSellerRoute('RST_test/insights','GET')).toBe(true);
  expect(allowedSellerRoute('RST_test/insights','POST')).toBe(false);
  expect(allowedSellerRoute('businesses/BUS_test/insights','GET')).toBe(false);
  expect(validSellerQuery('RST_test/insights','GET',new URLSearchParams('subject_ref=RST_other'))).toBe(false);
 });
 it('provides all four languages without placeholders or escaped newlines',()=>{
  for(const copy of Object.values(insightsCopy)){
   expect(Object.keys(copy)).toEqual(Object.keys(insightsCopy.en));
   for(const value of Object.values(copy))expect(value).not.toMatch(/TODO|\\n|Select this option/);
  }
 });
});
