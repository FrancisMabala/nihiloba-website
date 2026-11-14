import {describe,it,expect} from 'vitest';
import {sameCounterChoice,cashChange} from '../app/lib/restaurant-counter-values';
import {validOrderQuery} from '../app/lib/restaurant-orders-contract';
import {posCopy} from '../app/lib/restaurant-pos-copy';
describe('restaurant sale safety',()=>{
 it('merges only equivalent quantity lines, regardless of extras ordering',()=>{
 const a={item_ref:'RMI_one',quantity:1,plate:'plate-1',portion_key:'large',extra_keys:['rice','sauce'],note:'Sans sel'};
 expect(sameCounterChoice(a,{...a,quantity:3,extra_keys:['sauce','rice']})).toBe(true);
 for(const change of [{note:''},{plate:'plate-2'},{portion_key:''},{extra_keys:['rice']},{item_ref:'RMI_other'},{quantity:undefined}])expect(sameCounterChoice(a,{...a,...change})).toBe(false);
 });
 it('keeps cash exact, overpaid and insufficient amounts precise',()=>{
 expect(cashChange('5500','5500')).toBe('0.00');expect(cashChange('10000','5500')).toBe('4500.00');expect(cashChange('5000','5500')).toBe('0.00');expect(cashChange('10,50','9.75')).toBe('0.75');
 });
 it('allows bounded draft pages without broadening other queries',()=>{
 for(const path of ['RST_one/counter-baskets','RST_one/pos/counter-baskets']){expect(validOrderQuery(path,'GET',new URLSearchParams('page=2'))).toBe(true);expect(validOrderQuery(path,'GET',new URLSearchParams('page=0'))).toBe(false);expect(validOrderQuery(path,'GET',new URLSearchParams('actor=other'))).toBe(false);}
 });
 it('provides all operational labels in four languages',()=>{for(const locale of ['fr','en','ln','sw'] as const){expect(Object.keys(posCopy[locale])).toEqual(Object.keys(posCopy.fr));expect(Object.values(posCopy[locale]).every(Boolean)).toBe(true);}});
});
