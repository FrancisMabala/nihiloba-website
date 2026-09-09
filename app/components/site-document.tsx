import type { ReactNode } from "react";
import type { Locale } from "../lib/i18n";
import { nav } from "../lib/i18n";
import { Footer } from "./footer";
import { Header } from "./header";
import { CartProvider } from "./shida/cart-provider";

export function SiteDocument({ children, locale, documentLanguage = locale }: { children: ReactNode; locale: Locale; documentLanguage?: string }) {
  return (
    <html lang={documentLanguage}>
      <body>
        <a className="skip-link" href="#main-content">{nav[locale].skip}</a>
        <CartProvider>
          <Header locale={locale} />
          <main id="main-content">{children}</main>
        </CartProvider>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
