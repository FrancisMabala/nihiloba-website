import {describe,it,expect} from 'vitest';
import {cashCents,cashKey,cashSuggestions} from '../app/lib/wenze-cash';
describe('cash amount entry',()=>{
 it('uses exact minor units and rejects unsupported input',()=>{
  expect(cashCents('0.29')-cashCents('0.10')).toBe(19);
  expect(cashCents('9999999999.99')).toBe(999999999999);
  for(const value of ['-1','1e5','Infinity','1.001','10000000000',''])expect(cashCents(value)).toBeNaN();
 });
 it('suggests amounts at or above the real total without a fixed currency assumption',()=>{
  expect(cashSuggestions(4000000)).toEqual([4000000,5000000,6000000]);
  expect(cashSuggestions(550)).toEqual([550,600,700,800]);
  expect(cashSuggestions(NaN)).toEqual([]);
 });
 it('edits a decimal amount without accepting extra decimal places',()=>{
  expect(cashKey('','.')).toBe('0.');
  expect(cashKey('5.50','1')).toBe('5.50');
  expect(cashKey('5.50','⌫')).toBe('5.5');
  expect(cashKey('5.50','C')).toBe('');
 });
});
