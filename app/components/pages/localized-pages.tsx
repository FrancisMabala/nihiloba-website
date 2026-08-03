import type { ReactNode } from "react";
import type { Locale } from "../../lib/i18n";
import { localizedPath } from "../../lib/i18n";
import { BrandLogo } from "../brand-logo";
import { ButtonLink } from "../button-link";
import { CtaSection } from "../cta-section";
import { Hero } from "../hero";
import { BookIcon, BriefcaseIcon, CarIcon, CheckIcon, HomeIcon, LightbulbIcon, MailIcon, MessageIcon, ToolsIcon } from "../icons";
import { SectionHeading } from "../section-heading";

const copy = {
  en: {
    common: { learn: "Learn more", contact: "Contact NIHILOBA", talk: "Start a conversation", planned: "Planned initiative", available: "Available now", open: "Open SHIDA on WhatsApp" },
    home: {
      eyebrow: "Roots. Impact. Future.", title: "Creating practical digital solutions with roots and purpose.", description: "NIHILOBA develops technology that responds to real needs. Our work begins with SHIDA, a WhatsApp-based platform that connects people to opportunities, services, housing and transport.", primary: "Discover SHIDA", secondary: "Our story",
      introTitle: "Technology should feel useful from the start.", intro: "We begin with the realities of daily life: the tools people already use, the information they need and the barriers that slow them down. This approach helps us create products that are easier to reach and simpler to understand.",
      storyTitle: "A name shaped by creation and the baobab.", story: "NIHILOBA draws inspiration from creatio ex nihilo, creation from nothing, and from the symbolic power of the baobab. Together, these ideas express our belief that a grounded idea can grow into lasting, shared impact.", storyLink: "Read our story",
      productTitle: "Our first product begins on WhatsApp.", productText: "SHIDA brings employment opportunities, services, housing and transport into a familiar conversation. There is no new application to install.",
      educationTitle: "Practical learning can widen opportunity.", educationText: "NIHILOBA Education is a planned nonprofit initiative focused on digital literacy, accessible learning and useful technology skills.",
      ctaTitle: "Have a question or an idea to discuss?", ctaText: "We welcome conversations with users, communities, companies, institutions and potential partners.",
    },
    about: {
      eyebrow: "About NIHILOBA", title: "Purpose gives technology direction.", description: "NIHILOBA develops accessible digital products that respond to practical needs. We want technology to help more people participate, connect and move forward.",
      purposeTitle: "Why NIHILOBA exists", purpose: ["Access to digital tools is growing, but access to useful outcomes is still uneven. Finding work, reaching a service or learning a practical skill can remain unnecessarily difficult.", "NIHILOBA focuses on this gap. We create clear digital pathways for people, professionals and institutions. SHIDA is our first product and the beginning of that work."],
      storyTitle: "The story behind the name", story: ["NIHILOBA is inspired by creatio ex nihilo, meaning creation out of nothing, and rooted in the symbolic power of the baobab, represented by ‘BA’.", "In many Bantu cultures, the baobab is more than a tree. It represents protection, wisdom, resilience, continuity and spiritual connection. It is a place where communities gather, exchange knowledge, share stories and grow stronger together.", "NIHILOBA carries this meaning forward as a symbol of support, belonging, collective strength and the ability to create lasting impact from an idea."],
      inspirationNote: "This is the meaning and symbolism chosen for the NIHILOBA brand. It is not presented as a linguistic derivation.",
      founderTitle: "Francis Mabala", founderRole: "Founder of NIHILOBA and SHIDA", founder: "Francis founded NIHILOBA to create practical technology that responds to everyday realities. His work on SHIDA reflects a long-term commitment to access, inclusion and useful digital transformation.",
    },
    products: { eyebrow: "Our products", title: "Start with a real need. Keep the experience simple.", description: "NIHILOBA develops products that help people reach useful information and services through accessible technology.", shida: "SHIDA is the first digital product developed by NIHILOBA. It connects people to employment, services, housing and transport through WhatsApp.", futureTitle: "What comes next", future: "We will develop new products carefully and share them when their purpose, scope and value are clear. For now, our focus is SHIDA." },
    shida: {
      eyebrow: "A product by NIHILOBA", title: "Everyday opportunities, available through WhatsApp.", description: "SHIDA connects people to employment, services, housing and transport in a familiar WhatsApp conversation. Users do not need to install a new application.",
      first: "SHIDA is the first digital product developed by NIHILOBA.", marketsTitle: "What you can explore today", marketsDesc: "SHIDA currently covers four practical areas.", employment: "Employment", employmentText: "Find and explore relevant employment opportunities.", services: "Services", servicesText: "Connect with professionals and everyday services.", housing: "Housing", housingText: "Access housing information through a direct channel.", transport: "Transport", transportText: "Explore useful transport options and information.",
      bookingTitle: "Appointments and bookings", booking: "Appointment and booking management is one of SHIDA’s capabilities. It supports professionals and organisations within a broader platform that also covers opportunities, services, housing and transport.", audienceTitle: "Who SHIDA can support", audience: "Individuals can use SHIDA to find what they need. Professionals, businesses, schools, churches, clinics and other institutions can use it to make their services easier to reach.",
      plannedTitle: "Planned developments", plannedDesc: "These ideas are part of SHIDA’s roadmap and are not currently available.", qr: "QR-based appointment confirmation", qrText: "A planned way to simplify arrival and confirmation for appointments.", pickup: "Pickup reminders", pickupText: "Planned reminders to help users keep track of scheduled pickups.", plannedNote: "Availability and timing may change as these features are developed.",
      ctaTitle: "Send a message to begin.", ctaText: "Open SHIDA on WhatsApp at +46 76 970 90 59. The message “Bonjour” is ready for you.",
    },
    education: { eyebrow: "Planned nonprofit initiative", title: "Practical digital learning, made more accessible.", description: "NIHILOBA Education is a planned nonprofit initiative. It will focus on digital literacy, practical technology education and accessible learning.", visionTitle: "Learning connected to daily life", vision: ["The initiative aims to help learners use digital tools with greater confidence. Content will connect technology with study, work and practical problem-solving.", "NIHILOBA Education remains in the planning stage. There are no active programmes at this time. Confirmed details will be shared as the initiative develops."], focusTitle: "Areas of focus", literacy: "Digital literacy", literacyText: "Confidence with the tools that shape daily participation.", practical: "Practical technology", practicalText: "Learning linked to real tasks and useful outcomes.", access: "Accessible learning", accessText: "Formats that consider different contexts and starting points." },
    contact: { eyebrow: "Contact", title: "Let’s talk about what could be useful.", description: "Contact NIHILOBA to ask about SHIDA, share a relevant need or discuss a possible collaboration.", emailTitle: "Email NIHILOBA", emailText: "For product questions, general enquiries, partnerships and institutional conversations.", emailNote: "A professional @nihiloba.com email address will be introduced soon.", send: "Send an email", social: "Social channels", coming: "Coming soon" },
    privacy: { eyebrow: "Legal", title: "Privacy notice", description: "A preliminary overview of how this website handles information.", status: "This document is preliminary and will be updated before wider public launch.", sections: [["About this notice", "This notice describes the limited information practices of the NIHILOBA website. A complete privacy notice will be published as the website and services develop."], ["Information you send", "The website has no contact form or user accounts. If you contact NIHILOBA by email or WhatsApp, you choose what to provide. The relevant service provider may process that communication under its own terms."], ["Website operation", "A hosting provider may process standard technical information, such as request logs, to deliver the website securely and reliably. Specific hosting and analytics practices will be documented when confirmed."], ["Cookies and analytics", "This version does not intentionally configure analytics or advertising cookies. If that changes, this notice and any required consent controls will be updated."], ["Questions", "Privacy questions can be sent to shida.nihiloba@gmail.com."]] },
    terms: { eyebrow: "Legal", title: "Website terms", description: "Preliminary terms for the NIHILOBA website and its public information.", status: "This document is preliminary and will be updated before wider public launch.", sections: [["Purpose", "This website provides general information about NIHILOBA, SHIDA and the planned NIHILOBA Education initiative."], ["Informational content", "We aim to keep information clear and current, but content may change as products and initiatives develop. This website does not provide professional, legal or financial advice."], ["Current and planned features", "Features labelled as planned are not currently available. References to future products, programmes or capabilities do not guarantee timing or delivery."], ["Acceptable use", "You may use this website for lawful informational purposes. You must not disrupt the site, misuse its content or interfere with other visitors."], ["External links", "Third-party services, including WhatsApp and email providers, apply their own terms when you use them."], ["Contact", "Questions about these preliminary terms can be sent to shida.nihiloba@gmail.com."]] },
  },
  fr: {
    common: { learn: "En savoir plus", contact: "Contacter NIHILOBA", talk: "Démarrer une conversation", planned: "Initiative en projet", available: "Disponible maintenant", open: "Ouvrir SHIDA sur WhatsApp" },
    home: {
      eyebrow: "Racines. Impact. Avenir.", title: "Créer des solutions numériques utiles, ancrées dans une vision.", description: "NIHILOBA développe des technologies qui répondent à des besoins réels. Notre parcours commence avec SHIDA, une plateforme accessible sur WhatsApp qui relie les personnes aux opportunités, aux services, au logement et au transport.", primary: "Découvrir SHIDA", secondary: "Notre histoire",
      introTitle: "La technologie doit être utile dès le départ.", intro: "Nous partons des réalités du quotidien : les outils que les personnes utilisent déjà, les informations dont elles ont besoin et les obstacles qui les ralentissent. Cette approche nous aide à créer des produits plus accessibles et plus simples à comprendre.",
      storyTitle: "Un nom inspiré par la création et le baobab.", story: "NIHILOBA s’inspire de creatio ex nihilo, créer à partir de rien, et de la force symbolique du baobab. Ces deux idées expriment notre conviction : une idée bien ancrée peut produire un impact durable et partagé.", storyLink: "Découvrir notre histoire",
      productTitle: "Notre premier produit commence sur WhatsApp.", productText: "SHIDA rassemble les opportunités d’emploi, les services, le logement et le transport dans une conversation familière. Aucune nouvelle application n’est nécessaire.",
      educationTitle: "L’apprentissage pratique peut élargir les possibilités.", educationText: "NIHILOBA Education est une initiative à but non lucratif en projet, consacrée à la culture numérique, à l’apprentissage accessible et aux compétences technologiques utiles.",
      ctaTitle: "Une question ou une idée à partager ?", ctaText: "Nous échangeons volontiers avec les utilisateurs, les communautés, les entreprises, les institutions et les partenaires potentiels.",
    },
    about: {
      eyebrow: "À propos de NIHILOBA", title: "La vision donne une direction à la technologie.", description: "NIHILOBA développe des produits numériques accessibles qui répondent à des besoins concrets. Nous voulons aider davantage de personnes à participer, à se connecter et à avancer.",
      purposeTitle: "Pourquoi NIHILOBA existe", purpose: ["L’accès aux outils numériques progresse, mais leurs bénéfices restent inégalement répartis. Trouver un emploi, accéder à un service ou acquérir une compétence pratique peut encore être inutilement compliqué.", "NIHILOBA agit sur cet écart. Nous créons des parcours numériques clairs pour les personnes, les professionnels et les institutions. SHIDA est notre premier produit et le point de départ de ce travail."],
      storyTitle: "L’histoire derrière le nom", story: ["NIHILOBA s’inspire de l’expression latine creatio ex nihilo, qui signifie créer à partir de rien, et de la force symbolique du baobab, représentée par « BA ».", "Dans de nombreuses cultures bantoues, le baobab est bien plus qu’un arbre. Il symbolise la protection, la sagesse, la résilience, la continuité et le lien spirituel. C’est un lieu où les communautés se rassemblent, transmettent leurs connaissances, partagent leurs histoires et deviennent plus fortes ensemble.", "NIHILOBA prolonge cette symbolique en représentant le soutien, l’appartenance, la force collective et la capacité de transformer une idée en impact durable."],
      inspirationNote: "Il s’agit du sens et de la symbolique choisis pour la marque NIHILOBA. Nous ne les présentons pas comme une dérivation linguistique.",
      founderTitle: "Francis Mabala", founderRole: "Fondateur de NIHILOBA et de SHIDA", founder: "Francis a fondé NIHILOBA pour créer des technologies pratiques qui répondent aux réalités quotidiennes. Son travail sur SHIDA traduit un engagement de long terme en faveur de l’accès, de l’inclusion et d’une transformation numérique utile.",
    },
    products: { eyebrow: "Nos produits", title: "Partir d’un besoin réel. Garder une expérience simple.", description: "NIHILOBA développe des produits qui facilitent l’accès à des informations et à des services utiles grâce à des technologies accessibles.", shida: "SHIDA est le premier produit numérique développé par NIHILOBA. Il relie les personnes à l’emploi, aux services, au logement et au transport via WhatsApp.", futureTitle: "La suite", future: "Nous développerons de nouveaux produits avec soin et les présenterons lorsque leur objectif, leur portée et leur valeur seront clairs. Pour le moment, nous nous concentrons sur SHIDA." },
    shida: {
      eyebrow: "Un produit NIHILOBA", title: "Les opportunités du quotidien, accessibles sur WhatsApp.", description: "SHIDA relie les personnes à l’emploi, aux services, au logement et au transport dans une conversation WhatsApp familière. Aucune nouvelle application n’est nécessaire.",
      first: "SHIDA est le premier produit numérique développé par NIHILOBA.", marketsTitle: "Ce que vous pouvez explorer aujourd’hui", marketsDesc: "SHIDA couvre actuellement quatre domaines pratiques.", employment: "Emploi", employmentText: "Trouvez et explorez des opportunités d’emploi pertinentes.", services: "Services", servicesText: "Entrez en contact avec des professionnels et des services du quotidien.", housing: "Logement", housingText: "Accédez à des informations sur le logement par un canal direct.", transport: "Transport", transportText: "Explorez des options et des informations utiles sur le transport.",
      bookingTitle: "Rendez-vous et réservations", booking: "La gestion des rendez-vous et des réservations est l’une des fonctions de SHIDA. Elle accompagne les professionnels et les organisations au sein d’une plateforme plus large, qui couvre aussi les opportunités, les services, le logement et le transport.", audienceTitle: "À qui SHIDA peut servir", audience: "Les particuliers peuvent utiliser SHIDA pour trouver ce dont ils ont besoin. Les professionnels, les entreprises, les écoles, les églises, les cliniques et d’autres institutions peuvent faciliter l’accès à leurs services.",
      plannedTitle: "Développements prévus", plannedDesc: "Ces idées font partie de la feuille de route de SHIDA et ne sont pas encore disponibles.", qr: "Confirmation de rendez-vous par QR code", qrText: "Un moyen prévu pour simplifier l’arrivée et la confirmation des rendez-vous.", pickup: "Rappels de retrait", pickupText: "Des rappels prévus pour aider les utilisateurs à suivre les retraits programmés.", plannedNote: "La disponibilité et le calendrier peuvent évoluer pendant le développement.",
      ctaTitle: "Envoyez un message pour commencer.", ctaText: "Ouvrez SHIDA sur WhatsApp au +46 76 970 90 59. Le message « Bonjour » est déjà préparé.",
    },
    education: { eyebrow: "Initiative à but non lucratif en projet", title: "Un apprentissage numérique pratique et plus accessible.", description: "NIHILOBA Education est une initiative à but non lucratif en projet. Elle sera consacrée à la culture numérique, à la formation technologique pratique et à l’apprentissage accessible.", visionTitle: "Un apprentissage lié à la vie quotidienne", vision: ["L’initiative vise à aider les apprenants à utiliser les outils numériques avec plus d’assurance. Les contenus relieront la technologie aux études, au travail et à la résolution de problèmes concrets.", "NIHILOBA Education est encore au stade de la planification. Aucun programme n’est actif actuellement. Les informations confirmées seront publiées au fil du développement de l’initiative."], focusTitle: "Domaines d’action", literacy: "Culture numérique", literacyText: "Mieux maîtriser les outils qui façonnent la participation quotidienne.", practical: "Technologie pratique", practicalText: "Relier l’apprentissage à des tâches réelles et à des résultats utiles.", access: "Apprentissage accessible", accessText: "Des formats adaptés à différents contextes et points de départ." },
    contact: { eyebrow: "Contact", title: "Parlons de ce qui pourrait être utile.", description: "Contactez NIHILOBA pour poser une question sur SHIDA, partager un besoin pertinent ou envisager une collaboration.", emailTitle: "Écrire à NIHILOBA", emailText: "Pour les questions sur nos produits, les demandes générales, les partenariats et les échanges institutionnels.", emailNote: "Une adresse professionnelle en @nihiloba.com sera bientôt mise en place.", send: "Envoyer un e-mail", social: "Réseaux sociaux", coming: "Bientôt" },
    privacy: { eyebrow: "Mentions légales", title: "Avis de confidentialité", description: "Un aperçu préliminaire de la manière dont ce site traite les informations.", status: "Ce document est préliminaire et sera mis à jour avant un lancement public plus large.", sections: [["À propos de cet avis", "Cet avis décrit les pratiques limitées du site NIHILOBA concernant les informations. Un avis complet sera publié à mesure que le site et les services évolueront."], ["Informations que vous envoyez", "Le site ne contient ni formulaire de contact ni compte utilisateur. Si vous contactez NIHILOBA par e-mail ou WhatsApp, vous choisissez les informations transmises. Le fournisseur concerné peut traiter cet échange selon ses propres conditions."], ["Fonctionnement du site", "Un hébergeur peut traiter des informations techniques standard, comme les journaux de requêtes, afin de fournir le site de manière sûre et fiable. Les pratiques précises seront documentées lorsqu’elles seront confirmées."], ["Cookies et analyse", "Cette version ne configure volontairement aucun cookie publicitaire ou d’analyse. Si cela change, cet avis et les contrôles de consentement requis seront mis à jour."], ["Questions", "Les questions sur la confidentialité peuvent être envoyées à shida.nihiloba@gmail.com."]] },
    terms: { eyebrow: "Mentions légales", title: "Conditions d’utilisation", description: "Conditions préliminaires du site NIHILOBA et de ses informations publiques.", status: "Ce document est préliminaire et sera mis à jour avant un lancement public plus large.", sections: [["Objet", "Ce site présente des informations générales sur NIHILOBA, SHIDA et le projet NIHILOBA Education."], ["Contenu informatif", "Nous veillons à fournir des informations claires et actuelles, mais elles peuvent évoluer avec nos produits et initiatives. Ce site ne fournit aucun conseil professionnel, juridique ou financier."], ["Fonctions actuelles et prévues", "Les fonctions signalées comme prévues ne sont pas encore disponibles. Les références à de futurs produits, programmes ou fonctions ne garantissent ni leur date ni leur réalisation."], ["Utilisation acceptable", "Vous pouvez consulter ce site à des fins d’information licites. Vous ne devez pas perturber son fonctionnement, détourner son contenu ou gêner les autres visiteurs."], ["Liens externes", "Les services tiers, notamment WhatsApp et les fournisseurs de messagerie, appliquent leurs propres conditions lorsque vous les utilisez."], ["Contact", "Les questions sur ces conditions préliminaires peuvent être envoyées à shida.nihiloba@gmail.com."]] },
  },
} as const;

