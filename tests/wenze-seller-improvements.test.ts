import {expect,it} from 'vitest';
import {productMargin,shopTimeZone} from '../app/lib/wenze-seller-improvements';
it('calculates gross margin including loss, zero cost and zero revenue',()=>{
 expect(productMargin('15000','10000')?.amount).toBe(5000);
 expect(productMargin('15000','10000')?.percent).toBeCloseTo(33.3333);
 expect(productMargin('100','150')).toEqual({amount:-50,percent:-50});
 expect(productMargin('100','0')).toEqual({amount:100,percent:100});
 expect(productMargin('0','10')).toEqual({amount:-10,percent:null});
 expect(productMargin('12,50','10,25')?.amount).toBe(2.25);
});
it('does not turn missing or malformed cost into zero',()=>{
 for(const value of ['', '-1','Infinity','3.141','abc'])expect(productMargin('100',value)).toBeNull();
 expect(shopTimeZone('Lubumbashi')).toBe('Africa/Lubumbashi');
 expect(shopTimeZone('Kinshasa')).toBe('Africa/Kinshasa');
});
