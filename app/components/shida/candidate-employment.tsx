"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  beginEmploymentLogin,
  completeEmploymentLogin,
  EmploymentBrowserError,
  endEmploymentSession,
  loadCandidateApplication,
  loadCandidateApplications,
  restoreEmploymentSession,
} from "../../services/shida/employment-browser-client";
import type { CandidateApplication, EmploymentApplicationStatus, EmploymentSession } from "../../types/shida-employment";
import type { Locale } from "../../lib/i18n";

const copy = {
  en: {
    eyebrow: "Private candidate space", title: "My applications", intro: "Follow your SHIDA applications and private recruitment updates.",
    signIn: "Sign in with SHIDA", signInHelp: "Use the WhatsApp number connected to your SHIDA account. Your number is sent securely for authentication and is never shown on this page.",
    phone: "WhatsApp number", send: "Send verification code", code: "Six-digit code", verify: "Verify and continue", another: "Use another number",
    codeSent: "A verification code was sent through WhatsApp if this account can use the dashboard.", genericError: "The candidate space is temporarily unavailable. Please try again.", invalidCode: "The code is invalid or expired.", rate: "Please wait before trying again.",
    signedIn: "Signed in as", signOut: "Sign out", retry: "Try again", empty: "You have no applications yet.", browse: "Browse jobs", applied: "Applied", employer: "Organisation", status: "Status", open: "View application",
    profiles: "Candidate profiles", profilesText: "Professional and occasional-work profiles remain managed in SHIDA on WhatsApp until the backend provides a private profile read/edit API for the website.",
    professional: "Professional profile", occasional: "Occasional-work profile", oneEach: "One profile maximum for each type", notAvailable: "Website editing not yet available",
    timeline: "Status timeline", messages: "Private messages", noMessages: "No private messages yet.", interview: "Interview proposal", email: "Direct email communication", back: "Back to my applications",
    unavailable: "This application is unavailable. For privacy, we cannot confirm whether an unknown reference exists.", sessionExpired: "Your session has expired. Sign in again to continue.",
    emailPending: "Awaiting your consent", emailAccepted: "Accepted", emailDeclined: "Declined", emailNone: "No email handoff proposed", fromYou: "You", fromRecruiter: "Recruiter", system: "SHIDA",
    actionsDeferred: "Application actions will appear here when the backend returns authoritative allowed actions. Status changes are never inferred by the website.",
  },
  fr: {
    eyebrow: "Espace candidat privé", title: "Mes candidatures", intro: "Suivez vos candidatures SHIDA et vos mises à jour de recrutement privées.",
    signIn: "Se connecter avec SHIDA", signInHelp: "Utilisez le numéro WhatsApp associé à votre compte SHIDA. Votre numéro est transmis de façon sécurisée pour l’authentification et n’est jamais affiché sur cette page.",
    phone: "Numéro WhatsApp", send: "Envoyer le code de vérification", code: "Code à six chiffres", verify: "Vérifier et continuer", another: "Utiliser un autre numéro",
    codeSent: "Un code de vérification a été envoyé sur WhatsApp si ce compte peut utiliser le tableau de bord.", genericError: "L’espace candidat est temporairement indisponible. Réessayez.", invalidCode: "Le code est invalide ou expiré.", rate: "Veuillez patienter avant de réessayer.",
    signedIn: "Connecté en tant que", signOut: "Se déconnecter", retry: "Réessayer", empty: "Vous n’avez encore aucune candidature.", browse: "Voir les offres", applied: "Candidature envoyée", employer: "Organisation", status: "Statut", open: "Voir la candidature",
    profiles: "Profils candidat", profilesText: "Les profils professionnels et de travail occasionnel restent gérés dans SHIDA sur WhatsApp jusqu’à ce que le backend fournisse une API privée de consultation et de modification pour le site.",
    professional: "Profil professionnel", occasional: "Profil de travail occasionnel", oneEach: "Un profil maximum pour chaque type", notAvailable: "Modification web pas encore disponible",
    timeline: "Historique du statut", messages: "Messages privés", noMessages: "Aucun message privé pour le moment.", interview: "Proposition d’entretien", email: "Communication directe par e-mail", back: "Retour à mes candidatures",
    unavailable: "Cette candidature est indisponible. Pour protéger la confidentialité, nous ne confirmons pas l’existence d’une référence inconnue.", sessionExpired: "Votre session a expiré. Reconnectez-vous pour continuer.",
    emailPending: "Votre consentement est attendu", emailAccepted: "Acceptée", emailDeclined: "Refusée", emailNone: "Aucun transfert par e-mail proposé", fromYou: "Vous", fromRecruiter: "Recruteur", system: "SHIDA",
    actionsDeferred: "Les actions apparaîtront ici lorsque le backend renverra les actions autorisées. Le site ne déduit jamais les changements de statut.",
  },
} as const;

