"use client";
import {useEffect, useRef, useState, type ReactNode} from "react";
import categories from "../../lib/services-category-experience.json";
import {serviceCategoryExperience, type ServiceLocale} from "../../lib/services-category-experience";
import {requestWords} from "../../lib/services-request-copy";
import {addressCopy} from "../../lib/registration/address-copy";
import {serviceRequest, ServiceRequestError, isCustomerBrief, type BriefContent, type CustomerBrief} from "../../lib/services-request-browser";
import {dateText, useWorkDraft} from "../../lib/restaurant-work";
import {RegistrationCommune} from "./registration-commune";
import {ServiceProviderSummary, briefTiming} from "./service-provider-summary";

type Props = {
  binding: string; locale: ServiceLocale; brief: CustomerBrief | null; content: BriefContent;
  onChange: (content: BriefContent) => void; onPersist: (brief: CustomerBrief) => void;
  onDenied: () => void; onReload: () => void; onFollow: (result: {posted_ref: string}) => void;
  disabled: boolean; children?: ReactNode;
};
type Command = {stage: "save" | "review" | "publish"; path: string; body: string; publishing: boolean};
function command(stage: Command["stage"], path: string, data: object, publishing: boolean): Command {
  return {stage, path, publishing, body: JSON.stringify({...data, operation_id: crypto.randomUUID()})};
}
function normalized(value: BriefContent) {
  const fields = Object.entries(value).filter(([,v]) => typeof v === "string" && v.trim()).map(([k,v]) => [k,v.trim()]);
  return {...Object.fromEntries(fields), category: value.category || "", language: value.language};
}
export function ServiceOpenBrief({binding, locale, brief, content, onChange, onPersist, onDenied, onReload, onFollow, disabled, children}: Props) {
  const t = requestWords(locale), address = addressCopy[locale];
  const form = useRef<HTMLFormElement>(null), lock = useRef(false), mounted = useRef(true);
  const [pending, setPending] = useState<Command | null>(null), [busy, setBusy] = useState(false);
  const [posted, setPosted] = useState(""), [message, setMessage] = useState(""), [stale, setStale] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({}), [expanded, setExpanded] = useState(false);
  const [communes, setCommunes] = useState<string[]>([]), [locationsFailed, setLocationsFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [preview, setPreview] = useState<{key: string; summary?: BriefContent} | null>(null);
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const payload = JSON.stringify(normalized(content));
  const hasDetails = !!(content.category || content.description || content.city || content.commune || briefTiming(content) || content.budget_amount);
  const amountValid = !content.budget_amount?.trim() || (/^\d{1,12}(?:[.,]\d{1,2})?$/.test(content.budget_amount.trim()) && Number(content.budget_amount.replace(",", ".")) > 0);
  const previewPayload = amountValid ? payload : JSON.stringify(normalized({...content, budget_amount:undefined, budget_currency:undefined}));
  const kin = /^(kinshasa|kin)$/i.test(content.city?.trim() || "");
  const locked = disabled || busy || !!pending || stale;
  const saved = brief && Object.keys({...content, ...brief.content}).every(k =>
    (content[k as keyof BriefContent] || "").trim() === (brief.content[k as keyof BriefContent] || "").trim());
  const snapshot = saved ? brief.summary : preview?.key === payload ? preview.summary : undefined;
  useWorkDraft(!!pending && !posted, t.leave, locale);
  useEffect(() => {mounted.current = true; return () => {mounted.current = false;};}, []);
  useEffect(() => {
    if (!kin) return;
    const controller = new AbortController();
    fetch("/api/shida/registration-reference/?resource=locations", {signal: controller.signal}).then(async r => {
      if (!r.ok) throw Error();
      const data = await r.json();
      if (!Array.isArray(data.kinshasa_communes)) throw Error();
      if (!controller.signal.aborted) {setCommunes(data.kinshasa_communes); setLocationsFailed(false);}
    }).catch(() => {if (!controller.signal.aborted) setLocationsFailed(true);});
    return () => controller.abort();
  }, [kin, attempt]);
  useEffect(() => {
    if (saved || posted || !hasDetails) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      serviceRequest<{summary: BriefContent}>(binding, "briefs/preview", {method:"POST", body:previewPayload, signal:controller.signal})
        .then(result => {if (!controller.signal.aborted) setPreview({key:payload, summary:result.summary});})
        .catch(() => {if (!controller.signal.aborted) setPreview({key:payload});});
    }, 220);
    return () => {clearTimeout(timer); controller.abort();};
  }, [payload, previewPayload, binding, saved, posted, hasDetails, previewAttempt]);
  function update(changes: Partial<BriefContent>) {
    onChange({...content, ...changes}); setMessage(""); setErrors(current => Object.fromEntries(Object.entries(current).filter(([k]) => !(k in changes))));
  }
  const validation = (key: string) => errors[key] && <small className="svc-field-error" id={`invalid-${key}`}>{errors[key]}</small>;
  const attrs = (key: string) => ({name:key, "aria-invalid":!!errors[key], "aria-describedby":errors[key] ? `invalid-${key}` : undefined});
  function submit(publishing: boolean) {
    if (lock.current || locked) return;
    const invalid: Record<string,string> = {};
    if (publishing) {
      for (const key of ["category","description","city",...(kin ? ["commune"] as const : []),"timing"] as const) {
        if (!(key === "timing" ? briefTiming(content) : content[key])?.trim()) invalid[key] = t.requiredField;
      }
    }
    if (!amountValid) invalid.budget_amount = t.validBudget;
    setErrors(invalid);
    const first = Object.keys(invalid)[0];
    if (first) {form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return;}
    const next = publishing && saved ? afterSave(brief) : command("save", brief ? `briefs/${brief.brief_ref}/save` : "briefs",
      {content: normalized(content), ...(brief ? {revision:brief.revision} : {})}, publishing);
    void run(next);
  }
  function afterSave(row: CustomerBrief) {
    const base = `briefs/${row.brief_ref}`;
    return row.status === "REVIEWED" ? command("publish", base+"/publish", {revision:row.revision}, true)
      : command("review", base+"/review", {revision:row.revision, summary_digest:row.summary_digest}, true);
  }
  async function run(initial: Command) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    let next = initial;
    try {
      for (;;) {
        setPending(next);
        const result = await serviceRequest<CustomerBrief>(binding, next.path, {method:"POST", body:next.body});
        if (!mounted.current) return;
        if (next.stage === "publish") {
          if (!result.posted_ref) throw Error();
          setPosted(result.posted_ref); break;
        }
        if (!isCustomerBrief(result)) throw Error();
        onPersist(result);
        if (!next.publishing) break;
        next = afterSave(result);
      }
      setPending(null);
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof ServiceRequestError && [401,403].includes(error.status)) {onDenied(); return;}
      if (error instanceof ServiceRequestError && error.status >= 400 && error.status < 500 && error.status !== 408) {
        setPending(null); setStale(error.status === 409); setMessage(error.status === 409 ? t.stale : error.status === 429 ? t.busy : t.invalid);
      } else setMessage(t.uncertain);
    } finally {lock.current = false; if (mounted.current) setBusy(false);}
  }
  if (posted) return <section className="svc-request svc-open-brief"><h1>{t.postedSuccess}</h1><a className="button button-primary" href={`?request=${posted}`} onClick={e=>{e.preventDefault();onFollow({posted_ref:posted});}}>{t.track}</a></section>;
  return <section className="svc-request svc-open-brief" lang={locale} aria-label={t.needHeading}>
    <h1>{t.needHeading}</h1>
    <form ref={form} noValidate onSubmit={e => {e.preventDefault(); submit(true);}}>
      <div className="svc-brief-columns"><fieldset className="svc-open-fields" disabled={locked}>
        <label><span>{t.category} <span aria-hidden="true">*</span></span><select {...attrs("category")} required value={content.category} onChange={e=>update({category:e.target.value})}>
          <option value="">{t.choose}</option>{Object.keys(categories.categories).map(key=><option key={key} value={key}>{serviceCategoryExperience(key,locale)?.service}</option>)}</select>{validation("category")}</label>
        <label><span>{t.needDescription} <span aria-hidden="true">*</span></span><textarea {...attrs("description")} aria-describedby={errors.description ? "invalid-description brief-privacy" : "brief-privacy"} rows={5} required maxLength={2000} value={content.description || ""} placeholder={t.needExample} onChange={e=>update({description:e.target.value})}/>{validation("description")}</label>
        <p id="brief-privacy">{t.privacy}</p>
        <div className="svc-open-pair"><label><span>{t.city} <span aria-hidden="true">*</span></span><input {...attrs("city")} required maxLength={100} value={content.city || ""} onChange={e=>update({city:e.target.value})}/>{validation("city")}</label>
        <label><span>{kin ? address.commune : t.commune}{kin && <span aria-hidden="true"> *</span>}</span>{kin ? <RegistrationCommune {...attrs("commune")} required value={content.commune || ""} locale={locale} communes={communes} onChange={e=>update({commune:e.target.value})}/>
          : <input {...attrs("commune")} maxLength={100} value={content.commune || ""} onChange={e=>update({commune:e.target.value})}/>}
          {validation("commune")}</label></div>
        {kin && locationsFailed && <p role="alert">{address.failed} <button type="button" onClick={()=>setAttempt(n=>n+1)}>{t.retry}</button></p>}
        <label><span>{t.timing} <span aria-hidden="true">*</span></span><input {...attrs("timing")} required maxLength={500} value={briefTiming(content)} onChange={e=>update({timing:e.target.value, preferred_date:undefined, preferred_start_time:undefined, preferred_end_time:undefined})}/>{validation("timing")}</label>
        <div className="svc-open-pair"><label>{t.budget}<input {...attrs("budget_amount")} inputMode="decimal" maxLength={16} value={content.budget_amount || ""} onChange={e=>update({budget_amount:e.target.value, budget_currency:e.target.value.trim() ? content.budget_currency || "CDF" : undefined})}/>{validation("budget_amount")}</label>
        <label>{t.currency}<select disabled={!content.budget_amount} value={content.budget_currency || "CDF"} onChange={e=>update({budget_currency:e.target.value as "CDF"|"USD"})}><option>CDF</option><option>USD</option></select></label></div>
      </fieldset>
      <aside className={`svc-live-preview ${expanded ? "expanded" : ""}`}>
        <h2>{t.providerPreview}</h2><button className="svc-preview-toggle" type="button" aria-expanded={expanded} aria-controls="svc-preview-body" onClick={()=>setExpanded(!expanded)}>{t.providerPreview}<span aria-hidden="true">{expanded ? "âŒƒ" : "âŒ„"}</span></button>
        <div id="svc-preview-body">{!hasDetails ? null : snapshot ? <ServiceProviderSummary summary={snapshot} locale={locale}/> : preview?.key === payload ? <p>{t.unavailable} <button type="button" onClick={()=>setPreviewAttempt(n=>n+1)}>{t.retry}</button></p> : <p>{t.loading}</p>}</div>
      </aside></div>
      <div className="svc-open-actions"><button type="button" disabled={locked} onClick={()=>submit(false)}>{t.save}</button><button type="submit" className="button button-primary" disabled={locked}>{t.publish}</button></div>
      <p className="svc-open-deadline">{t.deadline}</p>
    </form>
    {saved && !busy && <p role="status">{t.saved} Â· {t.draftLife} Â· {t.expires} {dateText(brief.expires_at,locale,"Africa/Kinshasa")}</p>}
    {message && <p role="status">{message}</p>}
    {pending && !busy && <button disabled={disabled} onClick={()=>void run(pending)}>{t.retry}</button>}
    {stale && <button onClick={onReload}>{t.reload}</button>}
    {children && <fieldset disabled={busy || !!pending || stale}>{children}</fieldset>}
  </section>;
}
