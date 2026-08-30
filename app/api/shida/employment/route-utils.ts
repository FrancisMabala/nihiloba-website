import { cookies } from "next/headers";
import { EmploymentApiError } from "../../../services/shida/employment-client";

export const EMPLOYMENT_SESSION_COOKIE = "shida_dashboard_session";
export const PRIVATE_HEADERS = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", "X-Robots-Tag": "noindex, nofollow, noarchive" };
const PRODUCTION_WEBSITE_ORIGIN = "https://nihiloba.com";

export async function employmentToken(): Promise<string | null> {
  return (await cookies()).get(EMPLOYMENT_SESSION_COOKIE)?.value ?? null;
}

export async function setEmploymentToken(token: string): Promise<void> {
  (await cookies()).set(EMPLOYMENT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/shida/employment",
    maxAge: 60 * 60 * 24 * 7,
    priority: "high",
  });
}

export async function clearEmploymentToken(): Promise<void> {
  (await cookies()).set(EMPLOYMENT_SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/shida/employment", maxAge: 0 });
}

export function privateEmploymentJson(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: PRIVATE_HEADERS });
}

export function assertEmploymentSameOrigin(request: Request): Response | null {
  if (request.headers.get("sec-fetch-site") === "cross-site") return privateEmploymentJson({ error: { code: "forbidden" } }, 403);
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    const supplied = new URL(origin).origin;
    const expected = new URL(request.url).origin;
    if (supplied !== expected && supplied !== PRODUCTION_WEBSITE_ORIGIN) return privateEmploymentJson({ error: { code: "forbidden" } }, 403);
  } catch { return privateEmploymentJson({ error: { code: "forbidden" } }, 403); }
  return null;
}

export async function employmentRequestBody(request: Request): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 4096) return null;
  try {
    const value: unknown = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

export function employmentError(error: unknown): Response {
  if (error instanceof EmploymentApiError) {
    const status = error.status >= 400 && error.status < 600 ? error.status : 500;
    return privateEmploymentJson({ error: { code: error.code } }, status);
  }
  return privateEmploymentJson({ error: { code: "api_unavailable" } }, 503);
}

export function validApplicationReference(value: string): boolean {
  return /^APP_[A-Za-z0-9_-]{4,76}$/.test(value);
}
