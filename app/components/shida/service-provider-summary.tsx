import {serviceCategoryExperience, type ServiceLocale} from "../../lib/services-category-experience";
import {requestWords} from "../../lib/services-request-copy";
import type {BriefContent} from "../../lib/services-request-browser";

export function briefTiming(summary: BriefContent) {
  return [summary.timing, summary.preferred_date, [summary.preferred_start_time, summary.preferred_end_time].filter(Boolean).join("–")].filter(Boolean).join(" · ");
}

export function ServiceProviderSummary({summary, locale}: {summary: BriefContent; locale: ServiceLocale}) {
  const t = requestWords(locale);
  const amount = Number(summary.budget_amount?.replace(",", "."));
  const details = [
    [t.place, [summary.commune, summary.city].filter(Boolean).join(", ")],
    [t.when, briefTiming(summary)],
    [t.budgetLabel, summary.budget_amount && Number.isFinite(amount) && summary.budget_currency
      ? `${new Intl.NumberFormat(locale, {maximumFractionDigits: 2}).format(amount)} ${summary.budget_currency}` : ""],
  ];
  return <div className="svc-provider-summary">
    {summary.category && <h2>{serviceCategoryExperience(summary.category, locale)?.service}</h2>}
    {summary.description && <p>{summary.description}</p>}
    <dl>{details.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </div>;
}
