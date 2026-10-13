import type { ReactNode } from "react";
import type { Locale } from "../lib/i18n";
import { nav } from "../lib/i18n";
import { SiteChrome } from "./site-chrome";

export function SiteDocument({ children, locale, documentLanguage = locale }: { children: ReactNode; locale: Locale; documentLanguage?: string }) {
  return (
    <html lang={documentLanguage}>
      <body>
        <a className="skip-link" lang={locale} href="#main-content">{nav[locale].skip}</a>
        <SiteChrome locale={locale}>{children}</SiteChrome>
      </body>
    </html>
  );
}
