import {describe,it,expect} from 'vitest';
import {requestStage,uniqueWork,workMatches} from '../app/lib/services-work-model';
describe('provider work classification',()=>{
 it('keeps new, draft and customer-awaiting quotes mutually exclusive',()=>{
  const base={request_ref:'r',status:'SUBMITTED',can_create_quote:true};
  expect(requestStage(base)).toBe('new');expect(requestStage({...base,draft_quote_ref:'q'})).toBe('quotes');
  expect(requestStage({...base,status:'IN_REVIEW'})).toBe('quotes');
  expect(requestStage({...base,status:'QUOTED',current_quote:{status:'SENT'}})).toBe('sent');
  expect(requestStage({...base,reservation_ref:'b',draft_quote_ref:'q'})).toBe('closed');
  expect(requestStage({...base,status:'EXPIRED'})).toBe('closed');
 });
 it('deduplicates references and never counts completed work as active',()=>{
  expect(uniqueWork([{request_ref:'r'},{request_ref:'r'}])).toHaveLength(1);
  for(const status of ['accepted','confirmed','in_progress']){expect(workMatches({status},'jobs','reservations')).toBe(true);expect(workMatches({status},'bookings','reservations')).toBe(false);}
  expect(workMatches({status:'pending'},'bookings','reservations')).toBe(true);
  for(const status of ['completed','cancelled','expired'])expect(workMatches({status},'jobs','reservations')).toBe(false);
 });
});
