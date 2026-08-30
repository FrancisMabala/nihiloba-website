import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalSidebar } from "./legal-sidebar";
import type { LegalMarkdownBlock, ShidaLegalDocumentKind } from "../../lib/shida-legal";
import { getOtherLanguageDocument, loadShidaLegalDocument } from "../../lib/shida-legal";
import type { Locale } from "../../lib/i18n";

function Blocks({ blocks }: { blocks: LegalMarkdownBlock[] }) {
  return <>{blocks.map((block, index) => block.type === "paragraph"
    ? <p key={`${block.text.slice(0, 32)}-${index}`}>{block.text}</p>
    : <ul className="legal-list" key={`list-${index}`}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>)}</>;
}

export function ShidaVersionedLegalPage({ kind, locale, version, historical = false }: { kind: ShidaLegalDocumentKind; locale: Locale; version?: string; historical?: boolean }) {
  const document = loadShidaLegalDocument(kind, locale, version);
  if (!document) notFound();
  const { metadata, content } = document;
  const other = getOtherLanguageDocument(metadata);
  const copy = locale === "fr" ? {
    identity: "SHIDA · Un service NIHILOBA", version: "Version", status: "Statut", statusValue: "Document de travail · Validation juridique en attente",
    publication: "Date de publication / d’effet", publicationTodo: "À finaliser avant lancement", updated: "Dernière mise à jour", updatedTodo: "Non finalisée",
    language: "Langue", other: "Read this document in English", back: "Retour à SHIDA", onPage: "Dans ce document",
    notice: "Document de travail — à soumettre à validation juridique avant lancement commercial définitif.", current: "Version actuelle", archived: "Version historique stable",
  } : {
    identity: "SHIDA · A NIHILOBA service", version: "Version", status: "Status", statusValue: "Working draft · Pending legal review",
    publication: "Publication / effective date", publicationTodo: "To be finalized before launch", updated: "Last updated", updatedTodo: "Not finalized",
    language: "Language", other: "Lire ce document en français", back: "Back to SHIDA", onPage: "In this document",
    notice: "Working draft — subject to legal review before final commercial launch.", current: "Current version", archived: "Stable historical version",
  };
  const otherHref = historical ? other.versionRoute : other.canonicalRoute;
  return <>
    <header className="versioned-legal-header"><div className="container"><p className="eyebrow">{copy.identity}</p><h1>{content.title}</h1><div className="versioned-legal-meta" aria-label={locale === "fr" ? "Métadonnées du document" : "Document metadata"}><span><strong>{copy.version}</strong> {metadata.version}</span><span><strong>{copy.status}</strong> {copy.statusValue}</span><span><strong>{copy.publication}</strong> {copy.publicationTodo}</span><span><strong>{copy.updated}</strong> {copy.updatedTodo}</span><span><strong>{copy.language}</strong> {metadata.languageLabel}</span><span><strong>{historical ? copy.archived : copy.current}</strong></span></div><aside className="versioned-legal-draft" role="note">{copy.notice}</aside><nav className="versioned-legal-links" aria-label={locale === "fr" ? "Liens du document" : "Document links"}><Link href={otherHref} hrefLang={other.locale}>{copy.other}</Link><Link href={locale === "fr" ? "/fr/shida" : "/shida"}>{copy.back}</Link>{!historical && <Link href={metadata.versionRoute}>{locale === "fr" ? "Lien permanent vers la version 1.0" : "Permanent link to version 1.0"}</Link>}</nav></div></header>
    <section className="section versioned-legal-section"><div className="container legal-doc-layout"><LegalSidebar label={copy.onPage} items={content.sections.map(({ id, title }) => ({ id, label: title }))}/><article className="legal-doc-content versioned-legal-content" lang={metadata.locale} data-document-id={metadata.documentId} data-document-version={metadata.version}><div className="versioned-legal-introduction"><Blocks blocks={content.introduction}/></div>{content.sections.map((section) => <section id={section.id} className="legal-section" key={section.id}><h2>{section.title}</h2><Blocks blocks={section.blocks}/></section>)}</article></div></section>
  </>;
}
