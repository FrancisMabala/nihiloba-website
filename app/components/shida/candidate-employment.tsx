"use client";

import Link from "next/link";
import { PersonalWhatsAppLogin } from "./personal-whatsapp-login";
import { useEffect, useState, useRef } from "react";
import {
  EmploymentBrowserError,
  endEmploymentSession,
  loadCandidateApplication,
  loadCandidateApplications,
  restoreEmploymentSession,
} from "../../services/shida/employment-browser-client";
import type { CandidateApplication, EmploymentApplicationStatus, EmploymentSession } from "../../types/shida-employment";
import type {MarketplaceLocale as Locale} from "./marketplace-account-copy";
import {applicationStatus} from "../../lib/personal-activity";
import {workspaceText} from "../../lib/personal-workspace-copy";

const baseCopy = {
  en: {
    eyebrow: "Private candidate space", title: "My applications", intro: "Follow your SHIDA applications and private recruitment updates.",
    signIn: "Sign in with SHIDA", signInHelp: "Use the WhatsApp number connected to your SHIDA account. Your number is sent securely for authentication and is never shown on this page.",
    phone: "WhatsApp number", send: "Send verification code", code: "Six-digit code", verify: "Verify and continue", another: "Use another number",
    codeSent: "A verification code was sent through WhatsApp if this account can use the dashboard.", genericError: "The candidate space is temporarily unavailable. Please try again.", invalidCode: "The code is invalid or expired.", rate: "Please wait before trying again.",
    signedIn: "Signed in as", signOut: "Sign out", retry: "Try again", empty: "You have no applications yet.", browse: "Browse jobs", applied: "Applied", employer: "Organisation", status: "Status", open: "View application",
    profiles: "Candidate profiles", profilesText: "Manage your professional and occasional-work profiles with SHIDA on WhatsApp.",
    professional: "Professional profile", occasional: "Occasional-work profile", oneEach: "One profile maximum for each type", notAvailable: "Website editing not yet available",
    timeline: "Status timeline", messages: "Private messages", noMessages: "No private messages yet.", interview: "Interview proposal", email: "Direct email communication", back: "Back to my applications",
    unavailable: "This application is unavailable. For privacy, we cannot confirm whether an unknown reference exists.", sessionExpired: "Your session has expired. Sign in again to continue.",
    emailPending: "Awaiting your consent", emailAccepted: "Accepted", emailDeclined: "Declined", emailNone: "No email handoff proposed", fromYou: "You", fromRecruiter: "Recruiter", system: "SHIDA",
    actionsDeferred: "Follow updates here. Continue any requested response through your existing SHIDA recruitment conversation.",
  },
  fr: {
    eyebrow: "Espace candidat privé", title: "Mes candidatures", intro: "Suivez vos candidatures SHIDA et vos mises à jour de recrutement privées.",
    signIn: "Se connecter avec SHIDA", signInHelp: "Utilisez le numéro WhatsApp associé à votre compte SHIDA. Votre numéro est transmis de façon sécurisée pour l’authentification et n’est jamais affiché sur cette page.",
    phone: "Numéro WhatsApp", send: "Envoyer le code de vérification", code: "Code à six chiffres", verify: "Vérifier et continuer", another: "Utiliser un autre numéro",
    codeSent: "Un code de vérification a été envoyé sur WhatsApp si ce compte peut utiliser le tableau de bord.", genericError: "L’espace candidat est temporairement indisponible. Réessayez.", invalidCode: "Le code est invalide ou expiré.", rate: "Veuillez patienter avant de réessayer.",
    signedIn: "Connecté en tant que", signOut: "Se déconnecter", retry: "Réessayer", empty: "Vous n’avez encore aucune candidature.", browse: "Voir les offres", applied: "Candidature envoyée", employer: "Organisation", status: "Statut", open: "Voir la candidature",
    profiles: "Profils candidat", profilesText: "Gérez vos profils professionnels et de travail occasionnel avec SHIDA sur WhatsApp.",
    professional: "Profil professionnel", occasional: "Profil de travail occasionnel", oneEach: "Un profil maximum pour chaque type", notAvailable: "Modification web pas encore disponible",
    timeline: "Historique du statut", messages: "Messages privés", noMessages: "Aucun message privé pour le moment.", interview: "Proposition d’entretien", email: "Communication directe par e-mail", back: "Retour à mes candidatures",
    unavailable: "Cette candidature est indisponible. Pour protéger la confidentialité, nous ne confirmons pas l’existence d’une référence inconnue.", sessionExpired: "Votre session a expiré. Reconnectez-vous pour continuer.",
    emailPending: "Votre consentement est attendu", emailAccepted: "Acceptée", emailDeclined: "Refusée", emailNone: "Aucun transfert par e-mail proposé", fromYou: "Vous", fromRecruiter: "Recruteur", system: "SHIDA",
    actionsDeferred: "Suivez les mises à jour ici. Répondez dans votre conversation de recrutement SHIDA lorsqu’une réponse est demandée.",
  },
} as const;

