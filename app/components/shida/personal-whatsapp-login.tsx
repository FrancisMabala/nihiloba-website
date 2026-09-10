"use client";
import { useEffect, useRef, useState } from "react";
import { personalLoginCopy } from "../../lib/personal-login-copy";
import { announceLoginAttempt, authMutation, LOGIN_EVENT, loginRequest, markLoginUnconfirmed } from "../../lib/personal-login-browser";
import { announcePersonalSessionChange, PERSONAL_SESSION_EVENT } from "../../lib/personal-session-browser";

type State = "idle" | "creating" | "pending" | "exchanging" | "expired" | "onboarding_required" | "cancelled" | "unavailable" | "rate_limited" | "uncertain";
type Challenge = { challenge_ref: string; whatsapp_url: string; expires_at: string };

// In-place authentication deliberately leaves the complete local URL, filters and language intact.
export function PersonalWhatsAppLogin({ locale, onAuthenticated }: { locale: keyof typeof personalLoginCopy; onAuthenticated: () => void }) {
  const t = personalLoginCopy[locale];
  const [state, setState] = useState<State>("idle");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const epoch = useRef(0), alive = useRef(false), read = useRef<AbortController | null>(null);
  const started = useRef(false);
  const callback = useRef(onAuthenticated);
  useEffect(() => { callback.current = onAuthenticated; }, [onAuthenticated]);
  useEffect(() => {
    alive.current = true;
    const stop = () => { if (!started.current) return; ++epoch.current; read.current?.abort(); setChallenge(null); setState("cancelled"); };
    const storage = (e: StorageEvent) => { if (e.key === LOGIN_EVENT || e.key === PERSONAL_SESSION_EVENT) stop(); };
    window.addEventListener(LOGIN_EVENT, stop); window.addEventListener(PERSONAL_SESSION_EVENT, stop); window.addEventListener("storage", storage);
    return () => { alive.current = false; read.current?.abort(); window.removeEventListener(LOGIN_EVENT, stop); window.removeEventListener(PERSONAL_SESSION_EVENT, stop); window.removeEventListener("storage", storage); };
  }, []);
  const failure = (error: unknown): State => error instanceof Error && ["expired", "cancelled", "rate_limited"].includes(error.message) ? error.message as State : "unavailable";
  async function start() {
    announceLoginAttempt(); const current = ++epoch.current;
    started.current = true;
    setChallenge(null); setState("creating");
    try {
      const value = await authMutation(async () => {
        if (current !== epoch.current || !alive.current) return null;
        return loginRequest("", "POST");
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
      busy = true; checks++; let attemptedExchange = false;
      const controller = new AbortController(); read.current = controller;
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const value = await loginRequest(challenge!.challenge_ref, "GET", controller.signal);
        if (!active()) return;
        if (value.status === "pending") { timer = setTimeout(poll, 3000); return; }
        if (value.status !== "verified") { setChallenge(null); setState(value.reason === "onboarding_required" ? "onboarding_required" : value.status === "expired" ? "expired" : "cancelled"); return; }
        // Do not abort a session write: wait for it and clean up if this attempt became obsolete.
        setState("exchanging");
        const accepted = await authMutation(async () => {
          if (!alive.current || current !== epoch.current) return false;
          attemptedExchange = true;
          markLoginUnconfirmed(true);
          try {
            await loginRequest(`${challenge!.challenge_ref}/session`, "POST");
            if (alive.current && current === epoch.current) { markLoginUnconfirmed(false); return true; }
          } catch { /* One-time exchange may have succeeded. Never replay or adopt an unrelated session. */ }
          const cleanup = await fetch("/api/shida/employment/logout/", { method: "POST", credentials: "same-origin", cache: "no-store" });
          if (cleanup.ok) markLoginUnconfirmed(false);
          return false;
        });
        if (alive.current && current === epoch.current) {
          if (accepted) { callback.current(); announcePersonalSessionChange(); }
          else { setChallenge(null); setState("uncertain"); }
        }
      } catch (error) { if (alive.current && current === epoch.current) { setChallenge(null); setState(attemptedExchange ? "uncertain" : failure(error)); } }
      finally { clearTimeout(timeout); busy = false; }
    }
    const foreground = () => { if (document.visibilityState === "visible") void poll(); };
    timer = setTimeout(poll, 1000);
    window.addEventListener("focus", foreground); window.addEventListener("online", foreground); document.addEventListener("visibilitychange", foreground);
    return () => { stopped = true; clearTimeout(timer); read.current?.abort(); window.removeEventListener("focus", foreground); window.removeEventListener("online", foreground); document.removeEventListener("visibilitychange", foreground); };
  }, [challenge, state]);
  async function cancel(reset = false) {
    const target = challenge?.challenge_ref;
    const current = ++epoch.current; read.current?.abort(); setChallenge(null); setState("creating");
    try {
      await authMutation(async () => {
        if (!alive.current || current !== epoch.current) return;
        if (reset) {
          const result = await fetch("/api/shida/employment/logout/", { method: "POST", credentials: "same-origin", cache: "no-store" });
          if (!result.ok) throw new Error();
          markLoginUnconfirmed(false);
        }
        if (target) await loginRequest(target, "DELETE");
      });
      if (alive.current && current === epoch.current) setState("cancelled");
    } catch { if (alive.current && current === epoch.current) setState("uncertain"); }
  }
  const busy = state === "creating" || state === "exchanging";
  return <section className="candidate-login candidate-private-panel" lang={locale}>
    <h2>{t.title}</h2><p>{t.help}</p>
    {state !== "idle" && <p role="status" aria-live="polite">{t[state]}</p>}
    {state === "pending" && challenge && <><a className="button button-primary" href={challenge.whatsapp_url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{t.open}</a><button className="button button-secondary" type="button" onClick={() => void cancel()}>{t.cancel}</button></>}
    {state === "uncertain" ? <button className="button button-secondary" type="button" onClick={() => void cancel(true)}>{t.reset}</button> : state !== "pending" && <button className="button button-primary" type="button" disabled={busy} onClick={() => void start()}>{state === "idle" ? t.start : busy ? t[state] : t.retry}</button>}
  </section>;
}
