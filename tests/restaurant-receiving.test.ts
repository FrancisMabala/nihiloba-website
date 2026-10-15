import {describe,it,expect} from 'vitest';
import {receivingHeadline,receivingCopy,type Receiving} from '../app/lib/restaurant-receiving';
const off={available:false,reasons:['paused'] as const};
function state():Receiving {return {evaluated_at:'2026-10-15T08:00:00Z',timezone:'Africa/Kinshasa',hours:'open',in_person:{available:false,reasons:['menu']},pickup:{web:{...off,reasons:['paused']},whatsapp:{...off,reasons:['paused']},activation_blockers:[]},delivery:{web:{...off,reasons:['paused']},whatsapp:{...off,reasons:['paused']},activation_blockers:[]}};}
describe('receiving status does not infer availability from saved flags',()=>{
 it('fails closed for release restrictions and marks stale/missing authority unknown',()=>{
  const s=state();s.in_person.available=true;
  expect(receivingHeadline(false,s,true)).toBe('unavailable');
  expect(receivingHeadline(true,s,false)).toBe('unknown');
  expect(receivingHeadline(true,undefined,true)).toBe('unknown');
 });
 it('counter selling remains available when both customer services are paused',()=>{
  const s=state();s.in_person={available:true,reasons:[]};expect(receivingHeadline(true,s,true)).toBe('available');
 });
 it('separates paused services from blocked setup',()=>{
  const s=state();expect(receivingHeadline(true,s,true)).toBe('unavailable');s.pickup.whatsapp.reasons=['expired'];expect(receivingHeadline(true,s,true)).toBe('unavailable');
 });
 it('has complete nonempty four-language wording',()=>{
  for(const copy of Object.values(receivingCopy)){expect(Object.keys(copy).sort()).toEqual(Object.keys(receivingCopy.en).sort());expect(Object.values(copy).every(v=>v.trim().length>0)).toBe(true);}
 });
});
