import {expect,it} from 'vitest';
import {registrationReturnPath} from '../app/lib/registration/return-path';

it('retains only allowlisted Meda destinations and public references in each language',()=>{
 for(const locale of ['', '/fr', '/en', '/ln', '/sw'])for(const suffix of [
  '/meda/?view=detail&ref=MED_fixture', '/space/?view=listings&tab=meda&meda_view=create',
  '/space/?view=listings&tab=meda&meda_view=detail&ref=MED_fixture',
  '/space/?view=messages&market=meda&meda_view=conversation&ref=MEQ_fixture',
  '/space/?view=messages&market=meda&listing=MED_fixture',
 ]){const path=`${locale}/shida${suffix}`;expect(registrationReturnPath(path,'/shida/space')).toBe(path);}
 for(const suffix of ['?view=detail&ref=MED_fixture&token=x','?view=detail&view=detail&ref=MED_fixture',
  '?view=detail&ref=MED_fixture%26token=x','?view=detail&ref=MEQ_wrong','?view=publish&ref=MED_fixture',
  '?view=detail&ref=MED_fixture#fragment','?view=detail&ref=MED_fixture?next=evil'])
  expect(registrationReturnPath('/shida/meda/'+suffix,'/shida/space')).toBe('/shida/space');
});

it('preserves only an exact public job-action return, never credentials or additional query parameters',()=>{
 for(const locale of ['', '/fr', '/ln', '/sw'])for(const action of ['save','unsave','follow','unfollow']){
  const path=`${locale}/shida/emplois/JOB_fixture?job-action=${action}`;
  expect(registrationReturnPath(path,'/shida/space')).toBe(path);
 }
 for(const path of ['/shida/emplois/JOB_fixture?job-action=save&token=secret','/shida/emplois/JOB_fixture?job-action=save#token','/shida/emplois/JOB_fixture?job-action=delete','//evil.invalid/shida/emplois/JOB_fixture?job-action=save','/shida/space?job-action=save'])expect(registrationReturnPath(path,'/shida/space')).toBe('/shida/space');
});
it('preserves the local selling destination after registration',()=>{
 expect(registrationReturnPath('/fr/shida/wenze/sell','/shida/space')).toBe('/fr/shida/wenze/sell');
});
it.each(['https://outside.invalid','//outside.invalid','/shida/../../outside','/shida/%2f%2foutside','/shida/register/','/shida/space?token=secret','/shida\\outside',null])('rejects unsafe or recursive return %s',value=>{
 expect(registrationReturnPath(value,'/shida/space')).toBe('/shida/space');
});

import {safeRestaurantReturn} from '../app/lib/business-auth/restaurant-return';
it('retains exact recipient invitation paths through shared authentication only',()=>{
 expect(safeRestaurantReturn('/invitations/BMR_fixture')).toBe('/invitations/BMR_fixture');
 for(const path of ['/invitations/BMR_fixture?role=owner','/invitations/BMR_fixture/../admin','//outside.invalid/invitations/BMR_fixture'])expect(safeRestaurantReturn(path)).toBe('/');
 expect(registrationReturnPath('/fr/shida/business-login/','/shida/space')).toBe('/fr/shida/business-login/');
});
