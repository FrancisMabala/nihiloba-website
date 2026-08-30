import { parseCandidateApplication } from "./employment-client";
import type { CandidateApplication, EmploymentSession } from "../../types/shida-employment";

export class EmploymentBrowserError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(`Employment request failed: ${code}`);
    this.name = "EmploymentBrowserError";
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EmploymentBrowserError("malformed_response", 502);
  return value as Record<string, unknown>;
}

async function request(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(`/api/shida/employment${path}`, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
  } catch { throw new EmploymentBrowserError("api_unavailable", 503); }
  let payload: unknown = null;
  try { payload = await response.json(); } catch { throw new EmploymentBrowserError("malformed_response", 502); }
  if (!response.ok) {
    const error = record(payload).error;
    const code = error && typeof error === "object" && !Array.isArray(error) && typeof (error as Record<string, unknown>).code === "string" ? (error as Record<string, string>).code : "api_unavailable";
    throw new EmploymentBrowserError(code, response.status);
  }
  return record(payload);
}

function session(value: unknown): EmploymentSession {
  const user = record(value);
  if (typeof user.display_name !== "string" || !user.display_name.trim()) throw new EmploymentBrowserError("malformed_response", 502);
  return { display_name: user.display_name, account_type: typeof user.account_type === "string" ? user.account_type : null };
}

export async function restoreEmploymentSession(): Promise<EmploymentSession> {
  return session((await request("/session")).user);
}

export async function beginEmploymentLogin(phone: string): Promise<string> {
  const value = await request("/auth/request-code", { method: "POST", body: JSON.stringify({ phone }) });
  if (typeof value.challenge_ref !== "string") throw new EmploymentBrowserError("malformed_response", 502);
  return value.challenge_ref;
}

export async function completeEmploymentLogin(challengeRef: string, code: string): Promise<EmploymentSession> {
  return session((await request("/auth/verify-code", { method: "POST", body: JSON.stringify({ challenge_ref: challengeRef, code }) })).user);
}

export async function endEmploymentSession(): Promise<void> {
  await request("/logout", { method: "POST", body: "{}" });
}

export async function loadCandidateApplications(): Promise<CandidateApplication[]> {
  const value = await request("/applications");
  if (!Array.isArray(value.applications)) throw new EmploymentBrowserError("malformed_response", 502);
  return value.applications.map(parseCandidateApplication);
}

export async function loadCandidateApplication(reference: string): Promise<CandidateApplication> {
  return parseCandidateApplication((await request(`/applications/${encodeURIComponent(reference)}`)).application);
}
