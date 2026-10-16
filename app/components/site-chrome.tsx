"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Locale } from "../lib/i18n";
import { Header } from "./header";
import { Footer } from "./footer";
import { CartProvider } from "./shida/cart-provider";

export function SiteChrome({ children, locale }: { children: ReactNode; locale: Locale }) {
  const pathname = usePathname();
  const management = /^\/(?:fr\/|en\/|ln\/|sw\/)?shida\/seller\/(?:restaurants|wenze|services)(?:\/|$)/.test(pathname);
  if (management) return <main id="main-content">{children}</main>;
  return <><CartProvider><Header locale={locale}/><main id="main-content">{children}</main></CartProvider><Footer locale={locale}/></>;
}
