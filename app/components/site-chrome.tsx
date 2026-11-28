"use client";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import type { Locale } from "../lib/i18n";
import { Header } from "./header";
import { ShidaNavigation } from "./shida/shida-navigation";
import "./shida/shida-refinement.css";
import { Footer } from "./footer";
import { CookieSettingsButton } from "./shida/cookie-settings-button";
import { CartProvider } from "./shida/cart-provider";
import "./shida/marketplace-surfaces.css";
import "./shida/discovery-visual.css";
import "./shida/public-marketplace-standard.css";

export function SiteChrome({ children, locale }: { children: ReactNode; locale: Locale }) {
  const pathname = usePathname();
  const marketLocale=pathname.startsWith("/sw/")?"sw":pathname.startsWith("/ln/")?"ln":locale;
  const settingsFooter=<footer className="website-cookie-footer" lang={marketLocale}><CookieSettingsButton language={marketLocale}/></footer>;
  if (/^\/(?:fr\/|en\/|ln\/|sw\/)?shida\/business-login\/?$/.test(pathname)) return <>{children}{settingsFooter}</>;
  const management = /^\/(?:fr\/|en\/|ln\/|sw\/)?shida\/seller\/(?:restaurants|wenze|services)(?:\/|$)/.test(pathname);
  if (management) return <><main id="main-content">{children}</main>{settingsFooter}</>;
  const marketplace = /^\/(?:fr\/|en\/|ln\/|sw\/)?shida(?:\/|$)/.test(pathname);
  const publicMarketplace = pathname.match(/^\/(?:fr\/|en\/|ln\/|sw\/)?shida\/(wenze|restaurants|services|emplois|transport|appartements|hotels|meda)\/?$/)?.[1];
  return <div className={marketplace ? "market-surface" : undefined} data-public-marketplace={publicMarketplace}><CartProvider><Header locale={locale}/>{marketplace&&<Suspense><ShidaNavigation/></Suspense>}<main id="main-content">{children}</main></CartProvider><Footer locale={locale} marketplace={marketplace} marketLocale={marketLocale}/></div>;
}
