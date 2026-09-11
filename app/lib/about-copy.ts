import type { Locale } from "./i18n";

type AboutCopy = {
  label: string; title: string; description: string; story: string; contact: string;
  whyLabel: string; whyTitle: string; why: string[]; aside: string;
  approachLabel: string; principles: [string, string][];
  nameLabel: string; nameTitle: string; name: string[]; note: string;
  shidaLabel: string; shidaTitle: string; shida: string; journey: [string, string][];
  founderLabel: string; founderRole: string; founder: string[];
  directionLabel: string; directionTitle: string; audiences: [string, string][];
  contactLabel: string; contactTitle: string; contactText: string;
  alts: { hero: string; city: string; tree: string; founder: string; river: string };
};

export const aboutCopy: Record<Locale, AboutCopy> = {
  en: {
    label: "About NIHILOBA", title: "Technology with roots, purpose and direction.",
    description: "NIHILOBA builds practical digital products around everyday needs. We combine local insight, technology and long-term thinking to create solutions that expand opportunity, strengthen communities and make a real, lasting impact.",
    story: "Our story", contact: "Contact us",
    whyLabel: "Why NIHILOBA exists", whyTitle: "Opportunity grows when people have the right tools.",
    why: ["Across Africa, talent, creativity and ambition are everywhere. But too many people still face unnecessary barriers — from limited access to useful tools to systems that are not designed for their reality.", "NIHILOBA exists to reduce that friction by building practical, accessible digital solutions that help people work, learn, connect and build a better future."],
    aside: "Cities.\nPeople.\nCommunities.\nProgress together.",
    approachLabel: "Our approach",
    principles: [["Start with real people", "We design from real needs, based on how people actually live, work and solve problems."], ["Reduce friction", "We simplify the journey, remove unnecessary barriers and make digital tools easier to use and access."], ["Build for long-term usefulness", "We focus on solutions that create lasting value for individuals, businesses and communities."]],
    nameLabel: "Our name", nameTitle: "From creation to roots.",
    name: ["NIHILO draws inspiration from creatio ex nihilo, creation from nothing — the ability to turn an idea into something useful.", "BA draws on the baobab as a symbol of roots, resilience, continuity and collective strength.", "Together, NIHILOBA represents creation with roots: technology grounded in people, culture and real-life opportunities."],
    note: "This is the meaning and symbolism chosen for the NIHILOBA brand. It is not presented as a linguistic derivation.",
    shidaLabel: "From an idea to SHIDA", shidaTitle: "The first expression of that idea is SHIDA.",
    shida: "SHIDA shows what is possible when we combine everyday needs with familiar tools to create simple and structured digital journeys.",
    journey: [["Everyday needs", "Real challenges from real people."], ["Familiar tools", "Built around tools people already use."], ["Web + WhatsApp", "Accessible, simple and familiar."], ["Structured digital journeys", "From first question to real outcome."]],
    founderLabel: "Founder", founderRole: "Engineer · Founder of NIHILOBA and SHIDA",
    founder: ["Francis Mabala is an engineer and the founder of NIHILOBA and SHIDA. Born in the Democratic Republic of the Congo and based in Stockholm, he created NIHILOBA to build practical digital products around everyday realities.", "SHIDA grew from his observation that access to opportunities and essential services is often made harder by fragmented processes and digital systems that do not reflect how people already communicate.", "His work combines engineering, product development and a long-term ambition to build useful digital infrastructure for Africa."],
    directionLabel: "Where we are going", directionTitle: "Useful technology. Stronger participation. More connected communities.",
    audiences: [["People", "More opportunities for work, learning and everyday progress."], ["Businesses", "Easier ways to manage, grow and reach more customers."], ["Institutions", "Stronger tools to serve communities and increase participation."]],
    contactLabel: "Let’s build together", contactTitle: "Have an idea worth discussing?", contactText: "We welcome conversations with users, companies, institutions, communities and partners who share our belief in practical solutions for a more inclusive Africa.",
    alts: { hero: "Illustration of a person overlooking Kinshasa and the Congo River", city: "Illustrated avenue in Kinshasa, with people, traffic and palm-lined buildings", tree: "Baobab illustration with spreading branches and deep roots", founder: "Francis Mabala, founder of NIHILOBA and SHIDA", river: "Illustration of the Congo River and city skyline at sunset" },
  },
  fr: {
    label: "À propos de NIHILOBA", title: "Une technologie ancrée, utile et tournée vers l’avenir.",
    description: "NIHILOBA développe des produits numériques pratiques autour des besoins du quotidien. Nous combinons compréhension du terrain, technologie et vision à long terme pour créer des solutions qui élargissent les opportunités, renforcent les communautés et produisent un impact durable.",
    story: "Notre histoire", contact: "Nous contacter",
    whyLabel: "Pourquoi NIHILOBA existe", whyTitle: "Les opportunités grandissent lorsque chacun dispose des bons outils.",
    why: ["Partout en Afrique, les talents, la créativité et l’ambition sont présents. Pourtant, trop de personnes rencontrent encore des obstacles inutiles — manque d’accès à des outils utiles, démarches complexes ou systèmes mal adaptés à leur réalité.", "NIHILOBA existe pour réduire ces frictions en construisant des solutions numériques pratiques et accessibles qui permettent de travailler, apprendre, se connecter et avancer."],
    aside: "Villes.\nPersonnes.\nCommunautés.\nAvancer ensemble.",
    approachLabel: "Notre approche",
    principles: [["Partir des réalités humaines", "Nous concevons nos produits à partir de besoins réels, en observant comment les personnes vivent, travaillent et résolvent leurs problèmes."], ["Réduire les frictions", "Nous simplifions les démarches, supprimons les obstacles inutiles et rendons les outils numériques plus faciles à utiliser et à comprendre."], ["Construire pour durer", "Nous développons des solutions capables de créer une valeur durable pour les particuliers, les entreprises et les communautés."]],
    nameLabel: "Notre nom", nameTitle: "De la création aux racines.",
    name: ["NIHILO s’inspire de creatio ex nihilo, la création à partir de rien — la capacité de transformer une idée en quelque chose d’utile.", "BA s’appuie sur le baobab comme symbole de racines, de résilience, de continuité et de force collective.", "Ensemble, NIHILOBA représente une création ancrée : une technologie construite autour des personnes, de la culture et des réalités du quotidien."],
    note: "Il s’agit du sens et de la symbolique choisis pour la marque NIHILOBA, et non d’une dérivation linguistique.",
    shidaLabel: "De l’idée à SHIDA", shidaTitle: "La première expression de cette vision est SHIDA.",
    shida: "SHIDA montre ce qui devient possible lorsque les besoins du quotidien sont associés à des outils familiers pour créer des parcours numériques simples et structurés.",
    journey: [["Besoins du quotidien", "Des défis concrets vécus par de vraies personnes."], ["Outils familiers", "Des outils que chacun utilise déjà."], ["Web + WhatsApp", "Accessibles, simples et familiers."], ["Parcours numériques structurés", "De la première question à un résultat concret."]],
    founderLabel: "Fondateur", founderRole: "Ingénieur · Fondateur de NIHILOBA et SHIDA",
    founder: ["Francis Mabala est ingénieur et fondateur de NIHILOBA et SHIDA. Né en République démocratique du Congo et basé à Stockholm, il a créé NIHILOBA afin de développer des produits numériques pratiques, pensés autour des réalités du quotidien.", "SHIDA est né de son observation que l’accès aux opportunités et aux services essentiels est souvent compliqué par des démarches fragmentées et des systèmes numériques qui ne correspondent pas à la manière dont les personnes communiquent déjà.", "Son travail associe ingénierie, développement produit et ambition à long terme de construire une infrastructure numérique utile pour l’Afrique."],
    directionLabel: "Notre direction", directionTitle: "Une technologie utile. Une participation plus forte. Des communautés mieux connectées.",
    audiences: [["Particuliers", "Davantage d’opportunités pour travailler, apprendre et avancer au quotidien."], ["Entreprises", "Des outils plus simples pour gérer, développer et toucher davantage de clients."], ["Institutions", "Des outils plus solides pour mieux servir les communautés et favoriser la participation."]],
    contactLabel: "Construisons ensemble", contactTitle: "Une idée mérite d’être discutée ?", contactText: "Nous échangeons avec des utilisateurs, entreprises, institutions, communautés et partenaires qui partagent notre conviction qu’une technologie utile peut contribuer à une Afrique plus inclusive.",
    alts: { hero: "Illustration d’une personne contemplant Kinshasa et le fleuve Congo", city: "Avenue illustrée de Kinshasa, avec passants, circulation et immeubles bordés de palmiers", tree: "Illustration d’un baobab aux branches étendues et aux racines profondes", founder: "Francis Mabala, fondateur de NIHILOBA et de SHIDA", river: "Illustration du fleuve Congo et de la ville au coucher du soleil" },
  },
};