const statusLabels: Record<Locale, Record<EmploymentApplicationStatus, string>> = {
  en: { received: "Received", under_review: "Under review", shortlisted: "Shortlisted", interview_proposed: "Interview proposed", interview_confirmed: "Interview confirmed", offered: "Offered", hired: "Hired", rejected: "Rejected", withdrawn: "Withdrawn", closed: "Closed" },
  fr: { received: "Reçue", under_review: "En cours d’examen", shortlisted: "Présélectionnée", interview_proposed: "Entretien proposé", interview_confirmed: "Entretien confirmé", offered: "Offre reçue", hired: "Embauché", rejected: "Refusée", withdrawn: "Retirée", closed: "Clôturée" },
};

export function candidateApplicationsPath(locale: Locale): string { return locale === "fr" ? "/fr/shida/mes-candidatures" : "/shida/my-applications"; }
export function candidateApplicationPath(locale: Locale, reference: string): string { return `${candidateApplicationsPath(locale)}/${encodeURIComponent(reference)}`; }
export function candidateStatusLabel(locale: Locale, status: EmploymentApplicationStatus): string { return statusLabels[locale][status]; }
function displayDate(value: string | null, locale: Locale): string | null { if (!value) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(locale === "fr" ? "fr-CD" : "en-CD", { dateStyle: "medium" }).format(date); }

export function CandidateApplicationsView({ locale, applications }: { locale: Locale; applications: CandidateApplication[] }) {
  const t = copy[locale];
  if (!applications.length) return <div className="candidate-empty"><p>{t.empty}</p><Link className="button button-primary" href={locale === "fr" ? "/fr/shida/emplois" : "/shida/emplois"}>{t.browse}</Link></div>;
  return <div className="candidate-application-list">{applications.map((item) => <article className="candidate-application-card" key={item.reference}><div><span className={`candidate-status candidate-status-${item.status}`}>{candidateStatusLabel(locale, item.status)}</span><h2>{item.job_title}</h2><p>{item.employer_name}</p></div><dl><div><dt>{t.applied}</dt><dd>{displayDate(item.created_at, locale) ?? "—"}</dd></div><div><dt>{t.status}</dt><dd>{candidateStatusLabel(locale, item.status)}</dd></div></dl><Link className="button button-secondary" href={candidateApplicationPath(locale, item.reference)}>{t.open}</Link></article>)}</div>;
}

export function CandidateApplicationDetailView({ locale, application }: { locale: Locale; application: CandidateApplication }) {
  const t = copy[locale];
  const emailLabel = application.email_handoff_status === "accepted" ? t.emailAccepted : application.email_handoff_status === "declined" ? t.emailDeclined : application.email_handoff_status === "proposed" ? t.emailPending : t.emailNone;
  const hasInterview = Object.values(application.interview).some(Boolean);
  return <div className="candidate-detail-grid"><main className="candidate-detail-main"><section className="candidate-private-panel"><h2>{t.timeline}</h2><ol className="candidate-timeline">{application.status_history.length ? application.status_history.map((item, index) => <li key={`${item.status}-${item.created_at ?? index}`}><strong>{candidateStatusLabel(locale, item.status)}</strong><span>{displayDate(item.created_at, locale)}</span></li>) : <li><strong>{candidateStatusLabel(locale, application.status)}</strong><span>{displayDate(application.created_at, locale)}</span></li>}</ol></section><section className="candidate-private-panel"><h2>{t.messages}</h2>{application.messages.length ? <div className="candidate-messages">{application.messages.map((message, index) => <article className={`candidate-message candidate-message-${message.sender}`} key={`${message.created_at ?? "message"}-${index}`}><strong>{message.sender === "you" ? t.fromYou : message.sender === "other" ? t.fromRecruiter : t.system}</strong><p>{message.body}</p><time>{displayDate(message.created_at, locale)}</time></article>)}</div> : <p>{t.noMessages}</p>}</section></main><aside className="candidate-detail-aside"><section className="candidate-private-panel"><h2>{t.interview}</h2>{hasInterview ? <dl><Detail label={locale === "fr" ? "Date" : "Date"} value={application.interview.date}/><Detail label={locale === "fr" ? "Heure" : "Time"} value={application.interview.time}/><Detail label={locale === "fr" ? "Lieu" : "Location"} value={application.interview.location}/><Detail label={locale === "fr" ? "Informations" : "Notes"} value={application.interview.notes}/></dl> : <p>—</p>}</section><section className="candidate-private-panel"><h2>{t.email}</h2><p>{emailLabel}</p>{application.email_handoff_contact && <a href={`mailto:${application.email_handoff_contact.recruiter_email}`}>{application.email_handoff_contact.recruiter_email}</a>}</section><p className="candidate-authority-note">{t.actionsDeferred}</p></aside></div>;
}

function Detail({ label, value }: { label: string; value: string | null }) { return value ? <div><dt>{label}</dt><dd>{value}</dd></div> : null; }

