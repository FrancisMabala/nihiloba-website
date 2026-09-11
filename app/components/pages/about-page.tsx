import Image from "next/image";
import { aboutCopy } from "../../lib/about-copy";
import { CONTACT_EMAILS } from "../../lib/brand";
import { localizedPath, type Locale } from "../../lib/i18n";
import { ButtonLink } from "../button-link";
import { ArrowRightIcon, BookIcon, GlobeIcon, LightbulbIcon, MessageIcon, StoreIcon, ToolsIcon } from "../icons";
import "./about-page.css";

function PeopleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="9" cy="7" r="3" /><path strokeLinecap="round" d="M2 21v-3a7 7 0 0 1 14 0v3H2Zm14-17a3 3 0 0 1 0 6m3 11h3v-3a6 6 0 0 0-4-5" /></svg>;
}

function AboutImage({ name, alt, className = "", sizes, eager = false }: {
  name: string; alt: string; className?: string; sizes: string; eager?: boolean;
}) {
  return <div className={`about-image ${className}`}><Image src={`/about/${name}.png`} alt={alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} /></div>;
}

const principleIcons = [PeopleIcon, ToolsIcon, GlobeIcon];
const journeyIcons = [LightbulbIcon, BookIcon, MessageIcon, StoreIcon];
const audienceIcons = [PeopleIcon, StoreIcon, GlobeIcon];

export function AboutPage({ locale }: { locale: Locale }) {
  const t = aboutCopy[locale];
  const contact = localizedPath(locale, "/contact");

  return <div className="about-editorial">
    <section className="about-hero" aria-labelledby="about-title">
      <div className="container about-hero-inner"><div className="about-hero-copy">
        <p className="about-label">{t.label}</p><h1 id="about-title">{t.title}</h1><p className="about-body">{t.description}</p>
        <div className="about-actions"><ButtonLink href="#our-story">{t.story}</ButtonLink><ButtonLink href={contact} variant="secondary">{t.contact}</ButtonLink></div>
      </div></div>
      <AboutImage name="about-hero-kinshasa" alt={t.alts.hero} className="about-hero-image" sizes="(max-width: 700px) 100vw, 64vw" eager />
    </section>

    <section className="container about-why" id="our-story" aria-labelledby="about-why-title">
      <div><p className="about-label"><span className="about-index">01</span>{t.whyLabel}</p><h2 id="about-why-title">{t.whyTitle}</h2>{t.why.map(p => <p className="about-body" key={p}>{p}</p>)}</div>
      <div className="about-city"><AboutImage name="about-opportunity-city" alt={t.alts.city} sizes="(max-width: 700px) calc(100vw - 32px), (max-width: 1100px) 45vw, 430px" /><p className="about-aside">{t.aside}</p></div>
    </section>

    <section className="about-rule" aria-labelledby="about-approach-title"><div className="container about-approach">
      <h2 className="about-label" id="about-approach-title"><span className="about-index">02</span>{t.approachLabel}</h2>
      <div className="about-principles">{t.principles.map(([title, description], i) => { const Icon = principleIcons[i]; return <article key={title}><Icon /><div><h3>{title}</h3><p className="about-body">{description}</p></div></article>; })}</div>
    </div></section>

    <div className="container about-pair">
      <section className="about-name" aria-labelledby="about-name-title"><p className="about-label">{t.nameLabel}</p><h2 id="about-name-title">{t.nameTitle}</h2>
        <div className="about-name-grid"><div>{t.name.map(p => <p className="about-body" key={p}>{p}</p>)}</div><AboutImage name="about-baobab" alt={t.alts.tree} sizes="(max-width: 700px) 240px, (max-width: 940px) 260px, 230px" /></div>
        <p className="about-note">{t.note}</p>
      </section>
      <section className="about-shida" aria-labelledby="about-shida-title"><p className="about-label">{t.shidaLabel}</p><h2 id="about-shida-title">{t.shidaTitle}</h2><p className="about-body">{t.shida}</p>
        <ol className="about-journey">{t.journey.map(([title, description], i) => { const Icon = journeyIcons[i]; return <li key={title}><div className="about-step-icon"><Icon />{i < t.journey.length - 1 && <ArrowRightIcon className="about-step-arrow" />}</div><h3>{title}</h3><p>{description}</p></li>; })}</ol>
      </section>
    </div>

    <div className="about-rule"><div className="container about-pair about-people">
      <section aria-labelledby="about-founder-title"><p className="about-label">{t.founderLabel}</p><div className="about-founder-grid">
        <figure className="about-founder-photo"><Image src="/founder-francis-mabala.jpeg" alt={t.alts.founder} width={709} height={1536} sizes="(max-width: 700px) 180px, (max-width: 940px) 220px, 190px" /></figure>
        <div><h2 id="about-founder-title">Francis Mabala</h2><p className="about-founder-role">{t.founderRole}</p>{t.founder.map(p => <p className="about-body" key={p}>{p}</p>)}<ButtonLink href="#our-story" variant="text">{t.story}</ButtonLink><a className="about-founder-email" href={`mailto:${CONTACT_EMAILS.founder}`}>{CONTACT_EMAILS.founder}</a></div>
      </div></section>
      <section className="about-direction" aria-labelledby="about-direction-title"><p className="about-label">{t.directionLabel}</p><h2 id="about-direction-title">{t.directionTitle}</h2><div className="about-audiences">{t.audiences.map(([title, description], i) => { const Icon = audienceIcons[i]; return <article key={title}><Icon /><h3>{title}</h3><p className="about-body">{description}</p></article>; })}</div></section>
    </div></div>

    <section className="about-closing" aria-labelledby="about-contact-title"><div className="container about-closing-inner"><div className="about-closing-copy"><p className="about-label">{t.contactLabel}</p><h2 id="about-contact-title">{t.contactTitle}</h2><p className="about-body">{t.contactText}</p><ButtonLink href={contact}>{t.contact}</ButtonLink></div></div><AboutImage name="about-river-sunset" alt={t.alts.river} className="about-closing-image" sizes="(max-width: 700px) 100vw, 60vw" /></section>
  </div>;
}
