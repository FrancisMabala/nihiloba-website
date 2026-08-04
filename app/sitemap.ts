import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const pages = ["", "/about", "/products", "/shida", "/education", "/contact", "/privacy", "/terms"];
const routes = ["", ...["en", "fr"].flatMap((locale) => pages.map((page) => `/${locale}${page}`)), "/en/data-protection", "/fr/protection-des-donnees", "/en/security", "/fr/securite"];

const localizedTrustRoutes: Record<string, { en: string; fr: string }> = {
  "/en/data-protection": { en: "/en/data-protection", fr: "/fr/protection-des-donnees" },
  "/fr/protection-des-donnees": { en: "/en/data-protection", fr: "/fr/protection-des-donnees" },
  "/en/security": { en: "/en/security", fr: "/fr/securite" },
  "/fr/securite": { en: "/en/security", fr: "/fr/securite" },
};

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://nihiloba.com${route}`,
    changeFrequency: route.endsWith("/shida") || route === "" ? "monthly" : "yearly",
    priority: route === "" ? 0.8 : route.endsWith("/shida") ? 0.9 : route === "/en" || route === "/fr" ? 1 : 0.7,
    alternates: route === "" ? undefined : localizedTrustRoutes[route] ? {
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
