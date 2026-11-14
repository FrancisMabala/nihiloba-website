import {afterEach,expect,it,vi} from 'vitest';
import {signalPasskeyUser} from '../app/lib/account-passkeys';
const details={rpId:'nihiloba.com',userId:'VVNSX3N5bnRoZXRpYw',name:'Francis Mabala',displayName:'Francis Mabala'};
afterEach(()=>vi.unstubAllGlobals());
it('signals the authenticated opaque handle and canonical labels without creating or revoking credentials',async()=>{
 const signalCurrentUserDetails=vi.fn().mockResolvedValue(undefined);
 vi.stubGlobal('window',{PublicKeyCredential:{signalCurrentUserDetails}});
 expect(await signalPasskeyUser(details)).toBe(true);
 expect(signalCurrentUserDetails).toHaveBeenCalledExactlyOnceWith(details);
});
it('keeps unsupported and rejected providers usable',async()=>{
 vi.stubGlobal('window',{});expect(await signalPasskeyUser(details)).toBe(false);
 const signalCurrentUserDetails=vi.fn().mockRejectedValue(new Error('unsupported'));
 vi.stubGlobal('window',{PublicKeyCredential:{signalCurrentUserDetails}});
 expect(await signalPasskeyUser(details)).toBe(false);
 expect(await signalPasskeyUser(null)).toBe(false);
 expect(signalCurrentUserDetails).toHaveBeenCalledTimes(1);
});