function Story({ locale, full = false }: { locale: Locale; full?: boolean }) {
  const t = copy[locale];
  const paragraphs = full ? t.about.story : [t.home.story];
  return (
    <section className="section story-section">
      <div className="container story-grid">
        <div className="story-symbol"><BrandLogo /></div>
        <div className="story-copy">
          <p className="eyebrow">{locale === "en" ? "Our name" : "Notre nom"}</p>
          <h2>{full ? t.about.storyTitle : t.home.storyTitle}</h2>
          {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {full && <p className="inspiration-note">{t.about.inspirationNote}</p>}
          {!full && <ButtonLink href={localizedPath(locale,"/about")} variant="text">{t.home.storyLink}</ButtonLink>}
        </div>
        {full && <div className="name-breakdown"><div><strong>NIHILO</strong><span>{locale === "en" ? "Creation from nothing" : "Créer à partir de rien"}</span></div><div><strong>BA</strong><span>{locale === "en" ? "Baobab, roots, wisdom and collective strength" : "Baobab, racines, sagesse et force collective"}</span></div></div>}
      </div>
    </section>
  );
}

function ShidaPanel({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return <article className="shida-panel"><div className="shida-logo-wrap"><BrandLogo brand="shida" /></div><div className="shida-panel-copy"><span className="availability"><span />{t.common.available}</span><p>{t.products.shida}</p><ButtonLink href={localizedPath(locale,"/shida")} variant="text">{t.home.primary}</ButtonLink></div></article>;
}

export function HomePage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return <>
    <Hero eyebrow={t.home.eyebrow} title={t.home.title} description={t.home.description} primary={{href:localizedPath(locale,"/shida"),label:t.home.primary}} secondary={{href:localizedPath(locale,"/about"),label:t.home.secondary}} visual={<div className="hero-brand"><BrandLogo eager /><p>{locale === "en" ? "A technology company with a long view." : "Une entreprise technologique tournée vers l’avenir."}</p></div>} />
    <section className="section"><div className="container editorial-split"><span className="section-index">01</span><div><SectionHeading title={t.home.introTitle} /><p className="lead-copy">{t.home.intro}</p></div></div></section>
    <Story locale={locale} />
    <section className="section"><div className="container product-feature"><div><p className="eyebrow">SHIDA</p><h2>{t.home.productTitle}</h2><p>{t.home.productText}</p></div><ShidaPanel locale={locale} /></div></section>
    <section className="section education-strip"><div className="container editorial-split"><span className="planned-label">{t.common.planned}</span><div><h2>{t.home.educationTitle}</h2><p>{t.home.educationText}</p><ButtonLink href={localizedPath(locale,"/education")} variant="text">{t.common.learn}</ButtonLink></div></div></section>
    <CtaSection eyebrow={t.common.talk} title={t.home.ctaTitle} description={t.home.ctaText} href={localizedPath(locale,"/contact")} label={t.common.contact} />
  </>;
}

export function AboutPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return <><Hero compact eyebrow={t.about.eyebrow} title={t.about.title} description={t.about.description} />
    <section className="section"><div className="container editorial-split"><span className="section-index">01</span><div><SectionHeading title={t.about.purposeTitle} />{t.about.purpose.map(p=><p className="lead-copy" key={p}>{p}</p>)}</div></div></section>
    <Story locale={locale} full />
    <section className="section founder-section"><div className="container founder-row"><div className="founder-initials">FM</div><div><p className="eyebrow">{locale === "en" ? "Founder" : "Fondateur"}</p><h2>{t.about.founderTitle}</h2><p className="founder-role">{t.about.founderRole}</p><p>{t.about.founder}</p></div></div></section>
    <CtaSection eyebrow={t.common.talk} href={localizedPath(locale,"/contact")} label={t.common.contact} title={t.home.ctaTitle} description={t.home.ctaText} />
  </>;
}

