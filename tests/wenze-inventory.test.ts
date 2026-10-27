import {describe,it,expect} from 'vitest';
import {groupStock} from '../app/lib/wenze-inventory';
describe('inventory product totals',()=>{
 it('combines variants by parent identity and deduplicates cursor overlap',()=>{
  const a={item_ref:'a',catalog_parent_ref:'p',catalog_label:'Shirt - M',on_hand:5,reserved:2,available:3};
  const b={...a,item_ref:'b',catalog_label:'Shirt - L',on_hand:4,reserved:1,available:3};
  expect(groupStock([a,b,a],[{public_ref:'p',name:'Shirt'}])).toMatchObject([{key:'p',name:'Shirt',on_hand:9,reserved:3,available:6,items:[a,b]}]);
 });
 it('does not merge distinct products with identical names or unknown stock into zero',()=>{
  const a={item_ref:'a',catalog_ref:'p',catalog_label:'Shirt',on_hand:null,reserved:0,available:null};
  const b={...a,item_ref:'b',catalog_ref:'q',on_hand:4,available:4};
  const result=groupStock([a,b]);expect(result).toHaveLength(2);expect(result[0].available).toBeNull();
 });
});
