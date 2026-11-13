'use client';

import {useEffect, useRef, useState} from 'react';
import {jobSearchRequest, JobSearchError} from '../../lib/job-search-api';
import {LOGIN_EVENT} from '../../lib/personal-login-browser';
import {PERSONAL_SESSION_EVENT, PersonalSessionError, restorePersonalSession} from '../../lib/personal-session-browser';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';

const labels = {
  fr: {apply:'Postuler auprès du recruteur', signIn:'Connectez-vous pour voir les coordonnées de recrutement.', email:'Envoyer un e-mail', phone:'Appeler', busy:'Chargement…', closed:'Les coordonnées ne sont plus disponibles pour cette offre.', error:'Impossible de charger les coordonnées. Réessayez.'},
  en: {apply:'Apply with the recruiter', signIn:'Sign in to see the recruitment contact details.', email:'Send an email', phone:'Call', busy:'Loading…', closed:'Recruitment contacts are no longer available for this offer.', error:'Could not load the recruitment contacts. Please try again.'},
  ln: {apply:'Sɛngá mosala epai ya mopesi mosala', signIn:'Kɔtá na konti na yo mpo na komona ndenge ya kosolola na mopesi mosala.', email:'Tindá e-mail', phone:'Bengá', busy:'Ezali kofungwama…', closed:'Okoki lisusu te kozwa e-mail to telefone mpo na mosala oyo.', error:'E-mail mpe telefone emonani te. Meká lisusu.'},
  sw: {apply:'Omba kazi kwa mwajiri', signIn:'Ingia ili uone mawasiliano ya mwajiri.', email:'Tuma barua pepe', phone:'Piga simu', busy:'Inapakia…', closed:'Mawasiliano hayapatikani tena kwa nafasi hii.', error:'Mawasiliano hayakuweza kupakiwa. Jaribu tena.'},
};

type Contact = {email: string | null; phone: string | null};

export function RecruitmentContact({locale, reference}: {locale: keyof typeof labels; reference: string}) {
  const t = labels[locale];
  const [contact, setContact] = useState<Contact | null>(null);
  const [phase, setPhase] = useState<'ready'|'busy'|'guest'|'closed'|'error'>('ready');
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    function reset() {
      pending.current?.abort();
      pending.current = null;
      setContact(null);
      setPhase(current => current === 'guest' ? 'guest' : 'ready');
    }
    function onStorage(event: StorageEvent) {
      if (event.key === PERSONAL_SESSION_EVENT || event.key === LOGIN_EVENT || event.key === null) reset();
    }
    window.addEventListener(PERSONAL_SESSION_EVENT, reset);
    window.addEventListener(LOGIN_EVENT, reset);
    window.addEventListener('storage', onStorage);
    window.addEventListener('pagehide', reset);
    return () => {
      pending.current?.abort();
      window.removeEventListener(PERSONAL_SESSION_EVENT, reset);
      window.removeEventListener(LOGIN_EVENT, reset);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pagehide', reset);
    };
  }, []);

  async function apply() {
    if (pending.current) return;
    const request = new AbortController();
    pending.current = request;
    setPhase('busy');
    try {
      const session = await restorePersonalSession(request.signal);
      const result = await jobSearchRequest<Contact>(session.binding, locale,
        'jobs/'+encodeURIComponent(reference)+'/recruitment-contact', 'POST', undefined, request.signal);
      if (!request.signal.aborted) {setContact(result); setPhase('ready');}
    } catch (error) {
      if (request.signal.aborted) return;
      const status = error instanceof JobSearchError || error instanceof PersonalSessionError ? error.status : 0;
      setPhase(status === 401 ? 'guest' : status === 404 || status === 409 ? 'closed' : 'error');
    } finally {
      if (pending.current === request) pending.current = null;
    }
  }
  if (contact) return <div className="job-external-action" role="status">
    {contact.email && <div><p>{contact.email}</p><a className="button button-primary" href={'mailto:'+encodeURIComponent(contact.email).replace('%40','@')}>{t.email}</a></div>}
    {contact.phone && <p><a href={'tel:'+contact.phone}>{t.phone} · {contact.phone}</a></p>}
  </div>;
  if (phase === 'guest') return <div className="job-action-login"><p>{t.signIn}</p>
    <PersonalWhatsAppLogin locale={locale} onAuthenticated={() => setPhase('ready')}/></div>;
  if (phase === 'closed') return <p role="status">{t.closed}</p>;
  return <div className="job-external-action">
    <button type="button" className="button button-primary" disabled={phase==='busy'} onClick={() => void apply()}>{phase==='busy' ? t.busy : t.apply}</button>
    {phase==='error' && <p role="alert">{t.error}</p>}
  </div>;
}
