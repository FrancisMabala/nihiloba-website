export type IndividualEligibility = 'loading'|'open'|'profile'|'signin'|'owner'|'closed'|'expired'|'disabled'|'unavailable'|'error'|'applied';

// A start date is descriptive, not an application deadline.
export function listingEligibility(lifecycle: string, available: boolean): IndividualEligibility {
  if (lifecycle === 'expired') return 'expired';
  if (['closed','archived','source_invalid'].includes(lifecycle)) return 'closed';
  return available ? 'loading' : 'disabled';
}
export function eligibilityFailure(status: number, code?: string): IndividualEligibility {
  if (status === 401 || status === 403) return 'signin';
  if (status === 404) return 'unavailable';
  if (status === 409) {
    const reasons: Record<string, IndividualEligibility> = {mission_self_application:'owner',mission_application_closed:'closed',mission_application_expired:'expired',mission_application_disabled:'disabled'};
    if (code && reasons[code]) return reasons[code];
  }
  return 'error';
}
export const individualEligibilityCopy = {
  fr: {loading:'Vérification des candidatures…',open:'Candidatures ouvertes',profile:'Un profil occasionnel est nécessaire pour postuler.',signin:'Connectez-vous pour poursuivre votre candidature.',owner:'Vous avez publié cette offre.',closed:'Candidatures fermées',expired:'Offre expirée',disabled:'Candidatures indisponibles sur SHIDA.',unavailable:'Cette candidature n’est plus accessible.',error:'Impossible de vérifier les candidatures.',applied:'Vous avez déjà postulé.',retry:'Réessayer',manage:'Gérer mon annonce',profileAction:'Compléter mon profil',signinAction:'Se connecter',schedule:'Horaires',start:'Début'},
  en: {loading:'Checking applications…',open:'Applications open',profile:'An occasional-work profile is required to apply.',signin:'Sign in to continue your application.',owner:'You posted this offer.',closed:'Applications closed',expired:'Offer expired',disabled:'Applications unavailable on SHIDA.',unavailable:'This application is no longer accessible.',error:'Unable to check applications.',applied:'You have already applied.',retry:'Retry',manage:'Manage my listing',profileAction:'Complete my profile',signinAction:'Sign in',schedule:'Schedule',start:'Start'},
  ln: {loading:'Kotala soki bosɛngi ezali kosalema…',open:'Bosɛngi efungwami',profile:'Profil ya mosala ya mwa ntango esengeli mpo na kosɛnga.',signin:'Kɔtá mpo na kokoba bosɛngi na yo.',owner:'Yo nde opesi liyebisi oyo.',closed:'Bosɛngi ekangami',expired:'Ntango ya liyebisi esili',disabled:'Bosɛngi ezali kosalema te na SHIDA.',unavailable:'Okoki lisusu kokɔta na bosɛngi oyo te.',error:'Tokoki te kotala soki bosɛngi ezali kosalema.',applied:'Osɛngaki mosala oyo.',retry:'Meka lisusu',manage:'Tambwisa liyebisi na ngai',profileAction:'Tondisa profil na ngai',signinAction:'Kɔtá',schedule:'Bangonga',start:'Ebandeli'},
  sw: {loading:'Kukagua maombi…',open:'Maombi yamefunguliwa',profile:'Wasifu wa kazi za muda unahitajika kuomba.',signin:'Ingia ili kuendelea na ombi lako.',owner:'Ulichapisha tangazo hili.',closed:'Maombi yamefungwa',expired:'Muda wa tangazo umeisha',disabled:'Maombi hayapatikani kwenye SHIDA.',unavailable:'Ombi hili halipatikani tena.',error:'Imeshindikana kukagua maombi.',applied:'Tayari umetuma ombi.',retry:'Jaribu tena',manage:'Simamia tangazo langu',profileAction:'Kamilisha wasifu wangu',signinAction:'Ingia',schedule:'Ratiba',start:'Mwanzo'},
} as const;
