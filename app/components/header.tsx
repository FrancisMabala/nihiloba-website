"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Locale } from "../lib/i18n";
import { localizedPath, nav } from "../lib/i18n";
import { BrandLogo } from "./brand-logo";

const links = [
  ["home", ""],
  ["about", "/about"],
  ["products", "/products"],
  ["shida", "/shida"],
  ["education", "/education"],
  ["contact", "/contact"],
] as const;

export function Header({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const t = nav[locale];
  const otherLocale: Locale = locale === "en" ? "fr" : "en";

  // Remove the current language prefix while preserving the page path
  const suffix =
    pathname.replace(/^\/(en|fr)(?=\/|$)/, "") || "/";

  const comparableSuffix = suffix === "/" ? suffix : suffix.replace(/\/$/, "");

  const languageHref = comparableSuffix === "/data-protection"
    ? "/fr/protection-des-donnees"
    : comparableSuffix === "/protection-des-donnees"
      ? "/en/data-protection"
      : comparableSuffix === "/security"
        ? "/fr/securite"
        : comparableSuffix === "/securite"
          ? "/en/security"
          : comparableSuffix === "/terms"
            ? "/fr/conditions-utilisation"
            : comparableSuffix === "/conditions-utilisation"
              ? "/en/terms"
              : comparableSuffix === "/acceptable-use"
                ? "/fr/utilisation-acceptable"
                : comparableSuffix === "/utilisation-acceptable"
                  ? "/en/acceptable-use"
                  : comparableSuffix === "/trust"
                    ? "/fr/confiance"
                    : comparableSuffix === "/confiance"
                      ? "/en/trust"
      : `/${otherLocale}${suffix}`;

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link
          className="header-logo"
          href={localizedPath(locale)}
          aria-label={`NIHILOBA ${t.home}`}
        >
          <BrandLogo eager />
        </Link>

        <button
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="primary-navigation"
          aria-label={open ? t.menuClose : t.menuOpen}
          onClick={() => setOpen(!open)}
        >
          <span className={open ? "menu-line menu-line-open" : "menu-line"} />
          <span className={open ? "menu-line menu-line-open" : "menu-line"} />
        </button>

        <nav
          id="primary-navigation"
          className={open ? "primary-nav primary-nav-open" : "primary-nav"}
          aria-label={t.primaryNav}
        >
          {links.map(([key, path]) => {
            const href = localizedPath(locale, path);

            const active =
              path === ""
                ? pathname === href || pathname === `${href}/`
                : pathname.startsWith(href);

            return (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                className={active ? "nav-link nav-link-active" : "nav-link"}
                aria-current={active ? "page" : undefined}
              >
                {t[key]}
              </Link>
            );
          })}

          <span className="nav-divider" aria-hidden="true" />

          <div
            className="language-switcher"
            aria-label={locale === "en" ? "Language" : "Langue"}
          >
            <span aria-current="true">{locale.toUpperCase()}</span>

            <a href={languageHref} hrefLang={otherLocale}>
              {otherLocale.toUpperCase()}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
