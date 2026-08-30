import type { Metadata } from "next";
import type { Locale } from "./i18n";

export function candidateEmploymentMetadata(locale: Locale, detail = false): Metadata {
  return {
    title: detail
      ? locale === "fr" ? "Candidature privée | SHIDA" : "Private application | SHIDA"
      : locale === "fr" ? "Mes candidatures | SHIDA" : "My applications | SHIDA",
    description: locale === "fr"
      ? "Espace privé pour consulter vos candidatures SHIDA."
      : "Private space for reviewing your SHIDA applications.",
    robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  };
}
