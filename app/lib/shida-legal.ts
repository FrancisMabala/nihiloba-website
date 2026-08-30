import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import type { Locale } from "./i18n";

export type ShidaLegalDocumentId = "SHIDA_TERMS_OF_USE" | "SHIDA_PRIVACY_POLICY" | "SHIDA_BUSINESS_TERMS";
export type ShidaLegalDocumentKind = "terms" | "privacy" | "business-terms";
export type ShidaLegalSourceLocale = Locale;
export type ShidaLegalRequestedLocale = ShidaLegalSourceLocale | "ln" | "sw";

export type ShidaLegalDocumentMetadata = {
  documentId: ShidaLegalDocumentId;
  kind: ShidaLegalDocumentKind;
  version: string;
  locale: ShidaLegalSourceLocale;
  languageLabel: string;
  title: string;
  status: "draft_pending_legal_review";
  publicationDate: null;
  effectiveDate: null;
  lastUpdatedDate: null;
  canonicalRoute: string;
  versionRoute: string;
  sourcePath: string;
};

export type LegalMarkdownBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type LegalMarkdownSection = { id: string; title: string; blocks: LegalMarkdownBlock[] };
export type ParsedLegalMarkdown = { title: string; introduction: LegalMarkdownBlock[]; sections: LegalMarkdownSection[] };

const DOCUMENTS: readonly ShidaLegalDocumentMetadata[] = [
  { documentId: "SHIDA_TERMS_OF_USE", kind: "terms", version: "1.0", locale: "en", languageLabel: "English", title: "SHIDA Terms of Use", status: "draft_pending_legal_review", publicationDate: null, effectiveDate: null, lastUpdatedDate: null, canonicalRoute: "/shida/terms", versionRoute: "/shida/terms/1.0", sourcePath: "terms/1.0/en.md" },
  { documentId: "SHIDA_TERMS_OF_USE", kind: "terms", version: "1.0", locale: "fr", languageLabel: "Français", title: "Conditions d’utilisation de SHIDA", status: "draft_pending_legal_review", publicationDate: null, effectiveDate: null, lastUpdatedDate: null, canonicalRoute: "/fr/shida/conditions", versionRoute: "/fr/shida/conditions/1.0", sourcePath: "terms/1.0/fr.md" },
  { documentId: "SHIDA_PRIVACY_POLICY", kind: "privacy", version: "1.0", locale: "en", languageLabel: "English", title: "SHIDA Privacy Policy", status: "draft_pending_legal_review", publicationDate: null, effectiveDate: null, lastUpdatedDate: null, canonicalRoute: "/shida/privacy", versionRoute: "/shida/privacy/1.0", sourcePath: "privacy/1.0/en.md" },
  { documentId: "SHIDA_PRIVACY_POLICY", kind: "privacy", version: "1.0", locale: "fr", languageLabel: "Français", title: "Politique de confidentialité SHIDA", status: "draft_pending_legal_review", publicationDate: null, effectiveDate: null, lastUpdatedDate: null, canonicalRoute: "/fr/shida/confidentialite", versionRoute: "/fr/shida/confidentialite/1.0", sourcePath: "privacy/1.0/fr.md" },
  { documentId: "SHIDA_BUSINESS_TERMS", kind: "business-terms", version: "1.0", locale: "en", languageLabel: "English", title: "SHIDA Business Terms of Use", status: "draft_pending_legal_review", publicationDate: null, effectiveDate: null, lastUpdatedDate: null, canonicalRoute: "/shida/business/terms", versionRoute: "/shida/business/terms/1.0", sourcePath: "business-terms/1.0/en.md" },
  { documentId: "SHIDA_BUSINESS_TERMS", kind: "business-terms", version: "1.0", locale: "fr", languageLabel: "Français", title: "Conditions d’utilisation de SHIDA Business", status: "draft_pending_legal_review", publicationDate: null, effectiveDate: null, lastUpdatedDate: null, canonicalRoute: "/fr/shida/business/conditions", versionRoute: "/fr/shida/business/conditions/1.0", sourcePath: "business-terms/1.0/fr.md" },
] as const;

export const shidaLegalDocuments = DOCUMENTS;
export const shidaLegalCurrentVersions: Readonly<Record<ShidaLegalDocumentKind, string>> = { terms: "1.0", privacy: "1.0", "business-terms": "1.0" };

