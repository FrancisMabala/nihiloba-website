import Image from "next/image";
import Link from "next/link";
import { OFFICIAL_CHANNELS } from "../../lib/brand";
import { homeCopy } from "../../lib/home-copy";
import { localizedPath, type Locale } from "../../lib/i18n";
import { ButtonLink } from "../button-link";
import { ArrowRightIcon } from "../icons";
import "./home-page.css";

const markets = [
  ["employment", "/shida/emplois"], ["services", "/shida/services"],
  ["wenze", "/shida/wenze"], ["housing", "/shida/appartements"],
  ["hotels", "/shida/hotels"], ["restaurants", "/shida/restaurants"],
  ["transport", null],
] as const;

function HomeImage({ name, alt, className = "", eager = false, sizes = "(max-width: 700px) calc(100vw - 32px), (max-width: 940px) calc(100vw - 48px), 560px" }: {
  name: string; alt: string; className?: string; eager?: boolean; sizes?: string;
}) {
  return <div className={`home-image ${className}`}><Image src={`/home/${name}.png`} alt={alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} /></div>;
}

export function HomePage({ locale }: { locale: Locale }) {
  const t = homeCopy[locale];
  const shida = localizedPath(locale, "/shida");
  const about = localizedPath(locale, "/about");
  return <div className="home-editorial">
    <section className="home-hero" aria-labelledby="home-title">
      <div className="container home-hero-grid">
        <div><p className="home-label">NIHILOBA</p><h1 id="home-title">{t.title}</h1><p className="home-body">{t.description}</p><div className="home-actions"><ButtonLink href={shida}>{t.discover}</ButtonLink><ButtonLink href={about} variant="secondary">{t.story}</ButtonLink></div></div>
        <HomeImage name="hero-kinshasa" alt={t.alts[0]} className="home-hero-image" eager />
      </div>
    </section>

    <div className="container home-origins">
      <section className="home-approach" aria-labelledby="home-approach-title">
        <p className="home-label"><span className="home-index">01</span>{t.approachLabel}</p>
        <div className="home-approach-grid"><div><h2 id="home-approach-title">{t.approachTitle}</h2><p className="home-body">{t.approachText}</p><ButtonLink href={about} variant="text">{t.approachLink}</ButtonLink></div><HomeImage name="built-around-real-life" alt={t.alts[1]} sizes="(max-width: 700px) calc(100vw - 32px), (max-width: 940px) 38vw, 320px" /></div>
      </section>
      <section className="home-name" aria-labelledby="home-name-title"><p className="home-label">{t.nameLabel}</p><h2 id="home-name-title">{t.nameTitle}</h2><HomeImage name="baobab-tree" alt={t.alts[2]} sizes="(max-width: 700px) 220px, 280px" /><p className="home-body">{t.nameText}</p><ButtonLink href={about} variant="text">{t.learn}</ButtonLink></section>
    </div>

    <section className="home-shida" aria-labelledby="home-shida-title"><div className="container home-shida-grid">
      <div><p className="home-label">SHIDA</p><h2 id="home-shida-title">{t.shidaTitle}</h2><p className="home-body">{t.shidaText}</p><div className="home-actions"><ButtonLink href={shida}>{t.discover}</ButtonLink><ButtonLink href={OFFICIAL_CHANNELS.whatsapp} variant="secondary" external>{t.whatsapp}</ButtonLink></div><p className="home-availability">{t.availability}</p></div>
      <ul className="home-markets">{markets.map(([image, path], i) => {
        const [label, description] = t.markets[i];
        const content = <><HomeImage name={image} alt={description} sizes="(max-width: 700px) 44vw, (max-width: 940px) 29vw, 210px" /><div className="home-market-title"><h3>{label}</h3><ArrowRightIcon /></div><p>{description}</p></>;
        return <li key={image}>{path ? <Link href={localizedPath(locale, path)}>{content}</Link> : <a href={OFFICIAL_CHANNELS.whatsapp} target="_blank" rel="noopener noreferrer">{content}</a>}</li>;
      })}</ul>
    </div></section>

    <section className="container home-people" aria-labelledby="home-people-title"><HomeImage name="people-organization" alt={t.alts[3]} /><div><p className="home-label">{t.peopleLabel}</p><h2 id="home-people-title">{t.peopleTitle}</h2><div className="home-audiences"><div><h3>{t.people}</h3><p className="home-body">{t.peopleText}</p></div><div><h3>{t.organisations}</h3><p className="home-body">{t.organisationsText}</p></div></div><ButtonLink href={shida} variant="text">{t.how}</ButtonLink></div></section>

    <section className="education-strip home-education" aria-labelledby="home-education-title"><div className="container editorial-split"><div><p className="home-label">NIHILOBA EDUCATION</p><span className="planned-label">{t.planned}</span></div><div><h2 id="home-education-title">{t.educationTitle}</h2><p className="home-body">{t.educationText}</p><ButtonLink href={localizedPath(locale, "/education")} variant="text">{t.learn}</ButtonLink></div></div></section>

    <section className="container home-contact" aria-labelledby="home-contact-title"><div><p className="home-label">{t.contactLabel}</p><h2 id="home-contact-title">{t.contactTitle}</h2><p className="home-body">{t.contactText}</p><ButtonLink href={localizedPath(locale, "/contact")}>{t.contact}</ButtonLink></div><HomeImage name="contact-city" alt={t.alts[4]} /></section>
  </div>;
}
