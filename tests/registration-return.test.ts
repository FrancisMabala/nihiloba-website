import {expect,it} from 'vitest';
import {registrationReturnPath} from '../app/lib/registration/return-path';

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