const copy = {...baseCopy,
 ln:{...baseCopy.fr,eyebrow:'Esika ya candidat',title:'Candidatures na ngai',intro:'Landa candidatures mpe bamesaje ya mosala na yo.',genericError:'Tokoki kofungola esika oyo te. Meka lisusu.',signedIn:'Okoti lokola',signOut:'Bima',retry:'Meka lisusu',empty:'Ozali naino na candidature te.',browse:'Tala misala',applied:'Etindami',employer:'Mopesi mosala',status:'Ezali ndenge nini',open:'Tala candidature',profiles:'Profils ya candidat',profilesText:'Bongisa profils na yo ya mosala na SHIDA na WhatsApp.',professional:'Profil professionnel',occasional:'Profil ya mosala ya mwa ntango',oneEach:'Profil moko mpo na lolenge moko',notAvailable:'Kobongisa na web ezali naino te',timeline:'Bolandi ya candidature',messages:'Bamesaje ya sekele',noMessages:'Bamesaje ezali naino te.',interview:'Bosengi ya entretien',email:'Masolo na e-mail',back:'Zonga na candidatures na ngai',unavailable:'Candidature oyo ekoki komonana te.',emailPending:'Kozela ndingisa na yo',emailAccepted:'Endimami',emailDeclined:'Eboyami',emailNone:'Bosengi ya e-mail ezali te',fromYou:'Yo',fromRecruiter:'Mopesi mosala',system:'SHIDA',actionsDeferred:'Landa makambo awa. Yanola na lisolo ya recrutement na SHIDA soki basengi eyano.'},
 sw:{...baseCopy.en,eyebrow:'Eneo la mwombaji',title:'Maombi yangu ya kazi',intro:'Fuatilia maombi yako na ujumbe wa ajira.',genericError:'Eneo hili halipatikani kwa sasa. Jaribu tena.',signedIn:'Umeingia kama',signOut:'Toka',retry:'Jaribu tena',empty:'Bado huna maombi ya kazi.',browse:'Tafuta kazi',applied:'Limetumwa',employer:'Mwajiri',status:'Hali',open:'Angalia ombi',profiles:'Wasifu wa mwombaji',profilesText:'Simamia wasifu wako wa kazi kupitia SHIDA kwenye WhatsApp.',professional:'Wasifu wa kitaaluma',occasional:'Wasifu wa kazi za muda',oneEach:'Wasifu mmoja kwa kila aina',notAvailable:'Uhariri kwenye tovuti bado haupatikani',timeline:'Historia ya hali',messages:'Ujumbe binafsi',noMessages:'Bado hakuna ujumbe binafsi.',interview:'Pendekezo la mahojiano',email:'Mawasiliano kwa barua pepe',back:'Rudi kwenye maombi yangu',unavailable:'Ombi hili halipatikani.',emailPending:'Inasubiri ruhusa yako',emailAccepted:'Imekubaliwa',emailDeclined:'Imekataliwa',emailNone:'Hakuna mawasiliano ya barua pepe yaliyopendekezwa',fromYou:'Wewe',fromRecruiter:'Mwajiri',system:'SHIDA',actionsDeferred:'Fuatilia taarifa hapa. Jibu katika mazungumzo yako ya ajira ya SHIDA unapoombwa.'}
};
export function candidateApplicationsPath(locale: Locale): string { return locale === "fr" ? "/fr/shida/mes-candidatures" : `${locale==="en"?"":`/${locale}`}/shida/my-applications`; }
export function candidateApplicationPath(locale: Locale, reference: string): string { return `${candidateApplicationsPath(locale)}/${encodeURIComponent(reference)}`; }
export function candidateStatusLabel(locale: Locale, status: EmploymentApplicationStatus): string { return applicationStatus(locale,status); }
function displayDate(value: string | null, locale: Locale): string | null { if (!value) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(locale === "fr" ? "fr-CD" : "en-CD", { dateStyle: "medium" }).format(date); }

