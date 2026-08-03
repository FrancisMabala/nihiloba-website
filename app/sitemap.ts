import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const pages = ["", "/about", "/products", "/shida", "/education", "/contact", "/privacy", "/terms"];
const routes = ["", ...["en", "fr"].flatMap((locale) => pages.map((page) => `/${locale}${page}`))];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://nihiloba.com${route}`,
    changeFrequency: route.endsWith("/shida") || route === "" ? "monthly" : "yearly",
    priority: route === "" ? 0.8 : route.endsWith("/shida") ? 0.9 : route === "/en" || route === "/fr" ? 1 : 0.7,
    alternates: route === "" ? undefined : {
      languages: {
        en: `https://nihiloba.com/en${route.replace(/^\/(en|fr)/, "")}`,
        fr: `https://nihiloba.com/fr${route.replace(/^\/(en|fr)/, "")}`,
      },
    },
  }));
}
