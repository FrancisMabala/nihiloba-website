import {it,expect} from 'vitest';
import {listingEligibility,eligibilityFailure,individualEligibilityCopy} from '../app/lib/individual-job-eligibility';
it('requires application capability and distinguishes lifecycle from request state',()=>{
 expect(listingEligibility('published',true)).toBe('loading');
 expect(listingEligibility('published',false)).toBe('disabled');
 expect(listingEligibility('expired',true)).toBe('expired');
 expect(listingEligibility('closed',true)).toBe('closed');
 expect(eligibilityFailure(409,'mission_self_application')).toBe('owner');
 expect(eligibilityFailure(409,'mission_closed')).toBe('error');
 for(const status of [429,500,502,503])expect(eligibilityFailure(status)).toBe('error');
 expect(eligibilityFailure(401)).toBe('signin');
 expect(eligibilityFailure(404)).toBe('unavailable');
});
it('has recovery and status copy in every supported language',()=>{
 for(const copy of Object.values(individualEligibilityCopy)){
  expect(Object.keys(copy)).toEqual(Object.keys(individualEligibilityCopy.fr));
  expect(Object.values(copy).every(value=>value.trim())).toBe(true);
 }
});
