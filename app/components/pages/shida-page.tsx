import Image from "next/image";
import Link from "next/link";
import { OFFICIAL_CHANNELS } from "../../lib/brand";
import { localizedPath, type Locale } from "../../lib/i18n";
import { shidaCopy } from "../../lib/shida-copy";
import { ButtonLink } from "../button-link";
import { ArrowRightIcon, BookIcon, BriefcaseIcon, CarIcon, CheckIcon, GlobeIcon, HomeIcon, MessageIcon, QrCodeIcon, StoreIcon, ToolsIcon } from "../icons";
import "./shida-page.css";

const stories = [
  { id: "employment", image: "/shida/shida-employment-christian.png", route: "/shida/emplois", Icon: BriefcaseIcon },
  { id: "services", image: "/shida/shida-services-braiding.png", route: "/shida/services", Icon: ToolsIcon },
  { id: "wenze", image: "/shida/shida-business-mireille.png", route: "/shida/wenze", Icon: StoreIcon },
  { id: "housing", image: "/product/products-shida-housing.png", route: "/shida/appartements", Icon: HomeIcon },
  { id: "hotels", image: "/shida/shida-hotel.png", route: "/shida/hotels", Icon: BookIcon },
  { id: "restaurants", image: "/shida/shida-restaurant-family.png", route: "/shida/restaurants", Icon: StoreIcon },
  { id: "transport", image: "/shida/shida-transport-driver.png", route: null, Icon: CarIcon },
  { id: "business", image: "/shida/shida-kivu-landscape.png", route: null, Icon: BriefcaseIcon },
] as const;
const journeyIcons = [GlobeIcon, BookIcon, MessageIcon, CheckIcon];
const connectionIcons = [GlobeIcon, MessageIcon, CheckIcon];

function StoryImage({ src, alt, className = "", hero = false }: { src: string; alt: string; className?: string; hero?: boolean }) {
  return <div className={`shida-story-image ${className}`}><Image src={src} alt={alt} fill sizes={hero ? "(max-width: 700px) 100vw, 65vw" : "(max-width: 700px) calc(100vw - 32px), (max-width: 1100px) 40vw, 460px"} loading={hero ? "eager" : "lazy"} fetchPriority={hero ? "high" : undefined} /></div>;
}

export function ShidaPage({ locale }: { locale: Locale }) {
  const t = shidaCopy[locale];
  return <div className="shida-editorial">
    <section className="shida-story-hero" aria-labelledby="shida-title">
      <div className="container shida-story-hero-grid">
        <div className="shida-story-hero-copy"><p className="shida-story-label">SHIDA</p><h1 id="shida-title">{t.title}</h1><p>{t.intro}</p><p>{t.continuation}</p><div className="shida-story-actions"><ButtonLink href="#stories">{t.start}</ButtonLink><ButtonLink href={OFFICIAL_CHANNELS.whatsapp} external variant="secondary">{t.whatsapp}</ButtonLink></div></div>
      </div>
      <StoryImage src="/shida/shida-hero.png" alt={t.heroAlt} hero className="shida-story-hero-image" />
    </section>

    <div className="container shida-stories" id="stories">
      <div className="shida-stories-intro"><p className="shida-story-label">{t.storiesLabel}</p><p>{t.scenarios}</p></div>
      <nav className="shida-story-nav" aria-label={t.explore}>{stories.map(({ id, Icon }, i) => <a href={`#${id}`} key={id}><Icon />{t.stories[i].label}</a>)}</nav>
      {stories.map(({ id, image, route }, i) => {
        const s = t.stories[i];
        return <section className={`shida-story shida-story-${id} ${i % 2 ? "shida-story-reverse" : ""}`} id={id} key={id} aria-labelledby={`${id}-title`}>
          <div className="shida-story-copy">
            <p className="shida-story-label"><span>{String(i + 1).padStart(2, "0")}</span>{s.label}</p>
            <h2 id={`${id}-title`}>{s.title}</h2>
            {s.body.map(p => <p key={p}>{p}</p>)}
            {id === "business" && <p className="shida-story-note">{t.businessNote}</p>}
            <ol className="shida-story-journey">{s.steps.map((step, index) => { const Icon = journeyIcons[index]; return <li key={step}><Icon /><span>{step}</span>{index < 3 && <ArrowRightIcon className="shida-journey-arrow" />}</li>; })}</ol>
            {route ? <Link className="shida-story-link" href={localizedPath(locale, route)}>{s.action}<ArrowRightIcon /></Link> : <a className="shida-story-link" href={OFFICIAL_CHANNELS.whatsapp} target="_blank" rel="noopener noreferrer">{s.action}<ArrowRightIcon /></a>}
          </div>
          <figure className="shida-story-visual"><StoryImage src={image} alt={s.alt} /><figcaption><p>{s.aside}</p><span>{s.person}</span><small>{s.role}</small></figcaption></figure>
        </section>;
      })}
    </div>

    <section className="shida-story-connect" aria-labelledby="shida-connect-title"><div className="container shida-connect-grid">
      <div><p className="shida-story-label">{t.connectsLabel}</p><h2 id="shida-connect-title">{t.connectsTitle}</h2><p>{t.connectsBody}</p></div>
      <ol className="shida-connection-steps">{t.connectionSteps.map((step, i) => { const Icon = connectionIcons[i]; return <li key={step}><Icon /><span>{step}</span>{i < 2 && <ArrowRightIcon className="shida-connection-arrow" />}</li>; })}</ol>
    </div></section>
    <section className="container shida-direct" aria-labelledby="shida-direct-title"><QrCodeIcon /><h2 id="shida-direct-title">{t.directTitle}</h2><p>{t.directBody}</p></section>
    <section className="shida-story-final" aria-labelledby="shida-final-title"><div className="container shida-final-copy"><div><p className="shida-story-label">{t.ready}</p><h2 id="shida-final-title">{t.finalTitle}</h2><p>{t.finalBody}</p></div><div className="shida-story-actions"><ButtonLink href={OFFICIAL_CHANNELS.whatsapp} external>{t.open}</ButtonLink><ButtonLink href="#stories" variant="secondary">{t.explore}</ButtonLink></div></div>
      <div className="shida-closing-image"><Image src="/product/products-closing-pont-marechal.png" alt={t.closingAlt} fill sizes="100vw" /></div>
    </section>
  </div>;
}
