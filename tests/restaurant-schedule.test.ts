import {describe,it,expect} from 'vitest';
import {validSchedule,scheduleCopy} from '../app/lib/restaurant-schedule';
import {validOrderBody} from '../app/lib/restaurant-orders-contract';
const schedule={weekly_periods:[{weekday:0,start:'11:00',end:'14:00'},{weekday:0,start:'19:00',end:'02:00'}],minimum_lead_minutes:20,cutoff_minutes:30,allow_tomorrow:false};
describe('recurring service boundary',()=>{
 it('accepts split and overnight periods without a daily date',()=>expect(validSchedule(schedule)).toBe(true));
 it('rejects overlaps across midnight and the weekly boundary',()=>{
  expect(validSchedule({...schedule,weekly_periods:[{weekday:6,start:'23:00',end:'02:00'},{weekday:0,start:'01:00',end:'03:00'}]})).toBe(false);
 });
 for(const change of [{minimum_lead_minutes:-1},{minimum_lead_minutes:true},{cutoff_minutes:180},{allow_tomorrow:2},{weekly_periods:[]}])it(`rejects invalid settings ${JSON.stringify(change)}`,()=>expect(validSchedule({...schedule,...change})).toBe(false));
 it('allows a bounded schedule payload and excludes mixed dated windows',()=>{
  const body={operation_key:'test',expected_updated_at:'2026-10-15T12:00:00Z',enabled:true,windows:[],schedule};
  expect(validOrderBody('RST_test/pickup-intake',body)).toBe(true);
  expect(validOrderBody('RST_test/pickup-intake',{...body,windows:[{starts_at:'a',ends_at:'b'}]})).toBe(false);
 });
 it('provides all labels in four languages',()=>{
  for(const copy of Object.values(scheduleCopy)){expect(Object.keys(copy)).toEqual(Object.keys(scheduleCopy.en));expect(copy.days).toHaveLength(7);}
 });
});

