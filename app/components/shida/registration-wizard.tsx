"use client";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { PersonalWhatsAppLogin } from "./personal-whatsapp-login";
import { authMutation, markLoginUnconfirmed } from "../../lib/personal-login-browser";
import { announcePersonalSessionChange, PERSONAL_SESSION_EVENT } from "../../lib/personal-session-browser";
import { registrationCopy, privacyAcknowledgement, type RegistrationLocale } from "../../lib/registration/copy";
import { onboardingText, catalogLabel } from "../../lib/registration/onboarding-copy";
import "./registration.css";

const subscribeHydration = () => () => {};
type Kind = "personal" | "business";
type Document = { document_type: string; version: string; url: string | null; accepted: boolean };
type Draft = { onboarding_ref: string | null; revision: number | null; status: string; existing_account?: boolean;
  values: Record<string, string | null>; legal?: Document[]; legal_documents?: Document[]; remaining_fields: string[];
  required_fields?: string[]; organization_types?: string[]; sectors?: string[]; blockers?: string[]; can_complete?: boolean; completion_ready?: boolean };
class RegistrationError extends Error { constructor(public code: string, public fields: string[] = []) { super(code); } }
async function request(path: string, method = "GET", body?: unknown): Promise<Draft> {
  const response = await fetch(`/api/shida/registration/${path}/`, { method, credentials: "same-origin", cache: "no-store",
    ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new RegistrationError(data.error?.code ?? "unavailable", data.error?.fields ?? []);
  return data;
}
const businessGroups = [["name", "organization_type", "custom_organization_type", "sector"], ["personal_name", "country_code", "city"], ["commune_or_municipality", "street_or_avenue", "building_or_parcel", "quartier_or_area", "landmark"]];
export function RegistrationWizard({ locale }: { locale: RegistrationLocale }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const t = registrationCopy[locale], label = (key: string) => key === "area" ? t.area : onboardingText(locale, key);
  const base = locale === "en" ? "/shida" : `/${locale}/shida`;
  const [kind, setKind] = useState<Kind>("personal"), [step, setStep] = useState(1), [group, setGroup] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null), [values, setValues] = useState<Record<string,string>>({});
  const [decisions, setDecisions] = useState<Record<string,string>>({}), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(""), [fields, setFields] = useState<string[]>([]), [confirmCancel, setConfirmCancel] = useState(false), [saved, setSaved] = useState(false);
  const lock = useRef(false), current = useRef<Draft | null>(null), heading = useRef<HTMLHeadingElement>(null);
  const autosave = useRef<Promise<void> | null>(null), actorEpoch = useRef(0), primaryIntent = useRef(false);
  useEffect(() => () => { ++actorEpoch.current; }, []);
  const apply = (next: Draft) => { current.current = next; setDraft(next); setValues(Object.fromEntries(Object.entries(next.values ?? {}).map(([k,v]) => [k,v ?? ""]))); setDecisions({}); };
  const groups = kind === "personal" ? [["personal_name"], ["city", "country_code", "area"]] : businessGroups;
  const legalStep = groups.length, reviewStep = groups.length + 1;
  const documents = draft?.legal ?? draft?.legal_documents ?? [];
  const terminal = ["cancelled", "expired"].includes(draft?.status ?? "");
  const existing = kind === "personal" && draft?.existing_account;
  const documentName = (key: string) => key === "SHIDA_TERMS_OF_USE" ? t.terms : key === "SHIDA_PRIVACY_POLICY" ? t.privacy : t.businessTerms;
  const documentUrl = (document: Document) => {
    if (!document.url?.startsWith("https://")) return null;
    try {
      const url = new URL(document.url);
      if (locale !== "en" && url.hostname === "nihiloba.com") {
        const paths: Record<string,string> = {SHIDA_TERMS_OF_USE:"/fr/shida/conditions",SHIDA_PRIVACY_POLICY:"/fr/shida/confidentialite",SHIDA_BUSINESS_TERMS:"/fr/shida/business/conditions"};
        if (paths[document.document_type] && /^(1\.0|1\.1)$/.test(document.version)) return `${url.origin}${paths[document.document_type]}/${document.version}`;
      }
      return document.url;
    } catch { return null; }
  };
  function recover(error: unknown) {
    setSaved(false);
    if (error instanceof RegistrationError) {
      setFields(error.fields);
      if (error.code === "unauthorized") { setStep(2); setMessage(t.unauthorized); return; }
      if (["stale_onboarding","legal_version_changed","onboarding_completed","onboarding_expired","onboarding_cancelled"].includes(error.code)) { setMessage(t.changed); return; }
      if (error.fields.length) { setMessage(onboardingText(locale,"invalid")); return; }
      if (error.code === "organization_name_conflict") { setMessage(onboardingText(locale,error.code)); return; }
    }
    setMessage(t.error);
  }
  async function load(start = false) {
    if (lock.current) return;
    const epoch = actorEpoch.current;
    lock.current = true; setBusy(true); setMessage("");
    try {
      let next = await request(kind);
      if (start || next.status === "not_started") next = await request(kind,"POST",{ language: locale });
      if (epoch !== actorEpoch.current) return;
      apply(next); setStep(3); setGroup(next.existing_account ? legalStep : 0);
    } catch(error) { if (epoch === actorEpoch.current) recover(error); }
    finally { lock.current = false; setBusy(false); }
  }
  // Only the non-sensitive account choice is remembered. All private progress stays server-side.
  useEffect(() => { let alive=true;void Promise.resolve().then(()=>{try { const choice = sessionStorage.getItem("shida-registration-choice"); if (alive && choice === "business") setKind(choice); } catch {}});return()=>{alive=false;}; }, []);
  useEffect(()=>{
    const clear=()=>{++actorEpoch.current;if(step!==3)return;current.current=null;setDraft(null);setValues({});setDecisions({});setStep(2);setMessage(t.unauthorized);};
    const local=()=>{if(!lock.current)clear();};
    const storage=(event:StorageEvent)=>{if(event.key===PERSONAL_SESSION_EVENT)clear();};
    window.addEventListener(PERSONAL_SESSION_EVENT,local);window.addEventListener("storage",storage);
    return()=>{window.removeEventListener(PERSONAL_SESSION_EVENT,local);window.removeEventListener("storage",storage);};
  },[step,t.unauthorized]);
  useLayoutEffect(() => { heading.current?.focus(); }, [step, group, confirmCancel]);
  const dirty = draft && Object.entries(values).some(([key,value]) => value !== (draft.values[key] ?? ""));
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload",prevent); return () => window.removeEventListener("beforeunload",prevent);
  }, [dirty]);
  async function save(advance: boolean, submitted = values) {
    const epoch = actorEpoch.current;
    const edits = Object.fromEntries(Object.entries(submitted).filter(([k,v]) => v !== (draft?.values[k] ?? "")));
    if (autosave.current) await autosave.current;
    if (epoch !== actorEpoch.current) return;
    const state = current.current;
    if (!state || lock.current || terminal) return;
    lock.current = true; setBusy(true); setMessage(""); setFields([]); setSaved(false);
    try {
      const changed = edits;
      let next = state;
      if (existing) {
        if (advance && group === legalStep) next = await request("personal/consent","POST",{language:locale,accept_documents:decisions});
      } else if (Object.keys(changed).length || advance && Object.keys(decisions).length) {
        next = await request(`${kind}/${state.onboarding_ref}`,"PATCH",{revision:state.revision,language:locale,values:changed,...(advance ? {accept_documents:decisions} : {})});
      }
      if (epoch !== actorEpoch.current) return;
      apply(next); setSaved(true);
      if (advance) {
        const missing = (groups[group] ?? []).filter(key => next.remaining_fields.includes(key));
        if (missing.length) { setFields(missing); setMessage(onboardingText(locale,"invalid")); }
        else if (group === legalStep && (next.legal ?? next.legal_documents ?? []).some(d => !d.accepted)) setMessage(onboardingText(locale,"invalid"));
        else setGroup(Math.min(group + 1,reviewStep));
      }
    } catch(error) { recover(error); }
    finally { lock.current = false; setBusy(false); }
  }
  function saveField(key: string, value: string) {
    const epoch = actorEpoch.current;
    const state = current.current;
    if (primaryIntent.current || !state?.onboarding_ref || lock.current || autosave.current || terminal || existing || value === (state.values[key] ?? "") || !value.trim() && key !== "area") return;
    setSaved(false);
    autosave.current = (async () => {
      try {
        const next = await request(`${kind}/${state.onboarding_ref}`,"PATCH",{revision:state.revision,language:locale,values:{[key]:value}});
        if (epoch !== actorEpoch.current) return;
        current.current = next; setDraft(next);
        setValues(previous => Object.fromEntries(Object.entries({...next.values,...previous}).map(([field,currentValue]) => [field,
          field === key && currentValue === value || currentValue === (state.values[field] ?? "") ? next.values[field] ?? "" : currentValue ?? ""])));
        setSaved(true);
      } catch(error) { recover(error); }
      finally { autosave.current = null; }
    })();
  }
  async function complete() {
    const state = current.current; if (!state || lock.current) return;
    const epoch = actorEpoch.current;
    lock.current = true; setBusy(true); setMessage("");
    try {
      await authMutation(async () => {
        if (epoch !== actorEpoch.current) return;
        if (!existing && state.status !== "completed") await request(`${kind}/${state.onboarding_ref}/complete`,"POST",{revision:state.revision});
        if (epoch !== actorEpoch.current) return;
        markLoginUnconfirmed(true);
        await request("finish/session","POST",{});
        if (epoch !== actorEpoch.current) return;
        markLoginUnconfirmed(false); announcePersonalSessionChange();
      if (kind === "personal") router.push(`${base}/space/`);
      else {
        const grant = await request("business-handoff","POST",{}) as unknown as {token:string};
        if (epoch !== actorEpoch.current) return;
        if (!/^[A-Za-z0-9_-]{32,128}$/.test(grant.token)) throw new Error();
        const form = document.createElement("form"); form.method = "POST"; form.action = "https://business.nihiloba.com/handoff";
        for (const [name,value] of Object.entries({token:grant.token,language:locale})) { const field = document.createElement("input");field.type="hidden";field.name=name;field.value=value;form.appendChild(field); }
        document.body.appendChild(form); form.submit(); form.remove();
      }
      });
    } catch(error) { if (epoch === actorEpoch.current) recover(error); }
    finally { lock.current = false; setBusy(false); }
  }
  async function cancel() {
    const state = current.current; if (!state || lock.current) return;
    lock.current = true; setBusy(true);
    try { apply(await request(`${kind}/${state.onboarding_ref}/cancel`,"POST",{revision:state.revision})); setConfirmCancel(false); }
    catch(error) { recover(error); }
    finally { lock.current = false; setBusy(false); }
  }
  const visible = (groups[group] ?? []).filter(key => key !== "custom_organization_type" || values.organization_type === "other");
  return <div className="registration-shell" lang={locale}>
    <section className="registration-card" aria-busy={busy}>
      <a href={`${base}/`} className="registration-brand"><small>NIHILOBA</small><strong>SHIDA</strong></a>
      <p className="registration-progress">{t.step} {step} {t.of} 3</p>
      <h1 ref={heading} tabIndex={-1}>{step === 1 ? t.title : step === 2 ? t.verify : group === reviewStep ? t.review : group === legalStep ? onboardingText(locale,"terms") : t.profile}</h1>
      {message && <div role="alert"><p>{message}</p>{message === t.changed && <button type="button" className="button button-secondary" disabled={busy} onClick={()=>void load()}>{t.reload}</button>}</div>}
      {step === 1 && <><p>{t.choice}</p><fieldset className="registration-choices" disabled={!hydrated || busy}><legend className="sr-only">{t.choice}</legend>{(["personal","business"] as const).map(value => <label key={value} className={kind === value ? "selected" : ""}><input type="radio" name="account-kind" value={value} checked={kind === value} onChange={()=>{setKind(value);try{sessionStorage.setItem("shida-registration-choice",value);}catch{}}}/><span><strong>{t[value]}</strong><small>{value === "personal" ? t.personalHelp : t.businessHelp}</small></span></label>)}</fieldset><button className="button button-primary" disabled={!hydrated || busy} onClick={()=>{setStep(2);void load();}}>{t.next}</button><a href={`${base}/space/`}>{t.signin}</a></>}
      {step === 2 && <>{busy ? <p role="status">{t.loading}</p> : <PersonalWhatsAppLogin locale={locale} registration heading={t.verify} onAuthenticated={()=>void load()}/>}<button className="button button-secondary" disabled={busy} onClick={()=>setStep(1)}>{t.back}</button></>}
      {step === 3 && draft && (terminal ? <><p>{t.cancelled}</p><button className="button button-primary" disabled={busy} onClick={()=>void load(true)}>{t.restart}</button></> : confirmCancel ? <><p>{t.cancelQuestion}</p><button className="button button-secondary" disabled={busy} onClick={()=>setConfirmCancel(false)}>{t.back}</button><button className="button button-primary" disabled={busy} onClick={()=>void cancel()}>{t.cancel}</button></> : <>
        {existing && <p>{t.existing}</p>}
        {draft.status === "completed" && !existing ? <><p>{t.completed}</p><button className="button button-primary" disabled={busy} onClick={()=>void complete()}>{t.finish}</button></> : <form onSubmit={event=>{event.preventDefault();const submitted={...values,...Object.fromEntries(new FormData(event.currentTarget).entries())} as Record<string,string>;void(group === reviewStep ? complete() : save(true,submitted));}}>
          <fieldset disabled={busy} className="registration-fields">
            {visible.map(key => { const options = key === "organization_type" ? draft.organization_types : key === "sector" ? draft.sectors : null;
              return <div key={key}><label htmlFor={`registration-${key}`}>{label(key)}</label>{options ? <select id={`registration-${key}`} name={key} value={values[key] ?? ""} aria-invalid={fields.includes(key)} onBlur={e=>saveField(key,e.target.value)} onChange={e=>{setValues({...values,[key]:e.target.value});setSaved(false);}}><option value="">{onboardingText(locale,"choose")}</option>{options.map(value=><option value={value} key={value}>{catalogLabel(locale,value)}</option>)}</select> : <input id={`registration-${key}`} name={key} value={values[key] ?? ""} maxLength={500} autoComplete={key === "personal_name" ? "name" : key === "city" ? "address-level2" : "off"} aria-invalid={fields.includes(key)} onBlur={e=>saveField(key,e.target.value)} onChange={e=>{setValues({...values,[key]:e.target.value});setSaved(false);}}/>}{fields.includes(key) && <p className="form-error">{onboardingText(locale,"invalid")}</p>}</div>;
            })}
            {group === legalStep && documents.map(document=><label className="registration-consent" key={document.document_type}><input type="checkbox" checked={document.accepted || decisions[document.document_type] === document.version} disabled={document.accepted || !documentUrl(document)} onChange={e=>{const next={...decisions};if(e.target.checked)next[document.document_type]=document.version;else delete next[document.document_type];setDecisions(next);}}/><span>{document.document_type === "SHIDA_PRIVACY_POLICY" ? privacyAcknowledgement[locale] : t.consent} {documentUrl(document) ? <a href={documentUrl(document)!} target="_blank" rel="noopener noreferrer">{documentName(document.document_type)} · {document.version}{locale === "ln" || locale === "sw" ? " (FR)" : ""}</a> : <>{documentName(document.document_type)} · {document.version} — {onboardingText(locale,"unavailable")}</>}</span></label>)}
            {group === reviewStep && <dl className="registration-review">{Object.entries(draft.values).filter(([,v])=>v).map(([key,value])=><div key={key}><dt>{label(key)}</dt><dd>{key === "organization_type" || key === "sector" ? catalogLabel(locale,value!) : value}</dd></div>)}</dl>}
          </fieldset>
          <p role="status" className="registration-save">{busy ? t.saving : saved ? t.saved : ""}</p>
          <div className="registration-actions">{group > (existing ? legalStep : 0) && <button type="button" className="button button-secondary" disabled={busy} onClick={()=>setGroup(group-1)}>{t.back}</button>}<button className="button button-primary" disabled={busy || message === t.changed} onPointerDown={()=>{primaryIntent.current=true;}} onPointerCancel={()=>{primaryIntent.current=false;}} onClick={()=>{primaryIntent.current=false;}} type="submit">{group === reviewStep ? t.finish : t.next}</button></div>
          {dirty && <button className="button button-secondary" type="button" disabled={busy} onClick={()=>void save(false)}>{onboardingText(locale,"save")}</button>}
        </form>}
        {!existing && draft.status !== "completed" && <button type="button" className="registration-text-button" disabled={busy} onClick={()=>setConfirmCancel(true)}>{t.cancel}</button>}
        <a href={`${base}/space/`}>{t.later}</a>
      </>)}
    </section>
  </div>;
}
