"use client";
import {useEffect, useRef, useState} from "react";
import {serviceCategoryExperience, type ServiceLocale} from "../../lib/services-category-experience";
import categories from "../../lib/services-category-experience.json";
import {requestWords} from "../../lib/services-request-copy";
import {comparisonWords} from "../../lib/services-comparison-copy";
import {serviceRequest, ServiceRequestError, isCustomerBrief, requestBase,
  type BriefContent, type CustomerBrief, type BriefDocument, type CustomerBranch} from "../../lib/services-request-browser";
import {useWorkDraft, dateText} from "../../lib/restaurant-work";
import "./service-request-workspace.css";

type Completion = {posted_ref?: string; request_ref?: string; brief_ref?: string};
type Props = {
  binding: string; locale: ServiceLocale; reference?: string;
  directRef?: string;
  direct?: {offering_ref: string; category: string; name: string};
  branchChoice?: {selected_branch_ref: string; selected_branch_revision: number; selected_coverage_revision: number};
  onDenied: () => void; onSaved?: (reference: string) => void; onComplete: (result: Completion) => void;
};
type Operation = {path: string; body: string | File; headers?: Record<string, string>; kind: "brief" | "document" | "remove" | "publish"};
const editable = (row: CustomerBrief | null) => !row || ["DRAFT", "REVIEWED"].includes(row.status);
const normalize = (content: BriefContent): BriefContent => Object.fromEntries(Object.entries(content)
  .filter(([, value]) => typeof value === "string" && value.trim() !== "").map(([key, value]) => [key, value.trim()])) as BriefContent;

