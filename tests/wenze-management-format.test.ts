import {describe,it,expect} from 'vitest';
import {formatWenzeFact} from '../app/lib/wenze-management-copy';
describe('Wenze financial presentation',()=>{
 it('uses explicit UTC for instants and does not leak ISO values',()=>{
  expect(formatWenzeFact('2026-10-23T00:15:00Z','created_at','en')).toContain('UTC');
  expect(formatWenzeFact('2026-10-23','occurred_on','fr')).not.toContain('2026-10-23');
  expect(formatWenzeFact('invalid','completed_at','en')).toBe('—');
 });
 it('formats amounts without adding a currency or treating missing cost as zero',()=>{
  expect(formatWenzeFact('12345.50','amount','en')).toBe('12,345.5');
  expect(formatWenzeFact(null,'gross_profit','en')).toBe('—');
 });
});