export function CandidateApplicationsView({ locale, applications }: { locale: Locale; applications: CandidateApplication[] }) {
  const t = copy[locale];
  if (!applications.length) return <div className="candidate-empty"><p>{t.empty}</p><Link className="button button-primary" href={`${locale==="en"?"":`/${locale}`}/shida/emplois`}>{t.browse}</Link></div>;
  return <div className="candidate-application-list">{applications.map((item) => <article className="candidate-application-card" key={item.reference}><div><span className={`candidate-status candidate-status-${item.status}`}>{candidateStatusLabel(locale, item.status)}</span><h2>{item.job_title}</h2><p>{item.employer_name}</p></div><dl><div><dt>{t.applied}</dt><dd>{displayDate(item.created_at, locale) ?? "—"}</dd></div><div><dt>{t.status}</dt><dd>{candidateStatusLabel(locale, item.status)}</dd></div></dl><Link className="button button-secondary" href={candidateApplicationPath(locale, item.reference)}>{t.open}</Link></article>)}</div>;
}

export function CandidateApplicationDetailView({ locale, application }: { locale: Locale; application: CandidateApplication }) {
  const t = copy[locale];
  const emailLabel = application.email_handoff_status === "accepted" ? t.emailAccepted : application.email_handoff_status === "declined" ? t.emailDeclined : application.email_handoff_status === "proposed" ? t.emailPending : t.emailNone;
  const hasInterview = Object.values(application.interview).some(Boolean);
  return <div className="candidate-detail-grid"><main className="candidate-detail-main"><section className="candidate-private-panel"><h2>{t.timeline}</h2><ol className="candidate-timeline">{application.status_history.length ? application.status_history.map((item, index) => <li key={`${item.status}-${item.created_at ?? index}`}><strong>{candidateStatusLabel(locale, item.status)}</strong><span>{displayDate(item.created_at, locale)}</span></li>) : <li><strong>{candidateStatusLabel(locale, application.status)}</strong><span>{displayDate(application.created_at, locale)}</span></li>}</ol></section><section className="candidate-private-panel"><h2>{t.messages}</h2>{application.messages.length ? <div className="candidate-messages">{application.messages.map((message, index) => <article className={`candidate-message candidate-message-${message.sender}`} key={`${message.created_at ?? "message"}-${index}`}><strong>{message.sender === "you" ? t.fromYou : message.sender === "other" ? t.fromRecruiter : t.system}</strong><p>{message.body}</p><time>{displayDate(message.created_at, locale)}</time></article>)}</div> : <p>{t.noMessages}</p>}</section></main><aside className="candidate-detail-aside"><section className="candidate-private-panel"><h2>{t.interview}</h2>{hasInterview ? <dl><Detail label={locale === "fr" ? "Date" : "Date"} value={application.interview.date}/><Detail label={locale === "fr" ? "Heure" : "Time"} value={application.interview.time}/><Detail label={locale === "fr" ? "Lieu" : "Location"} value={application.interview.location}/><Detail label={locale === "fr" ? "Informations" : "Notes"} value={application.interview.notes}/></dl> : <p>—</p>}</section><section className="candidate-private-panel"><h2>{t.email}</h2><p>{emailLabel}</p>{application.email_handoff_contact && <a href={`mailto:${application.email_handoff_contact.recruiter_email}`}>{application.email_handoff_contact.recruiter_email}</a>}</section><p className="candidate-authority-note">{t.actionsDeferred}</p></aside></div>;
}

function Detail({ label, value }: { label: string; value: string | null }) { return value ? <div><dt>{label}</dt><dd>{value}</dd></div> : null; }

