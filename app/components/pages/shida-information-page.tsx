import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { localizedPath, type Locale } from "../../lib/i18n";
import { ButtonLink } from "../button-link";
import { BookIcon, BriefcaseIcon, CarIcon, StoreIcon, ToolsIcon } from "../icons";
import "../shida/public-marketplace.css";
import "./shida-information-page.css";

type Kind = "transport" | "business";
const copy = {
  en: {
    back: "Back to SHIDA", newTab: "Opens in a new tab", dashboard: "Open SHIDA dashboard",
    transport: {
      label: "Transport", status: "Under construction", title: "Your next journey, connected.",
      intro: "A future marketplace for Wewa riders, drivers and transport companies.",
      alt: "A passenger and a SHIDA driver discussing a journey beside a car.",
      notice: "This marketplace is being built. Online booking is not available yet.",
      heading: "What we are preparing",
      cards: [
        ["Wewa", "Driver profiles, availability and ride requests. A guided journey from pickup and destination to driver acceptance and trip feedback."],
        ["Transport companies", "Planned company profiles to present transport services and travel options, helping passengers understand what is offered."],
        ["Subscriptions", "Planned subscription offers for regular journeys, with the provider’s schedule, price and conditions explained clearly."],
      ],
      note: "Company services and subscriptions are planned features. This page does not accept bookings or payments.",
    },
    business: {
      label: "Business", title: "Your business. One SHIDA space.",
      intro: "Set up your organisation and access the tools available for your activity.",
      alt: "A business owner using her laptop and phone on a terrace overlooking a lake.",
      heading: "Start with your organisation",
      cards: [
        ["Create or claim", "Connect your organisation to your SHIDA account. Create a business or claim an existing one through the guided process."],
        ["Manage your details", "Keep your organisation’s information and address up to date, and switch between the organisations you belong to."],
        ["Access your tools", "Find the modules available to your business for its activity, such as commerce, services or restaurant operations."],
      ],
      steps: ["Sign in", "Choose your organisation", "Get started"],
      note: "Features depend on your business, your access rights and enabled modules. Some tools are still in development.",
      login: "The dashboard will guide you through sign-in if needed. WhatsApp may be used to verify your account.",
    },
  },
  fr: {
    back: "Retour à SHIDA", newTab: "S’ouvre dans un nouvel onglet", dashboard: "Ouvrir le tableau de bord SHIDA",
    transport: {
      label: "Transport", status: "En construction", title: "Vos prochains trajets, connectés.",
      intro: "Une future marketplace pour les passagers, les chauffeurs Wewa et les entreprises de transport.",
      alt: "Une passagère et un chauffeur SHIDA discutent d’un trajet près d’une voiture.",
      notice: "Cette marketplace est en construction. La réservation en ligne n’est pas encore disponible.",
      heading: "Ce que nous préparons",
      cards: [
        ["Wewa", "Profils de chauffeurs, disponibilités et demandes de trajet. Un parcours guidé du lieu de départ et de la destination à l’acceptation du chauffeur et à l’avis après le trajet."],
        ["Entreprises de transport", "Des profils d’entreprise sont prévus pour présenter les services et les options de transport, afin d’aider les passagers à comprendre les offres."],
        ["Abonnements", "Des offres d’abonnement sont prévues pour les trajets réguliers, avec les horaires, les tarifs et les conditions du prestataire clairement présentés."],
      ],
      note: "Les services des entreprises et les abonnements sont des fonctionnalités prévues. Cette page n’accepte ni réservation ni paiement.",
    },
    business: {
      label: "Business", title: "Votre activité. Un espace SHIDA.",
      intro: "Créez votre organisation et accédez aux outils disponibles pour votre activité.",
      alt: "Une entrepreneuse utilise son ordinateur et son téléphone sur une terrasse avec vue sur un lac.",
      heading: "Commencez avec votre organisation",
      cards: [
        ["Créer ou revendiquer", "Reliez votre organisation à votre compte SHIDA. Créez une entreprise ou revendiquez une entreprise existante grâce au parcours guidé."],
        ["Gérer vos informations", "Actualisez les informations et l’adresse de votre organisation, et passez d’une organisation à l’autre selon vos appartenances."],
        ["Accéder à vos outils", "Retrouvez les modules disponibles pour votre activité, par exemple le commerce, les services ou la gestion d’un restaurant."],
      ],
      steps: ["Se connecter", "Choisir son organisation", "Commencer"],
      note: "Les fonctionnalités dépendent de votre entreprise, de vos droits d’accès et des modules activés. Certains outils sont encore en développement.",
      login: "Le tableau de bord vous guidera pour vous connecter si nécessaire. WhatsApp peut être utilisé pour vérifier votre compte.",
    },
  },
};

export function informationMetadata(locale: Locale, kind: Kind): Metadata {
  const t = copy[locale][kind];
  const path = `/shida/${kind}`;
  return { title: `${t.label} | SHIDA`, description: t.intro, alternates: {
    canonical: localizedPath(locale, path), languages: { en: path, fr: `/fr${path}`, "x-default": path },
  } };
}

export function ShidaInformationPage({ locale, kind }: { locale: Locale; kind: Kind }) {
  const common = copy[locale], t = common[kind], transport = kind === "transport";
  const icons = transport ? [CarIcon, BriefcaseIcon, BookIcon] : [StoreIcon, BriefcaseIcon, ToolsIcon];
  return <div className="marketplace-public shida-information"><div className="container">
    <nav className="info-breadcrumb" aria-label={locale === "fr" ? "Fil d’Ariane" : "Breadcrumb"}><Link href={localizedPath(locale, "/shida")}>SHIDA</Link><span aria-hidden="true">/</span><span aria-current="page">{t.label}</span></nav>
    <header className="mp-hero">
      <div>
        {transport && <p className="info-status">{common.transport.status}</p>}
        <h1>{t.title}</h1><p className="mp-intro">{t.intro}</p>
        {!transport && <div className="info-dashboard"><ButtonLink href="https://business.nihiloba.com" external>{common.dashboard}</ButtonLink><p>business.nihiloba.com · {common.newTab}</p><p>{common.business.login}</p></div>}
      </div>
      <div className="mp-art"><Image src={transport ? "/images/shida-transport-public.webp" : "/images/shida-business-public.webp"} alt={t.alt} fill unoptimized preload sizes="(max-width: 700px) calc(100vw - 32px), 560px" /></div>
    </header>
    {transport && <p className="info-notice"><ToolsIcon />{common.transport.notice}</p>}
    <section aria-labelledby="info-features"><h2 id="info-features">{t.heading}</h2><div className="info-cards">{t.cards.map(([title, description], i) => { const Icon = icons[i]; return <article key={title}><Icon /><h3>{title}</h3><p>{description}</p></article>; })}</div></section>
    {!transport && <ol className="info-steps">{common.business.steps.map((step, i) => <li key={step}><span>{i + 1}</span>{step}</li>)}</ol>}
    <p className="info-note">{t.note}</p>
    {transport && <div className="info-back"><ButtonLink href={localizedPath(locale, "/shida")} variant="secondary">{common.back}</ButtonLink></div>}
  </div></div>;
}
