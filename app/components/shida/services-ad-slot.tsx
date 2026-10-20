import type { ReactNode } from "react";

const labels = {
  en: "Sponsored",
  fr: "Sponsorisé",ln:"Esengeli kofutama mpo na kolakisa",sw:"Imedhaminiwa",
} as const;

/**
 * Placement boundary for a future approved ad integration. Empty slots render
 * nothing, so the public results page never reserves unused advertising space.
 */
export function ServicesAdSlot({ locale, children }: { locale: "en" | "fr" | "ln" | "sw"; children?: ReactNode }) {
  if (children == null) return null;

  return <aside className="services-ad-slot" aria-label={labels[locale]}>
    <span>{labels[locale]}</span>
    {children}
  </aside>;
}
