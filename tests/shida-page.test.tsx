import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ShidaPage } from "../app/components/pages/localized-pages";
import { pageMetadata } from "../app/lib/i18n";

describe("SHIDA public presentation", () => {
  it("presents Wenze as current and preserves English marketplace routes", () => {
    const html = renderToStaticMarkup(<ShidaPage locale="en" />);
    expect(html).toContain("local commerce");
    expect(html).toContain("Available today");
    expect(html).toContain("Discover shops and products available through SHIDA");
    expect(html).toContain('href="/shida/appartements"');
    expect(html).toContain('href="/shida/hotels"');
    expect(html).toContain('href="/shida/wenze"');
    expect(html).toContain('href="/shida/emplois"');
    expect(html).not.toContain("💼");
    const gateway = html.match(/marketplace-gateway-links">([\s\S]*?)<\/div>/)?.[1] ?? "";
    expect((gateway.match(/button-secondary/g) || [])).toHaveLength(5);
    expect(html).not.toContain("Wenze Marketplace");
  });

  it("distinguishes direct-entry links from confirmation QR references", () => {
    const html = renderToStaticMarkup(<ShidaPage locale="en" />);
    expect(html).toContain("QR codes and direct access with SHIDA");
    expect(html).toContain("Direct access before a transaction");
    expect(html).toContain("A SHIDA reference after confirmation");
    expect(html).toContain("Service confirmation");
    expect(html).toContain("Hotel booking");
    expect(html).toContain("Wenze purchase or order");
    expect(html).toContain("does not automatically share personal information");
    expect(html).toContain("does not by itself prove payment");
  });

  it("keeps personal QR and payment capabilities clearly future-facing", () => {
    const html = renderToStaticMarkup(<ShidaPage locale="en" />);
    expect(html).toContain("Coming next");
    expect(html).toContain("Personal SHIDA QR");
    expect(html).toContain("A future SHIDA account");
    expect(html).toContain("would not replace official identification");
    expect(html).toContain("SHIDA is exploring payment flows");
    expect(html).toContain("does not currently present this as a wallet");
  });

  it("keeps the French page synchronized with localized marketplace routes", () => {
    const html = renderToStaticMarkup(<ShidaPage locale="fr" />);
    expect(html).toContain("commerce local");
    expect(html).toContain("QR codes et accès direct avec SHIDA");
    expect(html).toContain("Confirmation de service");
    expect(html).toContain("Réservation d’hôtel");
    expect(html).toContain("Achat ou commande Wenze");
    expect(html).toContain("QR personnel SHIDA");
    expect(html).toContain("SHIDA explore l’intégration de parcours de paiement");
    expect(html).toContain('href="/fr/shida/appartements"');
    expect(html).toContain('href="/fr/shida/hotels"');
    expect(html).toContain('href="/fr/shida/wenze"');
    expect(html).toContain('href="/fr/shida/emplois"');
  });

  it("updates SHIDA metadata without changing canonical language routing", () => {
    const english = pageMetadata("en", "shida", "/shida");
    const french = pageMetadata("fr", "shida", "/shida");
    expect(english.description).toContain("Wenze");
    expect(english.description).toContain("QR access");
    expect(english.alternates?.canonical).toBe("/shida");
    expect(french.description).toContain("QR codes");
    expect(french.alternates?.canonical).toBe("/fr/shida");
  });
});
