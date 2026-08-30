import type {
  CandidateApplication,
  EmploymentApplicationStatus,
  EmploymentMessage,
  EmploymentSession,
  EmploymentStatusHistoryItem,
} from "../../types/shida-employment";

const DEFAULT_API_BASE_URL = "https://api.nihiloba.com";
const SESSION_COOKIE = "shida_dashboard_session";
const REQUEST_TIMEOUT_MS = 8_000;
const STATUSES = new Set<EmploymentApplicationStatus>([
  "received", "under_review", "shortlisted", "interview_proposed",
  "interview_confirmed", "offered", "hired", "rejected", "withdrawn", "closed",
]);

export class EmploymentApiError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(`SHIDA Employment API ${code}`);
    this.name = "EmploymentApiError";
  }
}

function apiOrigin(): string {
  const configured = process.env.SHIDA_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error();
    return url.origin;
  } catch {
    throw new EmploymentApiError("api_unavailable", 503);
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EmploymentApiError("malformed_response", 502);
  return value as Record<string, unknown>;
}

function text(value: unknown, required = false): string | null {
  if (typeof value === "string" && (!required || value.trim())) return value;
  if (!required && value == null) return null;
  throw new EmploymentApiError("malformed_response", 502);
}

function status(value: unknown): EmploymentApplicationStatus {
  if (typeof value !== "string" || !STATUSES.has(value as EmploymentApplicationStatus)) throw new EmploymentApiError("malformed_response", 502);
  return value as EmploymentApplicationStatus;
}

function historyItem(value: unknown): EmploymentStatusHistoryItem {
  const item = record(value);
  return { status: status(item.status), created_at: text(item.created_at), notification_status: text(item.notification_status) };
}

function message(value: unknown): EmploymentMessage {
  const item = record(value);
  if (item.sender !== "you" && item.sender !== "other" && item.sender !== "system") throw new EmploymentApiError("malformed_response", 502);
  return {
    sender: item.sender,
    channel: text(item.channel),
    message_type: text(item.message_type),
    body: text(item.body, true)!,
    delivery_status: text(item.delivery_status),
    created_at: text(item.created_at),
  };
}

export function parseCandidateApplication(value: unknown): CandidateApplication {
  const item = record(value);
  const interview = record(item.interview ?? {});
  const contact = item.email_handoff_contact == null ? null : record(item.email_handoff_contact);
  const recruiterEmail = contact ? text(contact.recruiter_email) : null;
  return {
    reference: text(item.reference, true)!,
    job_title: text(item.job_title, true)!,
    employer_name: text(item.employer_name, true)!,
    status: status(item.status),
    created_at: text(item.created_at),
    communication_channel: text(item.communication_channel),
    email_handoff_status: text(item.email_handoff_status),
    interview: {
      date: text(interview.date), time: text(interview.time), location: text(interview.location),
      notes: text(interview.notes), meeting_link: text(interview.meeting_link),
    },
    status_history: Array.isArray(item.status_history) ? item.status_history.map(historyItem) : [],
    messages: Array.isArray(item.messages) ? item.messages.map(message) : [],
    email_handoff_contact: recruiterEmail ? { recruiter_email: recruiterEmail } : null,
  };
}

export function parseEmploymentSession(value: unknown): EmploymentSession {
  const user = record(record(value).user);
  return { display_name: text(user.display_name, true)!, account_type: text(user.account_type) };
}

type BackendResult = { payload: unknown; setCookie: string | null };

async function backendRequest(path: string, init: RequestInit = {}, sessionToken?: string | null): Promise<BackendResult> {
  let response: Response;
  try {
    response = await fetch(`${apiOrigin()}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(sessionToken ? { Cookie: `${SESSION_COOKIE}=${sessionToken}` } : {}),
        ...init.headers,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new EmploymentApiError("api_unavailable", 503);
  }
  let payload: unknown = null;
  try { payload = await response.json(); } catch { if (response.ok) throw new EmploymentApiError("malformed_response", 502); }
  if (!response.ok) {
    const code = response.status === 401 ? "unauthorized" : response.status === 403 || response.status === 404 ? "not_found" : response.status === 409 ? "conflict" : response.status === 429 ? "rate_limited" : response.status === 422 ? "invalid_request" : "api_unavailable";
    throw new EmploymentApiError(code, response.status === 403 ? 404 : response.status);
  }
  return { payload, setCookie: response.headers.get("set-cookie") };
}

export async function requestEmploymentCode(phone: string): Promise<{ challenge_ref: string }> {
  const { payload } = await backendRequest("/api/dashboard/auth/request-code", { method: "POST", body: JSON.stringify({ phone }) });
  return { challenge_ref: text(record(payload).challenge_ref, true)! };
}

export async function verifyEmploymentCode(challengeRef: string, code: string): Promise<{ session: EmploymentSession; token: string }> {
  const { payload, setCookie } = await backendRequest("/api/dashboard/auth/verify-code", { method: "POST", body: JSON.stringify({ challenge_ref: challengeRef, code }) });
  const match = setCookie?.match(/(?:^|;\s*)shida_dashboard_session=([A-Za-z0-9_-]{20,256})(?:;|$)/);
  if (!match) throw new EmploymentApiError("malformed_response", 502);
  return { session: parseEmploymentSession(payload), token: match[1] };
}

export async function getEmploymentSession(token: string): Promise<EmploymentSession> {
  return parseEmploymentSession((await backendRequest("/api/dashboard/me", {}, token)).payload);
}

export async function logoutEmploymentSession(token: string): Promise<void> {
  await backendRequest("/api/dashboard/logout", { method: "POST" }, token);
}

export async function getCandidateApplications(token: string): Promise<CandidateApplication[]> {
  const envelope = record((await backendRequest("/api/dashboard/employment/applications", {}, token)).payload);
  if (!Array.isArray(envelope.applications)) throw new EmploymentApiError("malformed_response", 502);
  return envelope.applications.map(parseCandidateApplication);
}

export async function getCandidateApplication(token: string, reference: string): Promise<CandidateApplication> {
  const envelope = record((await backendRequest(`/api/dashboard/employment/applications/${encodeURIComponent(reference)}`, {}, token)).payload);
  return parseCandidateApplication(envelope.application);
}
