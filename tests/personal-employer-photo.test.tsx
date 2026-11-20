import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {safePersonalEmployerPhotoUrl,safePublicImageUrl} from '../app/lib/safe-public-url';
import {PersonalEmployerIdentity,copy} from '../app/components/shida/job-presentation';
import {personalEmployerPhotoView,PersonalEmployerPhoto} from '../app/components/shida/personal-employer-photo';
import {personalEmployerPhotoCopy} from '../app/lib/personal-employer-photo-copy';
import type {PublicJobEmployerSummary} from '../app/types/shida-public';
const employer:PublicJobEmployerSummary={identity_type:'individual',public_ref:null,slug:null,name:'PRIVATE ACCOUNT NAME',city:null,area:null,profile_image:null};
describe('public opt-in employer photos',()=>{
 it('maps only the exact new revocable photo path',()=>{
  for(const path of ['/api/public/emploi/employer-photos/AST_fixture','/api/shida/employer-photo/AST_fixture/']){expect(safePersonalEmployerPhotoUrl(path)).toBe('/api/shida/employer-photo/AST_fixture/');expect(safePublicImageUrl(path)).toBe('/api/shida/employer-photo/AST_fixture/');}
  for(const path of ['/api/assets/AST_private','https://res.cloudinary.com/dbrxpvmzp/image/upload/old-private.jpg','https://evil.test/api/public/emploi/employer-photos/AST_fixture','/api/public/emploi/employer-photos/AST_fixture?owner=private','/api/public/emploi/employer-photos/AST_fixture#private','/api/public/emploi/employer-photos/AST_a/../AST_b'])expect(safePersonalEmployerPhotoUrl(path)).toBeNull();
 });
 it.each(['fr','en','ln','sw'] as const)('keeps the generic label and no company link for legacy or explicitly shared images in %s',locale=>{
  for(const url of [null,'https://res.cloudinary.com/dbrxpvmzp/image/upload/old-private.jpg','/api/assets/AST_private']){const html=renderToStaticMarkup(<PersonalEmployerIdentity locale={locale} employer={{...employer,profile_image:url?{url,alt:'PRIVATE NAME'}:null}}/>);expect(html).toContain(copy[locale].personalEmployer);expect(html).not.toContain('PRIVATE');expect(html).not.toContain('<a');expect(html).not.toContain('<img');}
  const html=renderToStaticMarkup(<PersonalEmployerIdentity locale={locale} employer={{...employer,profile_image:{url:'/api/public/emploi/employer-photos/AST_fixture',alt:'PRIVATE NAME'}}}/>);
  expect(html).toContain('src="/api/shida/employer-photo/AST_fixture/"');expect(html).not.toContain('/_next/image');expect(html).not.toContain('<a');expect(html).not.toContain('PRIVATE');expect(html).toContain(copy[locale].personalEmployer);
 });
 it('shows no extra compact placeholder when an individual job has no new photo',()=>{expect(renderToStaticMarkup(<PersonalEmployerIdentity locale="en" employer={employer} compact/>)).toBe('');});
 it('ignores backend provider URLs and rejects foreign offer, legacy policy and malformed owner state',()=>{
  const input={offer_ref:'JOB_fixture',version:'a'.repeat(64),policy:'public-personal-employer-photo-v1',photo:{asset_ref:'AST_fixture',url:'https://private.test'},owner_name:'PRIVATE'};
  expect(personalEmployerPhotoView(input,'JOB_fixture')).toEqual({offer_ref:'JOB_fixture',version:input.version,policy:input.policy,photo:{asset_ref:'AST_fixture'}});
  for(const value of [{...input,offer_ref:'JOB_other'},{...input,policy:'old'},{...input,version:'1'},{...input,photo:{asset_ref:'https://private.test'}}])expect(()=>personalEmployerPhotoView(value,'JOB_fixture')).toThrow();
 });
 it.each(['fr','en','ln','sw'] as const)('renders an optional localized editor and skip action without requiring a photo in %s',locale=>{
  const html=renderToStaticMarkup(<PersonalEmployerPhoto locale={locale} binding="synthetic" offerRef="JOB_fixture"/>);expect(html).toContain(personalEmployerPhotoCopy[locale].title);expect(html).toContain(personalEmployerPhotoCopy[locale].skip);expect(html).toContain(personalEmployerPhotoCopy[locale].publicHelp);expect(html).not.toContain('required');expect(html).not.toContain('PRIVATE ACCOUNT');
 });
});
