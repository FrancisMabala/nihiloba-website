import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const pages = ["", "/about", "/products", "/shida", "/education", "/contact", "/privacy"];
const routes = [...["en", "fr"].flatMap((locale) => pages.map((page) => `/${locale}${page}`)).filter((route) => route !== "/en/shida"), "/shida", "/en/data-protection", "/fr/protection-des-donnees", "/en/security", "/fr/securite", "/en/terms", "/fr/conditions-utilisation", "/en/faq", "/fr/faq", "/en/acceptable-use", "/fr/utilisation-acceptable", "/en/trust", "/fr/confiance"];

const localizedTrustRoutes: Record<string, { en: string; fr: string }> = {
  "/shida": { en: "/shida", fr: "/fr/shida" },
  "/fr/shida": { en: "/shida", fr: "/fr/shida" },
  "/en/data-protection": { en: "/en/data-protection", fr: "/fr/protection-des-donnees" },
  "/fr/protection-des-donnees": { en: "/en/data-protection", fr: "/fr/protection-des-donnees" },
  "/en/security": { en: "/en/security", fr: "/fr/securite" },
  "/fr/securite": { en: "/en/security", fr: "/fr/securite" },
  "/en/terms": { en: "/en/terms", fr: "/fr/conditions-utilisation" },
  "/fr/conditions-utilisation": { en: "/en/terms", fr: "/fr/conditions-utilisation" },
  "/en/faq": { en: "/en/faq", fr: "/fr/faq" },
  "/fr/faq": { en: "/en/faq", fr: "/fr/faq" },
  "/en/acceptable-use": { en: "/en/acceptable-use", fr: "/fr/utilisation-acceptable" },
  "/fr/utilisation-acceptable": { en: "/en/acceptable-use", fr: "/fr/utilisation-acceptable" },
  "/en/trust": { en: "/en/trust", fr: "/fr/confiance" },
  "/fr/confiance": { en: "/en/trust", fr: "/fr/confiance" },
};

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://nihiloba.com${route}`,
    changeFrequency: route.endsWith("/shida") ? "monthly" : "yearly",
    priority: route.endsWith("/shida") ? 0.9 : route === "/en" || route === "/fr" ? 1 : 0.7,
    alternates: localizedTrustRoutes[route] ? {
      languages: {
        en: `https://nihiloba.com${localizedTrustRoutes[route].en}`,
        fr: `https://nihiloba.com${localizedTrustRoutes[route].fr}`,
      },
    } : {
      languages: {
        en: `https://nihiloba.com/en${route.replace(/^\/(en|fr)/, "")}`,
        fr: `https://nihiloba.com/fr${route.replace(/^\/(en|fr)/, "")}`,
      },
    },
  }));
}