export function ProductsPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return <><Hero compact eyebrow={t.products.eyebrow} title={t.products.title} description={t.products.description} />
    <section className="section"><div className="container"><ShidaPanel locale={locale}/><div className="future-note"><span className="section-index">02</span><div><h2>{t.products.futureTitle}</h2><p>{t.products.future}</p></div></div></div></section>
    <CtaSection eyebrow={t.common.talk} href={localizedPath(locale,"/contact")} label={t.common.contact} title={t.home.ctaTitle} description={t.home.ctaText}/>
  </>;
}

const marketIcons: ReactNode[] = [<BriefcaseIcon key="a"/>,<ToolsIcon key="b"/>,<HomeIcon key="c"/>,<CarIcon key="d"/>];
export function ShidaPage({ locale }: { locale: Locale }) {
  const t=copy[locale]; const s=t.shida;
  const markets=[[s.employment,s.employmentText],[s.services,s.servicesText],[s.housing,s.housingText],[s.transport,s.transportText]];
  return <><section className="shida-hero"><div className="container shida-hero-grid"><div><p className="eyebrow">{s.eyebrow}</p><h1>{s.title}</h1><p>{s.description}</p><ButtonLink href="https://wa.me/46769709059?text=Bonjour" external>{t.common.open}</ButtonLink></div><div className="shida-hero-logo"><BrandLogo brand="shida" eager/><p>{s.first}</p></div></div></section>
    <section className="section"><div className="container"><SectionHeading eyebrow={locale==="en"?"Current marketplaces":"Marchés actuels"} title={s.marketsTitle} description={s.marketsDesc}/><div className="plain-features">{markets.map((m,i)=><article key={m[0]}><div className="feature-icon">{marketIcons[i]}</div><h3>{m[0]}</h3><p>{m[1]}</p></article>)}</div></div></section>
    <section className="section muted-section"><div className="container editorial-split"><MessageIcon className="large-line-icon"/><div><h2>{s.bookingTitle}</h2><p className="lead-copy">{s.booking}</p></div></div></section>
    <section className="section"><div className="container editorial-split"><span className="section-index">03</span><div><h2>{s.audienceTitle}</h2><p className="lead-copy">{s.audience}</p></div></div></section>
    <section className="section planned-section"><div className="container"><SectionHeading eyebrow={locale==="en"?"Roadmap":"Feuille de route"} title={s.plannedTitle} description={s.plannedDesc}/><div className="planned-rows"><div><strong>{s.qr}</strong><p>{s.qrText}</p></div><div><strong>{s.pickup}</strong><p>{s.pickupText}</p></div></div><p className="inspiration-note">{s.plannedNote}</p></div></section>
    <CtaSection eyebrow="WhatsApp" title={s.ctaTitle} description={s.ctaText} href="https://wa.me/46769709059?text=Bonjour" label={t.common.open}/>
  </>;
}

