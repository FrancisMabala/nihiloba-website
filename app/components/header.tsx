"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Locale } from "../lib/i18n";
import { localizedPath, nav } from "../lib/i18n";
import { BrandLogo } from "./brand-logo";
import { CartIcon } from "./icons";
import { useCart } from "./shida/cart-provider";
import { wenzeCartCopy, wenzeCartPath } from "./shida/wenze-cart-copy";
import {marketplaceAccountCopy} from "./shida/marketplace-account-copy";
import { PublicShidaAccount } from "./shida/public-account";

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
  const { cart, loading: cartLoading } = useCart();

  const t = nav[locale];
  const otherLocale: Locale = locale === "en" ? "fr" : "en";

  // Remove the current language prefix while preserving the page path
  const suffix =
    pathname.replace(/^\/(en|fr|ln|sw)(?=\/|$)/, "") || "/";

  const comparableSuffix = suffix === "/" ? suffix : suffix.replace(/\/$/, "");
  const shida = /^\/shida(?:\/|$)/.test(suffix);
  const accountLocale = /^\/ln(?:\/|$)/.test(pathname) ? "ln" : /^\/sw(?:\/|$)/.test(pathname) ? "sw" : locale;

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
                      : comparableSuffix === "/shida/wenze/cart"
                        ? "/fr/shida/wenze/panier"
                        : comparableSuffix === "/shida/wenze/panier"
                          ? "/shida/wenze/cart"
      : otherLocale === "en" && comparableSuffix.startsWith("/shida")
        ? suffix
        : `/${otherLocale}${suffix}`;

  if(shida){
    const prefix=locale==="en"?"":"/fr";
    const markets=[["Wenze","wenze"],["Restaurants","restaurants"],["Services","services"],[locale==="en"?"Jobs":"Emploi","emplois"],[locale==="en"?"Homes":"Logements","appartements"],[locale==="en"?"Hotels":"Hôtels","hotels"]];
    return <header className="market-header"><div className="market-header-inner"><div className="market-brand-group"><Link className="market-home" href={localizedPath(locale)} aria-label={marketplaceAccountCopy[locale].home}>NIHILOBA</Link><Link className="market-brand" href={`${prefix}/shida`}>SHIDA</Link></div><nav className="market-primary-nav" aria-label={locale==="en"?"Marketplaces":"Marchés"}>{markets.map(([label,path])=><Link key={path} href={`${prefix}/shida/${path}`} aria-current={suffix.startsWith(`/shida/${path}`)?"page":undefined}>{label}</Link>)}</nav><div className="market-header-actions"><Link className="market-cart" href={wenzeCartPath(locale)} aria-label={`${wenzeCartCopy[locale].cart}: ${cart?.item_count??0}`}><CartIcon/><span className="market-cart-label">{wenzeCartCopy[locale].cart} · </span><span aria-live="polite" aria-busy={cartLoading}>{cartLoading?"·":cart?.item_count??0}</span></Link><PublicShidaAccount key={`${pathname}:${accountLocale}`} locale={accountLocale}/></div></div></header>;
  }

  return (
    <header className={shida ? "site-header shida-header" : "site-header"} lang={locale}>
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
        {shida && <PublicShidaAccount key={`${pathname}:${accountLocale}`} locale={accountLocale}/>}
      </div>
    </header>
  );
}
