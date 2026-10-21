"use client";
import {useEffect, useRef, useState} from "react";
import type {PostedRequest, PrivateProposal, ProposalVersion, QuoteTerms} from "../../lib/services-request-browser";
import {serviceCategoryExperience, type ServiceLocale} from "../../lib/services-category-experience";
import {requestWords} from "../../lib/services-request-copy";
import {comparisonWords} from "../../lib/services-comparison-copy";
import {opportunityWords} from "../../lib/services-opportunity-copy";
import {ServicesRequestSupport} from "./services-request-support";
import {serviceAmount, serviceLocalInput, serviceUtcInput} from "../../lib/service-time";
import {dateText, useWorkDraft, leaveWork} from "../../lib/restaurant-work";
import "./service-request-workspace.css";

type Offering = {public_ref: string; service_name: string; category: string; commune: string | null; is_active: string; requests_enabled: boolean};
type Props = {base: string; binding: string; locale: ServiceLocale; services: Offering[]; mine?: boolean; onDenied: () => void;
  initialRequest?: string; initialProposal?: string; initialOffering?: string};
type Form = {amount: string; currency: string; pricing_description: string; duration_minutes: string; start: string; terms: string; expires: string};
const formFor = (terms?: QuoteTerms): Form => ({amount: terms?.amount ?? "", currency: terms?.currency ?? "CDF",
  pricing_description: terms?.pricing_description ?? "", duration_minutes: terms?.duration_minutes ? String(terms.duration_minutes) : "",
  start: serviceLocalInput(terms?.proposed_start ?? ""), terms: terms?.terms ?? "", expires: serviceLocalInput(terms?.expires_at ?? "")});
type Operation = {path: string; body: string; kind: "start" | "save" | "submit" | "ask" | "withdraw"};
class Failure extends Error {constructor(public status: number) {super(String(status));}}