function LoginPanel({ locale, onAuthenticated }: { locale: Locale; onAuthenticated: (session: EmploymentSession) => void }) {
  const t = copy[locale]; const [challenge, setChallenge] = useState<string | null>(null); const [pending, setPending] = useState(false); const [message, setMessage] = useState<string | null>(null);
  async function submitPhone(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setMessage(null); const data = new FormData(event.currentTarget); try { setChallenge(await beginEmploymentLogin(String(data.get("phone") ?? ""))); setMessage(t.codeSent); } catch (error) { setMessage(error instanceof EmploymentBrowserError && error.code === "rate_limited" ? t.rate : t.genericError); } finally { setPending(false); } }
  async function submitCode(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!challenge) return; setPending(true); setMessage(null); const data = new FormData(event.currentTarget); try { onAuthenticated(await completeEmploymentLogin(challenge, String(data.get("code") ?? ""))); } catch (error) { setMessage(error instanceof EmploymentBrowserError && (error.status === 401 || error.code === "invalid_request") ? t.invalidCode : t.genericError); } finally { setPending(false); } }
  return <section className="candidate-login candidate-private-panel"><h2>{t.signIn}</h2><p>{t.signInHelp}</p>{challenge ? <form onSubmit={submitCode}><label htmlFor="candidate-code">{t.code}</label><input id="candidate-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required/><button className="button button-primary" disabled={pending}>{t.verify}</button><button className="candidate-text-button" type="button" onClick={() => { setChallenge(null); setMessage(null); }}>{t.another}</button></form> : <form onSubmit={submitPhone}><label htmlFor="candidate-phone">{t.phone}</label><input id="candidate-phone" name="phone" type="tel" autoComplete="tel" minLength={8} maxLength={32} required/><button className="button button-primary" disabled={pending}>{t.send}</button></form>}{message && <p role="status" className="candidate-form-message">{message}</p>}</section>;
}

export function CandidateEmploymentWorkspace({ locale, applicationReference }: { locale: Locale; applicationReference?: string }) {
  const t = copy[locale]; const [session, setSession] = useState<EmploymentSession | null>(null); const [applications, setApplications] = useState<CandidateApplication[] | null>(null); const [application, setApplication] = useState<CandidateApplication | null>(null); const [state, setState] = useState<"loading" | "login" | "ready" | "not-found" | "error">("loading");
  const load = useCallback(async () => { try { const current = await restoreEmploymentSession(); setSession(current); if (applicationReference) setApplication(await loadCandidateApplication(applicationReference)); else setApplications(await loadCandidateApplications()); setState("ready"); } catch (error) { if (error instanceof EmploymentBrowserError && error.status === 401) { setSession(null); setState("login"); } else if (error instanceof EmploymentBrowserError && error.status === 404) setState("not-found"); else setState("error"); } }, [applicationReference]);
  useEffect(() => { let active = true; void restoreEmploymentSession().then(async (current) => { const detail = applicationReference ? await loadCandidateApplication(applicationReference) : null; const list = applicationReference ? null : await loadCandidateApplications(); if (!active) return; setSession(current); setApplication(detail); setApplications(list); setState("ready"); }).catch((error) => { if (!active) return; if (error instanceof EmploymentBrowserError && error.status === 401) setState("login"); else if (error instanceof EmploymentBrowserError && error.status === 404) setState("not-found"); else setState("error"); }); return () => { active = false; }; }, [applicationReference]);
  async function logout() { try { await endEmploymentSession(); } finally { setSession(null); setApplications(null); setApplication(null); setState("login"); } }
  return <><section className="candidate-employment-hero"><div className="container"><span className="eyebrow">{t.eyebrow}</span><h1>{application?.job_title ?? t.title}</h1><p>{application ? application.employer_name : t.intro}</p>{application && <><span className={`candidate-status candidate-status-${application.status}`}>{candidateStatusLabel(locale, application.status)}</span><p><Link href={candidateApplicationsPath(locale)}>{t.back}</Link></p></>}{session && <div className="candidate-session"><span>{t.signedIn} <strong>{session.display_name}</strong></span><button type="button" onClick={logout}>{t.signOut}</button></div>}</div></section><section className="section candidate-employment-section"><div className="container">{state === "loading" && <div className="candidate-skeleton" aria-label={locale === "fr" ? "Chargement" : "Loading"}><span/><span/><span/></div>}{state === "login" && <LoginPanel locale={locale} onAuthenticated={() => { setState("loading"); void load(); }}/>} {state === "error" && <div className="candidate-private-panel candidate-state"><p>{t.genericError}</p><button className="button button-secondary" onClick={() => { setState("loading"); void load(); }}>{t.retry}</button></div>}{state === "not-found" && <div className="candidate-private-panel candidate-state"><p>{t.unavailable}</p><Link className="button button-secondary" href={candidateApplicationsPath(locale)}>{t.back}</Link></div>}{state === "ready" && !applicationReference && applications && <><section className="candidate-profile-overview"><div><h2>{t.profiles}</h2><p>{t.profilesText}</p></div><article><strong>{t.professional}</strong><span>{t.oneEach}</span><small>{t.notAvailable}</small></article><article><strong>{t.occasional}</strong><span>{t.oneEach}</span><small>{t.notAvailable}</small></article></section><CandidateApplicationsView locale={locale} applications={applications}/></>}{state === "ready" && application && <CandidateApplicationDetailView locale={locale} application={application}/>}</div></section></>;
}