export function EducationPage({ locale }: { locale: Locale }) {
  const t=copy[locale], e=t.education; const areas=[[<BookIcon key="a"/>,e.literacy,e.literacyText],[<LightbulbIcon key="b"/>,e.practical,e.practicalText],[<CheckIcon key="c"/>,e.access,e.accessText]] as const;
  return <><Hero compact eyebrow={e.eyebrow} title={e.title} description={e.description}/><section className="section"><div className="container editorial-split"><span className="planned-label">{t.common.planned}</span><div><h2>{e.visionTitle}</h2>{e.vision.map(p=><p className="lead-copy" key={p}>{p}</p>)}</div></div></section><section className="section muted-section"><div className="container"><SectionHeading title={e.focusTitle}/><div className="plain-features three">{areas.map(([icon,title,text])=><article key={title}><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section><CtaSection eyebrow={t.common.talk} href={localizedPath(locale,"/contact")} label={t.common.contact} title={t.home.ctaTitle} description={t.home.ctaText}/></>;
}

export function ContactPage({ locale }: { locale: Locale }) {
  const t=copy[locale], c=t.contact;
  return <><Hero compact eyebrow={c.eyebrow} title={c.title} description={c.description}/><section className="section"><div className="container contact-layout"><div className="email-block"><MailIcon/><h2>{c.emailTitle}</h2><p>{c.emailText}</p><a href="mailto:shida.nihiloba@gmail.com">shida.nihiloba@gmail.com</a><ButtonLink href="mailto:shida.nihiloba@gmail.com">{c.send}</ButtonLink><small>{c.emailNote}</small></div><div className="social-block"><h2>{c.social}</h2>{["LinkedIn","Instagram","TikTok","Facebook"].map(x=><div key={x}><span>{x}</span><small>{c.coming}</small></div>)}</div></div></section></>;
}

export function LegalPage({ locale, type }: { locale: Locale; type: "privacy"|"terms" }) {
  const l=copy[locale][type];
  return <><Hero compact eyebrow={l.eyebrow} title={l.title} description={l.description}/><section className="section"><div className="container legal-layout"><aside><span>{locale==="en"?"Status":"Statut"}</span><p>{l.status}</p></aside><div className="legal-content">{l.sections.map(([title,text],i)=><section key={title}><h2>{i+1}. {title}</h2><p>{text}</p></section>)}</div></div></section></>;
}
