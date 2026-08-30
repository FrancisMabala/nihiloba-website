import type { MetadataRoute } from "next";
import { getApartments, getHotels, getJobs, getServices, getWenzeStores } from "./services/shida/public-client";

export const revalidate = 3600;

const pages = ["", "/about", "/products", "/shida", "/education", "/contact", "/privacy"];
const legalRoutes = [
  "/shida/terms", "/shida/terms/1.0", "/fr/shida/conditions", "/fr/shida/conditions/1.0",
  "/shida/privacy", "/shida/privacy/1.0", "/fr/shida/confidentialite", "/fr/shida/confidentialite/1.0",
  "/shida/business/terms", "/shida/business/terms/1.0", "/fr/shida/business/conditions", "/fr/shida/business/conditions/1.0",
];
const routes = [...["en", "fr"].flatMap((locale) => pages.map((page) => `/${locale}${page}`)).filter((route) => route !== "/en/shida"), "/shida", "/shida/emplois", "/fr/shida/emplois", "/shida/appartements", "/fr/shida/appartements", "/shida/hotels", "/fr/shida/hotels", "/shida/services", "/fr/shida/services", "/en/data-protection", "/fr/protection-des-donnees", "/en/security", "/fr/securite", "/en/terms", "/fr/conditions-utilisation", "/en/faq", "/fr/faq", "/en/acceptable-use", "/fr/utilisation-acceptable", "/en/trust", "/fr/confiance", ...legalRoutes];

const localizedTrustRoutes: Record<string, { en: string; fr: string }> = {
  "/shida/terms": { en: "/shida/terms", fr: "/fr/shida/conditions" },
  "/fr/shida/conditions": { en: "/shida/terms", fr: "/fr/shida/conditions" },
  "/shida/terms/1.0": { en: "/shida/terms/1.0", fr: "/fr/shida/conditions/1.0" },
  "/fr/shida/conditions/1.0": { en: "/shida/terms/1.0", fr: "/fr/shida/conditions/1.0" },
  "/shida/privacy": { en: "/shida/privacy", fr: "/fr/shida/confidentialite" },
  "/fr/shida/confidentialite": { en: "/shida/privacy", fr: "/fr/shida/confidentialite" },
  "/shida/privacy/1.0": { en: "/shida/privacy/1.0", fr: "/fr/shida/confidentialite/1.0" },
  "/fr/shida/confidentialite/1.0": { en: "/shida/privacy/1.0", fr: "/fr/shida/confidentialite/1.0" },
  "/shida/business/terms": { en: "/shida/business/terms", fr: "/fr/shida/business/conditions" },
  "/fr/shida/business/conditions": { en: "/shida/business/terms", fr: "/fr/shida/business/conditions" },
  "/shida/business/terms/1.0": { en: "/shida/business/terms/1.0", fr: "/fr/shida/business/conditions/1.0" },
  "/fr/shida/business/conditions/1.0": { en: "/shida/business/terms/1.0", fr: "/fr/shida/business/conditions/1.0" },
  "/shida": { en: "/shida", fr: "/fr/shida" },
  "/fr/shida": { en: "/shida", fr: "/fr/shida" },
  "/shida/appartements": { en: "/shida/appartements", fr: "/fr/shida/appartements" },
  "/fr/shida/appartements": { en: "/shida/appartements", fr: "/fr/shida/appartements" },
  "/shida/hotels": { en: "/shida/hotels", fr: "/fr/shida/hotels" },
  "/fr/shida/hotels": { en: "/shida/hotels", fr: "/fr/shida/hotels" },
  "/shida/services": { en: "/shida/services", fr: "/fr/shida/services" },
  "/fr/shida/services": { en: "/shida/services", fr: "/fr/shida/services" },
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
  const dynamicRoutes = new Set<string>();
  dynamicRoutes.add("/shida/wenze");
  dynamicRoutes.add("/fr/shida/wenze");
  try {
    const [firstApartments, hotels, wenze, firstServices] = await Promise.all([getApartments({ page: 1, page_size: 50 }), getHotels(), getWenzeStores({ limit: 50 }), getServices({ page: 1, page_size: 50 })]);
    const apartmentPages = [firstApartments];
    const totalPages = Math.ceil(firstApartments.total / firstApartments.page_size);
    for (let page = 2; page <= totalPages; page += 1) apartmentPages.push(await getApartments({ page, page_size: 50 }));
    for (const listing of apartmentPages.flatMap((collection) => collection.items)) {
      dynamicRoutes.add(`/shida/appartements/${listing.slug}`);
      dynamicRoutes.add(`/fr/shida/appartements/${listing.slug}`);
      if (listing.owner) {
        const owner = encodeURIComponent(listing.owner.slug || listing.owner.public_ref);
        dynamicRoutes.add(`/shida/appartements/proprietaires/${owner}`);
        dynamicRoutes.add(`/fr/shida/appartements/proprietaires/${owner}`);
      }
    }
    for (const hotel of hotels.items) {
      dynamicRoutes.add(`/shida/hotels/${hotel.slug}`);
      dynamicRoutes.add(`/fr/shida/hotels/${hotel.slug}`);
    }
    for (const store of wenze.items) {
      const key = encodeURIComponent(store.slug || store.public_ref);
      dynamicRoutes.add(`/shida/wenze/${key}`);
      dynamicRoutes.add(`/fr/shida/wenze/${key}`);
    }
    const servicePages=[firstServices];
    const servicePageCount=Math.ceil(firstServices.total/firstServices.page_size);
    for(let page=2;page<=servicePageCount;page+=1)servicePages.push(await getServices({page,page_size:50}));
    for(const service of servicePages.flatMap((collection)=>collection.items)){
      dynamicRoutes.add(`/shida/services/${service.slug}`);
      dynamicRoutes.add(`/fr/shida/services/${service.slug}`);
      dynamicRoutes.add(`/shida/services/providers/${service.provider.slug}`);
      dynamicRoutes.add(`/fr/shida/services/providers/${service.provider.slug}`);
    }
  } catch {
    // The static sitemap remains available when the public marketplace API is temporarily unavailable.
  }
  try {
    const jobPages=[await getJobs({page:1,page_size:50})];
    for(let page=2;page<=jobPages[0].pagination.total_pages;page+=1)jobPages.push(await getJobs({page,page_size:50}));
    for(const job of jobPages.flatMap((collection)=>collection.items)){
      const jobKey=encodeURIComponent(job.slug||job.public_ref),employerKey=encodeURIComponent(job.employer.slug||job.employer.public_ref);
      dynamicRoutes.add(`/shida/emplois/${jobKey}`);
      dynamicRoutes.add(`/fr/shida/emplois/${jobKey}`);
      dynamicRoutes.add(`/shida/emplois/employeurs/${employerKey}`);
      dynamicRoutes.add(`/fr/shida/emplois/employeurs/${employerKey}`);
    }
  } catch {
    // Jobs collection remains indexed even if dynamic job enumeration is unavailable.
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
