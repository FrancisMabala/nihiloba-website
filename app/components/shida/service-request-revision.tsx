"use client";
import {useEffect, useRef, useState} from "react";
import {serviceRequest, ServiceRequestError, type BriefContent, type CustomerBrief, type PostedRequest} from "../../lib/services-request-browser";
import {serviceCategoryExperience, type ServiceLocale} from "../../lib/services-category-experience";
import categories from "../../lib/services-category-experience.json";
import {requestWords} from "../../lib/services-request-copy";
import {revisionWords} from "../../lib/services-revision-copy";
import {useWorkDraft, dateText} from "../../lib/restaurant-work";
import {ServiceReviewedBrief} from "./service-reviewed-brief";

type Preview = {posted_ref: string; revision: number; content: BriefContent; summary: BriefContent; summary_digest: string};
export function ServiceRequestRevision({binding, locale, request, onDenied, onBack, onSaved}: {
  binding: string; locale: ServiceLocale; request: PostedRequest; onDenied: () => void; onBack: () => void; onSaved: () => void;
}) {
  const t = requestWords(locale), r = revisionWords(locale);
  const [content, setContent] = useState<BriefContent | null>(null), [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false), [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState(""), [blocked, setBlocked] = useState(false), [reload, setReload] = useState(0);
  const [dirty, setDirty] = useState(false), alive = useRef(true), lock = useRef(false);
  const callbacks = useRef({onDenied, onBack, onSaved});
  useEffect(() => {callbacks.current = {onDenied, onBack, onSaved};}, [onDenied, onBack, onSaved]);
  useWorkDraft(dirty || !!pending, t.leave);
  useEffect(() => {
    alive.current = true; let active = true; const controller = new AbortController();
    serviceRequest<CustomerBrief>(binding, `briefs/${request.brief_ref}`, {signal: controller.signal})
      .then(value => {
        if (value.posted_ref !== request.posted_ref || value.status !== "PUBLISHED") throw new ServiceRequestError(409, "stale");
        if (active) {setContent({...value.content, language: locale}); setMessage("");}
      }).catch(error => {
        if (!active) return;
        if (error instanceof ServiceRequestError && [401, 403, 404].includes(error.status)) callbacks.current.onDenied();
        else {setMessage(error instanceof ServiceRequestError && error.status === 409 ? t.stale : t.unavailable); setBlocked(error instanceof ServiceRequestError && error.status === 409);}
      });
    return () => {active = false; alive.current = false; controller.abort();};
  }, [binding, request.brief_ref, request.posted_ref, locale, t.stale, t.unavailable, reload]);
  const field = (key: keyof BriefContent, value: string) => {setContent(current => current ? {...current, [key]: value} : null); setDirty(true); setPreview(null);};
  async function act(confirm: boolean, retry = pending) {
    if (lock.current || blocked || !content || !navigator.onLine || pending && !confirm) return;
    const payload = confirm ? retry ?? (preview ? JSON.stringify({operation_id: crypto.randomUUID(),
      revision: preview.revision, content: preview.content, summary_digest: preview.summary_digest}) : null)
      : JSON.stringify({revision: request.revision, content});
    if (!payload) return;
    lock.current = true; setBusy(true); setMessage("");
    if (confirm) setPending(payload);
    try {
      const result = await serviceRequest<Preview>(binding, `postings/${request.posted_ref}/${confirm ? "revise" : "revision-preview"}`,
        {method: "POST", body: payload});
      if (!alive.current) return;
      if (confirm) {setPending(null); setDirty(false); callbacks.current.onSaved();}
      else {
        if (result.posted_ref !== request.posted_ref || result.revision !== request.revision || !result.summary || !/^[a-f0-9]{64}$/.test(result.summary_digest)) throw new Error();
        setPreview(result);
      }
    } catch (error) {
      if (!alive.current) return;
      if (error instanceof ServiceRequestError && [401, 403, 404].includes(error.status)) {setContent(null); setPending(null); callbacks.current.onDenied();}
      else if (error instanceof ServiceRequestError && error.status >= 400 && error.status < 500 && error.status !== 408) {
        setPending(null); setMessage(error.status === 409 ? t.stale : t.invalid); setBlocked(error.status === 409);
      } else setMessage(confirm ? t.uncertain : t.unavailable);
    } finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  function back() {
    if ((dirty || pending) && !window.confirm(t.leave)) return;
    callbacks.current.onBack();
  }
  return <section className="svc-request" aria-label={r.title}>
    <h2>{r.title}</h2><p>{r.warning}</p>
    <p>{t.expires} {dateText(request.expires_at, locale, "Africa/Kinshasa")} · Kinshasa</p>
    {message && <p role="status">{message}</p>}
    {!content && !message && <p role="status">{t.loading}</p>}
    {!content && message && !blocked && <button onClick={() => setReload(value => value + 1)}>{t.retry}</button>}
    {pending && !busy && <button onClick={() => void act(true, pending)}>{t.retry}</button>}
    {content && !preview && <form className="svc-brief-card" onSubmit={event => {event.preventDefault(); void act(false);}}>
      <fieldset disabled={busy || blocked || !!pending}>
        <label>{t.category}<select value={content.category} onChange={event => field("category", event.target.value)}>
          {Object.keys(categories.categories).map(category => <option key={category} value={category}>{serviceCategoryExperience(category, locale)?.service}</option>)}
        </select></label>
        <label>{serviceCategoryExperience(content.category, locale)?.request ?? t.description}
          <textarea required rows={5} maxLength={2000} value={content.description ?? ""} onChange={event => field("description", event.target.value)}/></label>
        <p>{t.privacy}</p>
        <div className="svc-request-grid">{(["city", "commune"] as const).map(key => <label key={key}>{t[key]}
          <input maxLength={100} value={content[key] ?? ""} onChange={event => field(key, event.target.value)}/></label>)}</div>
        <label>{t.timing}<textarea rows={2} maxLength={500} value={content.timing ?? ""} onChange={event => field("timing", event.target.value)}/></label>
        {(["preferred_date", "preferred_start_time", "preferred_end_time"] as const).filter(key => content[key]).map(key => <label key={key}>{t[key]}
          <input type={key === "preferred_date" ? "date" : "time"} value={content[key]} onChange={event => field(key, event.target.value)}/></label>)}
        <div className="svc-request-grid">
          <label>{t.budget}<input inputMode="decimal" value={content.budget_amount ?? ""} maxLength={16} onChange={event => {
            setContent(current => current ? {...current, budget_amount: event.target.value, budget_currency: event.target.value ? current.budget_currency ?? "CDF" : undefined} : null); setDirty(true);
          }}/></label>
          <label>{t.currency}<select disabled={!content.budget_amount} value={content.budget_currency ?? "CDF"} onChange={event => field("budget_currency", event.target.value)}><option>CDF</option><option>USD</option></select></label>
        </div>
        <button className="button button-primary" type="submit">{t.review}</button>
      </fieldset>
    </form>}
    {preview && <section className="svc-brief-card"><p>{t.audience}</p>
      <ServiceReviewedBrief value={preview} locale={locale} open/>
      <div className="svc-request-actions">
        <button disabled={busy || !!pending || blocked} onClick={() => setPreview(null)}>{t.edit}</button>
        <button className="button button-primary" disabled={busy || !!pending || blocked} onClick={() => void act(true)}>{r.confirm}</button>
      </div>
    </section>}
    <button disabled={busy || !!pending} onClick={back}>{r.back}</button>
  </section>;
}
