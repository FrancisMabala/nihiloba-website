import {requestWords} from "../../lib/services-request-copy";
import type {ServiceLocale} from "../../lib/services-category-experience";
/** The backend returns only the accepted safe summary to exact participants. */
export function ServiceReviewedBrief({value, locale, open = false}: {value: unknown; locale: ServiceLocale; open?: boolean}) {
  if (!value || typeof value !== "object" || !("summary" in value) || !value.summary || typeof value.summary !== "object") return null;
  const t = requestWords(locale), summary = value.summary as Record<string, unknown>;
  const fields = ["description", "city", "commune", "timing", "preferred_date", "preferred_start_time", "preferred_end_time", "budget_amount", "budget_currency"] as const;
  return <details open={open}><summary>{t.summary}</summary><dl>{fields.filter(key => typeof summary[key] === "string" && summary[key]).map(key =>
    <div key={key}><dt>{key === "budget_amount" ? t.budget : key === "budget_currency" ? t.currency : t[key]}</dt><dd>{String(summary[key])}</dd></div>)}</dl></details>;
}
