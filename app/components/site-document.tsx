import type { ReactNode } from "react";
import type { Locale } from "../lib/i18n";
import { nav } from "../lib/i18n";
import { Footer } from "./footer";
import { Header } from "./header";

export function SiteDocument({ children, locale }: { children: ReactNode; locale: Locale }) {
  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#main-content">{nav[locale].skip}</a>
        <Header locale={locale} />
        <main id="main-content">{children}</main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
