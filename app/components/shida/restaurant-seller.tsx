"use client";
import Link from "next/link";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { beginEmploymentLogin, completeEmploymentLogin, endEmploymentSession } from "../../services/shida/employment-browser-client";
import { restorePersonalSession, PERSONAL_SESSION_EVENT, type PersonalSession } from "../../lib/personal-session-browser";
import { restaurantText, sellerChrome } from "../../lib/restaurant-seller-copy";
import { restaurantPath, restaurantLocales } from "../../lib/restaurant-i18n";
import type { RestaurantLocale } from "../../services/shida/restaurants-client";
import { RestaurantWorkspace } from "./restaurant-seller-workspace";
import "./restaurant-seller.css";

export const sellerPath = (locale: RestaurantLocale) => `${locale === "en" ? "" : `/${locale}`}/shida/seller/restaurants`;
export function RestaurantSeller({ locale }: { locale: RestaurantLocale }) {
 const t = sellerChrome[locale];
 const [session, setSession] = useState<PersonalSession | null>(null);
 const [loading, setLoading] = useState(true), [pending, setPending] = useState(false), [challenge, setChallenge] = useState<string | null>(null), [message, setMessage] = useState("");
 const generation = useRef(0), alive = useRef(false);
 useEffect(() => {
  alive.current = true;
  async function check(clear = false) {
   const current = ++generation.current;
   if (clear) { setSession(null); setChallenge(null); }
   try { const value = await restorePersonalSession(); if (alive.current && current === generation.current) setSession(value); }
   catch { if (alive.current && current === generation.current) { setSession(null); setChallenge(null); } }
   finally { if (alive.current && current === generation.current) setLoading(false); }
  }
  const changed = () => { void check(true); };
  const storage = (event: StorageEvent) => { if (event.key === PERSONAL_SESSION_EVENT) changed(); };
  const focus = () => { void check(); };
  void check(); const timer = setInterval(focus, 60000);
  window.addEventListener(PERSONAL_SESSION_EVENT, changed); window.addEventListener("storage", storage); window.addEventListener("focus", focus);
  return () => { alive.current = false; clearInterval(timer); window.removeEventListener(PERSONAL_SESSION_EVENT, changed); window.removeEventListener("storage", storage); window.removeEventListener("focus", focus); };
 }, []);
 async function signIn(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (pending) return; setPending(true); setMessage("");
  const data = new FormData(event.currentTarget); const current = generation.current;
  try {
   if (!challenge) { const ref = await beginEmploymentLogin(String(data.get("phone") ?? "")); if (alive.current && current === generation.current) { setChallenge(ref); setMessage(t.codeSent); } }
   else { await completeEmploymentLogin(challenge, String(data.get("code") ?? "")); }
  } catch { if (alive.current) setMessage(t.unavailable); }
  finally { if (alive.current) setPending(false); }
 }
 async function logout() { setSession(null); setChallenge(null); ++generation.current; setPending(true); try { await endEmploymentSession(); } catch { setMessage(t.unavailable); } finally { if (alive.current) setPending(false); } }
 return <div lang={locale}>
  <section className="rst container"><nav aria-label={t.languages}>{restaurantLocales.map(lang => <Link key={lang} href={sellerPath(lang)} hrefLang={lang} aria-current={locale === lang ? "page" : undefined}>{lang.toUpperCase()}</Link>)}<Link href={restaurantPath(locale)}>{t.browse}</Link></nav><h1>{t.title}</h1><p>{t.intro}</p>{session && <p>{session.user.display_name} <button className="button button-secondary" disabled={pending} onClick={logout}>{t.logout}</button></p>}
   {loading ? <p role="status">{restaurantText(locale, "loading")}</p> : !session && <section className="rst-card"><h2>{t.login}</h2><p>{t.loginHelp}</p><form onSubmit={signIn} className="rst-fields"><label>{challenge ? t.code : t.phone}<input key={challenge ?? "phone"} name={challenge ? "code" : "phone"} type={challenge ? "text" : "tel"} inputMode={challenge ? "numeric" : "tel"} autoComplete={challenge ? "one-time-code" : "tel"} pattern={challenge ? "[0-9]{6}" : undefined} maxLength={challenge ? 6 : 32} required disabled={pending}/></label><button className="button button-primary" disabled={pending}>{challenge ? t.verify : t.send}</button>{challenge && <button type="button" disabled={pending} onClick={() => { setChallenge(null); setMessage(""); }}>{t.another}</button>}</form></section>}
   {message && <p role="status">{message}</p>}
  </section>
  {session && <RestaurantWorkspace key={`${session.binding}:${locale}`} binding={session.binding} locale={locale}/>}
 </div>;
}