export function shidaLegalLocaleFallback(locale: ShidaLegalRequestedLocale): ShidaLegalSourceLocale {
  return locale === "en" ? "en" : "fr";
}

export function getShidaLegalMetadata(kind: ShidaLegalDocumentKind, locale: ShidaLegalSourceLocale, version: string = shidaLegalCurrentVersions[kind]): ShidaLegalDocumentMetadata | null {
  return DOCUMENTS.find((document) => document.kind === kind && document.locale === locale && document.version === version) ?? null;
}

export function getOtherLanguageDocument(document: ShidaLegalDocumentMetadata): ShidaLegalDocumentMetadata {
  return getShidaLegalMetadata(document.kind, document.locale === "en" ? "fr" : "en", document.version)!;
}

function sectionId(title: string): string {
  return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseBlocks(lines: string[]): LegalMarkdownBlock[] {
  const blocks: LegalMarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flushParagraph = () => { if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") }); paragraph = []; };
  const flushList = () => { if (list.length) blocks.push({ type: "list", items: list }); list = []; };
  for (const rawLine of [...lines, ""]) {
    const line = rawLine.trim();
    if (!line) { flushParagraph(); flushList(); continue; }
    if (line.startsWith("- ")) { flushParagraph(); list.push(line.slice(2).trim()); continue; }
    flushList(); paragraph.push(line);
  }
  return blocks;
}

export function parseLegalMarkdown(source: string): ParsedLegalMarkdown {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const titleIndex = lines.findIndex((line) => line.startsWith("# "));
  if (titleIndex < 0) throw new Error("Legal document is missing its title");
  const title = lines[titleIndex].slice(2).trim();
  const introductionLines: string[] = [];
  const sections: LegalMarkdownSection[] = [];
  let current: { title: string; lines: string[] } | null = null;
  for (const line of lines.slice(titleIndex + 1)) {
    if (line.startsWith("## ")) {
      if (current) sections.push({ id: sectionId(current.title), title: current.title, blocks: parseBlocks(current.lines) });
      current = { title: line.slice(3).trim(), lines: [] };
    } else if (current) current.lines.push(line);
    else introductionLines.push(line);
  }
  if (current) sections.push({ id: sectionId(current.title), title: current.title, blocks: parseBlocks(current.lines) });
  return { title, introduction: parseBlocks(introductionLines), sections };
}

export function loadShidaLegalDocument(kind: ShidaLegalDocumentKind, locale: ShidaLegalSourceLocale, version: string = shidaLegalCurrentVersions[kind]): { metadata: ShidaLegalDocumentMetadata; content: ParsedLegalMarkdown } | null {
  const metadata = getShidaLegalMetadata(kind, locale, version);
  if (!metadata) return null;
  const source = readFileSync(join(process.cwd(), "content", "legal", "shida", metadata.sourcePath), "utf8");
  return { metadata, content: parseLegalMarkdown(source) };
}

export function shidaLegalPageMetadata(document: ShidaLegalDocumentMetadata, historical = false): Metadata {
  const other = getOtherLanguageDocument(document);
  const canonical = historical ? document.versionRoute : document.canonicalRoute;
  const otherRoute = historical ? other.versionRoute : other.canonicalRoute;
  const description = document.locale === "fr"
    ? `Version ${document.version} du document public ${document.title}. Document de travail en attente de validation juridique.`
    : `Version ${document.version} of the public ${document.title}. Working draft pending legal review.`;
  return {
    title: `${document.title} — Version ${document.version}`,
    description,
    alternates: { canonical, languages: { en: document.locale === "en" ? canonical : otherRoute, fr: document.locale === "fr" ? canonical : otherRoute, "x-default": document.locale === "en" ? canonical : otherRoute } },
    openGraph: { title: `${document.title} — Version ${document.version}`, description, url: canonical, locale: document.locale === "fr" ? "fr_FR" : "en_US", images: [{ url: "/NIHILOBA_logo.png", width: 1536, height: 1024, alt: "NIHILOBA — Roots. Impact. Future." }] },
    other: { "shida-legal-document-id": document.documentId, "shida-legal-document-version": document.version, "shida-legal-document-status": document.status },
  };
}