export function ServicesOpportunities(props: Props) {
  return <Opportunities key={`${props.base}:${props.binding}:${props.mine ? "mine" : "available"}`} {...props}/>;
}
function Opportunities({base, binding, locale, services, mine, onDenied, initialRequest, initialProposal, initialOffering}: Props) {
  const t = opportunityWords(locale), common = requestWords(locale), c = comparisonWords(locale);
  const [offering, setOffering] = useState(initialOffering ?? services.find(row => row.is_active === "yes" && row.requests_enabled)?.public_ref ?? services[0]?.public_ref ?? "");
  const [requests, setRequests] = useState<PostedRequest[]>([]), [proposals, setProposals] = useState<PrivateProposal[]>([]);
  const [cursor, setCursor] = useState<string | null>(null), [proposal, setProposal] = useState<PrivateProposal | null>(null);
  const [form, setForm] = useState<Form>(formFor()), [question, setQuestion] = useState("");
  const [review, setReview] = useState(false), [withdraw, setWithdraw] = useState(false);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [pending, setPending] = useState<Operation | null>(null), [conflict, setConflict] = useState(false), [reload, setReload] = useState(0);
  const [denied, setDenied] = useState(false);
  const [history, setHistory] = useState<ProposalVersion[] | null>(null), [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const entryConsumed = useRef(false);
  const alive = useRef(true), lock = useRef(false), denyCallback = useRef(onDenied);
  useEffect(() => {denyCallback.current = onDenied;}, [onDenied]);
  const dirty = !!proposal && JSON.stringify(form) !== JSON.stringify(formFor(proposal.draft));
  useWorkDraft(dirty || !!pending || !!question, common.leave);
  async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${base}/transactions/competition/${path}`, {...init, credentials: "same-origin", cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(20000), headers: {Accept: "application/json", "X-Shida-Session": binding,
        ...(init.body ? {"Content-Type": "application/json"} : {})}});
    const value = await response.json(); if (!response.ok) throw new Failure(response.status); return value as T;
  }
  function deny() {setDenied(true); setProposal(null); setForm(formFor()); setRequests([]); setProposals([]); setPending(null); setQuestion(""); denyCallback.current();}
  function apply(value: PrivateProposal) {
    setProposal(value); setForm(formFor(value.draft)); setQuestion(""); setReview(false); setWithdraw(false); setHistory(null); setHistoryCursor(null);
    const url = new URL(window.location.href);
    url.searchParams.set("proposal", value.proposal_ref); url.searchParams.set("request", value.posted_ref);
    if (value.offering_ref) url.searchParams.set("offering", value.offering_ref);
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event("services:location"));
  }
  useEffect(() => {
    alive.current = true; let active = true; const controller = new AbortController();
    if (!offering) return () => {alive.current = false;};
    const entry = new URLSearchParams(window.location.search);
    const exact = (value: string | null | undefined, prefix: string) => value && new RegExp(`^${prefix}_[A-Za-z0-9_-]{1,28}$`).test(value) ? value : undefined;
    const entryProposal = !entryConsumed.current ? exact(initialProposal ?? entry.get("proposal"), "SPF") : undefined;
    const entryRequest = !entryConsumed.current ? exact(initialRequest ?? entry.get("request"), "SPR") : undefined;
    const entryOffering = !entryConsumed.current ? exact(initialOffering ?? entry.get("offering"), "SVC") : undefined;
    const selected = entryOffering && services.some(row => row.public_ref === entryOffering) ? entryOffering : offering;
    if (selected !== offering) {queueMicrotask(() => {if (active) setOffering(selected);}); return () => {active = false; controller.abort();};}
    entryConsumed.current = true;
    const path = mine ? `proposals?offering_ref=${offering}` : `postings/available?offering_ref=${offering}`;
    const listing = entryProposal ? Promise.resolve({}) :
      api<{requests?: PostedRequest[]; proposals?: PrivateProposal[]; next_cursor?: string; next_ref?: string}>(path, {signal: controller.signal});
    void (listing as Promise<{requests?: PostedRequest[]; proposals?: PrivateProposal[]; next_cursor?: string; next_ref?: string}>)
      .then(async value => {
        if (!active) return;
        setRequests(value.requests ?? []); setProposals(value.proposals ?? []); setCursor(value.next_cursor ?? value.next_ref ?? null);
        if (entryProposal) {
          const detail = await api<PrivateProposal>(`proposals/${entryProposal}`, {signal: controller.signal});
          if (active) apply(detail);
        } else if (entryRequest && !mine) {
          const detail = await api<PostedRequest>(`postings/${entryRequest}?offering_ref=${offering}`, {signal: controller.signal});
          if (active) setRequests(current => [detail, ...current.filter(row => row.posted_ref !== detail.posted_ref)]);
        }
      }).catch(error => {if (active) {if (error instanceof Failure && [401, 403].includes(error.status)) deny(); else setMessage(common.unavailable);}})
      .finally(() => {if (active) setLoading(false);});
    return () => {active = false; alive.current = false; controller.abort();};
    // Changes to context remount this component; the selected catalogue item is
    // the only discovery selector. Never adopt an Organization from a query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, binding, offering, mine, reload]);
  async function open(reference: string) {
    if (lock.current || pending || !leaveWork()) return;
    lock.current = true; setBusy(true); setMessage("");
    try {const row = await api<PrivateProposal>(`proposals/${reference}`); if (alive.current) {apply(row); setConflict(false);}}
    catch (error) {if (alive.current) {if (error instanceof Failure && [401, 403, 404].includes(error.status)) deny(); else setMessage(common.unavailable);}}
    finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  async function versions() {
    if (!proposal || lock.current) return; lock.current = true; setBusy(true);
    try {
      const result = await api<{versions: ProposalVersion[]; next_ref: string | null}>(`proposals/${proposal.proposal_ref}/history${historyCursor ? `?before_ref=${historyCursor}` : ""}`);
      if (alive.current) {setHistory(rows => [...rows ?? [], ...result.versions]); setHistoryCursor(result.next_ref);}
    } catch (error) {if (alive.current) {
      if (error instanceof Failure && [401, 403, 404].includes(error.status)) deny(); else setMessage(common.unavailable);
    }} finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  async function more() {
    if (!cursor || lock.current) return; lock.current = true; setBusy(true);
    try {
      const value = await api<{requests?: PostedRequest[]; proposals?: PrivateProposal[]; next_cursor?: string; next_ref?: string}>(
        `${mine ? "proposals" : "postings/available"}?offering_ref=${offering}&before_ref=${cursor}`);
      if (alive.current) {setRequests(rows => [...rows, ...value.requests ?? []]); setProposals(rows => [...rows, ...value.proposals ?? []]); setCursor(value.next_cursor ?? value.next_ref ?? null);}
    } catch (error) {if (alive.current) {
      if (error instanceof Failure && [401, 403].includes(error.status)) deny(); else setMessage(common.unavailable);
    }}
    finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  async function run(operation: Operation) {
    if (lock.current || conflict || pending && pending !== operation || !navigator.onLine) return;
    lock.current = true; setBusy(true); setPending(operation); setMessage("");
    try {
      const result = await api<PrivateProposal>(operation.path, {method: "POST", body: operation.body});
      const detail = await api<PrivateProposal>(`proposals/${result.proposal_ref}`);
      if (alive.current) {apply(detail); setPending(null); setMessage(operation.kind === "submit" ? t.sent : t.saved);}
    } catch (error) {
      if (!alive.current) return;
      if (error instanceof Failure && [401, 403, 404].includes(error.status)) deny();
      else if (error instanceof Failure && error.status >= 400 && error.status < 500 && error.status !== 408) {
        setPending(null); setConflict(error.status === 409); setMessage(error.status === 429 ? common.busy : error.status === 409 ? common.stale : common.invalid);
      } else setMessage(common.uncertain);
    } finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  function command(action: Exclude<Operation["kind"], "start">) {
    if (!proposal) return;
    try {
      const content: QuoteTerms = {currency: form.currency as "CDF" | "USD", pricing_description: form.pricing_description, terms: form.terms};
      if (form.amount) content.amount = serviceAmount(form.amount);
      if (form.duration_minutes) content.duration_minutes = Number(form.duration_minutes);
      if (form.start) {
        content.proposed_start = serviceUtcInput(form.start);
        if (content.duration_minutes) content.proposed_end = new Date(Date.parse(content.proposed_start) + content.duration_minutes * 60000).toISOString();
      }
      if (form.expires) content.expires_at = serviceUtcInput(form.expires);
      const body = JSON.stringify({operation_id: crypto.randomUUID(), revision: proposal.revision,
        ...(action === "save" ? {content} : action === "submit" ? {reviewed_digest: proposal.draft_digest} : action === "ask" ? {question} : {})});
      void run({kind: action, path: `proposals/${proposal.proposal_ref}/${action}`, body});
    } catch {setMessage(common.invalid);}
  }
  const date = (value?: string) => value ? `${dateText(value, locale, "Africa/Kinshasa")} · Kinshasa` : "—";
  function summary(row: PostedRequest) {
    return <><h2>{serviceCategoryExperience(row.summary.category, locale)?.service}</h2><p>{row.summary.description}</p>
      <p>{row.summary.commune || row.summary.city} · {row.summary.timing || row.summary.preferred_date}</p>
      {row.summary.budget_amount && <p>{common.budget}: {row.summary.budget_amount} {row.summary.budget_currency}</p>}
      <p>{common.expires} {date(row.expires_at)}</p></>;
  }
  function terms(value: QuoteTerms) {
    return <dl><div><dt>{c.amount}</dt><dd>{value.amount} {value.currency}</dd></div>
      <div><dt>{c.scope}</dt><dd>{value.pricing_description || "—"}</dd></div><div><dt>{c.terms}</dt><dd>{value.terms || "—"}</dd></div>
      <div><dt>{c.duration}</dt><dd>{value.duration_minutes ?? "—"}</dd></div><div><dt>{c.starts}</dt><dd>{date(value.proposed_start)}</dd></div>
      <div><dt>{c.ends}</dt><dd>{date(value.proposed_end)}</dd></div><div><dt>{c.validUntil}</dt><dd>{date(value.expires_at)}</dd></div></dl>;
  }
  if (denied) return <p role="alert">{common.denied}</p>;
  const disabled = busy || !!pending || conflict;
  const writable = proposal?.request_status === "OPEN" && !["ACCEPTED", "NOT_SELECTED"].includes(proposal.status);
  return <section className="svc-request" lang={locale} aria-label={mine ? t.mine : t.available}>
    <header><h1>{mine ? t.mine : t.available}</h1><p>{mine ? t.mineIntro : t.matching}</p></header>
    {message && <p className="svc-request-notice" role="status">{message}</p>}
    {pending && !busy && <button onClick={() => void run(pending)}>{common.retry}</button>}
    {conflict && proposal && <button disabled={busy} onClick={() => void open(proposal.proposal_ref)}>{common.reload}</button>}
    {!services.length ? <p>{t.noServices}</p> : <>
      {!mine && <label>{t.service}<select disabled={disabled} value={offering} onChange={event => {
        if (!leaveWork()) return; setOffering(event.target.value); setProposal(null); setForm(formFor()); setQuestion(""); setLoading(true); setMessage("");
      }}>{services.map(row => <option value={row.public_ref} key={row.public_ref}>{row.service_name} · {row.commune}</option>)}</select></label>}
      {loading ? <p role="status">{common.loading}</p> : proposal ? <>
        <button disabled={disabled} onClick={() => {if (leaveWork()) {
          setProposal(null); setForm(formFor()); setQuestion(""); setLoading(true); setReload(value => value + 1);
          const url = new URL(window.location.href); url.searchParams.delete("proposal"); url.searchParams.delete("request"); window.history.replaceState(null, "", url);
        }}}>{mine ? t.mine : t.available}</button>
        {proposal.request && <section className="svc-brief-card">{summary(proposal.request)}</section>}
        <span className="svc-request-tag">{c[proposal.status]}</span>
        {proposal.current && <details className="svc-brief-card"><summary>{t.sentVersion} · {c.version} {proposal.current.number}</summary>{terms({...proposal.current.content, expires_at: proposal.current.expires_at})}</details>}
        {proposal.current && <section className="svc-brief-card">
          {history?.map(value => <details key={value.version_ref}><summary>{c.version} {value.number} · {date(value.submitted_at)}</summary>
            {value.brief_summary && <p>{value.brief_summary.description}</p>}{terms({...value.content, expires_at: value.expires_at})}</details>)}
          {(!history || historyCursor) && <button disabled={disabled} onClick={() => void versions()}>{history ? common.more : c.history}</button>}
        </section>}
        {!proposal.draft_answers_current_brief && writable && <p role="status">{t.changed}</p>}
        {writable && <section className="svc-brief-card"><h2>{t.prepare}</h2><p>{t.private}</p>
          {review ? <>{terms({...proposal.draft, expires_at: proposal.draft?.expires_at && proposal.request
            ? new Date(Math.min(Date.parse(proposal.draft.expires_at), Date.parse(proposal.request.expires_at))).toISOString()
            : proposal.request?.expires_at})}<div className="svc-request-actions">
            <button disabled={disabled} onClick={() => setReview(false)}>{t.edit}</button>
            <button className="button button-primary" disabled={disabled || dirty || !proposal.draft_answers_current_brief} onClick={() => command("submit")}>{t.submit}</button>
          </div></> : <form onSubmit={event => {event.preventDefault(); command("save");}}><fieldset disabled={disabled}>
            <label>{c.scope}<textarea required maxLength={2000} value={form.pricing_description} onChange={event => setForm(current => ({...current, pricing_description: event.target.value}))}/></label>
            <div className="svc-request-grid"><label>{c.amount}<input inputMode="decimal" maxLength={30} value={form.amount} onChange={event => setForm(current => ({...current, amount: event.target.value}))}/></label>
              <label>{common.currency}<select value={form.currency} onChange={event => setForm(current => ({...current, currency: event.target.value}))}><option>CDF</option><option>USD</option></select></label></div>
            <p>{t.scheduling}</p><div className="svc-request-grid">
              <label>{c.starts}<input type="datetime-local" value={form.start} onChange={event => setForm(current => ({...current, start: event.target.value}))}/></label>
              <label>{c.duration}<input type="number" min={1} max={1440} step={1} value={form.duration_minutes} onChange={event => setForm(current => ({...current, duration_minutes: event.target.value}))}/></label>
            </div>
            <label>{c.terms}<textarea maxLength={2000} value={form.terms} onChange={event => setForm(current => ({...current, terms: event.target.value}))}/></label>
            <label>{c.validUntil}<input type="datetime-local" value={form.expires} onChange={event => setForm(current => ({...current, expires: event.target.value}))}/></label>
            <p>{common.privacy}</p><button type="submit">{t.save}</button>
            <button type="button" className="button button-primary" disabled={dirty || !proposal.draft_answers_current_brief} onClick={() => setReview(true)}>{t.review}</button>
          </fieldset></form>}
        </section>}
        <section className="svc-brief-card"><h2>{t.question}</h2><p>{t.privateReply}</p>
          {proposal.clarifications?.map(row => <article key={row.question_ref}><p>{row.question}</p><p>{row.answer || t.wait}</p></article>)}
          {writable && (proposal.clarifications?.length ?? 0) < 5 && <form onSubmit={event => {event.preventDefault(); command("ask");}}>
            <fieldset disabled={disabled || dirty || proposal.clarifications?.some(row => row.answers_current_brief && !row.answer)}>
              <label>{t.question}<textarea required maxLength={500} value={question} onChange={event => setQuestion(event.target.value)}/></label>
              <p>{common.privacy}</p><button>{t.ask}</button>
            </fieldset>
          </form>}
        </section>
        {writable && proposal.status === "SUBMITTED" && <section className="svc-brief-card">
          {withdraw ? <><p>{t.withdrawCheck}</p><button disabled={disabled} onClick={() => command("withdraw")}>{c.confirmWithdraw}</button></> :
            <button disabled={disabled || dirty} onClick={() => setWithdraw(true)}>{t.withdrawn}</button>}
        </section>}
      </> : <>
        {mine ? proposals.length ? proposals.map(row => <article className="svc-brief-card" key={row.proposal_ref}>
          <span className="svc-request-tag">{c[row.status]}</span>{row.request && summary(row.request)}
          <button disabled={disabled} onClick={() => void open(row.proposal_ref)}>{t.open}</button>
        </article>) : <p>{common.empty}</p> : requests.length ? requests.map(row => <article className="svc-brief-card" key={row.posted_ref}>
          {summary(row)}<button className="button button-primary" disabled={disabled} onClick={() => void run({kind: "start",
            path: `postings/${row.posted_ref}/proposals`, body: JSON.stringify({operation_id: crypto.randomUUID(), offering_ref: offering})})}>{t.prepare}</button>
          <ServicesRequestSupport reference={row.posted_ref} url={row.support_url} locale={locale}/>
        </article>) : <p>{t.empty}</p>}
        {cursor && <button disabled={disabled} onClick={() => void more()}>{common.more}</button>}
        <button disabled={disabled} onClick={() => {setLoading(true); setMessage(""); setReload(value => value + 1);}}>{common.reload}</button>
      </>}
    </>}
  </section>;
}
