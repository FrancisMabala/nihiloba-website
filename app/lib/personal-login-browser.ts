// Only notification IDs use localStorage; no identity, verifier, link or session is persisted.
export const LOGIN_EVENT = "shida-personal-login-attempt";
export const LOGIN_LOCK = "shida-personal-auth-mutation";
const UNCONFIRMED = "shida-personal-login-unconfirmed";
let unconfirmed = false;
// Non-identity safety marker survives reload if a session response/cleanup is lost.
// It grants no access and contains no token, user, verifier or challenge reference.
export function markLoginUnconfirmed(value: boolean) {
  unconfirmed = value;
  try { if (value) localStorage.setItem(UNCONFIRMED, "1"); else localStorage.removeItem(UNCONFIRMED); } catch { /* Same-tab guard remains active. */ }
}
export function loginUnconfirmed(): boolean {
  try { return localStorage.getItem(UNCONFIRMED) === "1"; } catch { return unconfirmed; }
}
export async function authMutation<T>(work: () => Promise<T>): Promise<T> {
  // Fail closed on browsers without cross-tab serialization rather than race session cookies.
  if (!navigator.locks) return Promise.reject(new Error("unavailable"));
  return await navigator.locks.request(LOGIN_LOCK, work);
}
export async function personalAuthBusy(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.locks) return false;
  return (await navigator.locks.query()).held?.some(lock => lock.name === LOGIN_LOCK) ?? false;
}
export function announceLoginAttempt() {
  window.dispatchEvent(new Event(LOGIN_EVENT));
  try { localStorage.setItem(LOGIN_EVENT, crypto.randomUUID()); } catch { /* storage disabled */ }
}
export async function loginRequest(path: string, method = "GET", signal?: AbortSignal) {
  const result = await fetch(`/api/shida/personal/auth/whatsapp/${path}${path ? "/" : ""}`, { method, signal, credentials: "same-origin", cache: "no-store" });
  const value = await result.json();
  if (!result.ok) throw new Error(["expired", "cancelled", "rate_limited"].includes(value?.error?.code) ? value.error.code : "unavailable");
  return value;
}
