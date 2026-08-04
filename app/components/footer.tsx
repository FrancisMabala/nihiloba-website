import Link from "next/link";
import type { Locale } from "../lib/i18n";
import { localizedPath, nav } from "../lib/i18n";
import { BrandLogo } from "./brand-logo";

export function Footer({ locale }: { locale: Locale }) {
  const t = nav[locale];
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-intro"><Link className="footer-logo" href={localizedPath(locale)}><BrandLogo /></Link><p>{t.tagline}</p></div>
        <div className="footer-column"><p className="footer-label">{t.company}</p><Link href={localizedPath(locale,"/about")}>{t.about}</Link><Link href={localizedPath(locale,"/products")}>{t.products}</Link><Link href={localizedPath(locale,"/education")}>{t.education}</Link><Link href={localizedPath(locale,"/contact")}>{t.contact}</Link></div>
        <div className="footer-column"><p className="footer-label">{t.product}</p><Link href={localizedPath(locale,"/shida")}>SHIDA</Link><a href="https://wa.me/46769709059?text=Bonjour" target="_blank" rel="noopener noreferrer">{t.open}</a></div>
        <div className="footer-column"><h2 className="footer-label"><Link href={locale==="en"?"/en/trust":"/fr/confiance"}>{t.trustCenter}</Link></h2><Link href={localizedPath(locale,"/privacy")}>{t.privacy}</Link><Link href={locale==="en"?"/en/data-protection":"/fr/protection-des-donnees"}>{t.dataProtection}</Link><Link href={locale==="en"?"/en/security":"/fr/securite"}>{t.security}</Link><Link href={locale==="en"?"/en/terms":"/fr/conditions-utilisation"}>{t.terms}</Link><Link href={localizedPath(locale,"/faq")}>{t.faq}</Link><Link href={locale==="en"?"/en/acceptable-use":"/fr/utilisation-acceptable"}>{t.acceptableUse}</Link></div>
      </div>
      <div className="container footer-bottom"><p>© {new Date().getFullYear()} NIHILOBA. {t.rights}</p><p>{t.tagline}</p></div>
    </footer>
  );
}
