import {it,expect} from 'vitest';
import {deletionVerificationIssue} from '../app/lib/deletion-verification';
import {securityActionErrorText} from '../app/lib/account-security-errors';
const now=Date.parse('2026-11-07T12:00:00Z'),past='2026-11-07T11:59:59Z',future='2026-11-07T12:00:01Z';
it('requires an independent recovery method, even with a verified sign-in email',()=>{
 const methods={email:null,email_ready_at:null,passkeys:[],login_email_verified:true};
 expect(deletionVerificationIssue(methods,false,now)).toBe('security_method_missing');
});
it('respects the selected recovery method and the exact waiting boundary',()=>{
 const methods={email:'x***@example.test',email_ready_at:future,passkeys:[{ready_at:past}]};
 expect(deletionVerificationIssue(methods,false,now)).toBeNull();
 expect(deletionVerificationIssue(methods,true,now)).toBe('security_method_not_ready');
 expect(deletionVerificationIssue({...methods,passkeys:[]},false,now)).toBe('security_method_not_ready');
 expect(deletionVerificationIssue({...methods,passkeys:[]},false,now+1000)).toBeNull();
 expect(deletionVerificationIssue({email:null,email_ready_at:null,passkeys:[{ready_at:future}]},false,now)).toBe('security_method_not_ready');
 expect(deletionVerificationIssue({...methods,email_ready_at:'invalid',passkeys:[]},false,now)).toBe('security_method_not_ready');
});
it.each(['en','fr','ln','sw'] as const)('explains missing, waiting, fresh-login and browser failures in %s',locale=>{
 const missing=securityActionErrorText(locale,new Error('security_method_missing'));
 const waiting=securityActionErrorText(locale,new Error('security_method_not_ready'));
 expect(missing).toContain('24');expect(waiting).toContain('24');expect(missing).not.toBe(waiting);
 expect(securityActionErrorText(locale,new Error('security_fresh_login_required'))).toBeTruthy();
 expect(securityActionErrorText(locale,new Error('passkey_unavailable'))).toBeTruthy();
});
