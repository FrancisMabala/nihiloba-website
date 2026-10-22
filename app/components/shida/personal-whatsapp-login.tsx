"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { personalLoginCopy } from "../../lib/personal-login-copy";
import { announceLoginAttempt, authMutation, LOGIN_EVENT, loginRequest, markLoginUnconfirmed } from "../../lib/personal-login-browser";
import { announcePersonalSessionChange, PERSONAL_SESSION_EVENT } from "../../lib/personal-session-browser";
import { registrationCopy } from "../../lib/registration/copy";

type State = "idle" | "creating" | "pending" | "code" | "exchanging" | "expired" | "onboarding_required" | "cancelled" | "unavailable" | "rate_limited" | "uncertain";
type Challenge = { challenge_ref: string; whatsapp_url: string; expires_at: string };

// In-place authentication deliberately leaves the complete local URL, filters and language intact.
export function PersonalWhatsAppLogin({ locale, onAuthenticated, registration = false, heading }: { locale: keyof typeof personalLoginCopy; onAuthenticated: () => void; registration?: boolean; heading?: string }) {
  const t = { ...personalLoginCopy[locale], ...(registration ? { help: registrationCopy[locale].verificationHelp, verify: registrationCopy[locale].verifyButton } : {}), ...(heading ? { title: heading } : {}) };
  const [state, setState] = useState<State>("idle");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const codeId = useId();
  const submitting = useRef(false);
  const epoch = useRef(0), alive = useRef(false), read = useRef<AbortController | null>(null);
  const started = useRef(false);
  const callback = useRef(onAuthenticated);
  useEffect(() => { callback.current = onAuthenticated; }, [onAuthenticated]);
  useEffect(() => {
    alive.current = true;
    const stop = () => { if (!started.current) return; ++epoch.current; read.current?.abort(); setChallenge(null); setCode(""); setState("cancelled"); };
    const storage = (e: StorageEvent) => { if (e.key === LOGIN_EVENT || e.key === PERSONAL_SESSION_EVENT) stop(); };
    window.addEventListener(LOGIN_EVENT, stop); window.addEventListener(PERSONAL_SESSION_EVENT, stop); window.addEventListener("storage", storage);
    return () => { alive.current = false; read.current?.abort(); window.removeEventListener(LOGIN_EVENT, stop); window.removeEventListener(PERSONAL_SESSION_EVENT, stop); window.removeEventListener("storage", storage); };
  }, []);
  const failure = (error: unknown): State => error instanceof Error && ["expired", "cancelled", "rate_limited"].includes(error.message) ? error.message as State : "unavailable";
  async function start() {
    announceLoginAttempt(); const current = ++epoch.current;
    started.current = true;
    setChallenge(null); setCode(""); setCodeError(false); setState("creating");
    try {
      const value = await authMutation(async () => {
        if (current !== epoch.current || !alive.current) return null;
        return loginRequest("", "POST", undefined, undefined, registration, locale);
      });
      if (!alive.current || current !== epoch.current || !value) return;
      setChallenge(value); setState("pending");
      // Keep a visible link when the browser blocks opening a tab after an asynchronous request.
      window.open(value.whatsapp_url, "_blank", "noopener,noreferrer");
    } catch (error) { if (alive.current && current === epoch.current) setState(failure(error)); }
  }
  useEffect(() => {
    if (!challenge || state !== "pending") return;
    const current = epoch.current; let stopped = false, busy = false, checks = 0;
    let timer: ReturnType<typeof setTimeout>;
    const active = () => !stopped && alive.current && current === epoch.current;
    async function poll() {
      if (!active() || busy) return;
      clearTimeout(timer);
      if (Date.now() >= Date.parse(challenge!.expires_at) || checks >= 100) { setChallenge(null); setState("expired"); return; }
      if (!navigator.onLine || document.visibilityState === "hidden") { timer = setTimeout(poll, 3000); return; }
      busy = true; checks++;
      const controller = new AbortController(); read.current = controller;
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const value = await loginRequest(challenge!.challenge_ref, "GET", controller.signal, undefined, registration);
        if (!active()) return;
        if (value.status === "pending") { timer = setTimeout(poll, 3000); return; }
        if (value.status !== "verified") { setChallenge(null); setState(value.reason === "onboarding_required" ? "onboarding_required" : value.status === "expired" ? "expired" : "cancelled"); return; }
        setState("code");
      } catch (error) { if (active()) { setChallenge(null); setState(failure(error)); } }
      finally { clearTimeout(timeout); busy = false; }
    }
    const foreground = () => { if (document.visibilityState === "visible") void poll(); };
    timer = setTimeout(poll, 1000);
    window.addEventListener("focus", foreground); window.addEventListener("online", foreground); document.addEventListener("visibilitychange", foreground);
    return () => { stopped = true; clearTimeout(timer); read.current?.abort(); window.removeEventListener("focus", foreground); window.removeEventListener("online", foreground); document.removeEventListener("visibilitychange", foreground); };
  }, [challenge, state, registration]);
  useEffect(() => {
    if (!challenge || state !== "code") return;
    const timer = setTimeout(() => { setCode(""); setChallenge(null); setState("expired"); }, Math.max(0, Date.parse(challenge.expires_at) - Date.now()));
    return () => clearTimeout(timer);
  }, [challenge, state]);
  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!challenge || state !== "code" || submitting.current || !/^[0-9]{6}$/.test(code)) return;
    submitting.current = true;
    const current = epoch.current, ref = challenge.challenge_ref, enteredCode = code;
    setCode(""); setCodeError(false); setState("exchanging");
    try {
      const result = await authMutation(async () => {
        if (!alive.current || current !== epoch.current) return "obsolete";
        markLoginUnconfirmed(true);
        try {
          await loginRequest(`${ref}/session`, "POST", undefined, enteredCode, registration);
          if (alive.current && current === epoch.current) { markLoginUnconfirmed(false); return "accepted"; }
        } catch (error) {
          // These definite rejections cannot have issued a session. A typo can be corrected.
          if (error instanceof Error && ["invalid_code", "expired", "cancelled", "rate_limited"].includes(error.message)) {
            markLoginUnconfirmed(false); return error.message;
          }
        }
        // A lost response may have created a session. Never automatically replay the write.
        const cleanup = await fetch("/api/shida/employment/logout/", { method: "POST", credentials: "same-origin", cache: "no-store" });
        if (cleanup.ok) markLoginUnconfirmed(false);
        return "uncertain";
      });
      if (!alive.current || current !== epoch.current) return;
      if (result === "accepted") { callback.current(); announcePersonalSessionChange(); }
      else if (result === "invalid_code") { setCodeError(true); setState("code"); }
      else { setChallenge(null); setState(["expired", "cancelled", "rate_limited"].includes(result) ? result as State : "uncertain"); }
    } catch { if (alive.current && current === epoch.current) { setChallenge(null); setState("uncertain"); } }
    finally { submitting.current = false; }
  }
  async function cancel(reset = false) {
    const target = challenge?.challenge_ref;
    const current = ++epoch.current; read.current?.abort(); setChallenge(null); setCode(""); setState("creating");
    try {
      await authMutation(async () => {
        if (!alive.current || current !== epoch.current) return;
        if (reset) {
          const result = await fetch("/api/shida/employment/logout/", { method: "POST", credentials: "same-origin", cache: "no-store" });
          if (!result.ok) throw new Error();
          markLoginUnconfirmed(false);
        }
        if (target) await loginRequest(target, "DELETE", undefined, undefined, registration);
      });
      if (alive.current && current === epoch.current) setState("cancelled");
    } catch { if (alive.current && current === epoch.current) setState("uncertain"); }
  }
  const busy = state === "creating" || state === "exchanging";
  return <section className="candidate-login candidate-private-panel" lang={locale}>
    <h2>{t.title}</h2><p>{t.help}</p>
    {!registration && process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED === "true" && <a href={`${locale === "en" ? "" : `/${locale}`}/shida/register/`}>{registrationCopy[locale].title}</a>}
    {state !== "idle" && <p role="status" aria-live="polite">{t[state]}</p>}
    {state === "pending" && challenge && <><a className="button button-primary" href={challenge.whatsapp_url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{t.open}</a><button className="button button-secondary" type="button" onClick={() => void cancel()}>{t.cancel}</button></>}
    {(state === "code" || state === "exchanging") && <form className="candidate-form" onSubmit={verify}>
      <label htmlFor={codeId}>{t.codeLabel}</label>
      <input id={codeId} name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus value={code} disabled={busy} onChange={event => { setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6)); setCodeError(false); }} aria-invalid={codeError} aria-describedby={codeError ? `${codeId}-error` : undefined} />
      {codeError && <p id={`${codeId}-error`} role="alert">{t.invalidCode}</p>}
      <button className="button button-primary" type="submit" disabled={busy || !/^[0-9]{6}$/.test(code)}>{busy ? t.exchanging : t.verify}</button>
      <button className="button button-secondary" type="button" disabled={busy} onClick={() => void cancel()}>{t.restart}</button>
    </form>}
    {state === "uncertain" ? <button className="button button-secondary" type="button" onClick={() => void cancel(true)}>{t.reset}</button> : !["pending", "code", "exchanging"].includes(state) && <button className="button button-primary" type="button" disabled={busy} onClick={() => void start()}>{state === "idle" ? t.start : busy ? t[state] : t.retry}</button>}
  </section>;
}
