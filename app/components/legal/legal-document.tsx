import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "../../lib/i18n";
import { localizedPath } from "../../lib/i18n";
import { LegalSidebar, type LegalNavItem } from "./legal-sidebar";

export function LegalMetadata({ updated, readingTime }: { updated: string; readingTime: string }) {
  return <div className="legal-metadata"><span>{updated}</span><span aria-hidden="true">·</span><span>{readingTime}</span></div>;
}

export function LegalPage({ locale, eyebrow, title, updated, readingTime, toc, children, related = true }: {
  locale: Locale; eyebrow: string; title: string; updated: string; readingTime: string;
  toc: readonly LegalNavItem[]; children: ReactNode; related?: boolean;
}) {
  const onThisPage = locale === "en" ? "On this page" : "Sur cette page";
  return <>
    <section className="legal-hero"><div className="container"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><LegalMetadata updated={updated} readingTime={readingTime}/></div></section>
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

function trustPath(locale: Locale, resource: "privacy"|"data"|"security"|"terms"|"faq"|"acceptable") {
  const dataPath = locale === "en" ? "/data-protection" : "/protection-des-donnees";
  const paths = {
    privacy: "/privacy",
    data: dataPath,
    security: locale === "en" ? "/security" : "/securite",
    terms: "/terms",
    faq: "/privacy#contact",
    acceptable: "/terms#acceptable-use",
  };
  return localizedPath(locale, paths[resource]);
}

export function LegalRelatedLinks({ locale, current }: { locale: Locale; current?: "privacy"|"data"|"security"|"terms"|"faq"|"acceptable" }) {
  const english = locale === "en";
  const links: { key: "privacy"|"data"|"security"|"terms"|"faq"|"acceptable"; label: string }[] = english ? [
    {key:"privacy",label:"Privacy Policy"},{key:"data",label:"Data Protection & Privacy"},{key:"security",label:"Security"},{key:"terms",label:"Terms of Use"},{key:"faq",label:"Frequently Asked Questions"},{key:"acceptable",label:"Acceptable Use Policy"},
  ] : [
    {key:"privacy",label:"Politique de confidentialité"},{key:"data",label:"Protection des données et de la vie privée"},{key:"security",label:"Sécurité"},{key:"terms",label:"Conditions d’utilisation"},{key:"faq",label:"Questions fréquentes"},{key:"acceptable",label:"Politique d’utilisation acceptable"},
  ];
  const heading = english ? "Related trust resources" : "Ressources associées";
  return <nav className="legal-related" aria-label={heading}><h2>{heading}</h2><div>{links.filter((link)=>link.key!==current).map((link)=><Link key={link.key} href={trustPath(locale,link.key)}>{link.label}<span aria-hidden="true">↗</span></Link>)}</div></nav>;
}
