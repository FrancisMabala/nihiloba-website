import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

let storedToken: string | null = null;
const setCookie = vi.fn((name: string, value: string) => { if (name === "shida_dashboard_session") storedToken = value || null; });
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: () => storedToken ? { value: storedToken } : undefined, set: setCookie })) }));

import { CandidateApplicationDetailView, CandidateApplicationsView, candidateStatusLabel } from "../app/components/shida/candidate-employment";
import { candidateEmploymentMetadata } from "../app/lib/employment-metadata";
import { parseCandidateApplication } from "../app/services/shida/employment-client";
import type { EmploymentApplicationStatus } from "../app/types/shida-employment";
import { GET as listApplications } from "../app/api/shida/employment/applications/route";
import { GET as getApplication } from "../app/api/shida/employment/applications/[application]/route";
import { POST as verifyCode } from "../app/api/shida/employment/auth/verify-code/route";

const rawApplication = {
  reference: "APP_candidate-safe",
  job_title: "Programme Officer",
  candidate_name: "Private candidate",
  employer_name: "Community Foundation",
  status: "interview_proposed",
  created_at: "2026-08-20T10:00:00Z",
  communication_channel: "whatsapp",
  email_handoff_status: "proposed",
  interview: { date: "2026-09-10", time: "10:00", location: "Online", notes: "Please join on time", meeting_link: null },
  status_history: [
    { status: "received", created_at: "2026-08-20T10:00:00Z", notification_status: "sent", actor_phone: "PRIVATE" },
    { status: "interview_proposed", created_at: "2026-08-27T10:00:00Z", notification_status: "sent" },
  ],
  messages: [{ sender: "other", channel: "whatsapp", message_type: "text", body: "We would like to meet you.", delivery_status: "sent", created_at: "2026-08-27T10:00:00Z", sender_contact: "PRIVATE" }],
  seeker_phone_number: "PRIVATE",
  exact_address: "PRIVATE",
  recruiter_email: "PRIVATE",
};

const application = parseCandidateApplication(rawApplication);

beforeEach(() => { storedToken = null; setCookie.mockClear(); vi.unstubAllGlobals(); });

describe("authenticated candidate Employment UI", () => {
  it("localizes every canonical backend status", () => {
    const statuses: EmploymentApplicationStatus[] = ["received", "under_review", "shortlisted", "interview_proposed", "interview_confirmed", "offered", "hired", "rejected", "withdrawn", "closed"];
    expect(statuses.map((item) => candidateStatusLabel("en", item))).toEqual(["Received", "Under review", "Shortlisted", "Interview proposed", "Interview confirmed", "Offered", "Hired", "Rejected", "Withdrawn", "Closed"]);
    expect(statuses.map((item) => candidateStatusLabel("fr", item))).toContain("Entretien confirmé");
  });

  it("renders compact application summaries and the French canonical route", () => {
    const html = renderToStaticMarkup(<CandidateApplicationsView locale="fr" applications={[application]}/>);
    expect(html).toContain("Programme Officer");
    expect(html).toContain("/fr/shida/mes-candidatures/APP_candidate-safe");
    expect(html).toContain("Entretien proposé");
  });

  it("renders the private timeline, messages and interview without unsupported actions", () => {
    const html = renderToStaticMarkup(<CandidateApplicationDetailView locale="en" application={application}/>);
    expect(html).toContain("Status timeline");
    expect(html).toContain("We would like to meet you.");
    expect(html).toContain("Online");
    expect(html).toContain("authoritative allowed actions");
    expect(html).not.toContain("Accept interview");
    expect(html).not.toContain("Withdraw application");
    expect(html).not.toContain("PRIVATE");
  });

  it("renders a professional empty state without fabricating profiles", () => {
    const html = renderToStaticMarkup(<CandidateApplicationsView locale="en" applications={[]}/>);
    expect(html).toContain("no applications");
    expect(html).toContain("/shida/emplois");
  });

  it("strictly discards contact, address and actor fields from backend payloads", () => {
    const serialized = JSON.stringify(application);
    expect(serialized).not.toContain("seeker_phone_number");
    expect(serialized).not.toContain("exact_address");
    expect(serialized).not.toContain("actor_phone");
    expect(serialized).not.toContain("sender_contact");
    expect(serialized).not.toContain("candidate_name");
  });

  it("marks candidate pages noindex with no private metadata", () => {
    const metadata = candidateEmploymentMetadata("en", true);
    expect(metadata.robots).toMatchObject({ index: false, follow: false, noarchive: true });
    expect(JSON.stringify(metadata)).not.toContain(application.reference);
    expect(JSON.stringify(metadata)).not.toContain(application.job_title);
  });
});

describe("candidate Employment BFF authorization", () => {
  it("requires an HttpOnly session and returns private no-store responses", async () => {
    const response = await listApplications();
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });

  it("returns the same privacy-safe not-found response for malformed and forbidden references", async () => {
    storedToken = "opaque_session_token_safe";
    const malformed = await getApplication(new Request("https://nihiloba.com/api/shida/employment/applications/guess"), { params: Promise.resolve({ application: "guess" }) });
    expect(malformed.status).toBe(404);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: "candidate_access_required" }), { status: 403 })));
    const forbidden = await getApplication(new Request("https://nihiloba.com/api/shida/employment/applications/APP_unknown"), { params: Promise.resolve({ application: "APP_unknown" }) });
    expect(forbidden.status).toBe(404);
    expect(await malformed.json()).toEqual(await forbidden.json());
  });

  it("sanitizes application list payloads before returning them to the browser", async () => {
    storedToken = "opaque_session_token_safe";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ applications: [rawApplication] }))));
    const response = await listApplications();
    const serialized = JSON.stringify(await response.json());
    expect(response.status).toBe(200);
    expect(serialized).toContain("Programme Officer");
    expect(serialized).not.toContain("seeker_phone_number");
    expect(serialized).not.toContain("exact_address");
    expect(serialized).not.toContain("candidate_name");
  });

  it("stores only the verified opaque session token in a scoped HttpOnly cookie", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ authenticated: true, user: { account_type: "personal", display_name: "Candidate" } }), { headers: { "Set-Cookie": "shida_dashboard_session=opaque_verified_session_token; Path=/; HttpOnly; Secure; SameSite=Lax" } })));
    const response = await verifyCode(new Request("https://nihiloba.com/api/shida/employment/auth/verify-code", { method: "POST", headers: { origin: "https://nihiloba.com", "content-type": "application/json" }, body: JSON.stringify({ challenge_ref: "DLC_safechallenge", code: "123456" }) }));
    expect(response.status).toBe(200);
    expect(setCookie).toHaveBeenCalledWith("shida_dashboard_session", "opaque_verified_session_token", expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/api/shida/employment", priority: "high" }));
    expect(JSON.stringify(await response.json())).not.toContain("opaque_verified_session_token");
  });
});
