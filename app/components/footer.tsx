import Link from "next/link";
import type { Locale } from "../lib/i18n";
import { localizedPath, nav } from "../lib/i18n";
import { OFFICIAL_CHANNELS, SOCIAL_LINKS } from "../lib/brand";
import { BrandLogo } from "./brand-logo";

export function Footer({ locale, marketplace = false }: { locale: Locale; marketplace?: boolean }) {
  const t = nav[locale];
  if(marketplace)return <footer className="site-footer market-footer" lang={locale}><div className="container shida-footer-row"><Link className="market-brand" href={localizedPath(locale,"/shida")}>SHIDA</Link><nav aria-label={t.product}><Link href={localizedPath(locale,"/faq")}>{t.faq}</Link><Link href={localizedPath(locale,"/contact")}>{t.contact}</Link><Link href={localizedPath(locale,"/privacy")}>{t.privacy}</Link><Link href={locale==="en"?"/en/terms":"/fr/conditions-utilisation"}>{t.terms}</Link><Link href={locale==="en"?"/en/trust":"/fr/confiance"}>{t.trustCenter}</Link></nav><small>© {new Date().getFullYear()} NIHILOBA. {t.rights}</small></div></footer>;
  return (
    <footer className={marketplace ? "site-footer market-footer" : "site-footer"} lang={locale}>
      <div className="container footer-grid">
        <div className="footer-intro"><Link className="footer-logo" href={localizedPath(locale,marketplace?"/shida":"")}>{marketplace ? <span className="market-brand">SHIDA</span> : <BrandLogo />}</Link><p>{t.tagline}</p></div>
        <div className="footer-column"><p className="footer-label">{t.company}</p><Link href={localizedPath(locale,"/about")}>{t.about}</Link><Link href={localizedPath(locale,"/products")}>{t.products}</Link><Link href={localizedPath(locale,"/education")}>{t.education}</Link><Link href={localizedPath(locale,"/contact")}>{t.contact}</Link></div>
        <div className="footer-column"><p className="footer-label">{t.product}</p><Link href={localizedPath(locale,"/shida")}>SHIDA</Link><a href={OFFICIAL_CHANNELS.whatsapp} target="_blank" rel="noopener noreferrer">{t.open}</a>{SOCIAL_LINKS.map(({label,href})=><a href={href} target="_blank" rel="noopener noreferrer" key={label}>{label}</a>)}</div>
        <div className="footer-column"><h2 className="footer-label"><Link href={locale==="en"?"/en/trust":"/fr/confiance"}>{t.trustCenter}</Link></h2><Link href={localizedPath(locale,"/privacy")}>{t.privacy}</Link><Link href={locale==="en"?"/en/data-protection":"/fr/protection-des-donnees"}>{t.dataProtection}</Link><Link href={locale==="en"?"/en/security":"/fr/securite"}>{t.security}</Link><Link href={locale==="en"?"/en/terms":"/fr/conditions-utilisation"}>{t.terms}</Link><Link href={localizedPath(locale,"/faq")}>{t.faq}</Link><Link href={locale==="en"?"/en/acceptable-use":"/fr/utilisation-acceptable"}>{t.acceptableUse}</Link></div>
      </div>
      <div className="container footer-bottom"><p>© {new Date().getFullYear()} NIHILOBA. {t.rights}</p><p>{t.tagline}</p></div>
    </footer>
  );
}
