import { personalAuthBusy, loginUnconfirmed, LOGIN_EVENT } from "./personal-login-browser";
export const PERSONAL_SESSION_EVENT = "shida-personal-session-changed";
// Notification only: no credentials, identity, drafts or Personal data in storage.
export function announcePersonalSessionChange() {
  window.dispatchEvent(new Event(PERSONAL_SESSION_EVENT));
  try { localStorage.setItem(PERSONAL_SESSION_EVENT, crypto.randomUUID()); } catch { /* Storage may be disabled. Focus checks remain active. */ }
}
export type PersonalSession = { binding: string; user: { display_name: string; test_data?: boolean } };
export class PersonalSessionError extends Error {
  constructor(public readonly status: number) { super("session_unavailable"); }
}
type Flight = { controller: AbortController; promise: Promise<PersonalSession>; readers: number };
let flight: Flight | undefined;
let generation = 0;
let observedWindow: Window | undefined;
function invalidate() {
  generation++;
  const previous = flight;
  flight = undefined;
  previous?.controller.abort();
}
function observeIdentityChanges() {
  if (typeof window === "undefined" || !window.addEventListener || observedWindow === window) return;
  observedWindow = window;
  // Capture runs before consumers start their replacement reads. Nothing is cached
  // after completion, or shared across tabs, accounts or authentication mutations.
  window.addEventListener(PERSONAL_SESSION_EVENT, invalidate, true);
  window.addEventListener(LOGIN_EVENT, invalidate, true);
  window.addEventListener("storage", event => {
    if (!event.key || [PERSONAL_SESSION_EVENT, LOGIN_EVENT, "shida-personal-login-unconfirmed"].includes(event.key)) invalidate();
  });
}
async function readSession(signal: AbortSignal): Promise<PersonalSession> {
  // This endpoint also migrates the legacy Employment-path cookie after validation.
  const response = await fetch("/api/shida/employment/session/", { cache: "no-store", credentials: "same-origin", signal });
  signal.throwIfAborted();
  if(response.status===409){
    const status=await fetch('/api/shida/personal/deletion/',{cache:'no-store',signal});
    if(status.ok&&(await status.json()).deletion){
      signal.throwIfAborted();
      const prefix=window.location.pathname.match(/^\/(fr|ln|sw)(?:\/|$)/)?.[0]?.replace(/\/$/,'')||'';
      window.location.assign(prefix+'/shida/deletion/');
      throw new PersonalSessionError(401);
    }
  }
  if (!response.ok) throw new PersonalSessionError(response.status);
  const value = await response.json();
  if (!/^[a-f0-9]{64}$/.test(value.binding) || typeof value.user?.display_name !== "string") throw new PersonalSessionError(401);
  return { binding: value.binding, user: { display_name: value.user.display_name, test_data: value.user.test_data === true } };
}
export async function restorePersonalSession(signal?: AbortSignal): Promise<PersonalSession> {
  observeIdentityChanges();
  const epoch = generation;
  signal?.throwIfAborted();
  if (await personalAuthBusy()) throw new PersonalSessionError(503);
  if (loginUnconfirmed()) throw new PersonalSessionError(401);
  signal?.throwIfAborted();
  if (epoch !== generation) throw new DOMException("Session changed", "AbortError");
  if (!flight) {
    const controller = new AbortController();
    const current: Flight = {controller, readers: 0, promise: readSession(controller.signal).then(async value => {
        controller.signal.throwIfAborted();
        if (epoch !== generation) throw new DOMException("Session changed", "AbortError");
        if (loginUnconfirmed()) throw new PersonalSessionError(401);
        if (await personalAuthBusy()) throw new PersonalSessionError(503);
        controller.signal.throwIfAborted();
        return value;
      }).finally(() => { if (flight === current) flight = undefined; })};
    flight = current;
  }
  const current = flight;
  current.readers++;
  return new Promise<PersonalSession>((resolve, reject) => {
    let finished = false;
    const finish = (complete: () => void) => {
      if (finished) return;
      finished = true;
      signal?.removeEventListener("abort", abort);
      if (--current.readers === 0 && flight === current) { flight = undefined; current.controller.abort(); }
      complete();
    };
    const abort = () => finish(() => reject(signal?.reason ?? new DOMException("Aborted", "AbortError")));
    signal?.addEventListener("abort", abort, {once: true});
    current.promise.then(value => finish(() => {
      if (epoch !== generation || current.controller.signal.aborted) reject(new DOMException("Session changed", "AbortError"));
      else resolve(value);
    }), error => finish(() => reject(error)));
    if (signal?.aborted) abort();
  });
}