export function ServiceBriefEditor(props: Props) {
  return <BriefEditor key={`${props.binding}:${props.reference ?? "new"}:${props.direct?.offering_ref ?? props.directRef ?? ""}`} {...props}/>;
}
type Destination = {offering_ref: string; category: string; name: string; branch_coverage_specified: boolean; customer_branches: CustomerBranch[]};
function BriefEditor({binding, locale, reference, direct, directRef, branchChoice, onDenied, onSaved, onComplete}: Props) {
  const t = requestWords(locale), c = comparisonWords(locale);
  const [brief, setBrief] = useState<CustomerBrief | null>(null);
  const [content, setContent] = useState<BriefContent>({category: direct?.category ?? "", language: locale,
    ...(direct || directRef ? {direct_offering_ref: direct?.offering_ref ?? directRef} : {})});
  const [destination, setDestination] = useState<Destination | null>(null), [destinationError, setDestinationError] = useState(false);
  const [branch, setBranch] = useState("");
  const [documents, setDocuments] = useState<BriefDocument[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(!!reference), [loadError, setLoadError] = useState(false);
  const [reviewing, setReviewing] = useState(false), [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Operation | null>(null);
  const [conflict, setConflict] = useState(false), [message, setMessage] = useState("");
  const [reload, setReload] = useState(0), [online, setOnline] = useState(true), [denied, setDenied] = useState(false);
  const alive = useRef(true), lock = useRef(false), callbacks = useRef({onDenied, onSaved, onComplete});
  useEffect(() => { callbacks.current = {onDenied, onSaved, onComplete}; }, [onDenied, onSaved, onComplete]);
  const dirty = JSON.stringify(normalize(content)) !== JSON.stringify(normalize(brief?.content ?? {category: "", language: locale}));
  useWorkDraft((dirty && editable(brief)) || !!pending, t.leave);
  useEffect(() => {
    alive.current = true;
    const update = () => setOnline(navigator.onLine);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => {alive.current = false; window.removeEventListener("online", update); window.removeEventListener("offline", update);};
  }, []);
  const deny = () => {setDenied(true); setBrief(null); setDocuments([]); setContent({category: "", language: locale}); setFile(null); setPending(null); callbacks.current.onDenied();};
  const target = content.direct_offering_ref;
  const canEdit = editable(brief);
  useEffect(() => {
    if (!target || !canEdit) return;
    let active = true; const controller = new AbortController();
    serviceRequest<Destination>(binding, `destinations/${target}?language=${locale}`, {signal: controller.signal})
      .then(value => {
        if (value.offering_ref !== target || !serviceCategoryExperience(value.category, locale) || !Array.isArray(value.customer_branches)) throw new Error();
        if (active) {setDestination(value); setDestinationError(false); setBranch("");
          if (!reference) setContent(current => current.category ? current : {...current, category: value.category});}
      }).catch(error => {if (active) {
        if (error instanceof ServiceRequestError && [401, 403].includes(error.status)) callbacks.current.onDenied();
        else {setDestination(null); setDestinationError(true);}
      }});
    return () => {active = false; controller.abort();};
  }, [binding, target, locale, reference, canEdit, reload]);
  useEffect(() => {
    if (!reference) return;
    const controller = new AbortController(); let active = true;
    Promise.all([
      serviceRequest<CustomerBrief>(binding, `briefs/${reference}`, {signal: controller.signal}),
      serviceRequest<{documents: BriefDocument[]}>(binding, `briefs/${reference}/documents`, {signal: controller.signal}),
    ]).then(([row, docs]) => {
      if (!isCustomerBrief(row) || !Array.isArray(docs.documents)) throw new Error("invalid_response");
      if (active) {setBrief(row); setContent(row.content); setDocuments(docs.documents); setLoadError(false);}
    }).catch(error => {
      if (!active) return;
      if (error instanceof ServiceRequestError && [401, 403, 404].includes(error.status)) {
        setDenied(true); callbacks.current.onDenied();
      } else setLoadError(true);
    }).finally(() => {if (active) setLoading(false);});
    return () => {active = false; controller.abort();};
  }, [reference, binding, reload]);
  const field = (key: keyof BriefContent, value: string) => setContent(current => ({...current, [key]: value}));

  async function refreshDocuments(ref: string) {
    const [row, docs] = await Promise.all([
      serviceRequest<CustomerBrief>(binding, `briefs/${ref}`),
      serviceRequest<{documents: BriefDocument[]}>(binding, `briefs/${ref}/documents`),
    ]);
    if (!isCustomerBrief(row) || !Array.isArray(docs.documents)) throw new Error("invalid_response");
    if (alive.current) {setBrief(row); setContent(row.content); setDocuments(docs.documents); setFile(null);}
  }
  async function run(operation: Operation) {
    if (lock.current || !navigator.onLine || conflict || pending && operation !== pending) return;
    lock.current = true; setBusy(true); setPending(operation); setMessage("");
    try {
      const result = await serviceRequest<CustomerBrief & Completion>(binding, operation.path,
        {method: "POST", body: operation.body, headers: operation.headers});
      if (!alive.current) return;
      if (operation.kind === "brief") {
        if (!isCustomerBrief(result)) throw new Error("invalid_response");
        setBrief(result); setContent(result.content);
        // Keep the mounted editor; parent may replace the URL without remounting it.
        callbacks.current.onSaved?.(result.brief_ref); setMessage(t.saved);
      } else if (operation.kind === "publish") {
        if (!result.posted_ref && !result.request_ref) throw new Error("invalid_response");
        setPending(null); callbacks.current.onComplete(result); return;
      } else if (brief) await refreshDocuments(brief.brief_ref);
      if (alive.current) setPending(null);
    } catch (error) {
      if (!alive.current) return;
      if (error instanceof ServiceRequestError && [401, 403, 404].includes(error.status)) deny();
      else if (error instanceof ServiceRequestError && error.status >= 400 && error.status < 500 && error.status !== 408) {
        setPending(null);
        if (operation.kind === "document" && error.detail === "service_brief_pdf_uploads_disabled") {
          setBrief(current => current ? {...current, pdf_uploads_enabled: false} : current); setFile(null);
        }
        if (error.status === 409) {setConflict(true); setMessage(t.stale);}
        else setMessage(operation.kind === "document" && error.detail === "service_brief_pdf_uploads_disabled" ? t.pdfDisabled : error.status === 429 ? t.busy : error.status === 413 ? t.pdfHelp : t.invalid);
      } else setMessage(t.uncertain);
    } finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  function command(action: "save" | "review") {
    const payload = {operation_id: crypto.randomUUID(),
      ...(brief ? {revision: brief.revision} : {}),
      ...(action === "review" ? {summary_digest: brief?.summary_digest} : {content: normalize(content)})};
    return run({path: brief ? `briefs/${brief.brief_ref}/${action}` : "briefs", body: JSON.stringify(payload), kind: "brief"});
  }
  function publish() {
    if (!brief || brief.status !== "REVIEWED" || dirty) return;
    const selected = destination?.customer_branches.find(row => row.branch_ref === branch);
    if (brief.content.direct_offering_ref && (!destination || destination.branch_coverage_specified && !selected)) return;
    const choice = selected ? {selected_branch_ref: selected.branch_ref, selected_branch_revision: selected.revision, selected_coverage_revision: selected.coverage_revision} : branchChoice;
    return run({path: `briefs/${brief.brief_ref}/${brief.content.direct_offering_ref ? "send" : "publish"}`, kind: "publish",
      body: JSON.stringify({operation_id: crypto.randomUUID(), revision: brief.revision, ...(brief.content.direct_offering_ref ? choice : {})})});
  }
  async function download(document: BriefDocument) {
    if (!brief || lock.current) return;
    lock.current = true; setBusy(true);
    try {
      const response = await fetch(`${requestBase}/briefs/${brief.brief_ref}/documents/${document.document_ref}/download`,
        {cache: "no-store", credentials: "same-origin", headers: {"X-Shida-Session": binding}, signal: AbortSignal.timeout(20000)});
      if ([401, 403, 404].includes(response.status)) {if (alive.current) deny(); return;}
      if (!response.ok || !response.headers.get("content-type")?.startsWith("application/pdf")) throw new Error();
      const blob = await response.blob(); if (!alive.current) return;
      const url = URL.createObjectURL(blob), link = window.document.createElement("a");
      link.href = url; link.download = "service-request.pdf"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {if (alive.current) setMessage(t.unavailable);}
    finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  function reloadSaved() {
    if (!brief && !reference) return;
    if (dirty && !window.confirm(t.leave)) return;
    setConflict(false); setPending(null); setMessage(""); setReviewing(false);
    if (reference) {setLoading(true); setReload(value => value + 1);}
    else if (brief) {
      setLoading(true);
      void refreshDocuments(brief.brief_ref).catch(() => {if (alive.current) setLoadError(true);})
        .finally(() => {if (alive.current) setLoading(false);});
    }
  }
  if (denied) return <p role="alert">{t.denied}</p>;
  if (loading) return <p role="status">{t.loading}</p>;
  if (loadError) return <section><p role="alert">{t.unavailable}</p><button onClick={reloadSaved}>{t.retry}</button></section>;
  const status = brief ? ({DRAFT: t.draft, REVIEWED: t.reviewed, PUBLISHED: t.published, CLOSED: t.closed, EXPIRED: t.expired})[brief.status] : t.draft;
  const disabled = busy || !!pending || conflict || !online;
  const selectedCategory = serviceCategoryExperience(content.category, locale);
  return <section className="svc-request" lang={locale} aria-label={t.title}>
    <header><span className="svc-request-tag">{status}</span><h1>{t.title}</h1>
      {(destination || direct) && <p>{destination?.name ?? direct?.name}</p>}
      {editable(brief) && <><p>{t.expiry}</p>{brief && <p>{t.expires} {dateText(brief.expires_at, locale, "Africa/Kinshasa")} · Kinshasa</p>}</>}
    </header>
    {!online && <p role="status">{t.offline}</p>}
    {message && <p className="svc-request-notice" role="status">{message}</p>}
    {pending && !busy && <button type="button" className="button button-primary" disabled={!online} onClick={() => void run(pending)}>{t.retry}</button>}
    {conflict && <button type="button" onClick={reloadSaved}>{t.reload}</button>}
    {target && canEdit && !destination && <p role="status">{destinationError ? t.unavailable : t.loading}</p>}
    {destinationError && canEdit && <button disabled={busy || !!pending} onClick={() => setReload(value => value + 1)}>{t.retry}</button>}
    {editable(brief) ? <>
      <ol className="svc-request-steps" aria-label={t.title}>
        <li aria-current={!reviewing ? "step" : undefined}>{t.description}</li>
        <li aria-current={reviewing && brief?.status !== "REVIEWED" ? "step" : undefined}>{t.summary}</li>
        <li aria-current={reviewing && brief?.status === "REVIEWED" ? "step" : undefined}>{content.direct_offering_ref ? t.send : t.publish}</li>
      </ol>
      {!reviewing ? <>
        <form className="svc-brief-card" onSubmit={event => {event.preventDefault(); void command("save");}}>
          <fieldset disabled={disabled || !!target && !destination}><legend>{t.description}</legend>
            <label>{t.category}<select value={content.category} required disabled={!!content.direct_offering_ref} onChange={event => field("category", event.target.value)}>
              <option value="">{t.choose}</option>{Object.keys(categories.categories).map(category =>
                <option key={category} value={category}>{serviceCategoryExperience(category, locale)?.service}</option>)}
            </select></label>
            <label>{selectedCategory?.request ?? t.description}<textarea rows={6} maxLength={2000} value={content.description ?? ""} onChange={event => field("description", event.target.value)} aria-describedby="brief-privacy"/></label>
            <p id="brief-privacy">{t.privacy}</p>
            <div className="svc-request-grid">
              <label>{t.city}<input maxLength={100} value={content.city ?? ""} onChange={event => field("city", event.target.value)}/></label>
              <label>{t.commune}<input maxLength={100} value={content.commune ?? ""} onChange={event => field("commune", event.target.value)}/></label>
            </div>
            <label>{t.timing}<textarea rows={2} maxLength={500} value={content.timing ?? ""} onChange={event => field("timing", event.target.value)}/></label>
            {(content.preferred_date || content.preferred_start_time || content.preferred_end_time) && <div className="svc-request-grid">
              <label>{t.preferred_date}<input type="date" value={content.preferred_date ?? ""} onChange={event => field("preferred_date", event.target.value)}/></label>
              <label>{t.preferred_start_time}<input type="time" value={content.preferred_start_time ?? ""} onChange={event => field("preferred_start_time", event.target.value)}/></label>
              <label>{t.preferred_end_time}<input type="time" value={content.preferred_end_time ?? ""} onChange={event => field("preferred_end_time", event.target.value)}/></label>
            </div>}
            <div className="svc-request-grid">
              <label>{t.budget}<input inputMode="decimal" maxLength={16} value={content.budget_amount ?? ""} onChange={event => setContent(current => ({...current, budget_amount: event.target.value, budget_currency: event.target.value ? current.budget_currency ?? "CDF" : undefined}))}/></label>
              <label>{t.currency}<select disabled={!content.budget_amount} value={content.budget_currency ?? "CDF"} onChange={event => field("budget_currency", event.target.value)}><option>CDF</option><option>USD</option></select></label>
            </div>
            <button type="submit" className="button button-primary">{busy ? t.working : t.save}</button>
          </fieldset>
        </form>
        <section className="svc-brief-card" aria-label={t.pdf}><h2>{t.pdf}</h2>
          {brief?.pdf_uploads_enabled === true ? <><p>{t.pdfHelp}</p><p>{t.retention}</p></> : <p>{t.pdfDisabled}</p>}
          {brief?.pdf_uploads_enabled !== true ? null : dirty ? <p>{t.save}</p> : <fieldset disabled={disabled}>
            <label>{t.pdf}<input type="file" accept="application/pdf,.pdf" onChange={event => {setFile(event.target.files?.[0] ?? null); setMessage("");}}/></label>
            <button type="button" disabled={!file || file.size > 10 * 1024 * 1024} onClick={() => file && void run({
              path: `briefs/${brief.brief_ref}/document-upload`, body: file, kind: "document",
              headers: {"Content-Type": "application/pdf", "X-Operation-Id": crypto.randomUUID(), "X-Brief-Revision": String(brief.revision)},
            })}>{t.upload}</button>
          </fieldset>}
          {documents.map(document => <article key={document.document_ref}>
            <p role="status">{({RECEIVED: t.received, CHECKING: t.checking, READY: t.ready, UNREADABLE: t.unreadable,
              REJECTED: t.rejected, FAILED: t.scanUnavailable, DELETING: t.removed, DELETED: t.removed})[document.status]}</p>
            {document.preview && <details><summary>{t.preview}</summary><pre>{document.preview}</pre>{document.truncated && <p>{t.truncated}</p>}</details>}
            {["RECEIVED", "CHECKING"].includes(document.status) && <button type="button" disabled={disabled || dirty} onClick={reloadSaved}>{t.reload}</button>}
            {document.has_original && <button type="button" disabled={disabled} onClick={() => void download(document)}>{t.download}</button>}
            {!["DELETING", "DELETED"].includes(document.status) && brief && <button type="button" disabled={disabled || dirty}
              onClick={() => void run({path: `briefs/${brief.brief_ref}/documents/${document.document_ref}/remove`, kind: "remove", body: JSON.stringify({revision: document.revision})})}>{t.remove}</button>}
          </article>)}
        </section>
        <button type="button" className="button button-primary" disabled={disabled || !brief || dirty} onClick={() => {setReviewing(true); setMessage("");}}>{t.review}</button>
      </> : brief && <section className="svc-brief-card">
        <h2>{t.summary}</h2><p>{content.direct_offering_ref ? t.directAudience : t.audience}</p>
        <dl>{(["description", "city", "commune", "timing", "preferred_date", "preferred_start_time", "preferred_end_time", "budget_amount", "budget_currency"] as const).filter(key => brief.summary[key]).map(key =>
          <div key={key}><dt>{key === "budget_amount" ? t.budget : key === "budget_currency" ? t.currency : t[key]}</dt><dd>{brief.summary[key]}</dd></div>)}</dl>
        {destination?.branch_coverage_specified && <><p>{c.branchPrivacy}</p><label>{c.branch}
          <select value={branch} disabled={disabled} onChange={event => setBranch(event.target.value)}><option value="">{c.branch}</option>
            {destination.customer_branches.map(row => <option key={row.branch_ref} value={row.branch_ref}>{row.name} · {row.broad_area}</option>)}
          </select></label></>}
        <div className="svc-request-actions"><button type="button" disabled={disabled} onClick={() => setReviewing(false)}>{t.edit}</button>
          {brief.status === "REVIEWED" ? <button type="button" className="button button-primary" disabled={disabled || !!target && (!destination || destination.branch_coverage_specified && !branch)} onClick={() => void publish()}>{content.direct_offering_ref ? t.send : t.publish}</button>
            : <button type="button" className="button button-primary" disabled={disabled} onClick={() => void command("review")}>{t.confirm}</button>}
        </div>
      </section>}
    </> : brief && <>
      <section className="svc-brief-card"><h2>{t.summary}</h2><p>{brief.summary.description}</p>
        {(brief.posted_ref || brief.request_ref) && <button type="button" onClick={() => callbacks.current.onComplete(brief)}>{t.follow}</button>}
      </section>
      <section className="svc-brief-card"><h2>{t.pdf}</h2><p>{t.retention}</p>
        {documents.map(document => <article key={document.document_ref}>
          {document.has_original ? <button type="button" disabled={disabled} onClick={() => void download(document)}>{t.download}</button> :
            <p>{["DELETING", "DELETED"].includes(document.status) ? t.removed : t.scanUnavailable}</p>}
        </article>)}
      </section>
    </>}
  </section>;
}
