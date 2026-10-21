export type BriefContent = {
  category: string; language: "en" | "fr" | "ln" | "sw"; description?: string; city?: string;
  commune?: string; timing?: string; preferred_date?: string; preferred_start_time?: string;
  preferred_end_time?: string; budget_amount?: string; budget_currency?: "CDF" | "USD"; direct_offering_ref?: string;
};
export type CustomerBrief = {
  pdf_uploads_enabled?: boolean;
  brief_ref: string; revision: number; status: "DRAFT" | "REVIEWED" | "PUBLISHED" | "CLOSED" | "EXPIRED";
  content: BriefContent; summary: BriefContent; summary_digest: string; edited_at: string; expires_at: string;
  request_ref?: string; posted_ref?: string;
};
export type BriefDocument = {
  document_ref: string; revision: number;
  status: "RECEIVED" | "CHECKING" | "READY" | "UNREADABLE" | "REJECTED" | "FAILED" | "DELETING" | "DELETED";
  error: string | null; preview: string | null; page_count: number | null; truncated: boolean; has_original: boolean;
};
export type QuoteTerms = {amount?: string; currency?: "CDF" | "USD"; pricing_description?: string;
  duration_minutes?: number; proposed_start?: string; proposed_end?: string; terms?: string; expires_at?: string};
export type ProposalVersion = {version_ref: string; number: number; brief_revision_ref: string; content: QuoteTerms;
  brief_summary?: BriefContent; expires_at: string; submitted_at: string; answers_current_brief?: boolean; expired?: boolean};
export type CustomerBranch = {branch_ref: string; name: string; broad_area: string; revision: number; coverage_revision: number};
export type PostedRequest = {posted_ref: string; revision: number; status: "OPEN" | "WITHDRAWN" | "EXPIRED" | "AWARDED";
  brief_ref?: string; support_url?: string|null;
  summary: BriefContent; brief_revision_ref: string; expires_at: string; created_at: string;
  booking?: {reservation_ref: string; request_ref: string; quote_ref: string}};
export type PrivateProposal = {proposal_ref: string; posted_ref: string; revision: number;
  status: "DRAFT" | "SUBMITTED" | "WITHDRAWN" | "ACCEPTED" | "NOT_SELECTED"; request_status: PostedRequest["status"];
  current: ProposalVersion | null; can_review_acceptance?: boolean; request?: PostedRequest;
  clarifications?: {question_ref: string; question: string; answer: string | null; answers_current_brief: boolean}[];
  provider?: {provider_ref: string; offering_ref: string; name: string; service_name: string; category: string;
    rating: {average: number | null; count: number}; reviews: {rating?: number; comment?: string}[];
    branch_coverage_specified: boolean; customer_branches: CustomerBranch[]};
  draft?: QuoteTerms; draft_digest?: string; draft_answers_current_brief?: boolean; offering_ref?: string;
};
export class ServiceRequestError extends Error {
  constructor(public status: number, public detail: string) { super(detail); }
}
export const requestBase = "/api/shida/personal/service-requests";
export async function serviceRequest<T>(binding: string, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("X-Shida-Session", binding); headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${requestBase}/${path}`, {...init, headers,
    cache: "no-store", credentials: "same-origin", signal: init.signal ?? AbortSignal.timeout(125000)});
  const value = await response.json();
  if (!response.ok) throw new ServiceRequestError(response.status, typeof value?.detail === "string" ? value.detail : "service_brief_unavailable");
  return value as T;
}
export function isCustomerBrief(value: CustomerBrief): boolean {
  return !!value && /^SCB_[A-Za-z0-9_-]+$/.test(value.brief_ref) && Number.isInteger(value.revision) &&
    value.revision > 0 && !!value.content && typeof value.content.category === "string" &&
    !!value.summary && /^[a-f0-9]{64}$/.test(value.summary_digest) &&
    ["DRAFT", "REVIEWED", "PUBLISHED", "CLOSED", "EXPIRED"].includes(value.status);
}
