export type DiscoveryLocale = "en" | "fr" | "ln" | "sw";
export const discoveryLocales: DiscoveryLocale[] = ["en", "fr", "ln", "sw"];
export const discoveryPath = (locale: DiscoveryLocale, path: string) => `${locale === "en" ? "" : `/${locale}`}${path}`;
export const discoveryMarkets = ["emplois", "services", "wenze", "appartements", "hotels", "restaurants", "transport"] as const;
export const discoveryCopy = {
  en: {
    eyebrow: "Everyday life, connected", title: "Find what you need, near you.", intro: "Jobs, services, shops and more. Discover opportunities across the DRC.",
    explore: "Explore the marketplaces", labels: ["Jobs", "Services", "Wenze", "Apartments", "Hotels", "Restaurants / Malewa", "Wewa / Transport"],
    hints: ["Find work", "Find a professional", "Shop local", "Find a home", "Book a stay", "Find a meal", "Explore the offering"],
    market: "Marketplace", query: "What are you looking for?", city: "City", anywhere: "All cities", search: "Search", searchNote: "Choose a marketplace to search its listings.",
    recent: "Explore public listings", recentNote: "A selection from Jobs and Services. Explore each marketplace for more.", all: "View all", empty: "No public listings available here yet.", error: "Listings are temporarily unavailable. You can still explore this marketplace.", loading: "Loading public listings…", retry: "Try again", from: "From", details: "View listing",
    school: "École on SHIDA", schoolBody: "Discover the education offering. Public school profiles are not available yet.", schoolAction: "Explore École",
    business: "Tools for your organisation", businessBody: "Manage listings, orders, requests and operations with the modules available to your organisation.", businessAction: "Open Business Dashboard",
    accountNote: "Schools use the same Business Dashboard. Accounts start through SHIDA on WhatsApp: Personal or Business.", join: "Create an account on WhatsApp", story: "Discover the story of SHIDA on NIHILOBA", language: "Language",
  },
  fr: {
    eyebrow: "Le quotidien, connecté", title: "Trouvez ce qu’il vous faut, près de vous.", intro: "Emplois, services, boutiques et plus encore. Découvrez les opportunités en RDC.",
    explore: "Explorez les marchés", labels: ["Emplois", "Services", "Wenze", "Appartements", "Hôtels", "Restaurants / Malewa", "Wewa / Transport"],
    hints: ["Trouver un emploi", "Trouver un professionnel", "Acheter local", "Trouver un logement", "Réserver un séjour", "Trouver un repas", "Découvrir l’offre"],
    market: "Marché", query: "Que recherchez-vous ?", city: "Ville", anywhere: "Toutes les villes", search: "Rechercher", searchNote: "Choisissez un marché pour rechercher ses annonces.",
    recent: "Découvrez les annonces publiques", recentNote: "Une sélection d’emplois et de services. Explorez chaque marché pour en voir plus.", all: "Tout voir", empty: "Aucune annonce publique disponible ici pour le moment.", error: "Les annonces sont temporairement indisponibles. Vous pouvez toujours explorer ce marché.", loading: "Chargement des annonces publiques…", retry: "Réessayer", from: "À partir de", details: "Voir l’annonce",
    school: "École sur SHIDA", schoolBody: "Découvrez l’offre éducative. Les profils publics des écoles ne sont pas encore disponibles.", schoolAction: "Explorer École",
    business: "Les outils de votre organisation", businessBody: "Gérez annonces, commandes, demandes et activités avec les modules disponibles pour votre organisation.", businessAction: "Ouvrir le tableau de bord Business",
    accountNote: "Les écoles utilisent le même tableau de bord Business. Les comptes sont créés sur WhatsApp avec SHIDA : Personnel ou Business.", join: "Créer un compte sur WhatsApp", story: "Découvrir l’histoire de SHIDA sur NIHILOBA", language: "Langue",
  },
  ln: {
    eyebrow: "Bomoi ya mokolo na mokolo, esangani", title: "Zwá oyo ozali koluka, pene na yo.", intro: "Misala, ba services, bamagazini mpe mosusu. Luká mabaku na RDC.",
    explore: "Talá bazando", labels: ["Misala", "Ba services", "Wenze", "Bandako", "Ba hôtels", "Restaurants / Malewa", "Wewa / Transport"],
    hints: ["Luká mosala", "Luká mosali ya mayele", "Sombá biloko", "Luká ndako", "Bómbá esika", "Luká bilei", "Talá makambo ezali"],
    market: "Zando", query: "Ozali koluka nini ?", city: "Engumba", anywhere: "Bingumba nyonso", search: "Luká", searchNote: "Poná zando mpo na koluka bapiblisite na yango. Misala, bandako mpe ba hôtels efungwami na Lifalanse.",
    recent: "Talá bapiblisite ya bato nyonso", recentNote: "Misala mpe ba services oyo oki komona. Fungolá zando mokomoko mpo na komona mingi.", all: "Talá nyonso", empty: "Bapiblisite ya bato nyonso ezali naino te awa.", error: "Bapiblisite ezali te mpo na sikoyo. Okoki kaka kotala zando oyo.", loading: "Kozwa bapiblisite…", retry: "Meká lisusu", from: "Kobanda na", details: "Talá piblisite",
    school: "École na SHIDA", schoolBody: "Talá makambo ya kelasi. Baprofil ya biteyelo mpo na bato nyonso ezali naino te.", schoolAction: "Talá École",
    business: "Bisaleli ya ebongiseli na yo", businessBody: "Tambwisá bapiblisite, bakomande, masengi mpe misala na bamodule oyo ebongiseli na yo ezali na yango.", businessAction: "Fungolá tableau de bord Business",
    accountNote: "Biteyelo esalelaka tableau de bord Business moko. Fungolá konti na SHIDA na WhatsApp : Personnel to Business.", join: "Fungolá konti na WhatsApp", story: "Yebá lisolo ya SHIDA na NIHILOBA", language: "Lokota",
  },
  sw: {
    eyebrow: "Maisha ya kila siku, yameunganishwa", title: "Pata unachohitaji, karibu nawe.", intro: "Kazi, huduma, maduka na zaidi. Gundua fursa kote DRC.",
    explore: "Gundua masoko", labels: ["Kazi", "Huduma", "Wenze", "Nyumba", "Hoteli", "Restaurants / Malewa", "Wewa / Usafiri"],
    hints: ["Tafuta kazi", "Tafuta mtaalamu", "Nunua karibu", "Tafuta nyumba", "Weka nafasi", "Tafuta chakula", "Gundua huduma"],
    market: "Soko", query: "Unatafuta nini?", city: "Mji", anywhere: "Miji yote", search: "Tafuta", searchNote: "Chagua soko ili kutafuta matangazo yake. Kurasa za kazi, nyumba na hoteli hufunguka kwa Kifaransa.",
    recent: "Gundua matangazo ya umma", recentNote: "Chaguo la kazi na huduma. Fungua kila soko ili kuona zaidi.", all: "Tazama yote", empty: "Hakuna matangazo ya umma hapa kwa sasa.", error: "Matangazo hayapatikani kwa muda. Bado unaweza kufungua soko hili.", loading: "Inapakia matangazo…", retry: "Jaribu tena", from: "Kuanzia", details: "Tazama tangazo",
    school: "École kwenye SHIDA", schoolBody: "Gundua huduma za elimu. Wasifu wa umma wa shule bado haupatikani.", schoolAction: "Gundua École",
    business: "Zana za shirika lako", businessBody: "Simamia matangazo, maagizo, maombi na shughuli kwa moduli zinazopatikana kwa shirika lako.", businessAction: "Fungua dashibodi ya Business",
    accountNote: "Shule hutumia dashibodi hiyo hiyo ya Business. Akaunti huanza kwenye SHIDA kupitia WhatsApp: Binafsi au Business.", join: "Fungua akaunti kwenye WhatsApp", story: "Gundua historia ya SHIDA kwenye NIHILOBA", language: "Lugha",
  },
} satisfies Record<DiscoveryLocale, Record<string, string | string[]>>;
