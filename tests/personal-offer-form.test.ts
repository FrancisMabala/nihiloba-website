import {describe,it,expect} from 'vitest';
import {formatOfferBudget,parseOfferBudget,formatOfferSchedule,parseOfferSchedule} from '../app/lib/personal-offer-form';
describe('canonical personal offer text adapters',()=>{
 it('keeps the exact currency and payment period without conversion',()=>{
  for(const [amount,currency,period] of [['180','USD','mois'],['25','USD','jour'],['20000','CDF','intervention']]){
   const value=formatOfferBudget(amount,currency,period);expect(parseOfferBudget(value)).toEqual({amount,currency,period});
  }
 });
 it('does not guess or rewrite historical salary prose',()=>{
  for(const value of ['À partir de 20 USD / intervention','180 USD par mois','Selon accord','50€'])expect(parseOfferBudget(value)).toBeNull();
 });
 it('does not generate incomplete compensation',()=>{
  expect(formatOfferBudget('','CDF','jour')).toBe('');expect(formatOfferBudget('25','USD','')).toBe('');
 });
 it('distinguishes flexible, fixed and overnight schedules',()=>{
  expect(formatOfferSchedule(['Lun','Ven'],'09:00','17:00','','')).toBe('Lun, Ven · 09:00–17:00');
  expect(formatOfferSchedule(['Mar'],'','','Horaires flexibles','')).toBe('Mar · Horaires flexibles');
  expect(formatOfferSchedule(['Sam'],'22:00','06:00','','Se termine le lendemain')).toBe('Sam · 22:00–06:00 · Se termine le lendemain');
 });
 it('restores structured schedules across languages without guessing legacy prose',()=>{
  expect(parseOfferSchedule('Lun, Ven · 09:00–17:00','en')).toEqual({days:['Mon','Fri'],from:'09:00',to:'17:00',flexible:false,overnight:false});
  expect(parseOfferSchedule('Mar · Horaires flexibles','fr')?.flexible).toBe(true);
  expect(parseOfferSchedule('Weekends and some evenings','en')).toBeNull();
 });
});
