import type { Metadata } from "next";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localizedPath(locale: Locale, path = "") {
  if (locale === "en" && path.startsWith("/shida")) return path;
  return `/${locale}${path}`;
}

const pageTitles = {
  en: { home: "Practical digital solutions with roots and purpose", about: "About", products: "Products", shida: "SHIDA", education: "Education", contact: "Contact", privacy: "Privacy Policy", terms: "Terms" },
  fr: { home: "Des solutions numériques utiles, ancrées dans une vision", about: "À propos", products: "Produits", shida: "SHIDA", education: "Éducation", contact: "Contact", privacy: "Politique de confidentialité", terms: "Conditions" },
};

const descriptions = {
  en: {
    home: "NIHILOBA develops practical digital technology rooted in real needs, beginning with the WhatsApp-based SHIDA platform.",
    about: "Discover NIHILOBA's purpose, its name and baobab-inspired identity, and founder Francis Mabala.",
    products: "Explore SHIDA, the first digital product developed by NIHILOBA.",
    shida: "SHIDA connects people to employment, services, housing and transport through WhatsApp.",
    education: "NIHILOBA Education is a planned nonprofit initiative focused on practical digital learning.",
    contact: "Contact NIHILOBA about SHIDA, collaboration and partnerships.",
    privacy: "Learn how NIHILOBA and SHIDA collect, use, store and protect personal information.",
    terms: "Preliminary terms for using the NIHILOBA website.",
  },
  fr: {
    home: "NIHILOBA développe des technologies numériques utiles, ancrées dans des besoins réels, en commençant par SHIDA sur WhatsApp.",
    about: "Découvrez la mission de NIHILOBA, l'origine de son nom, le symbole du baobab et son fondateur Francis Mabala.",
    products: "Découvrez SHIDA, le premier produit numérique développé par NIHILOBA.",
    shida: "SHIDA relie les personnes à l'emploi, aux services, au logement et au transport via WhatsApp.",
    education: "NIHILOBA Education est une initiative à but non lucratif en projet, consacrée à l'apprentissage numérique pratique.",
    contact: "Contactez NIHILOBA au sujet de SHIDA, d'une collaboration ou d'un partenariat.",
    privacy: "Découvrez comment NIHILOBA et SHIDA collectent, utilisent, conservent et protègent les données personnelles.",
    terms: "Conditions préliminaires d'utilisation du site NIHILOBA.",
  },
};

export type PageKey = keyof typeof pageTitles.en;

export function pageMetadata(locale: Locale, page: PageKey, path = ""): Metadata {
  const isShida = page === "shida";
  const englishPath = isShida ? "/shida" : `/en${path}`;
  const frenchPath = `/fr${path}`;
  const canonical = locale === "en" ? englishPath : frenchPath;
  return {
    title: pageTitles[locale][page],
    description: descriptions[locale][page],
    alternates: {
      canonical,
      languages: {
        "en": englishPath,
        "fr": frenchPath,
        "x-default": englishPath,
      },
    },
    openGraph: {
      locale: locale === "fr" ? "fr_FR" : "en_US",
      url: canonical,
      title: pageTitles[locale][page],
      description: descriptions[locale][page],
      images: [{ url: "/NIHILOBA_logo.png", width: 1536, height: 1024, alt: "NIHILOBA — Roots. Impact. Future." }],
    },
  };
}

export const nav = {
  en: { home: "Home", about: "About", products: "Products", shida: "SHIDA", education: "Education", contact: "Contact", privacy: "Privacy", dataProtection: "Data Protection", security: "Security", terms: "Terms", faq: "FAQ", acceptableUse: "Acceptable Use", trustCenter: "Trust Center", company: "Company", product: "Product", legal: "Trust Center", open: "Open on WhatsApp", tagline: "Roots. Impact. Future.", rights: "All rights reserved.", skip: "Skip to content", menuOpen: "Open navigation", menuClose: "Close navigation", primaryNav: "Primary navigation" },
  fr: { home: "Accueil", about: "À propos", products: "Produits", shida: "SHIDA", education: "Éducation", contact: "Contact", privacy: "Confidentialité", dataProtection: "Protection des données", security: "Sécurité", terms: "Conditions", faq: "FAQ", acceptableUse: "Utilisation acceptable", trustCenter: "Centre de confiance", company: "Entreprise", product: "Produit", legal: "Centre de confiance", open: "Ouvrir sur WhatsApp", tagline: "Racines. Impact. Avenir.", rights: "Tous droits réservés.", skip: "Aller au contenu", menuOpen: "Ouvrir la navigation", menuClose: "Fermer la navigation", primaryNav: "Navigation principale" },
};
