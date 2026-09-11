"use client";
import Link from "next/link";
import { sellerDesignCopy } from "../../lib/restaurant-seller-design-copy";
import { PersonalWhatsAppLogin } from "./personal-whatsapp-login";
import { useEffect, useState, useRef, useCallback } from "react";
import { ProtectedReceipt } from './restaurant-receipt';
import { DashboardApiError } from '@/app/lib/restaurant-seller-browser';
import { endEmploymentSession } from "../../services/shida/employment-browser-client";
import { restorePersonalSession, PersonalSessionError, PERSONAL_SESSION_EVENT, type PersonalSession } from "../../lib/personal-session-browser";
import { sellerConnectionText } from "../../lib/restaurant-seller-copy";
import { restaurantText, sellerChrome } from "../../lib/restaurant-seller-copy";
import { restaurantPath, restaurantLocales } from "../../lib/restaurant-i18n";
import type { RestaurantLocale } from "../../services/shida/restaurants-client";
import { RestaurantWorkspace } from "./restaurant-seller-workspace";
import "./restaurant-seller.css";

export const sellerPath = (locale: RestaurantLocale) => `${locale === "en" ? "" : `/${locale}`}/shida/seller/restaurants`;
export function RestaurantSeller({ locale, receipt }: { locale: RestaurantLocale; receipt?: {orderRef:string;establishment?:string} }) {
 const t = sellerChrome[locale];
 const design = sellerDesignCopy[locale];
 const [session, setSession] = useState<PersonalSession | null>(null);
 const [connectionLost, setConnectionLost] = useState(false);
 const [loading, setLoading] = useState(true), [pending, setPending] = useState(false), [message, setMessage] = useState("");
 const generation = useRef(0), alive = useRef(false), signedOut = useRef(false);
 const receiptFailure = useCallback((e:unknown)=>{if(e instanceof DashboardApiError && e.status===401)setSession(null);},[]);
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
   if (clear) { setSession(null); }
   if (!navigator.onLine) { setConnectionLost(true); setLoading(false); return; }
   const controller = new AbortController(); inFlight = controller;
   const timeout = setTimeout(() => controller.abort(), 15000);
   try { const value = await restorePersonalSession(controller.signal); if (alive.current && current === generation.current) { authenticated = true; setSession(value); setConnectionLost(false); } }
   catch (error) { if (alive.current && current === generation.current) {
    if (error instanceof PersonalSessionError && [401, 403].includes(error.status)) { authenticated = false; setSession(null); setConnectionLost(false); }
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
 async function logout() { signedOut.current = true; setSession(null); ++generation.current; setPending(true); try { await endEmploymentSession(); } catch { setMessage(t.unavailable); } finally { if (alive.current) setPending(false); } }
 return <div lang={locale} className="rst-seller">
<section className="rst container rst-shell"><div className="rst-topline"><nav aria-label={design.area}><Link prefetch={false} href={`${locale === "en" ? "" : `/${locale}`}/shida`}>SHIDA</Link><span aria-hidden="true">/</span><Link prefetch={false} href={restaurantPath(locale)}>{restaurantText(locale, "restaurants")}</Link></nav><nav aria-label={t.languages}>{restaurantLocales.map(lang => <Link key={lang} prefetch={false} href={sellerPath(lang)} hrefLang={lang} aria-current={locale === lang ? "page" : undefined}>{lang === "ln" ? "Lingala" : lang.toUpperCase()}</Link>)}</nav>{session && <span className="rst-session-name">{session.user.display_name} <button className="rst-text-button" disabled={pending} onClick={logout}>{t.logout}</button></span>}</div>
   {loading ? <p role="status">{restaurantText(locale, "loading")}</p> : !session && <div className="rst-signin"><picture className="rst-signin-art"><source media="(min-width: 900px)" srcSet="/images/restaurants/malewa-comptoir-480.webp 480w, /images/restaurants/malewa-comptoir-800.webp 800w" sizes="(min-width: 1300px) 580px, 45vw"/>{/* Mobile deliberately receives only an inline pixel, not a hidden large download. */}
    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" width="1122" height="1402" decoding="async"/></picture><div className="rst-signin-content"><p className="eyebrow">SHIDA / {design.area}</p><h1>{design.title}</h1><p className="rst-signin-intro">{design.intro}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={() => { signedOut.current = false; }}/><p className="rst-personal-note">{design.personal}</p><Link className="rst-browse-link" prefetch={false} href={restaurantPath(locale)}>{t.browse} <span aria-hidden="true">→</span></Link></div></div>}
   {message && <p role="status">{message}</p>}
   {connectionLost && <p role="status">{sellerConnectionText[locale]}</p>}
  </section>
  {session && <fieldset className="rst-session-boundary" disabled={connectionLost} inert={connectionLost}>{receipt ? <div className="rst container"><ProtectedReceipt key={`${session.binding}:${locale}:${receipt.orderRef}:${receipt.establishment}`} binding={session.binding} locale={locale} orderRef={receipt.orderRef} establishment={receipt.establishment} onFailure={receiptFailure}/></div> : <RestaurantWorkspace key={`${session.binding}:${locale}`} binding={session.binding} locale={locale}/>}</fieldset>}
 </div>;
}
