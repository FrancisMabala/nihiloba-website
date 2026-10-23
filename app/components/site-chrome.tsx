"use client";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import type { Locale } from "../lib/i18n";
import { Header } from "./header";
import { ShidaNavigation } from "./shida/shida-navigation";
import "./shida/shida-refinement.css";
import { Footer } from "./footer";
import { CartProvider } from "./shida/cart-provider";
import "./shida/marketplace-surfaces.css";
import "./shida/discovery-visual.css";

export function SiteChrome({ children, locale }: { children: ReactNode; locale: Locale }) {
  const pathname = usePathname();
  const management = /^\/(?:fr\/|en\/|ln\/|sw\/)?shida\/seller\/(?:restaurants|wenze|services)(?:\/|$)/.test(pathname);
  if (management) return <main id="main-content">{children}</main>;
  const marketplace = /^\/(?:fr\/|en\/|ln\/|sw\/)?shida(?:\/|$)/.test(pathname);
  return <div className={marketplace ? "market-surface" : undefined}><CartProvider><Header locale={locale}/>{marketplace&&<Suspense><ShidaNavigation/></Suspense>}<main id="main-content">{children}</main></CartProvider><Footer locale={locale} marketplace={marketplace}/></div>;
}
