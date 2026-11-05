type Locale = 'en' | 'fr' | 'ln' | 'sw';
export class SecurityActionError extends Error {
  constructor(code: string, readonly retryAfter?: number | null) { super(code); }
}

/** Public explanations only: never display upstream mail or authentication diagnostics. */
export function securityActionErrorText(locale: Locale, error: unknown): string | null {
  const code = error instanceof Error ? error.message : '';
  const index = {en:0,fr:1,ln:2,sw:3}[locale];
  if (code === 'security_rate_limited') {
    const seconds = error instanceof SecurityActionError ? error.retryAfter : null;
    const minutes = typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0 && seconds <= 86400 ? Math.ceil(seconds / 60) : null;
    return minutes ? [
      `Too many security attempts. Wait ${minutes} minute(s) before trying again. Refreshing does not reset this limit.`,
      `Trop de tentatives de sécurité. Attendez ${minutes} minute(s) avant de réessayer. Actualiser la page ne réinitialise pas cette limite.`,
      `Bomeki ya bobateli eleki. Zela miniti ${minutes} liboso ya komeka lisusu. Kozongela lokasa elongolaka ndelo oyo te.`,
      `Majaribio mengi ya usalama. Subiri dakika ${minutes} kabla ya kujaribu tena. Kusasisha ukurasa hakuondoi kikomo hiki.`,
    ][index] : [
      'Too many security attempts. Try again later. Refreshing does not reset this limit.',
      'Trop de tentatives de sécurité. Réessayez plus tard. Actualiser la page ne réinitialise pas cette limite.',
      'Bomeki ya bobateli eleki. Meka sima. Kozongela lokasa elongolaka ndelo oyo te.',
      'Majaribio mengi ya usalama. Jaribu baadaye. Kusasisha ukurasa hakuondoi kikomo hiki.',
    ][index];
  }
  if (code === 'security_email_delivery_unavailable') return [
    'SHIDA could not send the verification email. No code was sent. This is an email delivery problem, not a retry limit. Try later; if it continues, contact SHIDA support.',
    'SHIDA n’a pas pu envoyer l’e-mail de vérification. Aucun code n’a été envoyé. Il s’agit d’un problème d’envoi d’e-mail, pas d’une limite de tentatives. Réessayez plus tard ; si le problème persiste, contactez l’assistance SHIDA.',
    'SHIDA ekoki kotinda e-mail ya kondimisa te. Kode etindami te. Ezali mokakatano ya kotinda e-mail, ndelo ya bomeki te. Meka sima; soki ekobi, solola na lisungi SHIDA.',
    'SHIDA haikuweza kutuma barua pepe ya uthibitisho. Hakuna msimbo uliotumwa. Hili ni tatizo la kutuma barua pepe, si kikomo cha majaribio. Jaribu baadaye; likiendelea, wasiliana na msaada wa SHIDA.',
  ][index];
  if (code === 'passkey_cancelled' || (error instanceof Error && error.name === 'NotAllowedError')) return [
    'Passkey verification did not complete. It may have been cancelled, timed out, or unavailable on this device. Try with your existing passkey.',
    'La vérification par clé d’accès n’a pas abouti : annulation, délai dépassé ou clé indisponible sur cet appareil. Réessayez avec votre clé existante.',
    'Kondimisa na fungola esili te: elongolami, ntango esili to fungola ezali te na apareyi oyo. Meka na fungola na yo oyo ezali.',
    'Uthibitisho wa ufunguo haukukamilika: huenda ulighairiwa, muda uliisha au ufunguo haupatikani kwenye kifaa hiki. Jaribu ufunguo wako uliopo.',
  ][index];
  return null;
}
