import {describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ProfessionalProfileForm} from '../app/components/shida/professional-profile-form';
import {candidateValues} from '../app/components/shida/candidate-profile-space';
import {CandidateChips} from '../app/components/shida/candidate-chips';
import {formText} from '../app/lib/professional-form-copy';

const noop=vi.fn();
const base={values:{},step:0,categories:[],editing:false,existingCV:false,busy:false,frozen:false,confirmed:false,setConfirmed:noop,setStep:noop,change:noop,save:noop,finish:noop,upload:async()=>{},uploadPhoto:async()=>{},removePhoto:async()=>{}};
describe('candidate onboarding extensions',()=>{
 it.each(['fr','en','ln','sw'] as const)('starts optional matching alerts off with separate visibility guidance in %s',locale=>{
  const html=renderToStaticMarkup(<ProfessionalProfileForm {...base} locale={locale}/>);
  expect(html).toContain(formText(locale,'alerts'));expect(html).toContain(formText(locale,'alertsHelp'));
  expect(html).not.toContain('checked=""');
 });
 it('preserves an enabled existing profile preference and sends a real boolean',()=>{
  const html=renderToStaticMarkup(<ProfessionalProfileForm {...base} locale="en" editing values={{job_alerts_enabled:'true'}}/>);
  expect(html).toContain('checked=""');
  expect(candidateValues({job_alerts_enabled:'false',desired_titles:'Accountant, Assistant'})).toEqual({job_alerts_enabled:false,desired_titles:['Accountant','Assistant']});
  expect(candidateValues({job_alerts_enabled:'true'})).toEqual({job_alerts_enabled:true});
  expect(candidateValues({city:'Goma'})).not.toHaveProperty('job_alerts_enabled');
 });
 it.each(['fr','en','ln','sw'] as const)('makes the image optional and keeps the file types bounded in %s',locale=>{
  const html=renderToStaticMarkup(<ProfessionalProfileForm {...base} locale={locale} step={1}/>);
  expect(html).toContain(formText(locale,'photo'));expect(html).toContain(formText(locale,'photoHelp'));
  expect(html).toContain('accept="image/jpeg,image/png,image/webp"');
  expect(html).not.toMatch(/type="file"[^>]*required/);
 });
 it('keeps suggestions as optional choices rather than replacing custom roles',()=>{
  const html=renderToStaticMarkup(<CandidateChips label="Roles" value="Custom role" onChange={noop} required max={3} add="Add" remove="Remove" suggestions={['Published role']}/>);
  expect(html).toContain('Custom role');expect(html).toContain('<option value="Published role"');
  expect(html).toContain('aria-label="Remove Custom role"');
 });
 it('review does not reveal an asset reference or provider URL',()=>{
  const html=renderToStaticMarkup(<ProfessionalProfileForm {...base} locale="en" step={2} photo={{asset_ref:'AST_private'}}/>);
  expect(html).not.toContain('AST_private');expect(html).not.toContain('cloudinary');expect(html).toContain('No alerts for this profile');
 });
});
