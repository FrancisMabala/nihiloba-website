"use client";
import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import {serviceRequest, ServiceRequestError, type QuoteTerms} from "../../lib/services-request-browser";
import type {ServiceLocale} from "../../lib/services-category-experience";
import {requestWords} from "../../lib/services-request-copy";
import {comparisonWords} from "../../lib/services-comparison-copy";
import {servicesText} from "./services-transaction-copy";
import {dateText, useWorkDraft} from "../../lib/restaurant-work";
import {ServiceReviewedBrief} from "./service-reviewed-brief";

type Quote = QuoteTerms & {quote_ref: string; revision: number; status: string; actions: string[]; provider: string; reservation_ref?: string};
type Work = {request_ref?: string; reservation_ref?: string; revision: number; status: string; role: string;
  service_name?: string; offering?: string; provider?: string; description?: string; reviewed_brief?: unknown;
  current_quote?: {quote_ref: string} | null; accepted_quote?: QuoteTerms | null};
type Props = {binding: string; locale: ServiceLocale; reference: string; booking?: boolean; onDenied: () => void; onBooking: (reference: string) => void};
export function ServiceCustomerWork(props: Props) {
  return <CustomerWork key={`${props.binding}:${props.reference}`} {...props}/>;
}
function CustomerWork({binding, locale, reference, booking, onDenied, onBooking}: Props) {
  const t = requestWords(locale), c = comparisonWords(locale);
  const [work, setWork] = useState<Work | null>(null), [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true), [reload, setReload] = useState(0), [message, setMessage] = useState("");
  const [review, setReview] = useState(false), [busy, setBusy] = useState(false), [blocked, setBlocked] = useState(false);
  const [pending, setPending] = useState<{path: string; body: string} | null>(null);
  const alive = useRef(true), lock = useRef(false), callbacks = useRef({onDenied, onBooking});
  useEffect(() => {callbacks.current = {onDenied, onBooking};}, [onDenied, onBooking]);
  useWorkDraft(!!pending, t.leave);
  useEffect(() => {
    alive.current = true; const controller = new AbortController(); let active = true;
    serviceRequest<Work>(binding, `${booking ? "bookings" : "requests"}/${reference}`, {signal: controller.signal})
      .then(async value => {
        if (!value || value.role !== "requester") throw new ServiceRequestError(404, "unavailable");
        const current = value.current_quote ? await serviceRequest<Quote>(binding, `quotes/${value.current_quote.quote_ref}`, {signal: controller.signal}) : null;
        if (active) {setWork(value); setQuote(current); setBlocked(false);}
      }).catch(error => {
        if (active) {if (error instanceof ServiceRequestError && [401, 403, 404].includes(error.status)) {setWork(null); callbacks.current.onDenied();} else setMessage(t.unavailable);}
      }).finally(() => {if (active) setLoading(false);});
    return () => {alive.current = false; active = false; controller.abort();};
  }, [binding, reference, booking, reload, t.unavailable]);
  async function accept(operation = pending) {
    if (lock.current || !quote || blocked || !navigator.onLine) return;
    const next = operation ?? {path: `quotes/${quote.quote_ref}/accept`, body: JSON.stringify({revision: quote.revision, idempotency_key: crypto.randomUUID()})};
    lock.current = true; setBusy(true); setPending(next); setMessage("");
    try {
      const result = await serviceRequest<{reservation_ref: string}>(binding, next.path, {method: "POST", body: next.body});
      if (!/^RSV_[A-Za-z0-9_-]+$/.test(result.reservation_ref)) throw new Error();
      if (alive.current) {setPending(null); callbacks.current.onBooking(result.reservation_ref);}
    } catch (error) {
      if (!alive.current) return;
      if (error instanceof ServiceRequestError && [401, 403, 404].includes(error.status)) {setWork(null); setQuote(null); setPending(null); callbacks.current.onDenied();}
      else if (error instanceof ServiceRequestError && error.status >= 400 && error.status < 500 && error.status !== 408) {setPending(null); setBlocked(true); setMessage(t.stale);}
      else setMessage(t.uncertain);
    } finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  const agreement = quote ?? work?.accepted_quote;
  const date = (value?: string) => value ? `${dateText(value, locale, "Africa/Kinshasa")} · Kinshasa` : "—";
  return <section className="svc-request" lang={locale}>
    {loading ? <p role="status">{t.loading}</p> : <>
      <h1>{work?.service_name || work?.offering || t.follow}</h1>
      {message && <p role="status">{message}</p>}
      {work && <><span className="svc-request-tag">{servicesText(locale, work.status.toLowerCase())}</span>
        {work.provider && <p>{work.provider}</p>}{work.description && <p>{work.description}</p>}
        <ServiceReviewedBrief value={work.reviewed_brief} locale={locale}/>
        {agreement && <section className="svc-brief-card"><h2>{c.quote}</h2>
          <dl><div><dt>{c.amount}</dt><dd>{agreement.amount} {agreement.currency}</dd></div>
            <div><dt>{c.scope}</dt><dd>{agreement.pricing_description}</dd></div>
            <div><dt>{c.terms}</dt><dd>{agreement.terms}</dd></div>
            <div><dt>{c.starts}</dt><dd>{date(agreement.proposed_start)}</dd></div>
            <div><dt>{c.ends}</dt><dd>{date(agreement.proposed_end)}</dd></div>
          </dl>
          {quote?.actions.includes("accept") && !work.reservation_ref && (review ?
            <><p>{c.directBeforeAccept}</p><button disabled={busy || !!pending || blocked} onClick={() => void accept()}>{c.accept}</button></> :
            <button onClick={() => setReview(true)}>{c.review}</button>)}
        </section>}
        {!booking && work.reservation_ref && <button onClick={() => callbacks.current.onBooking(work.reservation_ref!)}>{c.booking}</button>}
        {booking && <Link href={`${locale === "en" ? "" : `/${locale}`}/shida/service-bills/${reference}`}>{c.bills}</Link>}
      </>}
      {pending && !busy ? <button onClick={() => void accept(pending)}>{t.retry}</button> :
        <button disabled={busy} onClick={() => {setLoading(true); setMessage(""); setReview(false); setReload(value => value + 1);}}>{t.reload}</button>}
    </>}
  </section>;
}
