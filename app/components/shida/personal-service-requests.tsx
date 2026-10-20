"use client";
import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import {PersonalWhatsAppLogin} from "./personal-whatsapp-login";
import {ServiceBriefEditor} from "./service-brief-editor";
import {ServiceRequestComparison} from "./service-request-comparison";
import {ServiceCustomerWork} from "./service-customer-work";
import {restorePersonalSession, PERSONAL_SESSION_EVENT, PersonalSessionError, type PersonalSession} from "../../lib/personal-session-browser";
import {requestWords} from "../../lib/services-request-copy";
import {comparisonWords} from "../../lib/services-comparison-copy";
import {serviceRequest, ServiceRequestError, type CustomerBrief, type PostedRequest} from "../../lib/services-request-browser";
import {serviceCategoryExperience, type ServiceLocale} from "../../lib/services-category-experience";
import {leaveWork, dateText} from "../../lib/restaurant-work";
import "./service-request-workspace.css";

type Props = {locale: ServiceLocale; briefRef?: string; newRequest?: boolean; requestRef?: string; bookingRef?: string};
export function PersonalServiceRequests(props: Props) {
  const {locale} = props, t = requestWords(locale);
  const [session, setSession] = useState<PersonalSession | null>(null);
  const [loading, setLoading] = useState(true), [offline, setOffline] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true, generation = 0, controller: AbortController | null = null;
    async function check(clear = false) {
      if (clear) setSession(null);
      if (controller) { if (!clear) return; controller.abort(); }
      const ticket = ++generation; controller = new AbortController();
      const current = controller, timeout = setTimeout(() => current.abort(), 15000);
      try {
        const value = await restorePersonalSession(current.signal);
        if (active && ticket === generation) {setSession(value); setOffline(false);}
      } catch (error) {
        if (active && ticket === generation) {
          if (error instanceof PersonalSessionError && [401, 403].includes(error.status)) {setSession(null); setOffline(false);}
          else setOffline(true);
        }
      } finally {clearTimeout(timeout); if (current === controller) controller = null; if (active && ticket === generation) setLoading(false);}
    }
    const changed = () => {void check(true);}, focus = () => {void check();};
    const storage = (event: StorageEvent) => {if (event.key === PERSONAL_SESSION_EVENT) changed();};
    const disconnected = () => {++generation; controller?.abort(); controller = null; setOffline(true); setLoading(false);};
    const visible = () => {if (document.visibilityState === "visible") focus();};
    void check();
    const timer = setInterval(() => {if (document.visibilityState === "visible" && navigator.onLine) focus();}, 60000);
    window.addEventListener(PERSONAL_SESSION_EVENT, changed); window.addEventListener("storage", storage);
    window.addEventListener("focus", focus); window.addEventListener("online", focus); window.addEventListener("offline", disconnected);
    document.addEventListener("visibilitychange", visible);
    return () => {active = false; ++generation; controller?.abort(); clearInterval(timer);
      window.removeEventListener(PERSONAL_SESSION_EVENT, changed); window.removeEventListener("storage", storage);
      window.removeEventListener("focus", focus); window.removeEventListener("online", focus); window.removeEventListener("offline", disconnected);
      document.removeEventListener("visibilitychange", visible);};
  }, [attempt]);
  return <main lang={locale}>
    <nav className="svc-request"><Link href={`${locale === "en" ? "" : `/${locale}`}/shida/services`} onClick={event => {if (!leaveWork()) event.preventDefault();}}>SHIDA · Services</Link></nav>
    {loading ? <p className="svc-request" role="status">{t.loading}</p> : session ?
      <fieldset disabled={offline} inert={offline} style={{border: 0, padding: 0, margin: 0, minWidth: 0}}>
        <CustomerRequests key={session.binding} {...props} binding={session.binding} onDenied={() => setSession(null)}/>
      </fieldset> : offline ? null :
      <section className="svc-request"><h1>{t.requests}</h1><p>{t.signIn}</p>
        <PersonalWhatsAppLogin locale={locale} onAuthenticated={() => {setLoading(true); setAttempt(value => value + 1);}}/>
      </section>}
    {offline && <section className="svc-request"><p role="status">{t.offline}</p><button onClick={() => setAttempt(value => value + 1)}>{t.retry}</button></section>}
  </main>;
}
function CustomerRequests({locale, binding, briefRef, newRequest, requestRef, bookingRef, onDenied}: Props & {binding: string; onDenied: () => void}) {
  const t = requestWords(locale);
  const [selected, setSelected] = useState<string | null>(briefRef ?? (newRequest ? "new" : null));
  const [rows, setRows] = useState<CustomerBrief[]>([]), [hasMore, setHasMore] = useState(false);
  const [posted, setPosted] = useState<PostedRequest[]>([]), [postedCursor, setPostedCursor] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const c = comparisonWords(locale);
  const [loading, setLoading] = useState(true), [error, setError] = useState(false);
  const [reload, setReload] = useState(0), [result, setResult] = useState<{posted_ref?: string; request_ref?: string; reservation_ref?: string} | null>(
    bookingRef ? {reservation_ref: bookingRef} : requestRef ? requestRef.startsWith("SPR_") ? {posted_ref: requestRef} : {request_ref: requestRef} : null);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true), denied = useRef(onDenied);
  useEffect(() => {denied.current = onDenied;}, [onDenied]);
  useEffect(() => {alive.current = true; return () => {alive.current = false;};}, []);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    Promise.all([
      serviceRequest<{briefs: CustomerBrief[]; has_more: boolean}>(binding, "briefs", {signal: controller.signal}),
      serviceRequest<{requests: PostedRequest[]; next_ref: string | null}>(binding, "postings", {signal: controller.signal}),
    ])
      .then(([value, history]) => {if (!Array.isArray(value.briefs) || !Array.isArray(history.requests)) throw new Error();
        if (active) {setRows(value.briefs); setHasMore(value.has_more); setOffset(value.briefs.length);
          setPosted(history.requests); setPostedCursor(history.next_ref); setError(false);}})
      .catch(reason => {if (active) {if (reason instanceof ServiceRequestError && [401, 403].includes(reason.status)) denied.current(); else setError(true);}})
      .finally(() => {if (active) setLoading(false);});
    return () => {active = false; controller.abort();};
  }, [binding, reload]);
  function choose(reference: string | null) {
    if (!leaveWork()) return;
    setResult(null); setSelected(reference);
    const url = new URL(window.location.href);
    url.search = reference === "new" ? "?new=1" : reference ? `?brief=${reference}` : "";
    window.history.replaceState(null, "", url);
    if (!reference) {setLoading(true); setReload(value => value + 1);}
  }
  async function more(history = false) {
    if (busy) return;
    setBusy(true);
    try {
      if (history) {
        const value = await serviceRequest<{requests: PostedRequest[]; next_ref: string | null}>(binding, `postings?before_ref=${postedCursor}`);
        if (alive.current) {setPosted(current => [...current, ...value.requests.filter(row => !current.some(item => item.posted_ref === row.posted_ref))]); setPostedCursor(value.next_ref);}
      } else {
        const value = await serviceRequest<{briefs: CustomerBrief[]; has_more: boolean}>(binding, `briefs?offset=${offset}`);
        if (alive.current) {setRows(current => [...current, ...value.briefs.filter(row => !current.some(item => item.brief_ref === row.brief_ref))]); setHasMore(value.has_more); setOffset(offset + value.briefs.length);}
      }
    } catch (reason) {
      if (alive.current) {if (reason instanceof ServiceRequestError && [401, 403].includes(reason.status)) denied.current(); else setError(true);}
    } finally {if (alive.current) setBusy(false);}
  }
  function follow(next: {posted_ref?: string; request_ref?: string; reservation_ref?: string}) {
    setResult(next); const url = new URL(window.location.href);
    url.search = next.reservation_ref ? `?booking=${next.reservation_ref}` : `?request=${next.posted_ref ?? next.request_ref}`;
    window.history.replaceState(null, "", url);
  }
  if (result) return <><div className="svc-request"><button onClick={() => choose(null)}>{t.requests}</button></div>
    {result.posted_ref ? <ServiceRequestComparison binding={binding} locale={locale} reference={result.posted_ref}
      onDenied={onDenied} onBooking={reference => follow({reservation_ref: reference})}/> :
      <ServiceCustomerWork binding={binding} locale={locale} reference={result.reservation_ref ?? result.request_ref!}
        booking={!!result.reservation_ref} onDenied={onDenied} onBooking={reference => follow({reservation_ref: reference})}/>}
  </>;
  if (selected) return <><div className="svc-request"><button type="button" onClick={() => choose(null)}>{t.requests}</button></div>
    <ServiceBriefEditor binding={binding} locale={locale} reference={selected === "new" ? undefined : selected}
      onDenied={onDenied} onSaved={reference => {
        const url = new URL(window.location.href); url.search = `?brief=${reference}`; window.history.replaceState(null, "", url);
      }} onComplete={follow}/></>;
  return <section className="svc-request"><header><h1>{t.requests}</h1><button className="button button-primary" onClick={() => choose("new")}>{t.newRequest}</button></header>
    {loading ? <p role="status">{t.loading}</p> : error ? <><p role="alert">{t.unavailable}</p><button onClick={() => {setLoading(true); setReload(value => value + 1);}}>{t.retry}</button></> :
      rows.length === 0 && posted.length === 0 ? <p>{t.empty}</p> : rows.filter(row => !row.posted_ref).map(row => <article className="svc-brief-card" key={row.brief_ref}>
        <span className="svc-request-tag">{row.status === "PUBLISHED" ? t.published : row.status === "REVIEWED" ? t.reviewed : t.draft}</span>
        <h2>{serviceCategoryExperience(row.content.category, locale)?.service}</h2><p>{row.summary.description}</p>
        <p>{t.expires} {dateText(row.expires_at, locale, "Africa/Kinshasa")} · Kinshasa</p>
        <button onClick={() => choose(row.brief_ref)}>{row.status === "PUBLISHED" ? t.follow : t.edit}</button>
      </article>)}
    {hasMore && !error && <button disabled={busy} onClick={() => void more()}>{t.more}</button>}
    {!loading && !error && posted.map(row => <article className="svc-brief-card" key={row.posted_ref}>
      <span className="svc-request-tag">{c[row.status]}</span>
      <h2>{serviceCategoryExperience(row.summary.category, locale)?.service}</h2><p>{row.summary.description}</p>
      <button onClick={() => follow({posted_ref: row.posted_ref})}>{t.follow}</button>
      {row.brief_ref && <button onClick={() => choose(row.brief_ref!)}>{t.original}</button>}
    </article>)}
    {postedCursor && !error && <button disabled={busy} onClick={() => void more(true)}>{t.more}</button>}
  </section>;
}
