import {describe,it,expect} from 'vitest';
import {blankTerms,missionTerms,missionProblem,payload} from '../app/lib/mission-form';
import {missionText} from '../app/lib/mission-copy';
describe('owned listing work-type prefill',()=>{
 it('keeps the saved category independently of the owner title',()=>{
  const values={job:'My own descriptive title',mission_terms:JSON.stringify({...blankTerms,category:'wewa'})};
  expect(missionTerms(values).category).toBe('wewa');expect(payload(values).job).toBe(values.job);
 });
 it('recognizes only canonical legacy titles in all supported languages',()=>{
  for(const locale of ['fr','en','ln','sw'] as const)expect(missionTerms({job:missionText(locale,'childcare')}).category).toBe('childcare');
  const values={job:'A user title with no stored category'};expect(missionTerms(values).category).toBe('');expect(payload(values).job).toBe(values.job);
 });
 it('preserves an unsupported saved category but requires explicit correction',()=>{
  const values={job:'Owner title',mission_terms:JSON.stringify({...blankTerms,category:'legacy_type'})};
  expect(missionTerms(values).category).toBe('legacy_type');expect(missionProblem(values,missionTerms(values),0,[])).toBe('category');expect(JSON.parse(payload(values).mission_terms).category).toBe('legacy_type');
 });
});
