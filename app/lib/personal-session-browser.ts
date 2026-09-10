import { personalAuthBusy, loginUnconfirmed } from "./personal-login-browser";
export const PERSONAL_SESSION_EVENT = "shida-personal-session-changed";
// Notification only: no credentials, identity, drafts or Personal data in storage.
export function announcePersonalSessionChange() {
  window.dispatchEvent(new Event(PERSONAL_SESSION_EVENT));
  try { localStorage.setItem(PERSONAL_SESSION_EVENT, crypto.randomUUID()); } catch { /* Storage may be disabled. Focus checks remain active. */ }
}
export type PersonalSession = { binding: string; user: { display_name: string } };
export class PersonalSessionError extends Error {
  constructor(public readonly status: number) { super("session_unavailable"); }
}
export async function restorePersonalSession(signal?: AbortSignal): Promise<PersonalSession> {
  if (await personalAuthBusy()) throw new PersonalSessionError(503);
  if (loginUnconfirmed()) throw new PersonalSessionError(401);
  // This endpoint also migrates the legacy Employment-path cookie after validation.
  const response = await fetch("/api/shida/employment/session/", { cache: "no-store", credentials: "same-origin", signal });
  if (!response.ok) throw new PersonalSessionError(response.status);
  const value = await response.json();
  if (!/^[a-f0-9]{64}$/.test(value.binding) || typeof value.user?.display_name !== "string") throw new PersonalSessionError(401);
  return { binding: value.binding, user: { display_name: value.user.display_name } };
}
