import { discoveryLocales, discoveryMarkets, discoveryPath, type DiscoveryLocale } from "./discovery-copy";

/** Only existing searchable collections are destinations. Never accept a return URL. */
export function discoverySearchDestination(params: URLSearchParams) {
  const requested = params.get("locale") as DiscoveryLocale;
  const locale = discoveryLocales.includes(requested) ? requested : "en";
  const market = discoveryMarkets.slice(0, 6).find(value => value === params.get("market")) ?? "emplois";
  const query = new URLSearchParams();
  for (const key of ["query", "city"]) {
    const value = params.get(key)?.trim().slice(0, 120);
    if (value) query.set(key, value);
  }
  const targetLocale = ["emplois", "appartements", "hotels"].includes(market) && (locale === "ln" || locale === "sw") ? "fr" : locale;
  return discoveryPath(targetLocale, `/shida/${market}`) + (query.size ? `?${query}` : "");
}
