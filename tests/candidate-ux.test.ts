import {describe,it,expect} from 'vitest';
import {candidateResumeStep} from '../app/lib/candidate-ux';
describe('candidate saved progress',()=>{
 const required=['city','desired_titles','skills','cv_choice'];
 it('resumes the first incomplete step without pretending a saved draft is complete',()=>{expect(candidateResumeStep({},required,'professional')).toBe(0);expect(candidateResumeStep({city:'Goma',desired_titles:['Assistant']},required,'professional')).toBe(1);expect(candidateResumeStep({city:'Goma',desired_titles:['Assistant'],skills:['Planning'],cv_choice:'2'},required,'professional')).toBe(2);});
 it('keeps occasional work independent of professional CV requirements',()=>{expect(candidateResumeStep({city:'Goma',work_types:['Garden'],description:'Work'},['city','work_types','description'],'occasional_work')).toBe(2);});
});
