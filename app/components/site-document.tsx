import { LocalizedFormValidation } from "./localized-form-validation";
import { Suspense, type ReactNode } from "react";
import type { Locale } from "../lib/i18n";
import { nav } from "../lib/i18n";
import { SiteChrome } from "./site-chrome";
import { WebsiteStatisticsConsent } from "./shida/website-statistics-consent";
import "./shida/shida-presentation.css";
import "./shida/shida-responsive.css";

export function SiteDocument({ children, locale, documentLanguage = locale }: { children: ReactNode; locale: Locale; documentLanguage?: string }) {
  return (
    <html lang={documentLanguage}>
      <body className="shida-ui">
        <LocalizedFormValidation />
        <a className="skip-link" lang={documentLanguage} href="#main-content">{documentLanguage==="ln"?"Kende na makambo ya lokasa":documentLanguage==="sw"?"Nenda kwenye maudhui":nav[locale].skip}</a>
        <Suspense fallback={null}><WebsiteStatisticsConsent language={documentLanguage}/></Suspense>
        <SiteChrome locale={locale}>{children}</SiteChrome>
      </body>
    </html>
  );
}