export function CandidateEmploymentWorkspace({ locale, applicationReference }: { locale: Locale; applicationReference?: string }) {
  const t = copy[locale]; const [session, setSession] = useState<EmploymentSession | null>(null); const [applications, setApplications] = useState<CandidateApplication[] | null>(null); const [application, setApplication] = useState<CandidateApplication | null>(null); const [state, setState] = useState<"loading" | "login" | "ready" | "not-found" | "error">("loading");
  const signedOut = useRef(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const load = () => setRefreshVersion(value => value + 1);
  useEffect(() => {
    let active = true, generation = 0, authenticated = false;
    const refresh = () => {
      if (signedOut.current) return;
      const epoch = ++generation;
      setSession(null); setApplications(null); setApplication(null); setState("loading");
      void restoreEmploymentSession().then(async current => {
        const detail = applicationReference ? await loadCandidateApplication(applicationReference) : null;
        const list = applicationReference ? null : await loadCandidateApplications();
        if (!active || epoch !== generation) return;
        authenticated = true;
        setSession(current); setApplication(detail); setApplications(list); setState("ready");
      }).catch(error => {
        if (!active || epoch !== generation) return;
        setState(error instanceof EmploymentBrowserError && error.status === 401 ? "login" : error instanceof EmploymentBrowserError && error.status === 404 ? "not-found" : "error");
      });
    };
    const storage = (event: StorageEvent) => { if (event.key === "shida-personal-session-changed") refresh(); };
    refresh();
    window.addEventListener("shida-personal-session-changed", refresh);
    window.addEventListener("storage", storage);
    const focus = () => { if (authenticated) refresh(); };
    window.addEventListener("focus", focus);
    return () => { active = false; ++generation; window.removeEventListener("shida-personal-session-changed", refresh); window.removeEventListener("storage", storage); window.removeEventListener("focus", focus); };
  }, [applicationReference, refreshVersion]);
  async function logout() { signedOut.current = true; setSession(null); setApplications(null); setApplication(null); setState("login"); try { await endEmploymentSession(); } finally { setSession(null); setApplications(null); setApplication(null); setState("login"); } }
  return <><section className="candidate-employment-hero"><div className="container"><p><Link href={`${locale==="en"?"":`/${locale}`}/shida/space?view=requests`}>← {workspaceText(locale,"back")}</Link></p><span className="eyebrow">{t.eyebrow}</span><h1>{application?.job_title ?? t.title}</h1><p>{application ? application.employer_name : t.intro}</p>{application && <><span className={`candidate-status candidate-status-${application.status}`}>{candidateStatusLabel(locale, application.status)}</span><p><Link href={candidateApplicationsPath(locale)}>{t.back}</Link></p></>}{session && <div className="candidate-session"><span>{t.signedIn} <strong>{session.display_name}</strong></span><button type="button" onClick={logout}>{t.signOut}</button></div>}</div></section><section className="section candidate-employment-section"><div className="container">{state === "loading" && <div className="candidate-skeleton" aria-label={locale === "fr" ? "Chargement" : "Loading"}><span/><span/><span/></div>}{state === "login" && <PersonalWhatsAppLogin locale={locale} onAuthenticated={() => { signedOut.current = false; setState("loading"); void load(); }}/>} {state === "error" && <div className="candidate-private-panel candidate-state"><p>{t.genericError}</p><button className="button button-secondary" onClick={() => { setState("loading"); void load(); }}>{t.retry}</button></div>}{state === "not-found" && <div className="candidate-private-panel candidate-state"><p>{t.unavailable}</p><Link className="button button-secondary" href={candidateApplicationsPath(locale)}>{t.back}</Link></div>}{state === "ready" && !applicationReference && applications && <><details className="candidate-profiles"><summary>{t.profiles}</summary><section className="candidate-profile-overview"><div><h2>{t.profiles}</h2><p>{t.profilesText}</p></div><article><strong>{t.professional}</strong><span>{t.oneEach}</span><small>{t.notAvailable}</small></article><article><strong>{t.occasional}</strong><span>{t.oneEach}</span><small>{t.notAvailable}</small></article></section></details><CandidateApplicationsView locale={locale} applications={applications}/></>}{state === "ready" && application && <CandidateApplicationDetailView locale={locale} application={application}/>}</div></section></>;
}
