"use client";
import Link from "next/link";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { beginEmploymentLogin, completeEmploymentLogin, endEmploymentSession } from "../../services/shida/employment-browser-client";
import { restorePersonalSession, PersonalSessionError, PERSONAL_SESSION_EVENT, type PersonalSession } from "../../lib/personal-session-browser";
import { sellerConnectionText } from "../../lib/restaurant-seller-copy";
import { restaurantText, sellerChrome } from "../../lib/restaurant-seller-copy";
import { restaurantPath, restaurantLocales } from "../../lib/restaurant-i18n";
import type { RestaurantLocale } from "../../services/shida/restaurants-client";
import { RestaurantWorkspace } from "./restaurant-seller-workspace";
import "./restaurant-seller.css";

export const sellerPath = (locale: RestaurantLocale) => `${locale === "en" ? "" : `/${locale}`}/shida/seller/restaurants`;
export function RestaurantSeller({ locale }: { locale: RestaurantLocale }) {
 const t = sellerChrome[locale];
 const [session, setSession] = useState<PersonalSession | null>(null);
 const [connectionLost, setConnectionLost] = useState(false);
 const [loading, setLoading] = useState(true), [pending, setPending] = useState(false), [challenge, setChallenge] = useState<string | null>(null), [message, setMessage] = useState("");
 const generation = useRef(0), alive = useRef(false), signedOut = useRef(false);
 useEffect(() => {
  alive.current = true;
  let inFlight: AbortController | null = null;
  let authenticated = false;
  const invalidate = () => { ++generation.current; };
  async function check(clear = false) {
   if (signedOut.current) return;
   if (clear) { inFlight?.abort(); inFlight = null; authenticated = false; }
   else if (inFlight) return;
   const current = ++generation.current;
   if (clear) { setSession(null); setChallenge(null); }
   if (!navigator.onLine) { setConnectionLost(true); setLoading(false); return; }
   const controller = new AbortController(); inFlight = controller;
   const timeout = setTimeout(() => controller.abort(), 15000);
   try { const value = await restorePersonalSession(controller.signal); if (alive.current && current === generation.current) { authenticated = true; setSession(value); setConnectionLost(false); } }
   catch (error) { if (alive.current && current === generation.current) {
    if (error instanceof PersonalSessionError && [401, 403].includes(error.status)) { authenticated = false; setSession(null); setChallenge(null); setConnectionLost(false); }
    else setConnectionLost(true);
   } }
   finally { clearTimeout(timeout); if (inFlight === controller) inFlight = null; if (alive.current && current === generation.current) setLoading(false); }
  }
  const changed = () => { void check(true); };
  const storage = (event: StorageEvent) => { if (event.key === PERSONAL_SESSION_EVENT) changed(); };
  const focus = () => { void check(); };
  const offline = () => { ++generation.current; inFlight?.abort(); inFlight = null; setConnectionLost(true); setLoading(false); };
  const visible = () => { if (document.visibilityState === "visible") focus(); };
  void check(); const timer = setInterval(() => { if (authenticated && navigator.onLine && document.visibilityState === "visible") focus(); }, 60000);
  window.addEventListener(PERSONAL_SESSION_EVENT, changed); window.addEventListener("storage", storage); window.addEventListener("focus", focus); window.addEventListener("online", focus); window.addEventListener("offline", offline); document.addEventListener("visibilitychange", visible);
  return () => { alive.current = false; invalidate(); inFlight?.abort(); clearInterval(timer); window.removeEventListener(PERSONAL_SESSION_EVENT, changed); window.removeEventListener("storage", storage); window.removeEventListener("focus", focus); window.removeEventListener("online", focus); window.removeEventListener("offline", offline); document.removeEventListener("visibilitychange", visible); };
 }, []);
 async function signIn(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (pending) return; setPending(true); setMessage("");
  const data = new FormData(event.currentTarget); const current = generation.current;
  try {
   if (!challenge) { const ref = await beginEmploymentLogin(String(data.get("phone") ?? "")); if (alive.current && current === generation.current) { setChallenge(ref); setMessage(t.codeSent); } }
   else { const wasSignedOut = signedOut.current; await completeEmploymentLogin(challenge, String(data.get("code") ?? "")); signedOut.current = false; if (wasSignedOut) window.dispatchEvent(new Event(PERSONAL_SESSION_EVENT)); }
  } catch { if (alive.current) setMessage(t.unavailable); }
  finally { if (alive.current) setPending(false); }
 }
 async function logout() { signedOut.current = true; setSession(null); setChallenge(null); ++generation.current; setPending(true); try { await endEmploymentSession(); } catch { setMessage(t.unavailable); } finally { if (alive.current) setPending(false); } }
 return <div lang={locale}>
  <section className="rst container"><nav aria-label={t.languages}>{restaurantLocales.map(lang => <Link key={lang} prefetch={false} href={sellerPath(lang)} hrefLang={lang} aria-current={locale === lang ? "page" : undefined}>{lang.toUpperCase()}</Link>)}<Link prefetch={false} href={restaurantPath(locale)}>{t.browse}</Link></nav><h1>{t.title}</h1><p>{t.intro}</p>{session && <p>{session.user.display_name} <button className="button button-secondary" disabled={pending} onClick={logout}>{t.logout}</button></p>}
   {loading ? <p role="status">{restaurantText(locale, "loading")}</p> : !session && <section className="rst-card"><h2>{t.login}</h2><p>{t.loginHelp}</p><form onSubmit={signIn} className="rst-fields"><label>{challenge ? t.code : t.phone}<input key={challenge ?? "phone"} name={challenge ? "code" : "phone"} type={challenge ? "text" : "tel"} inputMode={challenge ? "numeric" : "tel"} autoComplete={challenge ? "one-time-code" : "tel"} pattern={challenge ? "[0-9]{6}" : undefined} maxLength={challenge ? 6 : 32} required disabled={pending}/></label><button className="button button-primary" disabled={pending}>{challenge ? t.verify : t.send}</button>{challenge && <button type="button" disabled={pending} onClick={() => { setChallenge(null); setMessage(""); }}>{t.another}</button>}</form></section>}
   {message && <p role="status">{message}</p>}
   {connectionLost && <p role="status">{sellerConnectionText[locale]}</p>}
  </section>
  {session && <fieldset className="rst-session-boundary" disabled={connectionLost} inert={connectionLost}><RestaurantWorkspace key={`${session.binding}:${locale}`} binding={session.binding} locale={locale}/></fieldset>}
 </div>;
}
