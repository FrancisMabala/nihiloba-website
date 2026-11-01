import {describe,it,expect} from 'vitest';
import {menuAmountInput,menuLinesEstimate} from '../app/lib/restaurant-menu-selection';
import type {RestaurantMenuItem} from '../app/services/shida/restaurants-client';
const item={amount_mode:'flexible',minimum_amount:'750.00',amount_step:'500.00',allowed_amounts:[]} as unknown as RestaurantMenuItem;
describe('food amount input follows the seller policy',()=>{
 it('starts increments at the minimum rather than zero',()=>{expect(menuAmountInput(item,'750')).toBe('750.00');expect(menuAmountInput(item,'1250')).toBe('1250.00');expect(menuAmountInput(item,'1000')).toBeNull();});
 it('rejects below minimum, malformed, zero and overprecise amounts',()=>{for(const value of ['0','250','-750','750.001','NaN','1e3'])expect(menuAmountInput(item,value)).toBeNull();});
 it('normalizes a localized decimal before passing it to existing handlers',()=>{expect(menuAmountInput({...item,minimum_amount:'0.25',amount_step:'0.10'},'0,35')).toBe('0.35');});
 it('permits only configured choices when configured',()=>{const configured={...item,amount_mode:'configured' as const,allowed_amounts:['1000.00','2500.00']};expect(menuAmountInput(configured,'1000')).toBe('1000.00');expect(menuAmountInput(configured,'1250')).toBeNull();});
 it('does not infer missing flexible-price rules',()=>{expect(menuAmountInput({...item,minimum_amount:null},'750')).toBeNull();expect(menuAmountInput({...item,amount_step:'0'},'750')).toBeNull();});
});
describe('basket browsing estimates',()=>{
 const food={...item,public_ref:'food',availability:'available',currency:'USD',pricing_model:'UNIT_PRICED',unit_price:'0.10'} as RestaurantMenuItem;
 it('uses exact money across multiple plate components',()=>{expect(menuLinesEstimate([{key:'a',item_ref:'food',quantity:3},{key:'b',item_ref:'food',quantity:2}],[food])).toEqual({amount:'0.50',currency:'USD'});});
 it('does not display a partial total for an unloaded item',()=>{expect(menuLinesEstimate([{key:'a',item_ref:'missing',quantity:1}],[food])).toBeNull();});
 it('never adds currencies together',()=>{expect(menuLinesEstimate([{key:'a',item_ref:'food',quantity:1},{key:'b',item_ref:'cdf',quantity:1}],[food,{...food,public_ref:'cdf',currency:'CDF'}])).toBeNull();});
 it('does not invent prices or allow invalid quantities',()=>{for(const quantity of [0,1.5,1001])expect(menuLinesEstimate([{key:'a',item_ref:'food',quantity}],[food])).toBeNull();expect(menuLinesEstimate([{key:'a',item_ref:'food',quantity:1}],[{...food,unit_price:null}])).toBeNull();});
});
