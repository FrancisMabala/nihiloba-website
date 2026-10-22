"use client";
import {QuickSell} from "./quick-sell";
import {quickSellCopy} from "@/app/lib/quick-sell-copy";
import {WenzeHeader} from "./wenze-header";
import { managementCopy } from "../../lib/restaurant-management-copy";
import { leaveWork } from "../../lib/wenze-work";
import { sellerDesignCopy } from "../../lib/restaurant-seller-design-copy";
import { SellerLanding } from "./seller-landing";
import { useEffect, useState, useRef } from "react";


import { endEmploymentSession } from "../../services/shida/employment-browser-client";
import { restorePersonalSession, PersonalSessionError, PERSONAL_SESSION_EVENT, type PersonalSession } from "../../lib/personal-session-browser";
import { sellerConnectionText } from "../../lib/restaurant-seller-copy";
import { restaurantText, sellerChrome } from "../../lib/restaurant-seller-copy";
import type { RestaurantLocale } from "../../services/shida/restaurants-client";
import { WenzeWorkspace } from "./wenze-workspace";
import { WenzeApiProvider } from "@/app/lib/wenze-seller-api";
import { sellerText } from "@/app/lib/wenze-seller-copy";
import "./wenze-seller.css";
import "./restaurant-seller.css";
import "./wenze-mobile-chrome.css";

export const sellerPath = (locale: RestaurantLocale) => `${locale === "en" ? "" : `/${locale}`}/shida/seller/wenze`;
export function WenzeSeller({ locale, quickSell = false }: { locale: RestaurantLocale; quickSell?: boolean }) {
 const t = sellerChrome[locale];
 const management = managementCopy[locale];
 const [signedOutView, setSignedOutView] = useState(false);
 const design = {area:"Wenze",title:quickSell?quickSellCopy[locale].title:sellerText(locale,"title"),intro:quickSell?quickSellCopy[locale].intro:sellerText(locale,"intro"),personal:sellerDesignCopy[locale].personal};
 const [session, setSession] = useState<PersonalSession | null>(null);
 const [connectionLost, setConnectionLost] = useState(false);
 const [loading, setLoading] = useState(true), [pending, setPending] = useState(false), [message, setMessage] = useState("");
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
 async function logout(changeAccount = false) {
  if (!await leaveWork()) return;
  signedOut.current = true; ++generation.current; setSession(null); setPending(true); setMessage("");
  try { await endEmploymentSession(); setSession(null); setSignedOutView(!changeAccount); }
  catch { setMessage(t.unavailable); }
  finally { if (alive.current) setPending(false); }
 }
 return <div lang={locale} className="rst-seller seller-design">
{!quickSell&&<WenzeHeader beforeNavigate={leaveWork} locale={locale} name={session?.user.display_name} brandHref={`${locale === "en" ? "" : `/${locale}`}/shida/wenze`} pending={pending} onLanguage={async lang=>{if(await leaveWork())window.location.assign((quickSell?`${lang==="en"?"":`/${lang}`}/shida/wenze/sell`:sellerPath(lang))+window.location.search);}} onAccount={()=>void logout(true)} onLogout={()=>void logout()}/>}
{(loading||pending||!session||message||connectionLost)&&<section className="rst container rst-shell">
   {loading || pending ? <p role="status">{restaurantText(locale, "loading")}</p> : !session && (signedOutView ? <div className="rst-signed-out"><p>{management.signedOut}</p><button className="button button-primary" onClick={()=>setSignedOutView(false)}>{management.signIn}</button></div> : <SellerLanding compact={quickSell} marketplace="wenze" locale={locale} design={design} browseHref={`${locale === "en" ? "" : `/${locale}`}/shida/wenze`} onAuthenticated={() => { signedOut.current = false; }}/>)}
   {message && <p role="status">{message}</p>}
   {connectionLost && <p role="status">{sellerConnectionText[locale]}</p>}
  </section>}
  {session && <fieldset className="rst-session-boundary" disabled={connectionLost} inert={connectionLost}><WenzeApiProvider key={`${session.binding}:${locale}`} binding={session.binding} onUnauthorized={()=>setSession(null)}>{quickSell?<QuickSell locale={locale}/>:<WenzeWorkspace locale={locale}/>}</WenzeApiProvider></fieldset>}
 </div>;
}
