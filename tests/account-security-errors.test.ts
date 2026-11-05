import {it,expect} from 'vitest';
import {SecurityActionError,securityActionErrorText} from '../app/lib/account-security-errors';
it.each(['en','fr','ln','sw'] as const)('explains rate limits and delivery separately in %s',locale=>{
 const rate=securityActionErrorText(locale,new SecurityActionError('security_rate_limited',61));
 expect(rate).toContain('2');
 expect(securityActionErrorText(locale,new SecurityActionError('security_rate_limited',null))).not.toContain('NaN');
 const delivery=securityActionErrorText(locale,new Error('security_email_delivery_unavailable'));
 expect(delivery).toBeTruthy();expect(delivery).not.toBe(rate);
 const cancelled=new Error('private browser diagnostic');cancelled.name='NotAllowedError';
 expect(securityActionErrorText(locale,cancelled)).toBeTruthy();
 expect(securityActionErrorText(locale,cancelled)).not.toContain('private');
 expect(securityActionErrorText(locale,new Error('unknown diagnostic'))).toBeNull();
});
it('rounds the wait up and does not mistake cancellation for delivery failure',()=>{
 expect(securityActionErrorText('fr',new SecurityActionError('security_rate_limited',1))).toContain('1 minute');
 expect(securityActionErrorText('fr',new Error('passkey_cancelled'))).toContain('existante');
 expect(securityActionErrorText('fr',new Error('security_email_delivery_unavailable'))).toContain('Aucun code');
});
