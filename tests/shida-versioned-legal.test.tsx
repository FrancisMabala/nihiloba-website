import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ShidaVersionedLegalPage } from "../app/components/legal/shida-versioned-legal-page";
import {
  getOtherLanguageDocument,
  getShidaLegalMetadata,
  loadShidaLegalDocument,
  parseLegalMarkdown,
  shidaLegalDocuments,
  shidaLegalLocaleFallback,
  shidaLegalPageMetadata,
} from "../app/lib/shida-legal";

const routeFiles = [
  "app/(default)/shida/terms/page.tsx",
  "app/(default)/shida/privacy/page.tsx",
  "app/(default)/shida/business/terms/page.tsx",
  "app/(localized)/[lang]/shida/conditions/page.tsx",
  "app/(localized)/[lang]/shida/confidentialite/page.tsx",
  "app/(localized)/[lang]/shida/business/conditions/page.tsx",
];

describe("versioned SHIDA legal documents", () => {
  it("registers six canonical bilingual documents and immutable Version 1.0 sources", () => {
    expect(shidaLegalDocuments).toHaveLength(12);
    expect(new Set(shidaLegalDocuments.map((item) => `${item.documentId}:${item.version}`)).size).toBe(6);
    for (const document of shidaLegalDocuments.filter(d => d.version === "1.0")) {
      expect(document.version).toBe("1.0");
      expect(document.status).toBe("draft_pending_legal_review");
      expect(document.effectiveDate).toBeNull();
      expect(document.versionRoute).toMatch(/\/1\.0$/);
      expect(existsSync(join("content", "legal", "shida", document.sourcePath))).toBe(true);
    }
  });

  it("provides every canonical and historical route file", () => {
    for (const file of routeFiles) {
      expect(existsSync(file)).toBe(true);
      expect(existsSync(file.replace("/page.tsx", "/[version]/page.tsx"))).toBe(true);
    }
  });

  it("renders the supplied Markdown headings, paragraphs and lists", () => {
    const expectations = { terms: 23, privacy: 24, "business-terms": 26 } as const;
    for (const kind of Object.keys(expectations) as (keyof typeof expectations)[]) {
      for (const locale of ["en", "fr"] as const) {
        const document = loadShidaLegalDocument(kind, locale, "1.0");
        expect(document).not.toBeNull();
        expect(document!.content.sections).toHaveLength(expectations[kind]);
        expect(document!.content.introduction.length).toBeGreaterThan(1);
        const html = renderToStaticMarkup(<ShidaVersionedLegalPage kind={kind} locale={locale} version="1.0"/>);
        expect(html).toContain('data-document-version="1.0"');
        expect(html).toContain(locale === "fr" ? "Validation juridique en attente" : "Pending legal review");
        expect((html.match(/<h1/g) ?? [])).toHaveLength(1);
        expect((html.match(/<h2/g) ?? []).length).toBe(expectations[kind]);
        expect(html).toContain(`lang="${locale}"`);
      }
    }
  });

  it("keeps centralized canonical, version and locale metadata aligned", () => {
    const english = getShidaLegalMetadata("terms", "en")!;
    const french = getOtherLanguageDocument(english);
    expect(english.canonicalRoute).toBe("/shida/terms");
    expect(english.versionRoute).toBe("/shida/terms/1.1");
    expect(french.canonicalRoute).toBe("/fr/shida/conditions");
    const currentMetadata = shidaLegalPageMetadata(english);
    const historicalMetadata = shidaLegalPageMetadata(english, true);
    expect(currentMetadata.alternates?.canonical).toBe("/shida/terms");
    expect(historicalMetadata.alternates?.canonical).toBe("/shida/terms/1.1");
    expect(currentMetadata.other).toMatchObject({ "shida-legal-document-id": "SHIDA_TERMS_OF_USE", "shida-legal-document-version": "1.1" });
  });

  it("switches to the exact corresponding locale and keeps all internal links valid", () => {
    for (const document of shidaLegalDocuments) {
      const html = renderToStaticMarkup(<ShidaVersionedLegalPage kind={document.kind} locale={document.locale} version={document.version}/>);
      const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1].replaceAll("&amp;", "&"));
      const expected = getOtherLanguageDocument(document).canonicalRoute;
      expect(hrefs).toContain(expected);
      expect(hrefs).toContain(document.versionRoute);
      const sectionIds = loadShidaLegalDocument(document.kind, document.locale, document.version)!.content.sections.map((section) => `#${section.id}`);
      for (const href of hrefs) expect(href === "/shida" || href === "/fr/shida" || sectionIds.includes(href) || shidaLegalDocuments.some((item) => item.canonicalRoute === href || item.versionRoute === href)).toBe(true);
    }
  });

  it("uses a deliberate French fallback without mislabelling LN or SW", () => {
    expect(shidaLegalLocaleFallback("ln")).toBe("fr");
    expect(shidaLegalLocaleFallback("sw")).toBe("fr");
    expect(loadShidaLegalDocument("privacy", shidaLegalLocaleFallback("ln"))!.metadata.languageLabel).toBe("Français");
  });

  it("returns no document for an unknown version so the page produces a 404", () => {
    expect(getShidaLegalMetadata("privacy", "en", "9.9")).toBeNull();
    expect(loadShidaLegalDocument("privacy", "en", "9.9")).toBeNull();
    expect(() => renderToStaticMarkup(<ShidaVersionedLegalPage kind="privacy" locale="en" version="9.9" historical/>)).toThrow();
  });

  it("keeps source copy outside React and includes accessible responsive and print rules", () => {
    const component = readFileSync("app/components/legal/shida-versioned-legal-page.tsx", "utf8");
    expect(component).not.toContain("These Terms of Use");
    expect(component).not.toContain("Les présentes Conditions");
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toContain("@media print");
    expect(css).toContain(".versioned-legal-meta");
    const parsed = parseLegalMarkdown("# Title\n\nIntro\n\n## 1. Section\n\n- One\n- Two");
    expect(parsed.sections[0].blocks[0]).toEqual({ type: "list", items: ["One", "Two"] });
  });
});

it("publishes complete bilingual 1.1 sources while keeping 1.0 available", () => {
 for (const kind of ["terms","privacy","business-terms"] as const) for (const locale of ["en","fr"] as const) {
  const doc=loadShidaLegalDocument(kind,locale)!;
  expect(doc.metadata.version).toBe("1.1");
  const raw=readFileSync(join("content/legal/shida",doc.metadata.sourcePath),"utf8");
  expect(raw).toContain("Francis Mabala Lemoya");
  expect(raw).not.toMatch(/\[B\d{2}/);
  expect(loadShidaLegalDocument(kind,locale,"1.0")).not.toBeNull();
  const html=renderToStaticMarkup(<ShidaVersionedLegalPage kind={kind} locale={locale}/>);
  expect(html).toContain("2026-10-22");
  expect(html).not.toContain("Pending legal review");
 }
});
