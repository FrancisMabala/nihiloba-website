"use client";
import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import {serviceRequest, ServiceRequestError, type PostedRequest, type PrivateProposal, type ProposalVersion} from "../../lib/services-request-browser";
import {comparisonWords} from "../../lib/services-comparison-copy";
import {requestWords} from "../../lib/services-request-copy";
import type {ServiceLocale} from "../../lib/services-category-experience";
import {dateText, useWorkDraft} from "../../lib/restaurant-work";
import {ServiceRequestRevision} from "./service-request-revision";
import {revisionWords} from "../../lib/services-revision-copy";

type Props = {binding: string; locale: ServiceLocale; reference: string; onDenied: () => void; onBooking: (reference: string) => void};
type Comparison = {request: PostedRequest; proposals: PrivateProposal[]; next_ref: string | null};
type Pending = {path: string; body: string; kind: "accept" | "answer" | "withdraw"};
export function ServiceRequestComparison(props: Props) {
  return <ComparisonPanel key={`${props.binding}:${props.reference}`} {...props}/>;
}
function ComparisonPanel({binding, locale, reference, onDenied, onBooking}: Props) {
  const t = comparisonWords(locale), common = requestWords(locale);
  const [data, setData] = useState<Comparison | null>(null), [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [pending, setPending] = useState<Pending | null>(null);
  const [selected, setSelected] = useState<PrivateProposal | null>(null), [branch, setBranch] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({}), [withdraw, setWithdraw] = useState(false);
  const [conflict, setConflict] = useState(false), [denied, setDenied] = useState(false);
  const [history, setHistory] = useState<{proposal: string; versions: ProposalVersion[]; next_ref: string | null} | null>(null);
  const alive = useRef(true), lock = useRef(false), callbacks = useRef({onDenied, onBooking});
  useEffect(() => {callbacks.current = {onDenied, onBooking};}, [onDenied, onBooking]);
  useWorkDraft(!!pending || Object.values(answers).some(Boolean), common.leave);
  useEffect(() => {
    alive.current = true; let active = true; const controller = new AbortController();
    serviceRequest<Comparison>(binding, `postings/${reference}/proposals`, {signal: controller.signal})
      .then(value => {if (!value.request || !Array.isArray(value.proposals)) throw new Error(); if (active) setData(value);})
      .catch(error => {
        if (!active) return;
        if (error instanceof ServiceRequestError && [401, 403, 404].includes(error.status)) {setDenied(true); callbacks.current.onDenied();}
        else setMessage(common.unavailable);
      }).finally(() => {if (active) setLoading(false);});
    return () => {active = false; alive.current = false; controller.abort();};
  }, [binding, reference, common.unavailable]);
  function deny() {setDenied(true); setData(null); setSelected(null); setHistory(null); setAnswers({}); setPending(null); callbacks.current.onDenied();}
  async function load(more = false) {
    if (lock.current || pending) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const value = await serviceRequest<Comparison>(binding, `postings/${reference}/proposals${more && data?.next_ref ? `?before_ref=${data.next_ref}` : ""}`);
      if (alive.current) {
        setData(current => more && current ? {...value, proposals: [...current.proposals, ...value.proposals]} : value);
        setConflict(false); if (!more) {setSelected(null); setWithdraw(false); setHistory(null); setAnswers({});}
      }
    } catch (error) {
      if (alive.current) {if (error instanceof ServiceRequestError && [401, 403, 404].includes(error.status)) deny(); else setMessage(common.unavailable);}
    } finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  async function run(operation: Pending) {
    if (lock.current || conflict || pending && pending !== operation || !navigator.onLine) return;
    lock.current = true; setBusy(true); setPending(operation); setMessage("");
    try {
      const result = await serviceRequest<{reservation_ref?: string}>(binding, operation.path, {method: "POST", body: operation.body});
      if (!alive.current) return;
      if (operation.kind === "accept") {
        if (!result.reservation_ref || !/^RSV_[A-Za-z0-9_-]+$/.test(result.reservation_ref)) throw new Error();
        setPending(null); callbacks.current.onBooking(result.reservation_ref); return;
      }
      const value = await serviceRequest<Comparison>(binding, `postings/${reference}/proposals`);
      if (alive.current) {setData(value); setSelected(null); setAnswers({}); setWithdraw(false); setPending(null); setMessage(common.saved);}
    } catch (error) {
      if (!alive.current) return;
      if (error instanceof ServiceRequestError && [401, 403, 404].includes(error.status)) deny();
      else if (error instanceof ServiceRequestError && error.status >= 400 && error.status < 500 && error.status !== 408) {
        setPending(null); setMessage(error.status === 409 ? common.stale : common.invalid); setConflict(error.status === 409);
      } else setMessage(common.uncertain);
    } finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  async function loadHistory(proposal: string, cursor?: string | null) {
    if (lock.current) return; lock.current = true; setBusy(true);
    try {
      const value = await serviceRequest<{versions: ProposalVersion[]; next_ref: string | null}>(binding, `proposals/${proposal}/history${cursor ? `?before_ref=${cursor}` : ""}`);
      if (alive.current) setHistory(current => ({proposal, versions: cursor && current?.proposal === proposal ? [...current.versions, ...value.versions] : value.versions, next_ref: value.next_ref}));
    } catch (error) {
      if (alive.current) {if (error instanceof ServiceRequestError && [401, 403, 404].includes(error.status)) deny(); else setMessage(common.unavailable);}
    } finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  const date = (value?: string) => value ? `${dateText(value, locale, "Africa/Kinshasa")} · Kinshasa` : "—";
  function quotation(version: ProposalVersion) {
    const terms = version.content;
    return <dl>
      <div><dt>{t.version}</dt><dd>{version.number}</dd></div>
      <div><dt>{t.amount}</dt><dd>{terms.amount} {terms.currency}</dd></div>
      {terms.pricing_description && <div><dt>{t.scope}</dt><dd>{terms.pricing_description}</dd></div>}
      {terms.terms && <div><dt>{t.terms}</dt><dd>{terms.terms}</dd></div>}
      <div><dt>{t.duration}</dt><dd>{terms.duration_minutes}</dd></div>
      <div><dt>{t.starts}</dt><dd>{date(terms.proposed_start)}</dd></div>
      <div><dt>{t.ends}</dt><dd>{date(terms.proposed_end)}</dd></div>
      <div><dt>{t.validUntil}</dt><dd>{date(version.expires_at)}</dd></div>
    </dl>;
  }
  function provider(proposal: PrivateProposal) {
    const profile = proposal.provider;
    return profile && <><h2>{profile.name}</h2><p>{profile.service_name}</p>
      <Link href={`${locale === "en" ? "" : `/${locale}`}/shida/services/providers/${profile.provider_ref}`} target="_blank" rel="noopener noreferrer">{t.provider} ↗</Link>
      <p>{profile.rating.count ? `${t.reviews}: ${profile.rating.average} / 5 (${profile.rating.count})` : t.noReviews}</p>
      {!!profile.reviews.length && <details><summary>{t.reviews}</summary>{profile.reviews.map((review, index) => <blockquote key={index}>{review.comment}</blockquote>)}</details>}
    </>;
  }
  if (denied) return <p className="svc-request" role="alert">{common.denied}</p>;
  if (loading) return <p className="svc-request" role="status">{common.loading}</p>;
  if (editing && data) return <ServiceRequestRevision binding={binding} locale={locale} request={data.request}
    onDenied={deny} onBack={() => {setEditing(false); void load();}} onSaved={() => {setEditing(false); void load();}}/>;
  const disabled = busy || !!pending || conflict;
  const choice = selected?.provider?.customer_branches.find(row => row.branch_ref === branch);
  return <section className="svc-request" aria-label={t.title} lang={locale}>
    <header><h1>{t.title}</h1>{data && <><span className="svc-request-tag">{t[data.request.status]}</span>
      <p>{data.request.summary.description}</p><p>{data.request.summary.commune || data.request.summary.city} · {data.request.summary.timing}</p>
      <p>{common.expires} {date(data.request.expires_at)}</p></>}</header>
    {message && <p className="svc-request-notice" role="status">{message}</p>}
    {pending && !busy && <button onClick={() => void run(pending)}>{common.retry}</button>}
    {(!data || conflict) && <button disabled={busy || !!pending} onClick={() => void load()}>{common.reload}</button>}
    {data?.request.booking && <button className="button button-primary" onClick={() => callbacks.current.onBooking(data.request.booking!.reservation_ref)}>{t.booking}</button>}
    {data?.request.status === "OPEN" && data.request.brief_ref && <button disabled={disabled || !!selected || withdraw || Object.values(answers).some(Boolean)}
      onClick={() => setEditing(true)}>{revisionWords(locale).edit}</button>}
    {selected?.current ? <section className="svc-brief-card" aria-label={t.review}>
      <p>{t.beforeAccept}</p>{provider(selected)}{quotation(selected.current)}
      {selected.provider?.branch_coverage_specified && <><p>{t.branchPrivacy}</p><label>{t.branch}
        <select disabled={disabled} value={branch} onChange={event => setBranch(event.target.value)}><option value="">{t.branch}</option>
          {selected.provider.customer_branches.map(row => <option key={row.branch_ref} value={row.branch_ref}>{row.name} · {row.broad_area}</option>)}
        </select></label></>}
      <div className="svc-request-actions"><button disabled={disabled} onClick={() => setSelected(null)}>{t.compare}</button>
        <button className="button button-primary" disabled={disabled || !data || !!selected.provider?.branch_coverage_specified && !choice}
          onClick={() => data && void run({kind: "accept", path: `postings/${reference}/accept`,
            body: JSON.stringify({operation_id: crypto.randomUUID(), revision: data.request.revision, version_ref: selected.current!.version_ref,
              ...(choice ? {selected_branch_ref: choice.branch_ref, selected_branch_revision: choice.revision, selected_coverage_revision: choice.coverage_revision} : {})})})}>{t.accept}</button>
      </div>
    </section> : data && <>
      {data.proposals.length === 0 && <p>{t.empty}</p>}
      {data.proposals.map(proposal => <article className="svc-brief-card" key={proposal.proposal_ref}>
        <span className="svc-request-tag">{t[proposal.status]}</span>{provider(proposal)}
        {proposal.current && <>{quotation(proposal.current)}
          {!proposal.current.answers_current_brief && <p>{t.olderBrief}</p>}
          {proposal.current.expired && <p>{common.expired}</p>}
          {proposal.can_review_acceptance && <button className="button button-primary" disabled={disabled} onClick={() => {setSelected(proposal); setBranch("");}}>{t.review}</button>}
          <button disabled={disabled} onClick={() => void loadHistory(proposal.proposal_ref)}>{t.history}</button>
        </>}
        {proposal.clarifications?.map(question => <section key={question.question_ref} aria-label={t.question}>
          <h3>{t.question}</h3><p>{question.question}</p><p>{t.privateReply}</p>
          {question.answer ? <p>{question.answer}</p> : question.answers_current_brief && data.request.status === "OPEN" ?
            <form onSubmit={event => {event.preventDefault(); void run({kind: "answer", path: `proposals/${proposal.proposal_ref}/answer`,
              body: JSON.stringify({operation_id: crypto.randomUUID(), revision: proposal.revision, question_ref: question.question_ref, answer: answers[question.question_ref]})});}}>
              <fieldset disabled={disabled}><label>{t.answer}<textarea required maxLength={500} value={answers[question.question_ref] ?? ""} onChange={event => setAnswers(current => ({...current, [question.question_ref]: event.target.value}))}/></label>
                <p>{common.privacy}</p><button>{t.sendAnswer}</button></fieldset>
            </form> : <p>{t.olderBrief}</p>}
        </section>)}
        {history?.proposal === proposal.proposal_ref && <section aria-label={t.history}>
          <h3>{t.history}</h3>{history.versions.map(version => <div key={version.version_ref}>
            {version.brief_summary && <p>{version.brief_summary.description}</p>}{quotation(version)}</div>)}
          {history.next_ref && <button disabled={disabled} onClick={() => void loadHistory(proposal.proposal_ref, history.next_ref)}>{common.more}</button>}
        </section>}
      </article>)}
      {data.next_ref && <button disabled={disabled} onClick={() => void load(true)}>{common.more}</button>}
      <button disabled={disabled} onClick={() => void load()}>{common.reload}</button>
      {data.request.status === "OPEN" && <section className="svc-brief-card">
        {withdraw ? <><p>{t.withdrawCheck}</p><div className="svc-request-actions">
          <button disabled={disabled} onClick={() => setWithdraw(false)}>{t.keep}</button>
          <button disabled={disabled} onClick={() => void run({kind: "withdraw", path: `postings/${reference}/withdraw`,
            body: JSON.stringify({operation_id: crypto.randomUUID(), revision: data.request.revision})})}>{t.confirmWithdraw}</button>
        </div></> : <button disabled={disabled} onClick={() => setWithdraw(true)}>{t.withdraw}</button>}
      </section>}
    </>}
  </section>;
}
