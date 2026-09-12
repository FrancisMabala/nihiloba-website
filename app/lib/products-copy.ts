import type { Locale } from "./i18n";

type Theme = readonly [title: string, description: string];
type ProductsCopy = {
  label: string; title: string; description: string; discover: string; contact: string;
  shidaTitle: string; shida: string[]; discoverShida: string; whatsapp: string;
  markets: [string, string, string, string, string, string, string];
  dimensions: [Theme, Theme]; availability: string; marketplaceLabel: string;
  whatsappLabel: string; whatsappTitle: string; whatsappText: string; principles: [Theme, Theme, Theme];
  educationLabel: string; educationTitle: string; education: string[]; themes: [Theme, Theme, Theme]; discoverEducation: string;
  approachLabel: string; approachTitle: string; approach: string[]; process: [Theme, Theme, Theme, Theme];
  closingLabel: string; closingTitle: string; closingText: string;
  alts: { hero: string; vendor: string; services: string; housing: string; hotels: string; transport: string; education: string; closing: string };
};

export const productsCopy: Record<Locale, ProductsCopy> = {
  en: {
    label: "Our products",
    title: "Built around\nreal needs.\nDesigned to last.",
    description: "NIHILOBA develops practical digital products around everyday needs. Each product starts with a real problem, uses familiar tools where possible and is designed to remain accessible and useful as it grows.",
    discover: "Discover our products", contact: "Contact us",
    shidaTitle: "One platform for everyday opportunities and activity.",
    shida: [
      "SHIDA connects people to jobs, services, shops, housing, hotels, restaurants and transport.",
      "Through NIHILOBA Web and WhatsApp, people can discover opportunities, continue guided journeys and manage everyday activity without having to learn a complicated new system.",
      "Professionals and organisations can also use SHIDA to manage areas such as recruitment, shops, stock, reservations, services and operations, where these tools are available.",
    ],
    discoverShida: "Discover SHIDA", whatsapp: "Open on WhatsApp", marketplaceLabel: "SHIDA marketplaces",
    markets: ["Employment", "Services", "Wenze", "Housing", "Hotels", "Restaurants", "Transport"],
    dimensions: [
      ["Discover", "Jobs, services, products, housing, hotels, restaurants and transport."],
      ["Manage", "Recruitment, shops, stock, reservations, services and operations."],
    ],
    availability: "Available tools vary by marketplace. Further business capabilities are in development.",
    whatsappLabel: "Why SHIDA starts with WhatsApp",
    whatsappTitle: "Familiar technology.\nLess friction.",
    whatsappText: "WhatsApp is already familiar to millions of people. SHIDA builds on that familiarity to make access to opportunities and everyday services simpler, clearer and more inclusive.",
    principles: [
      ["Already familiar", "People already know how to use WhatsApp."],
      ["Guided", "Complex processes become clear, step-by-step journeys."],
      ["Connected", "Discovery happens on NIHILOBA Web and action continues through SHIDA on WhatsApp."],
    ],
    educationLabel: "Planned initiative",
    educationTitle: "Practical learning\nfor broader participation.",
    education: [
      "NIHILOBA Education is a planned nonprofit initiative focused on digital literacy, practical technology skills and accessible learning.",
      "The current priority is helping older women gain confidence with digital tools and practical technology in an accessible, community-oriented environment.",
    ],
    themes: [
      ["Digital literacy", "Foundational skills for navigating an increasingly connected world."],
      ["Practical skills", "Useful knowledge for everyday life and work."],
      ["Accessible learning", "Learning designed to meet people where they are."],
    ],
    discoverEducation: "Discover NIHILOBA Education",
    approachLabel: "Our product approach",
    approachTitle: "We do not build products\njust to fill a portfolio.",
    approach: [
      "New NIHILOBA products should begin with a clear need, a useful role and a reason to exist.",
      "We introduce new products only when their purpose, scope and long-term value are clear.",
    ],
    process: [
      ["Need", "A real problem worth solving."],
      ["Useful solution", "A practical and relevant response."],
      ["Simple experience", "Accessible and easy to use."],
      ["Long-term value", "Durable value for people and communities."],
    ],
    closingLabel: "Let’s build together", closingTitle: "A problem worth solving?",
    closingText: "We welcome conversations with users, companies, institutions and communities around practical digital needs and potential collaboration.",
    alts: {
      hero: "Illustration of a woman working on a laptop overlooking Kinshasa.",
      vendor: "Illustration of a woman using her phone at a fresh produce stall.",
      services: "Illustration of a construction professional using his phone on site.",
      housing: "Illustration of an apartment building in a leafy neighbourhood.",
      hotels: "Illustration of a hotel entrance lined with palm trees.",
      transport: "Illustration of a blue city bus on a palm-lined road.",
      education: "Illustration of three older women learning together around a laptop.",
      closing: "Illustration of Pont Maréchal spanning the river at sunset.",
    },
  },
  fr: {
    label: "Nos produits",
    title: "Conçus autour\nde vrais besoins.\nPensés pour durer.",
    description: "NIHILOBA développe des produits numériques pratiques autour des besoins du quotidien. Chaque produit part d’un problème réel, utilise des outils familiers lorsque cela est possible et est conçu pour rester accessible et utile à mesure qu’il évolue.",
    discover: "Découvrir nos produits", contact: "Nous contacter",
    shidaTitle: "Une plateforme pour les opportunités et les activités du quotidien.",
    shida: [
      "SHIDA relie les personnes aux emplois, services, boutiques, logements, hôtels, restaurants et transports.",
      "Grâce à NIHILOBA Web et WhatsApp, les utilisateurs peuvent découvrir des opportunités, poursuivre des parcours guidés et gérer leurs activités quotidiennes sans devoir apprendre un système complexe.",
      "Les professionnels et les organisations peuvent également utiliser SHIDA pour gérer le recrutement, les boutiques, le stock, les réservations, les services et leurs opérations, selon les outils disponibles.",
    ],
    discoverShida: "Découvrir SHIDA", whatsapp: "Ouvrir sur WhatsApp", marketplaceLabel: "Les marchés SHIDA",
    markets: ["Emploi", "Services", "Wenze", "Logements", "Hôtels", "Restaurants", "Transport"],
    dimensions: [
      ["Découvrir", "Emplois, services, produits, logements, hôtels, restaurants et transports."],
      ["Gérer", "Recrutement, boutiques, stock, réservations, services et opérations."],
    ],
    availability: "Les outils disponibles varient selon le marché. D’autres fonctions de gestion sont en développement.",
    whatsappLabel: "Pourquoi SHIDA commence par WhatsApp",
    whatsappTitle: "Une technologie familière.\nMoins de friction.",
    whatsappText: "WhatsApp est déjà utilisé et maîtrisé par des millions de personnes. SHIDA s’appuie sur cette habitude pour rendre l’accès aux opportunités et aux services du quotidien plus simple, plus clair et plus inclusif.",
    principles: [
      ["Déjà familier", "Les utilisateurs savent déjà comment utiliser WhatsApp."],
      ["Guidé", "Des démarches complexes deviennent des parcours clairs, étape par étape."],
      ["Connecté", "La découverte se fait sur NIHILOBA Web, puis l’action se poursuit avec SHIDA sur WhatsApp."],
    ],
    educationLabel: "Initiative planifiée",
    educationTitle: "Un apprentissage pratique\npour une participation plus large.",
    education: [
      "NIHILOBA Education est une initiative à but non lucratif en préparation, axée sur la littératie numérique, les compétences technologiques pratiques et un apprentissage accessible.",
      "La priorité actuelle est d’aider les femmes plus âgées à gagner en confiance avec les outils numériques et la technologie pratique, dans un environnement accessible et communautaire.",
    ],
    themes: [
      ["Littératie numérique", "Des bases pour évoluer dans un monde de plus en plus connecté."],
      ["Compétences pratiques", "Des connaissances utiles pour la vie quotidienne et le travail."],
      ["Apprentissage accessible", "Un apprentissage adapté à la situation et aux besoins de chacun."],
    ],
    discoverEducation: "Découvrir NIHILOBA Education",
    approachLabel: "Notre approche produit",
    approachTitle: "Nous ne développons pas des produits simplement pour remplir un portefeuille.",
    approach: [
      "Les nouveaux produits NIHILOBA doivent commencer par un besoin clair, une utilité réelle et une raison d’exister.",
      "Nous introduisons de nouveaux produits uniquement lorsque leur objectif, leur périmètre et leur valeur à long terme sont clairs.",
    ],
    process: [
      ["Besoin", "Un problème réel à résoudre."],
      ["Solution utile", "Une réponse pratique et pertinente."],
      ["Expérience simple", "Accessible et facile à utiliser."],
      ["Valeur à long terme", "Une valeur durable pour les personnes et les communautés."],
    ],
    closingLabel: "Construisons ensemble", closingTitle: "Une problématique à discuter ?",
    closingText: "Nous échangeons avec des utilisateurs, des entreprises, des institutions et des communautés autour de besoins numériques pratiques et de possibilités de collaboration.",
    alts: {
      hero: "Illustration d’une femme travaillant sur un ordinateur portable avec vue sur Kinshasa.",
      vendor: "Illustration d’une vendeuse utilisant son téléphone à son étal de fruits et légumes.",
      services: "Illustration d’un professionnel du bâtiment utilisant son téléphone sur un chantier.",
      housing: "Illustration d’un immeuble résidentiel dans un quartier verdoyant.",
      hotels: "Illustration de l’entrée d’un hôtel bordée de palmiers.",
      transport: "Illustration d’un bus urbain bleu sur une avenue bordée de palmiers.",
      education: "Illustration de trois femmes âgées apprenant ensemble autour d’un ordinateur portable.",
      closing: "Illustration du pont Maréchal traversant le fleuve au coucher du soleil.",
    },
  },
};
