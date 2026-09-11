import type { Locale } from "./i18n";

type HomeCopy = {
  title: string; description: string; discover: string; story: string; learn: string;
  approachLabel: string; approachTitle: string; approachText: string; approachLink: string;
  nameLabel: string; nameTitle: string; nameText: string;
  shidaTitle: string; shidaText: string; whatsapp: string; availability: string;
  peopleLabel: string; peopleTitle: string; people: string; peopleText: string;
  organisations: string; organisationsText: string; how: string;
  educationTitle: string; educationText: string; planned: string;
  contactLabel: string; contactTitle: string; contactText: string; contact: string;
  markets: readonly (readonly [string, string])[];
  alts: readonly string[];
};

export const homeCopy = {
  en: {
    title: "Creating practical digital solutions with roots and purpose.",
    description: "NIHILOBA develops practical digital products around real everyday needs. Our first platform, SHIDA, connects people, professionals and organisations to opportunities, services and tools through the web and WhatsApp.",
    discover: "Discover SHIDA", story: "Our story", learn: "Learn more",
    approachLabel: "Built around real life", approachTitle: "Technology should feel useful from the start.",
    approachText: "We start with the tools people already use, the problems they already face and the environments they already live in. The goal is not technology for its own sake, but useful systems that fit naturally into everyday life.", approachLink: "Our approach",
    nameLabel: "Our name", nameTitle: "A symbol with meaning.",
    nameText: "Nihiloba takes its name from the baobab, a tree known for its strength, resilience and ability to support life around it. It reflects our ambition to build practical solutions that create lasting value for people and communities across Africa and beyond.",
    shidaTitle: "Everyday opportunities. One connected platform.",
    shidaText: "SHIDA connects people to jobs, services, shops, housing, hotels, restaurants and transport. Professionals and organisations can also use SHIDA to manage recruitment, sales, reservations, services and day-to-day operations, where these tools are available.",
    whatsapp: "Open on WhatsApp", availability: "Available tools vary by marketplace. Further business capabilities are in development.",
    peopleLabel: "For people and organisations", peopleTitle: "Built for individuals and organisations.",
    people: "For people", peopleText: "Find work, services, products, housing, places to stay and other everyday opportunities from one connected platform.",
    organisations: "For organisations", organisationsText: "Recruit, manage services, operate shops and inventory, handle reservations and organise day-to-day activity with the tools available in your marketplace.", how: "See how SHIDA works",
    educationTitle: "Practical learning can widen opportunity.", educationText: "NIHILOBA Education is a planned initiative focused on practical learning, skills, knowledge and personal development, with a long-term focus on Africa and its diaspora.", planned: "Planned initiative",
    contactLabel: "Let’s build together", contactTitle: "Start a conversation.", contactText: "We work with partners, companies, institutions and communities to create practical digital solutions around real needs.", contact: "Contact us",
    markets: [["Employment", "Jobs and opportunities"], ["Services", "Local professionals"], ["Wenze", "Shops and products"], ["Housing", "Homes and rentals"], ["Hotels", "Places to stay"], ["Restaurants", "Food and dining"], ["Transport", "Everyday mobility"]],
    alts: ["Illustration of a woman overlooking a busy Kinshasa boulevard", "Illustration of a pedestrian among Kinshasa’s street markets", "An illustrated baobab with a broad trunk and spreading branches", "Illustration of two colleagues working together at a laptop", "Illustration of a city skyline across the water"],
  },
  fr: {
    title: "Créer des solutions numériques utiles, ancrées dans une vision.",
    description: "NIHILOBA développe des produits numériques conçus autour de besoins concrets du quotidien. Notre première plateforme, SHIDA, relie particuliers, professionnels et organisations aux opportunités, aux services et aux outils grâce au web et à WhatsApp.",
    discover: "Découvrir SHIDA", story: "Notre histoire", learn: "En savoir plus",
    approachLabel: "Pensé pour la vie réelle", approachTitle: "La technologie doit être utile dès le départ.",
    approachText: "Nous partons des outils que les personnes utilisent déjà, des problèmes qu’elles rencontrent réellement et des environnements dans lesquels elles vivent. L’objectif n’est pas la technologie pour elle-même, mais des solutions utiles qui s’intègrent naturellement au quotidien.", approachLink: "Notre approche",
    nameLabel: "Notre nom", nameTitle: "Un symbole porteur de sens.",
    nameText: "Le nom NIHILOBA s’inspire du baobab, un arbre connu pour sa force, sa résilience et sa capacité à soutenir la vie autour de lui. Il reflète notre ambition de construire des solutions utiles qui créent une valeur durable pour les personnes et les communautés en Afrique et au-delà.",
    shidaTitle: "Les opportunités du quotidien. Une plateforme connectée.",
    shidaText: "SHIDA relie les personnes aux emplois, services, commerces, logements, hôtels, restaurants et transports. Les professionnels et les organisations peuvent également utiliser SHIDA pour gérer le recrutement, les ventes, les réservations, les services et leurs activités quotidiennes, selon les outils disponibles.",
    whatsapp: "Ouvrir sur WhatsApp", availability: "Les outils disponibles varient selon le marché. D’autres fonctions de gestion sont en développement.",
    peopleLabel: "Pour les particuliers et les organisations", peopleTitle: "Pensé pour les particuliers et les organisations.",
    people: "Pour les particuliers", peopleText: "Trouvez un emploi, des services, des produits, un logement, un hébergement et d’autres opportunités du quotidien depuis une même plateforme.",
    organisations: "Pour les organisations", organisationsText: "Recrutez, gérez vos services, vos boutiques et votre stock, organisez vos réservations et simplifiez vos activités quotidiennes avec les outils disponibles sur votre marché.", how: "Voir comment SHIDA fonctionne",
    educationTitle: "L’apprentissage pratique peut ouvrir davantage d’opportunités.", educationText: "NIHILOBA Education est une initiative en préparation autour de l’apprentissage pratique, des compétences, des connaissances et du développement personnel, avec une vision à long terme pour l’Afrique et sa diaspora.", planned: "Initiative en préparation",
    contactLabel: "Construisons ensemble", contactTitle: "Commençons une conversation.", contactText: "Nous collaborons avec des partenaires, entreprises, institutions et communautés pour créer des solutions numériques pratiques autour de besoins réels.", contact: "Nous contacter",
    markets: [["Emploi", "Emplois et opportunités"], ["Services", "Professionnels locaux"], ["Wenze", "Boutiques et produits"], ["Logements", "Maisons et locations"], ["Hôtels", "Séjours et hébergements"], ["Restaurants", "Cuisine et restauration"], ["Transport", "Déplacements du quotidien"]],
    alts: ["Illustration d’une femme devant un boulevard animé de Kinshasa", "Illustration d’un piéton au milieu des marchés de Kinshasa", "Dessin d’un baobab au tronc large et aux branches étendues", "Illustration de deux collègues travaillant ensemble sur un ordinateur", "Illustration d’une ville au bord de l’eau"],
  },
} as const satisfies Record<Locale, HomeCopy>;
