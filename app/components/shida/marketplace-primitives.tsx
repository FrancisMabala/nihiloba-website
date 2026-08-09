import Link from "next/link";
import type { Locale } from "../../lib/i18n";

const availabilityLabels: Record<Locale, Record<string, string>> = {
  en: { AVAILABLE: "Available", RENTED: "Rented", INACTIVE: "Unavailable", UNAVAILABLE: "Unavailable" },
  fr: { AVAILABLE: "Disponible", RENTED: "Loué", INACTIVE: "Indisponible", UNAVAILABLE: "Indisponible" },
};

export function availabilityLabel(state: string | null, locale: Locale): string | null {
  if (!state) return null;
  return availabilityLabels[locale][state.trim().toUpperCase()] ?? null;
}

export function AvailabilityBadge({ state, locale }: { state: string | null; locale: Locale }) {
  const label = availabilityLabel(state, locale);
  if (!label) return null;
  return <span className="marketplace-status" data-availability={state?.toLowerCase()}>{label}</span>;
}

export type BreadcrumbItem = { label: string; href?: string };

export function MarketplaceBreadcrumb({ label, items }: { label: string; items: BreadcrumbItem[] }) {
  return <nav className="marketplace-breadcrumb" aria-label={label}>
    <ol>{items.map((item, index) => <li key={`${item.label}-${index}`}>
      {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
    </li>)}</ol>
  </nav>;
}

export type MarketplaceFact = { label: string; value: string };

export function MarketplaceFacts({ facts }: { facts: MarketplaceFact[] }) {
  if (!facts.length) return null;
  return <dl className="marketplace-facts-row">{facts.map((fact) => <div key={fact.label}>
    <dt>{fact.label}</dt><dd>{fact.value}</dd>
  </div>)}</dl>;
}
