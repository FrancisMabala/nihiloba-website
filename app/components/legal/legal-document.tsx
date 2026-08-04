import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "../../lib/i18n";
import { localizedPath } from "../../lib/i18n";
import { LegalSidebar, type LegalNavItem } from "./legal-sidebar";

export function LegalMetadata({ updated, readingTime, appliesTo }: { updated: string; readingTime: string; appliesTo: string }) {
  return <div className="legal-metadata"><span>{updated}</span><span aria-hidden="true">·</span><span>{readingTime}</span><span aria-hidden="true">·</span><span>{appliesTo}</span></div>;
}

export function LegalPage({ locale, eyebrow, title, updated, readingTime, toc, children, related = true }: {
  locale: Locale; eyebrow: string; title: string; updated: string; readingTime: string;
  toc: readonly LegalNavItem[]; children: ReactNode; related?: boolean;
}) {
  const onThisPage = locale === "en" ? "On this page" : "Sur cette page";
  const appliesTo = locale === "en" ? "Applies to: Website · SHIDA · NIHILOBA" : "S’applique à : Site internet · SHIDA · NIHILOBA";
  return <>
    <section className="legal-hero"><div className="container"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><LegalMetadata updated={updated} readingTime={readingTime} appliesTo={appliesTo}/></div></section>
    <section className="section legal-page-section"><div className="container legal-doc-layout"><LegalSidebar items={toc} label={onThisPage}/><article className="legal-doc-content">{children}{related&&<LegalRelatedLinks locale={locale}/>}</article></div></section>
  </>;
}

export function LegalSection({ id, title, children, className = "" }: { id: string; title: string; children: ReactNode; className?: string }) {
  return <section id={id} className={`legal-section ${className}`}><h2>{title}</h2>{children}</section>;
}

export function LegalList({ items }: { items: readonly string[] }) {
  return <ul className="legal-list">{items.map((item)=><li key={item}>{item}</li>)}</ul>;
}

export function LegalCallout({ label, children }: { label: string; children: ReactNode }) {
  return <aside className="legal-callout" role="note"><p className="legal-callout-label">{label}</p><div>{children}</div></aside>;
}

type TrustResource = "privacy"|"data"|"security"|"terms"|"faq"|"acceptable"|"contact";

function trustPath(locale: Locale, resource: TrustResource) {
  const dataPath = locale === "en" ? "/data-protection" : "/protection-des-donnees";
  const paths = {
    privacy: "/privacy",
    data: dataPath,
    security: locale === "en" ? "/security" : "/securite",
    terms: locale === "en" ? "/terms" : "/conditions-utilisation",
    faq: "/faq",
    acceptable: locale === "en" ? "/acceptable-use" : "/utilisation-acceptable",
    contact: "/contact",
  };
  return localizedPath(locale, paths[resource]);
}

export function LegalRelatedLinks({ locale, current, includeContact = false }: { locale: Locale; current?: TrustResource; includeContact?: boolean }) {
  const english = locale === "en";
  const links: { key: TrustResource; label: string }[] = english ? [
    {key:"privacy",label:"Privacy Policy"},{key:"data",label:"Data Protection & Privacy"},{key:"security",label:"Security"},{key:"terms",label:"Terms of Use"},{key:"faq",label:"Frequently Asked Questions"},{key:"acceptable",label:"Acceptable Use Policy"},{key:"contact",label:"Contact"},
  ] : [
    {key:"privacy",label:"Politique de confidentialité"},{key:"data",label:"Protection des données et de la vie privée"},{key:"security",label:"Sécurité"},{key:"terms",label:"Conditions d’utilisation"},{key:"faq",label:"Questions fréquentes"},{key:"acceptable",label:"Politique d’utilisation acceptable"},{key:"contact",label:"Contact"},
  ];
  const heading = english ? "Explore the Trust Center" : "Explorer le Centre de confiance";
  return <nav className="legal-related" aria-label={heading}><h2>{heading}</h2><div>{links.filter((link)=>link.key!==current&&(includeContact||link.key!=="contact")).map((link)=><Link key={link.key} href={trustPath(locale,link.key)}>{link.label}<span aria-hidden="true">↗</span></Link>)}</div></nav>;
}
