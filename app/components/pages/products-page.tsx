import Image from "next/image";
import { OFFICIAL_CHANNELS } from "../../lib/brand";
import { localizedPath, type Locale } from "../../lib/i18n";
import { productsCopy } from "../../lib/products-copy";
import { ButtonLink } from "../button-link";
import { ArrowRightIcon, BookIcon, BriefcaseIcon, CarIcon, CheckIcon, GlobeIcon, HomeIcon, LightbulbIcon, MessageIcon, StoreIcon, ToolsIcon } from "../icons";
import "./products-page.css";

function HotelIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 21V3h16v18M2 21h20M9 21v-5h6v5M8 7h1m6 0h1M8 11h1m6 0h1" /></svg>;
}

function RestaurantIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 3v5a3 3 0 0 0 6 0V3M7 3v18M19 21V3c-4 2-5 6-5 10h5" /></svg>;
}

const marketIcons = [BriefcaseIcon, ToolsIcon, StoreIcon, HomeIcon, HotelIcon, RestaurantIcon, CarIcon];
const principleIcons = [MessageIcon, CheckIcon, GlobeIcon];
const themeIcons = [BookIcon, ToolsIcon, GlobeIcon];
const processIcons = [LightbulbIcon, ToolsIcon, CheckIcon, GlobeIcon];
const marketImages = ["vendor", "services", "housing", "hotels", "transport"] as const;

function ProductImage({ name, alt, className = "", sizes, eager = false }: {
  name: string; alt: string; className?: string; sizes: string; eager?: boolean;
}) {
  return <div className={`products-image ${className}`}>
    <Image src={`/product/${name}.png`} alt={alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} />
  </div>;
}

function SectionLabel({ number, children }: { number?: string; children: React.ReactNode }) {
  return <p className="products-label">{number && <span className="products-index">{number}</span>}{children}</p>;
}

export function ProductsPage({ locale }: { locale: Locale }) {
  const t = productsCopy[locale];
  const contact = localizedPath(locale, "/contact");

  return <div className="products-editorial">
    <section className="products-hero" aria-labelledby="products-title">
      <div className="container products-hero-grid">
        <div className="products-hero-copy">
          <SectionLabel>{t.label}</SectionLabel>
          <h1 id="products-title">{t.title}</h1>
          <p className="products-body">{t.description}</p>
          <div className="products-actions">
            <ButtonLink href="#shida">{t.discover}</ButtonLink>
            <ButtonLink href={contact} variant="secondary">{t.contact}</ButtonLink>
          </div>
        </div>
        <ProductImage name="product-hero" alt={t.alts.hero} className="products-hero-image" sizes="(max-width: 700px) calc(100vw - 32px), (max-width: 940px) calc(100vw - 48px), (max-width: 1228px) 52vw, 650px" eager />
      </div>
    </section>

    <section className="container products-section products-shida" id="shida" aria-labelledby="products-shida-title">
      <div>
        <SectionLabel number="01">SHIDA</SectionLabel>
        <h2 id="products-shida-title">{t.shidaTitle}</h2>
        {t.shida.map(p => <p className="products-body" key={p}>{p}</p>)}
        <div className="products-actions">
          <ButtonLink href={localizedPath(locale, "/shida")}>{t.discoverShida}</ButtonLink>
          <ButtonLink href={OFFICIAL_CHANNELS.whatsapp} variant="secondary" external>{t.whatsapp}</ButtonLink>
        </div>
      </div>
      <div className="products-marketplace">
        <div className="products-market-images" role="region" aria-label={t.marketplaceLabel} tabIndex={0}>
          {marketImages.map(name => <ProductImage key={name} name={`products-shida-${name}`} alt={t.alts[name]} sizes="(max-width: 700px) 42vw, (max-width: 940px) 18vw, (max-width: 1228px) 10vw, 115px" />)}
        </div>
        <ul className="products-markets">
          {t.markets.map((label, i) => { const Icon = marketIcons[i]; return <li key={label}><Icon /><span>{label}</span></li>; })}
        </ul>
        <div className="products-dimensions">
          {t.dimensions.map(([title, description]) => <div key={title}><h3>{title}</h3><p className="products-body">{description}</p></div>)}
        </div>
        <p className="products-availability">{t.availability}</p>
      </div>
    </section>

    <section className="products-rule" aria-labelledby="products-whatsapp-title">
      <div className="container products-section">
        <SectionLabel number="02">{t.whatsappLabel}</SectionLabel>
        <div className="products-intro"><h2 id="products-whatsapp-title">{t.whatsappTitle}</h2><p className="products-body">{t.whatsappText}</p></div>
        <div className="products-principles">
          {t.principles.map(([title, description], i) => { const Icon = principleIcons[i]; return <article key={title}><Icon /><div><h3>{title}</h3><p className="products-body">{description}</p></div></article>; })}
        </div>
      </div>
    </section>

    <section className="container products-section products-education" aria-labelledby="products-education-title">
      <SectionLabel number="03">{t.educationLabel}</SectionLabel>
      <div className="products-intro"><div><p className="products-name">NIHILOBA Education</p><h2 id="products-education-title">{t.educationTitle}</h2></div><div>{t.education.map(p => <p className="products-body" key={p}>{p}</p>)}</div></div>
      <div className="products-education-grid">
        <ProductImage name="products-education-women-learning" alt={t.alts.education} sizes="(max-width: 700px) calc(100vw - 32px), (max-width: 940px) calc(100vw - 48px), (max-width: 1228px) 60vw, 710px" />
        <div>
          <div className="products-themes">{t.themes.map(([title, description], i) => { const Icon = themeIcons[i]; return <article key={title}><Icon /><div><h3>{title}</h3><p className="products-body">{description}</p></div></article>; })}</div>
          <ButtonLink href={localizedPath(locale, "/education")} variant="text">{t.discoverEducation}</ButtonLink>
        </div>
      </div>
    </section>

    <section className="products-rule" aria-labelledby="products-approach-title">
      <div className="container products-section">
        <SectionLabel number="04">{t.approachLabel}</SectionLabel>
        <div className="products-intro"><h2 id="products-approach-title">{t.approachTitle}</h2><div>{t.approach.map(p => <p className="products-body" key={p}>{p}</p>)}</div></div>
        <ol className="products-process">
          {t.process.map(([title, description], i) => { const Icon = processIcons[i]; return <li key={title}><div className="products-process-icon"><Icon />{i < t.process.length - 1 && <ArrowRightIcon className="products-process-arrow" />}</div><h3>{title}</h3><p className="products-body">{description}</p></li>; })}
        </ol>
      </div>
    </section>

    <section className="products-closing" aria-labelledby="products-contact-title">
      <div className="container products-section products-closing-copy">
        <div><SectionLabel>{t.closingLabel}</SectionLabel><h2 id="products-contact-title">{t.closingTitle}</h2></div>
        <div><p className="products-body">{t.closingText}</p><ButtonLink href={contact}>{t.contact}</ButtonLink></div>
      </div>
      <ProductImage name="products-closing-pont-marechal" alt={t.alts.closing} className="products-closing-image" sizes="100vw" />
    </section>
  </div>;
}
