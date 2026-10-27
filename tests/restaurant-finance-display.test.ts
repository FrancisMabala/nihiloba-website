import {describe,it,expect} from 'vitest';
import {moneyCents,moneyDecimal,formatMoney} from '../app/lib/restaurant-finance-display';
describe('finance display amounts',()=>{
 it('adds decimal receipts exactly without losing cents on large totals',()=>{
  expect(moneyDecimal(moneyCents('999999999999999.99')+moneyCents('0.01'))).toBe('1000000000000000.00');
  expect(moneyDecimal(moneyCents('3000.00')+moneyCents('12.50')-moneyCents('2.25'))).toBe('3010.25');
 });
 it('keeps negative corrections and zero distinct and rejects invalid precision',()=>{
  expect(moneyDecimal(moneyCents('-0.01'))).toBe('-0.01');
  expect(formatMoney('0.00','fr')).toBe('0,00');
  expect(formatMoney('12345.67','fr').replace(/\s/g,' ')).toBe('12 345,67');
  expect(formatMoney('-300.00','en')).toBe('-300.00');
  expect(()=>moneyCents('1.001')).toThrow();
 });
});
