import { LocalizedFormValidation } from "./localized-form-validation";
import type { ReactNode } from "react";
import type { Locale } from "../lib/i18n";
import { nav } from "../lib/i18n";
import { SiteChrome } from "./site-chrome";

export function SiteDocument({ children, locale, documentLanguage = locale }: { children: ReactNode; locale: Locale; documentLanguage?: string }) {
  return (
    <html lang={documentLanguage}>
      <body>
        <LocalizedFormValidation />
        <a className="skip-link" lang={documentLanguage} href="#main-content">{documentLanguage==="ln"?"Kende na makambo ya lokasa":documentLanguage==="sw"?"Nenda kwenye maudhui":nav[locale].skip}</a>
        <SiteChrome locale={locale}>{children}</SiteChrome>
      </body>
    </html>
  );
}
