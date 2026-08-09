import type { MetadataRoute } from "next";
import { getApartments, getHotels } from "./services/shida/public-client";

export const revalidate = 3600;

const pages = ["", "/about", "/products", "/shida", "/education", "/contact", "/privacy"];
const routes = [...["en", "fr"].flatMap((locale) => pages.map((page) => `/${locale}${page}`)).filter((route) => route !== "/en/shida"), "/shida", "/shida/appartements", "/fr/shida/appartements", "/shida/hotels", "/fr/shida/hotels", "/en/data-protection", "/fr/protection-des-donnees", "/en/security", "/fr/securite", "/en/terms", "/fr/conditions-utilisation", "/en/faq", "/fr/faq", "/en/acceptable-use", "/fr/utilisation-acceptable", "/en/trust", "/fr/confiance"];

const localizedTrustRoutes: Record<string, { en: string; fr: string }> = {
  "/shida": { en: "/shida", fr: "/fr/shida" },
  "/fr/shida": { en: "/shida", fr: "/fr/shida" },
  "/shida/appartements": { en: "/shida/appartements", fr: "/fr/shida/appartements" },
  "/fr/shida/appartements": { en: "/shida/appartements", fr: "/fr/shida/appartements" },
  "/shida/hotels": { en: "/shida/hotels", fr: "/fr/shida/hotels" },
  "/fr/shida/hotels": { en: "/shida/hotels", fr: "/fr/shida/hotels" },
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamicRoutes: string[] = [];
  try {
    const [apartments, hotels] = await Promise.all([getApartments(), getHotels()]);
    for (const listing of apartments.items) dynamicRoutes.push(`/shida/appartements/${listing.slug}`, `/fr/shida/appartements/${listing.slug}`);
    for (const hotel of hotels.items) dynamicRoutes.push(`/shida/hotels/${hotel.slug}`, `/fr/shida/hotels/${hotel.slug}`);
  } catch {
    // The static sitemap remains available when the public marketplace API is temporarily unavailable.
  }
  return [...routes, ...dynamicRoutes].map((route) => {
    const localizedSuffix = route.replace(/^\/(en|fr)/, "");
    const isShidaDetail = route.startsWith("/shida/") || route.startsWith("/fr/shida/");
    const shidaSuffix = route.replace(/^\/fr/, "");
    const pair = localizedTrustRoutes[route] ?? (isShidaDetail
      ? { en: shidaSuffix, fr: `/fr${shidaSuffix}` }
      : { en: `/en${localizedSuffix}`, fr: `/fr${localizedSuffix}` });
    return {
      url: `https://nihiloba.com${route}`,
      changeFrequency: route.includes("/shida/") ? "daily" : route.endsWith("/shida") ? "monthly" : "yearly",
      priority: route.includes("/shida/") ? 0.8 : route.endsWith("/shida") ? 0.9 : route === "/en" || route === "/fr" ? 1 : 0.7,
      alternates: {
        languages: {
          en: `https://nihiloba.com${pair.en}`,
          fr: `https://nihiloba.com${pair.fr}`,
        },
      },
    };
  });
}
