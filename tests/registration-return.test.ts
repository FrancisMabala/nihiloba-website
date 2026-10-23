import {expect,it} from 'vitest';
import {registrationReturnPath} from '../app/lib/registration/return-path';
it('preserves the local selling destination after registration',()=>{
 expect(registrationReturnPath('/fr/shida/wenze/sell','/shida/space')).toBe('/fr/shida/wenze/sell');
});
it.each(['https://outside.invalid','//outside.invalid','/shida/../../outside','/shida/%2f%2foutside','/shida/register/','/shida/space?token=secret','/shida\\outside',null])('rejects unsafe or recursive return %s',value=>{
 expect(registrationReturnPath(value,'/shida/space')).toBe('/shida/space');
});
