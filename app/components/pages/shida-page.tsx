import Link from "next/link";
import { Suspense } from "react";
import { OFFICIAL_CHANNELS } from "../../lib/brand";
import { discoveryCopy, discoveryMarkets, discoveryPath, type DiscoveryLocale } from "../../lib/discovery-copy";
import { ArrowRightIcon, BookIcon, BriefcaseIcon, CarIcon, HomeIcon, StoreIcon, ToolsIcon } from "../icons";
import { DiscoveryIllustration } from "./discovery-illustration";
import { DiscoveryListings } from "./shida-discovery-listings";
import "./shida-discovery.css";
import { registrationCopy } from "../../lib/registration/copy";

const icons = [BriefcaseIcon, ToolsIcon, StoreIcon, HomeIcon, BookIcon, StoreIcon, CarIcon];
export function ShidaPage({ locale }: { locale: DiscoveryLocale }) {
  const t = discoveryCopy[locale];
  return <div className="discovery container" lang={locale}>
    <section className="discovery-hero" aria-labelledby="discovery-title">
      <p className="discovery-eyebrow">{t.eyebrow}</p><h1 id="discovery-title">{t.title}</h1><p>{t.intro}</p>
      <form className="discovery-search" action="/shida/find/" method="get" role="search" aria-describedby="discovery-search-note">
        <input type="hidden" name="locale" value={locale}/>
        <label><span>{t.market}</span><select name="market" defaultValue="emplois">{discoveryMarkets.slice(0, 6).map((market, i) => <option value={market} key={market}>{t.labels[i]}</option>)}</select></label>
        <label className="discovery-query"><span>{t.query}</span><input name="query" type="search" maxLength={120}/></label>
        <label><span>{t.city}</span><input name="city" list="discovery-cities" placeholder={t.anywhere} maxLength={120}/></label>
        <datalist id="discovery-cities">{["Kinshasa", "Lubumbashi", "Goma", "Bukavu", "Kisangani", "Matadi"].map(city => <option key={city} value={city}/>)}</datalist>
        <button type="submit">{t.search}<ArrowRightIcon/></button>
      </form><p className="discovery-search-note" id="discovery-search-note">{t.searchNote}</p>
    </section>
    <section id="explore" aria-labelledby="discovery-markets"><h2 id="discovery-markets">{t.explore}</h2>
      <nav className="discovery-categories" aria-label={t.explore}>{discoveryMarkets.map((market, i) => { const Icon = icons[i]; return <Link id={market === "emplois" ? "employment" : market === "appartements" ? "housing" : market} href={discoveryPath(locale, `/shida/${market}`)} key={market}><span className={`discovery-icon discovery-icon-${i}`}><Icon/></span><strong>{t.labels[i]}</strong><small>{t.hints[i]}</small></Link>; })}</nav>
    </section>
    <section className="discovery-listings" aria-labelledby="discovery-listings-title" id="stories"><h2 id="discovery-listings-title">{t.recent}</h2><p className="discovery-muted">{t.recentNote}</p>
      <Suspense fallback={<div className="discovery-loading" role="status">{t.loading}</div>}><DiscoveryListings locale={locale}/></Suspense>
    </section>
    <section className="discovery-entries" aria-label="SHIDA École & Business">
      <article id="school"><DiscoveryIllustration kind="school"/><div><h2>{t.school}</h2><Link href={discoveryPath(locale, "/shida/ecole")}>{t.schoolAction}<ArrowRightIcon/></Link></div></article>
      <article id="business"><DiscoveryIllustration kind="business"/><div><h2>{t.business}</h2><a href="https://business.nihiloba.com">{t.businessAction}<ArrowRightIcon/></a></div></article>
    </section>
    <div className="discovery-account-note"><a href={process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED === "true" ? `${locale === "en" ? "" : `/${locale}`}/shida/register/` : OFFICIAL_CHANNELS.whatsapp}>{process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED === "true" ? registrationCopy[locale].title : t.join}<ArrowRightIcon/></a></div>
    <p className="discovery-story-link"><Link href={locale === "en" ? "/about/shida" : "/fr/about/shida"}>{t.story}<ArrowRightIcon/></Link></p>
  </div>;
}
